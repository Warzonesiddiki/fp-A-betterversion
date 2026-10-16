/**
 * Gate 2 import contract (docs/discovery/requirements-register.md):
 * FR-002 nothing silently discarded, FR-003 idempotent imports,
 * FR-004 control totals, FR-005 source-row provenance, NFR-001 determinism.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';
import { setClock, resetClock } from '@/utils/clock';
import { parseGLRows } from '@/services/import/parseGLRows';
import type { GLEntry } from '@/types';

const FIXED_INSTANT = '2026-10-15T09:30:00.000Z';

function row(overrides: Partial<GLEntry>): Partial<GLEntry> {
  return {
    accountCode: '1000',
    accountName: 'Cash',
    postDate: '2026-09-30',
    date: '2026-09-30',
    debit: 0,
    credit: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

/** A balanced three-line D365-style journal (the store enforces debits == credits per batch). */
const JOURNAL: Partial<GLEntry>[] = [
  row({ accountCode: '1000', debit: 1200.5, reference: 'JNL-1' }),
  row({ accountCode: '4000', credit: 1000.5, reference: 'JNL-1' }),
  row({ accountCode: '2200', credit: 200, reference: 'JNL-1' }),
];

/** A second, independent balanced journal. */
const JOURNAL_B: Partial<GLEntry>[] = [
  row({
    accountCode: '6000',
    debit: 75,
    reference: 'JNL-2',
    postDate: '2026-09-15',
    date: '2026-09-15',
  }),
  row({
    accountCode: '1000',
    credit: 75,
    reference: 'JNL-2',
    postDate: '2026-09-15',
    date: '2026-09-15',
  }),
];

const FILE_HASH = 'a'.repeat(64);

