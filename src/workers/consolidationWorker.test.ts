import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

describe('consolidationWorker', () => {
  let postMessages: unknown[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg);
    });
    // @ts-expect-error — Worker file has no exports, runs as side-effect
    await import('./consolidationWorker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  function sendRequest(
    entries: Array<{ debit: number; credit: number; currency?: string; accountCode?: string }>,
    rates: Record<string, number>,
    eliminations: string[]
  ): void {
    self.onmessage?.(
      new MessageEvent('message', {
        data: { entries, rates, eliminations },
      })
    );
  }

  it('translates currencies and filters eliminations', () => {
    sendRequest(
      [
        { debit: 100, credit: 0, currency: 'EUR', accountCode: '1000' },
        { debit: 0, credit: 50, currency: 'EUR', accountCode: '2000' },
        { debit: 0, credit: 30, currency: 'EUR', accountCode: '9001' },
      ],
      { EUR: 1.2 },
      ['9001']
    );
    const msg = postMessages[0] as Record<string, unknown>;
    const result = msg.result as Array<Record<string, unknown>>;
    expect(result).toHaveLength(2);
    expect(result![0]!.debit).toBe(120);
    expect(result![0]!.localDebit).toBe(100);
    expect(result![1]!.credit).toBe(60);
  });

  it('handles empty entries', () => {
    sendRequest([], {}, []);
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.result).toEqual([]);
    expect(msg.totalDebit).toBe(0);
    expect(msg.totalCredit).toBe(0);
  });

  it('reports balanced state for matching debits/credits', () => {
    sendRequest(
      [
        { debit: 100, credit: 0, accountCode: '1000' },
        { debit: 0, credit: 100, accountCode: '2000' },
      ],
      {},
      []
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.isBalanced).toBe(true);
  });

  it('reports imbalanced state', () => {
    sendRequest([{ debit: 100, credit: 0, accountCode: '1000' }], {}, []);
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.isBalanced).toBe(false);
  });

  it('handles unknown currency gracefully', () => {
    sendRequest([{ debit: 50, credit: 0, currency: 'GBP', accountCode: '1000' }], {}, []);
    const msg = postMessages[0] as Record<string, unknown>;
    expect((msg.result as Array<Record<string, unknown>>)![0]!.debit).toBe(50);
  });

  it('handles missing fields gracefully', () => {
    self.onmessage?.(
      new MessageEvent('message', {
        data: { entries: [], rates: {}, eliminations: [] },
      })
    );
    const msg = postMessages[0] as Record<string, unknown>;
    expect(msg.result).toEqual([]);
  });
});
