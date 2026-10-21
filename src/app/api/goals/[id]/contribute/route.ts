import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { goalContributionSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const goal = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Target tabungan tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const validated = goalContributionSchema.safeParse({
      ...body,
      goalId: params.id,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data kontribusi tidak valid" },
        { status: 400 }
      );
    }

    const { amount, date, note } = validated.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create contribution
      const contribution = await tx.goalContribution.create({
        data: {
          goalId: goal.id,
          amount,
          date: date ? new Date(date) : new Date(),
          note: note || null,
        },
      });

      // 2. Increment goal currentAmount
      const newCurrentAmount = goal.currentAmount + amount;
      const isCompleted = newCurrentAmount >= goal.targetAmount;

      const updatedGoal = await tx.goal.update({
        where: { id: goal.id },
        data: {
          currentAmount: { increment: amount },
          isCompleted,
        },
        include: {
          contributions: { orderBy: { date: "desc" } },
        },
      });

      return { contribution, updatedGoal };
    });

    return NextResponse.json({
      message: "Kontribusi berhasil ditambahkan",
      data: result,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Contribute error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kontribusi" }, { status: 500 });
  }
}
