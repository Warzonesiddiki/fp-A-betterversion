/**
 * P1-4 consumer-coverage interop test (fourth screen — the import wizard).
 *
 * `GLUploadPage.test.tsx` mocks `@/store/glStore`, and
 * `GLUploadPage.deep.test.tsx` mocks the store, `Alert` and every child
 * component — so the screen that OWNS the import contract had no joint test
 * with the real store. This suite drives the REAL wizard end to end: real
 * FileDropZone input, real CSV bytes through `file.arrayBuffer()` + parseCSV,
 * real auto-mapping, real GLDataPreview, real `importGLData`, and the real
 * inline Alert that renders its failure messages.
 *
 * What it proves, on screen AND in the store, from the same run:
 *  1. accepted counts — the Done screen and the store agree on what landed;
 *  2. rejected rows — a rejected source row's number and reason reach the
 *     screen and the store stays atomically untouched (FR-002: nothing is
 *     silently discarded). The machine code lives on `ImportRejection` and is
 *     covered by the parseGLRows/glStore suites; the screen carries row+reason;
 *  3. provenance — batch id, file SHA-256, cent-exact control totals, scope
 *     and the pinned import instant render from real store output, with facts
 *     the file did not carry reported as "not in file", never zero
 *     (FR-001/FR-004/FR-005);
 *  4. idempotency — a byte-identical re-import is refused with the prior
 *     batch id and no financial effect (FR-003).
 *
 * Amount cells carry explicit `0`s because GLDataPreview validates amounts
 * with parseFloat: a blank cell reads as NaN and would block the preview.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GLUploadPage from '@/pages/data/GLUploadPage';
import { useGLStore } from '@/store/glStore';
import { actAs } from '@/test/rbacFixtures';
import { setClock, resetClock } from '@/utils/clock';
import { hashFileBytes } from '@/services/import/importProvenance';

/** Pinned instant: the batch id and "Imported at" must not drift (NFR-001). */
const PINNED = '2026-04-30T09:00:00.000Z';

/** Balanced April journal: debits 1200.50 + 300.00, credits the same. */
const CLEAN_CSV = [
  'Account Code,Posting Date,Debit,Credit,Description',
  '4000,2026-04-15,1200.50,0,Consulting revenue',
  '1100,2026-04-15,0,1200.50,AR settlement',
  '5000,2026-04-20,300.00,0,Office supplies',
  '1000,2026-04-20,0,300.00,Cash paid',
  '',
].join('\n');

