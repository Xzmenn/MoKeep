import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";
import { applyTransactionBalance, BalanceError } from "@/lib/balance";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // INCOME, EXPENSE, TRANSFER
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId: user.id,
    };

    if (type) where.type = type;
    if (accountId) {
      where.OR = [{ accountId: accountId }, { toAccountId: accountId }];
    }
    if (categoryId) where.categoryId = categoryId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.date.lte = eDate;
      }
    }

    if (search && search.trim()) {
      where.note = {
        contains: search.trim(),
      };
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          account: true,
          toAccount: true,
          category: true,
          subCategory: true,
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      success: true,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json({ error: "Gagal mengambil data transaksi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = transactionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data transaksi tidak valid" },
        { status: 400 }
      );
    }

    const {
      type,
      amount,
      date,
      accountId,
      toAccountId,
      categoryId,
      subCategoryId,
      note,
      attachmentUrl,
      tags,
    } = validated.data;

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    if (type === "TRANSFER") {
      if (!toAccountId) {
        return NextResponse.json({ error: "Akun tujuan transfer wajib dipilih" }, { status: 400 });
      }
      const toAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId: user.id },
      });
      if (!toAccount) {
        return NextResponse.json({ error: "Akun tujuan tidak ditemukan" }, { status: 404 });
      }
    }

    // Atomic transaction execution
    const newTx = await prisma.$transaction(async (txPrisma) => {
      // 1. Create transaction record
      const created = await txPrisma.transaction.create({
        data: {
          userId: user.id,
          type,
          amount,
          date: new Date(date),
          accountId,
          toAccountId: type === "TRANSFER" ? toAccountId : null,
          categoryId: categoryId || null,
          subCategoryId: subCategoryId || null,
          note: note || null,
          attachmentUrl: attachmentUrl || null,
        },
      });

      // 2. Attach tags if provided
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          if (!tagName.trim()) continue;
          let tag = await txPrisma.tag.findUnique({
            where: { userId_name: { userId: user.id, name: tagName.trim() } },
          });
          if (!tag) {
            tag = await txPrisma.tag.create({
              data: { userId: user.id, name: tagName.trim() },
            });
          }
          await txPrisma.transactionTag.create({
            data: {
              transactionId: created.id,
              tagId: tag.id,
            },
          });
        }
      }

      // 3. Update account balances with negative balance prevention
      await applyTransactionBalance(
        {
          type,
          amount,
          accountId,
          toAccountId,
        },
        txPrisma as unknown as typeof prisma
      );

      return txPrisma.transaction.findUnique({
        where: { id: created.id },
        include: {
          account: true,
          toAccount: true,
          category: true,
          subCategory: true,
          tags: { include: { tag: true } },
        },
      });
    });

    return NextResponse.json({
      message: "Transaksi berhasil dicatat",
      data: newTx,
      success: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof BalanceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }
}
