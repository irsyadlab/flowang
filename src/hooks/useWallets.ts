import { useShallow } from 'zustand/react/shallow';
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
  } = useWalletStore(
    useShallow((s) => ({
      wallets: s.wallets,
      isLoading: s.isLoading,
      error: s.error,
      loadWallets: s.loadWallets,
      addWallet: s.addWallet,
      updateWallet: s.updateWallet,
      deleteWallet: s.deleteWallet,
      recalculateBalance: s.recalculateBalance,
    })),
  );

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