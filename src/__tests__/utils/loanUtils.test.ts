// Feature: loan-tracker, Property 2: Contact Name Whitespace Validation
// Feature: loan-tracker, Property 3: Contact Name Length Validation
// Feature: loan-tracker, Property 5: Amount Lower Bound Validation
// Feature: loan-tracker, Property 6: Amount Upper Bound Validation
// Feature: loan-tracker, Property 7: Loan Entry List Sorted by Date Descending
// Feature: loan-tracker, Property 10: Contact Summary Calculation
// Feature: loan-tracker, Property 11: Net Balance Label Correctness
// Feature: loan-tracker, Property 12: Active Contacts Badge Count
import fc from "fast-check";
import { describe, it, expect } from "bun:test";
import {
  validateContactName,
  validateAmount,
  computeContactSummary,
  getNetBalanceLabel,
  countContactsWithActiveLoans,
  sortEntriesByDate,
} from "../../lib/loanUtils";
import {
  arbitraryLoanContact,
  arbitraryLoanEntry,
} from "../helpers/arbitraries";
import type { LoanEntry } from "../../types";

describe("Property 2: Contact Name Whitespace Validation", () => {
  it("rejects all-whitespace strings (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(" ", "  ", "\t", "\n", "\r\n", "   \t\n"),
        async (whitespace) => {
          const result = validateContactName(whitespace);
          expect(result).toBe("Nama tidak boleh kosong");
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 3: Contact Name Length Validation", () => {
  it("rejects strings longer than 100 characters (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 101, maxLength: 200 }),
        async (longName) => {
          const result = validateContactName(longName);
          expect(result).toBe("Nama maksimal 100 karakter");
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 5: Amount Lower Bound Validation", () => {
  it("rejects amounts <= 0 (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: -1_000_000, max: 0, noNaN: true }),
        async (amount) => {
          const result = validateAmount(amount);
          expect(result).toBe("Jumlah harus lebih dari 0");
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 6: Amount Upper Bound Validation", () => {
  it("rejects amounts > 999_999_999_999 (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 999_999_999_999.01, max: 1_000_000_000_000, noNaN: true }),
        async (amount) => {
          const result = validateAmount(amount);
          expect(result).toBe("Jumlah melebihi batas maksimum");
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 7: Loan Entry List Sorted by Date Descending", () => {
  it("sorted list is descending by date (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryLoanEntry, { minLength: 1, maxLength: 20 }),
        async (entries) => {
          const sorted = sortEntriesByDate(entries);
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].date >= sorted[i + 1].date).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("does not mutate the original array (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryLoanEntry, { minLength: 1, maxLength: 20 }),
        async (entries) => {
          const original = entries.map((e) => ({ ...e }));
          sortEntriesByDate(entries);
          for (let i = 0; i < entries.length; i++) {
            expect(entries[i].id).toBe(original[i].id);
            expect(entries[i].date).toBe(original[i].date);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 10: Contact Summary Calculation", () => {
  it("totalLend and totalBorrow are computed correctly (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryLoanEntry, { minLength: 0, maxLength: 30 }),
        async (entries) => {
          const summary = computeContactSummary(entries);

          let expectedLend = 0;
          let expectedBorrow = 0;
          let expectedHasActive = false;

          for (const entry of entries) {
            if (entry.status === "active") {
              expectedHasActive = true;
              if (entry.direction === "lend") {
                expectedLend += entry.amount;
              } else {
                expectedBorrow += entry.amount;
              }
            }
          }

          expect(summary.totalLend).toBe(expectedLend);
          expect(summary.totalBorrow).toBe(expectedBorrow);
          expect(summary.hasActiveEntries).toBe(expectedHasActive);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 11: Net Balance Label Correctness", () => {
  it("returns correct label for all combinations (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 999_999_999_999, noNaN: true }),
        fc.double({ min: 0, max: 999_999_999_999, noNaN: true }),
        async (lend, borrow) => {
          const label = getNetBalanceLabel(lend, borrow);
          if (lend > borrow) {
            expect(label).toBe("Kamu menagih");
          } else if (borrow > lend) {
            expect(label).toBe("Kamu berhutang");
          } else {
            expect(label).toBe("Lunas semua");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 12: Active Contacts Badge Count", () => {
  it("counts contacts with at least one active entry (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryLoanContact, { minLength: 0, maxLength: 10 }),
        fc.array(arbitraryLoanEntry, { minLength: 0, maxLength: 30 }),
        async (contacts, allEntries) => {
          const entriesByContact = new Map<string, LoanEntry[]>();
          for (const entry of allEntries) {
            const existing = entriesByContact.get(entry.contactId) || [];
            existing.push(entry);
            entriesByContact.set(entry.contactId, existing);
          }

          const result = countContactsWithActiveLoans(contacts, entriesByContact);

          let expected = 0;
          for (const contact of contacts) {
            const entries = entriesByContact.get(contact.id);
            if (entries && entries.some((e) => e.status === "active")) {
              expected++;
            }
          }

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