function resetGLStore() {
  useGLStore.setState({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    importHistory: [],
    lastImportEntryIds: [],
    lastImportResult: null,
    importStatus: 'idle',
    importProgress: 0,
    importError: null,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/gl-upload']}>
      <GLUploadPage />
    </MemoryRouter>
  );
}

/** Upload CSV bytes through the real FileDropZone input and reach Map step. */
async function upload(csv: string, name = 'gl-april.csv'): Promise<void> {
  const input = await screen.findByLabelText('Upload file');
  fireEvent.change(input, {
    target: { files: [new File([csv], name, { type: 'text/csv' })] },
  });
  await screen.findByText('Map Columns');
  // GLColumnMapper auto-maps the headers on mount; Preview unlocks once the
  // required mappings (accountCode, postDate) are present.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Preview Data' })).toBeEnabled());
}

/** Advance to the preview step and assert the validation summary shown. */
async function preview(summary: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Preview Data' }));
  expect(await screen.findByText(summary)).toBeTruthy();
}

function confirmImport(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Confirm & Import Data' }));
}

describe('GLUploadPage ↔ glStore interop (P1-4 consumer coverage)', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    resetGLStore();
  });

  afterEach(() => {
    resetClock();
  });

  it('shows the import entry point when the real store holds nothing', () => {
    renderPage();
    expect(screen.getByText('Import Your Financial Data')).toBeTruthy();
    expect(screen.getByLabelText('Upload file')).toBeTruthy();
    expect(useGLStore.getState().entries).toHaveLength(0);
    expect(useGLStore.getState().importHistory).toHaveLength(0);
  });

  it('imports a clean file end to end: counts, control totals and provenance agree between screen and store', async () => {
    renderPage();
    await upload(CLEAN_CSV);
    await preview('0 errors detected in 4 rows');
    confirmImport();

    expect(await screen.findByText('Import Complete')).toBeTruthy();
    expect(screen.getByText('Successfully imported 4 rows.')).toBeTruthy();

    // --- store truth (FR-004 control totals, FR-005 provenance) ---------
    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(4);
    expect(st.importHistory).toHaveLength(1);
    const hist = st.importHistory[0]!;
    expect(hist.status).toBe('success');
    expect(hist.rowCount).toBe(4);
    const expectedHash = hashFileBytes(new TextEncoder().encode(CLEAN_CSV));
    expect(hist.fileHash).toBe(expectedHash);
    expect(hist.controlTotals).toEqual({
      rows: 4,
      debit: '1500.50',
      credit: '1500.50',
      net: '0.00',
    });
    expect(st.entries.map((e) => e.provenance?.batchId)).toEqual([
      hist.batchId,
      hist.batchId,
      hist.batchId,
      hist.batchId,
    ]);
    expect(st.entries.map((e) => e.provenance?.sourceRow)).toEqual([2, 3, 4, 5]);
    expect(st.entries.every((e) => e.provenance?.sourceFile === 'gl-april.csv')).toBe(true);

    // --- the same facts on screen (the Done screen must not invent any) --
    const evidence = screen.getByTestId('import-batch-evidence');
    const txt = evidence.textContent ?? '';
    expect(txt).toContain(hist.batchId);
    expect(txt).toContain(expectedHash);
    expect(txt).toContain(
      'Rows committed4Total debit1500.50Total credit1500.50Net (debit − credit)0.00'
    );
    expect(txt).toContain('Periods2026-04 (2026-04-15 → 2026-04-20)');
    // Missing ≠ zero: the file carried no entity/currency column.
    expect(txt).toContain('Entitiesnot in file');
    expect(txt).toContain('Currenciesnot in file');
    expect(txt).toContain(`Imported at${PINNED}`);
    // Nothing was rejected, so the rejection section must be absent.
    expect(screen.queryByText(/source row.* not imported/)).toBeNull();
  });

  it('refuses a byte-identical re-import with the prior batch id and no financial effect (FR-003)', async () => {
    renderPage();
    await upload(CLEAN_CSV);
    await preview('0 errors detected in 4 rows');
    confirmImport();
    await screen.findByText('Import Complete');

    const firstBatch = useGLStore.getState().importHistory[0]!.batchId;
    expect(useGLStore.getState().entries).toHaveLength(4);

    // Back into the wizard; the store keeps its history and entries.
    fireEvent.click(screen.getByRole('button', { name: 'Import Another' }));
    await upload(CLEAN_CSV); // byte-identical content
    await preview('0 errors detected in 4 rows');
    confirmImport();

    const expected = `Import failed: this file was already imported as ${firstBatch}; nothing was changed`;
    const alertBox = await screen.findByRole('alert');
    expect(within(alertBox).getByText(expected)).toBeInTheDocument();

    // No financial effect: same entries, same single batch, store and screen
    // telling the same story.
    const after = useGLStore.getState();
    expect(after.entries).toHaveLength(4);
    expect(after.importHistory).toHaveLength(1);
    expect(after.importError).toBe(expected);
    expect(screen.queryByTestId('import-batch-evidence')).toBeNull();
  });

  it('rejects the whole file naming the rejected source row, leaving the store untouched (FR-002)', async () => {
    // Preview validates only the first 20 data rows, so a broken row at
    // source row 26 passes the preview gate and must still be caught — by
    // number and reason — at import, with the batch rolled back whole.
    const header = 'Account Code,Posting Date,Debit,Credit,Description';
    const valid: string[] = [];
    for (let i = 0; i < 24; i++) {
      valid.push(
        i % 2 === 0
          ? `5100,2026-04-15,100.00,0,Supplies ${i}`
          : `2000,2026-04-15,0,100.00,Offset ${i}`
      );
    }
    const csv = [header, ...valid, ',2026-04-25,100.00,0,Row with no account code', ''].join('\n');

    renderPage();
    await upload(csv, 'gl-large.csv');
    await preview('0 errors detected in 25 rows'); // broken row is #25, past the window
    confirmImport();

    const expected = 'Import failed: row 26: missing accountCode';
    const alertBox = await screen.findByRole('alert');
    expect(within(alertBox).getByText('Import Error')).toBeInTheDocument();
    expect(within(alertBox).getByText(expected)).toBeInTheDocument();

    // Atomic: nothing committed, no batch recorded, screen and store agree.
    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(0);
    expect(st.importHistory).toHaveLength(0);
    expect(st.importStatus).toBe('error');
    expect(st.importError).toBe(expected);
    expect(screen.queryByTestId('import-batch-evidence')).toBeNull();
  });

  it('blocks confirmation at the preview gate for a bad row inside the preview window', async () => {
    const csv = [
      'Account Code,Posting Date,Debit,Credit,Description',
      ',2026-04-15,1200.50,0,Freight clearing',
      '1100,2026-04-15,0,1200.50,Offset',
      '',
    ].join('\n');

    renderPage();
    await upload(csv, 'gl-broken.csv');
    await preview('1 errors detected in 2 rows');
    expect(screen.getByText('Missing account code')).toBeTruthy();

    const confirm = screen.getByRole('button', { name: 'Fix Errors to Continue' });
    expect(confirm).toBeDisabled();

    // The gate runs before importGLData: the store must not move at all.
    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(0);
    expect(st.importHistory).toHaveLength(0);
    expect(st.importStatus).toBe('idle');
  });
});
