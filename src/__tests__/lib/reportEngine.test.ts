// Feature: finance-tracker, Property 11: Report Transfer Exclusion
// Feature: finance-tracker, Property 12: Report Date Range Containment
import { describe, it, expect } from "bun:test";
import { filterByDateRange, calculateSummary, groupByMonth } from "../../lib/reportEngine";
import type { Transaction } from "../../types";

function makeTx(overrides: Partial<Transaction> & { id: string; type: Transaction["type"]; amount: number; walletId: string; date: string }): Transaction {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Property 11: Report Transfer Exclusion", () => {
  it("transfers are excluded from income and expense totals", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-01" }),
      makeTx({ id: "2", type: "expense", amount: 50, walletId: "w1", date: "2025-01-01" }),
      makeTx({ id: "3", type: "transfer", amount: 200, walletId: "w1", date: "2025-01-01" }),
    ];

    const summary = calculateSummary(txs);

    expect(summary.totalIncome).toBe(100);
    expect(summary.totalExpense).toBe(50);
    expect(summary.netBalance).toBe(50);
  });

  it("groupByMonth excludes transfers", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-03-15" }),
      makeTx({ id: "2", type: "transfer", amount: 500, walletId: "w1", date: "2025-03-20" }),
    ];

    const monthly = groupByMonth(txs);

    expect(monthly.length).toBe(1);
    expect(monthly[0].totalIncome).toBe(100);
    expect(monthly[0].totalExpense).toBe(0);
  });
});

describe("Property 12: Report Date Range Containment", () => {
  it("all transactions in result are within the date range", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-01" }),
      makeTx({ id: "2", type: "income", amount: 200, walletId: "w1", date: "2025-01-15" }),
      makeTx({ id: "3", type: "income", amount: 300, walletId: "w1", date: "2025-02-01" }),
    ];

    const result = filterByDateRange(txs, "2025-01-01", "2025-01-31");

    expect(result.length).toBe(2);
    for (const tx of result) {
      expect(tx.date >= "2025-01-01").toBe(true);
      expect(tx.date <= "2025-01-31").toBe(true);
    }
  });

  it("transactions outside range are excluded", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2024-12-31" }),
      makeTx({ id: "2", type: "income", amount: 200, walletId: "w1", date: "2025-01-01" }),
      makeTx({ id: "3", type: "income", amount: 300, walletId: "w1", date: "2025-01-02" }),
    ];

    const result = filterByDateRange(txs, "2025-01-01", "2025-01-01");

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("2");
  });
});
