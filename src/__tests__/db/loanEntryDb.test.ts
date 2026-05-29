// Feature: loan-tracker, Property 4: Loan Entry Storage Round-Trip
// Feature: loan-tracker, Property 8: Mark Settled Toggle Round-Trip
// Feature: loan-tracker, Property 9: Mark All Settled Bulk Operation
// Feature: loan-tracker, Property 13: Delete Entry Removes Permanently
import "fake-indexeddb/auto";
import fc from "fast-check";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../db/db";
import * as loanEntryDb from "../../db/loanEntryDb";
import { arbitraryLoanEntry } from "../helpers/arbitraries";
import type { LoanEntry } from "../../types";

describe("Property 4: Loan Entry Storage Round-Trip", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("entry round-trip: saved data matches input with status active (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryLoanEntry, async (entry: LoanEntry) => {
        // Force status to active for round-trip test
        const activeEntry = { ...entry, status: "active" as const, settledAt: undefined };
        await loanEntryDb.addEntry(db, activeEntry);
        const result = await loanEntryDb.getEntryById(db, activeEntry.id);

        expect(result).toBeDefined();
        expect(result!.id).toBe(activeEntry.id);
        expect(result!.contactId).toBe(activeEntry.contactId);
        expect(result!.amount).toBe(activeEntry.amount);
        expect(result!.direction).toBe(activeEntry.direction);
        expect(result!.status).toBe("active");
        expect(result!.date).toBe(activeEntry.date);
        expect(result!.note).toBe(activeEntry.note);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 8: Mark Settled Toggle Round-Trip", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("toggle twice returns to original status (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryLoanEntry, async (entry: LoanEntry) => {
        // Start with active
        const activeEntry = { ...entry, status: "active" as const, settledAt: undefined };
        await loanEntryDb.addEntry(db, activeEntry);

        // First toggle: active → settled
        const afterFirst = await loanEntryDb.toggleEntryStatus(db, activeEntry.id);
        expect(afterFirst.status).toBe("settled");
        expect(afterFirst.settledAt).toBeDefined();

        // Second toggle: settled → active
        const afterSecond = await loanEntryDb.toggleEntryStatus(db, activeEntry.id);
        expect(afterSecond.status).toBe("active");
        expect(afterSecond.settledAt).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 9: Mark All Settled Bulk Operation", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("markAllSettled makes all entries settled (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(arbitraryLoanEntry, { minLength: 1, maxLength: 15 }),
        async (contactId: string, entries: LoanEntry[]) => {
          const contactEntries = entries.map((e) => ({
            ...e,
            contactId,
            // Mix of active and settled
            status: e.status,
          }));

          for (const entry of contactEntries) {
            await loanEntryDb.addEntry(db, entry);
          }

          await loanEntryDb.markAllSettled(db, contactId);

          const result = await loanEntryDb.getEntriesByContactId(db, contactId);
          const allSettled = result.every((e) => e.status === "settled");
          expect(allSettled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 13: Delete Entry Removes Permanently", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("after deleteEntry, getEntryById returns undefined (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryLoanEntry, async (entry: LoanEntry) => {
        await loanEntryDb.addEntry(db, entry);
        const before = await loanEntryDb.getEntryById(db, entry.id);
        expect(before).toBeDefined();

        await loanEntryDb.deleteEntry(db, entry.id);
        const after = await loanEntryDb.getEntryById(db, entry.id);
        expect(after).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
