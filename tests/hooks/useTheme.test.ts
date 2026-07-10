import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../src/hooks/useTheme";
import { useUIStore } from "../../src/stores/uiStore";

describe("useTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    useUIStore.setState({ theme: "system" });
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("returns current theme from store", () => {
    useUIStore.setState({ theme: "dark" });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("exposes setTheme function", () => {
    const { result } = renderHook(() => useTheme());
    expect(typeof result.current.setTheme).toBe("function");
  });

  it("applies dark class when theme is dark", () => {
    useUIStore.setState({ theme: "dark" });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when theme is light", () => {
    document.documentElement.classList.add("dark");
    useUIStore.setState({ theme: "light" });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("setTheme updates the store", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(useUIStore.getState().theme).toBe("dark");
  });
});
