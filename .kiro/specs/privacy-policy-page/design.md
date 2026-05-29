# Design Document: Halaman Kebijakan Privasi

## Overview

Fitur ini menambahkan halaman statis Privacy Policy (`/privacy-policy`) ke aplikasi Flowang. Halaman ini dapat diakses dari Halaman Lainnya (`/more`) dan menjelaskan secara transparan bagaimana Flowang menangani data pengguna — dengan penekanan kuat pada pendekatan privacy-first, penyimpanan lokal eksklusif via IndexedDB, dan enkripsi end-to-end untuk fitur sinkronisasi opsional.

Karena halaman ini sepenuhnya statis (tidak ada state management, tidak ada fetch data, tidak ada interaksi kompleks), arsitekturnya sangat sederhana: satu komponen React yang merender konten terstruktur menggunakan Design System yang sudah ada (Tailwind CSS v4, shadcn/ui, CSS variables tema).

Dua perubahan kecil diperlukan di luar halaman itu sendiri:
1. Menambahkan rute `/privacy-policy` ke router
2. Menambahkan tautan ke MorePage
3. Menambahkan `/privacy-policy` ke `MORE_PREFIXES` di `navUtils.ts` agar BottomNav menampilkan Nav_Item Lainnya dalam Active_State

---

## Architecture

### Alur Navigasi

```
MorePage (/more)
  └── Tautan "Kebijakan Privasi" (ShieldCheck icon)
        └── navigate("/privacy-policy")
              └── PrivacyPolicyPage (/privacy-policy)
                    └── Tombol Kembali → navigate(-1) atau navigate("/more")
```

### Integrasi dengan Sistem yang Ada

```
┌─────────────────────────────────────────────────────────┐
│                    Router (routes/index.tsx)             │
│  path: "privacy-policy" → <PrivacyPolicyPage />         │
└──────────────────────────┬──────────────────────────────┘
                           │ child route di bawah AppLayout
┌──────────────────────────▼──────────────────────────────┐
│                    AppLayout                            │
│  <Outlet /> → PrivacyPolicyPage                         │
│  <BottomNav /> → Nav_Item Lainnya aktif                 │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                 navUtils.ts                             │
│  MORE_PREFIXES: [..., "/privacy-policy"]  ← tambahan    │
│  getActiveNavItem("/privacy-policy") → Nav_Item Lainnya │
└─────────────────────────────────────────────────────────┘
```

### Tidak Ada State Management

Halaman ini tidak memerlukan:
- Zustand store baru
- IndexedDB access
- API calls
- React hooks (kecuali `useNavigate` untuk tombol kembali)

---

## Components and Interfaces

### Struktur File Baru

```
src/
└── pages/
    └── privacy-policy/
        └── PrivacyPolicyPage.tsx    # Komponen halaman utama
```

### File yang Dimodifikasi

```
src/
├── routes/index.tsx                 # Tambah rute /privacy-policy
├── pages/more/MorePage.tsx          # Tambah tautan Kebijakan Privasi
└── lib/navUtils.ts                  # Tambah /privacy-policy ke MORE_PREFIXES
```

### Hierarki Komponen PrivacyPolicyPage

```
PrivacyPolicyPage
├── Header
│   ├── BackButton (ArrowLeft icon, navigate(-1) / navigate("/more"))
│   └── PageTitle ("Kebijakan Privasi")
└── <main> (konten utama)
    ├── TitleSection
    │   ├── <h1> "Kebijakan Privasi"
    │   └── LastUpdated ("Terakhir diperbarui: DD Bulan YYYY")
    ├── Section: Prinsip Privacy-First (<h2>)
    ├── Section: Data yang Dikumpulkan (<h2>)
    ├── Section: Enkripsi End-to-End (<h2>)
    ├── Section: Google Drive App Data (<h2>)
    └── Section: Kontrol Pengguna atas Data (<h2>)
```

### Interface Komponen

```typescript
// PrivacyPolicyPage tidak menerima props — halaman statis murni
export default function PrivacyPolicyPage(): JSX.Element

// Tidak ada props interface yang diperlukan
```

### Modifikasi MorePage

Tambahkan satu item baru ke array `moreNavItems`:

```typescript
import { Wallet, Tag, Settings, ShieldCheck, ChevronRight } from "lucide-react";

const moreNavItems: MoreNavItem[] = [
  { to: "/wallets", icon: Wallet, label: "Wallet", description: "Kelola dompet dan saldo" },
  { to: "/categories", icon: Tag, label: "Kategori", description: "Atur kategori pemasukan & pengeluaran" },
  { to: "/settings", icon: Settings, label: "Pengaturan", description: "Tema, sinkronisasi, & lainnya", showSyncIndicator: true },
  { to: "/privacy-policy", icon: ShieldCheck, label: "Kebijakan Privasi", description: "Cara kami melindungi data Anda" },
];
```

