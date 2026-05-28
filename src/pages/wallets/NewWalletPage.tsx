import { useNavigate } from "react-router-dom";

import { useWalletStore } from "@/stores/walletStore";
import WalletForm from "@/components/wallets/WalletForm";
import type { WalletInput } from "@/lib/validators";

export default function NewWalletPage() {
  const navigate = useNavigate();
  const addWallet = useWalletStore((s) => s.addWallet);

  const handleSubmit = async (data: WalletInput) => {
    await addWallet({ name: data.name, initialBalance: data.initialBalance });
    navigate("/wallets");
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-foreground">Wallet Baru</h1>
      </div>
      <WalletForm onSubmit={handleSubmit} submitLabel="Buat Wallet" />
    </div>
  );
}
