import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, PieChart, ArrowRightLeft, Smartphone, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-emerald-950/5 to-background">
      {/* Navbar */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            FinKaya
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link href="/register">
            <Button className="shadow-md shadow-emerald-600/20">Daftar Gratis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Aplikasi Keuangan Pribadi Modern #1 di Indonesia</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
          Kendalikan Keuangan Anda,{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            Wujudkan Impian Finansial
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10">
          Catat pemasukan, pengeluaran, transfer rekening, atur anggaran bulanan,
          hingga pantau target tabungan impian dalam satu aplikasi yang cepat,
          aman, dan elegan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 text-base h-12 px-8 shadow-lg shadow-emerald-600/25">
              Coba Demo Sekarang <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full text-base h-12 px-8">
              Buat Akun Baru
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Multi Akun & Dompet</h3>
            <p className="text-sm text-muted-foreground">
              Kelola rekening Bank (BCA, Mandiri, dll), Tunai, E-Wallet (GoPay/OVO), hingga Kartu Kredit dan Investasi.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PieChart className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Budget & Peringatan</h3>
            <p className="text-sm text-muted-foreground">
              Atur batas anggaran bulanan per kategori. Dapatkan peringatan dini sebelum keuangan Anda boncos.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-sm shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Aman & Terisolasi</h3>
            <p className="text-sm text-muted-foreground">
              Data Anda aman dan terisolasi per akun. Fitur export/import CSV, backup berkala, dan PWA siap instal di smartphone.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 FinKaya - Dibuat untuk Pengelolaan Finansial Cerdas Indonesia
      </footer>
    </div>
  );
}
