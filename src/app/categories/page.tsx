"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CategoryIcon, AVAILABLE_ICONS } from "@/components/category-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Tag, ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

interface SubCategory {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  icon: string;
  color: string;
  subCategories: SubCategory[];
  _count: { transactions: number; budgets: number };
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");

  // Category Modal (Create / Edit)
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [catIcon, setCatIcon] = useState("Tag");
  const [catColor, setCatColor] = useState("#ef4444");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Subcategory inline state
  const [newSubName, setNewSubName] = useState<{ [catId: string]: string }>({});

  // Delete category state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (json.data) setCategories(json.data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddCategory = () => {
    setEditCategory(null);
    setCatName("");
    setCatType(activeTab);
    setCatIcon("Tag");
    setCatColor(activeTab === "INCOME" ? "#10b981" : activeTab === "TRANSFER" ? "#6366f1" : "#ef4444");
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: CategoryItem) => {
    setEditCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setSubmittingCat(true);
    try {
      const payload = {
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      };

      const url = editCategory?.id ? `/api/categories/${editCategory.id}` : "/api/categories";
      const method = editCategory?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kategori");

      toast.success(data.message || "Kategori berhasil disimpan");
      setCatModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus kategori");

      toast.success("Kategori berhasil dihapus");
      setDeleteId(null);
      fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSubCategory = async (categoryId: string) => {
    const name = newSubName[categoryId]?.trim();
    if (!name) return;

    try {
      const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan subkategori");

      toast.success("Subkategori ditambahkan");
      setNewSubName((prev) => ({ ...prev, [categoryId]: "" }));
      fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan");
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    try {
      const res = await fetch(`/api/categories/_/subcategories?subCategoryId=${subCategoryId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus subkategori");

      toast.success("Subkategori dihapus");
      fetchCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus");
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Kategori & Subkategori
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Atur klasifikasi pos transaksi pengeluaran, pemasukan, dan transfer
            </p>
          </div>

          <Button onClick={openAddCategory} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Tambah Kategori</span>
          </Button>
        </div>

        {/* Tabs for Types */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "EXPENSE" | "INCOME" | "TRANSFER")}
        >
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="EXPENSE">
              Pengeluaran ({categories.filter((c) => c.type === "EXPENSE").length})
            </TabsTrigger>
            <TabsTrigger value="INCOME">
              Pemasukan ({categories.filter((c) => c.type === "INCOME").length})
            </TabsTrigger>
            <TabsTrigger value="TRANSFER">
              Transfer ({categories.filter((c) => c.type === "TRANSFER").length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Memuat kategori...
              </div>
            ) : filteredCategories.length === 0 ? (
              <Card className="border p-8 text-center space-y-3">
                <Tag className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada kategori untuk jenis ini
                </p>
                <Button size="sm" onClick={openAddCategory}>
                  Tambah Kategori Baru
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((cat) => (
                  <Card key={cat.id} className="border flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-base">
                            {cat.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {cat._count.transactions} transaksi
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground"
                          title="Ubah"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CardHeader>

                    {/* Subcategories */}
                    <CardContent className="p-4 pt-2 space-y-3">
                      <div className="space-y-1.5 pt-2 border-t">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Subkategori ({cat.subCategories.length})
                        </p>

                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                          {cat.subCategories.map((sub) => (
                            <span
                              key={sub.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-secondary text-secondary-foreground border"
                            >
                              <span>{sub.name}</span>
                              <button
                                onClick={() => handleDeleteSubCategory(sub.id)}
                                className="text-muted-foreground hover:text-destructive ml-0.5"
                                title="Hapus subkategori"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {cat.subCategories.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">
                              Belum ada subkategori
                            </span>
                          )}
                        </div>

                        {/* Inline add subcategory */}
                        <div className="flex items-center gap-1.5 pt-2">
                          <Input
                            placeholder="Tambah subkategori..."
                            value={newSubName[cat.id] || ""}
                            onChange={(e) =>
                              setNewSubName((prev) => ({
                                ...prev,
                                [cat.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubCategory(cat.id);
                              }
                            }}
                            className="h-8 text-xs"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddSubCategory(cat.id)}
                            className="h-8 px-2 text-xs"
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Add / Edit Category Dialog */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent onClose={() => setCatModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Ubah Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-1">
              <Label required>Nama Kategori</Label>
              <Input
                placeholder="Contoh: Makanan, Transportasi, Gaji"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Jenis Transaksi</Label>
                <Select
                  value={catType}
                  onChange={(e) =>
                    setCatType(e.target.value as "EXPENSE" | "INCOME" | "TRANSFER")
                  }
                  required
                >
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="INCOME">Pemasukan</option>
                  <option value="TRANSFER">Transfer</option>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ikon Kategori</Label>
                <Select value={catIcon} onChange={(e) => setCatIcon(e.target.value)}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Pilih Warna</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCatColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: catColor === c ? "var(--foreground)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatModalOpen(false)}
                disabled={submittingCat}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={submittingCat}>
                {editCategory ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent onClose={() => setDeleteId(null)}>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Kategori</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus kategori ini? Kategori tidak dapat dihapus jika masih ada transaksi terkait.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} isLoading={deleting}>
              Hapus Kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
