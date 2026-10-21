import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.budget.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Anggaran tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { amount, alertThreshold } = body;

    const updated = await prisma.budget.update({
      where: { id: params.id },
      data: {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(alertThreshold !== undefined && { alertThreshold: Number(alertThreshold) }),
      },
      include: { category: true },
    });

    return NextResponse.json({
      message: "Anggaran berhasil diperbarui",
      data: updated,
      success: true,
    });
  } catch (error) {
    console.error("Update budget error:", error);
    return NextResponse.json({ error: "Gagal memperbarui anggaran" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.budget.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Anggaran tidak ditemukan" }, { status: 404 });
    }

    await prisma.budget.delete({ where: { id: params.id } });

    return NextResponse.json({
      message: "Anggaran berhasil dihapus",
      success: true,
    });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json({ error: "Gagal menghapus anggaran" }, { status: 500 });
  }
}
