import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { openDB } from "./db/db";
import { useUIStore } from "./stores/uiStore";
import { useCategoryStore } from "./stores/categoryStore";
import { useWalletStore } from "./stores/walletStore";
import { useTransactionStore } from "./stores/transactionStore";
import { useLoanContactStore } from "./stores/loanContactStore";
import { useLoanEntryStore } from "./stores/loanEntryStore";
import { useLoanRepaymentStore } from "./stores/loanRepaymentStore";
import { seedDefaultCategories } from "./db/categoryDb";
import { getDB } from "./db/db";
import { initialize as initSync } from "./sync/syncManager";
import { useTheme } from "./hooks/useTheme";
import { Toaster } from "./components/ui/sonner";
import AppLoadingScreen from "./components/shared/AppLoadingScreen";
import "../styles/globals.css";

export function App() {
  const setDbReady = useUIStore((state) => state.setDbReady);
  const setDbError = useUIStore((state) => state.setDbError);
  const setAppReady = useUIStore((state) => state.setAppReady);
  const appReady = useUIStore((state) => state.appReady);

  useTheme();

  useEffect(() => {
    const abortController = new AbortController();

    const initDB = async () => {
      try {
        await openDB();
        if (abortController.signal.aborted) return;

        setDbReady(true);

        const db = getDB();
        if (db) await seedDefaultCategories(db);

        // Load semua stores sebelum app ditampilkan — mencegah kedip di tiap page
        await Promise.all([
          useCategoryStore.getState().loadCategories(),
          useWalletStore.getState().loadWallets(),
          useTransactionStore.getState().loadTransactions(),
          useLoanContactStore.getState().loadContacts(),
          useLoanEntryStore.getState().loadEntries(),
          useLoanRepaymentStore.getState().loadRepayments(),
        ]);

        if (abortController.signal.aborted) return;

        setAppReady(true);

        // Init sync non-blocking setelah UI sudah tampil
        initSync().catch(() => {});
      } catch (error) {
        if (abortController.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Failed to initialize database";
        setDbError(message);
        setAppReady(true);
      }
    };

    initDB();
    return () => { abortController.abort(); };
  }, [setDbReady, setDbError, setAppReady]);

  return (
    <>
      {!appReady && <AppLoadingScreen />}
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
