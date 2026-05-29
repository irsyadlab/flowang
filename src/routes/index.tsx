import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import TransactionsPage from "@/pages/transactions/TransactionsPage";
import NewTransactionPage from "@/pages/transactions/NewTransactionPage";
import EditTransactionPage from "@/pages/transactions/EditTransactionPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import MonthlyDetailPage from "@/pages/reports/MonthlyDetailPage";
import MorePage from "@/pages/more/MorePage";
import WalletsPage from "@/pages/wallets/WalletsPage";
import NewWalletPage from "@/pages/wallets/NewWalletPage";
import EditWalletPage from "@/pages/wallets/EditWalletPage";
import WalletDetailPage from "@/pages/wallets/WalletDetailPage";
import CategoriesPage from "@/pages/categories/CategoriesPage";
import NewCategoryPage from "@/pages/categories/NewCategoryPage";
import EditCategoryPage from "@/pages/categories/EditCategoryPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "transactions/new", element: <NewTransactionPage /> },
      { path: "transactions/:id", element: <EditTransactionPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "reports/monthly/:year/:month", element: <MonthlyDetailPage /> },
      { path: "more", element: <MorePage /> },
      { path: "wallets", element: <WalletsPage /> },
      { path: "wallets/new", element: <NewWalletPage /> },
      { path: "wallets/:id", element: <EditWalletPage /> },
      { path: "wallets/:id/detail", element: <WalletDetailPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "categories/new", element: <NewCategoryPage /> },
      { path: "categories/:id", element: <EditCategoryPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
