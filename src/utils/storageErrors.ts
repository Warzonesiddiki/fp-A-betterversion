/**
 * Typed errors for the RAW storage backends (sqlJsStorage / tauriSqlStorage).
 *
 * W6-P0-04: these backends previously caught every failure, logged it, and
 * returned `null` / swallowed it. That made every recovery branch ABOVE them
 * dead code — masterStorage's fail-closed read path (N-0002), its
 * quota-exceeded handling (F-0011), and corrupted-data recovery could never
 * execute because failures never reached them. A failed read was
 * indistinguishable from "no data", so a broken backend hydrated EMPTY stores
 * that were presented as the user's real financial data.
 *
 * Raw backends now wrap their operation failures in StorageBackendError.
 * Absent keys remain plain `null` — absence is data, failure is an error.
 */

/** Which low-level operation failed. */
export type StorageBackendOperation = 'get' | 'set' | 'remove';

/**
 * A raw storage backend operation failed. Thrown by sqlJsStorage /
 * tauriSqlStorage instead of being logged-and-swallowed; upper layers
 * (chunkedStorage → masterStorage) translate this into their own typed
 * read/write errors and surface it via subscribeStorageErrors.
 */
export class StorageBackendError extends Error {
  readonly operation: StorageBackendOperation;
  readonly storeKey: string;

  constructor(operation: StorageBackendOperation, storeKey: string, cause?: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`Storage backend ${operation}("${storeKey}") failed: ${reason}`);
    this.name = 'StorageBackendError';
    this.operation = operation;
    this.storeKey = storeKey;
    if (cause !== undefined) this.cause = cause;
  }
}
