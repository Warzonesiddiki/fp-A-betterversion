import { describe, it, expect, beforeEach, vi } from 'vitest';

// =============================================================================
// Test harness: capture self.onmessage assignments via a setter spy
// Note: storage.worker uses { id, payload: { type, payload, chunkSize? } } input
// format. Response format is { id, type, payload: { payload: <string> } }
// (nested payload, since the worker wraps the chunked result).
// =============================================================================
let messageHandler: ((e: MessageEvent) => void) | null = null;
const postMessageMock = vi.fn();

function makeMockSelf(): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(obj, 'onmessage', {
    get: () => messageHandler,
    set: (handler: ((e: MessageEvent) => void) | null) => {
      messageHandler = handler;
    },
    configurable: true,
  });
  obj.postMessage = postMessageMock;
  return obj;
}

async function loadWorker() {
  vi.resetModules();
  messageHandler = null;
  postMessageMock.mockReset();
  // @ts-expect-error - override self with mock
  globalThis.self = makeMockSelf();
  await import('./storage.worker');
}

function dispatchMessage(id: string, type: 'stringify' | 'parse', payload: unknown): void {
  if (!messageHandler) throw new Error('Worker onmessage not registered');
  messageHandler({ data: { id, payload: { type, payload } } } as MessageEvent);
}

function findResult(
  id: string
): { type: string; id: string; payload?: { payload?: unknown }; error?: string } | undefined {
  return postMessageMock.mock.calls.map((c) => c[0]).find((r: { id: string }) => r.id === id);
}

function extractJSON(response: { payload?: { payload?: unknown } } | undefined): string {
  // Worker wraps result as { payload: { payload: <jsonString> } }
  const inner = response?.payload?.payload;
  if (typeof inner !== 'string')
    throw new Error(`Expected string payload, got ${typeof inner}: ${JSON.stringify(inner)}`);
  return inner;
}

function extractValue(response: { payload?: { payload?: unknown } } | undefined): unknown {
  return response?.payload?.payload;
}

describe('storage.worker', () => {
  beforeEach(() => {
    messageHandler = null;
    postMessageMock.mockReset();
  });

  it('1. registers onmessage handler on import', async () => {
    await loadWorker();
    expect(messageHandler).not.toBeNull();
  });

  it('2. handles stringify request: round-trips object via postMessage', async () => {
    await loadWorker();
    const payload = { foo: 'bar', n: 42, arr: [1, 2, 3] };
    dispatchMessage('req-1', 'stringify', payload);
    const response = findResult('req-1');
    expect(response).toBeDefined();
    expect(response!.type).toBe('result');
    const json = extractJSON(response);
    expect(JSON.parse(json)).toEqual(payload);
  });

  it('3. handles parse request: round-trips JSON string', async () => {
    await loadWorker();
    const original = { a: 1, b: 'two' };
    dispatchMessage('req-2', 'parse', JSON.stringify(original));
    const response = findResult('req-2');
    expect(response!.type).toBe('result');
    expect(extractValue(response)).toEqual(original);
  });

  it('4. handles stringify of primitive values', async () => {
    await loadWorker();
    dispatchMessage('p1', 'stringify', 'hello');
    const response = findResult('p1');
    expect(extractJSON(response)).toBe('"hello"');
  });

  it('5. handles stringify of null', async () => {
    await loadWorker();
    dispatchMessage('p2', 'stringify', null);
    const response = findResult('p2');
    expect(extractJSON(response)).toBe('null');
  });

  it('6. handles stringify of array', async () => {
    await loadWorker();
    const arr = [1, 'two', { three: 3 }];
    dispatchMessage('p3', 'stringify', arr);
    const response = findResult('p3');
    expect(JSON.parse(extractJSON(response))).toEqual(arr);
  });

  it('7. parse of invalid JSON returns error response', async () => {
    await loadWorker();
    dispatchMessage('bad-1', 'parse', 'not-json{');
    const response = findResult('bad-1');
    expect(response).toBeDefined();
    expect(response!.type).toBe('error');
    expect(response!.id).toBe('bad-1');
    expect(typeof response!.error).toBe('string');
  });

  it('8. handles medium payload (1K records) without throwing', async () => {
    await loadWorker();
    const medium = Array.from({ length: 1000 }, (_, i) => ({ id: i, val: `item-${i}` }));
    expect(() => dispatchMessage('m1', 'stringify', medium)).not.toThrow();
    const response = findResult('m1');
    expect(response).toBeDefined();
  });

  it('9. parse handles empty string gracefully', async () => {
    await loadWorker();
    expect(() => dispatchMessage('e1', 'parse', '')).not.toThrow();
    const response = findResult('e1');
    expect(response).toBeDefined();
    // Empty string is valid JSON.parse → returns undefined; either result or error is OK
    expect(['result', 'error']).toContain(response!.type);
  });

  it('10. preserves request id in response (correlation)', async () => {
    await loadWorker();
    dispatchMessage('correlation-test-id-12345', 'stringify', { a: 1 });
    const response = findResult('correlation-test-id-12345');
    expect(response).toBeDefined();
    expect(response!.id).toBe('correlation-test-id-12345');
  });

  // -------------------------------------------------------------------------
  // W7E / W6-P1: malformed-message hardening
  // -------------------------------------------------------------------------
  function dispatchRaw(data: unknown): void {
    if (!messageHandler) throw new Error('Worker onmessage not registered');
    messageHandler({ data } as MessageEvent);
  }

  describe('W7E/W6-P1 malformed messages', () => {
    it('11. null request payload gets an error reply instead of crashing uncaught', async () => {
      await loadWorker();
      // Pre-fix this threw synchronously OUTSIDE the try block (destructuring
      // null) and produced no reply at all.
      expect(() => dispatchRaw({ id: 'null-req', payload: null })).not.toThrow();
      const response = findResult('null-req');
      expect(response).toBeDefined();
      expect(response!.type).toBe('error');
      expect(typeof response!.error).toBe('string');
    });

    it('12. null envelope (missing data) gets an error reply, no crash', async () => {
      await loadWorker();
      expect(() => dispatchRaw(null)).not.toThrow();
      expect(postMessageMock.mock.calls.length).toBe(1);
      expect((postMessageMock.mock.calls[0]![0] as { type: string }).type).toBe('error');
    });

    it('13. unknown request type gets an error reply (was a silent no-op)', async () => {
      await loadWorker();
      expect(() =>
        dispatchRaw({ id: 'bad-type', payload: { type: 'delete', payload: {} } })
      ).not.toThrow();
      const response = findResult('bad-type');
      expect(response).toBeDefined();
      expect(response!.type).toBe('error');
      expect(response!.error).toMatch(/type/);
    });

    it('14. non-positive chunkSize gets an error reply (chunker infinite-loop guard)', async () => {
      await loadWorker();
      expect(() =>
        dispatchRaw({
          id: 'zero-chunk',
          payload: { type: 'stringify', payload: { a: 1 }, chunkSize: 0 },
        })
      ).not.toThrow();
      const response = findResult('zero-chunk');
      expect(response).toBeDefined();
      expect(response!.type).toBe('error');
      expect(response!.error).toMatch(/chunkSize/);
    });
  });
});
