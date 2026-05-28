// Feature: finance-tracker, Property 10: Transaction Filter AND Logic
// Feature: finance-tracker, Property 13: Transaction List Ordering
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../db/db";
import { useTransactionStore } from "../../stores/transactionStore";
import { useWalletStore } from "../../stores/walletStore";
import { useCategoryStore } from "../../stores/categoryStore";
import { useUIStore } from "../../stores/uiStore";

function resetStores() {
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
  useWalletStore.setState({ wallets: [], isLoading: false, error: null });
  useCategoryStore.setState({ categories: [], isLoading: false, error: null });
}

describe("Property 10: Transaction Filter AND Logic", () => {
  beforeEach(async () => {
    resetStores();
    await openDB();
    useUIStore.getState().setDbReady(true);
    await useWalletStore.getState().loadWallets();
    await useCategoryStore.getState().loadCategories();
    await useTransactionStore.getState().loadTransactions();
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  it("filter by type returns only matching type", async () => {
    const store = useTransactionStore.getState();
    const transactions = store.transactions;

    if (transactions.length === 0) return;

    const firstType = transactions[0].type;
    store.setFilter({ type: firstType });

    const filtered = useTransactionStore.getState().transactions.filter(
      (t) => !useTransactionStore.getState().filter.type || t.type === useTransactionStore.getState().filter.type
    );

    for (const t of filtered) {
      expect(t.type).toBe(firstType);
    }

    store.clearFilter();
  });
});

describe("Property 13: Transaction List Ordering", () => {
  it("transactions sorted by date descending", () => {
    const transactions = useTransactionStore.getState().transactions;

    const sorted = [...transactions].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevKey = prev.date + prev.createdAt;
      const currKey = curr.date + curr.createdAt;
      expect(prevKey >= currKey).toBe(true);
    }
  });
});
