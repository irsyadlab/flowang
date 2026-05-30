import type { Step } from 'react-joyride';

export interface TourStepDetail {
  icon: string;
  label: string;
  description: string;
}

// v3: disableBeacon renamed to skipBeacon
export interface TourStepMeta extends Step {
  title: string;
  icon?: string;
  details?: TourStepDetail[];
}

export const TOUR_STEPS: TourStepMeta[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Selamat datang di Flowang 👋',
    content: 'Aplikasi pencatat keuangan pribadi yang simpel dan cepat. Yuk, kenalan dulu dengan fitur-fiturnya!',
    icon: '🎉',
    skipBeacon: true,
  },
  {
    target: '[data-tour="dashboard-summary"]',
    placement: 'auto',
    title: 'Ringkasan Keuangan',
    content: 'Pantau kondisi keuanganmu bulan ini dalam satu kartu.',
    icon: '💰',
    details: [
      {
        icon: '🏦',
        label: 'Total Saldo',
        description: 'Gabungan saldo dari semua wallet yang kamu miliki',
      },
      {
        icon: '📈',
        label: 'Pemasukan',
        description: 'Total uang masuk bulan ini',
      },
      {
        icon: '📉',
        label: 'Pengeluaran',
        description: 'Total uang keluar bulan ini',
      },
    ],
    skipBeacon: true,
  },
  {
    target: '[data-tour="add-transaction-btn"]',
    placement: 'bottom',
    title: 'Catat Transaksi',
    content: 'Tap tombol ini untuk mencatat pemasukan atau pengeluaran baru dengan cepat.',
    icon: '✏️',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-transactions"]',
    placement: 'top',
    title: 'Riwayat Transaksi',
    content: 'Lihat semua transaksi yang pernah kamu catat, lengkap dengan filter dan pencarian.',
    icon: '📋',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-reports"]',
    placement: 'top',
    title: 'Laporan Keuangan',
    content: 'Analisis keuanganmu lewat grafik dan laporan bulanan yang mudah dipahami.',
    icon: '📊',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-more"]',
    placement: 'top',
    title: 'Wallet & Kategori',
    content: 'Kelola dompet, atur kategori transaksi, dan sesuaikan pengaturan aplikasi sesuai kebutuhanmu.',
    icon: '⚙️',
    skipBeacon: true,
  },
];

// Runtime validation
if (TOUR_STEPS.length !== 6) {
  throw new Error(`TOUR_STEPS must have exactly 6 steps, got ${TOUR_STEPS.length}`);
}
