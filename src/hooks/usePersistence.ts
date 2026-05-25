import { useCallback, useEffect, useState } from 'react';
import { masterStorage } from '@/utils/masterStorage';

export interface PersistenceOptions {
  key: string;
  storage?: 'master' | 'localstorage';
  version?: number;
  migrate?: (old: unknown, oldVersion: number) => unknown;
}

export function usePersistence<T>(options: PersistenceOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    try {
      let stored: unknown;
      if (options.storage === 'localstorage') {
        const val = localStorage.getItem(options.key);
        stored = val ? JSON.parse(val) : null;
      } else {
        const val = await masterStorage.getItem(options.key);
        stored = val ? JSON.parse(String(val)) : null;
      }

      const storedRecord = stored as Record<string, unknown> | null;
      if (storedRecord && options.version && storedRecord._version !== options.version) {
        if (options.migrate) {
          stored = options.migrate(storedRecord, (storedRecord._version as number) || 0);
        }
      }

      const result = storedRecord ? (storedRecord._data as T) : null;
      setData(result);
      return result;
    } catch (_e) {
      setError('Failed to load data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.key, options.storage, options.version, options.migrate]);

  const save = async (newData: T) => {
    try {
      const wrapper = { _data: newData, _version: options.version || 0 };
      const serialized = JSON.stringify(wrapper);
      if (options.storage === 'localstorage') {
        localStorage.setItem(options.key, serialized);
      } else {
        await masterStorage.setItem(options.key, serialized as any);
      }
      setData(newData);
    } catch (_e) {
      setError('Failed to save data');
    }
  };

  const clear = async () => {
    try {
      if (options.storage === 'localstorage') {
        localStorage.removeItem(options.key);
      } else {
        await masterStorage.removeItem(options.key);
      }
      setData(null);
    } catch (_e) {
      setError('Failed to clear data');
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return { data, save, load, clear, isLoading, error };
}
