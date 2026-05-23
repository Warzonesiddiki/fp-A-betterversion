import { openDB } from './indexedDBStorage';

export const CURRENT_VERSION = 1;
const MIGRATION_KEY = 'data-version';

export const MIGRATIONS: {
  version: number;
  description: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}[] = [
  // Add future migrations here:
  // { version: 2, description: 'Add currency field', migrate: (data) => ({ ...data, currency: 'USD' }) },
];

export async function getDataVersion(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readonly');
      const req = tx.objectStore('metadata').get(MIGRATION_KEY);
      req.onsuccess = () => resolve(req.result?.value ?? 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function setDataVersion(version: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('metadata', 'readwrite');
      tx.objectStore('metadata').put({ key: MIGRATION_KEY, value: version });
      tx.oncomplete = () => resolve();
    });
  } catch {
    /* fail silently */
  }
}

export async function runMigrations(): Promise<{ applied: number; errors: string[] }> {
  const errors: string[] = [];
  let applied = 0;
  const currentVersion = await getDataVersion();
  if (currentVersion >= CURRENT_VERSION) return { applied: 0, errors };

  const db = await openDB();

  for (const m of MIGRATIONS) {
    if (m.version > currentVersion) {
      try {
        const tx = db.transaction('stores', 'readwrite');
        const req = tx.objectStore('stores').getAll();

        await new Promise<void>((resolve, reject) => {
          req.onsuccess = () => {
            const data: Record<string, unknown> = {};
            for (const item of req.result) {
              data[item.id] = item.value;
            }
            const migrated = m.migrate(data);
            for (const [key, value] of Object.entries(migrated)) {
              tx.objectStore('stores').put({ id: key, value });
            }
            resolve();
          };
          req.onerror = () => reject(new Error(`Failed to read stores for migration ${m.version}`));
        });

        applied++;
      } catch (e) {
        const msg = `Migration ${m.version} (${m.description}) failed: ${e}`;
        errors.push(msg);
      }
    }
  }

  if (errors.length === 0) {
    await setDataVersion(CURRENT_VERSION);
  }
  return { applied, errors };
}
