# Implementation Plan: Loan Repayment & Transaction Integration

## Overview

Implementasi ini memperluas modul Loan Tracker yang sudah ada di Flowang dengan menambahkan mekanisme Repayment, integrasi ke Transaction, Loan Report Section, dan kategori pada Loan_Entry/Repayment. Semua operasi multi-store dieksekusi secara atomik menggunakan satu IDBTransaction. Implementasi mengikuti pola yang sudah ada di codebase (Zustand stores, `requestToPromise` helper, IndexedDB object stores).

## Tasks

- [x] 1. Upgrade skema database dan tambah tipe data baru
  - [x] 1.1 Upgrade DB_VERSION ke 3 di `src/db/db.ts` dan tambah object store `loan_repayments`
    - Tambah object store `loan_repayments` dengan keyPath `id` dan index `by_loanEntryId` pada field `loanEntryId`
    - Tambah migration logic untuk upgrade dari versi 2 ke 3: set default `remainingAmount = amount`, `categoryId = undefined`, `linkedTransactionId = undefined` pada semua record `loan_entries` yang ada
    - Tangani error inisialisasi DB sesuai Requirements 7.2
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Tambah tipe `Repayment`, `RepaymentFormData`, `LinkedTransactionInput` dan perbarui `LoanEntry` dan `LoanEntryFormData` di `src/types/index.ts`
    - Tambah interface `Repayment` dengan semua field sesuai design (id, loanEntryId, amount, categoryId?, linkedTransactionId?, date, note?, createdAt, updatedAt)
    - Tambah interface `RepaymentFormData` dengan field createTransaction dan walletId opsional
    - Tambah interface `LinkedTransactionInput`
    - Perbarui `LoanEntry` dengan field baru: `categoryId?`, `linkedTransactionId?`, `remainingAmount`
    - Perbarui `LoanEntryFormData` dengan field baru: `categoryId?`, `createTransaction`, `walletId?`
    - _Requirements: 7.1, 7.3_

- [x] 2. Implementasi DB layer untuk Repayment
  - [x] 2.1 Buat `src/db/loanRepaymentDb.ts` dengan semua fungsi CRUD
    - Implementasi `getAllRepayments`, `getRepaymentsByLoanEntryId`, `getRepaymentById`
    - Implementasi `addRepayment`, `deleteRepayment`, `deleteRepaymentsByLoanEntryId`
    - Ikuti pola `requestToPromise` yang sudah ada di codebase
    - _Requirements: 7.1, 7.2_

  - [ ]* 2.2 Tulis property test untuk Repayment round-trip (Property 3)
    - **Property 3: Repayment round-trip — data tersimpan dan dapat dibaca kembali**
    - **Validates: Requirements 1.5**
    - Gunakan `fake-indexeddb` untuk simulasi IndexedDB in-memory
    - File: `src/__tests__/db/loanRepaymentDb.test.ts`

