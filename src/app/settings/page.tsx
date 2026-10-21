"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  User,
  Shield,
  Download,
  Upload,
  Database,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setName(res.data.name || "");
          setEmail(res.data.email || "");
          setCurrency(res.data.currency || "IDR");
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil");

      toast.success("Profil dan preferensi berhasil disimpan");
      await updateSession({ name, currency });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Masukkan kata sandi lama");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah kata sandi");

      toast.success("Kata sandi berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pengaturan Akun & Aplikasi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola profil pengguna, keamanan kata sandi, preferensi tema, dan backup data
          </p>
        </div>

        {/* 1. Profil Pengguna */}
        <Card className="border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profil Pengguna</CardTitle>
            </div>
            <CardDescription>
              Informasi identitas akun dan mata uang default
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label required>Nama Lengkap</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Email (Terdaftar)</Label>
                  <Input value={email} disabled className="opacity-70 bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mata Uang Default</Label>
                  <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="IDR">Rupiah Indonesia (IDR - Rp)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                    <option value="EUR">Euro (EUR - €)</option>
                    <option value="SGD">Singapore Dollar (SGD - S$)</option>
                    <option value="MYR">Malaysian Ringgit (MYR - RM)</option>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" isLoading={savingProfile}>
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2. Keamanan & Ganti Sandi */}
        <Card className="border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <CardTitle>Keamanan & Kata Sandi</CardTitle>
            </div>
            <CardDescription>
              Perbarui kata sandi Anda secara berkala untuk menjaga keamanan akun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label required>Kata Sandi Saat Ini</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label required>Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label required>Konfirmasi Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="secondary" isLoading={savingPassword}>
                  Perbarui Kata Sandi
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 3. Tampilan & Mode Tema */}
        <Card className="border">
          <CardHeader>
            <CardTitle>Tampilan Antarmuka</CardTitle>
            <CardDescription>Pilih preferensi mode tampilan yang nyaman</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <Sun className="h-6 w-6 mb-2" />
                <span className="text-xs">Terang</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <Moon className="h-6 w-6 mb-2" />
                <span className="text-xs">Gelap</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  theme === "system"
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                <Laptop className="h-6 w-6 mb-2" />
                <span className="text-xs">Sistem</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 4. Backup, Export & Pemulihan Data */}
        <Card className="border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              <CardTitle>Cadangan & Ekspor Data (Backup)</CardTitle>
            </div>
            <CardDescription>
              Amankan salinan riwayat keuangan Anda secara lokal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-card/50 space-y-2">
                <p className="font-semibold text-sm">Backup Lengkap (Format JSON)</p>
                <p className="text-xs text-muted-foreground">
                  Menyimpan seluruh data akun, kategori, anggaran, target tabungan, dan riwayat transaksi lengkap.
                </p>
                <a href="/api/export?format=json" download className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> Unduh Cadangan JSON
                  </Button>
                </a>
              </div>

              <div className="p-4 rounded-xl border bg-card/50 space-y-2">
                <p className="font-semibold text-sm">Ekspor Transaksi (Format CSV)</p>
                <p className="text-xs text-muted-foreground">
                  Format tabel spreadsheet yang dapat dibuka langsung di Microsoft Excel atau Google Sheets.
                </p>
                <a href="/api/export?format=csv" download className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Unduh Spreadsheet CSV
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
