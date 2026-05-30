// Feature: finance-tracker, Property 16: Wallet Transaction Completeness
import { describe, it, expect } from "bun:test";
import fc from "fast-check";
import type { TransactionType } from "../../src/types";

function filterWalletTransactions(transactions: Transaction[], walletId: string): Transaction[] {
  return transactions.filter((t) => t.walletId === walletId || t.toWalletId === walletId);
}

describe("Property 16: Wallet Transaction Completeness", () => {
  it("filtered transactions include all and only transactions where walletId === id OR toWalletId === id", () => {
    const walletIdArb = fc.constant("target-wallet");
    const otherWalletIdArb = fc.constantFrom("w-other-1", "w-other-2", "w-other-3");

    const txArb = fc.record({
      id: fc.uuid(),
      type: fc.constantFrom<TransactionType>("income", "expense", "transfer"),
      amount: fc.double({ min: 1, max: 1_000_000, noNaN: true }),
      walletId: fc.oneof(walletIdArb, otherWalletIdArb),
      toWalletId: fc.option(fc.oneof(walletIdArb, otherWalletIdArb), { nil: undefined }),
      date: fc.tuple(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 })
      ).map(([y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`),
      note: fc.option(fc.string(), { nil: undefined }),
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    });

    fc.assert(
      fc.property(
        fc.array(txArb, { minLength: 0, maxLength: 50 }),
        walletIdArb,
        (transactions, walletId) => {
          const filtered = filterWalletTransactions(transactions, walletId);

          // Completeness: every matching transaction is included
          for (const tx of transactions) {
            if (tx.walletId === walletId || tx.toWalletId === walletId) {
              expect(filtered.some((f) => f.id === tx.id)).toBe(true);
            }
          }

          // Soundness: every included transaction is a match
          for (const tx of filtered) {
            expect(tx.walletId === walletId || tx.toWalletId === walletId).toBe(true);
          }

          // Size: filtered count matches expected count
          const expectedCount = transactions.filter(
            (tx) => tx.walletId === walletId || tx.toWalletId === walletId
          ).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
