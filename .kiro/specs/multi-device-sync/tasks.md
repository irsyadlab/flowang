# Implementation Plan: Sinkronisasi Data Multi-Device

## Overview

Implementasi fitur sinkronisasi data multi-device menggunakan arsitektur hybrid zero-server-database: WebRTC + Yjs CRDT untuk sinkronisasi real-time P2P, dan Google Drive App Data sebagai cloud backup/fallback. Seluruh data dienkripsi end-to-end dengan AES-256-GCM menggunakan Web Crypto API native. Fitur diakses melalui halaman Settings baru (`/settings`) yang ditambahkan ke Bottom Navigation.

Urutan implementasi mengikuti dependency graph: fondasi keamanan dan kriptografi terlebih dahulu, kemudian layer sinkronisasi, lalu UI, dan terakhir integrasi + tests.

---

## Tasks

- [x] 1. Setup dependencies dan environment configuration
  - Install library baru: `yjs`, `y-webrtc`, `y-indexeddb`, `qrcode.react`, `html5-qrcode`
  - Buat file `src/lib/envConfig.ts` dengan interface `EnvConfig`, class `EnvConfigError`, fungsi `validateEnvConfig()`, `getIceServers()`, dan singleton `envConfig`
  - Validasi bahwa semua required env vars (`VITE_WEBRTC_SIGNALING_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`) dicek saat startup; lempar `EnvConfigError` dengan daftar var yang hilang jika ada yang tidak terdefinisi
  - Validasi partial TURN config: jika hanya sebagian dari `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` terdefinisi, perlakukan sebagai konfigurasi tidak valid
  - `getIceServers()` mengembalikan array kosong jika semua STUN/TURN vars tidak ada
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [x] 2. Implementasi CryptoService
  - [x] 2.1 Buat file `src/sync/cryptoService.ts` dengan semua fungsi kriptografi
    - Implementasi `generateEncryptionKey()`: gunakan `crypto.subtle.generateKey` dengan AES-GCM 256-bit, `extractable: true`
    - Implementasi `exportKeyToBase64(key)`: ekspor CryptoKey ke format `raw` lalu encode ke base64url
    - Implementasi `importKeyFromBase64(base64)`: decode base64url lalu import dengan `extractable: false`
    - Implementasi `encrypt(data, key)`: generate IV 12 bytes secara acak, enkripsi dengan AES-GCM, output format `[12-byte IV][ciphertext+16-byte auth tag]`
    - Implementasi `decrypt(data, key)`: ekstrak IV dari 12 byte pertama, dekripsi dengan AES-GCM; lempar error jika auth tag tidak valid
    - _Requirements: 8.1, 8.2, 8.3, 6.5, 6.6_

  - [x]* 2.2 Tulis property test untuk CryptoService — Property 2: Encrypt-Decrypt Round-Trip
    - **Property 2: Encrypt-Decrypt Round-Trip**
    - **Validates: Requirements 6.5, 6.6, 8.1, 8.3, 8.4, 7.10**
    - File: `src/__tests__/sync/cryptoService.pbt.test.ts`
    - Gunakan `fc.uint8Array({ minLength: 0, maxLength: 1_048_576 })`, numRuns: 100

  - [x]* 2.3 Tulis property test untuk CryptoService — Property 3: AES-GCM Authentication Tag Rejection
    - **Property 3: AES-GCM Authentication Tag Rejection**
    - **Validates: Requirements 8.6**
    - File: `src/__tests__/sync/cryptoService.pbt.test.ts`
    - Gunakan `fc.uint8Array({ minLength: 1, maxLength: 10_000 })` dan `fc.nat()` untuk byte index, numRuns: 100

  - [x]* 2.4 Tulis unit tests untuk CryptoService
    - File: `src/__tests__/sync/cryptoService.test.ts`
    - Test: `generateEncryptionKey()` menghasilkan key AES-GCM 256-bit
    - Test: `exportKeyToBase64()` menghasilkan string base64url valid
    - Test: `importKeyFromBase64()` berhasil untuk key valid, melempar error untuk string invalid
    - Edge case: enkripsi data kosong (0 bytes) dan data 1 byte
    - _Requirements: 8.1, 8.3_

