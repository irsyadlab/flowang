export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment_increase' | 'adjustment_decrease';
export type CategoryType = 'income' | 'expense' | 'both';

export interface Wallet {
  id: string;           // UUID v4
  name: string;         // maks 50 karakter
  initialBalance: number; // >= 0
  balance: number;      // dihitung: initialBalance + sum(income) - sum(expense) - sum(transferOut) + sum(transferIn)
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface Category {
  id: string;           // UUID v4
  name: string;         // maks 50 karakter
  type: CategoryType;
  isDefault: boolean;
  createdAt: string;    // ISO 8601
}

export interface Transaction {
  id: string;           // UUID v4
  type: TransactionType;
  amount: number;       // > 0, maks 999_999_999_999
  walletId: string;     // FK → Wallet.id (wallet sumber)
  toWalletId?: string;  // FK → Wallet.id (hanya untuk transfer)
  categoryId?: string;  // FK → Category.id (wajib untuk income/expense)
  date: string;         // ISO 8601 date string (YYYY-MM-DD)
  note?: string;
  isCorrection?: boolean; // true untuk transaksi koreksi saldo
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface TransactionFilter {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
}