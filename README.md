<div align="center">
  <img src="public/icons/icon.svg" alt="Flowang" width="80" />

  <h1>Flowang</h1>
  <p>A lightweight, private personal finance tracker that works fully offline.</p>

**[flowang.irsyadulibad.my.id](https://flowang.irsyadulibad.my.id)**

![Bun](https://img.shields.io/badge/Bun-1.2+-black?logo=bun&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Features

- **Offline-first** — all data stored in IndexedDB, no internet required
- **Privacy-first** — no accounts, no servers, no tracking
- **Multi-wallet** — manage multiple wallets and bank accounts
- **Full transaction types** — income, expense, and wallet-to-wallet transfers
- **Financial reports** — realtime, monthly, and custom date range summaries
- **Loans & debts** — track borrowing and lending with settlement status
- **E2E sync** — optional peer-to-peer sync via WebRTC + AES-256-GCM encryption
- **Google Drive backup** — optional, encrypted before upload
- **PWA** — installable on mobile like a native app

## Stack

|           |                             |
| --------- | --------------------------- |
| Runtime   | [Bun](https://bun.sh)       |
| Framework | React 19 + React Router v7  |
| Styling   | Tailwind CSS v4 + shadcn/ui |
| State     | Zustand                     |
| Storage   | IndexedDB (browser-native)  |
| Sync      | Yjs CRDT + y-webrtc         |

## Getting Started

Install dependencies:

```bash
bun install
```

Copy environment variables:

```bash
cp .env.example .env
```

Start the development server:

```bash
bun dev
```

Build for production:

```bash
bun run build
```

Run the production server:

```bash
bun start
```

Run tests:

```bash
bun test
```

## Project Structure

```
flowang/
├── public/          # Static assets (icons, manifest, sw, screenshots)
├── src/             # Source code
│   ├── components/  # UI components
│   ├── db/          # IndexedDB layer
│   ├── hooks/       # React hooks
│   ├── pages/       # Page components
│   ├── stores/      # Zustand stores
│   ├── sync/        # Sync engine (WebRTC, Google Drive, Yjs)
│   └── types/       # TypeScript types
├── styles/          # Global CSS
└── tests/           # Test suites
```

---

## Android TWA Build

Flowang dikemas sebagai **Trusted Web Activity (TWA)** untuk distribusi di Google Play Store menggunakan [@bubblewrap/cli](https://github.com/GoogleChromeLabs/bubblewrap).

### Prasyarat

- Node.js ≥ 14
- JDK 17
- Android SDK (Bubblewrap bisa auto-download)
- `@bubblewrap/cli` terinstall global: `npm i -g @bubblewrap/cli`

### Generate / Update Project

```bash
cd android
bubblewrap init --manifest https://flowang.irsyadulibad.my.id/manifest.json
# Jika twa-manifest.json sudah ada, gunakan:
bubblewrap update
```

### Build AAB

```bash
cd android
bubblewrap build
```

Output: `android/app-release-signed.aab` (Play Store) dan `android/app-release-signed.apk` (sideload).

### Digital Asset Links

Pastikan `https://flowang.irsyadulibad.my.id/.well-known/assetlinks.json` berisi SHA-256 fingerprint dari:

1. **Upload key** — didapat dari `bubblewrap fingerprint` atau `keytool -list -v -keystore android.keystore -alias android`
2. **Play App Signing key** — didapat dari Play Console → Setup → App integrity

Setelah upload ke Play Store, update assetlinks.json lalu deploy ulang.

### Rotasi Signing Key

1. Generate key baru: `keytool -genkey -v -keystore android-new.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000`
2. Update `twa-manifest.json` dengan path keystore baru
3. Build ulang & dapatkan fingerprint baru
4. Update `assetlinks.json` — tambahkan fingerprint baru (keduanya diperlukan selama transisi)
5. Deploy ulang web

### Peringatan

- **Jangan commit** `*.keystore`, `keystore.json`, atau file `.aab`/`.apk` ke repository.
- Simpan password keystore di tempat aman (mis. GitHub Secrets untuk CI).
