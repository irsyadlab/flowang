# Implementation Plan: Loan Tracker

## Overview

Implementasi modul Loan Tracker mengikuti pola arsitektur yang sudah ada di codebase (db → store → hook → component → page → route). Hutang bersifat independen dari wallet — tidak ada perubahan saldo. Dua object store baru (`loan_contacts`, `loan_entries`) ditambahkan dengan DB_VERSION naik dari 1 ke 2.

## Tasks

- [ ] 1. Tambahkan TypeScript types untuk Loan Tracker
  - [ ] 1.1 Tambahkan `LoanDirection`, `LoanStatus`, `LoanContact`, `LoanEntry`, `ContactSummary`, dan `LoanEntryFormData` ke `src/types/index.ts`
    - Tambahkan di bawah definisi `TransactionFilter` yang sudah ada
    - `LoanContact`: id, name (maks 100 karakter), note?, createdAt, updatedAt
    - `LoanEntry`: id, contactId, amount, direction, status, date, note?, settledAt?, createdAt, updatedAt
    - `ContactSummary`: contactId, totalLend, totalBorrow, hasActiveEntries
    - `LoanEntryFormData`: contactId, amount, direction, date, note?
    - _Requirements: 1.1, 2.1, 6.1_

- [ ] 2. Update IndexedDB schema ke versi 2
  - [ ] 2.1 Update `src/db/db.ts`: naikkan `DB_VERSION` dari `1` ke `2` dan tambahkan dua object store baru di `onupgradeneeded`
    - Tambahkan store `loan_contacts` dengan `keyPath: 'id'` (tanpa index tambahan)
    - Tambahkan store `loan_entries` dengan `keyPath: 'id'` dan tiga index: `by_contactId`, `by_date`, `by_status`
    - Gunakan guard `if (!db.objectStoreNames.contains(...))` agar idempotent
    - _Requirements: 6.1, 6.2_

- [ ] 3. Implementasi DB layer
  - [ ] 3.1 Buat `src/db/loanContactDb.ts` dengan fungsi CRUD untuk `loan_contacts`
    - `getAllContacts(db)` — getAll dari store
    - `getContactById(db, id)` — get by key
    - `addContact(db, contact)` — add ke store
    - `updateContact(db, id, contact)` — put ke store
    - `deleteContact(db, contactId)` — hapus contact + semua entries terkait dalam satu `IDBTransaction` atomik (mencakup store `loan_contacts` dan `loan_entries`)
    - Semua fungsi melempar `Error` jika IDB request/transaction gagal
    - _Requirements: 1.1, 1.2, 5.2, 6.1, 6.4_
  - [ ] 3.2 Buat `src/db/loanEntryDb.ts` dengan fungsi CRUD dan operasi bulk untuk `loan_entries`
    - `getAllEntries(db)` — getAll dari store
    - `getEntryById(db, id)` — get by key
    - `getEntriesByContactId(db, contactId)` — getAll via index `by_contactId`
    - `addEntry(db, entry)` — add ke store
    - `updateEntry(db, id, entry)` — put ke store
    - `deleteEntry(db, id)` — delete by key
    - `toggleEntryStatus(db, id)` — baca entry, toggle status active↔settled, update `settledAt`, put kembali dalam satu transaction
    - `markAllSettled(db, contactId)` — getAll by contactId, filter active, update semua ke settled dalam satu `IDBTransaction` atomik
    - Semua fungsi melempar `Error` jika IDB request/transaction gagal
    - _Requirements: 2.2, 3.1, 3.3, 3.6, 5.1, 6.1, 6.3, 6.4_