### Modifikasi navUtils.ts

```typescript
export const MORE_PREFIXES = ["/more", "/wallets", "/categories", "/settings", "/privacy-policy"];
```

### Modifikasi routes/index.tsx

```typescript
import PrivacyPolicyPage from "@/pages/privacy-policy/PrivacyPolicyPage";

// Di dalam array children:
{ path: "privacy-policy", element: <PrivacyPolicyPage /> },
```

---

## Data Models

Halaman ini tidak memiliki data model baru. Seluruh konten adalah teks statis yang di-hardcode langsung di komponen.

### Konstanta Konten

```typescript
// Tanggal terakhir diperbarui — di-hardcode sebagai konstanta
const LAST_UPDATED = "1 Januari 2025";

// Tidak ada data dinamis, tidak ada fetch, tidak ada state
```

### Struktur Konten per Section

Setiap section mengikuti pola yang sama:

```typescript
interface PolicySection {
  id: string;        // untuk anchor/accessibility
  heading: string;   // teks <h2>
  content: ReactNode; // paragraf dan list
}
```

Sections yang akan dirender:

| ID | Heading |
|---|---|
| `privacy-first` | Prinsip Privacy-First |
| `data-collected` | Data yang Dikumpulkan dan Tidak Dikumpulkan |
| `e2e-encryption` | Enkripsi End-to-End untuk Fitur Sinkronisasi |
| `google-drive` | Google Drive App Data |
| `user-control` | Kontrol dan Hak Pengguna atas Data |

---

## Layout dan Desain Visual

### Struktur Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Kembali    [Header]                                  │  pt-1, px-4
├─────────────────────────────────────────────────────────┤
│  Kebijakan Privasi                    [h1, text-xl bold] │
│  Terakhir diperbarui: 1 Januari 2025  [text-xs muted]   │
├─────────────────────────────────────────────────────────┤
│  ## Prinsip Privacy-First             [h2, text-base]   │
│  Flowang adalah aplikasi privacy-first...               │
│                                                         │
│  ## Data yang Dikumpulkan...          [h2, text-base]   │
│  ...                                                    │
│                                                         │
│  ## Enkripsi End-to-End...            [h2, text-base]   │
│  ...                                                    │
│                                                         │
│  ## Google Drive App Data             [h2, text-base]   │
│  ...                                                    │
│                                                         │
│  ## Kontrol Pengguna atas Data        [h2, text-base]   │
│  ...                                                    │
│                                       [pb-24 untuk nav] │
└─────────────────────────────────────────────────────────┘
│  BottomNav (fixed bottom)                               │
└─────────────────────────────────────────────────────────┘
```

### Spesifikasi Tipografi

| Elemen | Kelas Tailwind | Keterangan |
|---|---|---|
| Judul halaman `<h1>` | `text-xl font-bold text-foreground` | Sesuai requirements 7.5 |
| Heading section `<h2>` | `text-base font-semibold text-foreground` | Sesuai requirements 7.5 |
| Body text `<p>` | `text-sm text-muted-foreground leading-relaxed` | Minimal 14px |
| Tanggal update | `text-xs text-muted-foreground` | Di bawah judul |
| Label list item | `text-sm text-foreground font-medium` | Untuk item daftar |

### Spesifikasi Tombol Kembali

```typescript
<button
  type="button"
  onClick={() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/more");
    }
  }}
  className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
  aria-label="Kembali ke halaman sebelumnya"
>
  <ArrowLeft className="h-4 w-4" />
