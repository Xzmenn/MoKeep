"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface TransactionItem {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: string;
  note: string | null;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  subCategoryId: string | null;
  account: { name: string; color: string };
  toAccount?: { name: string; color: string } | null;
  category?: { name: string; color: string; icon: string } | null;
  subCategory?: { name: string } | null;
  tags?: Array<{ tag: { name: string } }>;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Accounts and categories for filters
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Modals
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        fetch("/api/accounts").then((r) => r.json()),
        fetch("/api/categories").then((r) => r.json()),
      ]);
      if (accRes.data) setAccounts(accRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (type) query.append("type", type);
      if (accountId) query.append("accountId", accountId);
      if (categoryId) query.append("categoryId", categoryId);
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);
      if (search) query.append("search", search);
      query.append("page", page.toString());
      query.append("limit", "15");

      const res = await fetch(`/api/transactions?${query.toString()}`);
      const json = await res.json();

      if (json.data) {
        setTransactions(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotalCount(json.pagination.total);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
      toast.error("Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [type, accountId, categoryId, startDate, endDate, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");

      toast.success(data.message || "Transaksi dihapus dan saldo dipulihkan");
      setDeleteId(null);
      fetchTransactions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Pilih file CSV untuk diimpor");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengimpor file");

      toast.success(data.message || "Import transaksi berhasil");
      setImportModalOpen(false);
      setImportFile(null);
      fetchTransactions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengimpor file CSV");
    } finally {
      setImporting(false);
    }
  };

  // Quick summary of loaded page
  const pageIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const pageExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Riwayat Transaksi
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Daftar seluruh aktivitas pemasukan, pengeluaran, dan transfer rekening
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href="/api/export?format=csv" download>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setSelectedTx(null);
                setTxModalOpen(true);
              }}
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Transaksi</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari catatan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </form>

              {/* Type Filter */}
              <div>
                <Select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="">Semua Jenis</option>
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="INCOME">Pemasukan</option>
                  <option value="TRANSFER">Transfer</option>
                </Select>
              </div>

              {/* Account Filter */}
              <div>
                <Select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="">Semua Akun</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Reset filter button */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setType("");
                    setAccountId("");
                    setCategoryId("");
                    setStartDate("");
                    setEndDate("");
                    setPage(1);
                  }}
                  className="w-full text-xs h-9 text-muted-foreground hover:text-foreground"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs font-semibold uppercase text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis & Kategori</th>
                  <th className="px-4 py-3">Akun / Rekening</th>
                  <th className="px-4 py-3">Catatan / Deskripsi</th>
                  <th className="px-4 py-3 text-right">Jumlah (Rp)</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground">
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Tidak ada transaksi yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isIncome = tx.type === "INCOME";
                    const isTransfer = tx.type === "TRANSFER";

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-accent/30 transition-colors group"
                      >
                        {/* Tanggal */}
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateShort(tx.date)}
                        </td>

                        {/* Jenis & Kategori */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : isTransfer
                                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              <CategoryIcon
                                name={tx.category?.icon || (isTransfer ? "ArrowRightLeft" : "Tag")}
                                className="h-3.5 w-3.5"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-foreground">
                                {isTransfer
                                  ? "Transfer"
                                  : tx.category?.name || "Tanpa Kategori"}
                              </p>
                              {tx.subCategory && (
                                <p className="text-[11px] text-muted-foreground">
                                  {tx.subCategory.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Akun */}
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <span className="font-medium text-foreground">{tx.account.name}</span>
                          {isTransfer && tx.toAccount && (
                            <span className="text-muted-foreground ml-1">
                              ➔ {tx.toAccount.name}
                            </span>
                          )}
                        </td>

                        {/* Catatan & Tags */}
                        <td className="px-4 py-3 text-xs text-foreground max-w-xs truncate">
                          <p className="truncate">{tx.note || "-"}</p>
                          {tx.tags && tx.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {tx.tags.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground"
                                >
                                  #{t.tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Jumlah */}
                        <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap">
                          <span
                            className={
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isTransfer
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {isIncome ? "+" : isTransfer ? "" : "-"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setSelectedTx(tx);
                                setTxModalOpen(true);
                              }}
                              className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                              title="Ubah"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(tx.id)}
                              className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Count footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-3 text-xs text-muted-foreground">
            <div>
              Menampilkan {transactions.length} dari {totalCount} total transaksi
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
              </Button>
              <span className="font-semibold px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="h-8 gap-1"
              >
                Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction Modal (Add/Edit) */}
      <TransactionDialog
        open={txModalOpen}
        onOpenChange={setTxModalOpen}
        initialData={selectedTx}
        onSuccess={fetchTransactions}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Transaksi</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus transaksi ini? Saldo pada akun terkait akan dikembalikan ke kondisi sebelum transaksi dicatat.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Hapus Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent onClose={() => setImportModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Impor Transaksi dari File CSV</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Unggah file CSV dengan kolom header: <strong>Tanggal</strong>,{" "}
              <strong>Jenis</strong> (INCOME/EXPENSE/TRANSFER), <strong>Jumlah</strong>,{" "}
              <strong>Akun</strong>, <strong>Kategori</strong>, <strong>Catatan</strong>.
            </p>

            <div className="p-4 border-2 border-dashed rounded-xl text-center space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                required
              />
              {importFile && (
                <p className="text-xs font-semibold text-emerald-600">
                  {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setImportModalOpen(false)}
                disabled={importing}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={importing}>
                Mulai Impor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
