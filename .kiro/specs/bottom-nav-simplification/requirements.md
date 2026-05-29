# Requirements Document

## Introduction

Fitur ini menyederhanakan bottom navigation bar aplikasi Flowang dari 6 item menjadi 4 item inti. Saat ini bottom nav menampilkan: Beranda, Transaksi, Laporan, Wallet, Kategori, dan Pengaturan — terlalu padat untuk layar mobile. Penyederhanaan ini mempertahankan akses ke semua halaman yang ada, namun mengelompokkan halaman yang jarang diakses (Wallet, Kategori, Pengaturan) ke dalam satu halaman "Lainnya", sehingga navigasi lebih bersih dan intuitif.

## Glossary

- **Bottom_Nav**: Komponen navigasi tetap di bagian bawah layar (`BottomNav.tsx`)
- **Nav_Item**: Satu entri navigasi di dalam Bottom_Nav, terdiri dari ikon dan label
- **Halaman_Lainnya**: Halaman baru (`/more`) yang mengelompokkan akses ke Wallet, Kategori, dan Pengaturan
- **FAB_Catat**: Tombol "Catat" berbentuk pill di header Dashboard yang mengarahkan ke `/transactions/new`
- **Active_State**: Kondisi visual Nav_Item ketika rute yang sedang aktif sesuai dengan rute Nav_Item tersebut
- **Router**: Sistem routing React Router DOM yang mengelola navigasi antar halaman
- **Dashboard**: Halaman utama di rute `/` yang menampilkan ringkasan keuangan dan daftar wallet
- **Sync_Indicator**: Indikator titik berwarna di Nav_Item Pengaturan yang menunjukkan status sinkronisasi

---

## Requirements

### Requirement 1: Struktur Bottom Nav Baru

**User Story:** Sebagai pengguna, saya ingin bottom navigation bar yang lebih ringkas, agar saya dapat menavigasi aplikasi dengan nyaman di layar mobile tanpa merasa sesak.

#### Acceptance Criteria

1. THE Bottom_Nav SHALL menampilkan tepat 4 Nav_Item secara berurutan: Beranda (`/`), Transaksi (`/transactions`), Laporan (`/reports`), dan Lainnya (`/more`).
2. THE Bottom_Nav SHALL menghapus Nav_Item Wallet, Kategori, dan Pengaturan dari daftar item yang ditampilkan.
3. WHEN pengguna mengetuk Nav_Item Beranda, THE Router SHALL menavigasi ke rute `/`.
4. WHEN pengguna mengetuk Nav_Item Transaksi, THE Router SHALL menavigasi ke rute `/transactions`.
5. WHEN pengguna mengetuk Nav_Item Laporan, THE Router SHALL menavigasi ke rute `/reports`.
6. WHEN pengguna mengetuk Nav_Item Lainnya, THE Router SHALL menavigasi ke rute `/more`.
7. WHEN rute aktif adalah `/`, THE Bottom_Nav SHALL menampilkan Nav_Item Beranda dalam Active_State dan Nav_Item lainnya dalam keadaan tidak aktif.
8. WHEN rute aktif dimulai dengan `/transactions`, THE Bottom_Nav SHALL menampilkan Nav_Item Transaksi dalam Active_State dan Nav_Item lainnya dalam keadaan tidak aktif.
9. WHEN rute aktif dimulai dengan `/reports`, THE Bottom_Nav SHALL menampilkan Nav_Item Laporan dalam Active_State dan Nav_Item lainnya dalam keadaan tidak aktif.
10. WHEN rute aktif adalah `/more`, dimulai dengan `/wallets`, dimulai dengan `/categories`, atau dimulai dengan `/settings`, THE Bottom_Nav SHALL menampilkan Nav_Item Lainnya dalam Active_State dan Nav_Item lainnya dalam keadaan tidak aktif.

---

### Requirement 2: Halaman Lainnya sebagai Hub Navigasi

**User Story:** Sebagai pengguna, saya ingin ada satu halaman terpusat untuk mengakses Wallet, Kategori, dan Pengaturan, agar semua fitur tetap mudah ditemukan meskipun tidak ada di bottom nav.

#### Acceptance Criteria

1. THE Router SHALL mendaftarkan rute `/more` yang merender Halaman_Lainnya.
2. THE Halaman_Lainnya SHALL menampilkan tautan navigasi ke `/wallets` dengan label "Wallet" dan ikon `Wallet` dari lucide-react.
3. THE Halaman_Lainnya SHALL menampilkan tautan navigasi ke `/categories` dengan label "Kategori" dan ikon `Tag` dari lucide-react.
4. THE Halaman_Lainnya SHALL menampilkan tautan navigasi ke `/settings` dengan label "Pengaturan" dan ikon `Settings` dari lucide-react.
5. WHEN pengguna mengetuk tautan Wallet di Halaman_Lainnya, THE Router SHALL menavigasi ke rute `/wallets`.
6. WHEN pengguna mengetuk tautan Kategori di Halaman_Lainnya, THE Router SHALL menavigasi ke rute `/categories`.
7. WHEN pengguna mengetuk tautan Pengaturan di Halaman_Lainnya, THE Router SHALL menavigasi ke rute `/settings`.
8. IF sync key telah dikonfigurasi DAN syncStatus adalah `"connected"`, THEN THE Halaman_Lainnya SHALL menampilkan titik berwarna hijau (`bg-green-500`) di baris Pengaturan. IF sync key telah dikonfigurasi DAN syncStatus adalah `"connecting"`, THEN titik tersebut SHALL berwarna kuning dengan animasi pulse (`bg-yellow-500 animate-pulse`). IF sync key telah dikonfigurasi DAN syncStatus selain keduanya, THEN titik tersebut SHALL berwarna merah (`bg-red-500`). IF sync key belum dikonfigurasi, THEN Sync_Indicator SHALL tidak ditampilkan.

