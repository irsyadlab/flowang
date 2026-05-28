import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { openDB } from "./db/db";
import { useUIStore } from "./stores/uiStore";
import { useCategoryStore } from "./stores/categoryStore";
import { seedDefaultCategories } from "./db/categoryDb";
import { getDB } from "./db/db";
import { initialize as initSync } from "./sync/syncManager";
import "../styles/globals.css";

export function App() {
  const setDbReady = useUIStore((state) => state.setDbReady);
  const setDbError = useUIStore((state) => state.setDbError);
  const loadCategories = useCategoryStore((state) => state.loadCategories);

  useEffect(() => {
    const abortController = new AbortController();

    const initDB = async () => {
      try {
        // Call openDB which has 5 second timeout built-in
        await openDB();

        // Handle abort
        if (abortController.signal.aborted) return;

        // DB opened successfully, mark as ready
        setDbReady(true);

        // Seed default categories if storage is empty
        const db = getDB();
        if (db) {
          await seedDefaultCategories(db);
        }

        // Load categories (seeds if needed)
        await loadCategories();

        // Initialize sync manager
        initSync().catch(() => {});
      } catch (error) {
        // Handle abort
        if (abortController.signal.aborted) return;

        // Set error message
        const message = error instanceof Error ? error.message : "Failed to initialize database";
        setDbError(message);
      }
    };

    initDB();

    // Cleanup on unmount
    return () => {
      abortController.abort();
    };
  }, [setDbReady, setDbError, loadCategories]);

  return <RouterProvider router={router} />;
}

export default App;
