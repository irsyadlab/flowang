import fc from "fast-check";
import type { TransactionType, CategoryType } from "../../types";

const safeDateStr = () =>
  fc
    .tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(
      ([y, m, d]) =>
        `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00.000Z`
    );

export const arbitraryWallet = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  initialBalance: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
  balance: fc.double({ min: 0, max: 1_000_000, noNaN: true }),
  createdAt: safeDateStr(),
  updatedAt: safeDateStr(),
});

export const arbitraryCategory = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom<CategoryType>("income", "expense", "both"),
  isDefault: fc.boolean(),
  createdAt: safeDateStr(),
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
    .tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(
      ([y, m, d]) =>
        `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    ),
  note: fc.option(fc.string(), { nil: undefined }),
  createdAt: safeDateStr(),
  updatedAt: safeDateStr(),
});
