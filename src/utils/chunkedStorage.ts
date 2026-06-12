/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PersistStorage } from 'zustand/middleware';
import { CHUNK_SIZE } from './storageConstants';
import { createStoragePool } from '../workers/worker-pool';

import type { StorageRequest, StorageResult } from '../workers/storage.worker';

const storagePool = createStoragePool();

export interface StorageMetadata {
  _isChunked: boolean;
  chunkCount: number;
  totalSize: number;
  timestamp: number;
}

export function wrapChunkedStorage(storage: PersistStorage<any>): PersistStorage<any> {
  return {
    getItem: async (name) => {
      const meta = await storage.getItem(name);

      if (meta && typeof meta === 'object' && (meta as any)._isChunked) {
        const { chunkCount } = meta as unknown as StorageMetadata;
        const chunkPromises = [];

        for (let i = 0; i < chunkCount; i++) {
          chunkPromises.push(storage.getItem(`${name}:chunk:${i}`));
        }

        const chunks = await Promise.all(chunkPromises);

        // Use worker to parse large string
        const result = await storagePool.run<StorageResult>({
          type: 'parse',
          payload: chunks,
        } as StorageRequest);

        return result.payload;
      }

      return meta;
    },

    setItem: async (name, value) => {
      // Use worker to stringify and chunk
      const result = await storagePool.run<StorageResult>({
        type: 'stringify',
        payload: value,
        chunkSize: CHUNK_SIZE,
      } as StorageRequest);

      if (result.chunks) {
        // Large payload - store in chunks
        const metadata: StorageMetadata = {
          _isChunked: true,
          chunkCount: result.chunks.length,
          totalSize: result.totalSize!,
          timestamp: Date.now(),
        };

        // Store metadata first
        await storage.setItem(name, metadata as any);

        // Store chunks in parallel
        await Promise.all(
          result.chunks.map((chunk: string, i: number) =>
            storage.setItem(`${name}:chunk:${i}`, { value: chunk } as any)
          )
        );
      } else {
        // Small payload - store normally (pre-stringified to avoid jank in engine if it does stringify)
        await storage.setItem(name, result.payload);

        // Cleanup safety (limit to 10 chunks as mentioned before)
        for (let i = 0; i < 10; i++) {
          await storage.removeItem(`${name}:chunk:${i}`);
        }
      }
    },

    removeItem: async (name) => {
      const meta = await storage.getItem(name);
      await storage.removeItem(name);

      if (meta && typeof meta === 'object' && (meta as any)._isChunked) {
        const { chunkCount } = meta as unknown as StorageMetadata;
        for (let i = 0; i < chunkCount; i++) {
          await storage.removeItem(`${name}:chunk:${i}`);
        }
      }
    },
  };
}
