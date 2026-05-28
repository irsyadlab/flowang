import { useWalletStore } from '../stores/walletStore';

export function useWallets() {
  const {
    wallets,
    isLoading,
    error,
    loadWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    recalculateBalance,
  } = useWalletStore();

  return {
    // Data
    wallets,
    isLoading,
    error,
    
    // Actions
    loadWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    recalculateBalance,
  };
}