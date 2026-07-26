import { describe, expect, test } from 'bun:test';
import fc from 'fast-check';
import { sumWalletDeltas, resolveBalance } from '../../src/lib/walletBalance';
import type { Transaction } from '../../src/types';

const NOW = '2024-01-01T00:00:00.000Z';

function tx(partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amount'>): Transaction {
  return {
    id: crypto.randomUUID(),
    date: '2024-01-01',
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  } as Transaction;
}

describe('sumWalletDeltas', () => {
  test('income menambah, expense mengurangi', () => {
    const deltas = sumWalletDeltas([
      tx({ type: 'income', amount: 100, walletId: 'w1' }),
      tx({ type: 'expense', amount: 30, walletId: 'w1' }),
    ]);
    expect(deltas.get('w1')).toBe(70);
  });

  test('adjustment diperlakukan seperti income/expense', () => {
    const deltas = sumWalletDeltas([
      tx({ type: 'adjustment_increase', amount: 500, walletId: 'w1' }),
      tx({ type: 'adjustment_decrease', amount: 200, walletId: 'w1' }),
    ]);
    expect(deltas.get('w1')).toBe(300);
  });

  test('transfer memindahkan nilai antar wallet', () => {
    const deltas = sumWalletDeltas([
      tx({ type: 'transfer', amount: 250, walletId: 'w1', toWalletId: 'w2' }),
    ]);
    expect(deltas.get('w1')).toBe(-250);
    expect(deltas.get('w2')).toBe(250);
  });

  test('menghitung semua wallet dalam satu lintasan', () => {
    const deltas = sumWalletDeltas([
      tx({ type: 'income', amount: 100, walletId: 'w1' }),
      tx({ type: 'income', amount: 200, walletId: 'w2' }),
      tx({ type: 'transfer', amount: 50, walletId: 'w1', toWalletId: 'w3' }),
    ]);
    expect(deltas.get('w1')).toBe(50);
    expect(deltas.get('w2')).toBe(200);
    expect(deltas.get('w3')).toBe(50);
  });

  test('wallet tanpa transaksi tidak muncul di hasil', () => {
    expect(sumWalletDeltas([]).size).toBe(0);
    expect(sumWalletDeltas([tx({ type: 'income', amount: 1, walletId: 'w1' })]).has('w2')).toBe(false);
  });

  test('resolveBalance memperlakukan wallet tanpa transaksi sebagai delta nol', () => {
    expect(resolveBalance(1000, undefined)).toBe(1000);
    expect(resolveBalance(1000, -250)).toBe(750);
  });

  /**
   * Properti kunci untuk sync: transfer hanya memindahkan nilai, tidak pernah
   * menciptakan atau menghilangkannya. Kalau ini pernah tidak berlaku, saldo
   * gabungan antar-device akan menyimpang setiap kali ada transfer.
   */
  test('transfer bersifat konservatif terhadap total saldo', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            amount: fc.integer({ min: 1, max: 1_000_000 }),
            from: fc.constantFrom('w1', 'w2', 'w3'),
            to: fc.constantFrom('w1', 'w2', 'w3'),
          }),
          { maxLength: 50 },
        ),
        (moves) => {
          const txs = moves
            .filter((m) => m.from !== m.to)
            .map((m) => tx({ type: 'transfer', amount: m.amount, walletId: m.from, toWalletId: m.to }));

          const deltas = sumWalletDeltas(txs);
          const total = Array.from(deltas.values()).reduce((s, d) => s + d, 0);
          expect(total).toBe(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  /**
   * Jalur sync menghitung ulang saldo dari NOL setiap kali, jadi hasilnya harus
   * tidak bergantung pada urutan kedatangan transaksi — padahal urutan itu
   * justru yang tidak dijamin oleh CRDT.
   */
  test('hasil tidak bergantung pada urutan transaksi', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('income' as const, 'expense' as const),
            amount: fc.integer({ min: 1, max: 100_000 }),
            walletId: fc.constantFrom('w1', 'w2'),
          }),
          { minLength: 1, maxLength: 40 },
        ),
        fc.integer({ min: 0, max: 1000 }),
        (specs, seed) => {
          const txs = specs.map((s) => tx(s));
          const shuffled = [...txs].sort(
            (a, b) => ((a.amount * seed) % 7) - ((b.amount * seed) % 7),
          );

          const a = sumWalletDeltas(txs);
          const b = sumWalletDeltas(shuffled);
          expect(Object.fromEntries(b)).toEqual(Object.fromEntries(a));
        },
      ),
      { numRuns: 200 },
    );
  });
});
