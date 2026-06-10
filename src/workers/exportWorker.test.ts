import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

describe('exportWorker', () => {
  let postMessages: unknown[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg);
    });
    // @ts-expect-error — Worker file has no exports, runs as side-effect
    await import('./exportWorker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  it('exports data as CSV', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'csv',
          data: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
          columns: ['name', 'age'],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.result).toContain('"Alice"');
    expect(msg.result).toContain('"Bob"');
    expect(msg.result).toContain('"age"');
    expect(msg.mimeType).toBe('text/csv');
  });

  it('exports data as JSON', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'json',
          data: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
          columns: ['name', 'age'],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const parsed = JSON.parse(msg.result as string);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.name).toBe('Alice');
    expect(msg.mimeType).toBe('application/json');
  });

  it('handles null and undefined values in CSV', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'csv',
          data: [
            { name: 'Alice', age: null },
            { name: 'Bob', age: undefined },
          ],
          columns: ['name', 'age'],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const lines = (msg.result as string).split('\n');
    expect(lines[1]!).toContain('"Alice",');
  });

  it('escapes quotes in CSV values', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'csv',
          data: [{ name: 'Alice "Ali"', age: 30 }],
          columns: ['name', 'age'],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.result).toContain('""');
  });

  it('handles empty data', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'csv',
          data: [],
          columns: ['name'],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const lines = (msg.result as string).split('\n');
    expect(lines[0]!).toContain('name');
    expect(lines).toHaveLength(1);
  });

  it('handles single row', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          type: 'csv',
          data: [{ x: 1 }],
          columns: ['x'],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const lines = (msg.result as string).split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]!).toContain('1');
  });
});
