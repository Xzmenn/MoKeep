import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      currency: true,
      createdAt: true,
      setting: true,
    },
  });

  return NextResponse.json({ data: profile, success: true });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { name, currency, image, currentPassword, newPassword } = body;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return unauthorizedResponse();

    const updateData: {
      name?: string;
      currency?: string;
      image?: string | null;
      password?: string;
    } = {};

    if (name) updateData.name = name;
    if (currency) updateData.currency = currency;
    if (image !== undefined) updateData.image = image;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Kata sandi lama wajib diisi untuk mengubah kata sandi" },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Kata sandi lama tidak sesuai" },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        currency: true,
      },
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      data: updated,
      success: true,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
