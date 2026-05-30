// Feature: finance-tracker, Property 7: Transaction Storage Round-Trip
import "fake-indexeddb/auto";
import fc from "fast-check";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../src/db/db";
import * as transactionDb from "../../src/db/transactionDb";
import { arbitraryTransaction } from "../helpers/arbitraries";
import type { Transaction } from "../../src/types";

describe("Property 7: Transaction Storage Round-Trip", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("transaction round-trip: saved data matches input (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryTransaction, async (transaction: Transaction) => {
        await transactionDb.addTransaction(db, transaction, []);
        const result = await transactionDb.getTransactionById(db, transaction.id);

        expect(result).toBeDefined();
        expect(result!.id).toBe(transaction.id);
        expect(result!.type).toBe(transaction.type);
        expect(result!.amount).toBe(transaction.amount);
        expect(result!.walletId).toBe(transaction.walletId);
        expect(result!.date).toBe(transaction.date);
        expect(result!.note).toBe(transaction.note);
        expect(result!.createdAt).toBe(transaction.createdAt);
        expect(result!.updatedAt).toBe(transaction.updatedAt);
      }),
      { numRuns: 100 }
    );
  });
});
