import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "../../src/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: originalOnLine, writable: true, configurable: true });
  });

  it("returns initial online status", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("updates when online event fires", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => window.dispatchEvent(new Event("online")));
    expect(result.current).toBe(true);
  });

  it("updates when offline event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current).toBe(false);
  });
});
