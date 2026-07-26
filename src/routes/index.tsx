/**
 * Definisi route.
 *
 * Semua route kecuali shell (AppLayout) dan Dashboard di-code-split lewat
 * properti `lazy` milik data router. Tujuannya menjauhkan dependency berat dari
 * critical path pemuatan awal:
 *
 *   - recharts      → hanya dipakai halaman Reports
 *   - html5-qrcode  → hanya dipakai QR scanner di Settings
 *
 * Dashboard sengaja TIDAK di-lazy: dia route pendaratan paling umum, jadi
 * memecahnya hanya menambah satu round-trip di jalur yang paling sering dilewati.
 *
 * Chunk yang belum ter-load ikut di-precache service worker saat install
 * (lihat post-process sw.js di build.ts), jadi offline-first tetap terjaga —
 * splitting menunda *parse & eksekusi*, bukan ketersediaan offline.
 *
 * Kegagalan memuat chunk ditangani `errorElement` di root route.
 */

import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import RouteErrorBoundary from "@/components/shared/RouteErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Dashboard /> },

      // Transactions
      {
        path: "transactions",
        lazy: async () => ({ Component: (await import("@/pages/transactions/TransactionsPage")).default }),
      },
      {
        path: "transactions/new",
        lazy: async () => ({ Component: (await import("@/pages/transactions/NewTransactionPage")).default }),
      },
      {
        path: "transactions/:id",
        lazy: async () => ({ Component: (await import("@/pages/transactions/EditTransactionPage")).default }),
      },

      // Reports — pembawa recharts
      {
        path: "reports",
        lazy: async () => ({ Component: (await import("@/pages/reports/ReportsPage")).default }),
      },
      {
        path: "reports/monthly/:year/:month",
        lazy: async () => ({ Component: (await import("@/pages/reports/MonthlyDetailPage")).default }),
      },

      // More
      {
        path: "more",
        lazy: async () => ({ Component: (await import("@/pages/more/MorePage")).default }),
      },

      // Wallets
      {
        path: "wallets",
        lazy: async () => ({ Component: (await import("@/pages/wallets/WalletsPage")).default }),
      },
      {
        path: "wallets/new",
        lazy: async () => ({ Component: (await import("@/pages/wallets/NewWalletPage")).default }),
      },
      {
        path: "wallets/:id",
        lazy: async () => ({ Component: (await import("@/pages/wallets/EditWalletPage")).default }),
      },
      {
        path: "wallets/:id/detail",
        lazy: async () => ({ Component: (await import("@/pages/wallets/WalletDetailPage")).default }),
      },

      // Categories
      {
        path: "categories",
        lazy: async () => ({ Component: (await import("@/pages/categories/CategoriesPage")).default }),
      },
      {
        path: "categories/new",
        lazy: async () => ({ Component: (await import("@/pages/categories/NewCategoryPage")).default }),
      },
      {
        path: "categories/:id",
        lazy: async () => ({ Component: (await import("@/pages/categories/EditCategoryPage")).default }),
      },

      // Settings — pembawa html5-qrcode
      {
        path: "settings",
        lazy: async () => ({ Component: (await import("@/pages/settings/SettingsPage")).default }),
      },

      // Loans
      {
        path: "loans",
        lazy: async () => ({ Component: (await import("@/pages/loans/ContactListPage")).default }),
      },
      {
        path: "loans/new",
        lazy: async () => ({ Component: (await import("@/pages/loans/NewLoanPage")).default }),
      },
      {
        path: "loans/:contactId",
        lazy: async () => ({ Component: (await import("@/pages/loans/LoanDetailPage")).default }),
      },
      {
        path: "loans/:contactId/new",
        lazy: async () => ({ Component: (await import("@/pages/loans/NewLoanPage")).default }),
      },
      {
        path: "loans/:contactId/:entryId",
        lazy: async () => ({ Component: (await import("@/pages/loans/EditLoanPage")).default }),
      },

      // Halaman statis
      {
        path: "privacy-policy",
        lazy: async () => ({ Component: (await import("@/pages/privacy-policy/PrivacyPolicyPage")).default }),
      },
      {
        path: "help",
        lazy: async () => ({ Component: (await import("@/pages/more/HelpPage")).default }),
      },
      {
        path: "about",
        lazy: async () => ({ Component: (await import("@/pages/more/AboutPage")).default }),
      },
      {
        path: "feedback",
        lazy: async () => ({ Component: (await import("@/pages/more/FeedbackPage")).default }),
      },
    ],
  },
]);
