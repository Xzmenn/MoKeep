"use client";

import React, { useState } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: {
    id: string;
    name: string;
    remainingAmount: number;
  } | null;
  onSuccess?: () => void;
}

export function ContributionDialog({
  open,
  onOpenChange,
  goal,
  onSuccess,
}: ContributionDialogProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Jumlah kontribusi harus lebih dari 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          date,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat kontribusi");

      toast.success("Kontribusi tabungan berhasil ditambahkan!");
      setAmount("");
      setNote("");
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
          <DialogTitle>Tambah Tabungan ke {goal.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Sisa target yang perlu dikumpulkan:{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(goal.remainingAmount)}
            </span>
          </p>

          <div className="space-y-1">
            <Label required>Jumlah Tabungan (Rp)</Label>
            <Input
              type="number"
              placeholder="Contoh: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg font-semibold"
            />
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="text-xs text-muted-foreground font-medium">
                {formatCurrency(parseFloat(amount))}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label required>Tanggal Setoran</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Catatan (Opsional)</Label>
            <Input
              placeholder="Contoh: Dari sisa uang jajan / bonus freelance"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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
              Setor Tabungan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
