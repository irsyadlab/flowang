# Implementation Plan: Bottom Nav Simplification

## Overview

Implementasi ini menyederhanakan bottom navigation bar dari 6 item menjadi 4 item dengan menambahkan halaman "Lainnya" sebagai hub navigasi. Urutan pengerjaan: ekstrak fungsi murni terlebih dahulu agar bisa diuji secara independen, lalu modifikasi komponen, buat halaman baru, update routing, dan terakhir tulis semua tests.

## Tasks

- [x] 1. Ekstrak fungsi murni ke file utilitas
  - [x] 1.1 Buat file `src/lib/navUtils.ts` dengan fungsi `getActiveNavItem` dan `getSyncIndicatorColor`
    - Definisikan konstanta `MORE_PREFIXES = ["/more", "/wallets", "/categories", "/settings"]`
    - Definisikan interface `NavItem { to: string; icon: LucideIcon; label: string; end?: boolean }`
    - Implementasikan `getActiveNavItem(pathname: string): NavItem | null` — mengembalikan item aktif berdasarkan prefix matching; Beranda hanya aktif jika `pathname === "/"`, item lain aktif jika `pathname.startsWith(prefix)`; item "Lainnya" aktif jika pathname cocok dengan salah satu `MORE_PREFIXES`; kembalikan `null` jika tidak ada yang cocok
    - Implementasikan `getSyncIndicatorColor(syncKey: string | null, syncStatus: SyncStatus): string | null` — kembalikan `null` jika `syncKey` null, `"bg-green-500"` jika connected, `"bg-yellow-500 animate-pulse"` jika connecting, `"bg-red-500"` untuk status lainnya
    - Export kedua fungsi dan konstanta `MORE_PREFIXES`
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 2.8, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Modifikasi `BottomNav.tsx`
  - [x] 2.1 Perbarui `src/components/layout/BottomNav.tsx` dengan struktur 4 item
    - Hapus import `Wallet`, `Tag`, `Settings` dan `useSyncStore`
    - Tambah import `MoreHorizontal` dari lucide-react
    - Tambah import `useLocation`, `useNavigate` dari react-router-dom
    - Tambah import `MORE_PREFIXES` dari `@/lib/navUtils`
    - Kurangi `navItems` menjadi 3 item: Beranda (`/`, `end: true`), Transaksi (`/transactions`), Laporan (`/reports`)
    - Hapus komponen `SyncIndicator` dari file ini
    - Tambah logika `isMoreActive` menggunakan `useLocation`: `MORE_PREFIXES.some(p => location.pathname === p || location.pathname.startsWith(p + "/"))`
    - Render item "Lainnya" sebagai `<button>` dengan `onClick={() => navigate("/more")}` menggunakan ikon `MoreHorizontal`, dengan visual active state (bg-primary/8, ikon 22×22px, titik indikator) saat `isMoreActive === true`
    - Pertahankan semua class visual yang ada untuk 3 item NavLink yang tersisa (ikon 22×22px aktif / 20×20px tidak aktif, transisi 200ms, titik indikator, bg-primary/8)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 4.5_

