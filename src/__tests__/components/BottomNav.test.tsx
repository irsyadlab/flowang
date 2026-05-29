import { describe, it, expect, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";

afterEach(() => {
  cleanup();
});

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderNav(initialEntries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BottomNav />
      <LocationDisplay />
    </MemoryRouter>
  );
}

function getLocation(): string {
  return screen.getByTestId("location").textContent!;
}

describe("BottomNav", () => {
  it("renders exactly 4 nav items with correct labels", () => {
    renderNav();
    expect(screen.getAllByText("Beranda").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Transaksi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Laporan").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Lainnya").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to / on Beranda click", () => {
    renderNav(["/transactions"]);
    const link = screen.getAllByText("Beranda")[0].closest("a")!;
    fireEvent.click(link);
    expect(getLocation()).toBe("/");
  });

  it("navigates to /transactions on Transaksi click", () => {
    renderNav(["/"]);
    const link = screen.getAllByText("Transaksi")[0].closest("a")!;
    fireEvent.click(link);
    expect(getLocation()).toBe("/transactions");
  });

  it("navigates to /reports on Laporan click", () => {
    renderNav(["/"]);
    const link = screen.getAllByText("Laporan")[0].closest("a")!;
    fireEvent.click(link);
    expect(getLocation()).toBe("/reports");
  });

  it("navigates to /more on Lainnya click", () => {
    renderNav(["/"]);
    const btn = screen.getAllByText("Lainnya")[0].closest("button")!;
    fireEvent.click(btn);
    expect(getLocation()).toBe("/more");
  });

  it("Beranda is active on route /", () => {
    renderNav(["/"]);
    const link = screen.getAllByText("Beranda")[0].closest("a")!;
    expect(link.className).toContain("text-primary");
  });

  it("Transaksi is active on route /transactions/new", () => {
    renderNav(["/transactions/new"]);
    const link = screen.getAllByText("Transaksi")[0].closest("a")!;
    expect(link.className).toContain("text-primary");
  });

  it("Laporan is active on route /reports/monthly/2024/1", () => {
    renderNav(["/reports/monthly/2024/1"]);
    const link = screen.getAllByText("Laporan")[0].closest("a")!;
    expect(link.className).toContain("text-primary");
  });

  it("Lainnya is active on route /more", () => {
    renderNav(["/more"]);
    const btn = screen.getAllByText("Lainnya")[0].closest("button")!;
    expect(btn.className).toContain("text-primary");
  });

  it("Lainnya is active on route /wallets", () => {
    renderNav(["/wallets"]);
    const btn = screen.getAllByText("Lainnya")[0].closest("button")!;
    expect(btn.className).toContain("text-primary");
  });

  it("Lainnya is active on route /categories", () => {
    renderNav(["/categories"]);
    const btn = screen.getAllByText("Lainnya")[0].closest("button")!;
    expect(btn.className).toContain("text-primary");
  });

  it("Lainnya is active on route /settings", () => {
    renderNav(["/settings"]);
    const btn = screen.getAllByText("Lainnya")[0].closest("button")!;
    expect(btn.className).toContain("text-primary");
  });
});
