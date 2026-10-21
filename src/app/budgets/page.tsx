"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import { Plus, Edit, Trash2, AlertCircle, CheckCircle2, AlertTriangle, PieChart } from "lucide-react";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface BudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  realPercentage: number;
  alertThreshold: number;
  status: "normal" | "warning" | "danger";
  category: {
    name: string;
    icon: string;
    color: string;
  };
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  month: number;
  year: number;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.data) {
        setBudgets(json.data);
        setSummary(json.summary);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat anggaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/budgets/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Anggaran berhasil dihapus");
      setDeleteId(null);
      fetchBudgets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  const overallPercentage =
    summary && summary.totalBudget > 0
      ? (summary.totalSpent / summary.totalBudget) * 100
      : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Anggaran Bulanan (Budget)
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kontrol pengeluaran per kategori agar tidak melebihi batas finansial
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Month & Year Filter */}
            <div className="flex items-center gap-1.5 bg-card border rounded-lg p-1">
              <Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-8 text-xs border-0 bg-transparent w-32"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </Select>
              <Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-8 text-xs border-0 bg-transparent w-20"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              onClick={() => {
                setSelectedBudget(null);
                setModalOpen(true);
              }}
              size="sm"
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Atur Anggaran</span>
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Total Anggaran Disiapkan
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {formatCurrency(summary?.totalBudget || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Untuk {budgets.length} pos kategori pengeluaran
              </p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Total Telah Terpakai
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(summary?.totalSpent || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Terpakai {overallPercentage.toFixed(1)}%</span>
              </div>
              <Progress
                value={overallPercentage}
                variant={
                  overallPercentage >= 100
                    ? "danger"
                    : overallPercentage >= 80
                    ? "warning"
                    : "success"
                }
              />
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Sisa Anggaran Tersedia
              </CardDescription>
              <CardTitle
                className={`text-2xl font-bold ${
                  (summary?.totalRemaining || 0) < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(summary?.totalRemaining || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {(summary?.totalRemaining || 0) < 0
                  ? "Anggaran telah defisit / over-budget"
                  : "Dapat digunakan hingga akhir bulan"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budgets List Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Daftar Pos Anggaran ({MONTHS[month - 1]} {year})
          </h3>

          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Memuat data anggaran...
            </div>
          ) : budgets.length === 0 ? (
            <Card className="border p-8 text-center space-y-3">
              <PieChart className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada anggaran yang diatur untuk {MONTHS[month - 1]} {year}
              </p>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                Atur Anggaran Sekarang
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const isOver = b.status === "danger";
                const isWarning = b.status === "warning";

                return (
                  <Card
                    key={b.id}
                    className={`border transition-all hover:shadow-md ${
                      isOver
                        ? "border-rose-500/50 bg-rose-500/5"
                        : isWarning
                        ? "border-amber-500/50 bg-amber-500/5"
                        : ""
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Top Category Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: b.category.color }}
                          >
                            <CategoryIcon name={b.category.icon} className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-base">
                              {b.category.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isOver ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  Melebihi Batas
                                </Badge>
                              ) : isWarning ? (
                                <Badge variant="warning" className="text-[10px]">
                                  Mendekati Batas ({b.alertThreshold}%)
                                </Badge>
                              ) : (
                                <Badge variant="success" className="text-[10px]">
                                  Terkendali
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedBudget(b);
                              setModalOpen(true);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground"
                            title="Ubah Anggaran"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(b.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive"
                            title="Hapus Anggaran"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Numbers */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Terpakai</p>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(b.spent)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Batas Anggaran</p>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(b.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <Progress
                          value={b.percentage}
                          variant={isOver ? "danger" : isWarning ? "warning" : "success"}
                        />
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                          <span>{b.realPercentage.toFixed(1)}% terpakai</span>
                          <span>
                            {b.remaining >= 0
                              ? `Sisa ${formatCurrency(b.remaining)}`
                              : `Defisit ${formatCurrency(Math.abs(b.remaining))}`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Budget Modal */}
      <BudgetDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={selectedBudget}
        onSuccess={fetchBudgets}
      />

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Anggaran</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus pos anggaran ini? Transaksi pengeluaran tidak akan terhapus.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>
              Hapus Anggaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
