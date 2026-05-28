# Product Requirements Document (PRD)
# Flowang — Aplikasi Pencatatan Keuangan Personal

**Versi**: 1.0  
**Tanggal**: 2025  
**Tipe**: Feature Spec (Aplikasi Baru)  
**Workflow**: Requirements-First

---

## 1. Ringkasan Produk

**Flowang** adalah aplikasi pencatatan keuangan personal berbasis web dengan pendekatan mobile-first. Aplikasi ini dirancang untuk berjalan sepenuhnya secara offline — semua data disimpan lokal di perangkat pengguna menggunakan IndexedDB, tanpa memerlukan server backend atau koneksi internet.

Tujuan utama aplikasi adalah memberikan cara yang sederhana dan cepat bagi pengguna untuk mencatat aktivitas keuangan harian mereka langsung dari smartphone.

---

## 2. Latar Belakang dan Motivasi

Banyak pengguna menginginkan aplikasi keuangan yang:
- Tidak memerlukan akun atau registrasi
- Tidak mengirim data ke server pihak ketiga (privasi terjaga)
- Dapat digunakan tanpa koneksi internet
- Ringan dan cepat diakses dari browser mobile

Flowang menjawab kebutuhan tersebut dengan pendekatan local-first menggunakan IndexedDB sebagai storage.

---

## 3. Target Pengguna

- Individu yang ingin mencatat keuangan pribadi secara sederhana
- Pengguna yang mengutamakan privasi data keuangan
- Pengguna yang sering mengakses dari perangkat mobile (smartphone)

---

## 4. Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend Framework | React 19 + React Router v7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Runtime | Bun |
| State Management | Zustand |
| Persistensi Data | IndexedDB (browser-native) |
| Form Handling | React Hook Form + Zod |
| Icons | Lucide React |

---

## 5. Fitur Utama

### 5.1 Manajemen Wallet/Rekening
Pengguna dapat membuat beberapa wallet (misalnya: Dompet Tunai, BCA, GoPay) dengan saldo awal masing-masing. Saldo wallet diperbarui otomatis setiap kali transaksi ditambahkan, diedit, atau dihapus.

**Aturan bisnis:**
- Wallet tidak dapat dihapus jika masih memiliki transaksi terkait
- Saldo awal dapat diset saat pembuatan wallet
- Nama wallet wajib diisi

### 5.2 Manajemen Kategori Transaksi
Pengguna dapat membuat kategori kustom untuk mengklasifikasikan transaksi. Aplikasi menyediakan kategori default saat pertama kali dijalankan.

**Kategori default yang disarankan:**
- Makanan & Minuman, Transportasi, Belanja, Kesehatan, Hiburan (Expense)
- Gaji, Freelance, Investasi, Hadiah (Income)

**Aturan bisnis:**
- Kategori tidak dapat dihapus jika masih digunakan oleh transaksi
- Nama kategori wajib diisi

### 5.3 Pencatatan Transaksi
Tiga tipe transaksi yang didukung:

| Tipe | Efek pada Saldo |
|---|---|
| **Income** | Menambah saldo wallet yang dipilih |
| **Expense** | Mengurangi saldo wallet yang dipilih |
| **Transfer** | Mengurangi saldo wallet sumber, menambah saldo wallet tujuan |

**Field transaksi:**
- Tipe (Income / Expense / Transfer)
- Jumlah (wajib, > 0)
- Wallet (wajib; untuk Transfer: wallet sumber + wallet tujuan)
- Kategori (wajib untuk Income/Expense, tidak berlaku untuk Transfer)
- Tanggal (default: hari ini)
- Catatan/Deskripsi (opsional)

**Aturan bisnis:**
- Jumlah harus lebih dari nol
- Transfer tidak boleh menggunakan wallet sumber dan tujuan yang sama
- Penghapusan transaksi harus membalikkan efek saldo secara akurat

### 5.4 Dashboard Ringkasan
Halaman utama menampilkan:
- Total saldo keseluruhan (sum semua wallet)
- Daftar wallet dengan saldo masing-masing
- Total Income dan Expense bulan berjalan
- 5 transaksi terbaru

### 5.5 Riwayat Transaksi
Halaman daftar transaksi dengan kemampuan filter berdasarkan:
- Wallet
- Kategori
- Tipe transaksi (Income/Expense/Transfer)
- Rentang tanggal

### 5.6 Laporan Keuangan (Rekap)
Halaman laporan dengan tiga tab:

