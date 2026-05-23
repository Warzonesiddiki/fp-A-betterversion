export function useIndexedDB(dbName: string, storeName: string) {
  const openDB = (): Promise<IDBDatabase | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  };

  const getItem = async <T>(key: string): Promise<T | null> => {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => resolve(null);
    });
  };

  const setItem = async <T>(key: string, value: T): Promise<void> => {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  };

  const removeItem = async (key: string): Promise<void> => {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  };

  const clear = async (): Promise<void> => {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  };

  const getAll = async <T>(): Promise<T[]> => {
    const db = await openDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => resolve([]);
    });
  };

  return { getItem, setItem, removeItem, clear, getAll };
}
