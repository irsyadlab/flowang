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
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Wallet Baru</h1>
      <WalletForm onSubmit={handleSubmit} submitLabel="Buat Wallet" />
    </div>
  );
}
