import type { LoanContact } from '../types';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllContacts(db: IDBDatabase): Promise<LoanContact[]> {
  const tx = db.transaction('loan_contacts', 'readonly');
  const store = tx.objectStore('loan_contacts');
  const request = store.getAll();
  return requestToPromise(request);
}

export async function getContactById(db: IDBDatabase, id: string): Promise<LoanContact | undefined> {
  const tx = db.transaction('loan_contacts', 'readonly');
  const store = tx.objectStore('loan_contacts');
  const request = store.get(id);
  return requestToPromise(request);
}

export async function addContact(db: IDBDatabase, contact: LoanContact): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_contacts', 'readwrite');
    const store = tx.objectStore('loan_contacts');
    const request = store.add(contact);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Add contact failed: ${request.error?.message || 'Unknown error'}`));
  });
}

export async function updateContact(db: IDBDatabase, id: string, contact: LoanContact): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('loan_contacts', 'readwrite');
    const store = tx.objectStore('loan_contacts');
    const request = store.put({ ...contact, id });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Update contact failed: ${request.error?.message || 'Unknown error'}`));
  });
}

export async function deleteContact(db: IDBDatabase, contactId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['loan_contacts', 'loan_entries'], 'readwrite');
    const contactStore = tx.objectStore('loan_contacts');
    const entryStore = tx.objectStore('loan_entries');
    const index = entryStore.index('by_contactId');
    const request = index.getAllKeys(contactId);

    request.onsuccess = () => {
      const entryIds = request.result as string[];
      for (const entryId of entryIds) {
        entryStore.delete(entryId);
      }
      contactStore.delete(contactId);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Delete contact failed: ${tx.error?.message || 'Unknown error'}`));
    tx.onabort = () => reject(new Error('Transaction aborted'));
  });
}
