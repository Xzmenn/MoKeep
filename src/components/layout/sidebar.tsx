"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  PieChart,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/accounts", label: "Akun & Dompet", icon: Wallet },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/budgets", label: "Anggaran (Budget)", icon: PieChart },
  { href: "/goals", label: "Target Tabungan", icon: Target },
  { href: "/reports", label: "Laporan Keuangan", icon: BarChart3 },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen w-64 border-r bg-card/60 backdrop-blur-md sticky top-0 transition-all",
        className
      )}
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Mokeep
          </span>
          <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Pencatat Keuangan
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Menu Utama
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-emerald-500/10 font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User info & Logout */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between p-2 rounded-lg bg-card border shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-foreground">
                {session?.user?.name || "Pengguna Mokeep"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {session?.user?.email || "demo@mokeep.id"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Keluar"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
