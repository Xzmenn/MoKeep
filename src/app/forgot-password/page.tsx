"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses permohonan");

      setSubmitted(true);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
      toast.success(data.message || "Instruksi reset berhasil dibuat");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-emerald-950/5 to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              FinKaya
            </span>
          </Link>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Lupa Kata Sandi?</CardTitle>
            <CardDescription>
              Masukkan alamat email terdaftar untuk menerima petunjuk pemulihan
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="space-y-4 text-center py-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm text-foreground">
                  Instruksi reset kata sandi telah dikirim ke <strong>{email}</strong>.
                </p>

                {resetToken && (
                  <div className="p-3 rounded-lg bg-muted text-left space-y-2 text-xs">
                    <p className="font-semibold text-foreground">
                      Tautan Reset Cepat (Mode Demo / Lokal):
                    </p>
                    <Link
                      href={`/reset-password?token=${resetToken}`}
                      className="text-primary hover:underline break-all block"
                    >
                      Buka Halaman Reset Password &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Email Terdaftar</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" isLoading={loading}>
                  Kirim Instruksi Reset
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t py-4 text-sm text-muted-foreground">
            <Link href="/login" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Halaman Masuk
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
