import { describe, it, expect } from "bun:test";
import { cn, formatCurrency, formatDate, localDateStr, localTimeStr, localISOString } from "../../src/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("hidden");
  });

  it("deduplicates tailwind classes", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });
});

describe("formatCurrency", () => {
  it("formats positive amount in IDR", () => {
    const result = formatCurrency(100000);
    expect(result).toContain("100.000");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats large amount", () => {
    const result = formatCurrency(1000000000);
    expect(result).toContain("1.000.000.000");
  });
});

describe("formatDate", () => {
  it("formats date string to Indonesian format", () => {
    const result = formatDate("2025-01-15");
    expect(result).toContain("15");
    expect(result).toContain("Januari");
    expect(result).toContain("2025");
  });

  it("includes time when provided", () => {
    const result = formatDate("2025-01-15", "14:30");
    expect(result).toContain("14:30");
  });
});

describe("localDateStr", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = localDateStr(new Date(2025, 0, 5));
    expect(result).toBe("2025-01-05");
  });

  it("pads month and day with zeros", () => {
    const result = localDateStr(new Date(2025, 2, 9));
    expect(result).toBe("2025-03-09");
  });
});

describe("localTimeStr", () => {
  it("returns HH:mm format", () => {
    const result = localTimeStr(new Date(2025, 0, 1, 9, 5));
    expect(result).toBe("09:05");
  });

  it("pads hours and minutes", () => {
    const result = localTimeStr(new Date(2025, 0, 1, 3, 7));
    expect(result).toBe("03:07");
  });
});

describe("localISOString", () => {
  it("returns local ISO-like string without timezone", () => {
    const date = new Date(2025, 0, 15, 10, 30, 45, 123);
    const result = localISOString(date);
    expect(result).toBe("2025-01-15T10:30:45.123");
  });

  it("does not include Z or timezone offset", () => {
    const result = localISOString(new Date());
    expect(result).not.toContain("Z");
    expect(result).not.toMatch(/[+-]\d{2}:\d{2}$/);
  });
});
