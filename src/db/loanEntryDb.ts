import type { LoanEntry } from '../types';
import { localISOString } from '../lib/utils';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllEntries(db: IDBDatabase): Promise<LoanEntry[]> {
  const tx = db.transaction('loan_entries', 'readonly');
  const store = tx.objectStore('loan_entries');
  const request = store.getAll();
  return requestToPromise(request);
}

export async function getEntryById(db: IDBDatabase, id: string): Promise<LoanEntry | undefined> {
  const tx = db.transaction('loan_entries', 'readonly');
  const store = tx.objectStore('loan_entries');
  const request = store.get(id);
  return requestToPromise(request);
}

export async function getEntriesByContactId(db: IDBDatabase, contactId: string): Promise<LoanEntry[]> {
  const tx = db.transaction('loan_entries', 'readonly');
  const store = tx.objectStore('loan_entries');
  const index = store.index('by_contactId');
  const request = index.getAll(contactId);
  return requestToPromise(request);
}

/**
 * Validates that a Category with the given id exists in the `categories` object store.
 * Must be called within an IDBTransaction that includes the `categories` store.
 * Rejects with an error if the category is not found.
 */
function validateCategoryId(
  categoriesStore: IDBObjectStore,
  categoryId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = categoriesStore.get(categoryId);
    request.onsuccess = () => {
      if (request.result == null) {
        reject(new Error(`Category with id "${categoryId}" not found`));
      } else {
        resolve();
      }
    };
    request.onerror = () =>
      reject(new Error(`Category validation failed: ${request.error?.message || 'Unknown error'}`));
  });
}

export async function addEntry(db: IDBDatabase, entry: LoanEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const storeNames: string[] = ['loan_entries'];
    if (entry.categoryId) storeNames.push('categories');

    const tx = db.transaction(storeNames, 'readwrite');
    tx.onerror = () => reject(new Error(`Add entry failed: ${tx.error?.message || 'Unknown error'}`));
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const run = async () => {
      try {
        if (entry.categoryId) {
          const categoriesStore = tx.objectStore('categories');
          await validateCategoryId(categoriesStore, entry.categoryId);
        }
        const store = tx.objectStore('loan_entries');
        store.add(entry);
        tx.oncomplete = () => resolve();
      } catch (err) {
        tx.abort();
        reject(err);
      }
    };

    run();
  });
}

export async function updateEntry(db: IDBDatabase, id: string, entry: LoanEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_entries', 'readwrite');
    const store = tx.objectStore('loan_entries');
    const request = store.put({ ...entry, id });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Update entry failed: ${request.error?.message || 'Unknown error'}`));
  });
}

export async function deleteEntry(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_entries', 'readwrite');
    const store = tx.objectStore('loan_entries');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Delete entry failed: ${request.error?.message || 'Unknown error'}`));
  });
}

export async function toggleEntryStatus(db: IDBDatabase, id: string): Promise<LoanEntry> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_entries', 'readwrite');
    const store = tx.objectStore('loan_entries');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const entry = getReq.result as LoanEntry | undefined;
      if (!entry) {
        reject(new Error('Entry not found'));
        return;
      }
      const now = localISOString();
      const updated: LoanEntry = {
        ...entry,
        status: entry.status === 'active' ? 'settled' : 'active',
        settledAt: entry.status === 'active' ? now : undefined,
        updatedAt: now,
      };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };

    tx.onerror = () => reject(new Error(`Toggle entry status failed: ${tx.error?.message || 'Unknown error'}`));
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}

export async function markAllSettled(db: IDBDatabase, contactId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_entries', 'readwrite');
    const store = tx.objectStore('loan_entries');
    const index = store.index('by_contactId');
    const getAllReq = index.getAll(contactId);

    getAllReq.onsuccess = () => {
      const entries = getAllReq.result as LoanEntry[];
      const now = localISOString();
      for (const entry of entries) {
        if (entry.status === 'active') {
          store.put({
            ...entry,
            status: 'settled',
            settledAt: now,
            updatedAt: now,
          });
        }
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Mark all settled failed: ${tx.error?.message || 'Unknown error'}`));
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
