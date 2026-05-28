import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Wallet, Tag, Settings } from "lucide-react";
import { useSyncStore } from "@/sync/syncStore";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Beranda" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { to: "/reports", icon: BarChart3, label: "Laporan" },
  { to: "/wallets", icon: Wallet, label: "Wallet" },
  { to: "/categories", icon: Tag, label: "Kategori" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
];

function SyncIndicator() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);

  if (!syncKey) return null;

  const dotColor =
    syncStatus === "connected"
      ? "bg-green-500"
      : syncStatus === "connecting"
        ? "bg-yellow-500 animate-pulse"
        : "bg-red-500";

  return (
    <span
      className={`absolute right-0 top-0 h-1.5 w-1.5 rounded-full ${dotColor}`}
    />
  );
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-border/60 bottom-nav-blur">
      <div className="flex items-center justify-around py-1 pb-safe">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium tracking-wide transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative flex items-center justify-center rounded-xl p-1.5 transition-all duration-200 ${isActive ? "bg-primary/8" : ""}`}>
                  <Icon className={`transition-all duration-200 ${isActive ? "h-[22px] w-[22px]" : "h-5 w-5"}`} />
                  {to === "/settings" && <SyncIndicator />}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
