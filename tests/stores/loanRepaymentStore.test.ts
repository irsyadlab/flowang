import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB, getDB } from "../../src/db/db";
import { useLoanRepaymentStore } from "../../src/stores/loanRepaymentStore";
import { useLoanEntryStore } from "../../src/stores/loanEntryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import type { LoanEntry } from "../../src/types";

function resetStores() {
  useLoanRepaymentStore.setState({ repayments: [], isLoading: false, error: null });
  useLoanEntryStore.setState({ entries: [], isLoading: false, error: null });
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

describe("loanRepaymentStore", () => {
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

  describe("loadRepayments", () => {
    it("loads repayments from DB", async () => {
      const db = getDB()!;
      const entry = makeEntry();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      const repayment = {
        id: crypto.randomUUID(),
        loanEntryId: entry.id,
        amount: 50000,
        date: "2025-01-20",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_repayments", "readwrite");
        tx.objectStore("loan_repayments").add(repayment);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      await useLoanRepaymentStore.getState().loadRepayments();
      expect(useLoanRepaymentStore.getState().repayments.length).toBe(1);
      expect(useLoanRepaymentStore.getState().repayments[0].id).toBe(repayment.id);
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanRepaymentStore.getState().loadRepayments();
      expect(useLoanRepaymentStore.getState().repayments.length).toBe(0);
    });
  });

  describe("addRepayment", () => {
    it("adds a repayment for a loan entry", async () => {
      const db = getDB()!;
      const entry = makeEntry({ amount: 100000, remainingAmount: 100000 });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await useLoanEntryStore.getState().loadEntries();

      await useLoanRepaymentStore.getState().addRepayment(
        {
          loanEntryId: entry.id,
          amount: 30000,
          date: "2025-01-20",
          createTransaction: false,
        },
        entry
      );

      expect(useLoanRepaymentStore.getState().repayments.length).toBe(1);
      expect(useLoanRepaymentStore.getState().repayments[0].amount).toBe(30000);
    });

    it("rejects repayment exceeding remaining amount", async () => {
      const entry = makeEntry({ amount: 100, remainingAmount: 100 });

      await useLoanRepaymentStore.getState().addRepayment(
        {
          loanEntryId: entry.id,
          amount: 200,
          date: "2025-01-20",
          createTransaction: false,
        },
        entry
      );

      expect(useLoanRepaymentStore.getState().error).toContain("melebihi");
      expect(useLoanRepaymentStore.getState().repayments.length).toBe(0);
    });

    it("rejects non-positive amount", async () => {
      const entry = makeEntry({ amount: 100, remainingAmount: 100 });

      await useLoanRepaymentStore.getState().addRepayment(
        {
          loanEntryId: entry.id,
          amount: 0,
          date: "2025-01-20",
          createTransaction: false,
        },
        entry
      );

      expect(useLoanRepaymentStore.getState().error).toContain("lebih dari 0");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      const entry = makeEntry();
      await useLoanRepaymentStore.getState().addRepayment(
        { loanEntryId: entry.id, amount: 50, date: "2025-01-20", createTransaction: false },
        entry
      );
      expect(useLoanRepaymentStore.getState().repayments.length).toBe(0);
    });
  });

  describe("deleteRepayment", () => {
    it("deletes a repayment", async () => {
      const db = getDB()!;
      const entry = makeEntry({ amount: 100000, remainingAmount: 100000 });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("loan_entries", "readwrite");
        tx.objectStore("loan_entries").add(entry);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await useLoanEntryStore.getState().loadEntries();

      await useLoanRepaymentStore.getState().addRepayment(
        { loanEntryId: entry.id, amount: 30000, date: "2025-01-20", createTransaction: false },
        entry
      );
      const repaymentId = useLoanRepaymentStore.getState().repayments[0].id;

      await useLoanRepaymentStore.getState().deleteRepayment(repaymentId, entry);
      expect(useLoanRepaymentStore.getState().repayments.length).toBe(0);
    });
  });
});
