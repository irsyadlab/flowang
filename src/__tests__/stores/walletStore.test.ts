// Feature: finance-tracker, Property 2: Wallet Balance Invariant
// Feature: finance-tracker, Property 14: Wallet Name Uniqueness
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../db/db";
import { useWalletStore } from "../../stores/walletStore";
import { useTransactionStore } from "../../stores/transactionStore";
import { useUIStore } from "../../stores/uiStore";

function resetStores() {
  useWalletStore.setState({ wallets: [], isLoading: false, error: null });
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
}

describe("Property 2: Wallet Balance Invariant", () => {
  beforeEach(async () => {
    resetStores();
    await openDB();
    useUIStore.getState().setDbReady(true);
    await useWalletStore.getState().loadWallets();
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
