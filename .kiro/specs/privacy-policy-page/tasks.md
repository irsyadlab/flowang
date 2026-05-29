# Implementation Plan: Halaman Kebijakan Privasi

## Overview

Implementasi halaman statis Privacy Policy (`/privacy-policy`) yang dapat diakses dari MorePage. Terdiri dari satu file baru (`PrivacyPolicyPage.tsx`) dan tiga modifikasi kecil pada file yang sudah ada (`navUtils.ts`, `routes/index.tsx`, `MorePage.tsx`). Tidak ada state management, store, atau IndexedDB yang terlibat.

## Tasks

- [x] 1. Tambahkan `/privacy-policy` ke `MORE_PREFIXES` di `navUtils.ts`
  - Buka `src/lib/navUtils.ts`
  - Tambahkan `"/privacy-policy"` ke array `MORE_PREFIXES` sehingga BottomNav menampilkan Nav_Item Lainnya dalam Active_State saat pengguna berada di halaman ini
  - _Requirements: 1.4_

  - [ ]* 1.1 Tulis unit test untuk `MORE_PREFIXES` dan `getActiveNavItem` di `navUtils.ts`
    - Buat file `src/__tests__/lib/navUtils.test.ts`
    - Test: `MORE_PREFIXES` mengandung `"/privacy-policy"`
    - Test: `getActiveNavItem("/privacy-policy")` mengembalikan Nav_Item dengan `to === "/more"`
    - Test: `getActiveNavItem("/privacy-policy/sub")` juga mengembalikan Nav_Item Lainnya (prefix match)
    - _Requirements: 1.4_

- [x] 2. Daftarkan rute `/privacy-policy` di `routes/index.tsx`
  - Buka `src/routes/index.tsx`
  - Tambahkan import `PrivacyPolicyPage` dari `@/pages/privacy-policy/PrivacyPolicyPage`
  - Tambahkan `{ path: "privacy-policy", element: <PrivacyPolicyPage /> }` ke array `children` di bawah AppLayout
  - _Requirements: 1.1_

- [x] 3. Tambahkan tautan "Kebijakan Privasi" ke `MorePage.tsx`
  - Buka `src/pages/more/MorePage.tsx`
  - Tambahkan `ShieldCheck` ke import dari `lucide-react`
  - Tambahkan item baru ke array `moreNavItems`: `{ to: "/privacy-policy", icon: ShieldCheck, label: "Kebijakan Privasi", description: "Cara kami melindungi data Anda" }`
  - _Requirements: 1.2, 1.3_

  - [ ]* 3.1 Tulis unit test untuk MorePage
    - Buat file `src/__tests__/components/MorePage.test.tsx`
    - Test: MorePage merender tautan dengan teks "Kebijakan Privasi"
    - Test: Klik tautan "Kebijakan Privasi" menavigasi ke `/privacy-policy`
    - Gunakan `MemoryRouter` + `useLocation` helper seperti pola di `BottomNav.test.tsx`
    - _Requirements: 1.2, 1.3_

- [x] 4. Buat komponen `PrivacyPolicyPage.tsx`
  - Buat file `src/pages/privacy-policy/PrivacyPolicyPage.tsx`
  - Implementasikan struktur layout: header dengan tombol kembali + judul, lalu elemen `<main>` dengan konten
  - Gunakan `useNavigate` dari `react-router-dom` untuk tombol kembali dengan logika fallback: `window.history.length > 1 ? navigate(-1) : navigate("/more")`
  - Tombol kembali: `ArrowLeft` icon, `aria-label="Kembali ke halaman sebelumnya"`, area sentuh minimal 44×44px
  - Judul halaman: `<h1>` dengan kelas `text-xl font-bold text-foreground`
  - Tanggal update: konstanta `LAST_UPDATED = "1 Januari 2025"` ditampilkan dengan kelas `text-xs text-muted-foreground`
  - Padding bawah `pb-24` agar konten tidak tertutup BottomNav
  - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.5, 7.7, 8.1, 8.2, 8.3, 8.4_

  - [ ] 4.1 Implementasikan 5 section konten di `PrivacyPolicyPage.tsx`
    - Setiap section menggunakan `<h2>` dengan kelas `text-base font-semibold text-foreground` dan `<p>` dengan kelas `text-sm text-muted-foreground leading-relaxed`
    - **Section 1 — "Prinsip Privacy-First"** (`id="privacy-first"`): tidak ada akun/registrasi, data tersimpan lokal di IndexedDB, berfungsi offline, tidak ada cookie/analitik/iklan
    - **Section 2 — "Data yang Dikumpulkan"** (`id="data-collected"`): daftar eksplisit data yang tidak dikumpulkan (nama, email, telepon, lokasi, dll.), data keuangan hanya lokal selama Sync tidak aktif, App tidak memiliki akses ke data lokal
    - **Section 3 — "Enkripsi End-to-End untuk Fitur Sinkronisasi"** (`id="e2e-encryption"`): Sync opsional, Encryption_Key AES-256-GCM di-generate lokal via Web Crypto API, data dienkripsi sebelum meninggalkan perangkat, peran Signaling_Server hanya handshake, komunikasi P2P setelah koneksi terbentuk
    - **Section 4 — "Google Drive App Data"** (`id="google-drive"`): backup opsional, scope `drive.appdata`, data dienkripsi sebelum upload, tidak akses file di luar App_Data_Folder, pencabutan akses via Pengaturan atau akun Google
    - **Section 5 — "Kontrol dan Hak Pengguna atas Data"** (`id="user-control"`): kendali penuh karena data di perangkat sendiri, cara hapus data via site data browser, peringatan penghapusan permanen, tidak ada proses "hapus akun", pencabutan akses Google Drive menghapus data backup
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

  - [ ]* 4.2 Tulis unit test untuk `PrivacyPolicyPage`
    - Buat file `src/__tests__/components/PrivacyPolicyPage.test.tsx`
    - Render dengan `MemoryRouter initialEntries={["/privacy-policy"]}`
    - Test struktur semantik: keberadaan elemen `<main>`, `<h1>` dengan teks "Kebijakan Privasi", minimal 5 elemen `<h2>`
    - Test konten wajib: teks "IndexedDB" ada di halaman, teks "AES-256-GCM" ada di halaman, teks "drive.appdata" ada di halaman, tanggal terakhir diperbarui ada di halaman
    - Test tombol kembali: ada dengan `aria-label` yang bermakna (bukan kosong), dapat difokus dengan keyboard (`tabIndex` tidak negatif)
    - _Requirements: 7.3, 7.5, 8.1, 8.2, 8.3, 4.2, 5.2_

- [x] 5. Checkpoint — Pastikan semua test lulus
  - Jalankan `bun test` dan pastikan semua test lulus. Tanyakan kepada pengguna jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Urutan task penting: `navUtils.ts` dan `routes/index.tsx` harus dimodifikasi sebelum `PrivacyPolicyPage.tsx` dibuat agar rute langsung berfungsi
- Tidak ada PBT (property-based testing) untuk fitur ini — halaman statis tanpa fungsi transformasi data
- Semua test menggunakan Bun test + `@testing-library/react` dengan `MemoryRouter` sesuai pola yang sudah ada di proyek
- Kontras warna dan touch target 44×44px memerlukan verifikasi manual dengan DevTools atau axe

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2", "3.1"] },
    { "id": 2, "tasks": ["3", "4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2"] }
  ]
}
```
