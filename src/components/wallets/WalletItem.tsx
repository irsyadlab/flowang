import { useNavigate } from "react-router-dom";
import { Wallet, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Wallet as WalletType } from "@/types";

interface WalletItemProps {
  wallet: WalletType;
  isHidden?: boolean;
}

export default function WalletItem({ wallet, isHidden = false }: WalletItemProps) {
  const navigate = useNavigate();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/wallets/${wallet.id}/detail`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/wallets/${wallet.id}/detail`);
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 transition-all duration-200 hover:border-border hover:shadow-sm active:scale-[0.99]"
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
        <Wallet className="h-4.5 w-4.5 text-primary" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{wallet.name}</p>
        <p className="text-sm font-medium text-muted-foreground tabular-nums">
          {isHidden ? (
            <span className="flex items-center gap-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              ))}
            </span>
          ) : (
            formatCurrency(wallet.balance)
          )}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </div>
  );
}
