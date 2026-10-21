import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { accountSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return NextResponse.json({ data: accounts, success: true });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = accountSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data akun tidak valid" },
        { status: 400 }
      );
    }

    const { name, type, balance, accountNumber, color, icon } = validated.data;

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name,
        type,
        balance: Number(balance),
        currentBalance: Number(balance),
        accountNumber: accountNumber || null,
        color: color || "#3b82f6",
        icon: icon || "Wallet",
      },
    });

    return NextResponse.json({
      message: "Akun dompet berhasil dibuat",
      data: account,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}
