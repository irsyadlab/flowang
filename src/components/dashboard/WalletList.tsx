import { Wallet } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { formatCurrency } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";

export default function WalletList() {
  const wallets = useWalletStore((s) => s.wallets);

  if (wallets.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum ada wallet"
        description="Buat wallet untuk mulai mencatat."
      />
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Wallet</h2>
      <div className="flex flex-col gap-2">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
          >
            <p className="truncate text-sm font-medium">{w.name}</p>
            <p className="shrink-0 text-sm text-muted-foreground">
              {formatCurrency(w.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
