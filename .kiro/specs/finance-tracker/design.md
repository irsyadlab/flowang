# Design Document — Flowang (Finance Tracker)

## Overview

Flowang adalah aplikasi pencatatan keuangan personal berbasis web dengan pendekatan **mobile-first** dan **offline-first**. Seluruh data disimpan lokal di browser menggunakan IndexedDB — tidak ada server backend, tidak ada koneksi internet yang dibutuhkan.

Arsitektur aplikasi mengikuti pola **layered unidirectional data flow**:

```
UI Layer (React Components / Pages)
        ↓ dispatch actions
Store Layer (Zustand stores)
        ↓ read/write
Storage Layer (IndexedDB via native API)
```

Setiap operasi data dimulai dari UI, melewati Zustand store yang menjadi single source of truth di memori, lalu dipersistensikan ke IndexedDB. Reaktivitas UI dijamin oleh Zustand subscription — komponen yang subscribe ke store akan re-render otomatis saat state berubah.

### Prinsip Desain Utama

- **Offline-first**: Semua operasi berjalan tanpa koneksi internet. IndexedDB adalah satu-satunya storage.
- **Atomicity**: Operasi yang melibatkan beberapa perubahan (transaksi + saldo wallet) harus berhasil semua atau gagal semua.
- **Single source of truth**: Zustand store menjadi state yang digunakan UI; IndexedDB adalah persistensi jangka panjang.
- **Mobile-first**: Layout dioptimalkan untuk layar 375px ke atas, dengan bottom navigation dan touch target minimal 44×44px.

---

## Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│  Pages: Dashboard, Transactions, Reports, Wallets,      │
│         Categories                                      │
│  Components: TransactionForm, WalletForm, CategoryForm, │
│              BottomNav, SummaryCard, TransactionList    │
│  Hooks: useWallets, useTransactions, useCategories,     │
│         useReports                                      │
└──────────────────────┬──────────────────────────────────┘
                       │ Zustand selectors & actions
┌──────────────────────▼──────────────────────────────────┐
│                    Store Layer                          │
│  walletStore   — daftar wallet + saldo                  │
│  transactionStore — daftar transaksi + filter state     │
│  categoryStore — daftar kategori                        │
│  uiStore       — loading, error, modal state            │
└──────────────────────┬──────────────────────────────────┘
                       │ async read/write
┌──────────────────────▼──────────────────────────────────┐
│                   Storage Layer                         │
│  db.ts         — inisialisasi & koneksi IndexedDB       │
│  walletDb.ts   — CRUD wallet                            │
│  transactionDb.ts — CRUD transaksi (dengan atomicity)   │
│  categoryDb.ts — CRUD kategori                          │
└─────────────────────────────────────────────────────────┘
```

### Struktur Direktori

```
src/
├── App.tsx
├── frontend.tsx
├── index.tsx
├── index.html
│
├── routes/
│   └── index.tsx              # createBrowserRouter config
│
├── layouts/
│   └── AppLayout.tsx          # Shell: BottomNav + <Outlet />
│
├── pages/
│   ├── Dashboard.tsx
│   ├── transactions/
│   │   ├── TransactionsPage.tsx
│   │   ├── NewTransactionPage.tsx
│   │   └── EditTransactionPage.tsx
│   ├── reports/
│   │   └── ReportsPage.tsx
│   ├── wallets/
│   │   ├── WalletsPage.tsx
│   │   ├── NewWalletPage.tsx
│   │   ├── EditWalletPage.tsx
│   │   └── WalletDetailPage.tsx
│   └── categories/
│       ├── CategoriesPage.tsx
│       ├── NewCategoryPage.tsx
│       └── EditCategoryPage.tsx
│
├── components/
│   ├── ui/                    # shadcn/ui components (existing)
│   ├── layout/
│   │   └── BottomNav.tsx
│   ├── dashboard/
│   │   ├── SummaryCard.tsx
│   │   ├── WalletList.tsx
│   │   └── RecentTransactions.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionList.tsx
│   │   ├── TransactionItem.tsx
│   │   └── TransactionFilter.tsx
│   ├── wallets/
│   │   ├── WalletForm.tsx
│   │   ├── WalletItem.tsx
│   │   ├── WalletDetailHeader.tsx
│   │   └── WalletTransactionList.tsx
│   ├── categories/
│   │   ├── CategoryForm.tsx
│   │   └── CategoryItem.tsx
│   ├── reports/
│   │   ├── RealtimeReport.tsx
│   │   ├── MonthlyReport.tsx
│   │   └── CustomReport.tsx
│   └── shared/
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── ConfirmDialog.tsx
│       └── ErrorMessage.tsx
│
├── stores/
│   ├── walletStore.ts
│   ├── transactionStore.ts
│   ├── categoryStore.ts
│   └── uiStore.ts
│
├── db/
│   ├── db.ts                  # koneksi & inisialisasi IndexedDB
│   ├── walletDb.ts
│   ├── transactionDb.ts
│   └── categoryDb.ts
│
├── hooks/
│   ├── useWallets.ts
│   ├── useTransactions.ts
│   ├── useCategories.ts
│   └── useReports.ts
│
├── lib/
│   ├── utils.ts               # cn(), formatCurrency(), formatDate()
│   ├── validators.ts          # Zod schemas
│   └── reportEngine.ts        # kalkulasi laporan
│
└── types/
    └── index.ts               # TypeScript interfaces & enums
