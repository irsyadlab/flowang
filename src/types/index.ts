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

// Loan Tracker types
export type LoanDirection = 'lend' | 'borrow';
export type LoanStatus = 'active' | 'settled';

export interface LoanContact {
  id: string;           // UUID v4
  name: string;         // wajib, maks 100 karakter
  note?: string;        // opsional
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface LoanEntry {
  id: string;           // UUID v4
  contactId: string;    // FK → LoanContact.id
  amount: number;       // > 0, maks 999_999_999_999
  direction: LoanDirection;
  status: LoanStatus;   // default: 'active'
  date: string;         // YYYY-MM-DD
  note?: string;        // opsional
  settledAt?: string;   // ISO 8601, diisi saat status → 'settled'
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

export interface ContactSummary {
  contactId: string;
  totalLend: number;    // sum(amount) where direction='lend' AND status='active'
  totalBorrow: number;  // sum(amount) where direction='borrow' AND status='active'
  hasActiveEntries: boolean;
}

export interface LoanEntryFormData {
  contactId: string;
  amount: number;
  direction: LoanDirection;
  date: string;
  note?: string;
}