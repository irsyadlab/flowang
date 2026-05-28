import fc from "fast-check";
import type { TransactionType, CategoryType } from "../../types";

const safeDate = () =>
  fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }).map((d) => d.toISOString());

export const arbitraryWallet = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  initialBalance: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
  balance: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
  createdAt: safeDate(),
  updatedAt: safeDate(),
});

export const arbitraryCategory = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom<CategoryType>("income", "expense", "both"),
  isDefault: fc.boolean(),
  createdAt: safeDate(),
});

export const arbitraryTransactionType = fc.constantFrom<TransactionType>("income", "expense", "transfer");

export const arbitraryTransaction = fc.record({
  id: fc.uuid(),
  type: arbitraryTransactionType,
  amount: fc.double({ min: 0.01, max: 999_999_999, noNaN: true }),
  walletId: fc.uuid(),
  toWalletId: fc.option(fc.uuid(), { nil: undefined }),
  categoryId: fc.option(fc.uuid(), { nil: undefined }),
  date: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
    .map((d) => d.toISOString().split("T")[0]),
  note: fc.option(fc.string(), { nil: undefined }),
  createdAt: safeDate(),
  updatedAt: safeDate(),
});
