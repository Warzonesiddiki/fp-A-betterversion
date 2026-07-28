/**
 * Storage serialization — the single implementation of the chunking contract
 * shared by the storage Web Worker and the main-thread fallback.
 *
 * F-0025 root cause context: `wrapChunkedStorage` delegated stringify/parse to
 * `storagePool`. When the environment cannot construct a Worker (no `Worker`
 * global, CSP refusal, module-worker unsupported), persistence became
 * impossible — previously it hung forever, and after the WorkerPool fix it
 * failed loudly. Neither is acceptable for a local-first financial app whose
 * data lives in that store, so the work is performed inline instead.
 *
 * The worker remains the default path (it keeps multi-megabyte JSON.stringify
 * off the UI thread). This module is the correctness floor beneath it, and both
 * paths must produce byte-identical output — enforced by
 * src/utils/storageSerialization.test.ts.
 */

export interface SerializedPayload {
  /** Present when the JSON fits in a single chunk. */
  payload?: string;
  /** Present when the JSON exceeded `chunkSize` and was split. */
  chunks?: string[];
  /** Total JSON length in characters, set only when chunked. */
  totalSize?: number;
}

/**
 * Serialize a value to JSON and split it into `chunkSize` slices when large.
 * Mirrors src/workers/storage.worker.ts exactly.
 */
export function serializeForStorage(value: unknown, chunkSize: number): SerializedPayload {
  const json = JSON.stringify(value);

  if (json.length <= chunkSize) {
    return { payload: json };
  }

  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += chunkSize) {
    chunks.push(json.slice(i, i + chunkSize));
  }
  return { chunks, totalSize: json.length };
}

/** Rejoin chunks (or accept a whole string) and parse. Mirrors the worker. */
export function deserializeFromStorage(payload: string | string[]): unknown {
  const json = Array.isArray(payload) ? payload.join('') : payload;
  return JSON.parse(json);
}
