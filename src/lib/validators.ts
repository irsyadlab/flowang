import { z } from 'zod';

export const walletSchema = z.object({
  name: z.string()
    .min(1, 'Nama wallet wajib diisi')
    .max(50, 'Nama wallet maksimal 50 karakter'),
  initialBalance: z.number()
    .min(0, 'Saldo awal tidak boleh negatif'),
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nama kategori wajib diisi')
    .max(50, 'Nama kategori maksimal 50 karakter'),
  type: z.enum(['income', 'expense', 'both']),
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number()
    .gt(0, 'Jumlah harus lebih dari nol')
    .max(999_999_999_999, 'Jumlah transaksi melebihi batas maksimum'),
  walletId: z.string().min(1, 'Wallet wajib dipilih'),
  toWalletId: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  note: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'transfer') {
    if (!data.toWalletId) {
      ctx.addIssue({ code: 'custom', path: ['toWalletId'], message: 'Wallet tujuan wajib dipilih' });
    } else if (data.toWalletId === data.walletId) {
      ctx.addIssue({ code: 'custom', path: ['toWalletId'], message: 'Wallet sumber dan tujuan tidak boleh sama' });
    }
  } else {
    if (!data.categoryId) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'Kategori wajib dipilih' });
    }
  }
});

// Type exports untuk use di form
export type WalletInput = z.infer<typeof walletSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;