- [x] 3. Implementasi Transaction_Integrator
  - [x] 3.1 Buat `src/lib/transactionIntegrator.ts` dengan fungsi `resolveTransactionType`
    - Implementasi logika: `loan_entry` + `borrow` → `income`, `loan_entry` + `lend` → `expense`
    - Implementasi logika: `repayment` + `lend` → `income`, `repayment` + `borrow` → `expense`
    - _Requirements: 2.3, 3.3_

  - [ ]* 3.2 Tulis property test untuk resolveTransactionType (Property 6, Property 10)
    - **Property 6: Tipe Linked_Transaction untuk Loan_Entry sesuai direction**
    - **Property 10: Tipe Linked_Transaction untuk Repayment sesuai direction LoanEntry**
    - **Validates: Requirements 2.3, 3.3**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

  - [x] 3.3 Implementasi `createLoanEntryWithTransaction` di `src/lib/transactionIntegrator.ts`
    - Buat satu IDBTransaction yang mencakup `loan_entries`, `transactions`, `wallets`
    - Simpan LoanEntry, buat Linked_Transaction, update saldo Wallet secara atomik
    - Set `linkedTransactionId` pada LoanEntry yang disimpan
    - Rollback otomatis jika salah satu operasi gagal
    - _Requirements: 2.3, 2.4, 2.6, 6.1_

  - [ ]* 3.4 Tulis property test untuk atomicity createLoanEntryWithTransaction (Property 17)
    - **Property 17: Atomicity — tidak ada data parsial saat operasi Loan_Entry + Linked_Transaction gagal**
    - **Validates: Requirements 6.1**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

  - [ ]* 3.5 Tulis property test untuk saldo wallet dan linkedTransactionId (Property 7, Property 8)
    - **Property 7: Saldo wallet berubah sesuai tipe transaksi setelah pembuatan Loan_Entry**
    - **Property 8: linkedTransactionId tersimpan pada Loan_Entry**
    - **Validates: Requirements 2.4, 2.6**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

  - [x] 3.6 Implementasi `deleteLoanEntryWithCascade` di `src/lib/transactionIntegrator.ts`
    - Hapus LoanEntry, semua Repayment terkait, semua Linked_Transaction dari Repayment, dan Linked_Transaction dari LoanEntry secara atomik
    - Balikkan efek saldo Wallet untuk setiap Linked_Transaction yang dihapus
    - _Requirements: 2.7, 6.3_

  - [ ]* 3.7 Tulis property test untuk cascade delete dan saldo wallet kembali (Property 9, Property 19)
    - **Property 9: Saldo wallet kembali ke nilai awal setelah Loan_Entry dengan Linked_Transaction dihapus**
    - **Property 19: Cascade delete — menghapus Loan_Entry menghapus semua Repayment dan Linked_Transaction terkait**
    - **Validates: Requirements 2.7, 6.3**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

  - [x] 3.8 Implementasi `createRepaymentWithTransaction` di `src/lib/transactionIntegrator.ts`
    - Buat satu IDBTransaction yang mencakup `loan_repayments`, `loan_entries`, `transactions`, `wallets`
    - Simpan Repayment, buat Linked_Transaction (opsional), update saldo Wallet (opsional) secara atomik
    - Cek auto-settle: jika total repayments == amount LoanEntry, ubah status ke `settled`
    - Set `linkedTransactionId` pada Repayment yang disimpan
    - _Requirements: 1.5, 1.6, 3.3, 3.5, 6.2_

  - [ ]* 3.9 Tulis property test untuk auto-settle, atomicity Repayment, dan linkedTransactionId (Property 4, Property 11, Property 18)
    - **Property 4: Auto-settle — total repayment sama dengan amount mengubah status ke settled**
    - **Property 11: linkedTransactionId tersimpan pada Repayment**
    - **Property 18: Atomicity — tidak ada data parsial saat operasi Repayment + Linked_Transaction gagal**
    - **Validates: Requirements 1.6, 3.5, 6.2**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

  - [ ]* 3.10 Tulis property test untuk saldo wallet Repayment (Property 12)
    - **Property 12: Saldo wallet kembali ke nilai awal setelah Repayment dengan Linked_Transaction dihapus**
    - **Validates: Requirements 3.6**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

  - [x] 3.11 Implementasi `deleteRepaymentWithCascade` di `src/lib/transactionIntegrator.ts`
    - Hapus Repayment dan Linked_Transaction terkait secara atomik
    - Balikkan efek saldo Wallet
    - Cek auto-unsettle: jika LoanEntry berstatus `settled` dan total repayments < amount, ubah status kembali ke `active`
    - _Requirements: 1.8, 3.6, 6.2_

  - [ ]* 3.12 Tulis property test untuk auto-unsettle (Property 5)
    - **Property 5: Auto-unsettle — menghapus Repayment dari LoanEntry settled mengembalikan status ke active**
    - **Validates: Requirements 1.8**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

