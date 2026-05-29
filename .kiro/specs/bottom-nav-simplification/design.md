# Design Document: Bottom Nav Simplification

## Overview

Fitur ini menyederhanakan bottom navigation bar aplikasi Flowang dari 6 item menjadi 4 item inti. Perubahan utama meliputi:

1. **BottomNav.tsx** — dikurangi dari 6 menjadi 4 item: Beranda, Transaksi, Laporan, Lainnya. Active state untuk "Lainnya" dideteksi menggunakan `useLocation` dari react-router-dom, aktif saat rute dimulai dengan `/more`, `/wallets`, `/categories`, atau `/settings`.
2. **MorePage.tsx** — halaman baru di `src/pages/more/MorePage.tsx` sebagai hub navigasi ke Wallet, Kategori, dan Pengaturan, lengkap dengan Sync_Indicator di baris Pengaturan.
3. **routes/index.tsx** — penambahan rute `/more` yang merender `MorePage`.
4. **AppLayout.tsx** — tidak ada perubahan; padding `pb-24` sudah mencukupi.

Tujuan desain adalah mempertahankan akses ke semua halaman yang ada sambil membuat navigasi lebih bersih dan intuitif di layar mobile.

---

## Architecture

### Component Tree

```
AppLayout
├── <main className="flex-1 overflow-y-auto pb-24">
│   └── <Outlet />  ← merender halaman aktif
│       ├── Dashboard (/)
│       ├── TransactionsPage (/transactions)
│       ├── ReportsPage (/reports)
│       ├── MorePage (/more)          ← BARU
│       ├── WalletsPage (/wallets)
│       ├── CategoriesPage (/categories)
│       └── SettingsPage (/settings)
└── BottomNav
    ├── NavItem: Beranda (/)
    ├── NavItem: Transaksi (/transactions)
    ├── NavItem: Laporan (/reports)
    └── NavItem: Lainnya (/more)      ← BARU (menggantikan Wallet, Kategori, Pengaturan)
```

### Alur Navigasi

```
Pengguna mengetuk "Lainnya"
    → Router menavigasi ke /more
    → MorePage dirender
    → Pengguna memilih Wallet / Kategori / Pengaturan
    → Router menavigasi ke /wallets / /categories / /settings
    → Nav_Item "Lainnya" tetap aktif (karena prefix cocok)
```

---

## Components and Interfaces

### 1. BottomNav.tsx (Dimodifikasi)

**Perubahan:**
- `navItems` dikurangi dari 6 menjadi 4 item.
- Item Wallet, Kategori, dan Pengaturan dihapus dari array.
- Item "Lainnya" ditambahkan dengan rute `/more` dan ikon `MoreHorizontal` dari lucide-react.
- Logika active state untuk "Lainnya" menggunakan `useLocation` karena `NavLink` standar hanya mencocokkan satu rute, sedangkan "Lainnya" harus aktif untuk empat prefix rute berbeda.
- `SyncIndicator` dipindahkan ke `MorePage` (tidak lagi dirender di BottomNav).

**Interface navItems baru:**

```typescript
const navItems = [
  { to: "/",            icon: LayoutDashboard, label: "Beranda",   end: true  },
  { to: "/transactions", icon: ArrowLeftRight,  label: "Transaksi", end: false },
  { to: "/reports",     icon: BarChart3,        label: "Laporan",   end: false },
];

// Item "Lainnya" ditangani secara terpisah karena logika active state-nya berbeda
const MORE_PREFIXES = ["/more", "/wallets", "/categories", "/settings"];
```

**Logika active state untuk "Lainnya":**

```typescript
// Di dalam komponen BottomNav
const location = useLocation();
const isMoreActive = MORE_PREFIXES.some(
  (prefix) => location.pathname === prefix || location.pathname.startsWith(prefix + "/")
);
```

Pendekatan ini menggunakan `useLocation` alih-alih `useMatch` karena lebih sederhana untuk mencocokkan multiple prefix sekaligus. `useMatch` memerlukan satu pola per panggilan, sehingga membutuhkan empat panggilan hook terpisah yang tidak bisa dilakukan secara kondisional.

**Struktur render item "Lainnya":**