- [ ] 4. Implementasi pure utility functions
  - [ ] 4.1 Buat `src/lib/loanUtils.ts` dengan semua pure functions untuk komputasi dan validasi
    - `validateContactName(name: string): string | null` — return pesan error atau null jika valid; tolak string kosong/whitespace dan string > 100 karakter
    - `validateAmount(amount: number): string | null` — return pesan error atau null jika valid; tolak ≤ 0 dan > 999_999_999_999
    - `computeContactSummary(entries: LoanEntry[]): Omit<ContactSummary, 'contactId'>` — hitung totalLend, totalBorrow, hasActiveEntries dari array entries
    - `getNetBalanceLabel(totalLend: number, totalBorrow: number): string` — return "Kamu menagih" / "Kamu berhutang" / "Lunas semua"
    - `countContactsWithActiveLoans(contacts: LoanContact[], entriesByContact: Map<string, LoanEntry[]>): number` — hitung jumlah contact dengan minimal satu entry active
    - `sortEntriesByDate(entries: LoanEntry[]): LoanEntry[]` — urutkan descending by date (terbaru di atas), tidak mutate array asli
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 2.4, 2.6, 4.1, 4.2, 4.4_

- [ ] 5. Checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 6. Implementasi Store layer
  - [ ] 6.1 Buat `src/stores/loanContactStore.ts` menggunakan Zustand
    - State: `contacts: LoanContact[]`, `isLoading: boolean`, `error: string | null`
    - Actions: `loadContacts`, `addContact`, `updateContact`, `deleteContact`
    - Setiap action: cek `dbReady` dari `uiStore`, wrap dalam try/catch, set error jika gagal
    - `deleteContact` memanggil `loanContactDb.deleteContact` (cascade atomik)
    - _Requirements: 1.2, 5.2, 5.4, 6.3_
  - [ ] 6.2 Buat `src/stores/loanEntryStore.ts` menggunakan Zustand
    - State: `entries: LoanEntry[]`, `isLoading: boolean`, `error: string | null`
    - Actions: `loadEntries`, `addEntry`, `updateEntry`, `deleteEntry`, `toggleEntryStatus`, `markAllSettled`
    - `markAllSettled` menonaktifkan tombol secara optimistik (set isLoading: true) sebelum operasi selesai
    - Setiap action: cek `dbReady`, wrap dalam try/catch, set error jika gagal
    - _Requirements: 2.2, 3.1, 3.3, 3.5, 5.1, 6.3_

- [ ] 7. Implementasi Hook layer
  - [ ] 7.1 Buat `src/hooks/useLoanContacts.ts` sebagai thin wrapper hook
    - Re-export semua state dan actions dari `loanContactStore`
    - Tambahkan computed: `summaries: Map<string, ContactSummary>` yang dihitung dari entries (terima `entries` sebagai parameter atau ambil dari `loanEntryStore`)
    - _Requirements: 1.5, 4.4_
  - [ ] 7.2 Buat `src/hooks/useLoanEntries.ts` sebagai thin wrapper hook dengan computed values
    - Re-export semua state dan actions dari `loanEntryStore`
    - Tambahkan computed: `sortedEntries` (via `sortEntriesByDate`), `summary: ContactSummary` untuk contact tertentu (via `computeContactSummary`), `netBalanceLabel` (via `getNetBalanceLabel`)
    - _Requirements: 2.6, 4.1, 4.2_

