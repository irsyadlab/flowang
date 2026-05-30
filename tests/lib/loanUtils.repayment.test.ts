// Feature: loan-repayment-and-transaction-integration
// Property 1: Validasi amount Repayment — angka non-positif selalu ditolak
// Property 2: Validasi amount Repayment — melebihi remaining amount selalu ditolak
// Property 16: Kalkulasi total piutang aktif, total hutang aktif, dan net posisi
import fc from "fast-check";
import { describe, it, expect } from "bun:test";
import {
  validateRepaymentAmount,
  calculateRemainingAmount,
  calculateLoanReportSummary,
} from "../../src/lib/loanUtils";
import { arbitraryActiveLoanEntry, arbitraryRepayment } from "../helpers/arbitraries";
import type { LoanEntry, Repayment } from "../../src/types";

describe("Property 1: Validasi amount Repayment — angka non-positif selalu ditolak", () => {
  // Validates: Requirements 1.3
  it("rejects non-positive repayment amounts (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.double({ max: 0, noNaN: true })
        ),
        (amount) => {
          const result = validateRepaymentAmount(amount, 1000);
          return result.success === false && result.error === "Jumlah harus lebih dari 0";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts positive amounts within remaining (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1001, max: 10_000 }),
        (amount, remaining) => {
          const result = validateRepaymentAmount(amount, remaining);
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 2: Validasi amount Repayment — melebihi remaining amount selalu ditolak", () => {
  // Validates: Requirements 1.4
  it("rejects amounts exceeding remaining amount (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999_999_999 }),
        fc.integer({ min: 1, max: 999_999_999 }),
        (remaining, excess) => {
          const amount = remaining + excess;
          const result = validateRepaymentAmount(amount, remaining);
          return result.success === false && result.error === "Jumlah melebihi sisa hutang/piutang";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts amounts exactly equal to remaining (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999_999_999 }),
        (remaining) => {
          const result = validateRepaymentAmount(remaining, remaining);
          return result.success === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("calculateRemainingAmount", () => {
  it("remaining = loanAmount - sum(repayments) (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000 }),
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 0, maxLength: 10 }),
        (loanAmount, repaymentAmounts) => {
          const repayments: Repayment[] = repaymentAmounts.map((amount) => ({
            id: crypto.randomUUID(),
            loanEntryId: crypto.randomUUID(),
            amount,
            date: "2024-01-01",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          const result = calculateRemainingAmount(loanAmount, repayments);
          const expected = loanAmount - repaymentAmounts.reduce((s, a) => s + a, 0);
          return Math.abs(result - expected) < 0.001;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 16: Kalkulasi total piutang aktif, total hutang aktif, dan net posisi", () => {
  // Validates: Requirements 5.1
  it("calculates totalActiveLend, totalActiveBorrow, and netPosition correctly (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            contactId: fc.uuid(),
            amount: fc.integer({ min: 1, max: 10_000 }),
            direction: fc.constantFrom("lend" as const, "borrow" as const),
            status: fc.constantFrom("active" as const, "settled" as const),
            date: fc.constant("2024-01-01"),
            remainingAmount: fc.integer({ min: 0, max: 10_000 }),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (entries) => {
          // No repayments — use remainingAmount from entries directly
          const summary = calculateLoanReportSummary(entries as LoanEntry[], []);

          let expectedLend = 0;
          let expectedBorrow = 0;

          for (const entry of entries) {
            if (entry.status !== "active") continue;
            if (entry.direction === "lend") {
              expectedLend += entry.remainingAmount;
            } else {
              expectedBorrow += entry.remainingAmount;
            }
          }

          const expectedNet = expectedLend - expectedBorrow;

          return (
            Math.abs(summary.totalActiveLend - expectedLend) < 0.001 &&
            Math.abs(summary.totalActiveBorrow - expectedBorrow) < 0.001 &&
            Math.abs(summary.netPosition - expectedNet) < 0.001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("settled entries are excluded from the summary (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            contactId: fc.uuid(),
            amount: fc.integer({ min: 1, max: 10_000 }),
            direction: fc.constantFrom("lend" as const, "borrow" as const),
            status: fc.constant("settled" as const),
            date: fc.constant("2024-01-01"),
            remainingAmount: fc.integer({ min: 0, max: 10_000 }),
            createdAt: fc.constant(new Date().toISOString()),
            updatedAt: fc.constant(new Date().toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (settledEntries) => {
          const summary = calculateLoanReportSummary(settledEntries as LoanEntry[], []);
          return (
            summary.totalActiveLend === 0 &&
            summary.totalActiveBorrow === 0 &&
            summary.netPosition === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
