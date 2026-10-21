import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validations";
import { applyTransactionBalance, revertTransactionBalance, BalanceError } from "@/lib/balance";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      account: true,
      toAccount: true,
      category: true,
      subCategory: true,
      tags: { include: { tag: true } },
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: transaction, success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

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

    const updatedTx = await prisma.$transaction(async (txPrisma) => {
      // 1. Revert previous balance impact
      await revertTransactionBalance(
        {
          type: existing.type,
          amount: existing.amount,
          accountId: existing.accountId,
          toAccountId: existing.toAccountId,
        },
        txPrisma as unknown as typeof prisma
      );

      // 2. Apply new balance impact
      await applyTransactionBalance(
        {
          type,
          amount,
          accountId,
          toAccountId,
        },
        txPrisma as unknown as typeof prisma
      );

      // 3. Clear existing tags and re-create if specified
      if (tags !== undefined) {
        await txPrisma.transactionTag.deleteMany({
          where: { transactionId: existing.id },
        });

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
              transactionId: existing.id,
              tagId: tag.id,
            },
          });
        }
      }

      // 4. Update transaction
      return txPrisma.transaction.update({
        where: { id: existing.id },
        data: {
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
      message: "Transaksi berhasil diperbarui",
      data: updatedTx,
      success: true,
    });
  } catch (error) {
    if (error instanceof BalanceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Gagal memperbarui transaksi" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (txPrisma) => {
      // Revert balance changes
      await revertTransactionBalance(
        {
          type: existing.type,
          amount: existing.amount,
          accountId: existing.accountId,
          toAccountId: existing.toAccountId,
        },
        txPrisma as unknown as typeof prisma
      );

      // Delete transaction
      await txPrisma.transaction.delete({
        where: { id: existing.id },
      });
    });

    return NextResponse.json({
      message: "Transaksi berhasil dihapus dan saldo akun dipulihkan",
      success: true,
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
