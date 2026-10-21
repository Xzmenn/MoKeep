import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const exportFormat = searchParams.get("format") || "csv"; // 'csv' or 'json'

    if (exportFormat === "json") {
      // Full Backup Dump
      const [accounts, categories, transactions, budgets, goals, recurring] =
        await Promise.all([
          prisma.account.findMany({ where: { userId: user.id } }),
          prisma.category.findMany({
            where: { userId: user.id },
            include: { subCategories: true },
          }),
          prisma.transaction.findMany({
            where: { userId: user.id },
            include: {
              account: true,
              toAccount: true,
              category: true,
              subCategory: true,
              tags: { include: { tag: true } },
            },
          }),
          prisma.budget.findMany({ where: { userId: user.id } }),
          prisma.goal.findMany({
            where: { userId: user.id },
            include: { contributions: true },
          }),
          prisma.recurringTransaction.findMany({ where: { userId: user.id } }),
        ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        user: { name: user.name, email: user.email },
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        recurring,
      };

      return new NextResponse(JSON.stringify(backupData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="finkaya_backup_${format(new Date(), "yyyyMMdd_HHmmss")}.json"`,
        },
      });
    }

    // Default: CSV Export of Transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        account: true,
        toAccount: true,
        category: true,
        subCategory: true,
      },
      orderBy: { date: "desc" },
    });

    const csvRows = transactions.map((tx) => ({
      ID: tx.id,
      Tanggal: format(new Date(tx.date), "yyyy-MM-dd HH:mm"),
      Jenis: tx.type,
      Jumlah: tx.amount,
      Akun: tx.account.name,
      Akun_Tujuan: tx.toAccount?.name || "",
      Kategori: tx.category?.name || "",
      Subkategori: tx.subCategory?.name || "",
      Catatan: tx.note || "",
    }));

    const csvContent = Papa.unparse(csvRows);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transaksi_finkaya_${format(new Date(), "yyyyMMdd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 });
  }
}
