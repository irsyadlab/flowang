# Implementation Plan: App Tour / Onboarding Tour

## Overview

Implementasi fitur App Tour menggunakan `react-joyride` sebagai engine, dengan arsitektur berlapis:
`tourStorage` (localStorage) → `tourStore` (Zustand) → `tourSteps` (konfigurasi) → `TourTooltip` (UI) → `TourController` (orkestrator). Tour diintegrasikan ke `AppLayout` dan dipicu otomatis saat `dbReady === true` untuk pengguna baru.

## Tasks

- [x] 1. Install dependensi dan setup proyek
  - [x] 1.1 Install react-joyride
    - Jalankan `bun add react-joyride` di root proyek
    - Verifikasi `react-joyride` muncul di `dependencies` pada `package.json`
    - Pastikan TypeScript types tersedia (`@types/react-joyride` sudah bundled)
    - _Requirements: 1.1_

- [x] 2. Implementasi lapisan storage dan konfigurasi langkah
  - [x] 2.1 Buat `src/lib/tourStorage.ts`
    - Definisikan tipe `TourStatus = 'completed' | 'skipped' | 'in_progress'`
    - Definisikan konstanta `TOUR_STATUS_KEY = 'flowang_tour_status'` dan array `VALID_STATUSES`
    - Implementasikan `tourStorage.getStatus()`: baca dari localStorage, validasi nilai, kembalikan `null` untuk nilai korup/tidak valid, bungkus dengan try-catch
    - Implementasikan `tourStorage.setStatus(status)`: simpan ke localStorage, lakukan verifikasi round-trip, log error jika verifikasi gagal
    - Implementasikan `tourStorage.clearStatus()`: hapus kunci dari localStorage, bungkus dengan try-catch
    - Implementasikan `tourStorage.shouldAutoStart()`: kembalikan `true` hanya jika `getStatus() === null`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 2.2 Tulis property tests untuk `tourStorage` (Properties 1, 2, 3)
    - **Property 1: shouldAutoStart hanya true ketika tidak ada status**
      - Generator: `fc.oneof(fc.constant(null), fc.constant('completed'), fc.constant('skipped'), fc.constant('in_progress'), fc.string())`
      - Assert: `shouldAutoStart() === (statusValue === null)`
      - **Validates: Requirements 1.1, 1.3, 4.5**
    - **Property 2: getStatus menolak nilai tidak valid**
      - Generator: `fc.string().filter(s => !validStatuses.includes(s) && s.length > 0)`
      - Assert: `getStatus() === null` untuk semua string tidak valid
      - **Validates: Requirements 4.4**
    - **Property 3: round-trip setStatus → getStatus**
      - Generator: `fc.constantFrom('completed', 'skipped', 'in_progress')`
      - Assert: `getStatus() === status` setelah `setStatus(status)`
      - **Validates: Requirements 4.3**
    - Konfigurasi: `{ numRuns: 100 }` untuk setiap property
    - _File: `src/lib/tourStorage.test.ts`_

  - [x] 2.3 Buat `src/lib/tourSteps.ts`
    - Import tipe `Step` dari `react-joyride`
    - Definisikan interface `TourStepMeta extends Step` dengan field `title: string`
    - Implementasikan array `TOUR_STEPS` dengan tepat 6 langkah:
      - Langkah 1: `target: 'body'`, `placement: 'center'`, judul sambutan Flowang
      - Langkah 2: `target: '[data-tour="dashboard-summary"]'`, `placement: 'bottom'`, ringkasan keuangan
      - Langkah 3: `target: '[data-tour="add-transaction-btn"]'`, `placement: 'bottom'`, catat transaksi
      - Langkah 4: `target: '[data-tour="nav-transactions"]'`, `placement: 'top'`, riwayat transaksi
      - Langkah 5: `target: '[data-tour="nav-reports"]'`, `placement: 'top'`, laporan keuangan
      - Langkah 6: `target: '[data-tour="nav-more"]'`, `placement: 'top'`, wallet & kategori
    - Semua langkah harus memiliki `disableBeacon: true`
    - Tambahkan validasi runtime: `if (TOUR_STEPS.length !== 6) throw new Error(...)`
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.4 Tulis property tests untuk `tourSteps` (Property 8)
    - **Property 8: invariant konten setiap langkah**
      - Iterasi semua 6 langkah, verifikasi: `title` ≤ 15 kata, `content` ≤ 2 kalimat, `target` non-kosong, `disableBeacon === true`
      - Tambahkan test invariant: `TOUR_STEPS.length === 6`
      - **Validates: Requirements 1.4, 2.7**
    - _File: `src/lib/tourSteps.test.ts`_