</button>
```

Catatan: `h-8 w-8` = 32×32px untuk tombol ikon. Untuk memenuhi standar 44×44px touch target (requirements 8.4), wrapper div dengan padding atau `min-h-[44px] min-w-[44px]` ditambahkan, atau menggunakan pola yang sama dengan WalletDetailPage yang sudah ada.

---

## Konten Halaman

### Section 1: Prinsip Privacy-First

**Heading**: "Prinsip Privacy-First"

Konten mencakup:
- Flowang adalah aplikasi privacy-first: tidak ada akun, tidak ada registrasi, tidak ada data yang dikirim ke server untuk fitur utama
- Seluruh data keuangan (transaksi, wallet, kategori) tersimpan eksklusif di IndexedDB lokal perangkat pengguna
- Aplikasi berfungsi penuh tanpa koneksi internet untuk fitur utama
- Tidak ada cookie pelacak, tidak ada layanan analitik pihak ketiga, tidak ada iklan

### Section 2: Data yang Dikumpulkan dan Tidak Dikumpulkan

**Heading**: "Data yang Dikumpulkan"

Konten mencakup:
- Daftar eksplisit data yang **tidak** dikumpulkan: nama pengguna, alamat email, nomor telepon, lokasi perangkat, informasi identitas pribadi lainnya
- Pernyataan bahwa data keuangan (jumlah transaksi, nama wallet, nama kategori, catatan) hanya tersimpan lokal selama Sync_Feature tidak aktif
- Pernyataan bahwa App tidak memiliki akses ke data lokal — data sepenuhnya di bawah kendali pengguna

### Section 3: Enkripsi End-to-End untuk Fitur Sinkronisasi

**Heading**: "Enkripsi End-to-End untuk Fitur Sinkronisasi"

Konten mencakup:
- Sync_Feature bersifat opsional, hanya aktif jika pengguna mengaktifkannya di halaman Pengaturan
- Encryption_Key di-generate lokal menggunakan AES-256-GCM via Web Crypto API dan tidak pernah dikirim ke server
- Semua data yang dikirim via WebRTC maupun diupload ke Google Drive dienkripsi sebelum meninggalkan perangkat
- Peran Signaling_Server: hanya memfasilitasi handshake WebRTC awal, tidak menyimpan data pengguna, tidak dapat membaca konten data
- Setelah koneksi WebRTC berhasil, komunikasi berlangsung P2P langsung tanpa melewati Signaling_Server

### Section 4: Google Drive App Data

**Heading**: "Google Drive App Data"

Konten mencakup:
- Fitur Google Drive backup bersifat opsional, hanya aktif jika pengguna login dengan akun Google
- App hanya menggunakan scope `drive.appdata` — akses terbatas ke App_Data_Folder yang tersembunyi dan tidak terlihat di Google Drive UI
- Data dienkripsi sebelum upload sehingga Google tidak dapat membaca konten
- App tidak mengakses file di luar App_Data_Folder
- Pengguna dapat mencabut akses kapan saja melalui halaman Pengaturan atau pengaturan akun Google

### Section 5: Kontrol dan Hak Pengguna atas Data

**Heading**: "Kontrol dan Hak Pengguna atas Data"

Konten mencakup:
- Pengguna memiliki kendali penuh karena data tersimpan di perangkat sendiri
- Cara menghapus semua data: hapus site data melalui pengaturan browser (menghapus IndexedDB secara permanen)
- Peringatan: penghapusan data browser bersifat permanen dan tidak dapat dipulihkan kecuali ada backup Google Drive
- Tidak ada proses "penghapusan akun" — cukup hapus data browser
- Pengguna yang menggunakan Google Drive backup dapat menghapus data backup dengan mencabut akses aplikasi melalui pengaturan akun Google

---

## Error Handling

Halaman ini adalah halaman statis murni — tidak ada operasi yang bisa gagal. Tidak ada error handling yang diperlukan selain:

### Navigasi Kembali Fallback

```typescript
// Jika history tidak memiliki entri sebelumnya (misalnya pengguna membuka URL langsung),
// tombol kembali mengarahkan ke /more sebagai fallback
const handleBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate("/more");
  }
};
```

### Rute Tidak Ditemukan

Jika pengguna mengakses `/privacy-policy` secara langsung tanpa melalui MorePage, halaman tetap dirender dengan benar karena rute terdaftar sebagai child route di bawah AppLayout. Tidak ada error state yang perlu ditangani.

---

## Testing Strategy

### Penilaian PBT

Fitur ini adalah halaman statis murni — tidak ada fungsi transformasi data, tidak ada logika bisnis, tidak ada input yang bervariasi secara bermakna. **Property-based testing tidak applicable** untuk fitur ini karena:

- Tidak ada fungsi murni dengan ruang input yang luas
- Tidak ada transformasi data yang perlu diverifikasi
- Semua acceptance criteria adalah pengujian konten statis atau perilaku UI spesifik
- Tidak ada properti universal yang berlaku untuk semua input

Strategi testing yang digunakan adalah **unit tests berbasis contoh** (example-based) menggunakan Bun test + `@testing-library/react`.

### Unit Tests

**`src/__tests__/pages/PrivacyPolicyPage.test.tsx`**

```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivacyPolicyPage from "@/pages/privacy-policy/PrivacyPolicyPage";

// Helper untuk render dengan router
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/privacy-policy"]}>
      <PrivacyPolicyPage />
    </MemoryRouter>
  );
