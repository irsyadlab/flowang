import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useTransactionStore } from "../../src/stores/transactionStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook, act } from "@testing-library/react";
import { useReports } from "../../src/hooks/useReports";
import type { Transaction } from "../../src/types";

function resetStores() {
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
}

function makeTx(overrides: Partial<Transaction> & { id: string; type: Transaction["type"]; amount: number; walletId: string; date: string }): Transaction {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("useReports", () => {
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

  it("calculates summary from transactions", () => {
    const txs = [
      makeTx({ id: "1", type: "income", amount: 1000, walletId: "w1", date: "2025-01-15" }),
      makeTx({ id: "2", type: "expense", amount: 300, walletId: "w1", date: "2025-01-15" }),
      makeTx({ id: "3", type: "transfer", amount: 500, walletId: "w1", date: "2025-01-15" }),
    ];
    useTransactionStore.setState({ transactions: txs });

    const { result } = renderHook(() => useReports());
    expect(result.current.summary.totalIncome).toBe(1000);
    expect(result.current.summary.totalExpense).toBe(300);
    expect(result.current.summary.netBalance).toBe(700);
  });

  it("groups transactions by month", () => {
    const txs = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-15" }),
      makeTx({ id: "2", type: "income", amount: 200, walletId: "w1", date: "2025-02-10" }),
    ];
    useTransactionStore.setState({ transactions: txs });

    const { result } = renderHook(() => useReports());
    expect(result.current.monthlyReports.length).toBe(2);
  });

  it("filters by walletId", () => {
    const txs = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-15" }),
      makeTx({ id: "2", type: "income", amount: 200, walletId: "w2", date: "2025-01-15" }),
    ];
    useTransactionStore.setState({ transactions: txs, filter: { walletId: "w1" } });

    const { result } = renderHook(() => useReports());
    expect(result.current.summary.totalIncome).toBe(100);
  });

  it("filters by type", () => {
    const txs = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-15" }),
      makeTx({ id: "2", type: "expense", amount: 50, walletId: "w1", date: "2025-01-15" }),
    ];
    useTransactionStore.setState({ transactions: txs, filter: { type: "income" } });

    const { result } = renderHook(() => useReports());
    expect(result.current.summary.totalIncome).toBe(100);
    expect(result.current.summary.totalExpense).toBe(0);
  });

  it("getSummaryByDateRange filters correctly", () => {
    const txs = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-10" }),
      makeTx({ id: "2", type: "income", amount: 200, walletId: "w1", date: "2025-02-15" }),
    ];
    useTransactionStore.setState({ transactions: txs });

    const { result } = renderHook(() => useReports());
    const summary = result.current.getSummaryByDateRange("2025-01-01", "2025-01-31");
    expect(summary.totalIncome).toBe(100);
  });

  it("returns empty summary for no transactions", () => {
    useTransactionStore.setState({ transactions: [] });
    const { result } = renderHook(() => useReports());
    expect(result.current.summary.totalIncome).toBe(0);
    expect(result.current.summary.totalExpense).toBe(0);
    expect(result.current.summary.netBalance).toBe(0);
  });
});
