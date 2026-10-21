import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  const account = await prisma.account.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        take: 20,
        include: { category: true },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: account, success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const existing = await prisma.account.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const { name, type, accountNumber, color, icon, isArchived } = body;

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    return NextResponse.json({
      message: "Akun berhasil diperbarui",
      data: updated,
      success: true,
    });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.account.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        _count: {
          select: { transactions: true, transfersReceived: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const totalTx = existing._count.transactions + existing._count.transfersReceived;
    if (totalTx > 0) {
      // If has transactions, archive it safely instead of breaking foreign keys
      await prisma.account.update({
        where: { id: params.id },
        data: { isArchived: true },
      });
      return NextResponse.json({
        message: "Akun memiliki riwayat transaksi, sehingga diarsipkan secara aman.",
        archived: true,
        success: true,
      });
    }

    await prisma.account.delete({ where: { id: params.id } });

    return NextResponse.json({
      message: "Akun berhasil dihapus",
      success: true,
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
