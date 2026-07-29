/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapChunkedStorage, type StorageMetadata } from './chunkedStorage';

// Mock the worker pool so tests don't depend on a real worker.
vi.mock('../workers/worker-pool', () => ({
  createStoragePool: () => ({
    run: vi.fn(async (request: { type: string; payload: unknown }) => {
      if (request.type === 'parse') {
        // `wrapChunkedStorage` unwraps each persisted `{ value }` record into a
        // raw string BEFORE dispatching 'parse' (see chunkedStorage.ts). The
        // old mock re-read `.value` off those strings, produced "undefined"
        // and threw `SyntaxError: Unexpected end of JSON input` — a mock that
        // contradicted the production contract. Accept strings, and tolerate
        // `{ value }` records for robustness.
        const chunks = request.payload as Array<string | { value: string }>;
        const joined = chunks.map((c) => (typeof c === 'string' ? c : c?.value)).join('');
        return { payload: JSON.parse(joined) };
      }
      if (request.type === 'stringify') {
        return { payload: JSON.stringify(request.payload) };
      }
      if (request.type === 'chunk') {
        // payload: [data, chunkSize]
        const [data, chunkSize] = request.payload as [unknown, number];
        const str = JSON.stringify(data);
        const chunks: Array<{ value: string; isLast: boolean }> = [];
        for (let i = 0; i < str.length; i += chunkSize) {
          chunks.push({ value: str.slice(i, i + chunkSize), isLast: i + chunkSize >= str.length });
        }
        return { payload: chunks, totalSize: str.length, chunkCount: chunks.length };
      }
      return { payload: request.payload };
    }),
  }),
}));

function createMockStorage() {
  const store = new Map<string, unknown>();
  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    _store: store,
  };
}

describe('wrapChunkedStorage', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it('should return non-chunked data directly', async () => {
    const data = { state: { count: 42 }, version: 0 };
    mockStorage._store.set('test-key', data);

    const wrapped = wrapChunkedStorage(mockStorage as any);
    const result = await wrapped.getItem('test-key');

    expect(result).toEqual(data);
  });

  it('should return null for missing keys', async () => {
    const wrapped = wrapChunkedStorage(mockStorage as any);
    const result = await wrapped.getItem('missing');

    expect(result).toBeNull();
  });

  it('should reassemble chunked data', async () => {
    const metadata: StorageMetadata = {
      _isChunked: true,
      chunkCount: 2,
      totalSize: 100,
      timestamp: Date.now(),
    };

    // The worker mock joins {value: string} chunks by extracting .value
    // Provide chunks that form a single valid JSON object when concatenated
    const fullPayload = JSON.stringify({ state: { value: 'hello' }, version: 0 });
    const mid = Math.ceil(fullPayload.length / 2);
    const chunk0Str = fullPayload.slice(0, mid);
    const chunk1Str = fullPayload.slice(mid);

    mockStorage.getItem
      .mockResolvedValueOnce(metadata)
      .mockResolvedValueOnce({ value: chunk0Str })
      .mockResolvedValueOnce({ value: chunk1Str });

    const wrapped = wrapChunkedStorage(mockStorage as any);
    const result = await wrapped.getItem('test-key');

    expect(result).toEqual({ state: { value: 'hello' }, version: 0 });
    expect(mockStorage.getItem).toHaveBeenCalledWith('test-key');
    expect(mockStorage.getItem).toHaveBeenCalledWith('test-key:chunk:0');
    expect(mockStorage.getItem).toHaveBeenCalledWith('test-key:chunk:1');
  });

  it('should store small payloads directly', async () => {
    const wrapped = wrapChunkedStorage(mockStorage as any);
    const data = { state: { small: true }, version: 0 };

    await wrapped.setItem('small-key', data);

    // Should set the item directly (mock worker returns non-chunked for small data)
    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('should clean up old chunks when storing small payload', async () => {
    const wrapped = wrapChunkedStorage(mockStorage as any);

    await wrapped.setItem('key', { state: {}, version: 0 });

    // Should attempt to remove up to 10 old chunks
    for (let i = 0; i < 10; i++) {
      expect(mockStorage.removeItem).toHaveBeenCalledWith(`key:chunk:${i}`);
    }
  });

  it('should remove chunked data including all chunks', async () => {
    const metadata: StorageMetadata = {
      _isChunked: true,
      chunkCount: 3,
      totalSize: 200,
      timestamp: Date.now(),
    };
    mockStorage._store.set('chunked-key', metadata);

    const wrapped = wrapChunkedStorage(mockStorage as any);
    await wrapped.removeItem('chunked-key');

    expect(mockStorage.removeItem).toHaveBeenCalledWith('chunked-key');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('chunked-key:chunk:0');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('chunked-key:chunk:1');
    expect(mockStorage.removeItem).toHaveBeenCalledWith('chunked-key:chunk:2');
  });

  it('should remove non-chunked data without chunk cleanup', async () => {
    mockStorage._store.set('simple-key', { state: {}, version: 0 });

    const wrapped = wrapChunkedStorage(mockStorage as any);
    await wrapped.removeItem('simple-key');

    expect(mockStorage.removeItem).toHaveBeenCalledWith('simple-key');
    // Should not try to remove chunks
    expect(mockStorage.removeItem).not.toHaveBeenCalledWith('simple-key:chunk:0');
  });

  it('should handle null metadata on remove gracefully', async () => {
    mockStorage._store.delete('null-key');

    const wrapped = wrapChunkedStorage(mockStorage as any);
    await wrapped.removeItem('null-key');

    expect(mockStorage.removeItem).toHaveBeenCalledWith('null-key');
  });
});