- [x] 3. Implementasi Sync Key Utilities
  - [x] 3.1 Buat file `src/sync/syncKeyUtils.ts` dengan fungsi encode/decode/validate/generate
    - Definisikan interface `SyncKeyPayload { roomName: string; encryptionKey: string; version: number }`
    - Implementasi `generateSyncKey()`: generate UUID v4 sebagai `roomName`, generate encryption key baru, encode ke base64url JSON
    - Implementasi `encodeSyncKey(payload)`: `base64url(JSON.stringify(payload))`
    - Implementasi `decodeSyncKey(encoded)`: decode base64url → parse JSON → return `SyncKeyPayload`
    - Implementasi `validateSyncKey(input)`: return `true` hanya jika string base64url valid, panjang 32–512 karakter, dan dapat di-decode menjadi `SyncKeyPayload` dengan semua field wajib (`roomName` non-empty string, `encryptionKey` non-empty string, `version` integer positif)
    - _Requirements: 2.1, 2.2, 3.5, 3.11_

  - [x]* 3.2 Tulis property test untuk Sync Key — Property 1: Sync Key Round-Trip
    - **Property 1: Sync Key Round-Trip**
    - **Validates: Requirements 2.1, 2.2, 3.5**
    - File: `src/__tests__/sync/syncKeyUtils.pbt.test.ts`
    - Gunakan `fc.uuid()` dan `fc.integer({ min: 1, max: 10 })`, numRuns: 100

  - [x]* 3.3 Tulis property test untuk Sync Key — Property 6: Sync Key Validation
    - **Property 6: Sync Key Validation**
    - **Validates: Requirements 3.5, 3.11**
    - File: `src/__tests__/sync/syncKeyUtils.pbt.test.ts`
    - Gunakan `fc.string()`, numRuns: 200; jika `validateSyncKey` return `true`, verifikasi payload memiliki semua field wajib

  - [x]* 3.4 Tulis unit tests untuk Sync Key Utilities
    - File: `src/__tests__/sync/syncKeyUtils.test.ts`
    - Test: `generateSyncKey()` menghasilkan payload dengan semua field wajib
    - Test: `validateSyncKey('')` return `false`
    - Test: `validateSyncKey(string < 32 chars)` return `false`
    - Test: `validateSyncKey(string > 512 chars)` return `false`
    - Test: `validateSyncKey(JSON valid tanpa field roomName)` return `false`
    - _Requirements: 3.5, 3.11_

