"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDateIndo } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import {
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart as PieIcon,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

interface SummaryData {
  totalBalance: number;
  income: number;
  expense: number;
  netSavings: number;
  savingsRate: number;
  startDate: string;
  endDate: string;
}

interface CashflowPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  count: number;
  percentage: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryReportItem[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append("period", period);
      if (period === "custom" && startDate && endDate) {
        query.append("startDate", startDate);
        query.append("endDate", endDate);
      }

      const [sumRes, cashRes, expRes, incRes] = await Promise.all([
        fetch(`/api/reports/summary?${query.toString()}`).then((r) => r.json()),
        fetch(`/api/reports/cashflow?months=6`).then((r) => r.json()),
        fetch(`/api/reports/category?type=EXPENSE&${query.toString()}`).then((r) => r.json()),
        fetch(`/api/reports/category?type=INCOME&${query.toString()}`).then((r) => r.json()),
      ]);

      if (sumRes.data) setSummary(sumRes.data);
      if (cashRes.data) setCashflow(cashRes.data);
      if (expRes.data?.items) setExpenseCategories(expRes.data.items);
      if (incRes.data?.items) setIncomeCategories(incRes.data.items);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Pilih rentang tanggal lengkap");
      return;
    }
    setPeriod("custom");
    fetchReports();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Laporan & Analisis Finansial
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analisis performa keuangan, pengeluaran per kategori, dan ekspor data
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href="/api/export?format=csv" download>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export CSV / Excel</span>
              </Button>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Cetak PDF</span>
            </Button>
          </div>
        </div>

        {/* Period Filter Selector */}
        <Card className="border no-print">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {[
                { id: "today", label: "Hari Ini" },
                { id: "week", label: "Minggu Ini" },
                { id: "month", label: "Bulan Ini" },
                { id: "year", label: "Tahun Ini" },
                { id: "custom", label: "Kustom Tanggal" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    period === p.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {period === "custom" && (
              <form
                onSubmit={handleApplyCustomDate}
                className="flex items-center gap-2 w-full md:w-auto text-xs"
              >
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs w-36"
                  required
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs w-36"
                  required
                />
                <Button type="submit" size="sm" className="h-8 text-xs">
                  Terapkan
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Printable Title Header */}
        <div className="hidden print-only py-4 border-b">
          <h2 className="text-2xl font-bold">Laporan Finansial Pribadi - FinKaya</h2>
          <p className="text-xs text-muted-foreground">
            Periode:{" "}
            {summary
              ? `${formatDateIndo(summary.startDate)} s/d ${formatDateIndo(summary.endDate)}`
              : "Bulan Ini"}{" "}
            • Dicetak pada: {formatDateIndo(new Date())}
          </p>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Total Pemasukan
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary?.income || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Arus kas masuk</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Total Pengeluaran
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(summary?.expense || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Arus kas keluar</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Surplus / Defisit Bersih
              </CardDescription>
              <CardTitle
                className={`text-2xl font-bold ${
                  (summary?.netSavings || 0) >= 0
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(summary?.netSavings || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Selisih pemasukan - pengeluaran</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Tingkat Tabungan (Savings Rate)
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {(summary?.savingsRate || 0).toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Persentase pendapatan yang dihemat
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Month Cashflow Bar Chart */}
        <Card className="border">
          <CardHeader>
            <CardTitle>Arus Kas Bulanan (6 Bulan Terakhir)</CardTitle>
            <CardDescription>
              Perbandingan total pendapatan vs pengeluaran setiap bulannya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Breakdown & Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border">
            <CardHeader>
              <CardTitle>Distribusi Pengeluaran</CardTitle>
              <CardDescription>Persentase pengeluaran periode ini</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseCategories.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                  Tidak ada data pengeluaran
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#10b981"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val) || 0)}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Breakdown */}
          <Card className="lg:col-span-2 border">
            <CardHeader>
              <CardTitle>Rincian Pos Pengeluaran per Kategori</CardTitle>
              <CardDescription>Daftar lengkap alokasi dana per pos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3 text-center">Frekuensi</th>
                      <th className="px-4 py-3 text-right">Total Biaya (Rp)</th>
                      <th className="px-4 py-3 text-right">Porsi (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {expenseCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          Belum ada catatan pengeluaran
                        </td>
                      </tr>
                    ) : (
                      expenseCategories.map((cat) => (
                        <tr key={cat.categoryId} className="hover:bg-accent/30">
                          <td className="px-4 py-3 flex items-center gap-2.5 font-medium">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.categoryName}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            {cat.count}x transaksi
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(cat.amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-xs">
                            {cat.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
