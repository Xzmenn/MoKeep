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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
  subCategories?: Array<{ id: string; name: string }>;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    type?: "INCOME" | "EXPENSE" | "TRANSFER";
    amount?: number;
    date?: string;
    accountId?: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    subCategoryId?: string | null;
    note?: string | null;
  } | null;
}

export function TransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: TransactionDialogProps) {
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch accounts and categories on open
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        fetch("/api/accounts").then((res) => res.json()),
        fetch("/api/categories").then((res) => res.json()),
      ])
        .then(([accRes, catRes]) => {
          if (accRes.data) setAccounts(accRes.data);
          if (catRes.data) setCategories(catRes.data);

          if (initialData) {
            setType(initialData.type || "EXPENSE");
            setAmount(initialData.amount ? initialData.amount.toString() : "");
            setDate(
              initialData.date
                ? new Date(initialData.date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0]
            );
            setAccountId(initialData.accountId || "");
            setToAccountId(initialData.toAccountId || "");
            setCategoryId(initialData.categoryId || "");
            setSubCategoryId(initialData.subCategoryId || "");
            setNote(initialData.note || "");
          } else {
            // Default select first account
            if (accRes.data?.length > 0) {
              setAccountId(accRes.data[0].id);
              if (accRes.data.length > 1) {
                setToAccountId(accRes.data[1].id);
              }
            }
            // Reset fields
            setAmount("");
            setNote("");
            setSubCategoryId("");
            setTags("");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, initialData]);

  // Filter categories by selected type
  const availableCategories = categories.filter((c) => c.type === type);

  // Selected category subcategories
  const selectedCat = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCat?.subCategories || [];

  // Current selected account
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Jumlah transaksi harus lebih dari 0");
      return;
    }

    if (!accountId) {
      toast.error("Pilih akun transaksi");
      return;
    }

    if (type === "TRANSFER" && !toAccountId) {
      toast.error("Pilih akun tujuan transfer");
      return;
    }

    if (type === "TRANSFER" && accountId === toAccountId) {
      toast.error("Akun asal dan akun tujuan tidak boleh sama");
      return;
    }

    // Check balance for non-credit cards
    if (
      (type === "EXPENSE" || type === "TRANSFER") &&
      selectedAccount &&
      selectedAccount.type !== "CREDIT_CARD" &&
      selectedAccount.currentBalance < parsedAmount &&
      !initialData // Only strict on new transactions
    ) {
      toast.error(
        `Saldo ${selectedAccount.name} tidak cukup (${formatCurrency(selectedAccount.currentBalance)})`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        date,
        accountId,
        toAccountId: type === "TRANSFER" ? toAccountId : null,
        categoryId: type === "TRANSFER" ? null : categoryId || null,
        subCategoryId: type === "TRANSFER" ? null : subCategoryId || null,
        note: note.trim() || null,
        tags: tags
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const url = initialData?.id
        ? `/api/transactions/${initialData.id}`
        : "/api/transactions";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan transaksi");
      }

      toast.success(data.message || "Transaksi berhasil disimpan");
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
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Ubah Transaksi" : "Catat Transaksi Baru"}
          </DialogTitle>
        </DialogHeader>

        {/* Type Tabs */}
        <Tabs
          value={type}
          onValueChange={(val) => {
            setType(val as "EXPENSE" | "INCOME" | "TRANSFER");
            setCategoryId("");
            setSubCategoryId("");
          }}
          className="mb-4"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger
              value="EXPENSE"
              className="data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
            >
              Pengeluaran
            </TabsTrigger>
            <TabsTrigger
              value="INCOME"
              className="data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
            >
              Pemasukan
            </TabsTrigger>
            <TabsTrigger
              value="TRANSFER"
              className="data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
            >
              Transfer
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div className="space-y-1">
            <Label required>Jumlah (Rp)</Label>
            <Input
              type="number"
              placeholder="Contoh: 50000"
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

          {/* Account selector */}
          <div className="space-y-1">
            <Label required>
              {type === "TRANSFER" ? "Dari Akun (Sumber)" : "Akun / Dompet"}
            </Label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              <option value="" disabled>
                -- Pilih Akun --
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </Select>
          </div>

          {/* Transfer Destination Account */}
          {type === "TRANSFER" && (
            <div className="space-y-1">
              <Label required>Ke Akun (Tujuan)</Label>
              <Select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                <option value="" disabled>
                  -- Pilih Akun Tujuan --
                </option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
              </Select>
            </div>
          )}

          {/* Category & Subcategory (for Income/Expense) */}
          {type !== "TRANSFER" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubCategoryId("");
                  }}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Subkategori</Label>
                <Select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  disabled={subCategories.length === 0}
                >
                  <option value="">-- Tanpa Subkategori --</option>
                  {subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label required>Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Catatan / Keterangan</Label>
              <Input
                type="text"
                placeholder="Contoh: Makan siang nasi padang"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label>Tag (pisahkan dengan koma)</Label>
            <Input
              type="text"
              placeholder="Contoh: Rutin, Liburan, Kerja"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
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
              {initialData?.id ? "Simpan Perubahan" : "Catat Transaksi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