- [x] 4. Implementasi Zustand syncStore
  - [x] 4.1 Buat file `src/sync/syncStore.ts` dengan Zustand store untuk sync state
    - Definisikan type `SyncStatus = 'disconnected' | 'connecting' | 'connected'`
    - Definisikan interface `GoogleUserInfo { name: string; email: string }`
    - Definisikan interface `SyncState` sesuai design: `syncStatus`, `syncKey`, `googleAuthToken`, `googleUserInfo`, `lastBackupTimestamp`, `syncError`, dan semua action
    - Implementasi `loadFromStorage()`: baca `syncKey` dan `googleAuthToken` dari IndexedDB store `'sync-config'`
    - Implementasi semua action: `setSyncStatus`, `setSyncKey`, `setGoogleAuth`, `setLastBackupTimestamp`, `setSyncError`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 5. Implementasi WebRTC Provider dengan reconnect logic
  - [x] 5.1 Buat file `src/sync/webrtcProvider.ts` sebagai wrapper y-webrtc dengan reconnect logic
    - Inisialisasi `Y.Doc` dan `WebrtcProvider` dari `y-webrtc` menggunakan `roomName` dan `signalingUrl` dari `envConfig`
    - Setup `IndexeddbPersistence` dari `y-indexeddb` ke store `'yjs-sync'` untuk persistensi CRDT
    - Implementasi `connect(roomName, encryptionKey)`: hubungkan ke signaling server dan sync room
    - Implementasi `disconnect()`: putuskan koneksi dan cleanup
    - Implementasi reconnect dengan exponential backoff: mulai dari 1000ms, double setiap attempt, cap di 30000ms, maksimal 10 attempts; setelah 10 kali gagal set `syncStatus` ke `'disconnected'`
    - Listen event `online` dari browser untuk trigger reconnect otomatis
    - Setelah reconnect berhasil, lakukan full sync via Yjs CRDT
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 6.7_

  - [x]* 5.2 Tulis property test untuk backoff logic — Property 5: Exponential Backoff Bounds
    - **Property 5: Exponential Backoff Bounds**
    - **Validates: Requirements 9.4**
    - File: `src/__tests__/sync/backoffLogic.pbt.test.ts`
    - Ekstrak fungsi `calculateBackoffDelay(attempt: number): number` ke file terpisah `src/sync/backoffUtils.ts`
    - Gunakan `fc.integer({ min: 0, max: 9 })`, numRuns: 100; verifikasi `delay === Math.min(1000 * Math.pow(2, n), 30000)`

  - [x]* 5.3 Tulis unit tests untuk backoff logic
    - File: `src/__tests__/sync/backoffLogic.test.ts`
    - Test: delay attempt ke-0 = 1000ms
    - Test: delay attempt ke-1 = 2000ms
    - Test: delay attempt ke-5 = 30000ms (sudah cap)
    - Test: status menjadi `disconnected` setelah attempt ke-9 gagal
    - _Requirements: 9.4_

- [x] 6. Implementasi Sync Manager
  - [x] 6.1 Buat file `src/sync/syncManager.ts` sebagai koordinator utama
    - Implementasi `initialize()`: panggil `envConfig.validateEnvConfig()`, load `syncStore`, jika `syncKey` ada decode dan connect via `webrtcProvider`
    - Implementasi `onLocalChange(entityType, entity)`: set ke `ydoc.getMap(entityType)`, trigger Google Drive backup dengan debounce 30 detik
    - Implementasi `onYjsChange(entityType, changes)`: observer Yjs yang memanggil `applyToIndexedDB`
    - Implementasi `applyToIndexedDB(changes)`: upsert/delete records di IndexedDB sesuai perubahan Yjs
    - Enkripsi sebelum kirim via WebRTC: jika enkripsi gagal, batalkan pengiriman dan `setSyncError`; jangan kirim plaintext
    - Dekripsi saat menerima: jika key tidak ada atau GCM auth tag invalid, buang data dan `setSyncError`
    - Setelah `applyToIndexedDB`, reload Zustand stores (`loadWallets`, `loadTransactions`, `loadCategories`)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 8.2, 8.3, 8.5, 8.6_

  - [x] 6.2 Buat file `src/hooks/useSync.ts` sebagai hook untuk komponen UI
    - Expose `syncStatus`, `syncKey`, `syncError`, `lastBackupTimestamp` dari `syncStore`
    - Expose action `connect()`, `disconnect()`, `resetSyncKey()`, `generateAndStoreSyncKey()`
    - `resetSyncKey()`: generate key baru, putus koneksi lama, simpan key baru, tampilkan peringatan backup lama tidak valid
    - _Requirements: 2.1, 2.9, 8.7, 8.8_

- [x] 7. Implementasi Google Drive Provider
  - [x] 7.1 Buat file `src/sync/googleDriveProvider.ts` dengan OAuth dan Drive API
    - Implementasi `login()`: mulai alur Google OAuth dengan scope `drive.appdata`; simpan token dan user info ke `syncStore` dan IndexedDB store `'sync-config'`
    - Implementasi `logout()`: cabut token jika memungkinkan, selalu hapus auth info dari storage
    - Implementasi `scheduleBackup()`: debounce 30 detik, serialize semua data IndexedDB → JSON bytes → enkripsi → upload ke `'flowang-backup.enc'` di App Data Folder
    - Implementasi retry backup: 3x dengan interval 5 detik; tampilkan peringatan jika semua gagal; update `lastBackupTimestamp` jika berhasil
    - Implementasi `checkRestore()`: list files di App Data Folder; jika `'flowang-backup.enc'` ada dan IndexedDB kosong (0 records di wallets+transactions+categories), tampilkan `RestoreDialog`
    - Implementasi `restore()`: download → dekripsi → parse JSON → import ke IndexedDB → reload Zustand stores; tampilkan error jika dekripsi gagal (key tidak cocok) atau download gagal
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15_

