import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { transferSchema } from "@/lib/validations";
import { applyTransactionBalance, BalanceError } from "@/lib/balance";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = transferSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data transfer tidak valid" },
        { status: 400 }
      );
    }

    const { fromAccountId, toAccountId, amount, date, note } = validated.data;

    // Verify ownership
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId: user.id } }),
      prisma.account.findFirst({ where: { id: toAccountId, userId: user.id } }),
    ]);

    if (!fromAccount || !toAccount) {
      return NextResponse.json(
        { error: "Akun sumber atau akun tujuan tidak valid" },
        { status: 404 }
      );
    }

    if (fromAccount.type !== "CREDIT_CARD" && fromAccount.currentBalance < amount) {
      return NextResponse.json(
        { error: `Saldo akun ${fromAccount.name} tidak cukup untuk transfer sejumlah Rp ${amount.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }

    // Get or create transfer category
    let transferCat = await prisma.category.findFirst({
      where: { userId: user.id, type: "TRANSFER" },
    });

    if (!transferCat) {
      transferCat = await prisma.category.create({
        data: {
          userId: user.id,
          name: "Transfer Antar Rekening",
          type: "TRANSFER",
          icon: "ArrowRightLeft",
          color: "#6366f1",
        },
      });
    }

    // Create transaction & update balances
    const transferTx = await prisma.$transaction(async (txPrisma) => {
      const tx = await txPrisma.transaction.create({
        data: {
          userId: user.id,
          type: "TRANSFER",
          amount,
          date: new Date(date),
          accountId: fromAccountId,
          toAccountId: toAccountId,
          categoryId: transferCat?.id,
          note: note || `Transfer dari ${fromAccount.name} ke ${toAccount.name}`,
        },
        include: {
          account: true,
          toAccount: true,
        },
      });

      await applyTransactionBalance(
        {
          type: "TRANSFER",
          amount,
          accountId: fromAccountId,
          toAccountId: toAccountId,
        },
        txPrisma as unknown as typeof prisma
      );

      return tx;
    });

    return NextResponse.json({
      message: "Transfer antar akun berhasil dicatat",
      data: transferTx,
      success: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof BalanceError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Gagal memproses transfer" }, { status: 500 });
  }
}
