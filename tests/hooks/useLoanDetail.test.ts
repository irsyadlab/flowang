import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useLoanContactStore } from "../../src/stores/loanContactStore";
import { useLoanEntryStore } from "../../src/stores/loanEntryStore";
import { useLoanRepaymentStore } from "../../src/stores/loanRepaymentStore";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook } from "@testing-library/react";
import type { LoanEntry, Repayment, Category } from "../../src/types";

const mockNavigate = mock(() => {});
const mockContactId = "contact-1";

mock.module("react-router-dom", () => ({
  useParams: () => ({ contactId: mockContactId }),
  useNavigate: () => mockNavigate,
}));

const { useLoanDetail } = await import("../../src/hooks/useLoanDetail");

function resetStores() {
  useLoanContactStore.setState({ contacts: [], isLoading: false, error: null });
  useLoanEntryStore.setState({ entries: [], isLoading: false, error: null });
  useLoanRepaymentStore.setState({ repayments: [], isLoading: false, error: null });
  useCategoryStore.setState({ categories: [], isLoading: false, error: null });
}

const now = new Date().toISOString();

function makeEntry(overrides: Partial<LoanEntry> = {}): LoanEntry {
  return {
    id: crypto.randomUUID(),
    contactId: mockContactId,
    amount: 100,
    direction: "lend",
    status: "active",
    date: "2025-01-15",
    remainingAmount: 100,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeRepayment(overrides: Partial<Repayment> = {}): Repayment {
  return {
    id: crypto.randomUUID(),
    loanEntryId: "entry-1",
    amount: 50,
    date: "2025-01-20",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat-1",
    name: "Makan",
    type: "expense",
    isDefault: false,
    createdAt: now,
    ...overrides,
  };
}

describe("useLoanDetail", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  it("returns contactId from params", () => {
    useLoanContactStore.setState({
      contacts: [{ id: mockContactId, name: "Alice", createdAt: now, updatedAt: now }],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.contactId).toBe(mockContactId);
  });

  it("finds the matching contact", () => {
    useLoanContactStore.setState({
      contacts: [
        { id: "other", name: "Bob", createdAt: now, updatedAt: now },
        { id: mockContactId, name: "Alice", createdAt: now, updatedAt: now },
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.contact).toBeDefined();
    expect(result.current.contact!.name).toBe("Alice");
  });

  it("returns undefined contact when not found", () => {
    useLoanContactStore.setState({ contacts: [] });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.contact).toBeUndefined();
  });

  it("filters contactEntries by contactId", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "e1", contactId: mockContactId }),
        makeEntry({ id: "e2", contactId: "other-contact" }),
        makeEntry({ id: "e3", contactId: mockContactId }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.contactEntries.length).toBe(2);
    expect(result.current.contactEntries.every((e) => e.contactId === mockContactId)).toBe(true);
  });

  it("returns sortedEntries in descending date order", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "e1", date: "2025-01-01" }),
        makeEntry({ id: "e2", date: "2025-03-01" }),
        makeEntry({ id: "e3", date: "2025-02-01" }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.sortedEntries[0].date).toBe("2025-03-01");
    expect(result.current.sortedEntries[1].date).toBe("2025-02-01");
    expect(result.current.sortedEntries[2].date).toBe("2025-01-01");
  });

  it("hasActiveEntries is true when at least one entry is active", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "e1", status: "settled" }),
        makeEntry({ id: "e2", status: "active" }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.hasActiveEntries).toBe(true);
  });

  it("hasActiveEntries is false when all entries are settled", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "e1", status: "settled" }),
        makeEntry({ id: "e2", status: "settled" }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.hasActiveEntries).toBe(false);
  });

  it("hasActiveEntries is false when no entries", () => {
    useLoanEntryStore.setState({ entries: [] });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.hasActiveEntries).toBe(false);
  });

  it("calculates totalLend from active lend entries", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "e1", direction: "lend", amount: 200, status: "active" }),
        makeEntry({ id: "e2", direction: "lend", amount: 300, status: "active" }),
        makeEntry({ id: "e3", direction: "lend", amount: 100, status: "settled" }),
        makeEntry({ id: "e4", direction: "borrow", amount: 500, status: "active" }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.totalLend).toBe(500);
  });

  it("calculates totalBorrow from active borrow entries", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "e1", direction: "borrow", amount: 100, status: "active" }),
        makeEntry({ id: "e2", direction: "borrow", amount: 200, status: "active" }),
        makeEntry({ id: "e3", direction: "borrow", amount: 50, status: "settled" }),
        makeEntry({ id: "e4", direction: "lend", amount: 999, status: "active" }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.totalBorrow).toBe(300);
  });

  it("getCategoryName returns category name when found", () => {
    useCategoryStore.setState({
      categories: [makeCategory({ id: "cat-1", name: "Transport" })],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.getCategoryName("cat-1")).toBe("Transport");
  });

  it("getCategoryName returns 'Tanpa kategori' when categoryId is undefined", () => {
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.getCategoryName(undefined)).toBe("Tanpa kategori");
  });

  it("getCategoryName returns 'Tanpa kategori' when category not found", () => {
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.getCategoryName("nonexistent")).toBe("Tanpa kategori");
  });

  it("getEntryRepayments filters repayments by loanEntryId", () => {
    useLoanRepaymentStore.setState({
      repayments: [
        makeRepayment({ id: "r1", loanEntryId: "entry-1" }),
        makeRepayment({ id: "r2", loanEntryId: "entry-2" }),
        makeRepayment({ id: "r3", loanEntryId: "entry-1" }),
      ],
    });
    const { result } = renderHook(() => useLoanDetail());
    const filtered = result.current.getEntryRepayments("entry-1");
    expect(filtered.length).toBe(2);
    expect(filtered.every((r) => r.loanEntryId === "entry-1")).toBe(true);
  });

  it("getEntryRepayments returns empty for non-existent entry", () => {
    useLoanRepaymentStore.setState({
      repayments: [makeRepayment({ loanEntryId: "entry-1" })],
    });
    const { result } = renderHook(() => useLoanDetail());
    expect(result.current.getEntryRepayments("nonexistent").length).toBe(0);
  });

  it("handleDeleteContact deletes contact and navigates", async () => {
    useLoanContactStore.setState({
      contacts: [{ id: mockContactId, name: "Alice", createdAt: now, updatedAt: now }],
    });
    const { result } = renderHook(() => useLoanDetail());
    await result.current.handleDeleteContact();
    expect(mockNavigate).toHaveBeenCalledWith("/loans");
  });

  it("exposes store actions", () => {
    const { result } = renderHook(() => useLoanDetail());
    expect(typeof result.current.toggleEntryStatus).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.markAllSettled).toBe("function");
    expect(typeof result.current.addRepayment).toBe("function");
    expect(typeof result.current.deleteRepayment).toBe("function");
  });
});