- [x] 8. Checkpoint — Verifikasi layer sync
  - Pastikan semua unit tests dan property tests di `src/__tests__/sync/` lulus
  - Pastikan `envConfig`, `cryptoService`, `syncKeyUtils`, `syncStore`, `webrtcProvider`, `syncManager`, `googleDriveProvider` dapat diimport tanpa error TypeScript
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan ke UI layer.

- [x] 9. Update BottomNav dan tambah route Settings
  - [x] 9.1 Update `src/components/layout/BottomNav.tsx` untuk menambah item Settings dan SyncIndicator
    - Import `Settings` dari `lucide-react` dan tambahkan ke array `navItems`: `{ to: "/settings", icon: Settings, label: "Pengaturan" }`
    - Import `useSyncStore` dari `syncStore` untuk membaca `syncStatus` dan `syncKey`
    - Tambahkan `SyncIndicator` dot 6×6px di sudut kanan atas ikon Settings: merah solid (`disconnected`), kuning + pulse 1Hz (`connecting`), hijau solid (`connected`)
    - Dot hanya dirender jika `syncKey !== null`
    - _Requirements: 1.1, 1.2, 1.5, 4.5, 4.6_

  - [x] 9.2 Tambah route `/settings` ke `src/routes/index.tsx`
    - Import `SettingsPage` dari `@/pages/settings/SettingsPage`
    - Tambahkan `{ path: "settings", element: <SettingsPage /> }` ke children router
    - _Requirements: 1.2, 1.3_

- [x] 10. Implementasi SyncStatusIndicator dan OfflineBanner
  - [x] 10.1 Buat `src/components/settings/SyncStatusIndicator.tsx`
    - Tampilkan status dot minimal 8×8px + label teks
    - `disconnected`: dot merah solid, label "Tidak Terhubung"
    - `connecting`: dot kuning + animasi pulse 1Hz (Tailwind `animate-pulse`), label "Menghubungkan..."
    - `connected`: dot hijau solid, label "Terhubung (Real-time)"
    - Baca `syncStatus` dari `useSyncStore`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 10.2 Buat `src/components/settings/OfflineBanner.tsx`
    - Non-blocking banner (bukan modal/dialog) yang hanya muncul jika `syncKey !== null` dan `syncStatus === 'disconnected'`
    - Teks: "Data tersimpan lokal dan akan disinkronkan otomatis saat koneksi pulih"
    - _Requirements: 9.6_

- [x] 11. Implementasi SyncKeyCard (QR Code + toggle + copy + reset)
  - [x] 11.1 Buat `src/components/settings/SyncKeyCard.tsx`
    - Tampilkan QR Code menggunakan `qrcode.react` dengan ukuran minimal 200×200px
    - Tampilkan Sync Key sebagai teks dengan toggle show/hide: karakter `•` saat tersembunyi, teks lengkap saat terlihat; label tombol berubah antara "Tampilkan" dan "Sembunyikan"
    - Tombol "Salin": salin ke clipboard, tampilkan "Tersalin!" selama 2 detik lalu kembali ke "Salin"
    - Tombol "Reset Sync Key": tampilkan `ConfirmDialog` sebelum eksekusi; setelah konfirmasi, panggil `resetSyncKey()` dari `useSync`; tampilkan peringatan bahwa backup lama tidak valid dan perangkat lain perlu di-pair ulang
    - Tombol "Scan QR Code": buka `QRScanner` sebagai modal overlay
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 8.7, 8.8_

