/**
 * VirtualList - merender hanya baris yang terlihat di layar (windowing).
 *
 * Dipakai untuk daftar yang panjangnya tidak dibatasi apa pun — terutama daftar
 * transaksi sebuah wallet, yang menampilkan seluruh riwayat tanpa filter
 * periode. Tanpa windowing, tiga tahun pemakaian berarti ribuan node DOM
 * sekaligus, masing-masing dengan langganan store dan animasi CSS-nya sendiri.
 *
 * Beberapa keputusan penting:
 *
 * - **Scroll mengikuti window, bukan container dalam.** Halaman ini punya sticky
 *   header dan bottom nav yang mengandalkan scroll dokumen. Memakai container
 *   ber-scroll sendiri akan memunculkan scrollbar bersarang dan merusak
 *   perilaku sticky-nya. Karena itu dipakai `useWindowVirtualizer` + `scrollMargin`.
 *
 * - **Tinggi baris diukur, bukan diasumsikan.** Baris transaksi bisa punya dua
 *   atau tiga baris teks tergantung ada tidaknya catatan, jadi tinggi tetap akan
 *   membuat posisi meleset. `measureElement` mengukur tiap baris yang dirender.
 *
 * - **Jarak antar baris jadi padding, bukan `gap`.** Baris diposisikan absolut,
 *   sehingga `gap` milik flexbox tidak berlaku lagi.
 *
 * Catatan aksesibilitas: baris yang berada di luar layar tidak ada di DOM, jadi
 * pencarian bawaan browser (Ctrl+F) tidak menemukannya. Itu konsekuensi wajar
 * dari windowing, dan alasan komponen ini hanya dipakai pada daftar yang memang
 * berpotensi sangat panjang.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  /** Kunci stabil per item — dipakai React untuk rekonsiliasi baris. */
  getKey: (item: T) => string;
  children: (item: T) => ReactNode;
  /** Perkiraan tinggi baris (px) sebelum diukur. Dekat saja sudah cukup. */
  estimateSize?: number;
  /** Jarak vertikal antar baris (px). */
  gap?: number;
  /** Jumlah baris ekstra di luar layar, supaya scroll cepat tidak menampilkan area kosong. */
  overscan?: number;
  /**
   * Jumlah minimum item sebelum windowing diaktifkan. Di bawah ambang ini,
   * semua item dirender biasa — lihat alasannya di `plainClassName`.
   */
  virtualizeFrom?: number;
  /** Class untuk container saat dirender biasa (di bawah ambang). */
  plainClassName?: string;
}

/** Tinggi khas satu baris transaksi tanpa catatan. */
const DEFAULT_ESTIMATE = 68;
const DEFAULT_GAP = 8;
const DEFAULT_OVERSCAN = 6;

/**
 * Di bawah jumlah ini, merender semuanya jelas lebih murah daripada mengelola
 * pengukuran dan posisi absolut — dan animasi masuk baris tetap utuh.
 * Kira-kira setara beberapa layar penuh pada ponsel.
 */
const DEFAULT_VIRTUALIZE_FROM = 60;

export default function VirtualList<T>({
  items,
  getKey,
  children,
  estimateSize = DEFAULT_ESTIMATE,
  gap = DEFAULT_GAP,
  overscan = DEFAULT_OVERSCAN,
  virtualizeFrom = DEFAULT_VIRTUALIZE_FROM,
  plainClassName,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Jarak container dari puncak dokumen. Virtualizer memerlukannya untuk
  // memetakan posisi scroll window ke indeks baris.
  //
  // Sengaja TIDAK memakai `offsetTop`: nilainya relatif terhadap offsetParent,
  // yang bisa berupa elemen mana pun yang ter-`position`. getBoundingClientRect
  // + scrollY selalu relatif terhadap dokumen.
  const measureOffset = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollMargin(el.getBoundingClientRect().top + window.scrollY);
  }, []);

  useLayoutEffect(() => {
    measureOffset();
  }, [measureOffset]);

  useEffect(() => {
    // Konten di atas daftar bisa berubah tinggi (header, ringkasan saldo, ganti
    // orientasi), dan itu menggeser titik awal daftar.
    window.addEventListener('resize', measureOffset);
    return () => window.removeEventListener('resize', measureOffset);
  }, [measureOffset]);

  const shouldVirtualize = items.length >= virtualizeFrom;

  // Hook tetap dipanggil tanpa syarat (aturan hooks). Saat tidak dipakai,
  // count 0 membuatnya tidak melakukan apa-apa.
  const virtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? items.length : 0,
    estimateSize: () => estimateSize + gap,
    scrollMargin,
    overscan,
  });

  if (!shouldVirtualize) {
    return (
      <div className={plainClassName} ref={containerRef}>
        {items.map((item) => (
          <div key={getKey(item)}>{children(item)}</div>
        ))}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}
    >
      {virtualItems.map((virtualRow) => {
        const item = items[virtualRow.index];
        if (item === undefined) return null;

        return (
          <div
            key={getKey(item)}
            // `data-index` wajib: measureElement memakainya untuk mengetahui
            // baris mana yang sedang diukur.
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            {/* Padding bawah menggantikan gap flexbox, dan ikut terukur sebagai
                bagian dari tinggi baris. */}
            <div style={{ paddingBottom: gap }}>{children(item)}</div>
          </div>
        );
      })}
    </div>
  );
}