- [x] 3. Implementasi Zustand store
  - [x] 3.1 Buat `src/stores/tourStore.ts`
    - Import `create` dari `zustand` dan `tourStorage` dari `@/lib/tourStorage`
    - Definisikan interface `TourState`: `run: boolean`, `stepIndex: number`, `hasAutoStarted: boolean`
    - Definisikan interface `TourActions`: `startTour`, `stopTour`, `setStepIndex`, `restartTour`, `completeTour`, `skipTour`, `markAutoStarted`
    - Implementasikan `startTour()`: set `run: true`, panggil `tourStorage.setStatus('in_progress')`
    - Implementasikan `stopTour()`: set `run: false` (stepIndex TIDAK direset)
    - Implementasikan `setStepIndex(index)`: set `stepIndex: index`
    - Implementasikan `restartTour()`: simpan status sebelumnya, clear storage, set `run: true, stepIndex: 0`, set status `in_progress`, pulihkan status jika `run` masih false
    - Implementasikan `completeTour()`: set `run: false`, panggil `tourStorage.setStatus('completed')`
    - Implementasikan `skipTour()`: set `run: false` (stepIndex TIDAK direset), panggil `tourStorage.setStatus('skipped')`
    - Implementasikan `markAutoStarted()`: set `hasAutoStarted: true`
    - _Requirements: 3.7, 3.8, 4.1, 4.2, 5.1, 5.2, 7.5_

  - [ ]* 3.2 Tulis property tests untuk `tourStore` (Properties 5, 6, 7, 11)
    - **Property 5: skipTour menyimpan status skipped**
      - Generator: `fc.integer({ min: 0, max: 5 })` untuk stepIndex awal
      - Setup: set `run: true`, `stepIndex: generatedIndex`
      - Assert setelah `skipTour()`: `run === false`, `stepIndex` tidak berubah, `tourStorage.getStatus() === 'skipped'`
      - **Validates: Requirements 3.7, 4.2**
    - **Property 6: completeTour menyimpan status completed**
      - Setup: set `run: true`, `stepIndex: 5`
      - Assert setelah `completeTour()`: `run === false`, `tourStorage.getStatus() === 'completed'`
      - **Validates: Requirements 3.8, 4.1**
    - **Property 7: skipTour mempertahankan stepIndex**
      - Generator: `fc.integer({ min: 0, max: 5 })`
      - Assert: `stepIndex` sebelum dan sesudah `skipTour()` identik
      - **Validates: Requirements 5.1**
    - **Property 11: hasAutoStarted mencegah auto-start ganda**
      - Setup: set `hasAutoStarted: true`
      - Assert: memanggil `startTour()` berulang tidak mengubah `hasAutoStarted` menjadi false
      - **Validates: Requirements 7.5**
    - Konfigurasi: `{ numRuns: 100 }` untuk setiap property
    - _File: `src/stores/tourStore.test.ts`_

