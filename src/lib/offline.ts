const DB_NAME = 'barberia-spa-offline';
const DB_VERSION = 1;
const STORE_QUEUE = 'syncQueue';
const STORE_CACHE = 'dataCache';

export interface QueuedOperation {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  createdAt: string;
  description: string;
}

export interface CachedData {
  key: string;
  data: unknown;
  cachedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOperation(op: Omit<QueuedOperation, 'id' | 'createdAt'>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  const store = tx.objectStore(STORE_QUEUE);
  const entry: QueuedOperation = {
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  store.add(entry);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readonly');
  const store = tx.objectStore(STORE_QUEUE);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as QueuedOperation[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOperation(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, 'readwrite');
  tx.objectStore(STORE_QUEUE).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheData(key: string, data: unknown): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_CACHE, 'readwrite');
  tx.objectStore(STORE_CACHE).put({ key, data, cachedAt: new Date().toISOString() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedData<T = unknown>(key: string): Promise<CachedData & { data: T } | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_CACHE, 'readonly');
  const request = tx.objectStore(STORE_CACHE).get(key);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as CachedData & { data: T }) ?? null);
    request.onerror = () => reject(request.error);
  });
}