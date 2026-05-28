# Implementation Plan: Flowang (Finance Tracker)

## Overview

Implementasi Flowang mengikuti arsitektur layered unidirectional data flow: Storage Layer → Store Layer → UI Layer. Urutan implementasi dimulai dari fondasi (types, db, stores, utils), kemudian layout dan navigasi, lalu fitur-fitur utama (wallet, kategori, transaksi), diikuti dashboard, riwayat, laporan, dan diakhiri dengan shared components dan property-based tests.

Stack: React 19, React Router v7, Tailwind CSS v4, shadcn/ui, Zustand, IndexedDB (native API), React Hook Form + Zod, Lucide React, Bun. Testing: fast-check + Bun test runner + fake-indexeddb.

---

## Tasks

- [x] 1. Setup fondasi: types, db layer, stores, dan utils
  - [x] 1.1 Buat TypeScript interfaces dan enums di `src/types/index.ts`
    - Definisikan `TransactionType`, `CategoryType`, interface `Wallet`, `Category`, `Transaction`, `TransactionFilter`
    - _Requirements: 2.2, 4.1, 3.1_

  - [x] 1.2 Buat utility functions di `src/lib/utils.ts` dan `src/lib/reportEngine.ts`
    - Tambahkan `formatCurrency()` dan `formatDate()` ke `utils.ts` (pertahankan `cn()` yang sudah ada)
    - Buat `src/lib/reportEngine.ts` dengan fungsi `filterByDateRange()`, `calculateSummary()`, `groupByMonth()`
    - _Requirements: 7.2, 7.3, 7.5, 5.3_

  - [x] 1.3 Buat Zod validation schemas di `src/lib/validators.ts`
    - Implementasikan `walletSchema`, `categorySchema`, `transactionSchema` (dengan `superRefine` untuk validasi transfer)
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 3.7, 3.8, 3.9, 4.8, 4.9, 4.10, 4.11, 4.12_

  - [x] 1.4 Buat IndexedDB layer: `src/db/db.ts`
    - Implementasikan `openDB()` dengan `onupgradeneeded` untuk membuat object stores `wallets`, `transactions` (dengan indexes), `categories`
    - Terapkan timeout 5 detik menggunakan `Promise.race`
    - Simpan koneksi sebagai singleton
    - _Requirements: 1.1, 1.4_

  - [x] 1.5 Buat `src/db/walletDb.ts`
    - Implementasikan fungsi: `getAllWallets()`, `getWalletById()`, `addWallet()`, `updateWallet()`, `deleteWallet()`
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [x] 1.6 Buat `src/db/categoryDb.ts`
    - Implementasikan fungsi: `getAllCategories()`, `getCategoryById()`, `addCategory()`, `updateCategory()`, `deleteCategory()`
    - Sertakan logika seeding 9 kategori default saat storage kosong
    - _Requirements: 1.2, 3.1, 3.2, 3.6_

  - [x] 1.7 Buat `src/db/transactionDb.ts`
    - Implementasikan `addTransaction(db, transaction, walletUpdates[])` dalam satu IDBTransaction atomik
    - Implementasikan `updateTransaction(db, id, newRecord, walletUpdates[])` dalam satu IDBTransaction atomik
    - Implementasikan `deleteTransaction(db, id, walletUpdates[])` dalam satu IDBTransaction atomik
    - Implementasikan `getAllTransactions()`, `getTransactionById()`, `getTransactionsByWalletId()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.14, 4.15, 4.16, 9.1, 9.2_

  - [x] 1.8 Buat Zustand stores: `src/stores/uiStore.ts`, `src/stores/walletStore.ts`, `src/stores/categoryStore.ts`, `src/stores/transactionStore.ts`
    - `uiStore`: state `dbReady`, `dbError`, actions `setDbReady`, `setDbError`
    - `walletStore`: state `wallets`, `isLoading`, `error`; actions `loadWallets`, `addWallet`, `updateWallet`, `deleteWallet`, `recalculateBalance`
    - `categoryStore`: state `categories`, `isLoading`, `error`; actions `loadCategories`, `addCategory`, `updateCategory`, `deleteCategory`
    - `transactionStore`: state `transactions`, `isLoading`, `error`, `filter`; actions `loadTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`, `setFilter`, `clearFilter`
    - Setiap action store harus return early jika `!dbReady`
    - _Requirements: 1.3, 1.4, 2.5, 3.3, 3.4, 4.5, 9.1, 9.2_

  - [x] 1.9 Buat custom hooks: `src/hooks/useWallets.ts`, `src/hooks/useTransactions.ts`, `src/hooks/useCategories.ts`, `src/hooks/useReports.ts`
    - Setiap hook mengekspos data dan actions dari store yang relevan
    - `useReports` menghitung summary menggunakan `reportEngine` dari data di `transactionStore`
    - _Requirements: 5.1, 5.2, 5.3, 7.2, 7.3, 7.5_

- [ ] 2. Inisialisasi aplikasi, AppLayout, BottomNav, dan routing
  - [x] 2.1 Update `src/App.tsx` untuk inisialisasi DB saat mount
    - Panggil `openDB()` di `useEffect`, set `uiStore.setDbReady(true)` jika berhasil, `setDbError(message)` jika gagal/timeout
    - Seed kategori default jika storage kosong (panggil `categoryStore.loadCategories()` setelah DB ready)
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 2.2 Update `src/layouts/AppLayout.tsx`
    - Ubah layout menjadi: max-width 480px, centered horizontal, tinggi penuh layar
    - Tambahkan `<BottomNav />` fixed di bawah dan `<Outlet />` di area scrollable
    - Jika `dbError !== null`, render `<ErrorMessage />` fullscreen dan sembunyikan konten
    - Jika `!dbReady`, render `<LoadingSpinner />` fullscreen
    - _Requirements: 1.4, 8.2, 8.4_

  - [ ] 2.3 Buat `src/components/layout/BottomNav.tsx`
    - 5 item navigasi: Dashboard (`/`), Transaksi (`/transactions`), Laporan (`/reports`), Wallet (`/wallets`), Kategori (`/categories`)
    - Gunakan `useMatch` dari React Router untuk highlight item aktif
    - Ikon dari Lucide React, touch target minimal 44×44px
    - _Requirements: 8.1, 8.3, 8.6_

  - [ ] 2.4 Update `src/routes/index.tsx` dengan semua route
    - Tambahkan semua route sesuai design: `/transactions`, `/transactions/new`, `/transactions/:id`, `/reports`, `/wallets`, `/wallets/new`, `/wallets/:id`, `/categories`, `/categories/new`, `/categories/:id`
    - _Requirements: 8.1, 8.5_

- [ ] 3. Wallet management (CRUD)
  - [ ] 3.1 Buat `src/components/wallets/WalletForm.tsx`
    - Form dengan React Hook Form + Zod (`walletSchema`)
    - Field: nama wallet, saldo awal
    - Validasi duplikat nama (case-insensitive) dengan mengecek `walletStore.wallets`
    - Tampilkan pesan error inline di bawah setiap field
    - _Requirements: 2.1, 2.3, 2.8, 2.9, 2.10, 2.11_

  - [ ] 3.2 Buat `src/components/wallets/WalletItem.tsx`
    - Tampilkan nama wallet dan saldo terkini dengan format currency
    - Tombol edit (navigasi ke `/wallets/:id`) dan hapus (trigger `ConfirmDialog`)
    - Touch target minimal 44×44px
    - _Requirements: 2.7, 8.3_

  - [ ] 3.3 Buat halaman `src/pages/wallets/WalletsPage.tsx`
    - Daftar semua wallet menggunakan `WalletItem`
    - Tombol tambah wallet baru (navigasi ke `/wallets/new`)
    - Tampilkan `EmptyState` jika tidak ada wallet
    - Tampilkan `LoadingSpinner` saat loading
    - _Requirements: 2.7, 5.6, 5.7_

  - [ ] 3.4 Buat halaman `src/pages/wallets/NewWalletPage.tsx`
    - Render `WalletForm` untuk membuat wallet baru
    - Setelah submit berhasil, navigasi kembali ke `/wallets`
    - _Requirements: 2.1, 2.2_

  - [ ] 3.5 Buat halaman `src/pages/wallets/EditWalletPage.tsx`
    - Ambil wallet berdasarkan `:id` dari `walletStore`
    - Render `WalletForm` dengan data wallet yang sudah ada (pre-filled)
    - Setelah edit berhasil, panggil `recalculateBalance` dan navigasi kembali ke `/wallets`
    - Jika wallet tidak ditemukan, tampilkan `ErrorMessage`
    - _Requirements: 2.3, 2.4_

  - [ ] 3.6 Implementasikan logika hapus wallet di `walletStore.deleteWallet`
    - Cek apakah ada transaksi dengan `walletId === id` atau `toWalletId === id`
    - Jika ada, set error message "wallet tidak dapat dihapus karena masih memiliki transaksi"
    - Jika tidak ada, hapus dari IndexedDB dan update state
    - _Requirements: 2.5, 2.6_

- [ ] 4. Category management (CRUD)
  - [ ] 4.1 Buat `src/components/categories/CategoryForm.tsx`
    - Form dengan React Hook Form + Zod (`categorySchema`)
    - Field: nama kategori, tipe (income/expense/both) menggunakan Select dari shadcn/ui
    - Validasi duplikat nama per tipe (case-insensitive) dengan mengecek `categoryStore.categories`
    - _Requirements: 3.1, 3.2, 3.7, 3.8, 3.9_

  - [ ] 4.2 Buat `src/components/categories/CategoryItem.tsx`
    - Tampilkan nama kategori dan badge tipe
    - Tombol edit dan hapus; tombol hapus disabled untuk kategori default (`isDefault === true`)
    - _Requirements: 3.4, 3.6_

  - [ ] 4.3 Buat halaman `src/pages/categories/CategoriesPage.tsx`
    - Daftar semua kategori menggunakan `CategoryItem`
    - Tombol tambah kategori baru
    - Tampilkan `EmptyState` dan `LoadingSpinner` sesuai state
    - _Requirements: 3.6_

  - [ ] 4.4 Buat halaman `src/pages/categories/NewCategoryPage.tsx` dan `src/pages/categories/EditCategoryPage.tsx`
    - `NewCategoryPage`: render `CategoryForm` untuk membuat kategori baru
    - `EditCategoryPage`: ambil kategori berdasarkan `:id`, render `CategoryForm` pre-filled
    - Navigasi kembali ke `/categories` setelah operasi berhasil
    - _Requirements: 3.1, 3.2_

  - [ ] 4.5 Implementasikan logika hapus kategori di `categoryStore.deleteCategory`
    - Cek `category.isDefault === true` → tolak dengan pesan "kategori default tidak dapat dihapus"
    - Cek apakah ada transaksi dengan `categoryId === id` → tolak dengan pesan "kategori masih digunakan"
    - Jika lolos kedua cek, hapus dari IndexedDB dan update state
    - _Requirements: 3.3, 3.4, 3.5_

- [ ] 5. Transaction management (CRUD + atomicity)
  - [ ] 5.1 Buat `src/components/transactions/TransactionForm.tsx`
    - Form dengan React Hook Form + Zod (`transactionSchema`)
    - Field: TypeSelector (Income/Expense/Transfer), AmountInput, WalletSelect, ToWalletSelect, CategorySelect, DatePicker (default hari ini), NoteInput (opsional)
    - Kontrol visibilitas field dengan `watch('type')`: tampilkan `ToWalletSelect` dan sembunyikan `CategorySelect` jika tipe = Transfer
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13_

  - [ ] 5.2 Implementasikan `transactionStore.addTransaction`
    - Hitung `walletUpdates` berdasarkan tipe: Income (+amount), Expense (-amount), Transfer (-amount src, +amount dst)
    - Panggil `transactionDb.addTransaction(db, record, walletUpdates)` dalam satu IDBTransaction
    - Setelah berhasil, reload `transactions` dan `wallets` di store
    - Jika gagal, set error message (IDB rollback otomatis)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 9.1_

  - [ ]* 5.3 Tulis property test untuk Transaction Balance Effect (Property 3)
    - **Property 3: Transaction Balance Effect**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 5.4 Tulis property test untuk Transfer Conservation (Property 4)
    - **Property 4: Transfer Conservation**
    - **Validates: Requirements 4.4**

  - [ ] 5.5 Implementasikan `transactionStore.updateTransaction`
    - Baca transaksi lama dari store, hitung reversal delta
    - Hitung delta dari transaksi baru, gabungkan semua `walletUpdates` (bisa 2–4 wallet)
    - Panggil `transactionDb.updateTransaction(db, id, newRecord, walletUpdates)` dalam satu IDBTransaction
    - _Requirements: 4.14, 4.15, 9.1_

  - [ ]* 5.6 Tulis property test untuk Transaction Edit Atomicity (Property 5)
    - **Property 5: Transaction Edit Atomicity**
    - **Validates: Requirements 4.14, 4.15, 9.1**

  - [ ] 5.7 Implementasikan `transactionStore.deleteTransaction`
    - Baca transaksi dari store, hitung reversal delta
    - Panggil `transactionDb.deleteTransaction(db, id, walletUpdates)` dalam satu IDBTransaction
    - Tampilkan `ConfirmDialog` sebelum eksekusi hapus
    - _Requirements: 4.16, 9.1_

  - [ ]* 5.8 Tulis property test untuk Transaction Delete Round-Trip (Property 6)
    - **Property 6: Transaction Delete Round-Trip**
    - **Validates: Requirements 4.16**

  - [ ] 5.9 Buat `src/components/transactions/TransactionItem.tsx`
    - Tampilkan tipe, jumlah (format currency), nama wallet, nama kategori, tanggal, catatan
    - Tombol edit (navigasi ke `/transactions/:id`) dan hapus (trigger `ConfirmDialog`)
    - _Requirements: 4.16, 8.3_

  - [ ] 5.10 Buat halaman `src/pages/transactions/NewTransactionPage.tsx` dan `src/pages/transactions/EditTransactionPage.tsx`
    - `NewTransactionPage`: render `TransactionForm` untuk membuat transaksi baru
    - `EditTransactionPage`: ambil transaksi berdasarkan `:id`, render `TransactionForm` pre-filled
    - Navigasi kembali ke `/transactions` setelah operasi berhasil
    - _Requirements: 4.1, 4.14, 4.15_

- [ ] 6. Checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

- [ ] 7. Dashboard
  - [ ] 7.1 Buat `src/components/dashboard/SummaryCard.tsx`
    - Tampilkan total saldo keseluruhan (penjumlahan semua `wallet.balance`)
    - Tampilkan total Income dan total Expense bulan berjalan (tanggal 1 s/d hari ini, Transfer dikecualikan)
    - _Requirements: 5.1, 5.3_

  - [ ] 7.2 Buat `src/components/dashboard/WalletList.tsx`
    - Daftar semua wallet dengan nama dan saldo terkini
    - Tampilkan `EmptyState` jika tidak ada wallet
    - _Requirements: 5.2, 5.6_

  - [ ] 7.3 Buat `src/components/dashboard/RecentTransactions.tsx`
    - Tampilkan 5 transaksi terbaru berdasarkan tanggal descending menggunakan `TransactionItem`
    - _Requirements: 5.4_

  - [ ] 7.4 Buat halaman `src/pages/Dashboard.tsx`
    - Susun `SummaryCard`, `WalletList`, `RecentTransactions`
    - Subscribe ke `walletStore` dan `transactionStore` — UI update otomatis via Zustand
    - Tampilkan `LoadingSpinner` saat `isLoading`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 8. Transaction history dan filter
  - [ ] 8.1 Buat `src/components/transactions/TransactionFilter.tsx`
    - Filter berdasarkan: wallet (Select), kategori (Select), tipe (Select: Income/Expense/Transfer), rentang tanggal (date inputs)
    - Panggil `transactionStore.setFilter()` saat filter berubah
    - Tombol reset untuk `transactionStore.clearFilter()`
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ] 8.2 Buat `src/components/transactions/TransactionList.tsx`
    - Render daftar `TransactionItem` dari filtered transactions
    - Tampilkan jumlah total transaksi yang ditampilkan
    - Tampilkan `EmptyState` jika tidak ada transaksi yang sesuai filter
    - Implementasikan pagination atau virtual scroll untuk dataset > 100 transaksi
    - _Requirements: 6.1, 6.5, 6.6_

  - [ ] 8.3 Buat halaman `src/pages/transactions/TransactionsPage.tsx`
    - Susun `TransactionFilter`, jumlah hasil, dan `TransactionList`
    - Tombol tambah transaksi baru (navigasi ke `/transactions/new`) dengan respons < 300ms
    - _Requirements: 6.1, 6.2, 8.5_

- [ ] 9. Reports (Realtime, Bulanan, Custom)
  - [ ] 9.1 Buat `src/components/reports/RealtimeReport.tsx`
    - Gunakan `useReports` hook untuk menghitung summary bulan berjalan (tanggal 1 s/d hari ini)
    - Tampilkan total Income, total Expense, dan saldo bersih (Transfer dikecualikan)
    - _Requirements: 7.2_

  - [ ] 9.2 Buat `src/components/reports/MonthlyReport.tsx`
    - Gunakan `reportEngine.groupByMonth()` untuk mengelompokkan transaksi per bulan
    - Tampilkan daftar bulan (terbaru ke terlama) dengan total Income dan Expense per bulan
    - Tampilkan `EmptyState` jika tidak ada data
    - _Requirements: 7.3_

  - [ ] 9.3 Buat `src/components/reports/CustomReport.tsx`
    - Form pemilihan rentang tanggal (tanggal mulai dan tanggal akhir) dengan validasi `startDate <= endDate`
    - Setelah submit, tampilkan summary menggunakan `reportEngine.filterByDateRange()` + `calculateSummary()`
    - Tampilkan pesan validasi jika `startDate > endDate`
    - Tampilkan `EmptyState` jika tidak ada transaksi dalam rentang
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ] 9.4 Buat halaman `src/pages/reports/ReportsPage.tsx`
    - Tabs (shadcn/ui Tabs): Realtime, Bulanan, Custom
    - Render komponen report yang sesuai per tab
    - Tampilkan `ErrorMessage` jika storage gagal membaca data
    - _Requirements: 7.1, 7.9_

- [ ] 10. Shared components
  - [ ] 10.1 Buat `src/components/shared/EmptyState.tsx`
    - Props: `icon`, `title`, `description`, `action` (opsional — tombol CTA)
    - _Requirements: 5.6, 6.5, 7.7_

  - [ ] 10.2 Buat `src/components/shared/LoadingSpinner.tsx`
    - Spinner animasi untuk state loading
    - Mendukung variant: inline dan fullscreen
    - _Requirements: 5.7, 1.4_

  - [ ] 10.3 Buat `src/components/shared/ConfirmDialog.tsx`
    - Dialog konfirmasi dengan pesan, tombol konfirmasi, dan tombol batal
    - Gunakan shadcn/ui Dialog atau AlertDialog
    - _Requirements: 2.6, 4.16_

  - [ ] 10.4 Buat `src/components/shared/ErrorMessage.tsx`
    - Tampilkan pesan error dengan opsi fullscreen atau inline
    - _Requirements: 1.4, 7.9, 9.4_

- [ ] 11. Checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

- [ ] 12. Setup testing infrastructure dan property-based tests
  - [ ] 12.1 Setup testing infrastructure
    - Install `fake-indexeddb` dan `fast-check` sebagai devDependencies: `bun add -d fake-indexeddb fast-check`
    - Buat struktur direktori `src/__tests__/db/`, `src/__tests__/stores/`, `src/__tests__/lib/`, `src/__tests__/integration/`
    - Buat helper `src/__tests__/helpers/arbitraries.ts` dengan fast-check arbitraries untuk `Wallet`, `Category`, `Transaction`
    - _Requirements: 9.3, 9.6_

  - [ ] 12.2 Buat `src/__tests__/integration/dbInit.test.ts`
    - Smoke test: DB dapat dibuka, semua object stores tersedia (`wallets`, `transactions`, `categories`)
    - _Requirements: 1.1_

  - [ ] 12.3 Buat `src/__tests__/integration/defaultCategories.test.ts`
    - Example test: tepat 9 kategori default tersimpan dengan nama dan tipe yang benar
    - _Requirements: 1.2_

  - [ ]* 12.4 Tulis property test untuk Wallet Creation Round-Trip (Property 1) di `src/__tests__/db/walletDb.test.ts`
    - **Property 1: Wallet Creation Round-Trip**
    - **Validates: Requirements 2.1, 2.2, 9.3**

  - [ ]* 12.5 Tulis property test untuk Wallet Balance Invariant (Property 2) di `src/__tests__/stores/walletStore.test.ts`
    - **Property 2: Wallet Balance Invariant**
    - **Validates: Requirements 9.5, 2.4**

  - [ ]* 12.6 Tulis property test untuk Transaction Storage Round-Trip (Property 7) di `src/__tests__/db/transactionDb.test.ts`
    - **Property 7: Transaction Storage Round-Trip**
    - **Validates: Requirements 9.6**

  - [ ]* 12.7 Tulis property test untuk Wallet Deletion Protection (Property 8) di `src/__tests__/db/walletDb.test.ts`
    - **Property 8: Wallet Deletion Protection**
    - **Validates: Requirements 2.5**

  - [ ]* 12.8 Tulis property test untuk Category Deletion Protection (Property 9) di `src/__tests__/db/categoryDb.test.ts`
    - **Property 9: Category Deletion Protection**
    - **Validates: Requirements 3.3**

  - [ ]* 12.9 Tulis property test untuk Transaction Filter AND Logic (Property 10) di `src/__tests__/stores/transactionStore.test.ts`
    - **Property 10: Transaction Filter AND Logic**
    - **Validates: Requirements 6.3**

  - [ ]* 12.10 Tulis property test untuk Report Transfer Exclusion (Property 11) di `src/__tests__/lib/reportEngine.test.ts`
    - **Property 11: Report Transfer Exclusion**
    - **Validates: Requirements 5.3, 7.2, 7.3, 7.5**

  - [ ]* 12.11 Tulis property test untuk Report Date Range Containment (Property 12) di `src/__tests__/lib/reportEngine.test.ts`
    - **Property 12: Report Date Range Containment**
    - **Validates: Requirements 7.5, 7.8**

  - [ ]* 12.12 Tulis property test untuk Transaction List Ordering (Property 13) di `src/__tests__/stores/transactionStore.test.ts`
    - **Property 13: Transaction List Ordering**
    - **Validates: Requirements 6.1**

  - [ ]* 12.13 Tulis property test untuk Wallet Name Uniqueness (Property 14) di `src/__tests__/stores/walletStore.test.ts`
    - **Property 14: Wallet Name Uniqueness (Case-Insensitive)**
    - **Validates: Requirements 2.9**

  - [ ]* 12.14 Tulis property test untuk Category Name Uniqueness Per Type (Property 15) di `src/__tests__/lib/validators.test.ts`
    - **Property 15: Category Name Uniqueness Per Type (Case-Insensitive)**
    - **Validates: Requirements 3.8**

- [ ] 13. Final checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan kepada user jika ada pertanyaan.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase
- Property tests memvalidasi properti kebenaran universal (15 properties dari design)
- Unit tests memvalidasi skenario spesifik dan edge cases
- Semua operasi yang melibatkan transaksi + saldo wallet harus berada dalam satu IDBTransaction untuk atomicity
- Zustand store menjadi single source of truth di memori; IndexedDB adalah persistensi jangka panjang
- Gunakan `fake-indexeddb` untuk isolasi test environment (tidak ada network request)
- Setiap property test menggunakan minimum 100 iterasi (default fast-check)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5", "1.6", "1.7"] },
    { "id": 3, "tasks": ["1.8"] },
    { "id": 4, "tasks": ["1.9", "2.1"] },
    { "id": 5, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 6, "tasks": ["3.1", "3.2", "4.1", "4.2", "5.1"] },
    { "id": 7, "tasks": ["3.3", "3.6", "4.3", "4.5", "5.2", "5.5", "5.7"] },
    { "id": 8, "tasks": ["3.4", "3.5", "4.4", "5.3", "5.4", "5.6", "5.8", "5.9"] },
    { "id": 9, "tasks": ["5.10", "7.1", "7.2", "7.3", "8.1", "8.2", "9.1", "9.2", "9.3", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 10, "tasks": ["7.4", "8.3", "9.4"] },
    { "id": 11, "tasks": ["12.1"] },
    { "id": 12, "tasks": ["12.2", "12.3"] },
    { "id": 13, "tasks": ["12.4", "12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "12.11", "12.12", "12.13", "12.14"] }
  ]
}
```
