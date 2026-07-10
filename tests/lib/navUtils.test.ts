import { describe, it, expect } from "bun:test";
import { getActiveNavItem, getSyncIndicatorColor, MORE_PREFIXES } from "../../src/lib/navUtils";

describe("getActiveNavItem", () => {
  it("returns Beranda for exact /", () => {
    const item = getActiveNavItem("/");
    expect(item).not.toBeNull();
    expect(item!.label).toBe("Beranda");
  });

  it("returns null for empty string", () => {
    expect(getActiveNavItem("")).toBeNull();
  });

  it("returns Transaksi for /transactions", () => {
    const item = getActiveNavItem("/transactions");
    expect(item).not.toBeNull();
    expect(item!.label).toBe("Transaksi");
  });

  it("returns Transaksi for /transactions/123", () => {
    const item = getActiveNavItem("/transactions/123");
    expect(item!.label).toBe("Transaksi");
  });

  it("returns Laporan for /reports", () => {
    const item = getActiveNavItem("/reports");
    expect(item).not.toBeNull();
    expect(item!.label).toBe("Laporan");
  });

  it("returns Laporan for /reports/custom", () => {
    const item = getActiveNavItem("/reports/custom");
    expect(item!.label).toBe("Laporan");
  });

  it("returns Lainnya for /more", () => {
    const item = getActiveNavItem("/more");
    expect(item).not.toBeNull();
    expect(item!.label).toBe("Lainnya");
  });

  it("returns Lainnya for /wallets", () => {
    const item = getActiveNavItem("/wallets");
    expect(item!.label).toBe("Lainnya");
  });

  it("returns Lainnya for /categories", () => {
    const item = getActiveNavItem("/categories");
    expect(item!.label).toBe("Lainnya");
  });

  it("returns Lainnya for /settings", () => {
    const item = getActiveNavItem("/settings");
    expect(item!.label).toBe("Lainnya");
  });

  it("returns Lainnya for /privacy-policy", () => {
    const item = getActiveNavItem("/privacy-policy");
    expect(item!.label).toBe("Lainnya");
  });

  it("returns null for unknown path", () => {
    expect(getActiveNavItem("/unknown")).toBeNull();
  });

  it("does not return Beranda for /anything-else", () => {
    const item = getActiveNavItem("/something");
    expect(item?.label).not.toBe("Beranda");
  });
});

describe("MORE_PREFIXES", () => {
  it("contains expected prefixes", () => {
    expect(MORE_PREFIXES).toContain("/more");
    expect(MORE_PREFIXES).toContain("/wallets");
    expect(MORE_PREFIXES).toContain("/categories");
    expect(MORE_PREFIXES).toContain("/settings");
    expect(MORE_PREFIXES).toContain("/privacy-policy");
  });
});

describe("getSyncIndicatorColor", () => {
  it("returns null when syncKey is null", () => {
    expect(getSyncIndicatorColor(null, "connected")).toBeNull();
    expect(getSyncIndicatorColor(null, "disconnected")).toBeNull();
  });

  it("returns green for connected", () => {
    expect(getSyncIndicatorColor("key", "connected")).toBe("bg-green-500");
  });

  it("returns yellow with pulse for connecting", () => {
    expect(getSyncIndicatorColor("key", "connecting")).toBe("bg-yellow-500 animate-pulse");
  });

  it("returns red for disconnected", () => {
    expect(getSyncIndicatorColor("key", "disconnected")).toBe("bg-red-500");
  });
});
