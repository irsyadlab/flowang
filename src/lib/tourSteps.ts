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

// Page groups in order — used to compute per-page step indicators
export const TOUR_PAGES = [
  'dashboard',
  'transactions',
  'reports',
  'loans',
  'more',
] as const;

export type TourPage = (typeof TOUR_PAGES)[number];

export const TOUR_STEPS: TourStepMeta[] = [
  // ── Dashboard (3 steps) ────────────────────────────────────
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
    target: '[data-tour="add-transaction-btn"]',
    placement: 'bottom',
    title: 'Catat Transaksi',
    content: 'Tap tombol ini untuk mencatat pemasukan atau pengeluaran baru dengan cepat.',
    icon: '✏️',
    skipBeacon: true,
    page: 'dashboard',
  },

  // ── Transactions (3 steps) ─────────────────────────────────
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

  // ── Loans (2 steps) ────────────────────────────────────────
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
    content: 'Tap tombol ini untuk mencatat hutang atau piutang baru. Pilih kontak yang sudah ada atau buat kontak baru, lalu isi nominal dan arahnya — piutang (kamu meminjamkan) atau hutang (kamu meminjam).',
    icon: '➕',
    skipBeacon: true,
    targetWaitTimeout: 3000,
    page: 'loans',
  },

  // ── More (1 step) ──────────────────────────────────────────
  {
    target: '[data-tour="nav-more"]',
    placement: 'top',
    title: 'Wallet & Kategori',
    content: 'Kelola dompet, atur kategori transaksi, dan sesuaikan pengaturan aplikasi sesuai kebutuhanmu.',
    icon: '⚙️',
    skipBeacon: true,
    page: 'more',
  },
];

// Runtime validation
if (TOUR_STEPS.length !== 13) {
  throw new Error(`TOUR_STEPS must have exactly 13 steps, got ${TOUR_STEPS.length}`);
}
