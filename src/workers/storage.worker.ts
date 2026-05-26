/**
 * Storage Worker
 * Handles heavy JSON serialization/deserialization and chunking.
 * Follows the WorkerMessage/WorkerResponse pattern.
 */

import type { WorkerMessage, WorkerResponse } from './types';

export interface StorageRequest {
  type: 'stringify' | 'parse';
  payload: any;
  chunkSize?: number;
}

export interface StorageResult {
  payload?: any;
  chunks?: string[];
  totalSize?: number;
}

self.onmessage = (e: MessageEvent<WorkerMessage<StorageRequest>>) => {
  const { id, payload: request } = e.data;
  const { type, payload, chunkSize = 1024 * 1024 } = request;

  try {
    if (type === 'stringify') {
      const json = JSON.stringify(payload);

      if (json.length <= chunkSize) {
        const response: WorkerResponse<StorageResult> = {
          id,
          type: 'result',
          payload: { payload: json },
        };
        self.postMessage(response);
      } else {
        const chunks: string[] = [];
        for (let i = 0; i < json.length; i += chunkSize) {
          chunks.push(json.slice(i, i + chunkSize));
        }
        const response: WorkerResponse<StorageResult> = {
          id,
          type: 'result',
          payload: { chunks, totalSize: json.length },
        };
        self.postMessage(response);
      }
    } else if (type === 'parse') {
      const json = Array.isArray(payload) ? payload.join('') : payload;
      const data = JSON.parse(json);

      const response: WorkerResponse<StorageResult> = {
        id,
        type: 'result',
        payload: { payload: data },
      };
      self.postMessage(response);
    }
  } catch (err: unknown) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
