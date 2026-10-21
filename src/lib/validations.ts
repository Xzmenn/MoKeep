import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  currency: z.string().default("IDR"),
  image: z.string().optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi"),
  type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "INVESTMENT"]),
  balance: z.number().or(z.string().transform((v) => parseFloat(v) || 0)),
  accountNumber: z.string().optional().nullable(),
  color: z.string().default("#3b82f6"),
  icon: z.string().default("Wallet"),
});

export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Akun asal wajib dipilih"),
    toAccountId: z.string().min(1, "Akun tujuan wajib dipilih"),
    amount: z.number().positive("Jumlah transfer harus lebih dari 0"),
    date: z.string().or(z.date()),
    note: z.string().optional().nullable(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Akun asal dan akun tujuan tidak boleh sama",
    path: ["toAccountId"],
  });

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  icon: z.string().default("Tag"),
  color: z.string().default("#10b981"),
});

export const subCategorySchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  name: z.string().min(1, "Nama subkategori wajib diisi"),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  date: z.string().or(z.date()),
  accountId: z.string().min(1, "Akun wajib dipilih"),
  toAccountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  subCategoryId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  amount: z.number().positive("Jumlah budget harus lebih dari 0"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  alertThreshold: z.number().min(1).max(100).default(80),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Nama target wajib diisi"),
  targetAmount: z.number().positive("Jumlah target harus lebih dari 0"),
  currentAmount: z.number().min(0).default(0),
  deadline: z.string().or(z.date()).optional().nullable(),
  accountId: z.string().optional().nullable(),
  color: z.string().default("#8b5cf6"),
  icon: z.string().default("Target"),
});

export const goalContributionSchema = z.object({
  goalId: z.string().min(1, "Target wajib dipilih"),
  amount: z.number().positive("Jumlah kontribusi harus lebih dari 0"),
  date: z.string().or(z.date()).default(() => new Date()),
  note: z.string().optional().nullable(),
});

export const recurringTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("Jumlah transaksi harus lebih dari 0"),
  accountId: z.string().min(1, "Akun wajib dipilih"),
  toAccountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  note: z.string().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;
export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>;