```

---

## Components and Interfaces

### Routing Structure

```typescript
// src/routes/index.tsx
createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true,                    element: <Dashboard /> },
      { path: "transactions",           element: <TransactionsPage /> },
      { path: "transactions/new",       element: <NewTransactionPage /> },
      { path: "transactions/:id",       element: <EditTransactionPage /> },
      { path: "reports",                element: <ReportsPage /> },
      { path: "wallets",                element: <WalletsPage /> },
      { path: "wallets/new",            element: <NewWalletPage /> },
      { path: "wallets/:id",            element: <EditWalletPage /> },
      { path: "wallets/:id/detail",     element: <WalletDetailPage /> },
      { path: "categories",             element: <CategoriesPage /> },
      { path: "categories/new",         element: <NewCategoryPage /> },
      { path: "categories/:id",         element: <EditCategoryPage /> },
    ],
  },
]);
```

### AppLayout

Shell utama aplikasi. Menampilkan `<Outlet />` di atas dan `<BottomNav />` di bawah. Layout dibatasi lebar maksimal 480px dan ditengahkan secara horizontal.

```
┌──────────────────────┐
│   Page Content       │  ← <Outlet /> (flex-1, overflow-y-auto)
│   (scrollable)       │
│                      │
├──────────────────────┤
│   Bottom Navigation  │  ← fixed bottom, z-50
│  🏠 💳 📊 👛 🏷️     │
└──────────────────────┘
```

### BottomNav

Navigasi utama dengan 5 item: Dashboard (`/`), Transaksi (`/transactions`), Laporan (`/reports`), Wallet (`/wallets`), Kategori (`/categories`). Item aktif ditandai dengan warna berbeda menggunakan `useMatch` dari React Router.

### Komponen Hierarki per Halaman

**Dashboard**
```
Dashboard
├── SummaryCard (total saldo)
├── MonthSummary (income/expense bulan ini)
├── WalletList
│   └── WalletItem[] (klik → navigasi ke /wallets/:id/detail)
└── RecentTransactions
    └── TransactionItem[]
```

**TransactionsPage**
```
TransactionsPage
├── TransactionFilter (wallet, kategori, tipe, tanggal)
├── TransactionCount (jumlah hasil filter)
└── TransactionList
    └── TransactionItem[] (dengan swipe/tap untuk edit/hapus)
