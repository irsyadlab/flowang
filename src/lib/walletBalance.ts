/**
 * Perhitungan saldo wallet dari riwayat transaksi.
 *
 * Invarian: `balance = initialBalance + sum(efek semua transaksi)`.
 * `initialBalance` tidak pernah diubah setelah wallet dibuat — koreksi saldo
 * dilakukan dengan membuat transaksi `adjustment_*`, bukan menyetel ulang
 * `initialBalance`. Karena itu saldo selalu bisa direkonstruksi dari nol.
 *
 * Jalur sync memanfaatkan ini: saldo dari device lain TIDAK pernah dipercaya
 * (device itu bisa punya riwayat transaksi yang berbeda saat menulis ke Yjs),
 * melainkan selalu dihitung ulang secara lokal dari transaksi yang ada.
 */

import type { Transaction } from '../types';

/**
 * Menjumlahkan efek seluruh transaksi terhadap saldo, per wallet.
 *
 * Satu kali lintasan atas `transactions` untuk SEMUA wallet sekaligus.
 * Versi sebelumnya melakukan lintasan penuh terpisah untuk setiap wallet
 * terdampak, yang membuat biayanya O(wallet × transaksi) pada tiap event sync.
 *
 * @returns Map walletId → total delta (belum termasuk initialBalance)
 */
export function sumWalletDeltas(transactions: Transaction[]): Map<string, number> {
  const deltas = new Map<string, number>();

  const add = (walletId: string, amount: number) => {
    deltas.set(walletId, (deltas.get(walletId) ?? 0) + amount);
  };

  for (const t of transactions) {
    if (t.walletId) {
      switch (t.type) {
        case 'income':
        case 'adjustment_increase':
          add(t.walletId, t.amount);
          break;
        case 'expense':
        case 'adjustment_decrease':
          add(t.walletId, -t.amount);
          break;
        case 'transfer':
          // Sisi pengirim; sisi penerima ditangani lewat toWalletId di bawah
          add(t.walletId, -t.amount);
          break;
      }
    }

    if (t.toWalletId && t.type === 'transfer') {
      add(t.toWalletId, t.amount);
    }
  }

  return deltas;
}

/** Saldo sebuah wallet berdasarkan initialBalance dan delta hasil perhitungan. */
export function resolveBalance(initialBalance: number, delta: number | undefined): number {
  return initialBalance + (delta ?? 0);
}
