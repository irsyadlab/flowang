/**
 * Cakupan langganan store: komponen hanya boleh re-render saat potongan state
 * yang benar-benar dipakainya berubah.
 *
 * Kenapa ini diuji: setiap aksi store diawali `set({ isLoading: true })` dan
 * ditutup `set({ isLoading: false })`. Komponen yang berlangganan ke SELURUH
 * store (`useStore()` tanpa selector) ikut re-render pada kedua-duanya, meski
 * hanya memakai sebuah action yang nilainya tidak pernah berubah.
 *
 * Test ini mengunci perilakunya di level yang benar — jumlah render — bukan
 * sekadar memastikan nilainya benar.
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { render, act, cleanup } from '@testing-library/react';
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useWalletStore } from '../../src/stores/walletStore';
import type { Wallet } from '../../src/types';

function resetStores() {
  useTransactionStore.setState({ transactions: [], filter: {}, isLoading: false, error: null });
  useWalletStore.setState({ wallets: [], isLoading: false, error: null });
}

function makeWallet(id: string): Wallet {
  return {
    id,
    name: `Wallet ${id}`,
    initialBalance: 0,
    balance: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('Cakupan langganan store', () => {
  beforeEach(resetStores);
  afterEach(() => {
    cleanup();
    resetStores();
  });

  test('komponen yang hanya memakai action tidak re-render saat isLoading berubah', () => {
    let renders = 0;

    function OnlyAction() {
      renders++;
      const setFilter = useTransactionStore((s) => s.setFilter);
      return <button onClick={() => setFilter({})}>filter</button>;
    }

    render(<OnlyAction />);
    expect(renders).toBe(1);

    // Persis yang terjadi di awal & akhir setiap aksi store
    act(() => {
      useTransactionStore.setState({ isLoading: true });
    });
    act(() => {
      useTransactionStore.setState({ isLoading: false });
    });

    expect(renders).toBe(1);
  });

  test('komponen tetap re-render saat potongan yang dipakainya berubah', () => {
    let renders = 0;

    function UsesWallets() {
      renders++;
      const wallets = useWalletStore((s) => s.wallets);
      return <span>{wallets.length}</span>;
    }

    render(<UsesWallets />);
    expect(renders).toBe(1);

    act(() => {
      useWalletStore.setState({ wallets: [makeWallet('w1')] });
    });
    expect(renders).toBe(2);

    // Perubahan yang tidak berkaitan tidak boleh menambah render
    act(() => {
      useWalletStore.setState({ isLoading: true });
    });
    expect(renders).toBe(2);
  });

  test('menyetel potongan ke nilai yang sama tidak memicu render', () => {
    let renders = 0;
    const wallets = [makeWallet('w1')];
    useWalletStore.setState({ wallets });

    function UsesWallets() {
      renders++;
      return <span>{useWalletStore((s) => s.wallets).length}</span>;
    }

    render(<UsesWallets />);
    expect(renders).toBe(1);

    // Array yang sama persis (identitas referensi tidak berubah)
    act(() => {
      useWalletStore.setState({ wallets });
    });
    expect(renders).toBe(1);
  });

  /**
   * Jebakan klasik: selector yang mengembalikan objek literal membuat objek baru
   * pada setiap evaluasi, jadi tidak pernah `Object.is`-equal — komponen akan
   * re-render pada SETIAP notifikasi store, bahkan saat tidak ada nilai yang
   * benar-benar berubah. Hook di `src/hooks/` mengembalikan banyak field
   * sekaligus, dan memakai `useShallow` justru untuk mencegah ini.
   *
   * Pembeda yang dipakai di sini: `setState` selalu membuat objek state root
   * baru dan memberi tahu semua listener, meski isinya identik. Jadi hanya
   * pembandingan shallow yang bisa menahan render kedua.
   */
  test('hook multi-field tidak re-render saat tidak ada nilai yang berubah', async () => {
    const { useWallets } = await import('../../src/hooks/useWallets');
    let renders = 0;

    function UsesHook() {
      renders++;
      const { wallets } = useWallets();
      return <span>{wallets.length}</span>;
    }

    render(<UsesHook />);

    // Perubahan nyata: hook memang mengekspos isLoading, jadi render ini benar
    act(() => {
      useWalletStore.setState({ isLoading: true });
    });
    const afterRealChange = renders;
    expect(afterRealChange).toBe(2);

    // Notifikasi tanpa perubahan nilai apa pun — tidak boleh menambah render
    act(() => {
      useWalletStore.setState({ isLoading: true });
    });
    act(() => {
      useWalletStore.setState({ isLoading: true });
    });
    expect(renders).toBe(afterRealChange);
  });
});
