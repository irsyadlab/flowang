import type { Wallet } from '../types';

// Helper: wrap IDBRequest to Promise
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get all wallets
export async function getAllWallets(db: IDBDatabase): Promise<Wallet[]> {
  const tx = db.transaction('wallets', 'readonly');
  const store = tx.objectStore('wallets');
  const request = store.getAll();
  return requestToPromise(request);
}

// Get wallet by ID
export async function getWalletById(db: IDBDatabase, id: string): Promise<Wallet | undefined> {
  const tx = db.transaction('wallets', 'readonly');
  const store = tx.objectStore('wallets');
  const request = store.get(id);
  return requestToPromise(request);
}

// Add new wallet
export async function addWallet(db: IDBDatabase, wallet: Wallet): Promise<void> {
  const tx = db.transaction('wallets', 'readwrite');
  const store = tx.objectStore('wallets');
  const request = store.add(wallet);
  await requestToPromise(request);
}

// Update existing wallet
export async function updateWallet(db: IDBDatabase, wallet: Wallet): Promise<void> {
  const tx = db.transaction('wallets', 'readwrite');
  const store = tx.objectStore('wallets');
  const request = store.put(wallet);
  await requestToPromise(request);
}

// Delete wallet
export async function deleteWallet(db: IDBDatabase, id: string): Promise<void> {
  const tx = db.transaction('wallets', 'readwrite');
  const store = tx.objectStore('wallets');
  const request = store.delete(id);
  return requestToPromise(request);
}