- [x] 4. Checkpoint — Pastikan semua tests di layer DB dan Transaction_Integrator lulus
  - Jalankan semua test di `src/__tests__/lib/` dan `src/__tests__/db/`
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 5. Implementasi validasi dan utilitas Repayment
  - [x] 5.1 Buat `src/lib/loanUtils.ts` dengan fungsi validasi dan kalkulasi
    - Implementasi `validateRepaymentAmount(amount, remainingAmount)` — menolak nilai ≤ 0 dan nilai > remainingAmount
    - Implementasi `calculateRemainingAmount(loanAmount, repayments)` — menghitung sisa hutang
    - Implementasi `calculateLoanReportSummary(entries, repayments)` — menghitung total piutang aktif, total hutang aktif, net posisi
    - _Requirements: 1.3, 1.4, 1.7, 5.1_

  - [ ]* 5.2 Tulis property test untuk validasi amount Repayment (Property 1, Property 2)
    - **Property 1: Validasi amount Repayment — angka non-positif selalu ditolak**
    - **Property 2: Validasi amount Repayment — melebihi remaining amount selalu ditolak**
    - **Validates: Requirements 1.3, 1.4**
    - File: `src/__tests__/lib/loanUtils.test.ts`

  - [ ]* 5.3 Tulis property test untuk kalkulasi Loan_Report_Section (Property 16)
    - **Property 16: Kalkulasi total piutang aktif, total hutang aktif, dan net posisi**
    - **Validates: Requirements 5.1**
    - File: `src/__tests__/lib/loanUtils.test.ts`

- [x] 6. Implementasi validasi referensial categoryId
  - [x] 6.1 Tambah fungsi validasi `categoryId` di `src/db/loanEntryDb.ts` dan `src/db/loanRepaymentDb.ts`
    - Sebelum menyimpan LoanEntry atau Repayment dengan `categoryId`, verifikasi bahwa Category dengan id tersebut ada di object store `categories`
    - Lempar error jika Category tidak ditemukan
    - _Requirements: 4.3, 4.4_

  - [ ]* 6.2 Tulis property test untuk validasi referensial categoryId (Property 13, Property 14)
    - **Property 13: Validasi referensial categoryId pada Loan_Entry**
    - **Property 14: Validasi referensial categoryId pada Repayment**
    - **Validates: Requirements 4.3, 4.4**
    - File: `src/__tests__/db/loanRepaymentDb.test.ts`

  - [ ]* 6.3 Tulis property test untuk propagasi categoryId ke Linked_Transaction (Property 15)
    - **Property 15: categoryId dipropagasi ke Linked_Transaction**
    - **Validates: Requirements 4.5**
    - File: `src/__tests__/lib/transactionIntegrator.test.ts`

- [x] 7. Implementasi cascade set null untuk Category dan proteksi Wallet
  - [x] 7.1 Tambah logika cascade set null di `src/stores/categoryStore.ts`
    - Saat Category dihapus, update semua LoanEntry dan Repayment yang menggunakan `categoryId` tersebut menjadi `null`
    - Eksekusi dalam satu IDBTransaction yang mencakup `categories`, `loan_entries`, `loan_repayments`
    - _Requirements: 6.4_

  - [ ]* 7.2 Tulis property test untuk cascade set null Category (Property 20)
    - **Property 20: Cascade set null — menghapus Category menetapkan categoryId menjadi null pada semua Loan_Entry dan Repayment terkait**
    - **Validates: Requirements 6.4**
    - File: `src/__tests__/stores/loanRepaymentStore.test.ts`

  - [x] 7.3 Tambah proteksi penghapusan Wallet di `src/stores/walletStore.ts`
    - Sebelum menghapus Wallet, cek apakah ada Linked_Transaction yang menggunakan `walletId` tersebut di object store `transactions`
    - Jika ada, tolak penghapusan dan tampilkan pesan error yang menyebutkan jumlah transaksi terkait
    - _Requirements: 6.5_

  - [ ]* 7.4 Tulis property test untuk proteksi penghapusan Wallet (Property 21)
    - **Property 21: Wallet dengan Linked_Transaction tidak dapat dihapus**
    - **Validates: Requirements 6.5**
    - File: `src/__tests__/stores/loanRepaymentStore.test.ts`

- [x] 8. Implementasi Zustand store untuk Repayment
  - [x] 8.1 Buat `src/stores/loanRepaymentStore.ts` dengan state dan actions
    - Implementasi state: `repayments`, `isLoading`, `error`
    - Implementasi `loadRepayments()` — load semua repayments dari IndexedDB
    - Implementasi `addRepayment(data, loanEntry)` — validasi, panggil `createRepaymentWithTransaction`, update state
    - Implementasi `deleteRepayment(id, loanEntry)` — panggil `deleteRepaymentWithCascade`, update state
    - Tampilkan toast error via Sonner saat operasi gagal
    - _Requirements: 1.5, 1.8, 7.4_

  - [x] 8.2 Buat `src/hooks/useLoanRepayments.ts` sebagai hook untuk akses repayment store
    - Export hook yang mengekspos state dan actions dari `loanRepaymentStore`
    - _Requirements: 1.5_

  - [ ]* 8.3 Tulis integration tests untuk loanRepaymentStore
    - Test `addRepayment` dengan data valid dan invalid
    - Test `deleteRepayment` dengan dan tanpa Linked_Transaction
    - Test error handling saat IndexedDB gagal
    - _Requirements: 1.5, 1.8, 7.4_
    - File: `src/__tests__/stores/loanRepaymentStore.test.ts`

