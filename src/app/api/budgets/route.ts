import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);

    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month,
        year,
      },
      include: {
        category: true,
      },
      orderBy: { amount: "desc" },
    });

    // Date range for specified month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Calculate actual spending per category for this month
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const expenseAgg = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            categoryId: budget.categoryId,
            type: "EXPENSE",
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const spent = expenseAgg._sum.amount || 0;
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        let status: "normal" | "warning" | "danger" = "normal";
        if (percentage >= 100) {
          status = "danger";
        } else if (percentage >= budget.alertThreshold) {
          status = "warning";
        }

        return {
          ...budget,
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          realPercentage: percentage,
          status,
        };
      })
    );

    const totalBudget = budgetsWithSpending.reduce((acc, b) => acc + b.amount, 0);
    const totalSpent = budgetsWithSpending.reduce((acc, b) => acc + b.spent, 0);

    return NextResponse.json({
      data: budgetsWithSpending,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        month,
        year,
      },
      success: true,
    });
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json({ error: "Gagal mengambil data budget" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const body = await req.json();
    const validated = budgetSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Data anggaran tidak valid" },
        { status: 400 }
      );
    }

    const { categoryId, amount, month, year, alertThreshold } = validated.data;

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId,
          month,
          year,
        },
      },
      create: {
        userId: user.id,
        categoryId,
        amount,
        month,
        year,
        alertThreshold: alertThreshold || 80,
      },
      update: {
        amount,
        alertThreshold: alertThreshold || 80,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: "Anggaran berhasil disimpan",
      data: budget,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Save budget error:", error);
    return NextResponse.json({ error: "Gagal menyimpan anggaran" }, { status: 500 });
  }
}
