"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Lock, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan kata sandi wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error || "Gagal masuk. Periksa email dan password.");
      } else {
        toast.success("Berhasil masuk! Mengarahkan ke dashboard...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan saat masuk");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("demo@mokeep.id");
    setPassword("password123");
    toast.info("Akun demo telah diisi!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-emerald-950/5 to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Mokeep
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Kelola keuangan pribadi Anda dengan mudah dan rapi
          </p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Masuk ke Akun Anda</CardTitle>
            <CardDescription>
              Masukkan email dan kata sandi untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick Demo Fill button */}
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Ingin mencoba langsung?
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Gunakan data akun demo yang sudah terisi
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillDemo}
                className="h-8 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                Isi Akun Demo
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label required>Email</Label>
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label required>Kata Sandi</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Lupa sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 mt-2" isLoading={loading}>
                Masuk <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t py-4 text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="ml-1 text-primary font-semibold hover:underline">
              Daftar Sekarang
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
