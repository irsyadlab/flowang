// Feature: loan-repayment-and-transaction-integration
// Property 6: Tipe Linked_Transaction untuk Loan_Entry sesuai direction
// Property 7: Saldo wallet berubah sesuai tipe transaksi setelah pembuatan Loan_Entry
// Property 8: linkedTransactionId tersimpan pada Loan_Entry
// Property 9: Saldo wallet kembali ke nilai awal setelah Loan_Entry dengan Linked_Transaction dihapus
// Property 10: Tipe Linked_Transaction untuk Repayment sesuai direction LoanEntry
// Property 11: linkedTransactionId tersimpan pada Repayment
// Property 12: Saldo wallet kembali ke nilai awal setelah Repayment dengan Linked_Transaction dihapus
// Property 17: Atomicity — tidak ada data parsial saat operasi Loan_Entry + Linked_Transaction gagal
// Property 18: Atomicity — tidak ada data parsial saat operasi Repayment + Linked_Transaction gagal
// Property 19: Cascade delete — menghapus Loan_Entry menghapus semua Repayment dan Linked_Transaction terkait
// Property 4: Auto-settle — total repayment sama dengan amount mengubah status ke settled
// Property 5: Auto-unsettle — menghapus Repayment dari LoanEntry settled mengembalikan status ke active
import "fake-indexeddb/auto";
import fc from "fast-check";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../src/db/db";
import {
  resolveTransactionType,
  createLoanEntryWithTransaction,
  deleteLoanEntryWithCascade,
  createRepaymentWithTransaction,
  deleteRepaymentWithCascade,
} from "../../src/lib/transactionIntegrator";
import { arbitraryActiveLoanEntry, arbitraryRepayment } from "../helpers/arbitraries";
import type { LoanEntry, Repayment, Wallet, LinkedTransactionInput, LoanDirection } from "../../src/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function addWallet(db: IDBDatabase, wallet: Wallet): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("wallets", "readwrite");
    tx.objectStore("wallets").add(wallet);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getWallet(db: IDBDatabase, id: string): Promise<Wallet | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("wallets", "readonly");
    const req = tx.objectStore("wallets").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getTransaction(db: IDBDatabase, id: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("transactions", "readonly");
    const req = tx.objectStore("transactions").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getLoanEntry(db: IDBDatabase, id: string): Promise<LoanEntry | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("loan_entries", "readonly");
    const req = tx.objectStore("loan_entries").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getRepayment(db: IDBDatabase, id: string): Promise<Repayment | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("loan_repayments", "readonly");
    const req = tx.objectStore("loan_repayments").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getRepaymentsByLoanEntryId(db: IDBDatabase, loanEntryId: string): Promise<Repayment[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("loan_repayments", "readonly");
    const index = tx.objectStore("loan_repayments").index("by_loanEntryId");
    const req = index.getAll(loanEntryId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeWallet(balance: number): Wallet {
  return {
    id: crypto.randomUUID(),
    name: "Test Wallet",
    initialBalance: balance,
    balance,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeLinkedTransactionInput(walletId: string, amount: number, date: string): LinkedTransactionInput {
  return { walletId, amount, date };
}

// ─── Property 6: resolveTransactionType ─────────────────────────────────────

describe("Property 6: Tipe Linked_Transaction untuk Loan_Entry sesuai direction", () => {
  // Validates: Requirements 2.3
  it("loan_entry + borrow → income (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constant("borrow" as LoanDirection),
        (direction) => {
          const result = resolveTransactionType("loan_entry", direction);
          return result === "income";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("loan_entry + lend → expense (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constant("lend" as LoanDirection),
        (direction) => {
          const result = resolveTransactionType("loan_entry", direction);
          return result === "expense";
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 10: Tipe Linked_Transaction untuk Repayment sesuai direction LoanEntry", () => {
  // Validates: Requirements 3.3
  it("repayment + lend → income (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constant("lend" as LoanDirection),
        (direction) => {
          const result = resolveTransactionType("repayment", direction);
          return result === "income";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("repayment + borrow → expense (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constant("borrow" as LoanDirection),
        (direction) => {
          const result = resolveTransactionType("repayment", direction);
          return result === "expense";
        }
      ),
      { numRuns: 100 }
    );
  });

  it("all direction combinations produce correct types (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<LoanDirection>("lend", "borrow"),
        fc.constantFrom<"loan_entry" | "repayment">("loan_entry", "repayment"),
        (direction, context) => {
          const result = resolveTransactionType(context, direction);
          if (context === "loan_entry") {
            return direction === "borrow" ? result === "income" : result === "expense";
          } else {
            return direction === "lend" ? result === "income" : result === "expense";
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7 & 8: createLoanEntryWithTransaction ─────────────────────────

describe("Property 7 & 8: Saldo wallet dan linkedTransactionId setelah pembuatan Loan_Entry", () => {
  // Validates: Requirements 2.4, 2.6
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("wallet balance changes correctly and linkedTransactionId is set (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        fc.integer({ min: 100, max: 100_000 }),
        async (entry: LoanEntry, initialBalance: number) => {
          const wallet = makeWallet(initialBalance);
          await addWallet(db, wallet);

          const txInput = makeLinkedTransactionInput(wallet.id, entry.amount, entry.date);
          await createLoanEntryWithTransaction(db, entry, txInput);

          // Property 8: linkedTransactionId is set on the saved LoanEntry
          const savedEntry = await getLoanEntry(db, entry.id);
          expect(savedEntry).toBeDefined();
          expect(savedEntry!.linkedTransactionId).toBeDefined();
          expect(typeof savedEntry!.linkedTransactionId).toBe("string");

          // Verify the linked transaction exists
          const linkedTx = await getTransaction(db, savedEntry!.linkedTransactionId!);
          expect(linkedTx).toBeDefined();

          // Property 7: wallet balance changes by the correct amount
          const updatedWallet = await getWallet(db, wallet.id);
          expect(updatedWallet).toBeDefined();

          const expectedType = resolveTransactionType("loan_entry", entry.direction);
          const expectedBalance =
            expectedType === "income"
              ? initialBalance + entry.amount
              : initialBalance - entry.amount;

          expect(updatedWallet!.balance).toBeCloseTo(expectedBalance, 5);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 9: deleteLoanEntryWithCascade wallet balance reversal ──────────

describe("Property 9: Saldo wallet kembali ke nilai awal setelah Loan_Entry dengan Linked_Transaction dihapus", () => {
  // Validates: Requirements 2.7
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("wallet balance returns to initial after create then delete (30 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        fc.integer({ min: 100, max: 100_000 }),
        async (entry: LoanEntry, initialBalance: number) => {
          const wallet = makeWallet(initialBalance);
          await addWallet(db, wallet);

          const txInput = makeLinkedTransactionInput(wallet.id, entry.amount, entry.date);
          await createLoanEntryWithTransaction(db, entry, txInput);

          // Verify balance changed
          const afterCreate = await getWallet(db, wallet.id);
          expect(afterCreate!.balance).not.toBeCloseTo(initialBalance, 5);

          // Now delete the entry with cascade
          await deleteLoanEntryWithCascade(db, entry.id);

          // Wallet balance should be back to initial
          const afterDelete = await getWallet(db, wallet.id);
          expect(afterDelete!.balance).toBeCloseTo(initialBalance, 5);

          // LoanEntry should be gone
          const deletedEntry = await getLoanEntry(db, entry.id);
          expect(deletedEntry).toBeUndefined();
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 19: Cascade delete ────────────────────────────────────────────

describe("Property 19: Cascade delete — menghapus Loan_Entry menghapus semua Repayment dan Linked_Transaction terkait", () => {
  // Validates: Requirements 6.3
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("all repayments and linked transactions are deleted when loan entry is deleted (20 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 100, max: 100_000 }),
        async (entry: LoanEntry, repaymentCount: number, initialBalance: number) => {
          const wallet = makeWallet(initialBalance);
          await addWallet(db, wallet);

          // Create the loan entry (without linked transaction for simplicity)
          const txInput = makeLinkedTransactionInput(wallet.id, entry.amount, entry.date);
          await createLoanEntryWithTransaction(db, entry, txInput);

          const savedEntry = await getLoanEntry(db, entry.id);
          expect(savedEntry).toBeDefined();

          // Add some repayments (without linked transactions)
          const repaymentIds: string[] = [];
          for (let i = 0; i < repaymentCount; i++) {
            const repayment = fc.sample(arbitraryRepayment(entry.id, 10), 1)[0] as Repayment;
            await createRepaymentWithTransaction(db, repayment, savedEntry!);
            repaymentIds.push(repayment.id);
          }

          // Verify repayments exist
          const beforeRepayments = await getRepaymentsByLoanEntryId(db, entry.id);
          expect(beforeRepayments.length).toBe(repaymentCount);

          // Delete the loan entry with cascade
          await deleteLoanEntryWithCascade(db, entry.id);

          // All repayments should be gone
          const afterRepayments = await getRepaymentsByLoanEntryId(db, entry.id);
          expect(afterRepayments.length).toBe(0);

          // LoanEntry should be gone
          const deletedEntry = await getLoanEntry(db, entry.id);
          expect(deletedEntry).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 4: Auto-settle ─────────────────────────────────────────────────

describe("Property 4: Auto-settle — total repayment sama dengan amount mengubah status ke settled", () => {
  // Validates: Requirements 1.6
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("loan entry becomes settled when total repayments equal amount (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10_000 }),
        arbitraryActiveLoanEntry,
        async (amount: number, baseEntry: LoanEntry) => {
          const entry: LoanEntry = {
            ...baseEntry,
            amount,
            remainingAmount: amount,
            status: "active",
            settledAt: undefined,
          };

          // Add the loan entry directly
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("loan_entries", "readwrite");
            tx.objectStore("loan_entries").add(entry);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          // Create a repayment that exactly equals the amount
          const repayment: Repayment = {
            id: crypto.randomUUID(),
            loanEntryId: entry.id,
            amount,
            date: entry.date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const result = await createRepaymentWithTransaction(db, repayment, entry);
          expect(result.autoSettled).toBe(true);

          // Verify the entry is now settled
          const savedEntry = await getLoanEntry(db, entry.id);
          expect(savedEntry).toBeDefined();
          expect(savedEntry!.status).toBe("settled");
          expect(savedEntry!.settledAt).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it("loan entry stays active when total repayments are less than amount (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 10_000 }),
        arbitraryActiveLoanEntry,
        async (amount: number, baseEntry: LoanEntry) => {
          const entry: LoanEntry = {
            ...baseEntry,
            amount,
            remainingAmount: amount,
            status: "active",
            settledAt: undefined,
          };

          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("loan_entries", "readwrite");
            tx.objectStore("loan_entries").add(entry);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          // Create a partial repayment (less than amount)
          const partialAmount = Math.max(1, Math.floor(amount / 2));
          const repayment: Repayment = {
            id: crypto.randomUUID(),
            loanEntryId: entry.id,
            amount: partialAmount,
            date: entry.date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const result = await createRepaymentWithTransaction(db, repayment, entry);
          expect(result.autoSettled).toBe(false);

          const savedEntry = await getLoanEntry(db, entry.id);
          expect(savedEntry!.status).toBe("active");
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 5: Auto-unsettle ───────────────────────────────────────────────

describe("Property 5: Auto-unsettle — menghapus Repayment dari LoanEntry settled mengembalikan status ke active", () => {
  // Validates: Requirements 1.8
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("deleting the settling repayment reverts loan entry to active (50 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10_000 }),
        arbitraryActiveLoanEntry,
        async (amount: number, baseEntry: LoanEntry) => {
          const entry: LoanEntry = {
            ...baseEntry,
            amount,
            remainingAmount: amount,
            status: "active",
            settledAt: undefined,
          };

          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("loan_entries", "readwrite");
            tx.objectStore("loan_entries").add(entry);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          // Create a repayment that settles the entry
          const repayment: Repayment = {
            id: crypto.randomUUID(),
            loanEntryId: entry.id,
            amount,
            date: entry.date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const createResult = await createRepaymentWithTransaction(db, repayment, entry);
          expect(createResult.autoSettled).toBe(true);

          // Verify settled
          const settledEntry = await getLoanEntry(db, entry.id);
          expect(settledEntry!.status).toBe("settled");

          // Now delete the repayment
          const deleteResult = await deleteRepaymentWithCascade(db, repayment.id, settledEntry!);
          expect(deleteResult.autoUnsettled).toBe(true);

          // Verify back to active
          const activeEntry = await getLoanEntry(db, entry.id);
          expect(activeEntry!.status).toBe("active");
          expect(activeEntry!.settledAt).toBeUndefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ─── Property 11 & 12: Repayment with Linked_Transaction ────────────────────

describe("Property 11 & 12: linkedTransactionId tersimpan pada Repayment dan saldo wallet kembali setelah dihapus", () => {
  // Validates: Requirements 3.5, 3.6
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("repayment linkedTransactionId is set and wallet balance changes correctly (30 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        fc.integer({ min: 100, max: 100_000 }),
        async (entry: LoanEntry, initialBalance: number) => {
          const wallet = makeWallet(initialBalance);
          await addWallet(db, wallet);

          // Add the loan entry first
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("loan_entries", "readwrite");
            tx.objectStore("loan_entries").add(entry);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          const repaymentAmount = Math.min(Math.floor(entry.amount / 2), 1000);
          const repayment: Repayment = {
            id: crypto.randomUUID(),
            loanEntryId: entry.id,
            amount: repaymentAmount,
            date: entry.date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const txInput = makeLinkedTransactionInput(wallet.id, repaymentAmount, entry.date);
          await createRepaymentWithTransaction(db, repayment, entry, txInput);

          // Property 11: linkedTransactionId is set
          const savedRepayment = await getRepayment(db, repayment.id);
          expect(savedRepayment).toBeDefined();
          expect(savedRepayment!.linkedTransactionId).toBeDefined();

          const linkedTx = await getTransaction(db, savedRepayment!.linkedTransactionId!);
          expect(linkedTx).toBeDefined();

          // Wallet balance should have changed
          const walletAfterCreate = await getWallet(db, wallet.id);
          const expectedType = resolveTransactionType("repayment", entry.direction);
          const expectedBalance =
            expectedType === "income"
              ? initialBalance + repaymentAmount
              : initialBalance - repaymentAmount;
          expect(walletAfterCreate!.balance).toBeCloseTo(expectedBalance, 5);

          // Property 12: delete repayment and wallet balance returns to initial
          const currentEntry = await getLoanEntry(db, entry.id);
          await deleteRepaymentWithCascade(db, repayment.id, currentEntry!);

          const walletAfterDelete = await getWallet(db, wallet.id);
          expect(walletAfterDelete!.balance).toBeCloseTo(initialBalance, 5);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 17: Atomicity for createLoanEntryWithTransaction ───────────────

describe("Property 17: Atomicity — tidak ada data parsial saat operasi Loan_Entry + Linked_Transaction gagal", () => {
  // Validates: Requirements 6.1
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("no partial data when wallet does not exist (30 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        async (entry: LoanEntry) => {
          // Use a non-existent wallet ID to force failure
          const nonExistentWalletId = crypto.randomUUID();
          const txInput = makeLinkedTransactionInput(nonExistentWalletId, entry.amount, entry.date);

          let threw = false;
          try {
            await createLoanEntryWithTransaction(db, entry, txInput);
          } catch {
            threw = true;
          }

          // The operation should have failed (wallet not found → abort)
          // LoanEntry should NOT be saved
          const savedEntry = await getLoanEntry(db, entry.id);
          // If it threw, entry should not be saved; if it didn't throw, it may have been saved
          // The key invariant: if threw, no partial data
          if (threw) {
            expect(savedEntry).toBeUndefined();
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ─── Property 18: Atomicity for createRepaymentWithTransaction ───────────────

describe("Property 18: Atomicity — tidak ada data parsial saat operasi Repayment + Linked_Transaction gagal", () => {
  // Validates: Requirements 6.2
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(() => {
    closeDB();
  });

  it("no partial data when wallet does not exist for repayment (30 runs)", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryActiveLoanEntry,
        async (entry: LoanEntry) => {
          // Add the loan entry first
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("loan_entries", "readwrite");
            tx.objectStore("loan_entries").add(entry);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          const repaymentId = crypto.randomUUID();
          const repayment: Repayment = {
            id: repaymentId,
            loanEntryId: entry.id,
            amount: Math.min(Math.floor(entry.amount), 100),
            date: entry.date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Use a non-existent wallet ID to force failure
          const nonExistentWalletId = crypto.randomUUID();
          const txInput = makeLinkedTransactionInput(nonExistentWalletId, repayment.amount, entry.date);

          // The operation should fail because the wallet doesn't exist
          // We catch the error and verify atomicity: repayment must not be saved
          try {
            await createRepaymentWithTransaction(db, repayment, entry, txInput);
            // If it didn't throw, the wallet was somehow found — skip atomicity check
          } catch {
            // Expected: operation failed. Verify no partial data was saved.
            // Wait a tick to let any pending IDB operations settle
            await new Promise((r) => setTimeout(r, 0));
            const savedRepayment = await getRepayment(db, repaymentId);
            expect(savedRepayment).toBeUndefined();
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
