import { describe, it, expect } from "bun:test";
import {
  walletSchema,
  walletEditSchema,
  categorySchema,
  transactionSchema,
} from "../../src/lib/validators";

describe("walletSchema", () => {
  it("accepts valid wallet input", () => {
    const result = walletSchema.safeParse({ name: "BCA", initialBalance: 100000 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = walletSchema.safeParse({ name: "", initialBalance: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects name > 50 chars", () => {
    const result = walletSchema.safeParse({ name: "A".repeat(51), initialBalance: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative initialBalance", () => {
    const result = walletSchema.safeParse({ name: "Test", initialBalance: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero initialBalance", () => {
    const result = walletSchema.safeParse({ name: "Test", initialBalance: 0 });
    expect(result.success).toBe(true);
  });
});

describe("walletEditSchema", () => {
  it("accepts valid edit input", () => {
    const result = walletEditSchema.safeParse({ name: "BCA", balance: 50000 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = walletEditSchema.safeParse({ name: "", balance: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative balance", () => {
    const result = walletEditSchema.safeParse({ name: "Test", balance: -100 });
    expect(result.success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts valid category", () => {
    const result = categorySchema.safeParse({ name: "Makan", type: "expense" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid types", () => {
    for (const type of ["income", "expense", "both"]) {
      expect(categorySchema.safeParse({ name: "Test", type }).success).toBe(true);
    }
  });

  it("rejects empty name", () => {
    expect(categorySchema.safeParse({ name: "", type: "expense" }).success).toBe(false);
  });

  it("rejects name > 50 chars", () => {
    expect(categorySchema.safeParse({ name: "A".repeat(51), type: "expense" }).success).toBe(false);
  });

  it("rejects invalid type", () => {
    expect(categorySchema.safeParse({ name: "Test", type: "invalid" }).success).toBe(false);
  });
});

describe("transactionSchema", () => {
  describe("income/expense", () => {
    it("accepts valid income transaction", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 100000,
        walletId: "w1",
        categoryId: "c1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid expense transaction", () => {
      const result = transactionSchema.safeParse({
        type: "expense",
        amount: 50000,
        walletId: "w1",
        categoryId: "c1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("requires categoryId for income", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 100,
        walletId: "w1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("categoryId");
      }
    });

    it("requires categoryId for expense", () => {
      const result = transactionSchema.safeParse({
        type: "expense",
        amount: 100,
        walletId: "w1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("transfer", () => {
    it("accepts valid transfer", () => {
      const result = transactionSchema.safeParse({
        type: "transfer",
        amount: 100000,
        walletId: "w1",
        toWalletId: "w2",
        date: "2025-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("requires toWalletId for transfer", () => {
      const result = transactionSchema.safeParse({
        type: "transfer",
        amount: 100,
        walletId: "w1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("toWalletId");
      }
    });

    it("rejects same source and destination wallet", () => {
      const result = transactionSchema.safeParse({
        type: "transfer",
        amount: 100,
        walletId: "w1",
        toWalletId: "w1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("common validations", () => {
    it("rejects zero amount", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 0,
        walletId: "w1",
        categoryId: "c1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects amount > 999_999_999_999", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 1_000_000_000_000,
        walletId: "w1",
        categoryId: "c1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty walletId", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 100,
        walletId: "",
        categoryId: "c1",
        date: "2025-01-15",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty date", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 100,
        walletId: "w1",
        categoryId: "c1",
        date: "",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional fields", () => {
      const result = transactionSchema.safeParse({
        type: "income",
        amount: 100,
        walletId: "w1",
        categoryId: "c1",
        date: "2025-01-15",
        time: "14:30",
        note: "Test note",
      });
      expect(result.success).toBe(true);
    });
  });
});
