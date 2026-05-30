// Feature: finance-tracker, Property 11: Report Transfer Exclusion
// Feature: finance-tracker, Property 12: Report Date Range Containment
// Feature: finance-tracker, Property 18: Balance Correction Exclusion
import { describe, it, expect } from "bun:test";
import fc from "fast-check";
import { filterByDateRange, calculateSummary, groupByMonth } from "../../src/lib/reportEngine";
import type { Transaction, TransactionType } from "../../src/types";

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

describe("Property 18: Balance Correction Exclusion", () => {
  it("correction transactions are excluded from summary totals", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-01-01" }),
      makeTx({ id: "2", type: "expense", amount: 50, walletId: "w1", date: "2025-01-01" }),
      makeTx({ id: "3", type: "adjustment_increase", amount: 999, walletId: "w1", date: "2025-01-01", isCorrection: true }),
      makeTx({ id: "4", type: "adjustment_decrease", amount: 888, walletId: "w1", date: "2025-01-01", isCorrection: true }),
    ];

    const summary = calculateSummary(txs);

    expect(summary.totalIncome).toBe(100);
    expect(summary.totalExpense).toBe(50);
    expect(summary.netBalance).toBe(50);
  });

  it("correction transactions are excluded from groupByMonth", () => {
    const txs: Transaction[] = [
      makeTx({ id: "1", type: "income", amount: 100, walletId: "w1", date: "2025-03-15" }),
      makeTx({ id: "2", type: "adjustment_increase", amount: 500, walletId: "w1", date: "2025-03-20", isCorrection: true }),
    ];

    const monthly = groupByMonth(txs);

    expect(monthly.length).toBe(1);
    expect(monthly[0].totalIncome).toBe(100);
    expect(monthly[0].totalExpense).toBe(0);
  });

  it("property: correction transactions never affect income or expense totals", () => {
    const arbitraryAmount = fc.double({ min: 0.01, max: 1_000_000, noNaN: true });
    const safeDateStr = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([y, m, d]) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );

    const txArb = fc.record({
      id: fc.uuid(),
      type: fc.constantFrom<TransactionType>("income", "expense", "transfer", "adjustment_increase", "adjustment_decrease"),
      amount: arbitraryAmount,
      walletId: fc.constant("w1"),
      date: safeDateStr,
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    });

    const isCorrectionArb = fc.boolean();

    fc.assert(
      fc.property(
        fc.array(txArb, { minLength: 0, maxLength: 30 }),
        fc.array(isCorrectionArb, { minLength: 0, maxLength: 30 }),
        (txs, flags) => {
          const txsWithCorrection = txs.map((tx, i) => ({
            ...tx,
            isCorrection: flags[i] ?? false,
          }));

          const summary = calculateSummary(txsWithCorrection);

          for (const tx of txsWithCorrection) {
            if (tx.isCorrection) {
              // Correction txs should NOT affect totals
              expect(summary.totalIncome).toBeLessThanOrEqual(summary.totalIncome);
              expect(summary.totalExpense).toBeLessThanOrEqual(summary.totalExpense);
            }
          }

          // Verify: only non-correction income/expense counted
          let expectedIncome = 0;
          let expectedExpense = 0;
          for (const tx of txsWithCorrection) {
            if (tx.isCorrection) continue;
            if (tx.type === "income") expectedIncome += tx.amount;
            else if (tx.type === "expense") expectedExpense += tx.amount;
          }

          expect(summary.totalIncome).toBe(expectedIncome);
          expect(summary.totalExpense).toBe(expectedExpense);
        }
      ),
      { numRuns: 100 }
    );
  });
});
