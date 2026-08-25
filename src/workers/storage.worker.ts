/**
 * Storage Worker
 * Handles heavy JSON serialization/deserialization and chunking.
 * Follows the WorkerMessage/WorkerResponse pattern.
 */

import type { WorkerMessage, WorkerResponse } from './types';
import {
  WorkerRequestError,
  expectFiniteNumber,
  expectStringEnum,
  readMessageId,
  readMessagePayload,
} from './validateRequest';

export interface StorageRequest {
  type: 'stringify' | 'parse';
  payload: unknown;
  chunkSize?: number;
}

export interface StorageResult {
  payload?: unknown;
  chunks?: string[];
  totalSize?: number;
}

self.onmessage = (e: MessageEvent<WorkerMessage<StorageRequest>>) => {
  // W7E/W6-P1: destructuring moved INSIDE try — a null/garbage message used
  // to throw before the catch block and crash the worker uncaught with no
  // reply. The request type is enum-validated (unknown types previously fell
  // through as silent no-ops) and chunkSize must be >= 1 (chunkSize 0 made
  // the chunker loop forever on `i += 0`).
  const envelope: unknown = e.data;
  const id = readMessageId(envelope);

  try {
    const rawRequest = readMessagePayload(envelope);
    if (rawRequest === null || typeof rawRequest !== 'object') {
      throw new WorkerRequestError('request must be an object');
    }
    const request = rawRequest as Record<string, unknown>;
    const type = expectStringEnum(request.type, 'type', ['stringify', 'parse']);

    let chunkSize = 1024 * 1024;
    if (request.chunkSize !== undefined) {
      chunkSize = expectFiniteNumber(request.chunkSize, 'chunkSize');
      if (chunkSize < 1) {
        throw new WorkerRequestError('chunkSize must be >= 1');
      }
    }

    const payload = request.payload;
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
      const json = Array.isArray(payload)
        ? payload.join('')
        : typeof payload === 'string'
          ? payload
          : String(payload);
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
