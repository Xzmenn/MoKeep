import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      account: true,
      contributions: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!goal) {
    return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ data: goal, success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { name, targetAmount, deadline, accountId, color, icon, isCompleted } = body;

    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(targetAmount !== undefined && { targetAmount: Number(targetAmount) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(accountId !== undefined && { accountId: accountId || null }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(isCompleted !== undefined && { isCompleted: Boolean(isCompleted) }),
      },
      include: { account: true },
    });

    return NextResponse.json({
      message: "Target tabungan berhasil diperbarui",
      data: updated,
      success: true,
    });
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json({ error: "Gagal memperbarui target" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
    }

    await prisma.goal.delete({ where: { id: params.id } });

    return NextResponse.json({
      message: "Target tabungan berhasil dihapus",
      success: true,
    });
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json({ error: "Gagal menghapus target" }, { status: 500 });
  }
}
