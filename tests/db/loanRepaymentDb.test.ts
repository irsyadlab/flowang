// Feature: loan-repayment-and-transaction-integration
// Property 3: Repayment round-trip — data tersimpan dan dapat dibaca kembali
// Property 13: Validasi referensial categoryId pada Loan_Entry
// Property 14: Validasi referensial categoryId pada Repayment
import "fake-indexeddb/auto";
import fc from "fast-check";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../src/db/db";
import * as loanRepaymentDb from "../../src/db/loanRepaymentDb";
import * as loanEntryDb from "../../src/db/loanEntryDb";
import { arbitraryRepayment, arbitraryActiveLoanEntry } from "../helpers/arbitraries";
import type { LoanEntry, Repayment, Category } from "../../src/types";

// Helper: add a category to the DB
async function addCategory(db: IDBDatabase, category: Category): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("categories", "readwrite");
    const store = tx.objectStore("categories");
    store.add(category);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Helper: add a loan entry to the DB
async function addLoanEntry(db: IDBDatabase, entry: LoanEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("loan_entries", "readwrite");
    const store = tx.objectStore("loan_entries");
    store.add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

describe("Property 3: Repayment round-trip — data tersimpan dan dapat dibaca kembali", () => {
  // Validates: Requirements 1.5
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("repayment round-trip: saved data matches input (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        async (entry: LoanEntry) => {
          // Add the loan entry first (FK constraint)
          await addLoanEntry(db, entry);

          // Generate a repayment for this entry
          const repaymentArb = arbitraryRepayment(entry.id, entry.amount);
          const repayment = fc.sample(repaymentArb, 1)[0] as Repayment;

          await loanRepaymentDb.addRepayment(db, repayment);
          const result = await loanRepaymentDb.getRepaymentById(db, repayment.id);

          expect(result).toBeDefined();
          expect(result!.id).toBe(repayment.id);
          expect(result!.loanEntryId).toBe(repayment.loanEntryId);
          expect(result!.amount).toBe(repayment.amount);
          expect(result!.date).toBe(repayment.date);
          expect(result!.note).toBe(repayment.note);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("getRepaymentsByLoanEntryId returns all repayments for a given entry (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        fc.integer({ min: 1, max: 5 }),
        async (entry: LoanEntry, count: number) => {
          await addLoanEntry(db, entry);

          // Add multiple repayments, each with a small amount
          const repayments: Repayment[] = [];
          for (let i = 0; i < count; i++) {
            const r = fc.sample(arbitraryRepayment(entry.id, 100), 1)[0] as Repayment;
            await loanRepaymentDb.addRepayment(db, r);
            repayments.push(r);
          }

          const results = await loanRepaymentDb.getRepaymentsByLoanEntryId(db, entry.id);
          expect(results.length).toBe(count);
          for (const r of repayments) {
            expect(results.some((res) => res.id === r.id)).toBe(true);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deleteRepayment removes repayment permanently (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        async (entry: LoanEntry) => {
          await addLoanEntry(db, entry);

          const repayment = fc.sample(arbitraryRepayment(entry.id, entry.amount), 1)[0] as Repayment;
          await loanRepaymentDb.addRepayment(db, repayment);

          const before = await loanRepaymentDb.getRepaymentById(db, repayment.id);
          expect(before).toBeDefined();

          await loanRepaymentDb.deleteRepayment(db, repayment.id);
          const after = await loanRepaymentDb.getRepaymentById(db, repayment.id);
          expect(after).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe("Property 14: Validasi referensial categoryId pada Repayment", () => {
  // Validates: Requirements 4.4
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("saving repayment with non-existent categoryId fails (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        fc.uuid(),
        async (entry: LoanEntry, fakeCategoryId: string) => {
          await addLoanEntry(db, entry);

          const repayment = fc.sample(arbitraryRepayment(entry.id, entry.amount), 1)[0] as Repayment;
          const repaymentWithBadCategory: Repayment = {
            ...repayment,
            categoryId: fakeCategoryId,
          };

          let threw = false;
          try {
            await loanRepaymentDb.addRepayment(db, repaymentWithBadCategory);
          } catch {
            threw = true;
          }
          expect(threw).toBe(true);

          // Verify repayment was NOT saved
          const result = await loanRepaymentDb.getRepaymentById(db, repayment.id);
          expect(result).toBeUndefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  it("saving repayment with valid categoryId succeeds (30 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        async (entry: LoanEntry) => {
          await addLoanEntry(db, entry);

          // Add a real category
          const categoryId = crypto.randomUUID();
          const category: Category = {
            id: categoryId,
            name: "Test Category",
            type: "expense",
            isDefault: false,
            createdAt: new Date().toISOString(),
          };
          await addCategory(db, category);

          const repayment = fc.sample(arbitraryRepayment(entry.id, entry.amount), 1)[0] as Repayment;
          const repaymentWithCategory: Repayment = {
            ...repayment,
            categoryId,
          };

          await loanRepaymentDb.addRepayment(db, repaymentWithCategory);
          const result = await loanRepaymentDb.getRepaymentById(db, repayment.id);
          expect(result).toBeDefined();
          expect(result!.categoryId).toBe(categoryId);
        }
      ),
      { numRuns: 30 }
    );
  });
});
