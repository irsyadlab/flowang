import { useNavigate } from "react-router-dom";
import {
  Wallet, Tag, Settings, ShieldCheck, Info,
  ChevronRight, HelpCircle, RefreshCw, MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSyncStore } from "@/sync/syncStore";
import { useTourStore } from "@/stores/tourStore";
import { getSyncIndicatorColor } from "@/lib/navUtils";

interface NavItem {
  to?: string;
  action?: () => void;
  icon: LucideIcon;
  label: string;
  description: string;
  tourId?: string;
  showSyncIndicator?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function SyncIndicator() {
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncKey = useSyncStore((s) => s.syncKey);
  const dotColor = getSyncIndicatorColor(syncKey, syncStatus);
  if (!dotColor) return null;
  return <span className={`h-2 w-2 rounded-full ${dotColor}`} />;
}

function NavRow({ item, onClick }: { item: NavItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      data-tour={item.tourId}
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
  );
}

export default function MorePage() {
  const navigate = useNavigate();
  const restartTour = useTourStore((s) => s.restartTour);

  const groups: NavGroup[] = [
    {
      label: "Kelola",
      items: [
        { to: "/wallets",    icon: Wallet, label: "Wallet",   description: "Kelola dompet dan saldo",                  tourId: "more-wallets" },
        { to: "/categories", icon: Tag,    label: "Kategori", description: "Atur kategori pemasukan & pengeluaran",    tourId: "more-categories" },
      ],
    },
    {
      label: "Aplikasi",
      items: [
        { to: "/settings",      icon: Settings,   label: "Pengaturan",      description: "Tema, sinkronisasi, & lainnya",          tourId: "more-settings", showSyncIndicator: true },
        { to: "/privacy-policy", icon: ShieldCheck, label: "Kebijakan Privasi", description: "Cara kami melindungi data Anda",      tourId: "more-privacy-policy" },
        { to: "/about",         icon: Info,       label: "Tentang",         description: "Versi, lisensi, & teknologi",            tourId: "more-about" },
      ],
    },
    {
      label: "Bantuan",
      items: [
        { to: "/help",     icon: HelpCircle,   label: "Bantuan",        description: "Panduan lengkap penggunaan aplikasi" },
        { to: "/feedback", icon: MessageSquare, label: "Kirim Feedback", description: "Saran, laporan bug, atau masukan" },
        {
          icon: RefreshCw,
          label: "Mulai Ulang Tur",
          description: "Ulangi panduan fitur dari awal",
          action: () => { navigate("/"); setTimeout(() => restartTour(), 600); },
        },
      ],
    },
  ];

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-30 bg-background px-4 py-3">
        <h1 className="text-lg font-semibold">Lainnya</h1>
      </div>
      <div className="px-4 space-y-6">

      {groups.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {group.label}
          </p>
          <div className="rounded-xl border bg-card divide-y overflow-hidden">
            {group.items.map((item) => (
              <NavRow
                key={item.label}
                item={item}
                onClick={item.action ?? (() => navigate(item.to!))}
              />
            ))}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
