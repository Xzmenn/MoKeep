import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const category = await prisma.category.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Nama subkategori wajib diisi" }, { status: 400 });
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        categoryId: category.id,
        name: body.name.trim(),
      },
    });

    return NextResponse.json({
      message: "Subkategori berhasil ditambahkan",
      data: subCategory,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Create subcategory error:", error);
    return NextResponse.json({ error: "Gagal membuat subkategori" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const subCategoryId = searchParams.get("subCategoryId");

    if (!subCategoryId) {
      return NextResponse.json({ error: "ID subkategori diperlukan" }, { status: 400 });
    }

    const sub = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      include: { category: true },
    });

    if (!sub || sub.category.userId !== user.id) {
      return NextResponse.json({ error: "Subkategori tidak ditemukan" }, { status: 404 });
    }

    await prisma.subCategory.delete({ where: { id: subCategoryId } });

    return NextResponse.json({
      message: "Subkategori berhasil dihapus",
      success: true,
    });
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return NextResponse.json({ error: "Gagal menghapus subkategori" }, { status: 500 });
  }
}
