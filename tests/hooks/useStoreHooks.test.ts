import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import "fake-indexeddb/auto";
import { useWalletStore } from "../../src/stores/walletStore";
import { useTransactionStore } from "../../src/stores/transactionStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { closeDB } from "../../src/db/db";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook } from "@testing-library/react";
import { useWallets } from "../../src/hooks/useWallets";
import { useTransactions } from "../../src/hooks/useTransactions";
import { useCategories } from "../../src/hooks/useCategories";

function resetStores() {
  useWalletStore.setState({ wallets: [], isLoading: false, error: null });
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
  useCategoryStore.setState({ categories: [], isLoading: false, error: null });
}

describe("useWallets", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  it("returns wallets from store", () => {
    useWalletStore.setState({
      wallets: [{ id: "w1", name: "BCA", initialBalance: 1000, balance: 1000, createdAt: "", updatedAt: "" }],
    });
    const { result } = renderHook(() => useWallets());
    expect(result.current.wallets.length).toBe(1);
    expect(result.current.wallets[0].name).toBe("BCA");
  });

  it("exposes store actions", () => {
    const { result } = renderHook(() => useWallets());
    expect(typeof result.current.loadWallets).toBe("function");
    expect(typeof result.current.addWallet).toBe("function");
    expect(typeof result.current.updateWallet).toBe("function");
    expect(typeof result.current.deleteWallet).toBe("function");
    expect(typeof result.current.recalculateBalance).toBe("function");
  });

  it("reflects loading state", () => {
    useWalletStore.setState({ isLoading: true });
    const { result } = renderHook(() => useWallets());
    expect(result.current.isLoading).toBe(true);
  });

  it("reflects error state", () => {
    useWalletStore.setState({ error: "test error" });
    const { result } = renderHook(() => useWallets());
    expect(result.current.error).toBe("test error");
  });
});

describe("useTransactions", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  it("returns transactions from store", () => {
    useTransactionStore.setState({
      transactions: [
        { id: "t1", type: "income", amount: 100, walletId: "w1", date: "2025-01-15", createdAt: "", updatedAt: "" },
      ],
    });
    const { result } = renderHook(() => useTransactions());
    expect(result.current.transactions.length).toBe(1);
  });

  it("exposes filter state", () => {
    useTransactionStore.setState({ filter: { type: "income" } });
    const { result } = renderHook(() => useTransactions());
    expect(result.current.filter.type).toBe("income");
  });

  it("exposes store actions", () => {
    const { result } = renderHook(() => useTransactions());
    expect(typeof result.current.loadTransactions).toBe("function");
    expect(typeof result.current.addTransaction).toBe("function");
    expect(typeof result.current.updateTransaction).toBe("function");
    expect(typeof result.current.deleteTransaction).toBe("function");
    expect(typeof result.current.setFilter).toBe("function");
    expect(typeof result.current.clearFilter).toBe("function");
  });
});

describe("useCategories", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  it("returns categories from store", () => {
    useCategoryStore.setState({
      categories: [{ id: "c1", name: "Makan", type: "expense", isDefault: false, createdAt: "" }],
    });
    const { result } = renderHook(() => useCategories());
    expect(result.current.categories.length).toBe(1);
    expect(result.current.categories[0].name).toBe("Makan");
  });

  it("exposes store actions", () => {
    const { result } = renderHook(() => useCategories());
    expect(typeof result.current.loadCategories).toBe("function");
    expect(typeof result.current.addCategory).toBe("function");
    expect(typeof result.current.updateCategory).toBe("function");
    expect(typeof result.current.deleteCategory).toBe("function");
  });
});