- [x] 12. Implementasi QRScanner (kamera + manual input)
  - [x] 12.1 Buat `src/components/settings/QRScanner.tsx`
    - Gunakan `html5-qrcode` untuk akses kamera dan scanning
    - Minta izin kamera via `MediaDevices API` sebelum mengaktifkan kamera
    - Jika izin ditolak: tampilkan pesan error dan tampilkan field input manual sebagai alternatif
    - Tampilkan pratinjau kamera real-time dengan latensi ≤100ms; scan otomatis tanpa tombol tambahan
    - Saat QR Code berhasil dipindai: validasi dengan `validateSyncKey()`; jika valid, simpan ke storage dan mulai koneksi; jika tidak valid, tampilkan "QR Code tidak valid" dan lanjutkan scanning
    - Field input manual Sync Key dengan tombol "Hubungkan"; validasi format saat submit; tampilkan "Format Sync Key tidak valid" di bawah field jika tidak valid
    - Tombol "Batal": nonaktifkan kamera dan tutup scanner
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

- [x] 13. Implementasi GoogleDriveCard
  - [x] 13.1 Buat `src/components/settings/GoogleDriveCard.tsx`
    - Jika belum login: tampilkan tombol "Login dengan Google"
    - Jika sudah login: tampilkan nama + email akun Google, tombol "Logout Google", dan timestamp backup terakhir (format lokal dari ISO 8601)
    - Tampilkan `RestoreDialog` (conditional) saat `googleDriveProvider.checkRestore()` menemukan backup dan IndexedDB kosong
    - Tampilkan notifikasi "Backup berhasil" selama 3 detik setelah upload berhasil
    - Tampilkan pesan error dari `syncError` state untuk kondisi: backup gagal, restore gagal, key tidak cocok
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.13, 7.14, 7.15_

- [x] 14. Assembly SettingsPage
  - [x] 14.1 Buat `src/pages/settings/SettingsPage.tsx` yang merakit semua komponen settings
    - Render `OfflineBanner` di bagian atas (conditional)
    - Render section "Sinkronisasi Perangkat" dengan `SyncStatusIndicator`
    - Render `SyncKeyCard` (generate key baru jika belum ada saat halaman dibuka)
    - Render `GoogleDriveCard`
    - Jika `syncStatus === 'disconnected'` dan `syncKey !== null`, tampilkan tombol "Hubungkan" yang memanggil `connect()` dari `useSync`
    - Jika env vars wajib tidak terdefinisi, render halaman error fullscreen blocking dengan daftar var yang hilang
    - _Requirements: 1.3, 1.4, 1.5, 4.7, 5.5_

- [x] 15. Integrasi: hook Zustand stores ke Sync Manager
  - [x] 15.1 Update `walletStore`, `transactionStore`, dan `categoryStore` untuk memanggil `syncManager.onLocalChange()` setelah setiap operasi write berhasil
    - Di setiap action yang memodifikasi data (create, update, delete), tambahkan panggilan ke `syncManager.onLocalChange(entityType, entity)` setelah operasi IndexedDB berhasil
    - Pastikan `syncManager.onLocalChange` hanya dipanggil jika `syncKey !== null` (sync sudah di-setup)
    - Update `src/App.tsx` atau entry point untuk memanggil `syncManager.initialize()` saat app mount
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 16. Buat file `.env.example`
  - [x] 16.1 Buat file `.env.example` di root proyek
    - Dokumentasikan semua env vars: `VITE_WEBRTC_SIGNALING_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`, `VITE_STUN_URL`, `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`
    - Sertakan deskripsi, contoh nilai placeholder non-fungsional, dan catatan mana yang wajib vs opsional
    - Catatan: TURN vars harus diisi semua atau tidak sama sekali
    - _Requirements: 5.6_

