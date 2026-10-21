import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    const now = new Date();
    let startDate = startOfMonth(now);
    let endDate = endOfMonth(now);
    let prevStartDate = startOfMonth(subMonths(now, 1));
    let prevEndDate = endOfMonth(subMonths(now, 1));

    if (period === "today") {
      startDate = startOfDay(now);
      endDate = endOfDay(now);
    } else if (period === "week") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (period === "month") {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (period === "year") {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    } else if (period === "custom" && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
    }

    // 1. Total balance across non-archived accounts
    const accounts = await prisma.account.findMany({
      where: { userId: user.id, isArchived: false },
    });
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

    // 2. Transactions in period
    const currentPeriodAgg = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const income = currentPeriodAgg.find((g) => g.type === "INCOME")?._sum.amount || 0;
    const expense = currentPeriodAgg.find((g) => g.type === "EXPENSE")?._sum.amount || 0;
    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    // 3. Transactions in previous period for comparison
    const prevPeriodAgg = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId: user.id,
        date: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: { amount: true },
    });

    const prevIncome = prevPeriodAgg.find((g) => g.type === "INCOME")?._sum.amount || 0;
    const prevExpense = prevPeriodAgg.find((g) => g.type === "EXPENSE")?._sum.amount || 0;

    const incomeGrowth = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
    const expenseGrowth = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

    // 4. Accounts breakdown
    const accountsBreakdown = accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      balance: acc.currentBalance,
      color: acc.color,
      icon: acc.icon,
      percentage: totalBalance > 0 ? (acc.currentBalance / totalBalance) * 100 : 0,
    }));

    return NextResponse.json({
      data: {
        totalBalance,
        income,
        expense,
        netSavings,
        savingsRate,
        incomeGrowth,
        expenseGrowth,
        period,
        startDate,
        endDate,
        accountsBreakdown,
      },
      success: true,
    });
  } catch (error) {
    console.error("Summary report error:", error);
    return NextResponse.json({ error: "Gagal memproses laporan ringkasan" }, { status: 500 });
  }
}