---

### Requirement 3: Kelengkapan Akses Halaman

**User Story:** Sebagai pengguna, saya ingin semua halaman yang ada sebelumnya tetap dapat diakses, agar tidak ada fitur yang hilang setelah penyederhanaan navigasi.

#### Acceptance Criteria

1. THE Router SHALL mendaftarkan dan merender halaman yang benar untuk setiap rute berikut: `/wallets` (WalletsPage), `/wallets/new` (NewWalletPage), `/wallets/:id` (EditWalletPage), `/wallets/:id/detail` (WalletDetailPage), `/categories` (CategoriesPage), `/categories/new` (NewCategoryPage), `/categories/:id` (EditCategoryPage), dan `/settings` (SettingsPage).
2. WHEN pengguna berada di Dashboard dan mengetuk kartu wallet dengan id tertentu di widget Wallet_Saya, THE Router SHALL menavigasi ke rute `/wallets/:id/detail` dengan `:id` sesuai wallet yang diketuk.
3. WHEN pengguna berada di Dashboard dan mengetuk tombol "Tambah" di widget Wallet_Saya, THE Router SHALL menavigasi ke rute `/wallets/new`.
4. THE Dashboard SHALL menampilkan widget Wallet_Saya yang memuat setidaknya satu kartu wallet apabila data wallet tersedia, mendukung scroll horizontal, dan tetap terlihat di halaman utama.
5. WHEN pengguna berada di halaman `/wallets` dan mengetuk tombol tambah wallet, THE Router SHALL menavigasi ke rute `/wallets/new`.
6. WHEN pengguna berada di halaman `/categories` dan mengetuk tombol tambah kategori, THE Router SHALL menavigasi ke rute `/categories/new`.

---

### Requirement 4: Konsistensi Visual dan Perilaku Active State

**User Story:** Sebagai pengguna, saya ingin selalu tahu halaman mana yang sedang aktif melalui indikator visual yang jelas di bottom nav, agar orientasi navigasi saya tetap terjaga.

#### Acceptance Criteria

1. THE Bottom_Nav SHALL menampilkan tepat satu Nav_Item dalam Active_State pada satu waktu.
2. WHEN rute aktif dimulai dengan prefix dari salah satu Nav_Item (misalnya `/transactions/new` untuk Nav_Item Transaksi, atau `/reports/monthly/:year/:month` untuk Nav_Item Laporan), THE Bottom_Nav SHALL menampilkan Nav_Item yang prefixnya cocok dalam Active_State.
3. WHEN rute aktif adalah `/more`, dimulai dengan `/wallets`, dimulai dengan `/categories`, atau dimulai dengan `/settings`, THE Bottom_Nav SHALL menampilkan Nav_Item Lainnya dalam Active_State.
4. IF tidak ada rute yang cocok dengan keempat Nav_Item, THEN THE Bottom_Nav SHALL menampilkan semua Nav_Item dalam keadaan tidak aktif (non-active state).
5. THE Bottom_Nav SHALL mempertahankan elemen visual berikut untuk keempat Nav_Item baru: ikon aktif berukuran `22×22px` dan ikon tidak aktif berukuran `20×20px`, durasi transisi `200ms`, indikator titik aktif berukuran `4×4px` di bawah ikon, dan latar belakang highlight `bg-primary/8` pada ikon aktif.

---

### Requirement 5: Aksesibilitas Tombol Catat Transaksi

**User Story:** Sebagai pengguna, saya ingin tetap dapat mencatat transaksi baru dengan cepat dari halaman utama, agar alur kerja utama saya tidak terganggu oleh perubahan navigasi.

#### Acceptance Criteria

1. THE Dashboard SHALL mempertahankan FAB_Catat di header halaman yang mengarahkan ke `/transactions/new`.
2. WHEN pengguna mengetuk FAB_Catat, THE Router SHALL menavigasi ke rute `/transactions/new`.
3. THE AppLayout SHALL menerapkan padding bawah pada elemen `<main>` yang cukup untuk memastikan konten halaman tidak tertutup oleh Bottom_Nav, dengan nilai minimum setara tinggi Bottom_Nav (≥ `80px` atau kelas `pb-20`/`pb-24`).
