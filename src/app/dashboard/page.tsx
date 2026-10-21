"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDateIndo, formatDateShort } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Plus,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { useSession } from "next-auth/react";

interface SummaryData {
  totalBalance: number;
  income: number;
  expense: number;
  netSavings: number;
  savingsRate: number;
  incomeGrowth: number;
  expenseGrowth: number;
  accountsBreakdown: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    icon: string;
    percentage: number;
  }>;
}

interface CashflowPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface CategoryPieItem {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
}

interface BudgetAlertItem {
  id: string;
  category: { name: string; color: string; icon: string };
  amount: number;
  spent: number;
  percentage: number;
  status: "normal" | "warning" | "danger";
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  note: string | null;
  account: { name: string };
  toAccount?: { name: string } | null;
  category?: { name: string; color: string; icon: string } | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<"month" | "today" | "year">("month");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPieItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetAlertItem[]>([]);
  const [recentTx, setRecentTx] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, cashRes, catRes, budRes, txRes] = await Promise.all([
        fetch(`/api/reports/summary?period=${period}`).then((r) => r.json()),
        fetch(`/api/reports/cashflow?months=6`).then((r) => r.json()),
        fetch(`/api/reports/category?type=EXPENSE`).then((r) => r.json()),
        fetch(`/api/budgets`).then((r) => r.json()),
        fetch(`/api/transactions?limit=7`).then((r) => r.json()),
      ]);

      if (sumRes.data) setSummary(sumRes.data);
      if (cashRes.data) setCashflow(cashRes.data);
      if (catRes.data?.items) setCategoryData(catRes.data.items);
      if (budRes.data) setBudgets(budRes.data);
      if (txRes.data) setRecentTx(txRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  useEffect(() => {
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener("transaction-updated", handleUpdate);
    return () => window.removeEventListener("transaction-updated", handleUpdate);
  }, []);

  const alerts = budgets.filter((b) => b.status === "warning" || b.status === "danger");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome & Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Halo, {session?.user?.name || "Pengguna"} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Berikut adalah ringkasan kesehatan finansial Anda per {formatDateIndo(new Date())}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border bg-card p-1 text-xs font-medium shadow-2xs">
              <button
                onClick={() => setPeriod("today")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  period === "today"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setPeriod("month")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  period === "month"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setPeriod("year")}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  period === "year"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tahun Ini
              </button>
            </div>

            <Button
              onClick={() => setTxModalOpen(true)}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah</span>
            </Button>
          </div>
        </div>

        {/* Budget Warning Banner if any */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Peringatan Anggaran: {alerts.length} Kategori Mendekati / Melebihi Batas!
                </p>
                <p className="text-xs opacity-90">
                  {alerts.map((a) => `${a.category.name} (${Math.round(a.percentage)}%)`).join(", ")}
                </p>
              </div>
            </div>
            <Link href="/budgets">
              <Button size="sm" variant="outline" className="border-amber-500/40 text-xs">
                Periksa Anggaran
              </Button>
            </Link>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Saldo / Net Worth */}
          <Card className="relative overflow-hidden border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Kekayaan Bersih
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(summary?.totalBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Akumulasi di seluruh akun dompet & bank
              </p>
            </CardContent>
          </Card>

          {/* 2. Total Pemasukan */}
          <Card className="relative overflow-hidden border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pemasukan ({period === "month" ? "Bulan Ini" : period === "today" ? "Hari Ini" : "Tahun Ini"})
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary?.income || 0)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                {summary && summary.incomeGrowth >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                    +{summary.incomeGrowth.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center">
                    {summary?.incomeGrowth.toFixed(1)}%
                  </span>
                )}
                <span>vs periode lalu</span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Total Pengeluaran */}
          <Card className="relative overflow-hidden border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pengeluaran ({period === "month" ? "Bulan Ini" : period === "today" ? "Hari Ini" : "Tahun Ini"})
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {formatCurrency(summary?.expense || 0)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                {summary && summary.expenseGrowth <= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {summary.expenseGrowth.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    +{summary?.expenseGrowth.toFixed(1)}%
                  </span>
                )}
                <span>vs periode lalu</span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Tabungan Bersih */}
          <Card className="relative overflow-hidden border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tabungan Bersih (Surplus)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <PiggyBank className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold tracking-tight ${
                  (summary?.netSavings || 0) >= 0
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(summary?.netSavings || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Savings rate:{" "}
                <span className="font-semibold text-foreground">
                  {(summary?.savingsRate || 0).toFixed(1)}%
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section: Cashflow Area Chart & Category Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Arus Kas Chart */}
          <Card className="lg:col-span-2 border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Tren Arus Kas (6 Bulan Terakhir)</CardTitle>
                <CardDescription>
                  Perbandingan pemasukan vs pengeluaran dari waktu ke waktu
                </CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Detail <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full">
                {cashflow.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Belum ada data transaksi yang cukup
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={cashflow}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(value) => `${value / 1000000}M`}
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
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Pemasukan"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Pengeluaran"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Kategori Pengeluaran Donut */}
          <Card className="border">
            <CardHeader className="pb-2">
              <CardTitle>Pengeluaran per Kategori</CardTitle>
              <CardDescription>Distribusi biaya periode ini</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground text-center">
                  Belum ada pengeluaran pada periode ini
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {categoryData.map((entry, index) => (
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

                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {categoryData.slice(0, 4).map((cat) => (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate max-w-[120px] font-medium text-foreground">
                            {cat.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {formatCurrency(cat.amount)}
                          </span>
                          <span className="text-muted-foreground w-8 text-right">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Accounts Summary & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Akun Dompet Quick View */}
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Akun & Dompet Anda</CardTitle>
                <CardDescription>Saldo terkini per rekening</CardDescription>
              </div>
              <Link href="/accounts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Semua <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary?.accountsBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada akun dompet
                </p>
              ) : (
                summary?.accountsBreakdown.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: acc.color }}
                      >
                        <CategoryIcon name={acc.icon} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {acc.type.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(acc.balance)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Transaksi Terbaru */}
          <Card className="lg:col-span-2 border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>Aktivitas pengeluaran dan pemasukan terakhir</CardDescription>
              </div>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Lihat Riwayat <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTx.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm text-muted-foreground">Belum ada transaksi tercatat</p>
                  <Button size="sm" onClick={() => setTxModalOpen(true)}>
                    Mulai Catat Transaksi
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentTx.map((tx) => {
                    const isIncome = tx.type === "INCOME";
                    const isTransfer = tx.type === "TRANSFER";

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 hover:bg-accent/30 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isIncome
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : isTransfer
                                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            <CategoryIcon
                              name={tx.category?.icon || (isTransfer ? "ArrowRightLeft" : "Tag")}
                              className="h-4 w-4"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {tx.note || tx.category?.name || (isTransfer ? "Transfer Rekening" : "Transaksi")}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDateShort(tx.date)}</span>
                              <span>•</span>
                              <span>
                                {tx.account.name}
                                {isTransfer && tx.toAccount ? ` ➔ ${tx.toAccount.name}` : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isTransfer
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isIncome ? "+" : isTransfer ? "" : "-"}
                            {formatCurrency(tx.amount)}
                          </p>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionDialog
        open={txModalOpen}
        onOpenChange={setTxModalOpen}
        onSuccess={fetchDashboardData}
      />
    </AppLayout>
  );
}
