import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      include: {
        account: true,
        contributions: {
          orderBy: { date: "desc" },
          take: 5,
        },
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: [{ isCompleted: "asc" }, { deadline: "asc" }],
    });

    const goalsWithProgress = goals.map((goal) => {
      const percentage =
        goal.targetAmount > 0
          ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          : 0;

      let daysRemaining: number | null = null;
      if (goal.deadline) {
        const diff = new Date(goal.deadline).getTime() - new Date().getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        ...goal,
        percentage,
        remainingAmount: Math.max(goal.targetAmount - goal.currentAmount, 0),
        daysRemaining,
      };
    });

    const totalTarget = goalsWithProgress.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goalsWithProgress.reduce((sum, g) => sum + g.currentAmount, 0);

    return NextResponse.json({
      data: goalsWithProgress,
      summary: {
        totalTarget,
        totalSaved,
        totalRemaining: Math.max(totalTarget - totalSaved, 0),
        totalGoals: goals.length,
        completedGoals: goals.filter((g) => g.isCompleted || g.currentAmount >= g.targetAmount).length,
      },
      success: true,
    });
  } catch (error) {
    console.error("Get goals error:", error);
    return NextResponse.json({ error: "Gagal mengambil data target tabungan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = goalSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data target tabungan tidak valid" },
        { status: 400 }
      );
    }

    const { name, targetAmount, currentAmount, deadline, accountId, color, icon } = validated.data;

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        deadline: deadline ? new Date(deadline) : null,
        accountId: accountId || null,
        color: color || "#8b5cf6",
        icon: icon || "Target",
        isCompleted: (currentAmount || 0) >= targetAmount,
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json({
      message: "Target tabungan berhasil dibuat",
      data: goal,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json({ error: "Gagal membuat target tabungan" }, { status: 500 });
  }
}