```tsx
<button
  onClick={() => navigate("/more")}
  className={`relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium tracking-wide transition-all duration-200 ${
    isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`}
>
  <div className={`relative flex items-center justify-center rounded-xl p-1.5 transition-all duration-200 ${isMoreActive ? "bg-primary/8" : ""}`}>
    <MoreHorizontal className={`transition-all duration-200 ${isMoreActive ? "h-[22px] w-[22px]" : "h-5 w-5"}`} />
    {isMoreActive && (
      <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
    )}
  </div>
  <span className={`transition-all duration-200 ${isMoreActive ? "opacity-100" : "opacity-70"}`}>
    Lainnya
  </span>
</button>
```

---

### 2. MorePage.tsx (Baru)

**Path:** `src/pages/more/MorePage.tsx`

**Deskripsi:** Halaman hub yang menampilkan daftar navigasi ke Wallet, Kategori, dan Pengaturan. Menggunakan pola visual yang konsisten dengan `SettingsPage` (daftar item dengan ikon, label, dan chevron).

**Layout:**

```
MorePage
├── Header: "Lainnya" (h1)
└── Daftar item (rounded-xl border bg-card divide-y)
    ├── Item: Wallet     → /wallets    (ikon: Wallet)
    ├── Item: Kategori   → /categories (ikon: Tag)
    └── Item: Pengaturan → /settings   (ikon: Settings + SyncIndicator)
```

**Spesifikasi setiap item:**
- Container: `flex items-center gap-3 px-4 py-3.5` dengan `hover:bg-muted/50 active:bg-muted`
- Ikon container: `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10`
- Ikon: `h-4 w-4 text-primary`
- Label: `text-sm font-medium`
- Chevron: `ChevronRight h-4 w-4 shrink-0 text-muted-foreground`

**SyncIndicator di baris Pengaturan:**

```tsx
function SyncIndicator() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);

  if (!syncKey) return null;

  const dotColor =
    syncStatus === "connected"
      ? "bg-green-500"
      : syncStatus === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : "bg-red-500";

  return (
    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
  );
}
```

SyncIndicator diletakkan di sebelah kiri label "Pengaturan" (atau sebagai badge di sisi kanan sebelum chevron), sehingga terlihat jelas tanpa mengganggu layout.

**Interface komponen:**

```typescript
// Tidak ada props — MorePage adalah halaman mandiri
export default function MorePage(): JSX.Element
```

---

### 3. routes/index.tsx (Dimodifikasi)

**Perubahan:** Penambahan satu rute `/more` di dalam children `AppLayout`.

```typescript
import MorePage from "@/pages/more/MorePage"; // tambahan import

// Di dalam array children:
{ path: "more", element: <MorePage /> },
```

Semua rute yang ada (`/wallets`, `/categories`, `/settings`, dan sub-rutenya) **tidak diubah** — tetap terdaftar dan dapat diakses langsung.

---

### 4. AppLayout.tsx (Tidak Diubah)

`AppLayout` tidak memerlukan perubahan. Padding `pb-24` pada elemen `<main>` sudah memenuhi persyaratan minimum (≥ 80px) untuk memastikan konten tidak tertutup BottomNav.

---

## Data Models

### NavItem

```typescript
interface NavItem {
  to: string;       // rute tujuan
  icon: LucideIcon; // komponen ikon dari lucide-react
  label: string;    // label teks yang ditampilkan
  end?: boolean;    // apakah matching harus exact (untuk rute "/")
}
```

### MoreNavItem

```typescript
interface MoreNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  showSyncIndicator?: boolean; // true hanya untuk item Pengaturan
}

const moreNavItems: MoreNavItem[] = [
  { to: "/wallets",    icon: Wallet,   label: "Wallet"     },
  { to: "/categories", icon: Tag,      label: "Kategori"   },
  { to: "/settings",   icon: Settings, label: "Pengaturan", showSyncIndicator: true },
];
```

### SyncStatus (dari syncStore.ts — tidak diubah)

```typescript
type SyncStatus = 'disconnected' | 'connecting' | 'connected';
```

### Pemetaan SyncStatus → Warna Indikator

| syncKey | syncStatus     | Tampilan                              |
|---------|----------------|---------------------------------------|
| null    | (apapun)       | Tidak ditampilkan                     |
| ada     | `connected`    | Titik hijau (`bg-green-500`)          |
| ada     | `connecting`   | Titik kuning berkedip (`bg-yellow-500 animate-pulse`) |
| ada     | `disconnected` | Titik merah (`bg-red-500`)            |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Proyek ini menggunakan **fast-check** (sudah terdaftar di `devDependencies`) sebagai library property-based testing, dengan runtime **bun:test**.

---

### Property 1: Eksklusivitas Active State

*For any* rute URL yang valid, komponen BottomNav SHALL menampilkan tepat 0 atau 1 Nav_Item dalam Active_State — tidak pernah lebih dari satu item aktif secara bersamaan.

**Validates: Requirements 4.1, 4.4**

---

### Property 2: Active State Berbasis Prefix untuk Transaksi dan Laporan

*For any* rute yang dimulai dengan `/transactions` atau `/reports`, BottomNav SHALL mengaktifkan Nav_Item yang prefixnya cocok (Transaksi atau Laporan), dan Nav_Item lainnya SHALL dalam keadaan tidak aktif.

**Validates: Requirements 1.8, 1.9, 4.2**

---

### Property 3: Active State Multi-Prefix untuk Nav_Item Lainnya

*For any* rute yang dimulai dengan `/more`, `/wallets`, `/categories`, atau `/settings`, BottomNav SHALL menampilkan Nav_Item Lainnya dalam Active_State, dan Nav_Item Beranda, Transaksi, serta Laporan SHALL dalam keadaan tidak aktif.

**Validates: Requirements 1.10, 4.3**

---

### Property 4: Pemetaan Warna SyncIndicator

*For any* kombinasi nilai `syncKey` (string atau null) dan `syncStatus` (`connected`, `connecting`, `disconnected`), fungsi pemetaan warna SyncIndicator SHALL menghasilkan:
- `null` (tidak dirender) jika `syncKey` adalah null,
- `bg-green-500` jika `syncKey` ada dan `syncStatus === "connected"`,
- `bg-yellow-500 animate-pulse` jika `syncKey` ada dan `syncStatus === "connecting"`,
- `bg-red-500` jika `syncKey` ada dan `syncStatus === "disconnected"`.

**Validates: Requirements 2.8**

---

### Property 5: WalletList Merender Semua Wallet

*For any* daftar wallet yang tidak kosong, komponen WalletList SHALL merender jumlah kartu wallet yang sama persis dengan jumlah item dalam daftar tersebut.

**Validates: Requirements 3.4**

---

## Error Handling

### Rute Tidak Dikenal

Jika pengguna mengakses rute yang tidak terdaftar di router, React Router DOM akan menampilkan error boundary default. Tidak ada perubahan pada penanganan ini — perilaku yang ada dipertahankan.

### Kondisi Tidak Ada Nav_Item Aktif

Jika rute aktif tidak cocok dengan prefix manapun dari keempat Nav_Item (misalnya rute yang tidak terdaftar), semua Nav_Item ditampilkan dalam keadaan tidak aktif. Ini adalah perilaku yang diharapkan dan tidak perlu penanganan khusus.

### syncStore Tidak Tersedia

`MorePage` mengakses `useSyncStore` melalui Zustand. Jika store belum diinisialisasi (kondisi yang tidak mungkin terjadi dalam praktik karena store diinisialisasi saat modul dimuat), komponen akan merender dengan nilai default (`syncStatus: 'disconnected'`, `syncKey: null`), sehingga SyncIndicator tidak ditampilkan.

### Navigasi dari MorePage

Jika pengguna menekan tombol back dari `/wallets`, `/categories`, atau `/settings` setelah masuk melalui MorePage, browser history akan kembali ke `/more`. Nav_Item Lainnya akan tetap aktif karena rute `/more` termasuk dalam `MORE_PREFIXES`.

---

## Testing Strategy

### Pendekatan Dual Testing

Fitur ini menggunakan dua lapisan pengujian yang saling melengkapi:

1. **Unit tests (example-based)** — untuk perilaku spesifik dan konkret
2. **Property tests (fast-check)** — untuk properti universal yang harus berlaku di semua input

### Unit Tests

Fokus pada skenario konkret:

- **BottomNav rendering**: verifikasi tepat 4 item ditampilkan dengan label dan urutan yang benar
- **Navigasi per item**: simulasi klik pada setiap Nav_Item dan verifikasi rute tujuan
- **Active state per rute spesifik**: verifikasi active state untuk rute `/`, `/transactions`, `/reports`, `/more`
- **MorePage rendering**: verifikasi tiga item (Wallet, Kategori, Pengaturan) ditampilkan dengan ikon dan label yang benar
- **MorePage navigasi**: simulasi klik pada setiap item dan verifikasi navigasi
- **SyncIndicator tidak muncul tanpa syncKey**: render dengan `syncKey: null` dan verifikasi tidak ada indikator
- **FAB_Catat di Dashboard**: verifikasi tombol ada dan mengarah ke `/transactions/new`
- **Rute /more terdaftar**: navigasi ke `/more` dan verifikasi MorePage dirender

### Property Tests (fast-check, minimum 100 iterasi)

Setiap property test menggunakan tag komentar untuk traceability:

```
// Feature: bottom-nav-simplification, Property {N}: {deskripsi singkat}
```

**Property 1 — Eksklusivitas Active State:**
```typescript
// Feature: bottom-nav-simplification, Property 1: active state exclusivity
fc.assert(
  fc.property(
    fc.webPath(), // generate rute URL acak
    (path) => {
      const activeCount = countActiveNavItems(path);
      return activeCount === 0 || activeCount === 1;
    }
  ),
  { numRuns: 100 }
);
```

**Property 2 — Active State Berbasis Prefix:**
```typescript
// Feature: bottom-nav-simplification, Property 2: prefix-based active state
fc.assert(
  fc.property(
    fc.constantFrom("/transactions", "/reports"),
    fc.array(fc.webSegment(), { minLength: 0, maxLength: 3 }),
    (prefix, segments) => {
      const path = prefix + (segments.length ? "/" + segments.join("/") : "");
      const activeItem = getActiveNavItem(path);
      return activeItem?.label === (prefix === "/transactions" ? "Transaksi" : "Laporan");
    }
  ),
  { numRuns: 100 }
);
```

**Property 3 — Multi-Prefix untuk Lainnya:**
```typescript
// Feature: bottom-nav-simplification, Property 3: multi-prefix active state for Lainnya
fc.assert(
  fc.property(
    fc.constantFrom("/more", "/wallets", "/categories", "/settings"),
    fc.array(fc.webSegment(), { minLength: 0, maxLength: 3 }),
    (prefix, segments) => {
      const path = prefix + (segments.length ? "/" + segments.join("/") : "");
      const activeItem = getActiveNavItem(path);
      return activeItem?.label === "Lainnya";
    }
  ),
  { numRuns: 100 }
);
```

**Property 4 — Pemetaan Warna SyncIndicator:**
```typescript
// Feature: bottom-nav-simplification, Property 4: SyncIndicator color mapping
fc.assert(
  fc.property(
    fc.option(fc.string({ minLength: 1 }), { nil: null }),
    fc.constantFrom("connected", "connecting", "disconnected"),
    (syncKey, syncStatus) => {
      const color = getSyncIndicatorColor(syncKey, syncStatus);
      if (syncKey === null) return color === null;
      if (syncStatus === "connected") return color === "bg-green-500";
      if (syncStatus === "connecting") return color === "bg-yellow-500 animate-pulse";
      return color === "bg-red-500";
    }
  ),
  { numRuns: 100 }
);
```

**Property 5 — WalletList Merender Semua Wallet:**
```typescript
// Feature: bottom-nav-simplification, Property 5: WalletList renders all wallets
fc.assert(
  fc.property(
    fc.array(walletArbitrary, { minLength: 1, maxLength: 20 }),
    (wallets) => {
      const renderedCount = countRenderedWalletCards(wallets);
      return renderedCount === wallets.length;
    }
  ),
  { numRuns: 100 }
);
```

### Catatan Implementasi Testing

- Untuk menguji logika active state BottomNav tanpa merender komponen React penuh, ekstrak fungsi murni `getActiveNavItem(pathname: string): NavItem | null` yang dapat diuji secara independen.
- Untuk menguji SyncIndicator, ekstrak fungsi murni `getSyncIndicatorColor(syncKey: string | null, syncStatus: SyncStatus): string | null`.
- Kedua fungsi ini adalah kandidat ideal untuk property-based testing karena merupakan fungsi murni dengan input yang terdefinisi dengan baik.
- Gunakan `bun:test` sebagai test runner (konsisten dengan test yang sudah ada di proyek).
