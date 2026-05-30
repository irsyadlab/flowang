// Feature: loan-tracker, Property 1: Contact Storage Round-Trip
// Feature: loan-tracker, Property 13: Delete Entry Removes Permanently
// Feature: loan-tracker, Property 14: Delete Contact Cascades to Entries
import "fake-indexeddb/auto";
import fc from "fast-check";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../src/db/db";
import * as loanContactDb from "../../src/db/loanContactDb";
import * as loanEntryDb from "../../src/db/loanEntryDb";
import { arbitraryLoanContact, arbitraryLoanEntry } from "../helpers/arbitraries";
import type { LoanContact, LoanEntry } from "../../src/types";

describe("Property 1: Contact Storage Round-Trip", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("contact round-trip: saved data matches input (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryLoanContact, async (contact: LoanContact) => {
        await loanContactDb.addContact(db, contact);
        const result = await loanContactDb.getContactById(db, contact.id);

        expect(result).toBeDefined();
        expect(result!.id).toBe(contact.id);
        expect(result!.name).toBe(contact.name);
        expect(result!.note).toBe(contact.note);
        expect(result!.createdAt).toBe(contact.createdAt);
        expect(result!.updatedAt).toBe(contact.updatedAt);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 13: Delete Contact Removes Permanently", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("after deleteContact, getContactById returns undefined (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryLoanContact, async (contact: LoanContact) => {
        await loanContactDb.addContact(db, contact);
        const before = await loanContactDb.getContactById(db, contact.id);
        expect(before).toBeDefined();

        await loanContactDb.deleteContact(db, contact.id);
        const after = await loanContactDb.getContactById(db, contact.id);
        expect(after).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 14: Delete Contact Cascades to Entries", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("after deleteContact, getEntriesByContactId returns empty array (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryLoanContact,
        fc.array(arbitraryLoanEntry, { minLength: 1, maxLength: 10 }),
        async (contact: LoanContact, entries: LoanEntry[]) => {
          await loanContactDb.addContact(db, contact);

          // Create entries linked to this contact
          for (const entry of entries) {
            const linked = { ...entry, contactId: contact.id };
            await loanEntryDb.addEntry(db, linked);
          }

          const before = await loanEntryDb.getEntriesByContactId(db, contact.id);
          expect(before.length).toBeGreaterThan(0);

          await loanContactDb.deleteContact(db, contact.id);

          const after = await loanEntryDb.getEntriesByContactId(db, contact.id);
          expect(after).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
