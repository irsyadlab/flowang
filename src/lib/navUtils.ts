import { LayoutDashboard, ArrowLeftRight, BarChart3, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SyncStatus } from "@/sync/syncStore";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

export const MORE_PREFIXES = ["/more", "/wallets", "/categories", "/settings", "/privacy-policy"];

const NAV_ITEMS: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Beranda", end: true },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { to: "/reports", icon: BarChart3, label: "Laporan" },
  { to: "/more", icon: MoreHorizontal, label: "Lainnya" },
];

/**
 * Returns the active nav item based on the current pathname.
 * - "Beranda" is only active when pathname === "/"
 * - "Transaksi" and "Laporan" are active when pathname starts with their prefix
 * - "Lainnya" is active when pathname matches any of MORE_PREFIXES
 * - Returns null if no item matches
 */
export function getActiveNavItem(pathname: string): NavItem | null {
  // Check "Beranda" — exact match only
  if (pathname === "/") {
    return NAV_ITEMS[0];
  }

  // Check "Transaksi" and "Laporan" — prefix match
  for (const item of NAV_ITEMS.slice(1, 3)) {
    if (pathname.startsWith(item.to)) {
      return item;
    }
  }

  // Check "Lainnya" — matches any of MORE_PREFIXES
  const isMoreActive = MORE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (isMoreActive) {
    return NAV_ITEMS[3];
  }

  return null;
}

/**
 * Returns the CSS class string for the sync indicator dot color.
 * - Returns null if syncKey is null (indicator not shown)
 * - Returns "bg-green-500" if connected
 * - Returns "bg-yellow-500 animate-pulse" if connecting
 * - Returns "bg-red-500" for any other status (e.g. disconnected)
 */
export function getSyncIndicatorColor(
  syncKey: string | null,
  syncStatus: SyncStatus
): string | null {
  if (syncKey === null) return null;

  if (syncStatus === "connected") return "bg-green-500";
  if (syncStatus === "connecting") return "bg-yellow-500 animate-pulse";
  return "bg-red-500";
}
