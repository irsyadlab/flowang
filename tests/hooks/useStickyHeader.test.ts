import { describe, it, expect, beforeEach } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useStickyHeader } from "../../src/hooks/useStickyHeader";
import { useTourStore } from "../../src/stores/tourStore";
import { TOUR_STATUS_KEY } from "../../src/lib/tourStorage";

describe("useStickyHeader", () => {
  beforeEach(() => {
    useTourStore.setState({ run: false, stepIndex: 0, hasAutoStarted: false });
    localStorage.removeItem(TOUR_STATUS_KEY);
  });

  it("returns sticky class when tour is not running", () => {
    const { result } = renderHook(() => useStickyHeader());
    expect(result.current).toContain("sticky");
    expect(result.current).toContain("top-0");
  });

  it("returns relative class when tour is running", () => {
    useTourStore.setState({ run: true });
    const { result } = renderHook(() => useStickyHeader());
    expect(result.current).toContain("relative");
    expect(result.current).not.toContain("sticky");
  });

  it("includes z-40 and bg-background in both modes", () => {
    const { result: result1 } = renderHook(() => useStickyHeader());
    expect(result1.current).toContain("z-40");
    expect(result1.current).toContain("bg-background");

    useTourStore.setState({ run: true });
    const { result: result2 } = renderHook(() => useStickyHeader());
    expect(result2.current).toContain("z-40");
    expect(result2.current).toContain("bg-background");
  });
});
