import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB, getDB } from "../../src/db/db";
import { useLoanEntryStore } from "../../src/stores/loanEntryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import * as loanEntryDb from "../../src/db/loanEntryDb";
import * as walletDb from "../../src/db/walletDb";
import type { LoanEntry, Wallet } from "../../src/types";

function resetStores() {
  useLoanEntryStore.setState({ entries: [], isLoading: false, error: null });
}

function getAllRecords<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/** Wallet dibutuhkan integrator untuk menulis transaksi linked. */
async function seedWallet(): Promise<Wallet> {
  const now = new Date().toISOString();
  const wallet: Wallet = {
    id: crypto.randomUUID(),
    name: "Dompet Test",
    initialBalance: 1_000_000,
    balance: 1_000_000,
    createdAt: now,
    updatedAt: now,
  };
  await walletDb.addWallet(getDB()!, wallet);
  return wallet;
}

function makeEntry(overrides: Partial<LoanEntry> = {}): LoanEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    contactId: crypto.randomUUID(),
    amount: 100000,
    direction: "lend",
    status: "active",
    date: "2025-01-15",
    remainingAmount: 100000,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("loanEntryStore", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  describe("loadEntries", () => {
    it("loads entries from DB", async () => {
      const db = getDB()!;
      const entry = makeEntry();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      await useLoanEntryStore.getState().loadEntries();
      expect(useLoanEntryStore.getState().entries.length).toBe(1);
      expect(useLoanEntryStore.getState().entries[0].id).toBe(entry.id);
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanEntryStore.getState().loadEntries();
      expect(useLoanEntryStore.getState().entries.length).toBe(0);
    });
  });

  describe("addEntry", () => {
    it("adds an entry without transaction", async () => {
      const contactId = crypto.randomUUID();
      await useLoanEntryStore.getState().addEntry({
        contactId,
        amount: 50000,
        direction: "borrow",
        date: "2025-01-20",
        createTransaction: false,
      });

      const entries = useLoanEntryStore.getState().entries;
      expect(entries.length).toBe(1);
      expect(entries[0].contactId).toBe(contactId);
      expect(entries[0].amount).toBe(50000);
      expect(entries[0].direction).toBe("borrow");
      expect(entries[0].status).toBe("active");
      expect(entries[0].remainingAmount).toBe(50000);
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanEntryStore.getState().addEntry({
        contactId: crypto.randomUUID(),
        amount: 100,
        direction: "lend",
        date: "2025-01-01",
        createTransaction: false,
      });
      expect(useLoanEntryStore.getState().entries.length).toBe(0);
    });

    /**
     * Regression: `linkedTransactionId` di-generate di dalam
     * createLoanEntryWithTransaction, jadi objek entry milik store tidak
     * memilikinya. Dulu store menyimpan objek input-nya ke state, sehingga
     * entry di memori kehilangan `linkedTransactionId` — dan `updateEntry`
     * berikutnya menulis `undefined` itu ke IndexedDB, meng-orphan transaksi
     * linked-nya secara permanen.
     */
    it("menyimpan linkedTransactionId ke state saat createTransaction aktif", async () => {
      const db = getDB()!;
      const wallet = await seedWallet();

      await useLoanEntryStore.getState().addEntry({
        contactId: crypto.randomUUID(),
        amount: 50000,
        direction: "borrow",
        date: "2025-01-20",
        createTransaction: true,
        walletId: wallet.id,
      });

      const stateEntry = useLoanEntryStore.getState().entries[0];
      expect(stateEntry.linkedTransactionId).toBeDefined();

      // Harus menunjuk ke transaksi yang benar-benar dibuat
      const transactions = await getAllRecords<{ id: string }>(db, "transactions");
      expect(transactions.map((t) => t.id)).toContain(stateEntry.linkedTransactionId!);

      // Dan harus cocok dengan yang tersimpan di IndexedDB
      const stored = await loanEntryDb.getEntryById(db, stateEntry.id);
      expect(stored!.linkedTransactionId).toBe(stateEntry.linkedTransactionId!);
    });

    it("updateEntry berikutnya tidak menghilangkan linkedTransactionId", async () => {
      const db = getDB()!;
      const wallet = await seedWallet();

      await useLoanEntryStore.getState().addEntry({
        contactId: crypto.randomUUID(),
        amount: 50000,
        direction: "borrow",
        date: "2025-01-20",
        createTransaction: true,
        walletId: wallet.id,
      });

      const entryId = useLoanEntryStore.getState().entries[0].id;

      // Nilai harapan diambil dari IndexedDB, BUKAN dari state store — state
      // itulah yang sedang diuji. Kalau harapannya dibaca dari state yang rusak,
      // assertion-nya jadi `undefined === undefined` dan bug-nya lolos.
      const linkedId = (await loanEntryDb.getEntryById(db, entryId))!.linkedTransactionId;
      expect(linkedId).toBeDefined();

      // updateEntry membangun objek baru dari state in-memory — kalau state-nya
      // kehilangan linkedTransactionId, tautan ke transaksi ikut terhapus di DB.
      await useLoanEntryStore.getState().updateEntry(entryId, { note: "diubah" });

      const stored = await loanEntryDb.getEntryById(db, entryId);
      expect(stored!.note).toBe("diubah");
      expect(stored!.linkedTransactionId).toBe(linkedId!);
    });
  });

  describe("updateEntry", () => {
    it("updates entry data", async () => {
      const db = getDB()!;
      const entry = makeEntry();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await useLoanEntryStore.getState().loadEntries();

      await useLoanEntryStore.getState().updateEntry(entry.id, { note: "Updated note" });
      expect(useLoanEntryStore.getState().entries[0].note).toBe("Updated note");
    });

    it("sets error when entry not found", async () => {
      await useLoanEntryStore.getState().updateEntry("nonexistent", { note: "test" });
      expect(useLoanEntryStore.getState().error).toContain("not found");
    });
  });

  describe("deleteEntry", () => {
    it("deletes an entry", async () => {
      const db = getDB()!;
      const entry = makeEntry();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await useLoanEntryStore.getState().loadEntries();

      await useLoanEntryStore.getState().deleteEntry(entry.id);
      expect(useLoanEntryStore.getState().entries.length).toBe(0);
    });
  });

  describe("toggleEntryStatus", () => {
    it("toggles active to settled", async () => {
      const db = getDB()!;
      const entry = makeEntry({ status: "active" });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await useLoanEntryStore.getState().loadEntries();

      await useLoanEntryStore.getState().toggleEntryStatus(entry.id);
      expect(useLoanEntryStore.getState().entries[0].status).toBe("settled");
    });
  });

  describe("markAllSettled", () => {
    it("settles all active entries for a contact", async () => {
      const db = getDB()!;
      const contactId = crypto.randomUUID();
      const entry1 = makeEntry({ contactId, status: "active" });
      const entry2 = makeEntry({ contactId, status: "active" });

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry1);
        tx.objectStore("loan_entries").add(entry2);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await useLoanEntryStore.getState().loadEntries();

      await useLoanEntryStore.getState().markAllSettled(contactId);
      const entries = useLoanEntryStore.getState().entries;
      expect(entries.every((e) => e.status === "settled")).toBe(true);
    });
  });
});
