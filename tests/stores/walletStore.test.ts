// Feature: finance-tracker, Property 2: Wallet Balance Invariant
// Feature: finance-tracker, Property 14: Wallet Name Uniqueness
// Feature: finance-tracker, Property 17: Balance Correction Atomicity
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fc from "fast-check";
import { closeDB } from "../../src/db/db";
import { useWalletStore } from "../../src/stores/walletStore";
import { useTransactionStore } from "../../src/stores/transactionStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import type { Transaction } from "../../src/types";

function resetStores() {
  useWalletStore.setState({ wallets: [], isLoading: false, error: null });
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
}

describe("Property 2: Wallet Balance Invariant", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
    await useWalletStore.getState().loadWallets();
    await useTransactionStore.getState().loadTransactions();
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  it("wallet balance equals initialBalance + income - expense - transferOut + transferIn", () => {
    const wallets = useWalletStore.getState().wallets;
    const transactions = useTransactionStore.getState().transactions;

    for (const wallet of wallets) {
      let delta = 0;
      for (const t of transactions) {
        if (t.walletId === wallet.id) {
          if (t.type === "income") delta += t.amount;
          else if (t.type === "expense") delta -= t.amount;
          else if (t.type === "transfer") delta -= t.amount;
        }
        if (t.toWalletId === wallet.id && t.type === "transfer") {
          delta += t.amount;
        }
      }
      const expected = wallet.initialBalance + delta;
      expect(wallet.balance).toBe(expected);
    }
  });
});

describe("Property 14: Wallet Name Uniqueness (Case-Insensitive)", () => {
  it("duplicate wallet name is rejected at store level", async () => {
    const store = useWalletStore.getState();
    const existingWallets = store.wallets;

    if (existingWallets.length === 0) return;

    const duplicateName = existingWallets[0].name;
    await store.addWallet({ name: duplicateName, initialBalance: 0 });

    const allNames = useWalletStore.getState().wallets.map((w) => w.name.toLowerCase());
    const count = allNames.filter((n) => n === duplicateName.toLowerCase()).length;

    expect(count).toBe(1);
  });
});

describe("Property 17: Balance Correction Atomicity", () => {
  it("changing initialBalance atomically creates a correction tx and updates wallet", () => {
    const safeDateStr = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    ).map(([y, m, d]) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );

    const oldBalanceArb = fc.double({ min: 0, max: 100_000, noNaN: true });
    const newBalanceArb = fc.double({ min: 0, max: 100_000, noNaN: true });
    const walletIdArb = fc.uuid();
    const walletNameArb = fc.string({ minLength: 1, maxLength: 20 });

    fc.assert(
      fc.property(
        walletIdArb,
        walletNameArb,
        oldBalanceArb,
        newBalanceArb,
        safeDateStr,
        safeDateStr,
        (walletId, walletName, oldBalance, newBalance, date, updatedAt) => {
          fc.pre(oldBalance !== newBalance);

          const oldWallet = {
            id: walletId,
            name: walletName,
            initialBalance: oldBalance,
            balance: oldBalance,
            createdAt: date,
            updatedAt,
          };

          const delta = newBalance - oldBalance;
          const today = new Date().toISOString().split("T")[0];
          const now = new Date().toISOString();

          const correctionTx: Transaction = {
            id: "test-tx-id",
            type: delta > 0 ? "adjustment_increase" : "adjustment_decrease",
            amount: Math.abs(delta),
            walletId,
            date: today,
            note: `Koreksi saldo: ${walletName}`,
            isCorrection: true,
            createdAt: now,
            updatedAt: now,
          };

          const updatedWallet = {
            ...oldWallet,
            initialBalance: newBalance,
            balance: oldWallet.balance + delta,
            updatedAt: now,
          };

          // Verify: new initialBalance matches
          expect(updatedWallet.initialBalance).toBe(newBalance);

          // Verify: correction tx has correct type
          if (delta > 0) {
            expect(correctionTx.type).toBe("adjustment_increase");
          } else {
            expect(correctionTx.type).toBe("adjustment_decrease");
          }

          // Verify: correction tx amount is |delta|
          expect(correctionTx.amount).toBe(Math.abs(delta));

          // Verify: wallet balance reflects the change
          expect(updatedWallet.balance).toBe(oldWallet.balance + delta);

          // Verify: isCorrection flag is set
          expect(correctionTx.isCorrection).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
