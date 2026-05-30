const DB_NAME = 'flowang-db';
const DB_VERSION = 3;
const DB_TIMEOUT = 5000; // 5 detik

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  // Return singleton jika sudah ada
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const upgradeTransaction = (event.target as IDBOpenDBRequest).transaction!;
      const oldVersion = event.oldVersion;

      // ── Schema v1 / v2: buat semua object store awal ──────────────────────

      // Create wallets store
      if (!db.objectStoreNames.contains('wallets')) {
        db.createObjectStore('wallets', { keyPath: 'id' });
      }

      // Create transactions store dengan indexes
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by_walletId', 'walletId', { unique: false });
        txStore.createIndex('by_date', 'date', { unique: false });
        txStore.createIndex('by_type', 'type', { unique: false });
        txStore.createIndex('by_categoryId', 'categoryId', { unique: false });
      }

      // Create categories store
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      // Create loan_contacts store
      if (!db.objectStoreNames.contains('loan_contacts')) {
        db.createObjectStore('loan_contacts', { keyPath: 'id' });
      }

      // Create loan_entries store dengan indexes
      if (!db.objectStoreNames.contains('loan_entries')) {
        const loanStore = db.createObjectStore('loan_entries', { keyPath: 'id' });
        loanStore.createIndex('by_contactId', 'contactId', { unique: false });
        loanStore.createIndex('by_date', 'date', { unique: false });
        loanStore.createIndex('by_status', 'status', { unique: false });
      }

      // ── Schema v3: tambah loan_repayments dan migrasi loan_entries ─────────

      // Tambah object store loan_repayments (baru di v3)
      if (!db.objectStoreNames.contains('loan_repayments')) {
        const repaymentStore = db.createObjectStore('loan_repayments', { keyPath: 'id' });
        repaymentStore.createIndex('by_loanEntryId', 'loanEntryId', { unique: false });
      }

      // Migrasi dari v2 ke v3: set default field baru pada semua loan_entries yang ada
      if (oldVersion < 3) {
        const loanEntriesStore = upgradeTransaction.objectStore('loan_entries');
        const cursorRequest = loanEntriesStore.openCursor();

        cursorRequest.onsuccess = (cursorEvent) => {
          const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const record = cursor.value as Record<string, unknown>;

            // Set default values untuk field baru jika belum ada
            if (!('remainingAmount' in record) || record['remainingAmount'] === undefined) {
              record['remainingAmount'] = record['amount'];
            }
            if (!('categoryId' in record)) {
              record['categoryId'] = undefined;
            }
            if (!('linkedTransactionId' in record)) {
              record['linkedTransactionId'] = undefined;
            }

            cursor.update(record);
            cursor.continue();
          }
        };
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      // Requirements 7.2: tangani error inisialisasi DB
      reject(new Error(`IndexedDB error: ${request.error?.message || 'Unknown error'}`));
    };

    request.onblocked = () => {
      // Requirements 7.2: tangani kasus DB diblokir oleh tab lain
      reject(new Error('IndexedDB upgrade blocked: close other tabs and try again'));
    };
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`IndexedDB timeout after ${DB_TIMEOUT}ms`)), DB_TIMEOUT);
  });

  return Promise.race([dbPromise, timeoutPromise]);
}

// Export untuk akses DB instance langsung (bila perlu)
export function getDB(): IDBDatabase | null {
  return dbInstance;
}

// Tutup koneksi DB (untuk testing)
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}