import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data pendaftaran tidak valid" },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        currency: "IDR",
        setting: {
          create: {
            theme: "system",
            language: "id",
            currency: "IDR",
          },
        },
        accounts: {
          create: [
            {
              name: "Dompet Tunai",
              type: "CASH",
              balance: 0,
              currentBalance: 0,
              color: "#15803d",
              icon: "Wallet",
            },
            {
              name: "Rekening Bank",
              type: "BANK",
              balance: 0,
              currentBalance: 0,
              color: "#1e40af",
              icon: "Landmark",
            },
          ],
        },
        categories: {
          create: [
            { name: "Gaji & Upah", type: "INCOME", icon: "BadgeDollarSign", color: "#10b981" },
            { name: "Pendapatan Lain", type: "INCOME", icon: "TrendingUp", color: "#14b8a6" },
            { name: "Makanan & Minuman", type: "EXPENSE", icon: "UtensilsCrossed", color: "#ef4444" },
            { name: "Transportasi", type: "EXPENSE", icon: "Car", color: "#f97316" },
            { name: "Belanja", type: "EXPENSE", icon: "ShoppingCart", color: "#ec4899" },
            { name: "Tagihan & Utilitas", type: "EXPENSE", icon: "Receipt", color: "#eab308" },
            { name: "Hiburan", type: "EXPENSE", icon: "Film", color: "#8b5cf6" },
            { name: "Kesehatan", type: "EXPENSE", icon: "HeartPulse", color: "#06b6d4" },
            { name: "Transfer Rekening", type: "TRANSFER", icon: "ArrowRightLeft", color: "#6366f1" },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
      },
    });

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil! Silakan masuk.",
        user: newUser,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat registrasi" },
      { status: 500 }
    );
  }
}
