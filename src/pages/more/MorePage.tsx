import { useNavigate } from "react-router-dom";
import { Wallet, Tag, Settings, ShieldCheck, Info, ChevronRight, HelpCircle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSyncStore } from "@/sync/syncStore";
import { useTourStore } from "@/stores/tourStore";
import { getSyncIndicatorColor } from "@/lib/navUtils";

interface MoreNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  showSyncIndicator?: boolean;
}

const moreNavItems: MoreNavItem[] = [
  { to: "/wallets", icon: Wallet, label: "Wallet", description: "Kelola dompet dan saldo" },
  { to: "/categories", icon: Tag, label: "Kategori", description: "Atur kategori pemasukan & pengeluaran" },
  { to: "/settings", icon: Settings, label: "Pengaturan", description: "Tema, sinkronisasi, & lainnya", showSyncIndicator: true },
  { to: "/privacy-policy", icon: ShieldCheck, label: "Kebijakan Privasi", description: "Cara kami melindungi data Anda" },
  { to: "/about", icon: Info, label: "Tentang", description: "Versi, lisensi, & teknologi" },
];

function SyncIndicator() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);

  const dotColor = getSyncIndicatorColor(syncKey, syncStatus);
  if (!dotColor) return null;

  return <span className={`h-2 w-2 rounded-full ${dotColor}`} />;
}

export default function MorePage() {
  const navigate = useNavigate();
  const restartTour = useTourStore((s) => s.restartTour);

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-lg font-semibold">Lainnya</h1>

      {/* Main nav items */}
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {moreNavItems.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            data-tour={`more-${item.to.slice(1)}`}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {item.label}
                {item.showSyncIndicator && <SyncIndicator />}
              </span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Help & Tour card */}
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        <button
          onClick={() => navigate("/help")}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 min-w-0">
            <span className="text-sm font-medium block">Bantuan</span>
            <span className="text-xs text-muted-foreground">Panduan lengkap penggunaan aplikasi</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        <button
          onClick={() => {
            navigate("/");
            setTimeout(() => restartTour(), 600);
          }}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 min-w-0">
            <span className="text-sm font-medium block">Mulai Ulang Tur</span>
            <span className="text-xs text-muted-foreground">Ulangi panduan fitur dari awal</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