- [x] 9. Perbarui loanEntryStore untuk mendukung Transaction_Integrator
  - [x] 9.1 Modifikasi `addEntry` di `src/stores/loanEntryStore.ts`
    - Jika `createTransaction = true`, panggil `createLoanEntryWithTransaction` dari Transaction_Integrator
    - Jika `createTransaction = false`, panggil `loanEntryDb.addEntry` seperti sebelumnya
    - Tampilkan toast error dan rollback jika operasi gagal
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 9.2 Modifikasi `deleteEntry` di `src/stores/loanEntryStore.ts`
    - Panggil `deleteLoanEntryWithCascade` dari Transaction_Integrator (menggantikan panggilan langsung ke DB)
    - Pastikan semua Repayment dan Linked_Transaction terkait ikut terhapus
    - _Requirements: 2.7, 6.3_

- [x] 10. Checkpoint — Pastikan semua tests di layer store lulus
  - Jalankan semua test di `src/__tests__/stores/`
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [x] 11. Implementasi komponen RepaymentForm
  - [x] 11.1 Buat `src/components/loans/RepaymentForm.tsx`
    - Field `amount` (number input, wajib, > 0, ≤ remainingAmount) dengan validasi inline
    - Field `date` (date input, wajib, default hari ini)
    - Field `note` (text input, opsional)
    - Field `categoryId` (select dari daftar Category, opsional) — tampilkan semua kategori (expense, income, both)
    - Toggle "Catat sebagai transaksi" (default nonaktif)
    - Jika toggle aktif: tampilkan field `walletId` (wajib) dan `categoryId` (wajib)
    - Jika toggle nonaktif: sembunyikan field `walletId` dan `categoryId`
    - Tampilkan pesan error inline sesuai Requirements 1.3, 1.4, 3.2
    - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.2, 4.2_

  - [ ]* 11.2 Tulis unit tests untuk RepaymentForm
    - Test rendering field yang benar
    - Test toggle behavior (field Wallet dan Kategori muncul/sembunyi)
    - Test validasi error messages
    - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.2_
    - File: `src/__tests__/components/RepaymentForm.test.tsx`

- [x] 12. Implementasi komponen RepaymentList
  - [x] 12.1 Buat `src/components/loans/RepaymentList.tsx`
    - Tampilkan daftar Repayment untuk satu LoanEntry
    - Tampilkan amount, date, note, dan nama kategori (atau "Tanpa kategori" jika tidak ada)
    - Tampilkan tombol hapus pada setiap item dengan konfirmasi sebelum menghapus
    - _Requirements: 1.5, 1.8, 4.6_

- [x] 13. Modifikasi LoanForm untuk mendukung kategori dan transaction integration
  - [x] 13.1 Modifikasi `src/components/loans/LoanForm.tsx`
    - Tambah field `categoryId` (select dari daftar Category, opsional) — tampilkan semua kategori
    - Tambah toggle "Catat sebagai transaksi" (default nonaktif)
    - Jika toggle aktif: tampilkan field `walletId` (wajib) dan `categoryId` (wajib)
    - Jika toggle nonaktif: sembunyikan field `walletId` dan `categoryId`
    - Tampilkan pesan error inline jika toggle aktif tapi Wallet atau Kategori belum dipilih
    - _Requirements: 2.1, 2.2, 4.1_

  - [ ]* 13.2 Tulis unit tests untuk LoanForm dengan field baru
    - Test toggle behavior
    - Test validasi error messages saat toggle aktif
    - _Requirements: 2.1, 2.2, 4.1_
    - File: `src/__tests__/components/LoanForm.test.tsx`

