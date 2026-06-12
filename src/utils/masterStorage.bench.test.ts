/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { masterStorage } from './masterStorage';
import { generateGLEntries } from '../services/mockData/generators';
import * as fs from 'fs';

// Mock IndexedDB since jsdom might not have it or it might be incomplete
const mockIndexedDB = () => {
  const storage: Record<string, any> = {};
  return {
    open: () => ({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      result: {
        objectStoreNames: {
          contains: () => true,
        },
        transaction: () => ({
          objectStore: () => ({
            get: (key: string) => ({
              onsuccess: null,
              result: storage[key]!,
            }),
            put: (item: any) => {
              storage[item.id] = item;
              return {};
            },
            count: () => ({
              onsuccess: null,
              result: Object.keys(storage).length,
            }),
          }),
          oncomplete: null,
        }),
      },
    }),
  };
};

describe('masterStorage Performance Profile', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && !window.indexedDB) {
      // Very basic mock to allow the storage layer to function
      (window as any).indexedDB = {
        open: () => {
          const req: any = {
            result: {
              objectStoreNames: { contains: () => true },
              createObjectStore: () => ({}),
              transaction: () => {
                const tx: any = {
                  objectStore: () => ({
                    put: () => ({}),
                    get: () => ({}),
                    count: () => ({}),
                    delete: () => ({}),
                  }),
                  oncomplete: null,
                  onerror: null,
                };
                // Trigger oncomplete in next tick to simulate async completion
                setTimeout(() => {
                  if (tx.oncomplete) tx.oncomplete({ target: tx } as any);
                }, 10);
                return tx;
              },
            },
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
          };
          setTimeout(() => {
            if (req.onsuccess) req.onsuccess({ target: req } as any);
          }, 10);
          return req;
        },
      };
    }
  });

  it('should profile importing 10,000 GL entries', async () => {
    const count = 10000;
    console.log(`Generating ${count} GL entries...`);
    const entries = generateGLEntries(count);
    console.log('Generation complete.');

    // Track main thread blocking
    let maxDelay = 0;
    let lastTime = performance.now();
    const checkInterval = 5; // ms
    const tracker = setInterval(() => {
      const now = performance.now();
      const delay = now - lastTime - checkInterval;
      if (delay > maxDelay) maxDelay = delay;
      lastTime = now;
    }, checkInterval);

    console.log('Starting write to masterStorage...');
    const start = performance.now();

    // Simulate the state object that Zustand would pass to persist storage
    const stateToPersist = {
      state: {
        entries: entries,
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      },
      version: 0,
    };

    await masterStorage.setItem('gl-entries-benchmark', stateToPersist);

    const end = performance.now();
    const duration = end - start;

    clearInterval(tracker);
    console.log('Write complete.');

    const isTauriEnv =
      typeof window !== 'undefined' && ('__TAURI_INTERNALS' in window || '__TAURI__' in window);

    const logHeader = fs.existsSync('PERFORMANCE_LOG.md') ? '' : '# Performance Log\n\n';
    const results = `
## masterStorage Profile - ${new Date().toLocaleString()}
- **Entries Simulated**: ${count.toLocaleString()}
- **Total Write Latency**: ${duration.toFixed(2)}ms
- **Average Latency per Entry**: ${(duration / count).toFixed(4)}ms
- **Max Main-Thread Blocking**: ${maxDelay.toFixed(2)}ms
- **Storage Backend**: ${isTauriEnv ? 'SQLite (Tauri)' : 'IndexedDB (Mocked/JSDOM)'}
- **Data Size (Approx)**: ${(JSON.stringify(stateToPersist).length / (1024 * 1024)).toFixed(2)} MB

---
`;

    fs.appendFileSync('PERFORMANCE_LOG.md', logHeader + results);
    console.log(results);

    expect(duration).toBeGreaterThan(0);
  }, 60000); // 30s timeout
});
