"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Token reset password tidak ditemukan pada URL");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }

    if (password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kata sandi");

      setSuccess(true);
      toast.success("Kata sandi berhasil diperbarui!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border shadow-lg">
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-destructive font-semibold">
            Tautan reset password tidak valid atau tidak memiliki token.
          </p>
          <Link href="/forgot-password">
            <Button variant="outline">Minta Tautan Baru</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">Setel Ulang Kata Sandi</CardTitle>
        <CardDescription>
          Masukkan kata sandi baru untuk akun Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold">Kata sandi berhasil diubah!</p>
            <p className="text-xs text-muted-foreground">
              Mengarahkan Anda ke halaman masuk...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label required>Kata Sandi Baru</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label required>Konfirmasi Kata Sandi Baru</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 mt-2" isLoading={loading}>
              Simpan Kata Sandi Baru <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t py-4 text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Kembali ke Masuk
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-emerald-950/5 to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Mokeep
            </span>
          </Link>
        </div>

        <Suspense fallback={<div>Memuat...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
