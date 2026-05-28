import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWalletStore } from "@/stores/walletStore";
import WalletForm from "@/components/wallets/WalletForm";
import ErrorMessage from "@/components/shared/ErrorMessage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { WalletEditInput } from "@/lib/validators";

export default function EditWalletPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallets, isLoading, loadWallets, updateWallet } = useWalletStore();

  useEffect(() => {
    if (wallets.length === 0) loadWallets();
  }, [wallets.length, loadWallets]);

  const wallet = wallets.find((w) => w.id === id);

  if (isLoading && wallets.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  if (!wallet) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <ErrorMessage message="Wallet tidak ditemukan" />
      </div>
    );
  }

  const handleSubmit = async (data: WalletEditInput) => {
    // Convert desired balance to initialBalance for the store's correction logic:
    // newInitialBalance = currentInitialBalance + (desiredBalance - currentBalance)
    const newInitialBalance = wallet.initialBalance + (data.balance - wallet.balance);
    await updateWallet(wallet.id, { name: data.name, initialBalance: newInitialBalance });
    navigate("/wallets");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Edit Wallet</h1>
      <WalletForm
        mode="edit"
        initialData={{ name: wallet.name }}
        currentBalance={wallet.balance}
        excludeId={wallet.id}
        onSubmit={handleSubmit}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