- [x] 3. Buat `MorePage.tsx`
  - [x] 3.1 Buat file `src/pages/more/MorePage.tsx`
    - Import `useNavigate` dari react-router-dom
    - Import `Wallet`, `Tag`, `Settings`, `ChevronRight` dari lucide-react
    - Import `useSyncStore` dari `@/sync/syncStore`
    - Import `getSyncIndicatorColor` dari `@/lib/navUtils`
    - Definisikan interface `MoreNavItem { to: string; icon: LucideIcon; label: string; showSyncIndicator?: boolean }`
    - Definisikan array `moreNavItems` dengan 3 item: Wallet (`/wallets`), Kategori (`/categories`), Pengaturan (`/settings`, `showSyncIndicator: true`)
    - Buat komponen `SyncIndicator` lokal yang menggunakan `useSyncStore` untuk membaca `syncKey` dan `syncStatus`, memanggil `getSyncIndicatorColor`, dan merender `<span>` dengan class warna yang sesuai (atau `null` jika `syncKey` null)
    - Render halaman dengan header `<h1>Lainnya</h1>` dan daftar item dalam container `rounded-xl border bg-card divide-y`
    - Setiap item: `flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted`, ikon container `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10`, ikon `h-4 w-4 text-primary`, label `text-sm font-medium`, `SyncIndicator` di sebelah kiri label untuk item Pengaturan, `ChevronRight h-4 w-4 shrink-0 text-muted-foreground` di ujung kanan
    - Navigasi menggunakan `useNavigate` pada `onClick` setiap item
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 4. Update `routes/index.tsx`
  - [x] 4.1 Tambahkan rute `/more` ke `src/routes/index.tsx`
    - Tambah import `MorePage from "@/pages/more/MorePage"`
    - Tambah entri `{ path: "more", element: <MorePage /> }` di dalam array `children` AppLayout, letakkan setelah rute `/reports`
    - Pastikan semua rute yang ada (`/wallets`, `/categories`, `/settings`, dan sub-rutenya) tidak diubah
    - _Requirements: 2.1, 3.1_

