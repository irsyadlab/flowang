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

/**
 * Generate a deterministic UUID v5-style ID for a default category.
 * Uses SHA-256 of "flowang-default-category:<name>:<type>" so every device
 * always produces the same ID for the same category — required for CRDT sync
 * to treat them as the same entity rather than duplicates.
 */
async function deterministicCategoryId(name: string, type: string): Promise<string> {
  const input = `flowang-default-category:${name}:${type}`;
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(hashBuffer);

  // Format first 16 bytes as a UUID (variant 4 layout for readability)
  const hex = Array.from(bytes.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    // Set version bits to 5 (name-based SHA)
    `5${hex.slice(13, 16)}`,
    // Set variant bits to 10xx
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hex.slice(18, 20),
    hex.slice(20, 32),
  ].join('-');
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
      // Deterministic ID so all devices generate the same ID for the same
      // default category — prevents duplicate entries after CRDT sync.
      id: await deterministicCategoryId(cat.name, cat.type),
      createdAt: now,
    };
    await addCategory(db, category);
  }
}