```

**ReportsPage**
```
ReportsPage
├── Tabs (Realtime | Bulanan | Custom)
├── RealtimeReport
│   └── ReportSummary (income, expense, net)
├── MonthlyReport
│   └── MonthlyRow[] (bulan, income, expense)
└── CustomReport
    ├── DateRangePicker
    └── ReportSummary
```

**WalletsPage / CategoriesPage**
```
WalletsPage
├── WalletItem[] (nama, saldo, klik → navigasi ke /wallets/:id/detail)
│   ├── Tombol edit (aksi sekunder)
│   └── Tombol hapus (aksi sekunder)
└── FAB / tombol tambah wallet baru
```

**WalletDetailPage**
```
WalletDetailPage
├── WalletDetailHeader (nama, saldo terkini, saldo awal, total income/expense)
├── Tombol tambah transaksi (pre-filled walletId)
└── WalletTransactionList
    └── TransactionItem[] (klik → navigasi ke edit)
```

### TransactionForm Interface

Form utama untuk membuat dan mengedit transaksi. Menggunakan React Hook Form + Zod.

```
TransactionForm
├── TypeSelector (Income | Expense | Transfer)
├── AmountInput
├── WalletSelect (wallet sumber)
├── ToWalletSelect (hanya tampil jika tipe = Transfer)
├── CategorySelect (tersembunyi jika tipe = Transfer)
├── DatePicker (default: hari ini)
└── NoteInput (opsional)
```

Visibilitas field dikontrol oleh `watch('type')` dari React Hook Form.

### TransactionItem

Komponen untuk menampilkan satu baris transaksi dalam daftar. Jika `transaction.isCorrection === true`:
- Menampilkan badge **"Koreksi Saldo"** sebagai indikator visual yang membedakannya dari transaksi biasa.
- **Menyembunyikan tombol edit dan hapus** — Balance_Correction bersifat read-only dan tidak dapat dimodifikasi secara manual.

---

## Data Models

### TypeScript Interfaces

```typescript
// src/types/index.ts

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
  isCorrection?: boolean; // true untuk Balance_Correction, undefined/false untuk transaksi biasa
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

### Zod Validation Schemas

```typescript
// src/lib/validators.ts

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

// Schema internal untuk Balance_Correction (tidak diekspos ke form pengguna)
export const correctionTransactionSchema = z.object({
  type: z.enum(['adjustment_increase', 'adjustment_decrease']),
  amount: z.number().gt(0),
  walletId: z.string().min(1),
  date: z.string().min(1),
  note: z.string(),
  isCorrection: z.literal(true),
});
```

### Zustand Store Interfaces

```typescript
// walletStore
interface WalletStore {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  loadWallets: () => Promise<void>;
  addWallet: (data: Omit<Wallet, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWallet: (id: string, data: Partial<Wallet>, oldInitialBalance?: number) => Promise<void>;
  // Jika data.initialBalance !== oldInitialBalance, updateWallet secara otomatis membuat
  // Balance_Correction dan menyimpannya bersama perubahan wallet dalam satu IDBTransaction atomik.
  deleteWallet: (id: string) => Promise<void>;
  recalculateBalance: (walletId: string) => Promise<void>;
}

// transactionStore
interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filter: TransactionFilter;
  loadTransactions: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  clearFilter: () => void;
}

// categoryStore
interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

// uiStore
interface UIStore {
  dbReady: boolean;
  dbError: string | null;
  setDbReady: (ready: boolean) => void;
  setDbError: (error: string | null) => void;
}

// TransactionFilter type
interface TransactionFilter {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
}
```

### IndexedDB Schema

Database name: `flowang-db`, version: `1`.

