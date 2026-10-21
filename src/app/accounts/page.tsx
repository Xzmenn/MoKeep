"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getAccountTypeLabel } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import {
  Plus,
  ArrowRightLeft,
  Edit,
  Trash2,
  Archive,
  CreditCard,
  Building,
  Landmark,
  Wallet,
  ShieldCheck,
  Smartphone,
  PiggyBank,
} from "lucide-react";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  currentBalance: number;
  accountNumber: string | null;
  color: string;
  icon: string;
  isArchived: boolean;
  _count: { transactions: number };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);

  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Delete / Archive state
  const [deleteAccount, setDeleteAccount] = useState<AccountItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts?includeArchived=true");
      const json = await res.json();
      if (json.data) setAccounts(json.data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat akun");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalNetWorth = accounts
    .filter((a) => !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const archivedAccounts = accounts.filter((a) => a.isArchived);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(transferAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Nominal transfer harus lebih dari 0");
      return;
    }
    if (!fromAccountId || !toAccountId) {
      toast.error("Pilih akun asal dan tujuan transfer");
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error("Akun asal dan tujuan tidak boleh sama");
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch("/api/accounts/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: parsed,
          date: new Date().toISOString(),
          note: transferNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal transfer");

      toast.success("Transfer antar akun berhasil dicatat!");
      setTransferModalOpen(false);
      setTransferAmount("");
      setTransferNote("");
      fetchAccounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setTransferring(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${deleteAccount.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses");

      toast.success(data.message || "Akun berhasil diproses");
      setDeleteAccount(null);
      fetchAccounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleArchive = async (acc: AccountItem) => {
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !acc.isArchived }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        acc.isArchived
          ? `Akun '${acc.name}' telah diaktifkan kembali`
          : `Akun '${acc.name}' telah diarsipkan`
      );
      fetchAccounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah arsip akun");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Manajemen Akun & Dompet
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelola rekening bank, uang tunai, e-wallet, kartu kredit, dan portofolio investasi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (activeAccounts.length >= 2) {
                  setFromAccountId(activeAccounts[0].id);
                  setToAccountId(activeAccounts[1].id);
                }
                setTransferModalOpen(true);
              }}
              className="gap-1.5"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Transfer Antar Dompet</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setSelectedAccount(null);
                setAccountModalOpen(true);
              }}
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Dompet / Akun</span>
            </Button>
          </div>
        </div>

        {/* Total Net Worth Card */}
        <Card className="border bg-gradient-to-r from-card via-card to-emerald-950/10">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Total Saldo Bersih Aktif (Net Worth)
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mt-1">
                  {formatCurrency(totalNetWorth)}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Tersebar di {activeAccounts.length} akun dompet aktif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Accounts Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Akun Aktif ({activeAccounts.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAccounts.map((acc) => (
              <Card
                key={acc.id}
                className="border hover:shadow-md transition-all relative overflow-hidden"
              >
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: acc.color }}
                />
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: acc.color }}
                      >
                        <CategoryIcon name={acc.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base leading-tight">
                          {acc.name}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {getAccountTypeLabel(acc.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {formatCurrency(acc.currentBalance)}
                    </p>
                    {acc.accountNumber && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No: {acc.accountNumber}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{acc._count.transactions} transaksi</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedAccount(acc);
                          setAccountModalOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-accent text-foreground"
                        title="Ubah"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(acc)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Arsipkan"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteAccount(acc)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Hapus / Arsipkan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Archived Accounts if any */}
        {archivedAccounts.length > 0 && (
          <div className="space-y-3 pt-6 border-t">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Akun Diarsipkan ({archivedAccounts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedAccounts.map((acc) => (
                <Card key={acc.id} className="border border-dashed opacity-75">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm line-through text-muted-foreground">
                        {acc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo terakhir: {formatCurrency(acc.currentBalance)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleArchive(acc)}
                      className="text-xs h-8"
                    >
                      Aktifkan Lagi
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Dialog (Add/Edit) */}
      <AccountDialog
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
        initialData={selectedAccount}
        onSuccess={fetchAccounts}
      />

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent onClose={() => setTransferModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Transfer Antar Rekening</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Dari Akun (Sumber)</Label>
                <Select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  required
                >
                  {activeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.currentBalance)})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <Label required>Ke Akun (Tujuan)</Label>
                <Select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                >
                  {activeAccounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label required>Nominal Transfer (Rp)</Label>
              <Input
                type="number"
                placeholder="Contoh: 250000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                className="text-base font-semibold"
              />
              {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                <p className="text-xs text-muted-foreground font-medium">
                  {formatCurrency(parseFloat(transferAmount))}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Catatan (Opsional)</Label>
              <Input
                placeholder="Contoh: Topup e-wallet mingguan"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferModalOpen(false)}
                disabled={transferring}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={transferring}>
                Kirim Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete / Archive Confirm Modal */}
      <Dialog open={Boolean(deleteAccount)} onOpenChange={(o) => !o && setDeleteAccount(null)}>
        <DialogContent onClose={() => setDeleteAccount(null)}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Akun</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus akun <strong>{deleteAccount?.name}</strong>? Jika akun ini memiliki riwayat transaksi, akun akan diarsipkan secara aman agar riwayat transaksi tetap terjaga.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccount(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>
              Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
