import { prisma } from "@/lib/prisma";

export class BalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceError";
  }
}

/**
 * Validates and updates account balances atomically for transaction creation.
 */
export async function applyTransactionBalance(
  tx: {
    type: string;
    amount: number;
    accountId: string;
    toAccountId?: string | null;
  },
  prismaClient = prisma
) {
  const account = await prismaClient.account.findUnique({
    where: { id: tx.accountId },
  });

  if (!account) {
    throw new Error("Akun sumber tidak ditemukan");
  }

  if (tx.type === "INCOME") {
    await prismaClient.account.update({
      where: { id: tx.accountId },
      data: { currentBalance: { increment: tx.amount } },
    });
  } else if (tx.type === "EXPENSE") {
    if (account.type !== "CREDIT_CARD" && account.currentBalance - tx.amount < 0) {
      throw new BalanceError(
        `Saldo akun ${account.name} tidak mencukupi untuk pengeluaran ini (Saldo saat ini: ${account.currentBalance})`
      );
    }
    await prismaClient.account.update({
      where: { id: tx.accountId },
      data: { currentBalance: { decrement: tx.amount } },
    });
  } else if (tx.type === "TRANSFER") {
    if (!tx.toAccountId) {
      throw new Error("Akun tujuan transfer wajib diisi");
    }

    const toAccount = await prismaClient.account.findUnique({
      where: { id: tx.toAccountId },
    });

    if (!toAccount) {
      throw new Error("Akun tujuan tidak ditemukan");
    }

    if (account.type !== "CREDIT_CARD" && account.currentBalance - tx.amount < 0) {
      throw new BalanceError(
        `Saldo akun ${account.name} tidak mencukupi untuk transfer (Saldo saat ini: ${account.currentBalance})`
      );
    }

    await prismaClient.account.update({
      where: { id: tx.accountId },
      data: { currentBalance: { decrement: tx.amount } },
    });

    await prismaClient.account.update({
      where: { id: tx.toAccountId },
      data: { currentBalance: { increment: tx.amount } },
    });
  }
}

/**
 * Reverts account balance when a transaction is deleted or replaced.
 */
export async function revertTransactionBalance(
  tx: {
    type: string;
    amount: number;
    accountId: string;
    toAccountId?: string | null;
  },
  prismaClient = prisma
) {
  if (tx.type === "INCOME") {
    await prismaClient.account.update({
      where: { id: tx.accountId },
      data: { currentBalance: { decrement: tx.amount } },
    });
  } else if (tx.type === "EXPENSE") {
    await prismaClient.account.update({
      where: { id: tx.accountId },
      data: { currentBalance: { increment: tx.amount } },
    });
  } else if (tx.type === "TRANSFER" && tx.toAccountId) {
    await prismaClient.account.update({
      where: { id: tx.accountId },
      data: { currentBalance: { increment: tx.amount } },
    });
    await prismaClient.account.update({
      where: { id: tx.toAccountId },
      data: { currentBalance: { decrement: tx.amount } },
    });
  }
}