- [x] 4. Implementasi komponen UI tour
  - [x] 4.1 Buat `src/components/tour/TourTooltip.tsx`
    - Import `TooltipRenderProps` dari `react-joyride`
    - Implementasikan komponen `TourTooltip` yang menerima props: `step`, `index`, `size`, `isLastStep`, `backProps`, `primaryProps`, `skipProps`, `tooltipProps`
    - Render container dengan `role="dialog"`, `aria-modal="true"`, `aria-labelledby={tour-title-${index}}`, `aria-describedby={tour-content-${index}}`
    - Tambahkan elemen `aria-live="polite"` dengan teks `"Langkah {index+1} dari {size}: {step.title}"` (class `sr-only`)
    - Render header: teks progres "Langkah {index+1} dari {size}" + tombol "Lewati" dengan `aria-label="Lewati tour"`
    - Render judul dengan `id={tour-title-${index}}` dan konten dengan `id={tour-content-${index}}`
    - Render navigasi: tombol "← Kembali" (hanya jika `index > 0`) dengan `aria-label`, tombol "Lanjut →" atau "Selesai" dengan `aria-label`
    - Semua tombol harus memiliki `min-h-[44px] min-w-[44px]` untuk touch target WCAG 2.5.5
    - Styling: `rounded-2xl bg-background border border-border shadow-xl p-5 max-w-[min(90vw,360px)] min-w-[280px]`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.7, 6.8, 8.1, 8.2_

  - [ ]* 4.2 Tulis property tests untuk `TourTooltip` (Properties 4, 10)
    - **Property 4: tombol navigasi sesuai posisi langkah**
      - Generator: `fc.integer({ min: 0, max: 5 })`
      - Render `TourTooltip` dengan mock props untuk setiap stepIndex
      - Assert: tombol "Lewati" selalu ada; "Kembali" ada iff `index > 0`; "Lanjut" ada iff `index < 5`; "Selesai" ada iff `index === 5`; teks "Langkah {index+1} dari 6" ada
      - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
    - **Property 10: format teks aria-live**
      - Generator: `fc.integer({ min: 0, max: 5 })`
      - Assert: elemen `aria-live` berisi teks `"Langkah {index+1} dari 6: {TOUR_STEPS[index].title}"`
      - **Validates: Requirements 6.8**
    - Konfigurasi: `{ numRuns: 6 }` (hanya 6 nilai valid)
    - _File: `src/components/tour/TourTooltip.test.tsx`_

- [x] 5. Implementasi TourController (orkestrator)
  - [x] 5.1 Buat `src/components/tour/TourController.tsx`
    - Import `Joyride`, `CallBackProps`, `STATUS`, `ACTIONS`, `EVENTS` dari `react-joyride`
    - Import `useTourStore`, `tourStorage`, `TOUR_STEPS`, `TourTooltip`
    - Definisikan konstanta `TOUR_STEP_COUNT = 6` dan `AUTO_START_DELAY_MS = 500`
    - Implementasikan deteksi `prefers-reduced-motion` via `window.matchMedia`
    - Implementasikan `useRef<HTMLElement | null>` untuk menyimpan elemen yang difokus sebelum tour
    - Implementasikan `useEffect` untuk auto-start: cek `hasAutoStarted`, `tourStorage.shouldAutoStart()`, dan `TOUR_STEPS.length === 6`; gunakan `setTimeout` 500ms; simpan `previousFocusRef.current = document.activeElement`; panggil `markAutoStarted()` lalu `startTour()`
    - Implementasikan `useEffect` untuk restore fokus: ketika `run` berubah menjadi `false`, panggil `previousFocusRef.current.focus()`
    - Implementasikan `handleCallback` dengan `useCallback`: tangani `STEP_AFTER`/`TARGET_NOT_FOUND` untuk update `stepIndex`; tangani `STATUS.FINISHED` → `completeTour()`; tangani `STATUS.SKIPPED` atau `ACTIONS.CLOSE` → `skipTour()`
    - Konfigurasi `joyrideStyles`: `zIndex: 10100`, `overlayColor: 'rgba(0, 0, 0, 0.5)'`, `arrowColor: 'hsl(var(--background))'`, `spotlight.borderRadius: '12px'`
    - Render `<Joyride>` dengan props: `steps={TOUR_STEPS}`, `run`, `stepIndex`, `continuous`, `disableOverlayClose`, `callback={handleCallback}`, `tooltipComponent={TourTooltip}`, `styles={joyrideStyles}`, `floaterProps={{ disableAnimation: prefersReducedMotion }}`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 3.7, 3.8, 5.2, 6.1, 6.2, 6.4, 6.9, 6.10, 7.5, 8.5_

  - [ ]* 5.2 Tulis unit tests untuk `TourController` (Property 9, auto-start)
    - **Property 9: z-index overlay ≥ 10000 dan > z-index bottom nav + 100**
      - Verifikasi `joyrideStyles.options.zIndex >= 10000`
      - Verifikasi `joyrideStyles.options.zIndex > 50 + 100` (bottom nav z-50)
      - **Validates: Requirements 8.5**
    - **Test auto-start**: mock `tourStorage.shouldAutoStart()` → `true`; render `TourController`; advance timer 500ms; assert `useTourStore.getState().run === true` dan `hasAutoStarted === true`
    - **Test no auto-start**: mock `tourStorage.shouldAutoStart()` → `false`; render `TourController`; advance timer; assert `run === false`
    - **Test no double auto-start**: set `hasAutoStarted: true` di store; render `TourController`; assert `startTour` tidak dipanggil
    - _File: `src/components/tour/TourController.test.tsx`_

