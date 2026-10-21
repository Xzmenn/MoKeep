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
    const body = await req.json();
    const existing = await prisma.category.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const { name, type, icon, color } = body;

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(icon && { icon }),
        ...(color && { color }),
      },
      include: {
        subCategories: true,
      },
    });

    return NextResponse.json({
      message: "Kategori berhasil diperbarui",
      data: updated,
      success: true,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const existing = await prisma.category.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (existing._count.transactions > 0) {
      return NextResponse.json(
        {
          error: `Kategori '${existing.name}' memiliki ${existing._count.transactions} transaksi terkait. Hapus transaksi terlebih dahulu atau ubah kategorinya.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });

    return NextResponse.json({
      message: "Kategori berhasil dihapus",
      success: true,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
