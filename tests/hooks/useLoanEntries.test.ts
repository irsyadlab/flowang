import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useLoanEntryStore } from "../../src/stores/loanEntryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook } from "@testing-library/react";
import { useLoanEntries } from "../../src/hooks/useLoanEntries";
import type { LoanEntry } from "../../src/types";

function resetStores() {
  useLoanEntryStore.setState({ entries: [], isLoading: false, error: null });
}

function makeEntry(overrides: Partial<LoanEntry> = {}): LoanEntry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    contactId: "c1",
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

describe("useLoanEntries", () => {
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

  it("returns entries from store", () => {
    const entry = makeEntry();
    useLoanEntryStore.setState({ entries: [entry] });
    const { result } = renderHook(() => useLoanEntries());
    expect(result.current.entries.length).toBe(1);
  });

  it("returns sorted entries (descending by date)", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "1", date: "2025-01-01" }),
        makeEntry({ id: "2", date: "2025-03-01" }),
        makeEntry({ id: "3", date: "2025-02-01" }),
      ],
    });
    const { result } = renderHook(() => useLoanEntries());
    expect(result.current.sortedEntries[0].date).toBe("2025-03-01");
    expect(result.current.sortedEntries[1].date).toBe("2025-02-01");
    expect(result.current.sortedEntries[2].date).toBe("2025-01-01");
  });

  it("getContactSummary computes correctly", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "1", contactId: "c1", amount: 200, direction: "lend", status: "active" }),
        makeEntry({ id: "2", contactId: "c1", amount: 50, direction: "borrow", status: "active" }),
        makeEntry({ id: "3", contactId: "c2", amount: 100, direction: "lend", status: "active" }),
      ],
    });
    const { result } = renderHook(() => useLoanEntries());
    const summary = result.current.getContactSummary("c1");
    expect(summary.totalLend).toBe(200);
    expect(summary.totalBorrow).toBe(50);
  });

  it("getNetBalance returns correct label", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "1", contactId: "c1", amount: 200, direction: "lend", status: "active" }),
        makeEntry({ id: "2", contactId: "c1", amount: 50, direction: "borrow", status: "active" }),
      ],
    });
    const { result } = renderHook(() => useLoanEntries());
    expect(result.current.getNetBalance("c1")).toBe("Kamu menagih");
  });

  it("getNetBalance returns Lunas semua when equal", () => {
    useLoanEntryStore.setState({
      entries: [
        makeEntry({ id: "1", contactId: "c1", amount: 100, direction: "lend", status: "active" }),
        makeEntry({ id: "2", contactId: "c1", amount: 100, direction: "borrow", status: "active" }),
      ],
    });
    const { result } = renderHook(() => useLoanEntries());
    expect(result.current.getNetBalance("c1")).toBe("Lunas semua");
  });

  it("exposes store actions", () => {
    const { result } = renderHook(() => useLoanEntries());
    expect(typeof result.current.loadEntries).toBe("function");
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.toggleEntryStatus).toBe("function");
    expect(typeof result.current.markAllSettled).toBe("function");
  });
});
