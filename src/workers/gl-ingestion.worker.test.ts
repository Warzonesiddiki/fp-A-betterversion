import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { WorkerResponse } from './types';
import type { GLIngestResult } from '@/types/glIngestion';
import { validateGLIngestionChunk, MAX_GL_CHUNK_ROWS } from './glIngestionRequest';

const config = {
  headers: ['Account', 'Date', 'Debit', 'Credit', 'Entity', 'Currency'],
  sourceId: 'ERP',
  knownAccountCodes: ['1000', '4000'],
  knownEntityIds: ['P'],
  expectedCurrency: 'USD',
  dateOrder: 'MDY',
  firstRowNumber: 8,
};
const rows = [
  {
    Account: '1000',
    Date: '2026-09-30',
    Debit: '9007199254740993.01',
    Credit: '',
    Entity: 'P',
    Currency: 'USD',
  },
  {
    Account: '4000',
    Date: '2026-09-30',
    Debit: '',
    Credit: '9007199254740993.01',
    Entity: 'P',
    Currency: 'USD',
  },
];
const scope: {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
} = { onmessage: null, postMessage: vi.fn() };
beforeAll(async () => {
  vi.stubGlobal('self', scope);
  await import('./gl-ingestion.worker');
});
afterAll(() => vi.unstubAllGlobals());
function dispatch(data: unknown): WorkerResponse<GLIngestResult> {
  scope.postMessage.mockClear();
  scope.onmessage!({ data } as MessageEvent<unknown>);
  expect(scope.postMessage).toHaveBeenCalledTimes(1);
  return scope.postMessage.mock.calls[0]![0] as WorkerResponse<GLIngestResult>;
}
describe('GL worker protocol with the real ingest engine', () => {
  it('returns exact totals through the message protocol and preserves the request ID', () => {
    const result = dispatch({ id: 'chunk-1', payload: { ...config, rows } });
    expect(result.type).toBe('result');
    expect(result.id).toBe('chunk-1');
    expect(result.payload?.controlTotals.debit).toBe('9007199254740993.01');
    expect(result.payload?.acceptedRows.map((r) => r.sourceRow)).toEqual([8, 9]);
  });
  it('returns schema/domain quarantine rather than dropping invalid source rows', () => {
    const result = dispatch({
      id: 'bad-row',
      payload: { ...config, rows: [{ ...rows[0], Date: 'bad' }] },
    });
    expect(result.type).toBe('result');
    expect(result.payload?.quarantinedRows[0]?.sourceRow).toBe(8);
    expect(result.payload?.quarantinedRows[0]?.reasons[0]?.code).toBe('INVALID_DATE');
  });
  it.each([
    null,
    {},
    { id: 'invalid', payload: null },
    { id: 'bad-rows', payload: { ...config, rows: 'not-an-array' } },
    { id: 'numeric-cell', payload: { ...config, rows: [{ ...rows[0], Debit: 1.1 }] } },
  ])('catches malformed envelopes and payloads: %j', (data) => {
    const result = dispatch(data);
    expect(result.type).toBe('error');
    expect(result.error).toBeTruthy();
  });
  it('rejects oversized chunks and invalid source row offsets', () => {
    expect(() =>
      validateGLIngestionChunk({
        ...config,
        rows: Array.from({ length: MAX_GL_CHUNK_ROWS + 1 }, () => rows[0]),
      })
    ).toThrow(/length/);
    for (const firstRowNumber of [-1, 0, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER]) {
      expect(() => validateGLIngestionChunk({ ...config, rows, firstRowNumber })).toThrow(
        /source-record/
      );
    }
  });
  it('requires explicit date/sign conventions and known mapping keys', () => {
    for (const extra of [
      { dateOrder: 'guess' },
      { amountConvention: 'guess' },
      { mappings: { unsupported: 'Debit' } },
    ]) {
      expect(() => validateGLIngestionChunk({ ...config, rows, ...extra })).toThrow();
    }
  });
});
