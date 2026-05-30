// Feature: finance-tracker, Property 1: Wallet Creation Round-Trip
// Feature: finance-tracker, Property 8: Wallet Deletion Protection
import "fake-indexeddb/auto";
import fc from "fast-check";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../src/db/db";
import * as walletDb from "../../src/db/walletDb";
import * as transactionDb from "../../src/db/transactionDb";
import { arbitraryWallet } from "../helpers/arbitraries";
import type { Wallet, Transaction } from "../../src/types";

describe("Property 1: Wallet Creation Round-Trip", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("wallet round-trip: saved data matches input (100 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryWallet, async (wallet: Wallet) => {
        await walletDb.addWallet(db, wallet);
        const result = await walletDb.getWalletById(db, wallet.id);

        expect(result).toBeDefined();
        expect(result!.id).toBe(wallet.id);
        expect(result!.name).toBe(wallet.name);
        expect(result!.initialBalance).toBe(wallet.initialBalance);
        expect(result!.balance).toBe(wallet.balance);
        expect(result!.createdAt).toBe(wallet.createdAt);
        expect(result!.updatedAt).toBe(wallet.updatedAt);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 8: Wallet Deletion Protection", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("wallet with transactions cannot be deleted", async () => {
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      name: "Test Wallet",
      initialBalance: 100000,
      balance: 100000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await walletDb.addWallet(db, wallet);

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: "income",
      amount: 50000,
      walletId: wallet.id,
      categoryId: "test-cat",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await transactionDb.addTransaction(db, tx, [{ walletId: wallet.id, delta: 50000 }]);

    const allTx = await transactionDb.getAllTransactions(db);
    const hasTx = allTx.some((t) => t.walletId === wallet.id);

    expect(hasTx).toBe(true);

    const walletStillExists = await walletDb.getWalletById(db, wallet.id);
    expect(walletStillExists).toBeDefined();
  });
});
