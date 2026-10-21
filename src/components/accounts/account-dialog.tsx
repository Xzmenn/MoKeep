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
import { AVAILABLE_ICONS } from "@/components/category-icon";
import { toast } from "sonner";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    name?: string;
    type?: string;
    balance?: number;
    accountNumber?: string | null;
    color?: string;
    icon?: string;
  } | null;
}

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#14b8a6", // Teal
  "#64748b", // Slate
];

export function AccountDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: AccountDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("CASH");
  const [balance, setBalance] = useState("0");
  const [accountNumber, setAccountNumber] = useState("");
  const [color, setColor] = useState("#10b981");
  const [icon, setIcon] = useState("Wallet");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "CASH");
      setBalance(initialData.balance !== undefined ? initialData.balance.toString() : "0");
      setAccountNumber(initialData.accountNumber || "");
      setColor(initialData.color || "#10b981");
      setIcon(initialData.icon || "Wallet");
    } else {
      setName("");
      setType("CASH");
      setBalance("0");
      setAccountNumber("");
      setColor("#10b981");
      setIcon("Wallet");
    }
  }, [initialData, open]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!initialData) {
      if (newType === "CASH") {
        setIcon("Wallet");
        setColor("#10b981");
      } else if (newType === "EWALLET") {
        setIcon("Smartphone");
        setColor("#0ea5e9");
      } else if (newType === "BANK") {
        setIcon("Landmark");
        setColor("#3b82f6");
      } else if (newType === "CREDIT_CARD") {
        setIcon("CreditCard");
        setColor("#ef4444");
      } else if (newType === "INVESTMENT") {
        setIcon("TrendingUp");
        setColor("#8b5cf6");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama dompet / pocket wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        accountNumber: accountNumber.trim() || null,
        color,
        icon,
      };

      const url = initialData?.id ? `/api/accounts/${initialData.id}` : "/api/accounts";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan akun dompet");

      toast.success(data.message || "Dompet / akun berhasil disimpan");
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
            {initialData?.id ? "Ubah Dompet / Akun" : "Tambah Dompet / Pocket Baru"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label required>Nama Dompet / Pocket</Label>
            <Input
              placeholder="Contoh: Dompet Utama, Uang Jajan, Tabungan, GoPay, BCA"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Jenis Dompet / Akun</Label>
              <Select value={type} onChange={(e) => handleTypeChange(e.target.value)} required>
                <option value="CASH">Kas / Dompet Tunai / Pocket</option>
                <option value="EWALLET">E-Wallet (GoPay/OVO/Dana/ShopeePay)</option>
                <option value="BANK">Rekening Bank</option>
                <option value="CREDIT_CARD">Kartu Kredit</option>
                <option value="INVESTMENT">Investasi (Bibit/Ajaib/Saham)</option>
              </Select>
            </div>

            {!initialData?.id && (
              <div className="space-y-1">
                <Label required>Saldo Awal (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Nomor Rekening / Akun hanya tampil jika relevan dan JELAS OPSIONAL */}
            {type !== "CASH" && (
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {type === "BANK"
                      ? "Nomor Rekening"
                      : type === "CREDIT_CARD"
                      ? "4 Digit Terakhir Kartu"
                      : type === "EWALLET"
                      ? "Nomor HP / Akun"
                      : "Nomor SID / Portofolio"}
                  </Label>
                  <span className="text-xs text-muted-foreground font-normal">
                    (Opsional - boleh dikosongkan)
                  </span>
                </div>
                <Input
                  placeholder={
                    type === "BANK"
                      ? "Contoh: 1234567890 (bebas dikosongkan)"
                      : type === "CREDIT_CARD"
                      ? "Contoh: 4321"
                      : type === "EWALLET"
                      ? "Contoh: 08123456789"
                      : "Opsional"
                  }
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Hanya sebagai catatan pribadi Anda, tidak wajib diisi.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label>Ikon Dompet</Label>
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
            <Label>Warna Dompet</Label>
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
              {initialData?.id ? "Simpan Perubahan" : "Buat Dompet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
