import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "EXPENSE"; // EXPENSE or INCOME
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : startOfMonth(now);
    const endDate = endDateParam ? new Date(endDateParam) : endOfMonth(now);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: true,
      },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        color: string;
        icon: string;
        amount: number;
        count: number;
      }
    >();

    let totalAmount = 0;

    for (const tx of transactions) {
      const catId = tx.categoryId || "uncategorized";
      const catName = tx.category?.name || "Tanpa Kategori";
      const color = tx.category?.color || "#94a3b8";
      const icon = tx.category?.icon || "Tag";

      totalAmount += tx.amount;

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: catId,
          categoryName: catName,
          color,
          icon,
          amount: tx.amount,
          count: 1,
        });
      } else {
        const item = categoryMap.get(catId)!;
        item.amount += tx.amount;
        item.count += 1;
      }
    }

    const items = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      data: {
        type,
        totalAmount,
        items,
        startDate,
        endDate,
      },
      success: true,
    });
  } catch (error) {
    console.error("Category report error:", error);
    return NextResponse.json({ error: "Gagal memproses laporan per kategori" }, { status: 500 });
  }
}
