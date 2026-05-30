import type { Repayment } from '../types';

// Helper: wrap IDBRequest to Promise
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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

// Get all repayments
export async function getAllRepayments(db: IDBDatabase): Promise<Repayment[]> {
  const tx = db.transaction('loan_repayments', 'readonly');
  const store = tx.objectStore('loan_repayments');
  const request = store.getAll();
  return requestToPromise(request);
}

// Get repayments by loan entry ID (using index)
export async function getRepaymentsByLoanEntryId(
  db: IDBDatabase,
  loanEntryId: string
): Promise<Repayment[]> {
  const tx = db.transaction('loan_repayments', 'readonly');
  const store = tx.objectStore('loan_repayments');
  const index = store.index('by_loanEntryId');
  const request = index.getAll(loanEntryId);
  return requestToPromise(request);
}

// Get repayment by ID
export async function getRepaymentById(
  db: IDBDatabase,
  id: string
): Promise<Repayment | undefined> {
  const tx = db.transaction('loan_repayments', 'readonly');
  const store = tx.objectStore('loan_repayments');
  const request = store.get(id);
  return requestToPromise(request);
}

// Add a new repayment
export async function addRepayment(db: IDBDatabase, repayment: Repayment): Promise<void> {
  return new Promise((resolve, reject) => {
    const storeNames: string[] = ['loan_repayments'];
    if (repayment.categoryId) storeNames.push('categories');

    const tx = db.transaction(storeNames, 'readwrite');
    tx.onerror = () =>
      reject(new Error(`Add repayment failed: ${tx.error?.message || 'Unknown error'}`));
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const run = async () => {
      try {
        if (repayment.categoryId) {
          const categoriesStore = tx.objectStore('categories');
          await validateCategoryId(categoriesStore, repayment.categoryId);
        }
        const store = tx.objectStore('loan_repayments');
        store.add(repayment);
        tx.oncomplete = () => resolve();
      } catch (err) {
        tx.abort();
        reject(err);
      }
    };

    run();
  });
}

// Delete a repayment by ID
export async function deleteRepayment(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_repayments', 'readwrite');
    const store = tx.objectStore('loan_repayments');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(new Error(`Delete repayment failed: ${request.error?.message || 'Unknown error'}`));
  });
}

// Delete all repayments for a given loan entry ID
export async function deleteRepaymentsByLoanEntryId(
  db: IDBDatabase,
  loanEntryId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_repayments', 'readwrite');
    const store = tx.objectStore('loan_repayments');
    const index = store.index('by_loanEntryId');
    const request = index.getAll(loanEntryId);

    request.onsuccess = () => {
      const repayments = request.result as Repayment[];
      for (const repayment of repayments) {
        store.delete(repayment.id);
      }
    };

    request.onerror = () =>
      reject(
        new Error(
          `Get repayments for deletion failed: ${request.error?.message || 'Unknown error'}`
        )
      );

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(
        new Error(
          `Delete repayments by loanEntryId failed: ${tx.error?.message || 'Unknown error'}`
        )
      );
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
