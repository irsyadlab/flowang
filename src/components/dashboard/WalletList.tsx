import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ChevronRight, Plus } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";

const WALLET_GRADIENTS = [
  "wallet-card-1",
  "wallet-card-2",
  "wallet-card-3",
  "wallet-card-4",
  "wallet-card-5",
];

interface WalletListProps {
  isHidden?: boolean;
}

export default function WalletList({ isHidden = false }: WalletListProps) {
  const navigate = useNavigate();
  const wallets = useWalletStore((s) => s.wallets);

  // Drag scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { isDragging: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 4) dragState.current.moved = true;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const onPointerUp = (_e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current.isDragging = false;
    el.style.cursor = "";
    el.style.userSelect = "";
  };

  // Prevent click from firing after drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.stopPropagation();
      dragState.current.moved = false;
    }
  };

  if (wallets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6">
        <EmptyState
          icon={Wallet}
          title="Belum ada wallet"
          description="Buat wallet untuk mulai mencatat keuangan."
          action={{ label: "Buat Wallet", onClick: () => navigate("/wallets/new") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Wallet Saya</h2>
        <button
          type="button"
          onClick={() => navigate("/wallets/new")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </button>
      </div>

      {/* Draggable horizontal scroll — bleeds to screen edges, aligned with page padding */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory select-none scroll-smooth"
        style={{ scrollbarWidth: "none", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {wallets.map((w, i) => (
          <button
            key={w.id}
            type="button"
            onClick={() => navigate(`/wallets/${w.id}/detail`)}
            className={`${WALLET_GRADIENTS[i % WALLET_GRADIENTS.length]} relative shrink-0 snap-start w-[200px] rounded-2xl p-4 text-left text-white shadow-lg transition-transform duration-200 active:scale-95 hover:scale-[1.02] overflow-hidden`}
          >
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/5" />
            <div className="absolute -bottom-4 -right-2 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                  <Wallet className="h-3.5 w-3.5 text-white" />
                </div>
                <ChevronRight className="h-4 w-4 text-white/40" />
              </div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest mb-0.5">Saldo</p>
              {isHidden ? (
                <div className="flex items-center gap-1 mt-1 mb-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-2 w-2 rounded-full bg-white/40" />
                  ))}
                </div>
              ) : (
                <p className="text-base font-bold leading-tight truncate">{formatCurrency(w.balance)}</p>
              )}
              <p className="mt-1.5 text-xs text-white/60 truncate font-medium">{w.name}</p>
            </div>
          </button>
        ))}

        {/* Add wallet card */}
        <button
          type="button"
          onClick={() => navigate("/wallets/new")}
          className="shrink-0 snap-start w-[200px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors p-4"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium">Tambah Wallet</span>
        </button>
      </div>
    </div>
  );
}