| Tab | Deskripsi |
|---|---|
| **Realtime** | Rekap transaksi dari tanggal 1 bulan berjalan hingga hari ini |
| **Bulanan** | Daftar bulan yang memiliki transaksi, dengan total Income dan Expense per bulan |
| **Custom** | Pilih rentang tanggal sendiri untuk melihat rekap periode tertentu |

Setiap rekap menampilkan: total Income, total Expense, dan saldo bersih (Income − Expense).

---

## 6. Persyaratan Non-Fungsional

### 6.1 Offline-First
- Aplikasi harus berfungsi penuh tanpa koneksi internet
- Semua operasi data dilakukan melalui IndexedDB

### 6.2 Mobile-First UI
- Layout dioptimalkan untuk layar smartphone (maks 480px konten utama)
- Bottom navigation untuk navigasi utama
- Elemen sentuh minimal 44×44px (WCAG 2.5.5)
- Tetap berfungsi di desktop (responsive)

### 6.3 Integritas Data
- Operasi saldo wallet harus atomik — jika penyimpanan transaksi gagal, saldo tidak boleh berubah
- Penghapusan transaksi harus selalu membalikkan efek saldo dengan benar

### 6.4 Performa
- Inisialisasi IndexedDB harus selesai sebelum operasi data apapun
- Pemuatan data saat aplikasi dibuka harus terasa instan untuk data dalam jumlah wajar (< 10.000 transaksi)

---

## 7. Alur Pengguna Utama

### Alur: Mencatat Pengeluaran
1. Pengguna membuka aplikasi → Dashboard
2. Pengguna menekan tombol "+" atau "Tambah Transaksi"
3. Pengguna memilih tipe "Expense"
4. Pengguna mengisi jumlah, memilih wallet, memilih kategori, mengisi tanggal
5. Pengguna menekan "Simpan"
6. Aplikasi menyimpan transaksi dan mengurangi saldo wallet
7. Dashboard diperbarui dengan saldo terbaru

### Alur: Transfer Antar Wallet
1. Pengguna membuka Transaction_Form
2. Pengguna memilih tipe "Transfer"
3. Form menampilkan field "Dari Wallet" dan "Ke Wallet"
4. Pengguna mengisi kedua wallet (berbeda), jumlah, dan tanggal
5. Pengguna menekan "Simpan"
6. Aplikasi mengurangi saldo wallet sumber dan menambah saldo wallet tujuan

---

## 8. Struktur Data (Konseptual)

### Wallet
```
id: string (UUID)
name: string
balance: number
createdAt: Date
updatedAt: Date
```

### Category
```
id: string (UUID)
name: string
type: 'income' | 'expense' | 'both'
isDefault: boolean
createdAt: Date
```

### Transaction
```
id: string (UUID)
type: 'income' | 'expense' | 'transfer'
amount: number (> 0)
walletId: string (FK → Wallet)
toWalletId?: string (FK → Wallet, hanya untuk transfer)
categoryId?: string (FK → Category, tidak wajib untuk transfer)
date: Date
note?: string
createdAt: Date
updatedAt: Date
```

---

## 9. Halaman Aplikasi

| Halaman | Path | Deskripsi |
|---|---|---|
| Dashboard | `/` | Ringkasan keuangan dan transaksi terbaru |
| Transaksi | `/transactions` | Daftar dan filter riwayat transaksi |
| Tambah/Edit Transaksi | `/transactions/new`, `/transactions/:id` | Form transaksi |
| Laporan | `/reports` | Rekap keuangan (tab Realtime, Bulanan, Custom) |
| Wallet | `/wallets` | Daftar wallet |
| Tambah/Edit Wallet | `/wallets/new`, `/wallets/:id` | Form wallet |
| Kategori | `/categories` | Daftar kategori |
| Tambah/Edit Kategori | `/categories/new`, `/categories/:id` | Form kategori |

---

## 10. Kriteria Keberhasilan

- Pengguna dapat mencatat transaksi dalam waktu < 30 detik
- Data tetap tersimpan setelah browser ditutup dan dibuka kembali
- Saldo wallet selalu akurat setelah setiap operasi transaksi
- Aplikasi dapat digunakan sepenuhnya tanpa koneksi internet
- Antarmuka nyaman digunakan di layar smartphone 375px ke atas

---

## 11. Di Luar Scope (v1.0)

- Sinkronisasi data antar perangkat
- Ekspor/impor data (CSV, JSON)
- Grafik/chart keuangan visual
- Notifikasi atau pengingat
- Multi-user / akun pengguna
- Enkripsi data lokal
- Budget/anggaran bulanan
