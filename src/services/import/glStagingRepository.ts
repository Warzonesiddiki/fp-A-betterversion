/** Temporary staging on the existing encrypted masterStorage backend, not a second ledger. */
import { masterStorage } from '@/utils/masterStorage';
import type { GLIngestResult, VoucherImbalance } from '@/types/glIngestion';

export interface GLStagingManifest {
  readonly version: 1;
  readonly batchId: string;
  readonly fileHash: string;
  readonly sourceId: string;
  readonly status: 'staging' | 'ready' | 'blocked' | 'failed';
  readonly chunkCount: number;
  readonly rowCount: number;
  readonly acceptedCount: number;
  readonly quarantinedCount: number;
  readonly schemaErrors: readonly string[];
  readonly controlTotals: GLIngestResult['controlTotals'];
  readonly unbalancedVouchers: readonly VoucherImbalance[];
  readonly failure?: string;
}
export interface StagingStoragePort {
  getItem(key: string): Promise<unknown>;
  setItem(key: string, value: unknown): Promise<void>;
}
export interface GLStagingRepository {
  readManifest(batchId: string): Promise<GLStagingManifest | null>;
  writeManifest(manifest: GLStagingManifest): Promise<void>;
  readChunk(batchId: string, index: number): Promise<GLIngestResult | null>;
  writeChunk(batchId: string, index: number, chunk: GLIngestResult): Promise<void>;
}
function prefix(batchId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(batchId)) throw new Error('Invalid GL staging batch ID.');
  return `gl-ingestion-stage:v1:${batchId}`;
}
function chunkKey(batchId: string, index: number) {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error('Invalid GL staging chunk index.');
  return `${prefix(batchId)}:chunk:${index}`;
}
/**
 * Opaque JSON payload prevents money-tag decoding of untrusted raw quarantine
 * strings (e.g. "$d:123"). masterStorage still encrypts/chunks the envelope.
 * Staging keys are not yet part of backup/restore or a native relational schema.
 */
export function createGLStagingRepository(
  storage: StagingStoragePort = {
    getItem: async (key) => masterStorage.getItem(key),
    setItem: async (key, value) => masterStorage.setItem(key, value),
  }
): GLStagingRepository {
  async function read<T>(key: string): Promise<T | null> {
    const saved = await storage.getItem(key);
    if (saved === null) return null;
    if (
      typeof saved !== 'object' ||
      saved === null ||
      !('version' in saved) ||
      saved.version !== 1 ||
      !('state' in saved) ||
      typeof saved.state !== 'object' ||
      saved.state === null ||
      !('payload' in saved.state) ||
      typeof saved.state.payload !== 'string'
    ) {
      throw new Error(`Invalid GL staging storage envelope: ${key}`);
    }
    const value: unknown = JSON.parse(saved.state.payload);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Invalid GL staging payload: ${key}`);
    }
    return value as T;
  }
  async function write(key: string, value: unknown) {
    await storage.setItem(key, { version: 1, state: { payload: JSON.stringify(value) } });
  }
  return {
    readManifest: async (id) => read<GLStagingManifest>(`${prefix(id)}:manifest`),
    writeManifest: async (manifest) => write(`${prefix(manifest.batchId)}:manifest`, manifest),
    readChunk: async (id, index) => read<GLIngestResult>(chunkKey(id, index)),
    writeChunk: async (id, index, chunk) => write(chunkKey(id, index), chunk),
  };
}