- [ ] 8. Implementasi Components
  - [ ] 8.1 Buat `src/components/loans/LoanSummaryCard.tsx`
    - Props: `totalLend: number`, `totalBorrow: number`
    - Tampilkan totalLend, totalBorrow, dan netBalance dengan label dari `getNetBalanceLabel`
    - _Requirements: 4.1, 4.2_
  - [ ] 8.2 Buat `src/components/loans/ContactItem.tsx`
    - Props: `contact: LoanContact`, `summary: ContactSummary`, `onClick: () => void`, `onDelete: () => void`
    - Tampilkan nama, total borrow aktif, total lend aktif, badge "Lunas" jika `!summary.hasActiveEntries`
    - _Requirements: 1.5, 3.2_
  - [ ] 8.3 Buat `src/components/loans/ContactList.tsx`
    - Props: `contacts: LoanContact[]`, `summaries: Map<string, ContactSummary>`
    - Render daftar `ContactItem`
    - _Requirements: 1.5_
  - [ ] 8.4 Buat `src/components/loans/LoanEntryItem.tsx`
    - Props: `entry: LoanEntry`, `onToggleSettled: (id: string) => void`, `onDelete: (id: string) => void`
    - Tampilkan jumlah, direction badge (lend/borrow), tanggal, note, status badge (active/settled)
    - Tombol "Mark Lunas" (toggle) dan tombol hapus dengan `AlertDialog` konfirmasi
    - _Requirements: 2.6, 3.1, 3.6, 5.1, 5.4_
  - [ ] 8.5 Buat `src/components/loans/LoanEntryList.tsx`
    - Props: `entries: LoanEntry[]`
    - Render daftar `LoanEntryItem`
    - _Requirements: 2.6_
  - [ ] 8.6 Buat `src/components/loans/LoanForm.tsx`
    - Props: `mode: 'create' | 'edit'`, `defaultContactId?: string`, `entry?: LoanEntry`, `onSubmit: (data: LoanEntryFormData) => void`
    - Gunakan `react-hook-form` + `zod` untuk validasi (nama contact, amount, direction, tanggal)
    - Tampilkan error inline: "Nama tidak boleh kosong", "Nama maksimal 100 karakter", "Jumlah harus lebih dari 0", "Jumlah melebihi batas maksimum"
    - Pre-fill `contactId` jika `defaultContactId` diberikan
    - Default tanggal: hari ini
    - _Requirements: 1.3, 1.4, 2.1, 2.3, 2.4, 2.5_

- [ ] 9. Implementasi Pages
  - [ ] 9.1 Buat `src/pages/loans/ContactListPage.tsx`
    - Gunakan `useLoanContacts` dan `useLoanEntries`
    - Tampilkan `ContactList` dengan summaries
    - Tampilkan badge/counter di header jika ada contact dengan hutang aktif (via `countContactsWithActiveLoans`)
    - Sembunyikan badge jika count = 0
    - FAB navigasi ke `/loans/new`
    - Dialog konfirmasi sebelum delete contact (sebutkan jumlah entries yang akan ikut terhapus)
    - _Requirements: 1.2, 1.5, 1.6, 4.4, 5.2, 5.3, 5.4_
  - [ ] 9.2 Buat `src/pages/loans/LoanDetailPage.tsx`
    - Gunakan `useLoanEntries` dan `useLoanContacts`
    - Tampilkan `LoanSummaryCard` di bagian atas
    - Tampilkan tombol "Tandai Semua Lunas" — disabled jika tidak ada entry active
    - Tampilkan `LoanEntryList` dengan entries terurut descending by date
    - Empty state: "Belum ada catatan hutang" + tombol tambah jika tidak ada entries
    - FAB navigasi ke `/loans/:contactId/new`
    - _Requirements: 2.6, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_
  - [ ] 9.3 Buat `src/pages/loans/NewLoanPage.tsx`
    - Render `LoanForm` dengan `mode='create'`
    - Baca `contactId` dari URL params jika ada, pass sebagai `defaultContactId`
    - Setelah submit sukses, navigasi ke `/loans/:contactId`
    - _Requirements: 2.1, 2.2, 2.5_
  - [ ] 9.4 Buat `src/pages/loans/EditLoanPage.tsx`
    - Render `LoanForm` dengan `mode='edit'`
    - Load entry berdasarkan `entryId` dari URL params
    - Setelah submit sukses, navigasi kembali ke `/loans/:contactId`
    - _Requirements: 2.1_

- [ ] 10. Tambahkan routes `/loans/*` ke router
  - [ ] 10.1 Update `src/routes/index.tsx`: import semua halaman loans dan tambahkan 5 route baru
    - `{ path: 'loans', element: <ContactListPage /> }`
    - `{ path: 'loans/new', element: <NewLoanPage /> }`
    - `{ path: 'loans/:contactId', element: <LoanDetailPage /> }`
    - `{ path: 'loans/:contactId/new', element: <NewLoanPage /> }`
    - `{ path: 'loans/:contactId/:entryId', element: <EditLoanPage /> }`
    - _Requirements: 1.6_

