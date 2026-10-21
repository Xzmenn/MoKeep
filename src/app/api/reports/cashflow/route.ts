import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") || "6", 10);

    const now = new Date();
    const startDate = startOfMonth(subMonths(now, months - 1));
    const endDate = endOfMonth(now);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
        type: { in: ["INCOME", "EXPENSE"] },
      },
      orderBy: { date: "asc" },
    });

    // Group by Month: e.g. "Mei 2026", "Jun 2026"
    const monthlyMap = new Map<string, { label: string; income: number; expense: number; net: number }>();

    // Initialize all months in the window
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy", { locale: id });
      monthlyMap.set(key, { label, income: 0, expense: 0, net: 0 });
    }

    for (const tx of transactions) {
      const key = format(new Date(tx.date), "yyyy-MM");
      if (monthlyMap.has(key)) {
        const item = monthlyMap.get(key)!;
        if (tx.type === "INCOME") {
          item.income += tx.amount;
        } else if (tx.type === "EXPENSE") {
          item.expense += tx.amount;
        }
        item.net = item.income - item.expense;
      }
    }

    const cashflow = Array.from(monthlyMap.values());

    return NextResponse.json({
      data: cashflow,
      success: true,
    });
  } catch (error) {
    console.error("Cashflow report error:", error);
    return NextResponse.json({ error: "Gagal memproses data arus kas" }, { status: 500 });
  }
}
