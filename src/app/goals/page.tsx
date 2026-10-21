"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import { Plus, Target, CheckCircle2, Calendar, Coins, Edit, Trash2, Clock } from "lucide-react";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { ContributionDialog } from "@/components/goals/contribution-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note: string | null;
}

interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentage: number;
  daysRemaining: number | null;
  deadline: string | null;
  accountId: string | null;
  color: string;
  icon: string;
  isCompleted: boolean;
  account?: { name: string } | null;
  contributions: GoalContribution[];
}

interface GoalsSummary {
  totalTarget: number;
  totalSaved: number;
  totalRemaining: number;
  totalGoals: number;
  completedGoals: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<GoalItem | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.data) {
        setGoals(json.data);
        setSummary(json.summary);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat target tabungan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/goals/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Target tabungan berhasil dihapus");
      setDeleteId(null);
      fetchGoals();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Target Tabungan & Impian
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Rencanakan dan pantau perkembangan target finansial masa depan Anda
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedGoal(null);
              setGoalModalOpen(true);
            }}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Target Baru</span>
          </Button>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Total Nilai Target Impian
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {formatCurrency(summary?.totalTarget || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Dari {summary?.totalGoals || 0} target ({summary?.completedGoals || 0} tercapai)
              </p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Dana Berhasil Terkumpul
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary?.totalSaved || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {summary && summary.totalTarget > 0
                  ? `${((summary.totalSaved / summary.totalTarget) * 100).toFixed(1)}% dari seluruh target`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs uppercase font-semibold">
                Sisa Dana yang Diperlukan
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(summary?.totalRemaining || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Perlu dikumpulkan sesuai tenggat waktu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Goals Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Daftar Impian & Target ({goals.length})
          </h3>

          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Memuat target tabungan...
            </div>
          ) : goals.length === 0 ? (
            <Card className="border p-8 text-center space-y-3">
              <Target className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada target tabungan yang dibuat
              </p>
              <Button size="sm" onClick={() => setGoalModalOpen(true)}>
                Buat Target Pertama Anda
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((g) => {
                const isCompleted = g.isCompleted || g.currentAmount >= g.targetAmount;

                return (
                  <Card
                    key={g.id}
                    className="border hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="h-1.5 w-full" style={{ backgroundColor: g.color }} />
                    <CardContent className="p-5 space-y-4">
                      {/* Top icon & title */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: g.color }}
                          >
                            <CategoryIcon name={g.icon} className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-base leading-snug">
                              {g.name}
                            </h4>
                            {g.account && (
                              <p className="text-xs text-muted-foreground">
                                Disimpan di: {g.account.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedGoal(g);
                              setGoalModalOpen(true);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground"
                            title="Ubah Target"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(g.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive"
                            title="Hapus Target"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-extrabold text-foreground">
                            {formatCurrency(g.currentAmount)}
                          </p>
                          <span className="text-xs text-muted-foreground font-medium">
                            dari {formatCurrency(g.targetAmount)}
                          </span>
                        </div>

                        {/* Progress */}
                        <Progress
                          value={g.percentage}
                          indicatorColor={g.color}
                          className="h-2.5"
                        />

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="font-semibold text-foreground">
                            {g.percentage.toFixed(0)}% Tercapai
                          </span>
                          <span>
                            {isCompleted
                              ? "Target Tercapai!"
                              : `Sisa ${formatCurrency(g.remainingAmount)}`}
                          </span>
                        </div>
                      </div>

                      {/* Deadline & Badge */}
                      <div className="pt-2 border-t flex items-center justify-between text-xs">
                        {g.deadline ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {g.daysRemaining !== null && g.daysRemaining > 0
                                ? `Sisa ${g.daysRemaining} hari`
                                : g.daysRemaining !== null && g.daysRemaining === 0
                                ? "Hari ini tenggatnya"
                                : "Lewat tenggat"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Tanpa batas waktu</span>
                        )}

                        {isCompleted ? (
                          <Badge variant="success" className="gap-1 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> Selesai
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Sedang Berjalan
                          </Badge>
                        )}
                      </div>

                      {/* Add contribution button */}
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => {
                          setContribGoal(g);
                          setContribModalOpen(true);
                        }}
                        className="w-full gap-1.5 text-xs shadow-xs"
                      >
                        <Coins className="h-3.5 w-3.5" />
                        <span>Setor Tabungan</span>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Goal Modal (Add / Edit) */}
      <GoalDialog
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        initialData={selectedGoal}
        onSuccess={fetchGoals}
      />

      {/* Contribution Modal */}
      <ContributionDialog
        open={contribModalOpen}
        onOpenChange={setContribModalOpen}
        goal={contribGoal}
        onSuccess={fetchGoals}
      />

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Target</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus target tabungan ini? Riwayat kontribusi akan ikut terhapus, tetapi saldo akun tidak terpengaruh.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>
              Hapus Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
