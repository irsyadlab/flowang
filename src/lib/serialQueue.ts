/**
 * Antrian tugas async yang berjalan satu per satu.
 *
 * Dibuat untuk penerapan perubahan sync: Yjs memanggil observer secara sinkron
 * dan bisa beruntun, sementara handler-nya async (IndexedDB + reload store).
 * Tanpa serialisasi, dua handler saling menyalip dan bisa membaca state yang
 * setengah jadi.
 *
 * Dipisahkan dari syncManager supaya jaminannya — tidak pernah ada dua tugas
 * berjalan bersamaan, dan urutannya sesuai urutan masuk — bisa diuji langsung.
 * Menguji properti ini lewat efek sampingnya di syncManager tidak dapat
 * diandalkan: perhitungan saldo bersifat idempoten, jadi race sering kali
 * menghasilkan jawaban yang kebetulan benar.
 */

export interface SerialQueue {
  /** Antrikan sebuah tugas. Tidak melempar — error diteruskan ke `onError`. */
  enqueue(task: () => Promise<void>): void;
  /** Resolve setelah semua tugas yang sudah diantrikan selesai. */
  settled(): Promise<void>;
}

export function createSerialQueue(onError?: (error: unknown) => void): SerialQueue {
  let tail: Promise<void> = Promise.resolve();

  return {
    enqueue(task) {
      // Error ditangkap DI DALAM rantai supaya satu tugas yang gagal tidak
      // mematikan antrian untuk tugas-tugas berikutnya.
      tail = tail.then(task).catch((error) => {
        onError?.(error);
      });
    },

    settled() {
      return tail;
    },
  };
}
