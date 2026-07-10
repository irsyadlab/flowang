import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import "fake-indexeddb/auto";
import { useTransactionStore } from "../../src/stores/transactionStore";
import { useWalletStore } from "../../src/stores/walletStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { closeDB } from "../../src/db/db";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook, act } from "@testing-library/react";
import { useReports } from "../../src/hooks/useReports";

function resetStores() {
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
  useWalletStore.setState({ wallets: [], isLoading: false, error: null });
  useCategoryStore.setState({ categories: [], isLoading: false, error: null });
}

describe("TransactionFilter behavior via useReports", () => {
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

  it("filters by dateFrom/dateTo", () => {
    const now = new Date().toISOString();
    useTransactionStore.setState({
      transactions: [
        { id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-10", createdAt: now, updatedAt: now },
        { id: "2", type: "income", amount: 200, walletId: "w1", date: "2025-01-20", createdAt: now, updatedAt: now },
        { id: "3", type: "income", amount: 300, walletId: "w1", date: "2025-02-05", createdAt: now, updatedAt: now },
      ],
      filter: { dateFrom: "2025-01-15", dateTo: "2025-01-31" },
    });

    const { result } = renderHook(() => useReports());
    expect(result.current.transactions.length).toBe(1);
    expect(result.current.transactions[0].id).toBe("2");
  });

  it("filters by categoryId", () => {
    const now = new Date().toISOString();
    useTransactionStore.setState({
      transactions: [
        { id: "1", type: "income", amount: 100, walletId: "w1", categoryId: "c1", date: "2025-01-10", createdAt: now, updatedAt: now },
        { id: "2", type: "income", amount: 200, walletId: "w1", categoryId: "c2", date: "2025-01-10", createdAt: now, updatedAt: now },
      ],
      filter: { categoryId: "c1" },
    });

    const { result } = renderHook(() => useReports());
    expect(result.current.transactions.length).toBe(1);
    expect(result.current.transactions[0].categoryId).toBe("c1");
  });

  it("combines multiple filters with AND logic", () => {
    const now = new Date().toISOString();
    useTransactionStore.setState({
      transactions: [
        { id: "1", type: "income", amount: 100, walletId: "w1", categoryId: "c1", date: "2025-01-10", createdAt: now, updatedAt: now },
        { id: "2", type: "expense", amount: 50, walletId: "w1", categoryId: "c1", date: "2025-01-10", createdAt: now, updatedAt: now },
        { id: "3", type: "income", amount: 200, walletId: "w2", categoryId: "c1", date: "2025-01-10", createdAt: now, updatedAt: now },
      ],
      filter: { walletId: "w1", type: "income" },
    });

    const { result } = renderHook(() => useReports());
    expect(result.current.transactions.length).toBe(1);
    expect(result.current.transactions[0].id).toBe("1");
  });

  it("getMonthlyReportByDateRange filters correctly", () => {
    const now = new Date().toISOString();
    useTransactionStore.setState({
      transactions: [
        { id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-15", createdAt: now, updatedAt: now },
        { id: "2", type: "income", amount: 200, walletId: "w1", date: "2025-02-15", createdAt: now, updatedAt: now },
        { id: "3", type: "income", amount: 300, walletId: "w1", date: "2025-03-15", createdAt: now, updatedAt: now },
      ],
    });

    const { result } = renderHook(() => useReports());
    const reports = result.current.getMonthlyReportByDateRange("2025-01-01", "2025-02-28");
    expect(reports.length).toBe(2);
  });
});
