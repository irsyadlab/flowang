import type { Step } from 'react-joyride';

export interface TourStepDetail {
  icon: string;
  label: string;
  description: string;
}

export interface TourStepMeta extends Step {
  title: string;
  icon?: string;
  details?: TourStepDetail[];
  /** Page group label — used by TourTooltip to show per-page step dots */
  page: string;
}

export const TOUR_STEPS: TourStepMeta[] = [
  // ── Dashboard (4 steps) ────────────────────────────────────
  {
    target: 'body',
    placement: 'center',
    title: 'Selamat datang di Flowang 👋',
    content: 'Aplikasi pencatat keuangan pribadi yang simpel dan cepat. Yuk, kenalan dulu dengan fitur-fiturnya!',
    icon: '🎉',
    skipBeacon: true,
    page: 'dashboard',
  },
  {
    target: '[data-tour="dashboard-summary"]',
    placement: 'auto',
    title: 'Ringkasan Keuangan',
    content: 'Pantau kondisi keuanganmu bulan ini dalam satu kartu.',
    icon: '💰',
    details: [
      { icon: '🏦', label: 'Total Saldo', description: 'Gabungan saldo dari semua wallet yang kamu miliki' },
      { icon: '📈', label: 'Pemasukan', description: 'Total uang masuk bulan ini' },
      { icon: '📉', label: 'Pengeluaran', description: 'Total uang keluar bulan ini' },
    ],
    skipBeacon: true,
    page: 'dashboard',
  },
  {
    target: '[data-tour="dashboard-eye-toggle"]',
    placement: 'bottom',
    title: 'Sembunyikan Saldo',
    content: 'Tap ikon mata ini untuk menyembunyikan semua angka saldo — berguna saat kamu membuka aplikasi di depan orang lain.',
    icon: '👁️',
    skipBeacon: true,
    page: 'dashboard',
  },
  {
    target: '[data-tour="add-transaction-btn"]',
    placement: 'bottom',
    title: 'Catat Transaksi',
    content: 'Tap tombol ini untuk mencatat pemasukan atau pengeluaran baru dengan cepat.',
    icon: '✏️',
    skipBeacon: true,
    page: 'dashboard',
  },

  // ── Transactions (5 steps) ─────────────────────────────────
  {
    target: '[data-tour="nav-transactions"]',
    placement: 'top',
    title: 'Riwayat Transaksi',
    content: 'Lihat semua transaksi yang pernah kamu catat, lengkap dengan filter dan pencarian.',
    icon: '📋',
    skipBeacon: true,
    page: 'transactions',
  },
  {
    target: '[data-tour="tx-date-nav"]',
    placement: 'bottom',
    title: 'Navigasi Tanggal',
    content: 'Gunakan tombol panah untuk berpindah hari, atau tap tanggal di tengah untuk langsung pilih tanggal tertentu.',
    icon: '📅',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'transactions',
  },
  {
    target: '[data-tour="tx-filter-btn"]',
    placement: 'bottom',
    title: 'Filter Transaksi',
    content: 'Saring transaksi berdasarkan wallet, kategori, atau tipe (pemasukan / pengeluaran / transfer).',
    icon: '🔍',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'transactions',
  },
  {
    target: '[data-tour="tx-add-fab"]',
    placement: 'top',
    title: 'Tambah Transaksi',
    content: 'Tap tombol ini untuk membuka form pencatatan transaksi baru.',
    icon: '➕',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'transactions',
  },
  {
    target: '[data-tour="tx-form-type"]',
    placement: 'bottom',
    title: 'Form Transaksi',
    content: 'Pilih tipe transaksi — Keluar untuk pengeluaran, Masuk untuk pemasukan, atau Transfer antar wallet. Lalu isi nominal, wallet, kategori, tanggal, dan catatan opsional.',
    icon: '📝',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'new-transaction',
  },

  // ── Reports (4 steps) ──────────────────────────────────────
  {
    target: '[data-tour="nav-reports"]',
    placement: 'top',
    title: 'Laporan Keuangan',
    content: 'Analisis keuanganmu lewat grafik dan laporan yang mudah dipahami.',
    icon: '📊',
    skipBeacon: true,
    page: 'reports',
  },
  {
    target: '[data-tour="report-tab-realtime"]',
    placement: 'bottom',
    title: 'Tab Realtime',
    content: 'Lihat ringkasan keuangan bulan ini secara langsung — pemasukan, pengeluaran, saldo bersih, dan breakdown pengeluaran per kategori.',
    icon: '⚡',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'reports',
  },
  {
    target: '[data-tour="report-tab-monthly"]',
    placement: 'bottom',
    title: 'Tab Bulanan',
    content: 'Lihat tren keuangan 6 bulan terakhir dalam grafik batang. Tap salah satu bulan untuk melihat detail chart, kategori, dan judul transaksi.',
    icon: '📆',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'reports',
  },
  {
    target: '[data-tour="report-tab-custom"]',
    placement: 'bottom',
    title: 'Tab Custom',
    content: 'Buat laporan untuk rentang tanggal bebas — pilih tanggal mulai dan akhir, lalu tap "Tampilkan Laporan" untuk melihat hasilnya.',
    icon: '🗓️',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'reports',
  },

  // ── Loans (3 steps) ────────────────────────────────────────
  {
    target: '[data-tour="nav-loans"]',
    placement: 'top',
    title: 'Hutang & Piutang',
    content: 'Catat dan pantau hutang atau piutang kamu per kontak, lengkap dengan riwayat pembayaran.',
    icon: '🤝',
    skipBeacon: true,
    page: 'loans',
  },
  {
    target: '[data-tour="loans-fab"]',
    placement: 'top',
    title: 'Tambah Catatan',
    content: 'Tap tombol ini untuk mencatat hutang atau piutang baru.',
    icon: '➕',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'loans',
  },
  {
    target: '[data-tour="loan-form-direction"]',
    placement: 'bottom',
    title: 'Tipe Hutang & Piutang',
    content: 'Pilih arah — Piutang jika kamu yang meminjamkan uang ke orang lain, Hutang jika kamu yang meminjam dari orang lain. Lalu isi nominal, kontak, tanggal, dan catatan opsional.',
    icon: '📝',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'new-loan',
  },
  {
    target: '[data-tour="loan-form-create-tx"]',
    placement: 'top',
    title: 'Catat sebagai Transaksi',
    content: 'Aktifkan toggle ini agar hutang/piutang otomatis tercatat juga di riwayat transaksi. Berguna untuk menjaga saldo wallet tetap akurat saat uang berpindah tangan.',
    icon: '🔄',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'new-loan',
  },

  // ── More → Wallets (3 steps) ──────────────────────────────
  {
    target: '[data-tour="more-wallets"]',
    placement: 'bottom',
    title: 'Kelola Wallet',
    content: 'Buka halaman wallet untuk melihat dan mengelola semua dompet kamu.',
    icon: '👛',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'more',
  },
  {
    target: '[data-tour="wallets-eye-toggle"]',
    placement: 'bottom',
    title: 'Sembunyikan Saldo',
    content: 'Toggle ini menyembunyikan saldo di halaman wallet — sama seperti tombol mata di beranda.',
    icon: '👁️',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'wallets',
  },
  {
    target: '[data-tour="wallets-add"]',
    placement: 'bottom',
    title: 'Tambah Wallet',
    content: 'Buat wallet baru untuk memisahkan saldo — misalnya dompet utama, tabungan, atau kantong receh.',
    icon: '➕',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'wallets',
  },

  // ── More → Categories (2 steps) ───────────────────────────
  {
    target: '[data-tour="more-categories"]',
    placement: 'bottom',
    title: 'Kelola Kategori',
    content: 'Atur kategori pemasukan dan pengeluaran agar transaksi lebih terorganisir.',
    icon: '🏷️',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'more',
  },
  {
    target: '[data-tour="categories-add"]',
    placement: 'bottom',
    title: 'Tambah Kategori',
    content: 'Buat kategori baru untuk mengelompokkan transaksi — misalnya makanan, transportasi, atau hiburan.',
    icon: '➕',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'categories',
  },

  // ── More → Settings (5 steps) ─────────────────────────────
  {
    target: '[data-tour="more-settings"]',
    placement: 'bottom',
    title: 'Pengaturan',
    content: 'Sesuaikan tema, kelola sinkronisasi antar perangkat, dan backup data ke Google Drive.',
    icon: '🔧',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'more',
  },
  {
    target: '[data-tour="settings-sync-status"]',
    placement: 'bottom',
    title: 'Status Sinkronisasi',
    content: 'Pantau status koneksi sinkronisasi real-time antar perangkat. Tap "Hubungkan" untuk mulai sinkronisasi — data akan otomatis tersinkron saat ada perangkat lain yang terhubung dengan Sync Key yang sama.',
    icon: '📡',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'settings',
  },
  {
    target: '[data-tour="settings-sync-key"]',
    placement: 'bottom',
    title: 'Sync Key',
    content: 'Gunakan QR Code atau salin key untuk menghubungkan perangkat lain agar data selalu tersinkronisasi secara real-time.',
    icon: '🔑',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'settings',
  },
  {
    target: '[data-tour="settings-google-drive"]',
    placement: 'bottom',
    title: 'Google Drive Backup',
    content: 'Backup data secara terenkripsi ke Google Drive. Kamu bisa restore data dari perangkat mana saja.',
    icon: '☁️',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'settings',
  },
  {
    target: '[data-tour="settings-theme"]',
    placement: 'bottom',
    title: 'Tema',
    content: 'Pilih tampilan terang, gelap, atau ikuti pengaturan sistem.',
    icon: '🎨',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'settings',
  },
];

// Runtime validation
if (TOUR_STEPS.length !== 27) {
  throw new Error(`TOUR_STEPS must have exactly 27 steps, got ${TOUR_STEPS.length}`);
}