- [ ] 11. Checkpoint — Pastikan semua tests pass
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 12. Implementasi Tests
  - [ ] 12.1 Tambahkan arbitraries loan ke `src/__tests__/helpers/arbitraries.ts`
    - Tambahkan `arbitraryLoanDirection`, `arbitraryLoanStatus`, `arbitraryLoanContact`, `arbitraryLoanEntry`
    - Ikuti pola `safeDateStr()` yang sudah ada
    - _Requirements: 6.1_
  - [ ]* 12.2 Tulis property tests untuk pure utility functions di `src/__tests__/utils/loanUtils.test.ts`
    - **Property 2: Contact Name Whitespace Validation** — `validateContactName` menolak string all-whitespace
    - **Property 3: Contact Name Length Validation** — `validateContactName` menolak string > 100 karakter
    - **Property 5: Amount Lower Bound Validation** — `validateAmount` menolak amount ≤ 0
    - **Property 6: Amount Upper Bound Validation** — `validateAmount` menolak amount > 999_999_999_999
    - **Property 7: Loan Entry List Sorted by Date Descending** — `sortEntriesByDate` menghasilkan list terurut descending
    - **Property 10: Contact Summary Calculation** — `computeContactSummary` menghitung totalLend dan totalBorrow dengan benar
    - **Property 11: Net Balance Label Correctness** — `getNetBalanceLabel` mengembalikan label yang tepat untuk semua kombinasi
    - **Property 12: Active Contacts Badge Count** — `countContactsWithActiveLoans` menghitung jumlah contact dengan active entries
    - **Validates: Requirements 1.3, 1.4, 1.5, 2.3, 2.4, 2.6, 4.1, 4.2, 4.4**
  - [ ]* 12.3 Tulis property tests untuk DB layer di `src/__tests__/db/loanContactDb.test.ts`
    - **Property 1: Contact Storage Round-Trip** — simpan lalu baca kembali menghasilkan objek identik
    - **Property 13: Delete Entry Removes Permanently** — setelah `deleteContact`, `getContactById` return undefined
    - **Property 14: Delete Contact Cascades to Entries** — setelah `deleteContact`, `getEntriesByContactId` return array kosong
    - **Validates: Requirements 1.1, 5.2, 6.1**
  - [ ]* 12.4 Tulis property tests untuk DB layer di `src/__tests__/db/loanEntryDb.test.ts`
    - **Property 4: Loan Entry Storage Round-Trip** — simpan lalu baca kembali menghasilkan objek identik dengan status `active`
    - **Property 8: Mark Settled Toggle Round-Trip** — toggle dua kali mengembalikan status semula; setelah toggle pertama `settledAt` terisi
    - **Property 9: Mark All Settled Bulk Operation** — setelah `markAllSettled`, semua entry active menjadi settled, yang sudah settled tetap settled
    - **Property 13: Delete Entry Removes Permanently** — setelah `deleteEntry`, `getEntryById` return undefined
    - **Validates: Requirements 2.2, 3.1, 3.3, 3.4, 3.6, 5.1, 6.1, 6.4**

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental sebelum lanjut ke layer berikutnya
- Property tests memvalidasi properti universal; unit tests memvalidasi skenario spesifik dan edge case
- DB layer tidak boleh silent fail — semua error harus di-propagate ke store layer
- Operasi bulk (markAllSettled, deleteContact cascade) harus menggunakan satu `IDBTransaction` atomik

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2", "4.1"] },
    { "id": 3, "tasks": ["6.1", "6.2", "12.1"] },
    { "id": 4, "tasks": ["7.1", "7.2", "12.2", "12.3", "12.4"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3", "9.4"] },
    { "id": 7, "tasks": ["10.1"] }
  ]
}
```
