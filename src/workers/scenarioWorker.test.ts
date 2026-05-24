import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

describe('scenarioWorker', () => {
  let postMessages: unknown[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg);
    });
    // @ts-expect-error — Worker file has no exports, runs as side-effect
    await import('./scenarioWorker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  it('applies single scenario multiplier', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          baseValues: [100, 200, 300],
          assumptions: [{ multiplier: 1.1, label: 'Growth 10%' }],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const result = (msg.result as Array<Record<string, unknown>>)[0];
    expect(msg.result).toHaveLength(1);
    expect(result.label).toBe('Growth 10%');
    expect((result.values as number[])[0]).toBeCloseTo(110, 10);
    expect((result.values as number[])[1]).toBeCloseTo(220, 10);
    expect((result.values as number[])[2]).toBe(330);
    expect(result.total).toBeCloseTo(660, 10);
  });

  it('applies multiple scenarios', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          baseValues: [1000],
          assumptions: [
            { multiplier: 1.2, label: 'Upside' },
            { multiplier: 0.8, label: 'Downside' },
            { multiplier: 1.0, label: 'Base' },
          ],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const results = msg.result as Array<Record<string, unknown>>;
    expect(results).toHaveLength(3);
    expect(results[0].total).toBe(1200);
    expect(results[1].total).toBe(800);
    expect(results[2].total).toBe(1000);
  });

  it('handles empty base values', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          baseValues: [],
          assumptions: [{ multiplier: 2, label: 'Double' }],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect((msg.result as Array<Record<string, unknown>>)[0].values).toEqual([]);
    expect((msg.result as Array<Record<string, unknown>>)[0].total).toBe(0);
  });

  it('handles single base value', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          baseValues: [42],
          assumptions: [{ multiplier: 1, label: 'Same' }],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect((msg.result as Array<Record<string, unknown>>)[0].values).toEqual([42]);
    expect((msg.result as Array<Record<string, unknown>>)[0].total).toBe(42);
  });

  it('handles zero assumptions', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: {
          baseValues: [100],
          assumptions: [],
        },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.result).toEqual([]);
  });
});