```
Object Stores:
┌─────────────────────────────────────────────────────────┐
│ Store: "wallets"                                        │
│   keyPath: "id"                                         │
│   Indexes: none (lookup by id only)                     │
├─────────────────────────────────────────────────────────┤
│ Store: "transactions"                                   │
│   keyPath: "id"                                         │
│   Indexes:                                              │
│     - "by_walletId"   → walletId   (non-unique)         │
│     - "by_date"       → date       (non-unique)         │
│     - "by_type"       → type       (non-unique)         │
│     - "by_categoryId" → categoryId (non-unique)         │
├─────────────────────────────────────────────────────────┤
│ Store: "categories"                                     │
│   keyPath: "id"                                         │
│   Indexes: none                                         │
└─────────────────────────────────────────────────────────┘
```

### IndexedDB Initialization (`src/db/db.ts`)

```typescript
const DB_NAME = 'flowang-db';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('wallets')) {
        db.createObjectStore('wallets', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by_walletId', 'walletId', { unique: false });
        txStore.createIndex('by_date', 'date', { unique: false });
        txStore.createIndex('by_type', 'type', { unique: false });
        txStore.createIndex('by_categoryId', 'categoryId', { unique: false });
      }

      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

Koneksi DB dibuka sekali saat aplikasi dimuat dan disimpan sebagai singleton. Timeout 5 detik diterapkan menggunakan `Promise.race` dengan `setTimeout`.

### IndexedDB Operations Pattern

Semua operasi DB menggunakan helper yang membungkus IDBRequest ke dalam Promise:

```typescript
// Contoh: transactionDb.ts — addTransaction dengan atomicity
export async function addTransaction(
  db: IDBDatabase,
  transaction: Transaction,
  walletUpdates: { walletId: string; delta: number }[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['transactions', 'wallets'], 'readwrite');
    const txStore = tx.objectStore('transactions');
    const walletStore = tx.objectStore('wallets');

    txStore.add(transaction);

    for (const { walletId, delta } of walletUpdates) {
      const getReq = walletStore.get(walletId);
      getReq.onsuccess = () => {
        const wallet = getReq.result as Wallet;
        wallet.balance += delta;
        wallet.updatedAt = new Date().toISOString();
        walletStore.put(wallet);
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
```

Kunci desain: semua perubahan (transaksi + saldo wallet) berada dalam **satu IDBTransaction** sehingga jika salah satu gagal, seluruh operasi di-rollback otomatis oleh IndexedDB.

---

## Data Flow — Operasi Kritis

### Alur: Tambah Transaksi

```
User submits TransactionForm
        │
        ▼
transactionStore.addTransaction(data)
        │
        ├─ Hitung walletUpdates:
        │    Income:   [{ walletId, delta: +amount }]
        │    Expense:  [{ walletId, delta: -amount }]
        │    Transfer: [{ walletId: src, delta: -amount },
        │               { walletId: dst, delta: +amount }]
        │
        ▼
transactionDb.addTransaction(db, txRecord, walletUpdates)
        │  (satu IDBTransaction mencakup 'transactions' + 'wallets')
        │
        ├─ SUCCESS → store.loadTransactions() + store.loadWallets()
        │            → UI re-renders otomatis via Zustand
        │
        └─ FAILURE → IDB rollback otomatis, tidak ada perubahan parsial
                     → uiStore.setError(message)
```

### Alur: Edit Transaksi

```
User submits edit form
        │
        ▼
transactionStore.updateTransaction(id, newData)
        │
        ├─ Baca transaksi lama dari store
        ├─ Hitung reversal dari transaksi lama (delta terbalik)
        ├─ Hitung delta dari transaksi baru
        ├─ Gabungkan semua walletUpdates (bisa 2–4 wallet berbeda)
        │
        ▼
transactionDb.updateTransaction(db, id, newRecord, walletUpdates)
        │  (satu IDBTransaction: 'transactions' + 'wallets')
        │
        ├─ SUCCESS → reload state
        └─ FAILURE → rollback otomatis
```

### Alur: Hapus Transaksi

```
User confirms delete dialog
        │
        ▼
transactionStore.deleteTransaction(id)
        │
        ├─ Baca transaksi dari store
        ├─ Hitung reversal delta (kebalikan dari efek asli)
        │
        ▼
transactionDb.deleteTransaction(db, id, walletUpdates)
        │  (satu IDBTransaction: 'transactions' + 'wallets')
        │
        ├─ SUCCESS → reload state
        └─ FAILURE → rollback otomatis
```

### Alur: Edit Wallet dengan Balance Correction

```
User submits WalletForm (edit)
        │
        ▼
walletStore.updateWallet(id, newData, oldInitialBalance)
        │
        ├─ Jika newData.initialBalance !== oldInitialBalance:
        │    delta = newData.initialBalance - oldInitialBalance
        │    Buat correctionTx: {
        │      type: delta > 0 ? 'adjustment_increase' : 'adjustment_decrease',
        │      amount: Math.abs(delta),
        │      walletId: id,
        │      date: today,
        │      note: 'Koreksi saldo: [nama wallet]',
        │      isCorrection: true
        │    }
        │
        ▼
walletDb.updateWalletWithCorrection(db, walletData, correctionTx?)
        │  (satu IDBTransaction: 'wallets' + 'transactions')
        │  Jika correctionTx ada: simpan wallet + simpan correctionTx + update balance
        │  Jika tidak ada: hanya update wallet (nama saja)
        │
        ├─ SUCCESS → reload wallets + transactions
        └─ FAILURE → rollback otomatis (tidak ada perubahan parsial)
```

### Report Engine (`src/lib/reportEngine.ts`)

Report Engine beroperasi murni di memori — mengambil array `Transaction[]` dari store dan menghitung agregasi tanpa query tambahan ke IndexedDB.

```typescript
interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;  // totalIncome - totalExpense
}

interface MonthlyReportRow {
  year: number;
  month: number;       // 1–12
  totalIncome: number;
  totalExpense: number;
}

// Filter transaksi berdasarkan rentang tanggal
function filterByDateRange(
  transactions: Transaction[],
  from: string,  // YYYY-MM-DD
  to: string     // YYYY-MM-DD
): Transaction[]

// Hitung summary (Transfer dikecualikan dari income/expense)
function calculateSummary(transactions: Transaction[]): ReportSummary

// Kelompokkan per bulan, urutkan terbaru ke terlama
function groupByMonth(transactions: Transaction[]): MonthlyReportRow[]
```

**Aturan penting**: Transaksi bertipe `transfer` **tidak dihitung** dalam total Income maupun total Expense di semua laporan. Demikian pula, transaksi dengan `isCorrection === true` (Balance_Correction) **tidak dihitung** dalam total Income maupun total Expense — `calculateSummary()` harus mengecualikan keduanya sebelum melakukan agregasi.

---

## Error Handling

### Inisialisasi DB Gagal

Jika `openDB()` gagal atau timeout 5 detik terlampaui:
- `uiStore.setDbError(message)` dipanggil
- `AppLayout` mendeteksi `dbError !== null` dan merender `<ErrorMessage />` fullscreen
- Seluruh konten aplikasi disembunyikan
- Operasi data dinonaktifkan (store actions return early jika `!dbReady`)

### Operasi CRUD Gagal

Setiap action di store dibungkus `try/catch`:
```typescript
try {
  await transactionDb.addTransaction(...)
  await loadTransactions()
  await loadWallets()
} catch (err) {
  set({ error: (err as Error).message })
}
```

Error ditampilkan via toast notification atau inline error message di form.

### Validasi Form

Validasi dilakukan di dua lapisan:
1. **Client-side (Zod + React Hook Form)**: Mencegah submit dengan data invalid, menampilkan pesan error inline di bawah field.
2. **Business logic (store layer)**: Validasi seperti nama duplikat, wallet masih punya transaksi, kategori default — dilakukan sebelum operasi DB.

### Wallet Tidak Bisa Dihapus

Sebelum `deleteWallet`, store mengecek apakah ada transaksi dengan `walletId === id` atau `toWalletId === id`. Jika ada, operasi dibatalkan dan error message ditampilkan.

### Kategori Tidak Bisa Dihapus

Sebelum `deleteCategory`, store mengecek:
1. Apakah `category.isDefault === true` → tolak
2. Apakah ada transaksi dengan `categoryId === id` → tolak

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Wallet Creation Round-Trip

*For any* valid wallet data (name ≤ 50 karakter, initialBalance ≥ 0), setelah wallet disimpan ke IndexedDB dan dibaca kembali, semua field (id, name, initialBalance, balance, createdAt, updatedAt) harus identik dengan data yang disimpan.

**Validates: Requirements 2.1, 2.2, 9.3**

---

### Property 2: Wallet Balance Invariant

*For any* wallet dengan sembarang kombinasi transaksi (income, expense, transfer masuk, transfer keluar), saldo wallet harus selalu sama dengan: `initialBalance + Σ(income) - Σ(expense) - Σ(transferOut) + Σ(transferIn)`.

**Validates: Requirements 9.5, 2.4**

---

### Property 3: Transaction Balance Effect

*For any* wallet dengan saldo awal tertentu, menambahkan transaksi Income sebesar `amount` harus meningkatkan saldo wallet tepat sebesar `amount`; menambahkan transaksi Expense sebesar `amount` harus mengurangi saldo wallet tepat sebesar `amount`.

**Validates: Requirements 4.2, 4.3**

---

### Property 4: Transfer Conservation

*For any* dua wallet berbeda (src ≠ dst) dan sembarang jumlah transfer yang valid, setelah operasi transfer selesai, jumlah saldo kedua wallet harus tetap sama dengan jumlah saldo keduanya sebelum transfer (total saldo terjaga).

**Validates: Requirements 4.4**

---

### Property 5: Transaction Edit Atomicity

*For any* transaksi yang sudah tersimpan, setelah diedit dengan data baru, saldo wallet akhir harus sama dengan: `saldo sebelum edit - efek transaksi lama + efek transaksi baru`. Tidak boleh ada kondisi di mana hanya sebagian perubahan yang tersimpan.

**Validates: Requirements 4.14, 4.15, 9.1**

---

### Property 6: Transaction Delete Round-Trip

*For any* transaksi yang ditambahkan ke wallet, menghapus transaksi tersebut harus mengembalikan saldo wallet ke nilai tepat sebelum transaksi ditambahkan (efek saldo terbalik sepenuhnya).

**Validates: Requirements 4.16**

---

### Property 7: Transaction Storage Round-Trip

*For any* objek transaksi yang valid (semua field: id, type, amount, walletId, categoryId, date, note, createdAt, updatedAt), setelah disimpan ke IndexedDB dan dibaca kembali, semua field harus identik dengan data yang disimpan.

**Validates: Requirements 9.6**

---

### Property 8: Wallet Deletion Protection

*For any* wallet yang memiliki setidaknya satu transaksi terkait (walletId atau toWalletId), upaya penghapusan wallet tersebut harus ditolak dan wallet harus tetap ada di storage.

**Validates: Requirements 2.5**

---

### Property 9: Category Deletion Protection

*For any* kategori yang digunakan oleh setidaknya satu transaksi, upaya penghapusan kategori tersebut harus ditolak dan kategori harus tetap ada di storage.

**Validates: Requirements 3.3**

---

### Property 10: Transaction Filter AND Logic

*For any* kombinasi filter (wallet, kategori, tipe, rentang tanggal), semua transaksi yang dikembalikan harus memenuhi **semua** kriteria filter yang aktif secara bersamaan. Tidak ada transaksi yang lolos filter jika tidak memenuhi salah satu kriteria.

**Validates: Requirements 6.3**

---

### Property 11: Report Transfer Exclusion

*For any* kumpulan transaksi yang mencakup transaksi bertipe Transfer, total Income dan total Expense dalam laporan (Realtime, Bulanan, maupun Custom) harus tidak menyertakan jumlah dari transaksi Transfer.

**Validates: Requirements 5.3, 7.2, 7.3, 7.5**

---

### Property 12: Report Date Range Containment

*For any* rentang tanggal yang valid (startDate ≤ endDate), semua transaksi yang ditampilkan dalam laporan Custom harus memiliki tanggal `>= startDate` dan `<= endDate`. Tidak ada transaksi di luar rentang yang muncul.

**Validates: Requirements 7.5, 7.8**

---

### Property 13: Transaction List Ordering

*For any* kumpulan transaksi, daftar transaksi yang ditampilkan harus diurutkan berdasarkan tanggal transaksi secara descending (terbaru di atas).

**Validates: Requirements 6.1**

---

### Property 14: Wallet Name Uniqueness (Case-Insensitive)

*For any* nama wallet yang sudah ada di storage, upaya membuat wallet baru dengan nama yang sama (perbandingan case-insensitive) harus ditolak oleh validasi.

**Validates: Requirements 2.9**

---

### Property 15: Category Name Uniqueness Per Type (Case-Insensitive)

*For any* nama kategori yang sudah ada untuk tipe tertentu, upaya membuat kategori baru dengan nama yang sama dan tipe yang sama (perbandingan case-insensitive) harus ditolak oleh validasi.

**Validates: Requirements 3.8**

---

### Property 16: Wallet Transaction Completeness

*For any* wallet dengan id tertentu, daftar transaksi yang ditampilkan di Wallet_Detail_Page harus mencakup semua dan hanya transaksi yang memiliki `walletId === id` ATAU `toWalletId === id`. Tidak ada transaksi yang terlewat (completeness) dan tidak ada transaksi dari wallet lain yang muncul (soundness).

**Validates: Requirements 10.3**

---

### Property 17: Balance Correction Atomicity

*For any* perubahan `initialBalance` wallet dari nilai A ke nilai B (A ≠ B), setelah operasi selesai: (1) `wallet.initialBalance` harus sama dengan B, (2) tepat satu Balance_Correction harus tersimpan dengan `amount = |B - A|` dan `type = 'adjustment_increase'` jika B > A atau `type = 'adjustment_decrease'` jika B < A, dan (3) `wallet.balance` harus mencerminkan perubahan tersebut. Jika operasi gagal di tengah jalan, tidak ada perubahan parsial yang tersimpan — baik `initialBalance` wallet maupun Balance_Correction harus kembali ke kondisi sebelum operasi.

**Validates: Requirements 11.1, 11.2, 11.3, 11.9**

---

### Property 18: Balance Correction Exclusion

*For any* kumpulan transaksi yang mencakup satu atau lebih Balance_Correction (`isCorrection === true`), total Income dan total Expense yang dihitung oleh `calculateSummary()` — dan yang ditampilkan di Dashboard, laporan Realtime, Bulanan, maupun Custom — harus tidak menyertakan jumlah (`amount`) dari transaksi Balance_Correction tersebut.

**Validates: Requirements 11.8**

---

## Testing Strategy

### Dual Testing Approach

Pengujian menggunakan dua pendekatan komplementer:

1. **Unit tests (example-based)**: Menguji skenario spesifik, edge cases, dan kondisi error dengan contoh konkret.
2. **Property-based tests**: Menguji properti universal yang harus berlaku untuk semua input valid.

### Property-Based Testing Library

Menggunakan **[fast-check](https://fast-check.dev/)** — library PBT untuk TypeScript/JavaScript yang mature dan well-maintained.

```bash
bun add -d fast-check
```

Setiap property test dikonfigurasi dengan minimum **100 iterasi** (default fast-check adalah 100, bisa ditingkatkan dengan `{ numRuns: 200 }` untuk properti kritis).

### Test Runner

Menggunakan **Bun's built-in test runner** (`bun test`) yang sudah tersedia tanpa konfigurasi tambahan.

### Struktur Test Files

```
src/
└── __tests__/
    ├── db/
    │   ├── walletDb.test.ts       # Property 1, 8
    │   ├── transactionDb.test.ts  # Property 3, 4, 5, 6, 7
    │   └── categoryDb.test.ts     # Property 9
    ├── stores/
    │   ├── walletStore.test.ts    # Property 2, 14, 17, 18
    │   │                          # Property 17: Balance Correction Atomicity
    │   │                          #   — verifikasi wallet.initialBalance, tepat satu
    │   │                          #     Balance_Correction tersimpan, wallet.balance
    │   │                          #     diperbarui, dan rollback jika gagal
    │   │                          # Property 18: Balance Correction Exclusion
    │   │                          #   — verifikasi calculateSummary() mengecualikan
    │   │                          #     transaksi dengan isCorrection === true
    │   └── transactionStore.test.ts # Property 10, 13
    ├── lib/
    │   ├── reportEngine.test.ts   # Property 11, 12, 18
    │   │                          # Property 18: Balance Correction Exclusion
    │   │                          #   — verifikasi reportEngine.calculateSummary()
    │   │                          #     mengecualikan Balance_Correction dari
    │   │                          #     total Income dan Expense di semua laporan
    │   ├── validators.test.ts     # Property 15, edge cases
    │   └── walletTransactionFilter.test.ts  # Property 16
    └── integration/
        ├── dbInit.test.ts         # Smoke: DB initialization
        └── defaultCategories.test.ts # Example: 9 default categories
```

### Property Test Tag Format

Setiap property test diberi komentar tag untuk traceability:

```typescript
// Feature: finance-tracker, Property 7: Transaction Storage Round-Trip
test.prop([arbitraryTransaction])('transaction round-trip', async (tx) => {
  await transactionDb.add(db, tx);
  const result = await transactionDb.getById(db, tx.id);
  expect(result).toEqual(tx);
});
```

### fast-check Arbitraries

```typescript
// Arbitrary untuk data valid
const arbitraryWallet = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  initialBalance: fc.float({ min: 0, max: 1_000_000 }),
  balance: fc.float({ min: 0, max: 1_000_000 }),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
});

