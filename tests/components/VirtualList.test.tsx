/**
 * VirtualList — cakupan test dan batasnya.
 *
 * jsdom tidak menjalankan layout: `getBoundingClientRect` mengembalikan nol dan
 * tidak ada ResizeObserver, sehingga lapisan PENGUKURAN baris milik virtualizer
 * tidak berfungsi di sini (tinggi total ikut nol, posisi baris tidak dihitung).
 * Karena itu file ini sengaja TIDAK meng-assert tinggi container, posisi baris,
 * maupun jumlah baris yang persis — angka apa pun di situ akan menyesatkan.
 *
 * Yang diuji di sini adalah bagian yang deterministik tanpa layout:
 *   - keputusan mode (biasa vs windowing) beserta ambangnya
 *   - struktur DOM masing-masing mode
 *   - windowing benar-benar mengurangi jumlah baris yang dirender
 *
 * Perilaku sesungguhnya diverifikasi di browser dengan 1.501 transaksi:
 * hanya 11–23 baris yang ada di DOM di posisi scroll mana pun, tinggi container
 * 114.086px, dan baris pertama yang terlihat cocok dengan posisi scroll.
 */

import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { render, cleanup, screen } from '@testing-library/react';
import VirtualList from '../../src/components/shared/VirtualList';

/** Cukup jauh di atas satu layar untuk memicu windowing. */
const VIRTUALIZED_COUNT = 300;

interface Row {
  id: string;
  label: string;
}

// jsdom tidak menyediakan ResizeObserver, yang dipakai virtualizer untuk
// mengamati ukuran baris. Tanpa stub ini, render akan melempar.
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver;
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = StubResizeObserver;
});

afterEach(cleanup);

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({ id: `r${i}`, label: `Baris ${i}` }));
}

function renderList(count: number, props: Record<string, unknown> = {}) {
  return render(
    <VirtualList
      items={makeRows(count)}
      getKey={(r: Row) => r.id}
      plainClassName="daftar-biasa"
      {...props}
    >
      {(r: Row) => <div data-testid="row">{r.label}</div>}
    </VirtualList>,
  );
}

const rowCount = () => screen.queryAllByTestId('row').length;

describe('VirtualList', () => {
  describe('di bawah ambang — dirender biasa', () => {
    test('merender seluruh baris', () => {
      renderList(20, { virtualizeFrom: 60 });
      expect(rowCount()).toBe(20);
    });

    test('memakai plainClassName, tanpa tinggi semu maupun posisi absolut', () => {
      const { container } = renderList(5, { virtualizeFrom: 60 });

      // plainClassName-lah yang membawa `stagger-children`, jadi animasi masuk
      // baris tetap hidup untuk daftar pendek.
      expect(container.querySelector('.daftar-biasa')).not.toBeNull();
      expect(container.querySelector('[data-index]')).toBeNull();
      expect((container.firstElementChild as HTMLElement).style.height).toBe('');
    });

    test('daftar kosong tidak error', () => {
      renderList(0);
      expect(rowCount()).toBe(0);
    });
  });

  describe('di atas ambang — windowing aktif', () => {
    test('tidak merender seluruh baris', () => {
      renderList(VIRTUALIZED_COUNT, { virtualizeFrom: 60 });

      const rendered = rowCount();
      expect(rendered).toBeGreaterThan(0);
      expect(rendered).toBeLessThan(VIRTUALIZED_COUNT);
    });

    test('baris diberi data-index dan diposisikan absolut', () => {
      const { container } = renderList(VIRTUALIZED_COUNT, { virtualizeFrom: 60 });

      const rows = container.querySelectorAll('[data-index]');
      expect(rows.length).toBeGreaterThan(0);
      // data-index wajib ada: itu yang dipakai virtualizer untuk mengenali
      // baris mana yang sedang diukur.
      expect((rows[0] as HTMLElement).style.position).toBe('absolute');
    });

    test('ambang batas bisa diatur', () => {
      renderList(30, { virtualizeFrom: 10 });
      expect(rowCount()).toBeLessThan(30);
    });
  });
});