```

**Skenario yang diuji:**

1. **Struktur semantik HTML**
   - Verifikasi keberadaan elemen `<main>`
   - Verifikasi keberadaan `<h1>` dengan teks "Kebijakan Privasi"
   - Verifikasi keberadaan minimal 5 elemen `<h2>` (satu per section)

2. **Konten wajib**
   - Verifikasi teks "IndexedDB" atau "penyimpanan lokal" ada di halaman
   - Verifikasi teks "AES-256-GCM" ada di section enkripsi
   - Verifikasi teks "drive.appdata" ada di section Google Drive
   - Verifikasi tanggal terakhir diperbarui ada di halaman

3. **Tombol kembali**
   - Verifikasi tombol kembali ada dengan `aria-label` yang bermakna (bukan kosong atau generik)
   - Verifikasi tombol kembali dapat difokus dengan keyboard

4. **Aksesibilitas dasar**
   - Verifikasi tidak ada elemen interaktif tanpa label aksesibilitas

**`src/__tests__/lib/navUtils.test.ts`** (tambahan ke file yang sudah ada)

```typescript
// Verifikasi /privacy-policy termasuk dalam MORE_PREFIXES
test("MORE_PREFIXES includes /privacy-policy", () => {
  expect(MORE_PREFIXES).toContain("/privacy-policy");
});

// Verifikasi getActiveNavItem mengembalikan Nav_Item Lainnya untuk /privacy-policy
test("getActiveNavItem returns Lainnya for /privacy-policy", () => {
  const item = getActiveNavItem("/privacy-policy");
  expect(item?.to).toBe("/more");
});
```

**`src/__tests__/pages/MorePage.test.tsx`** (tambahan ke file yang sudah ada atau file baru)

```typescript
// Verifikasi MorePage menampilkan tautan Kebijakan Privasi
test("MorePage renders Kebijakan Privasi link", () => {
  render(<MorePage />, { wrapper: MemoryRouter });
  expect(screen.getByText("Kebijakan Privasi")).toBeInTheDocument();
});
```

### Pengujian Aksesibilitas Manual

Karena beberapa acceptance criteria (kontras warna WCAG 2.1 AA, keyboard navigation, touch target 44×44px) memerlukan pengujian manual:

- **Kontras warna**: Gunakan browser DevTools atau tool seperti axe DevTools untuk memverifikasi rasio kontras ≥ 4.5:1
- **Keyboard navigation**: Uji Tab → Enter/Space pada tombol kembali dan tautan
- **Screen reader**: Uji dengan VoiceOver (macOS/iOS) atau TalkBack (Android) untuk memverifikasi label aksesibilitas
- **Touch target**: Verifikasi secara visual bahwa tombol kembali memiliki area sentuh yang cukup

### Snapshot Test (Opsional)

Jika diperlukan untuk mencegah regresi visual:

```typescript
test("PrivacyPolicyPage matches snapshot", () => {
  const { container } = renderPage();
  expect(container).toMatchSnapshot();
});
```

---

## Keputusan Desain

### 1. Halaman Statis vs. Konten dari CMS/Database

**Keputusan**: Konten di-hardcode langsung di komponen React.

**Alasan**: Kebijakan privasi jarang berubah dan tidak memerlukan kemampuan edit dinamis. Hardcoding menyederhanakan implementasi secara signifikan — tidak perlu database, tidak perlu admin panel, tidak perlu fetch. Jika konten perlu diperbarui, developer cukup mengubah teks di komponen dan memperbarui tanggal `LAST_UPDATED`.

### 2. Tidak Ada Komponen Terpisah per Section

**Keputusan**: Semua section dirender langsung di `PrivacyPolicyPage.tsx` tanpa memecah menjadi sub-komponen.

**Alasan**: Halaman ini cukup sederhana dan tidak ada section yang perlu di-reuse di tempat lain. Memecah menjadi sub-komponen akan menambah kompleksitas tanpa manfaat nyata.

### 3. Tombol Kembali dengan Fallback ke /more

**Keputusan**: `navigate(-1)` dengan fallback ke `navigate("/more")` jika history kosong.

**Alasan**: Pengguna yang mengakses halaman langsung via URL (misalnya dari bookmark) tidak memiliki history navigasi. Fallback ke `/more` memberikan pengalaman yang konsisten karena `/privacy-policy` dapat diakses dari sana.

### 4. MORE_PREFIXES Diperluas

**Keputusan**: Menambahkan `/privacy-policy` ke `MORE_PREFIXES` di `navUtils.ts`.

**Alasan**: Ini konsisten dengan pola yang sudah ada — semua halaman yang dapat diakses dari MorePage (termasuk `/wallets`, `/categories`, `/settings`) sudah ada di `MORE_PREFIXES`. Menambahkan `/privacy-policy` memastikan BottomNav menampilkan Nav_Item Lainnya dalam Active_State saat pengguna berada di halaman ini, memberikan orientasi navigasi yang konsisten.
