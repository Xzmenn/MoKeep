import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // INCOME, EXPENSE, TRANSFER

  const categories = await prisma.category.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
    },
    include: {
      subCategories: true,
      _count: {
        select: { transactions: true, budgets: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories, success: true });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = categorySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data kategori tidak valid" },
        { status: 400 }
      );
    }

    const { name, type, icon, color } = validated.data;

    const category = await prisma.category.create({
      data: {
        userId: user.id,
        name,
        type,
        icon: icon || "Tag",
        color: color || "#10b981",
      },
      include: {
        subCategories: true,
      },
    });

    return NextResponse.json({
      message: "Kategori berhasil dibuat",
      data: category,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}