- [x] 5. Checkpoint — Verifikasi integrasi awal
  - Pastikan semua tests yang ada tetap lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [x] 6. Tulis unit tests untuk `BottomNav`
  - [x] 6.1 Buat file `src/__tests__/components/BottomNav.test.tsx`
    - Setup: render `BottomNav` di dalam `MemoryRouter` dengan `initialEntries`
    - Test: verifikasi tepat 4 Nav_Item ditampilkan dengan label "Beranda", "Transaksi", "Laporan", "Lainnya" dalam urutan yang benar
    - Test: klik Nav_Item Beranda → navigasi ke `/`
    - Test: klik Nav_Item Transaksi → navigasi ke `/transactions`
    - Test: klik Nav_Item Laporan → navigasi ke `/reports`
    - Test: klik Nav_Item Lainnya → navigasi ke `/more`
    - Test: rute `/` → hanya Beranda dalam active state
    - Test: rute `/transactions/new` → hanya Transaksi dalam active state
    - Test: rute `/reports/monthly/2024/1` → hanya Laporan dalam active state
    - Test: rute `/more` → hanya Lainnya dalam active state
    - Test: rute `/wallets` → hanya Lainnya dalam active state
    - Test: rute `/categories` → hanya Lainnya dalam active state
    - Test: rute `/settings` → hanya Lainnya dalam active state
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 4.1, 4.5_

  - [ ]* 6.2 Tulis unit tests untuk `MorePage`
    - Setup: render `MorePage` di dalam `MemoryRouter`
    - Test: verifikasi 3 item ditampilkan dengan label "Wallet", "Kategori", "Pengaturan"
    - Test: verifikasi ikon `Wallet`, `Tag`, `Settings` masing-masing ada
    - Test: klik item Wallet → navigasi ke `/wallets`
    - Test: klik item Kategori → navigasi ke `/categories`
    - Test: klik item Pengaturan → navigasi ke `/settings`
    - Test: render dengan `syncKey: null` → `SyncIndicator` tidak ditampilkan
    - Test: render dengan `syncKey: "abc"` dan `syncStatus: "connected"` → titik hijau (`bg-green-500`) ditampilkan
    - Test: render dengan `syncKey: "abc"` dan `syncStatus: "connecting"` → titik kuning dengan `animate-pulse` ditampilkan
    - Test: render dengan `syncKey: "abc"` dan `syncStatus: "disconnected"` → titik merah (`bg-red-500`) ditampilkan
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 7. Tulis property tests (fast-check)
  - [ ]* 7.1 Tulis property test untuk Property 1 — Eksklusivitas Active State
    - Buat file `src/__tests__/components/bottomNav.pbt.test.ts`
    - Gunakan `fc.webPath()` untuk generate rute URL acak
    - Verifikasi bahwa `getActiveNavItem(path)` mengembalikan tepat 0 atau 1 item aktif (tidak pernah lebih dari satu)
    - Implementasikan helper `countActiveNavItems(pathname)` yang menghitung berapa banyak item yang akan aktif untuk pathname tersebut
    - Tag komentar: `// Feature: bottom-nav-simplification, Property 1: active state exclusivity`
    - `numRuns: 100`
    - **Property 1: Eksklusivitas Active State**
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 7.2 Tulis property test untuk Property 2 — Active State Berbasis Prefix
    - Gunakan `fc.constantFrom("/transactions", "/reports")` dan `fc.array(fc.webSegment(), { minLength: 0, maxLength: 3 })` untuk generate path
    - Verifikasi bahwa `getActiveNavItem(path)` mengembalikan item dengan label "Transaksi" atau "Laporan" sesuai prefix
    - Tag komentar: `// Feature: bottom-nav-simplification, Property 2: prefix-based active state`
    - `numRuns: 100`
    - **Property 2: Active State Berbasis Prefix untuk Transaksi dan Laporan**
    - **Validates: Requirements 1.8, 1.9, 4.2**

  - [ ]* 7.3 Tulis property test untuk Property 3 — Multi-Prefix Active State untuk Lainnya
    - Gunakan `fc.constantFrom("/more", "/wallets", "/categories", "/settings")` dan `fc.array(fc.webSegment(), { minLength: 0, maxLength: 3 })`
    - Verifikasi bahwa `getActiveNavItem(path)` mengembalikan item dengan label "Lainnya"
    - Verifikasi bahwa item Beranda, Transaksi, dan Laporan tidak aktif
    - Tag komentar: `// Feature: bottom-nav-simplification, Property 3: multi-prefix active state for Lainnya`
    - `numRuns: 100`
    - **Property 3: Active State Multi-Prefix untuk Nav_Item Lainnya**
    - **Validates: Requirements 1.10, 4.3**

  - [ ]* 7.4 Tulis property test untuk Property 4 — Pemetaan Warna SyncIndicator
    - Gunakan `fc.option(fc.string({ minLength: 1 }), { nil: null })` untuk `syncKey`
    - Gunakan `fc.constantFrom("connected", "connecting", "disconnected")` untuk `syncStatus`
    - Verifikasi output `getSyncIndicatorColor(syncKey, syncStatus)` sesuai tabel pemetaan di design doc
    - Tag komentar: `// Feature: bottom-nav-simplification, Property 4: SyncIndicator color mapping`
    - `numRuns: 100`
    - **Property 4: Pemetaan Warna SyncIndicator**
    - **Validates: Requirements 2.8**

  - [ ]* 7.5 Tulis property test untuk Property 5 — WalletList Merender Semua Wallet
    - Gunakan `arbitraryWallet` dari `src/__tests__/helpers/arbitraries.ts`
    - Gunakan `fc.array(arbitraryWallet, { minLength: 1, maxLength: 20 })`
    - Render `WalletList` dengan mock `useWalletStore` yang mengembalikan array wallet tersebut
    - Verifikasi jumlah kartu wallet yang dirender sama persis dengan panjang array input
    - Tag komentar: `// Feature: bottom-nav-simplification, Property 5: WalletList renders all wallets`
    - `numRuns: 100`
    - **Property 5: WalletList Merender Semua Wallet**
    - **Validates: Requirements 3.4**

- [x] 8. Checkpoint akhir — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan kepada pengguna jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Fungsi murni di `navUtils.ts` (task 1.1) harus diselesaikan sebelum tests property (task 7.x) karena tests tersebut mengimpor fungsi tersebut secara langsung
- `BottomNav.tsx` tidak lagi mengimpor `useSyncStore` — logika SyncIndicator sepenuhnya dipindah ke `MorePage.tsx`
- `AppLayout.tsx` tidak perlu diubah; padding `pb-24` sudah memenuhi persyaratan minimum ≥ 80px (Requirements 5.3)
- Property tests menggunakan `bun:test` sebagai runner, konsisten dengan test yang sudah ada di proyek
- Untuk Property 5, gunakan mock `useWalletStore` agar test tidak bergantung pada IndexedDB

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["6.1", "6.2", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 4, "tasks": ["7.5"] }
  ]
}
```