- [x] 17. Checkpoint — Verifikasi UI dan integrasi
  - Pastikan semua halaman dapat dirender tanpa error TypeScript
  - Pastikan BottomNav menampilkan item "Pengaturan" dan SyncIndicator dot
  - Pastikan route `/settings` dapat diakses
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan ke tests.

- [x] 18. Tulis integration tests
  - [x]* 18.1 Tulis integration test untuk Yjs + IndexedDB persistence
    - File: `src/__tests__/integration/yjsIndexedDB.test.ts`
    - Test: perubahan di Yjs_Doc ter-persist ke IndexedDB via y-indexeddb
    - Test: reload Yjs_Doc dari IndexedDB menghasilkan state yang sama
    - Mock: `fake-indexeddb` (sudah ada di devDependencies)
    - _Requirements: 6.3_

  - [x]* 18.2 Tulis integration test untuk SyncManager
    - File: `src/__tests__/integration/syncManager.test.ts`
    - Test: alur local change → Yjs update → encrypted broadcast (mock WebRTC)
    - Test: alur receive encrypted update → decrypt → apply to IndexedDB → Zustand reload
    - Test: full sync setelah reconnect (mock disconnect/reconnect)
    - Mock: y-webrtc, Web Crypto API
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x]* 18.3 Tulis integration test untuk GoogleDriveProvider
    - File: `src/__tests__/integration/googleDriveProvider.test.ts`
    - Test: backup flow — serialize → encrypt → upload (mock Drive API)
    - Test: restore flow — download → decrypt → import ke IndexedDB
    - Test: retry logic — 3x dengan interval 5 detik
    - Mock: Google Drive API, fetch
    - _Requirements: 7.5, 7.6, 7.7, 7.8, 7.12_

  - [x]* 18.4 Tulis property test untuk CRDT Confluence — Property 4
    - **Property 4: CRDT Confluence**
    - **Validates: Requirements 6.8**
    - File: `src/__tests__/sync/crdtConfluence.pbt.test.ts`
    - Gunakan `fc.array(arbitraryWallet, { minLength: 1, maxLength: 10 })` untuk dua set perubahan independen
    - Verifikasi merge A→B dan B→A menghasilkan `Y.encodeStateAsUpdate` yang identik
    - numRuns: 100

  - [x]* 18.5 Tulis unit tests untuk EnvConfig
    - File: `src/__tests__/sync/envConfig.test.ts`
    - Test: `validateEnvConfig()` melempar `EnvConfigError` jika `VITE_WEBRTC_SIGNALING_URL` tidak ada
    - Test: `validateEnvConfig()` melempar `EnvConfigError` jika `VITE_GOOGLE_CLIENT_ID` tidak ada
    - Test: `validateEnvConfig()` berhasil jika semua required vars ada
    - Test: `getIceServers()` mengembalikan array kosong jika semua STUN/TURN vars tidak ada
    - Test: partial TURN config dianggap tidak valid
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [x] 19. Final checkpoint — Semua tests lulus
  - Jalankan `bun test` dan pastikan semua tests lulus
  - Pastikan tidak ada error TypeScript di seluruh codebase
  - Tanyakan kepada user jika ada pertanyaan sebelum dianggap selesai.

---

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase
- Property tests memvalidasi properti universal (correctness properties dari design doc)
- Unit tests memvalidasi contoh spesifik dan edge cases
- Library baru yang perlu diinstall: `yjs`, `y-webrtc`, `y-indexeddb`, `qrcode.react`, `html5-qrcode`
- Test runner: `bun test` (gunakan `bun test --watch` untuk development, atau `bun test` untuk single run)
- `fake-indexeddb` sudah ada di devDependencies untuk mocking IndexedDB di tests
- `fast-check` v4 sudah ada di devDependencies untuk property-based testing

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.4", "4.1"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["10.1", "10.2", "11.1"] },
    { "id": 8, "tasks": ["12.1", "13.1"] },
    { "id": 9, "tasks": ["14.1"] },
    { "id": 10, "tasks": ["15.1", "16.1"] },
    { "id": 11, "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5"] }
  ]
}
```
