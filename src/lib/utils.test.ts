import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  formatDateShort,
  getAccountTypeLabel,
  getTransactionTypeLabel,
} from "./utils";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats standard Indonesian Rupiah correctly", () => {
      const formatted = formatCurrency(1500000);
      expect(formatted).toContain("1.500.000");
      expect(formatted).toContain("Rp");
    });

    it("formats zero amount gracefully", () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain("0");
    });

    it("handles negative amounts cleanly with minus sign", () => {
      const formatted = formatCurrency(-50000);
      expect(formatted).toContain("-");
      expect(formatted).toContain("50.000");
    });
  });

  describe("parseCurrency", () => {
    it("parses clean numbers and formatted rupiah strings", () => {
      expect(parseCurrency("150000")).toBe(150000);
      expect(parseCurrency("Rp 250.000")).toBe(250000);
      expect(parseCurrency("Rp 1.500.000")).toBe(1500000);
    });

    it("returns 0 for empty or invalid inputs", () => {
      expect(parseCurrency("")).toBe(0);
      expect(parseCurrency("abc")).toBe(0);
    });
  });

  describe("Labels and Date format", () => {
    it("returns appropriate Indonesian account labels", () => {
      expect(getAccountTypeLabel("CASH")).toBe("Tunai / Kas");
      expect(getAccountTypeLabel("BANK")).toBe("Rekening Bank");
      expect(getAccountTypeLabel("CREDIT_CARD")).toBe("Kartu Kredit");
    });

    it("returns appropriate transaction type labels", () => {
      expect(getTransactionTypeLabel("INCOME")).toBe("Pemasukan");
      expect(getTransactionTypeLabel("EXPENSE")).toBe("Pengeluaran");
      expect(getTransactionTypeLabel("TRANSFER")).toBe("Transfer");
    });

    it("formats date properly", () => {
      const date = new Date(2026, 9, 14); // 14 Oct 2026
      expect(formatDateShort(date)).toBe("14/10/2026");
    });
  });
});
