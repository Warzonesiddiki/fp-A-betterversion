/** Worker ingress validation. Money remains text; malformed payloads never reach ingest. */
import type { GLIngestChunkInput, GLIngestMappings } from '@/types/glIngestion';
import { expectArray, expectObject, expectStringEnum, WorkerRequestError } from './validateRequest';

export const MAX_GL_CHUNK_ROWS = 2000;
const fields = [
  'accountCode',
  'accountName',
  'postDate',
  'debit',
  'credit',
  'amount',
  'entityId',
  'currency',
  'journalId',
  'description',
  'reference',
];
function text(value: unknown, label: string, max = 65536): string {
  if (typeof value !== 'string' || value.length > max)
    throw new WorkerRequestError(`${label} must be text of at most ${max} characters`);
  return value;
}
function texts(value: unknown, label: string, max: number) {
  return expectArray(value, label, max).map((s) => text(s, label, 1024));
}
export function validateGLIngestionChunk(value: unknown): GLIngestChunkInput {
  const input = expectObject(value, 'GL chunk');
  const rows = expectArray(input.rows, 'rows', MAX_GL_CHUNK_ROWS).map((raw) => {
    const row = expectObject(raw, 'row');
    if (Object.keys(row).length > 256) throw new WorkerRequestError('row has too many columns');
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [text(key, 'column', 1024), text(value, 'cell')])
    );
  });
  const firstRowNumber = input.firstRowNumber === undefined ? 2 : input.firstRowNumber;
  if (
    typeof firstRowNumber !== 'number' ||
    !Number.isSafeInteger(firstRowNumber) ||
    firstRowNumber < 1 ||
    !Number.isSafeInteger(firstRowNumber + rows.length)
  )
    throw new WorkerRequestError('firstRowNumber must be a positive safe source-record index');
  let rowNumbers: readonly number[] | undefined;
  if (input.rowNumbers !== undefined) {
    const rawNumbers = expectArray(input.rowNumbers, 'rowNumbers', MAX_GL_CHUNK_ROWS);
    if (rawNumbers.length !== rows.length) {
      throw new WorkerRequestError('rowNumbers length must match rows length');
    }
    let prev = 0;
    rowNumbers = rawNumbers.map((n) => {
      if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 1 || n <= prev) {
        throw new WorkerRequestError(
          'rowNumbers must be strictly increasing positive safe integers'
        );
      }
      prev = n;
      return n;
    });
  }
  let mappings: GLIngestMappings | undefined;
  if (input.mappings !== undefined) {
    const raw = expectObject(input.mappings, 'mappings');
    for (const [key, value] of Object.entries(raw)) {
      if (!fields.includes(key)) throw new WorkerRequestError(`Unknown GL mapping field: ${key}`);
      text(value, `mapping ${key}`, 1024);
    }
    mappings = { ...raw } as GLIngestMappings;
  }
  const dateOrder = expectStringEnum(input.dateOrder, 'dateOrder', [
    'MDY',
    'DMY',
    'ISO_ONLY',
  ]) as GLIngestChunkInput['dateOrder'];
  const amountConvention =
    input.amountConvention === undefined
      ? undefined
      : (expectStringEnum(input.amountConvention, 'amountConvention', [
          'positive-debit',
          'positive-credit',
        ]) as GLIngestChunkInput['amountConvention']);
  return {
    headers: texts(input.headers, 'headers', 256),
    rows,
    firstRowNumber,
    ...(rowNumbers !== undefined ? { rowNumbers } : {}),
    sourceId: text(input.sourceId, 'sourceId', 1024),
    mappings,
    knownAccountCodes: texts(input.knownAccountCodes, 'knownAccountCodes', 100000),
    knownEntityIds: texts(input.knownEntityIds, 'knownEntityIds', 100000),
    expectedCurrency: text(input.expectedCurrency, 'expectedCurrency', 16),
    dateOrder,
    amountConvention,
  };
}
