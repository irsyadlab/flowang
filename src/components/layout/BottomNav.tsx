import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, BarChart3, MoreHorizontal } from "lucide-react";
import { MORE_PREFIXES } from "@/lib/navUtils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Beranda", end: true },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transaksi", end: false },
  { to: "/reports", icon: BarChart3, label: "Laporan", end: false },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isMoreActive = MORE_PREFIXES.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-border/60 bottom-nav-blur">
      <div className="flex items-center justify-around py-1 pb-safe">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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

        <button
          onClick={() => navigate("/more")}
          className={`relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium tracking-wide transition-all duration-200 ${
            isMoreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`relative flex items-center justify-center rounded-xl p-1.5 transition-all duration-200 ${isMoreActive ? "bg-primary/8" : ""}`}>
            <MoreHorizontal className={`transition-all duration-200 ${isMoreActive ? "h-[22px] w-[22px]" : "h-5 w-5"}`} />
            {isMoreActive && (
              <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </div>
          <span className={`transition-all duration-200 ${isMoreActive ? "opacity-100" : "opacity-70"}`}>
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}