- [x] 14. Modifikasi LoanDetailPage untuk menampilkan Repayment
  - [x] 14.1 Modifikasi `src/pages/loans/LoanDetailPage.tsx`
    - Tambah tombol "Catat Pembayaran" pada setiap LoanEntry dengan status `active`
    - Integrasikan `RepaymentForm` sebagai modal/sheet yang muncul saat tombol ditekan
    - Integrasikan `RepaymentList` di bawah setiap LoanEntry
    - Tampilkan `remainingAmount` untuk setiap LoanEntry `active` yang sudah memiliki setidaknya satu Repayment
    - Tampilkan nama kategori pada setiap LoanEntry dan Repayment (atau "Tanpa kategori")
    - Load repayments via `useLoanRepayments` hook saat halaman dibuka
    - _Requirements: 1.1, 1.7, 4.6_

- [x] 15. Modifikasi NewLoanPage dan EditLoanPage
  - [x] 15.1 Modifikasi `src/pages/loans/NewLoanPage.tsx`
    - Pastikan form menggunakan `LoanForm` yang sudah diperbarui dengan field baru
    - Teruskan `createTransaction`, `walletId`, `categoryId` ke `loanEntryStore.addEntry`
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [x] 15.2 Modifikasi `src/pages/loans/EditLoanPage.tsx`
    - Tambah field `categoryId` pada form edit (opsional)
    - _Requirements: 4.1_

- [x] 16. Implementasi LoanReportSection
  - [x] 16.1 Buat `src/components/loans/LoanReportSection.tsx`
    - Tampilkan total piutang aktif (sum remainingAmount, direction='lend', status='active')
    - Tampilkan total hutang aktif (sum remainingAmount, direction='borrow', status='active')
    - Tampilkan net posisi (piutang − hutang)
    - Tampilkan daftar item per contact yang dapat diklik untuk navigasi ke LoanDetail
    - Sembunyikan seluruh section jika tidak ada LoanEntry `active`
    - Tampilkan keterangan bahwa data adalah posisi terkini (bukan snapshot historis)
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ]* 16.2 Tulis unit tests untuk LoanReportSection
    - Test tampil/sembunyi berdasarkan data aktif
    - Test navigasi ke LoanDetail saat item diklik
    - Test kalkulasi total yang benar
    - _Requirements: 5.1, 5.2, 5.5_
    - File: `src/__tests__/components/LoanReportSection.test.tsx`

- [x] 17. Integrasi LoanReportSection ke halaman Reports
  - [x] 17.1 Modifikasi `src/pages/reports/ReportsPage.tsx`
    - Import dan render `LoanReportSection` di semua tab (Realtime, Bulanan, Custom)
    - Teruskan `entries`, `repayments`, dan `onNavigateToContact` sebagai props
    - Tangani error navigasi dengan toast error
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 17.2 Modifikasi komponen report yang ada (`RealtimeReport.tsx`, `MonthlyReport.tsx`, `CustomReport.tsx`)
    - Tambah slot/area untuk menampilkan `LoanReportSection` di masing-masing komponen
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 18. Final checkpoint — Pastikan semua tests lulus dan fitur terintegrasi
  - Jalankan seluruh test suite
  - Verifikasi semua object store dan index ada setelah DB upgrade (smoke tests)
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase
- Property tests (Properties 1–21) memvalidasi correctness properties universal menggunakan fast-check
- Unit tests memvalidasi contoh spesifik, edge case, dan error condition
- Semua operasi multi-store menggunakan satu IDBTransaction untuk atomicity
- Pola `requestToPromise` yang sudah ada di codebase harus diikuti di semua DB layer baru

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "5.2", "5.3", "6.1"] },
    { "id": 3, "tasks": ["3.3", "6.2"] },
    { "id": 4, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 5, "tasks": ["3.7", "3.8", "6.3", "7.1", "7.3"] },
    { "id": 6, "tasks": ["3.9", "3.10", "3.11", "7.2", "7.4"] },
    { "id": 7, "tasks": ["3.12", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3", "9.1", "9.2"] },
    { "id": 9, "tasks": ["11.1", "12.1", "13.1"] },
    { "id": 10, "tasks": ["11.2", "13.2", "14.1", "15.1", "15.2"] },
    { "id": 11, "tasks": ["16.1"] },
    { "id": 12, "tasks": ["16.2", "17.1"] },
    { "id": 13, "tasks": ["17.2"] }
  ]
}
```
