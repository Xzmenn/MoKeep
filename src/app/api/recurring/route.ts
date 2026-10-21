import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { recurringTransactionSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId: user.id },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: { nextRun: "asc" },
    });

    return NextResponse.json({ data: recurring, success: true });
  } catch (error) {
    console.error("Get recurring error:", error);
    return NextResponse.json({ error: "Gagal mengambil transaksi berulang" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = recurringTransactionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data transaksi berulang tidak valid" },
        { status: 400 }
      );
    }

    const { type, amount, accountId, toAccountId, categoryId, frequency, startDate, endDate, note } =
      validated.data;

    const start = new Date(startDate);
    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : null,
        categoryId: categoryId || null,
        frequency,
        startDate: start,
        nextRun: start,
        endDate: endDate ? new Date(endDate) : null,
        note: note || null,
        isActive: true,
      },
      include: {
        account: true,
        category: true,
      },
    });

    return NextResponse.json({
      message: "Transaksi berulang berhasil dijadwalkan",
      data: recurring,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Create recurring error:", error);
    return NextResponse.json({ error: "Gagal membuat transaksi berulang" }, { status: 500 });
  }
}
