import fc from "fast-check";
import type { TransactionType, CategoryType, LoanDirection, LoanStatus } from "../../src/types";

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

// Loan Tracker arbitraries
export const arbitraryLoanDirection = fc.constantFrom<LoanDirection>("lend", "borrow");
export const arbitraryLoanStatus = fc.constantFrom<LoanStatus>("active", "settled");

export const arbitraryLoanContact = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  note: fc.option(fc.string(), { nil: undefined }),
  createdAt: safeDateStr(),
  updatedAt: safeDateStr(),
});

const safeDateOnlyStr = () =>
  fc
    .tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(
      ([y, m, d]) =>
        `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );

export const arbitraryLoanEntry = fc.record({
  id: fc.uuid(),
  contactId: fc.uuid(),
  amount: fc.double({ min: 0.01, max: 999_999_999_999, noNaN: true }),
  direction: arbitraryLoanDirection,
  status: arbitraryLoanStatus,
  date: safeDateOnlyStr(),
  note: fc.option(fc.string(), { nil: undefined }),
  settledAt: fc.option(safeDateStr(), { nil: undefined }),
  createdAt: safeDateStr(),
  updatedAt: safeDateStr(),
  remainingAmount: fc.double({ min: 0, max: 999_999_999_999, noNaN: true }),
  categoryId: fc.option(fc.uuid(), { nil: undefined }),
  linkedTransactionId: fc.option(fc.uuid(), { nil: undefined }),
});

/** Active LoanEntry with integer amount for precise repayment math */
export const arbitraryActiveLoanEntry = fc.record({
  id: fc.uuid(),
  contactId: fc.uuid(),
  amount: fc.integer({ min: 1, max: 999_999_999 }),
  direction: arbitraryLoanDirection,
  status: fc.constant<LoanStatus>("active"),
  date: safeDateOnlyStr(),
  note: fc.option(fc.string(), { nil: undefined }),
  settledAt: fc.constant(undefined),
  createdAt: safeDateStr(),
  updatedAt: safeDateStr(),
  remainingAmount: fc.integer({ min: 1, max: 999_999_999 }),
  categoryId: fc.constant(undefined),
  linkedTransactionId: fc.constant(undefined),
});

export const arbitraryRepayment = (loanEntryId: string, maxAmount: number) =>
  fc.record({
    id: fc.uuid(),
    loanEntryId: fc.constant(loanEntryId),
    amount: fc.integer({ min: 1, max: Math.max(1, Math.floor(maxAmount)) }),
    date: safeDateOnlyStr(),
    note: fc.option(fc.string(), { nil: undefined }),
    categoryId: fc.constant(undefined),
    linkedTransactionId: fc.constant(undefined),
    createdAt: safeDateStr(),
    updatedAt: safeDateStr(),
  });