- [x] 6. Checkpoint — Verifikasi lapisan inti
  - Pastikan semua tests di `tourStorage.test.ts`, `tourSteps.test.ts`, `tourStore.test.ts`, dan `TourTooltip.test.tsx` lulus
  - Pastikan tidak ada TypeScript error pada file-file baru
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan

- [x] 7. Integrasi ke layout dan halaman yang ada
  - [x] 7.1 Modifikasi `src/layouts/AppLayout.tsx`
    - Import `TourController` dari `@/components/tour/TourController`
    - Tambahkan `<TourController />` sebagai child pertama di dalam `<div className="mx-auto flex min-h-screen ...">`, sebelum `<main>`
    - TourController hanya dirender setelah blok `if (!dbReady)` — sudah terpenuhi karena berada di dalam return utama
    - _Requirements: 1.1, 1.2_

  - [x] 7.2 Modifikasi `src/pages/Dashboard.tsx`
    - Tambahkan `data-tour="add-transaction-btn"` pada tombol "Catat" di header
    - Bungkus `<SummaryCard>` dengan `<div data-tour="dashboard-summary">` karena SummaryCard tidak meneruskan arbitrary props ke root element-nya
    - _Requirements: 2.2, 2.3_

  - [x] 7.3 Modifikasi `src/components/layout/BottomNav.tsx`
    - Tambahkan `data-tour="nav-transactions"` pada `<NavLink to="/transactions">`
    - Tambahkan `data-tour="nav-reports"` pada `<NavLink to="/reports">`
    - Tambahkan `data-tour="nav-more"` pada `<button onClick={() => navigate("/more")}>`
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 7.4 Modifikasi `src/pages/more/MorePage.tsx`
    - Import `useTourStore` dari `@/stores/tourStore` dan `tourStorage` dari `@/lib/tourStorage`
    - Import icon `MapPin` dari `lucide-react`
    - Tambahkan logika: `const restartTour = useTourStore((s) => s.restartTour)` dan `const tourStatus = tourStorage.getStatus()`
    - Tambahkan kondisi `showRestartOption = tourStatus === 'skipped' || tourStatus === 'in_progress'`
    - Render tombol "Mulai Ulang Tour" secara kondisional di bawah daftar navigasi yang ada, dengan icon `MapPin`, label "Mulai Ulang Tour", dan deskripsi "Ulangi panduan fitur dari awal"
    - Tombol memanggil `restartTour()` saat diklik
    - _Requirements: 5.2, 5.3_

- [x] 8. Final checkpoint — Verifikasi integrasi penuh
  - Pastikan semua tests lulus termasuk `TourController.test.tsx`
  - Pastikan tidak ada TypeScript error di seluruh file yang dimodifikasi
  - Pastikan tidak ada import yang hilang atau circular dependency
  - Tanyakan kepada user jika ada pertanyaan sebelum dianggap selesai

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- `fast-check` sudah tersedia di `devDependencies` — tidak perlu install tambahan
- `react-joyride` menangani focus trap, keyboard navigation (Tab/Shift+Tab/ESC), dan ARIA secara built-in
- `TourController` hanya perlu dirender sekali di `AppLayout` — tidak perlu di setiap halaman
- Jika `SummaryCard` di masa depan mendukung forwarding props, wrapper `<div>` dapat dihapus
- Property tests menggunakan tag format: `// Feature: app-tour, Property {N}: {deskripsi}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.3"] },
    { "id": 2, "tasks": ["2.2", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "7.1", "7.2", "7.3", "7.4"] }
  ]
}
```
