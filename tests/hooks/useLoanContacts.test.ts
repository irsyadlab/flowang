import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useLoanContactStore } from "../../src/stores/loanContactStore";
import { useLoanEntryStore } from "../../src/stores/loanEntryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook } from "@testing-library/react";
import { useLoanContacts } from "../../src/hooks/useLoanContacts";

function resetStores() {
  useLoanContactStore.setState({ contacts: [], isLoading: false, error: null });
  useLoanEntryStore.setState({ entries: [], isLoading: false, error: null });
}

describe("useLoanContacts", () => {
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

  it("returns contacts from store", () => {
    useLoanContactStore.setState({
      contacts: [
        { id: "c1", name: "Alice", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
    });
    const { result } = renderHook(() => useLoanContacts());
    expect(result.current.contacts.length).toBe(1);
    expect(result.current.contacts[0].name).toBe("Alice");
  });

  it("computes summaries for contacts", () => {
    useLoanContactStore.setState({
      contacts: [
        { id: "c1", name: "Alice", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
    });
    const now = new Date().toISOString();
    useLoanEntryStore.setState({
      entries: [
        {
          id: "e1", contactId: "c1", amount: 100, direction: "lend", status: "active",
          date: "2025-01-01", remainingAmount: 100, createdAt: now, updatedAt: now,
        },
        {
          id: "e2", contactId: "c1", amount: 50, direction: "borrow", status: "active",
          date: "2025-01-01", remainingAmount: 50, createdAt: now, updatedAt: now,
        },
      ],
    });

    const { result } = renderHook(() => useLoanContacts());
    const summary = result.current.summaries.get("c1");
    expect(summary).toBeDefined();
    expect(summary!.totalLend).toBe(100);
    expect(summary!.totalBorrow).toBe(50);
    expect(summary!.hasActiveEntries).toBe(true);
  });

  it("returns empty summaries when no entries", () => {
    useLoanContactStore.setState({
      contacts: [
        { id: "c1", name: "Alice", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
      ],
    });
    useLoanEntryStore.setState({ entries: [] });

    const { result } = renderHook(() => useLoanContacts());
    const summary = result.current.summaries.get("c1");
    expect(summary).toBeDefined();
    expect(summary!.totalLend).toBe(0);
    expect(summary!.totalBorrow).toBe(0);
    expect(summary!.hasActiveEntries).toBe(false);
  });
});
