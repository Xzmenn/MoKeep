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
import { AVAILABLE_ICONS } from "@/components/category-icon";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
}

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string | null;
    accountId?: string | null;
    color?: string;
    icon?: string;
  } | null;
}

const PRESET_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
];

export function GoalDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: GoalDialogProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [accountId, setAccountId] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [icon, setIcon] = useState("Target");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/accounts")
        .then((res) => res.json())
        .then((res) => {
          if (res.data) setAccounts(res.data);
          if (initialData) {
            setName(initialData.name || "");
            setTargetAmount(
              initialData.targetAmount ? initialData.targetAmount.toString() : ""
            );
            setCurrentAmount(
              initialData.currentAmount !== undefined
                ? initialData.currentAmount.toString()
                : "0"
            );
            setDeadline(
              initialData.deadline
                ? new Date(initialData.deadline).toISOString().split("T")[0]
                : ""
            );
            setAccountId(initialData.accountId || "");
            setColor(initialData.color || "#8b5cf6");
            setIcon(initialData.icon || "Target");
          } else {
            setName("");
            setTargetAmount("");
            setCurrentAmount("0");
            setDeadline("");
            setAccountId("");
            setColor("#8b5cf6");
            setIcon("Target");
          }
        });
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      toast.error("Target dana harus lebih dari 0");
      return;
    }

    if (!name.trim()) {
      toast.error("Nama target tabungan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
        accountId: accountId || null,
        color,
        icon,
      };

      const url = initialData?.id ? `/api/goals/${initialData.id}` : "/api/goals";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan target");

      toast.success(data.message || "Target tabungan berhasil disimpan");
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
            {initialData?.id ? "Ubah Target Tabungan" : "Tambah Target Tabungan Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label required>Nama Target / Impian</Label>
            <Input
              placeholder="Contoh: Dana Darurat, Beli Motor, Liburan Jepang"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Jumlah Target (Rp)</Label>
              <Input
                type="number"
                placeholder="Contoh: 15000000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
              {targetAmount && !isNaN(parseFloat(targetAmount)) && (
                <p className="text-xs text-muted-foreground font-medium">
                  {formatCurrency(parseFloat(targetAmount))}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Tenggat Waktu / Target Tercapai</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Akun Rekening Terkait (Opsional)</Label>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">-- Tanpa Akun Khusus --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Ikon Impian</Label>
              <Select value={icon} onChange={(e) => setIcon(e.target.value)}>
                {AVAILABLE_ICONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Color palette */}
          <div className="space-y-1.5">
            <Label>Warna Aksen</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "var(--foreground)" : "transparent",
                  }}
                />
              ))}
            </div>
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
              {initialData?.id ? "Simpan Perubahan" : "Buat Target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
