import { describe, it, expect, beforeEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useBalanceVisibility } from "../../src/hooks/useBalanceVisibility";

describe("useBalanceVisibility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to visible (false) when no stored value", () => {
    const { result } = renderHook(() => useBalanceVisibility());
    expect(result.current.isHidden).toBe(false);
  });

  it("reads hidden state from localStorage", () => {
    localStorage.setItem("flowang:balance-hidden", "true");
    const { result } = renderHook(() => useBalanceVisibility());
    expect(result.current.isHidden).toBe(true);
  });

  it("toggles visibility", () => {
    const { result } = renderHook(() => useBalanceVisibility());
    expect(result.current.isHidden).toBe(false);

    act(() => result.current.setIsHidden(true));
    expect(result.current.isHidden).toBe(true);
    expect(localStorage.getItem("flowang:balance-hidden")).toBe("true");

    act(() => result.current.setIsHidden(false));
    expect(result.current.isHidden).toBe(false);
    expect(localStorage.getItem("flowang:balance-hidden")).toBe("false");
  });

  it("persists state to localStorage on change", () => {
    const { result } = renderHook(() => useBalanceVisibility());
    act(() => result.current.setIsHidden(true));
    expect(localStorage.getItem("flowang:balance-hidden")).toBe("true");
  });
});
