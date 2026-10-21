"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    categoryId?: string;
    amount?: number;
    month?: number;
    year?: number;
    alertThreshold?: number;
  } | null;
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

export function BudgetDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: BudgetDialogProps) {
  const now = new Date();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/categories?type=EXPENSE")
        .then((res) => res.json())
        .then((res) => {
          if (res.data) setCategories(res.data);
          if (initialData) {
            setCategoryId(initialData.categoryId || "");
            setAmount(initialData.amount ? initialData.amount.toString() : "");
            setMonth(initialData.month || now.getMonth() + 1);
            setYear(initialData.year || now.getFullYear());
            setAlertThreshold(
              initialData.alertThreshold ? initialData.alertThreshold.toString() : "80"
            );
          } else if (res.data?.length > 0) {
            setCategoryId(res.data[0].id);
            setAmount("");
            setMonth(now.getMonth() + 1);
            setYear(now.getFullYear());
            setAlertThreshold("80");
          }
        });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Jumlah anggaran harus lebih dari 0");
      return;
    }

    if (!categoryId) {
      toast.error("Pilih kategori pengeluaran");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        categoryId,
        amount: parsedAmount,
        month: Number(month),
        year: Number(year),
        alertThreshold: parseFloat(alertThreshold) || 80,
      };

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan anggaran");

      toast.success(data.message || "Anggaran berhasil disimpan");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Atur Anggaran" : "Tambah Anggaran Bulanan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label required>Kategori Pengeluaran</Label>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={Boolean(initialData?.id)}
            >
              <option value="" disabled>
                -- Pilih Kategori --
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label required>Batas Anggaran (Rp)</Label>
            <Input
              type="number"
              placeholder="Contoh: 2500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-base font-semibold"
            />
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="text-xs text-muted-foreground font-medium">
                {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Bulan</Label>
              <Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                disabled={Boolean(initialData?.id)}
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label required>Tahun</Label>
              <Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={Boolean(initialData?.id)}
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Peringatan Saat Terpakai (%)</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Akan memberikan tanda peringatan kuning jika pengeluaran mencapai {alertThreshold}%
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              Simpan Anggaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
