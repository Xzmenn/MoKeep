import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah (Rp) or other currencies
 */
export function formatCurrency(amount: number, currency: string = "IDR"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  
  if (currency === "IDR") {
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(absVal);

    return isNegative ? `-${formatted}` : formatted;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Parses user input currency string (e.g. "Rp 150.000" or "150.000") to float
 */
export function parseCurrency(input: string | number): number {
  if (typeof input === "number") return input;
  if (!input) return 0;
  // Remove non digits except dot or minus
  const clean = input.replace(/[^0-9,-]/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Format date in full Indonesian locale: e.g. "14 Oktober 2026"
 */
export function formatDateIndo(date: Date | string | number): string {
  try {
    const d = new Date(date);
    return format(d, "dd MMMM yyyy", { locale: id });
  } catch {
    return "-";
  }
}

/**
 * Format date with time: "14 Okt 2026, 09:30"
 */
export function formatDateTimeIndo(date: Date | string | number): string {
  try {
    const d = new Date(date);
    return format(d, "dd MMM yyyy, HH:mm", { locale: id });
  } catch {
    return "-";
  }
}

/**
 * Format short date: "14/10/2026"
 */
export function formatDateShort(date: Date | string | number): string {
  try {
    const d = new Date(date);
    return format(d, "dd/MM/yyyy");
  } catch {
    return "-";
  }
}

export function getAccountTypeLabel(type: string): string {
  switch (type) {
    case "CASH":
      return "Tunai / Kas";
    case "BANK":
      return "Rekening Bank";
    case "EWALLET":
      return "E-Wallet";
    case "CREDIT_CARD":
      return "Kartu Kredit";
    case "INVESTMENT":
      return "Investasi";
    default:
      return type;
  }
}

export function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case "INCOME":
      return "Pemasukan";
    case "EXPENSE":
      return "Pengeluaran";
    case "TRANSFER":
      return "Transfer";
    default:
      return type;
  }
}

export function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case "DAILY":
      return "Harian";
    case "WEEKLY":
      return "Mingguan";
    case "MONTHLY":
      return "Bulanan";
    case "YEARLY":
      return "Tahunan";
    default:
      return frequency;
  }
}
