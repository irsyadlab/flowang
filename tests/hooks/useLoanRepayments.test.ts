import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useLoanRepaymentStore } from "../../src/stores/loanRepaymentStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import { renderHook } from "@testing-library/react";
import { useLoanRepayments } from "../../src/hooks/useLoanRepayments";
import type { Repayment } from "../../src/types";

function resetStores() {
  useLoanRepaymentStore.setState({ repayments: [], isLoading: false, error: null });
}

function makeRepayment(overrides: Partial<Repayment> = {}): Repayment {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    loanEntryId: "entry1",
    amount: 50,
    date: "2025-01-20",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("useLoanRepayments", () => {
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

  it("returns repayments from store", () => {
    useLoanRepaymentStore.setState({
      repayments: [makeRepayment()],
    });
    const { result } = renderHook(() => useLoanRepayments());
    expect(result.current.repayments.length).toBe(1);
  });

  it("getRepaymentsByLoanEntryId filters correctly", () => {
    useLoanRepaymentStore.setState({
      repayments: [
        makeRepayment({ id: "r1", loanEntryId: "entry1" }),
        makeRepayment({ id: "r2", loanEntryId: "entry2" }),
        makeRepayment({ id: "r3", loanEntryId: "entry1" }),
      ],
    });
    const { result } = renderHook(() => useLoanRepayments());
    const filtered = result.current.getRepaymentsByLoanEntryId("entry1");
    expect(filtered.length).toBe(2);
    expect(filtered.every((r) => r.loanEntryId === "entry1")).toBe(true);
  });

  it("getRepaymentsByLoanEntryId returns empty for non-existent entry", () => {
    useLoanRepaymentStore.setState({
      repayments: [makeRepayment({ loanEntryId: "entry1" })],
    });
    const { result } = renderHook(() => useLoanRepayments());
    expect(result.current.getRepaymentsByLoanEntryId("nonexistent").length).toBe(0);
  });

  it("exposes store actions", () => {
    const { result } = renderHook(() => useLoanRepayments());
    expect(typeof result.current.loadRepayments).toBe("function");
    expect(typeof result.current.addRepayment).toBe("function");
    expect(typeof result.current.deleteRepayment).toBe("function");
  });
});
