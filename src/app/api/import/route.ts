import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { applyTransactionBalance } from "@/lib/balance";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.id) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File CSV wajib diunggah" }, { status: 400 });
    }

    const csvText = await file.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: "Format CSV tidak dapat dibaca" }, { status: 400 });
    }

    const rows = parsed.data as Array<Record<string, string>>;

    let successCount = 0;
    const errors: string[] = [];

    // Pre-fetch user accounts & categories
    const userAccounts = await prisma.account.findMany({ where: { userId: user.id } });
    const userCategories = await prisma.category.findMany({ where: { userId: user.id } });

    // Fallback account if needed
    let defaultAccount = userAccounts[0];
    if (!defaultAccount) {
      defaultAccount = await prisma.account.create({
        data: {
          userId: user.id,
          name: "Dompet Tunai",
          type: "CASH",
          balance: 0,
          currentBalance: 0,
        },
      });
      userAccounts.push(defaultAccount);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const amountStr = row["Jumlah"] || row["Amount"] || row["Nominal"] || "0";
        const cleanAmount = parseFloat(amountStr.replace(/[^0-9.-]/g, ""));
        if (!cleanAmount || isNaN(cleanAmount) || cleanAmount <= 0) {
          continue;
        }

        const rawType = (row["Jenis"] || row["Type"] || "EXPENSE").toUpperCase().trim();
        const type = rawType.includes("INCOME") || rawType.includes("MASUK")
          ? "INCOME"
          : rawType.includes("TRANSFER")
          ? "TRANSFER"
          : "EXPENSE";

        const dateStr = row["Tanggal"] || row["Date"] || new Date().toISOString();
        const txDate = isNaN(Date.parse(dateStr)) ? new Date() : new Date(dateStr);

        const accountName = row["Akun"] || row["Account"] || defaultAccount.name;
        let account = userAccounts.find(
          (a) => a.name.toLowerCase() === accountName.toLowerCase().trim()
        );

        if (!account) {
          account = await prisma.account.create({
            data: {
              userId: user.id,
              name: accountName.trim(),
              type: "CASH",
              balance: 0,
              currentBalance: 0,
            },
          });
          userAccounts.push(account);
        }

        const categoryName = row["Kategori"] || row["Category"] || (type === "INCOME" ? "Pendapatan Lain" : "Lain-lain");
        let category = userCategories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase().trim()
        );

        if (!category && type !== "TRANSFER") {
          category = await prisma.category.create({
            data: {
              userId: user.id,
              name: categoryName.trim(),
              type: type,
              color: type === "INCOME" ? "#10b981" : "#ef4444",
              icon: "Tag",
            },
          });
          userCategories.push(category);
        }

        const note = row["Catatan"] || row["Note"] || row["Keterangan"] || "Import CSV";

        await prisma.$transaction(async (txPrisma) => {
          await txPrisma.transaction.create({
            data: {
              userId: user.id,
              type,
              amount: cleanAmount,
              date: txDate,
              accountId: account!.id,
              categoryId: category?.id || null,
              note,
            },
          });

          await applyTransactionBalance(
            {
              type,
              amount: cleanAmount,
              accountId: account!.id,
            },
            txPrisma as unknown as typeof prisma
          );
        });

        successCount++;
      } catch (err: unknown) {
        errors.push(`Baris ${i + 1}: ${err instanceof Error ? err.message : "Gagal memproses data"}`);
      }
    }

    return NextResponse.json({
      message: `Berhasil mengimpor ${successCount} transaksi`,
      successCount,
      failedCount: errors.length,
      errors: errors.slice(0, 5), // Return first few errors if any
      success: true,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Gagal memproses file import" }, { status: 500 });
  }
}