describe('glStore import provenance (Gate 2)', () => {
  beforeEach(() => {
    setClock(FIXED_INSTANT);
    useAuthStore.setState({
      user: {
        id: 'prov-test-user',
        email: 'prov@finplan.local',
        firstName: 'P',
        lastName: 'T',
        avatarUrl: null,
        role: 'Admin',
        departmentId: 'finance',
        departmentName: 'Finance',
        entityId: 'entity-001',
        status: 'Active',
        lastLoginAt: FIXED_INSTANT,
        mfaEnabled: false,
        permissions: [
          'import:create',
          'import:read',
          'import:update',
          'import:delete',
          'ui:update',
        ],
      },
      isAuthenticated: true,
    });
    useGLStore.setState({
      entries: [],
      accounts: [],
      trialBalance: [],
      accountAnalysis: null,
      importStatus: 'idle',
      importError: null,
      lastImportResult: null,
      importHistory: [],
      lastImportEntryIds: [],
      entrySyncState: {},
      entryVersions: {},
    });
  });
  afterEach(() => resetClock());

  it('FR-005: every committed entry carries batch id, file hash, file name and source row', () => {
    const result = useGLStore
      .getState()
      .importGLData(JOURNAL, 'GL_2026-09.csv', { fileHash: FILE_HASH, sourceRows: [2, 3, 4] });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const entries = useGLStore.getState().entries;
    expect(entries).toHaveLength(3);
    for (const [i, e] of entries.entries()) {
      expect(e.provenance).toEqual({
        batchId: result.batchId,
        fileHash: FILE_HASH,
        sourceFile: 'GL_2026-09.csv',
        sourceRow: i + 2,
      });
    }
  });

  it('FR-003: the same file content is imported at most once and the repeat has no effect', () => {
    const first = useGLStore
      .getState()
      .importGLData(JOURNAL, 'GL_2026-09.csv', { fileHash: FILE_HASH });
    expect(first.success).toBe(true);
    const before = useGLStore.getState().entries;

    // Same bytes, different file name, later instant: still a duplicate.
    setClock('2026-10-16T08:00:00.000Z');
    const second = useGLStore
      .getState()
      .importGLData(JOURNAL, 'GL_2026-09 (copy).csv', { fileHash: FILE_HASH });

    expect(second.success).toBe(false);
    if (second.success) return;
    expect(second.duplicateOfBatchId).toBe(first.success ? first.batchId : '');
    expect(second.rejections?.[0]?.code).toBe('DUPLICATE_FILE');
    expect(useGLStore.getState().entries).toBe(before); // identical reference: no state write
    expect(useGLStore.getState().importHistory).toHaveLength(1);
    expect(useGLStore.getState().importError).toMatch(/Duplicate import rejected/);
  });

  it('FR-003: content without a file hash is identified by its canonical row content', () => {
    const first = useGLStore.getState().importGLData(JOURNAL, 'dynamics-connector');
    expect(first.success).toBe(true);
    const second = useGLStore.getState().importGLData(
      JOURNAL.map((r) => ({ ...r })),
      'dynamics-connector'
    );
    expect(second.success).toBe(false);
    expect(useGLStore.getState().entries).toHaveLength(3);
  });

  it('FR-002: a validation failure rejects the whole batch and explains each bad row by source row', () => {
    const bad = [JOURNAL[0]!, row({ accountCode: '', debit: 0 }), JOURNAL[1]!, JOURNAL[2]!];
    const result = useGLStore
      .getState()
      .importGLData(bad, 'GL.csv', { fileHash: 'b'.repeat(64), sourceRows: [10, 11, 12, 13] });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(useGLStore.getState().entries).toHaveLength(0); // atomic: nothing committed
    expect(useGLStore.getState().importHistory).toHaveLength(0);
    expect(result.rejections).toEqual([
      { row: 11, code: 'VALIDATION', reason: 'missing accountCode' },
    ]);
  });

  it('DEC-009: a balanced ledger overlap rejects the entire file and reports source rows', () => {
    const first = useGLStore
      .getState()
      .importGLData(JOURNAL_B, 'first.csv', { fileHash: 'c'.repeat(64) });
    expect(first.success).toBe(true);
    // Second file: the two JNL-2 lines again (already in the ledger) plus JNL-1.
    const before = useGLStore.getState();
    const result = useGLStore.getState().importGLData([...JOURNAL, ...JOURNAL_B], 'second.csv', {
      fileHash: 'd'.repeat(64),
      sourceRows: [2, 3, 4, 5, 6],
    });
    expect(result.success).toBe(false);
    expect(result.imported).toBe(0);
    expect(useGLStore.getState().entries).toBe(before.entries);
    expect(useGLStore.getState().entries).toHaveLength(2);
    expect(result.rejections).toEqual([
      {
        row: 5,
        code: 'DUPLICATE_ROW',
        reason: expect.stringContaining('already exists in the ledger'),
      },
      {
        row: 6,
        code: 'DUPLICATE_ROW',
        reason: expect.stringContaining('already exists in the ledger'),
      },
    ]);
    expect(useGLStore.getState().importHistory).toHaveLength(1);
    expect(useGLStore.getState().importHistory[0]?.filename).toBe('first.csv');
    expect(useGLStore.getState().importStatus).toBe('error');
  });

  it('DEC-009: a one-sided overlap cannot commit an unbalanced remainder', () => {
    useGLStore.getState().importGLData(JOURNAL_B, 'first.csv', { fileHash: 'c'.repeat(64) });
    const before = useGLStore.getState();
    const input = [JOURNAL_B[0]!, row({ accountCode: '9999', credit: 75, postDate: '2026-09-15' })];
    expect(before.validateEntries(input).isValid).toBe(true);
    const result = before.importGLData(input, 'overlap.csv', {
      fileHash: FILE_HASH,
      sourceRows: [8, 9],
    });
    expect(result.success).toBe(false);
    expect(result.rejections).toEqual([
      { row: 8, code: 'DUPLICATE_ROW', reason: expect.any(String) },
    ]);
    const after = useGLStore.getState();
    for (const key of [
      'entries',
      'importHistory',
      'lastImportEntryIds',
      'entrySyncState',
      'entryVersions',
      'trialBalance',
      'accountAnalysis',
      'lastImportResult',
    ] as const) {
      expect(after[key]).toBe(before[key]);
    }
    // No successful import history/hash is consumed by the failed attempt.
    const retry = after.importGLData(JOURNAL, 'corrected.csv', { fileHash: FILE_HASH });
    expect(retry.success).toBe(true);
  });

  it('matches parsed upload rows despite their placeholder amount and reports actual file rows', () => {
    const mappings = { accountCode: 'Account', postDate: 'Date', debit: 'Debit', credit: 'Credit' };
    const parsed = parseGLRows(
      [
        { Account: '1000', Date: '2026-09-30', Debit: '125', Credit: '' },
        { Account: '4000', Date: '2026-09-30', Debit: '', Credit: '125' },
      ],
      mappings,
      10
    );
    expect(parsed.entries[0]?.amount).toBe(0); // the upload parser's placeholder
    expect(
      useGLStore.getState().importGLData(parsed.entries, 'first.csv', { fileHash: FILE_HASH })
        .success
    ).toBe(true);
    const before = useGLStore.getState();
    const result = before.importGLData(parsed.entries, 'different-bytes.csv', {
      fileHash: 'b'.repeat(64),
      sourceRows: parsed.sourceRows,
    });
    expect(result.success).toBe(false);
    expect(result.rejections?.map((r) => r.row)).toEqual([10, 11]);
    expect(useGLStore.getState().entries).toBe(before.entries);
  });

  it('does not collapse distinct gross debit/credit pairs with the same net amount', () => {
    useGLStore.setState({
      entries: [{ ...row({ debit: 100, credit: 20, amount: 80 }), id: 'existing' } as GLEntry],
    });
    const result = useGLStore
      .getState()
      .checkDuplicates([
        { ...row({ debit: 90, credit: 10, amount: 80 }), id: 'incoming' } as GLEntry,
      ]);
    expect(result.duplicates).toBe(0);
  });

  it('preserves repeated lines within a new file: equal values alone are not duplicate identity', () => {
    const repeated = [...JOURNAL, ...JOURNAL].map((e) => ({ ...e }));
    const result = useGLStore
      .getState()
      .importGLData(repeated, 'repeated-lines.csv', { fileHash: FILE_HASH });
    expect(result.success).toBe(true);
    expect(result.imported).toBe(6);
    expect(useGLStore.getState().entries.map((e) => e.provenance?.sourceRow)).toEqual([
      2, 3, 4, 5, 6, 7,
    ]);
  });

  it('rejects an empty batch without success history', () => {
    const result = useGLStore.getState().importGLData([], 'empty.csv');
    expect(result.success).toBe(false);
    expect(result.rejections).toEqual([
      { row: 0, code: 'VALIDATION', reason: 'No entries to import.' },
    ]);
    expect(useGLStore.getState().importHistory).toHaveLength(0);
  });

  it('FR-004: control totals are computed in cents from the committed rows only', () => {
    const result = useGLStore.getState().importGLData(JOURNAL, 'GL.csv', { fileHash: FILE_HASH });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.controlTotals).toEqual({
      rows: 3,
      debit: '1200.50',
      credit: '1200.50',
      net: '0.00',
    });
    expect(useGLStore.getState().importHistory[0]?.controlTotals).toEqual(result.controlTotals);
  });

  it('NFR-001: batch id and history timestamp come from the injected clock, not the wall clock', () => {
    const a = useGLStore.getState().importGLData(JOURNAL, 'GL.csv', { fileHash: FILE_HASH });
    expect(a.success).toBe(true);
    const historyA = useGLStore.getState().importHistory[0]!;
    expect(historyA.timestamp).toBe(FIXED_INSTANT);
    expect(historyA.id).toBe(a.success ? a.batchId : '');

    // Fresh store, same clock, same content → same batch id (replayable).
    useGLStore.setState({ entries: [], importHistory: [], lastImportEntryIds: [] });
    const b = useGLStore.getState().importGLData(JOURNAL, 'GL.csv', { fileHash: FILE_HASH });
    expect(b.success && a.success && b.batchId === a.batchId).toBe(true);
  });

  it('undoLastImport removes exactly the batch and leaves earlier batches with their provenance', async () => {
    const one = useGLStore
      .getState()
      .importGLData(JOURNAL_B, 'one.csv', { fileHash: 'e'.repeat(64) });
    expect(one.success).toBe(true);
    const firstBatch = useGLStore.getState().entries[0]!.provenance!.batchId;
    const two = useGLStore
      .getState()
      .importGLData(JOURNAL, 'two.csv', { fileHash: 'f'.repeat(64) });
    expect(two.success).toBe(true);
    expect(useGLStore.getState().entries).toHaveLength(5);

    await useGLStore.getState().undoLastImport();

    const remaining = useGLStore.getState().entries;
    expect(remaining).toHaveLength(2);
    expect(remaining.every((e) => e.provenance?.batchId === firstBatch)).toBe(true);
    expect(remaining[0]!.provenance?.sourceFile).toBe('one.csv');
  });

  it('FR-001: the batch records its period/date coverage and says when entity/currency were not in the file', () => {
    const result = useGLStore
      .getState()
      .importGLData([...JOURNAL, ...JOURNAL_B], 'GL.csv', { fileHash: FILE_HASH });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.scope).toEqual({
      periods: ['2026-09'],
      dateRange: { from: '2026-09-15', to: '2026-09-30' },
      entities: 'unavailable',
      currencies: 'unavailable',
      importedAt: FIXED_INSTANT,
    });
    expect(useGLStore.getState().importHistory[0]?.scope).toEqual(result.scope);
  });

  it('DEC-007: upstream parse failures reject the entire file, even with a balanced remainder', () => {
    const before = useGLStore.getState();
    const rejections = [
      { row: 7, code: 'VALIDATION' as const, reason: 'missing accountCode' },
      { row: 3, code: 'VALIDATION' as const, reason: 'unparseable posting date "31/13/2026"' },
      { row: 3, code: 'VALIDATION' as const, reason: 'unparseable debit amount "bad"' },
    ];
    const result = useGLStore.getState().importGLData(JOURNAL, 'GL.csv', {
      fileHash: FILE_HASH,
      sourceRows: [2, 4, 5],
      rejections,
    });
    expect(result.success).toBe(false);
    expect(result.imported).toBe(0);
    expect(result.errors).toBe(3);
    expect(result.rejections?.map((r) => r.row)).toEqual([3, 3, 7]);
    expect(rejections.map((r) => r.row)).toEqual([7, 3, 3]); // caller input not mutated
    const after = useGLStore.getState();
    for (const key of [
      'entries',
      'importHistory',
      'lastImportEntryIds',
      'entrySyncState',
      'entryVersions',
      'trialBalance',
      'accountAnalysis',
      'lastImportResult',
    ] as const) {
      expect(after[key]).toBe(before[key]);
    }
    expect(after.importStatus).toBe('error');
    expect(after.importError).toContain('Entire file rejected');

    // Failed attempts do not consume the hash: corrected content can be retried.
    const retry = after.importGLData(JOURNAL, 'GL.csv', { fileHash: FILE_HASH });
    expect(retry.success).toBe(true);
    expect(useGLStore.getState().importHistory).toHaveLength(1);
  });
});
