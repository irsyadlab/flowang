import { describe, expect, test } from 'bun:test';
import { createSerialQueue } from '../../src/lib/serialQueue';

const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

describe('createSerialQueue', () => {
  /**
   * Jaminan utama: tidak pernah ada dua tugas yang berjalan bersamaan.
   * Ini yang mencegah handler sync membaca state setengah jadi.
   */
  test('tidak pernah menjalankan dua tugas secara bersamaan', async () => {
    const queue = createSerialQueue();
    let active = 0;
    let maxActive = 0;

    for (let i = 0; i < 20; i++) {
      queue.enqueue(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await tick(1);
        active--;
      });
    }

    await queue.settled();
    expect(maxActive).toBe(1);
    expect(active).toBe(0);
  });

  test('menjalankan tugas sesuai urutan masuk', async () => {
    const queue = createSerialQueue();
    const order: number[] = [];

    // Tugas pertama paling lambat: kalau antrian tidak serial, dia selesai terakhir
    queue.enqueue(async () => {
      await tick(15);
      order.push(1);
    });
    queue.enqueue(async () => {
      await tick(5);
      order.push(2);
    });
    queue.enqueue(async () => {
      order.push(3);
    });

    await queue.settled();
    expect(order).toEqual([1, 2, 3]);
  });

  test('tugas yang gagal tidak menghentikan tugas berikutnya', async () => {
    const errors: unknown[] = [];
    const queue = createSerialQueue((e) => errors.push(e));
    const done: string[] = [];

    queue.enqueue(async () => {
      done.push('a');
    });
    queue.enqueue(async () => {
      throw new Error('boom');
    });
    queue.enqueue(async () => {
      done.push('c');
    });

    await queue.settled();
    expect(done).toEqual(['a', 'c']);
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toBe('boom');
  });

  test('settled() menunggu SEMUA tugas yang sudah diantrikan', async () => {
    const queue = createSerialQueue();
    let selesai = 0;

    for (let i = 0; i < 5; i++) {
      queue.enqueue(async () => {
        await tick(2);
        selesai++;
      });
    }

    await queue.settled();
    expect(selesai).toBe(5);
  });

  test('settled() pada antrian kosong langsung resolve', async () => {
    await createSerialQueue().settled();
  });
});