const arbitraryTransaction = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('income', 'expense', 'transfer'),
  amount: fc.float({ min: 0.01, max: 999_999_999_999 }),
  walletId: fc.uuid(),
  date: fc.date().map(d => d.toISOString().split('T')[0]),
  note: fc.option(fc.string(), { nil: undefined }),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
});
```

### Unit Test Coverage

Unit tests (example-based) fokus pada:
- **Smoke tests**: Inisialisasi DB berhasil, semua object stores tersedia
- **Default categories**: Tepat 9 kategori default dengan nama dan tipe yang benar
- **Form validation edge cases**: Input kosong, karakter batas (50), nilai batas (0, negatif, 999_999_999_999+1)
- **UI state**: Empty state, loading state, error state
- **Dialog konfirmasi**: Muncul sebelum operasi hapus
- **Field visibility**: Field toWallet muncul/tersembunyi berdasarkan tipe transaksi

### Integration Tests

- Verifikasi DB dapat dibuka dan ditutup tanpa error
- Verifikasi data persists setelah koneksi DB ditutup dan dibuka kembali
- Verifikasi operasi CRUD end-to-end (tanpa mock)

### Testing Constraints

- Property tests **tidak boleh** melakukan network request
- IndexedDB di test environment menggunakan **fake-indexeddb** (`bun add -d fake-indexeddb`) untuk isolasi
- Setiap test harus membersihkan state DB setelah selesai (`afterEach`)
- Property tests untuk operasi atomicity menggunakan mock yang mensimulasikan kegagalan mid-operation
