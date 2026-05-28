import type { Category } from '../types';
import { localISOString } from '../lib/utils';

// Helper: wrap IDBRequest to Promise
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 9 kategori default
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  // Expense categories
  { name: 'Makanan & Minuman', type: 'expense', isDefault: true },
  { name: 'Transportasi', type: 'expense', isDefault: true },
  { name: 'Belanja', type: 'expense', isDefault: true },
  { name: 'Kesehatan', type: 'expense', isDefault: true },
  { name: 'Hiburan', type: 'expense', isDefault: true },
  // Income categories
  { name: 'Gaji', type: 'income', isDefault: true },
  { name: 'Freelance', type: 'income', isDefault: true },
  { name: 'Investasi', type: 'income', isDefault: true },
  { name: 'Hadiah', type: 'income', isDefault: true },
];

function generateId(): string {
  return crypto.randomUUID();
}

// Get all categories
export async function getAllCategories(db: IDBDatabase): Promise<Category[]> {
  const tx = db.transaction('categories', 'readonly');
  const store = tx.objectStore('categories');
  const request = store.getAll();
  return requestToPromise(request);
}

// Get category by ID
export async function getCategoryById(db: IDBDatabase, id: string): Promise<Category | undefined> {
  const tx = db.transaction('categories', 'readonly');
  const store = tx.objectStore('categories');
  const request = store.get(id);
  return requestToPromise(request);
}

// Add new category
export async function addCategory(db: IDBDatabase, category: Category): Promise<void> {
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  const request = store.add(category);
  await requestToPromise(request);
}

// Update existing category
export async function updateCategory(db: IDBDatabase, category: Category): Promise<void> {
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  const request = store.put(category);
  await requestToPromise(request);
}

// Delete category
export async function deleteCategory(db: IDBDatabase, id: string): Promise<void> {
  const tx = db.transaction('categories', 'readwrite');
  const store = tx.objectStore('categories');
  const request = store.delete(id);
  await requestToPromise(request);
}

// Seed default categories if empty
export async function seedDefaultCategories(db: IDBDatabase): Promise<void> {
  const existing = await getAllCategories(db);
  if (existing.length > 0) return; // Already seeded

  const now = localISOString();
  for (const cat of DEFAULT_CATEGORIES) {
    const category: Category = {
      ...cat,
      id: generateId(),
      createdAt: now,
    };
    await addCategory(db, category);
  }
}