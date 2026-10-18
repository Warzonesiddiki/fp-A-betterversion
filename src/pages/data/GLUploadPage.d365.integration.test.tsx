/**
 * NFR-004 — import-to-output integration test on a synthetic D365 fixture.
 *
 * The register asked for exactly this: "integration tests cover
 * import-to-output on synthetic fixtures". Everything below is the real
 * production path, with no mocks and no stubs of the code under test:
 *
 *   synthetic D365 export bytes
 *     → real `FileDropZone` input → `file.arrayBuffer()` → `parseCSV`
 *     → real `GLColumnMapper` auto-mapping of D365 column names
 *     → real `GLDataPreview` gate (`parseGLRows`)
 *     → real `glStore.importGLData` (control totals, scope, provenance)
 *     → OUTPUT: `glStore.generateTrialBalance()` and `computeBalanceSheet()`,
 *       the same derivations the Trial Balance and Balance Sheet screens read.
 *
 * What it proves, in one run:
 *  1. a Dynamics 365 Finance & Operations `GeneralJournalAccountEntryEntity`
 *     export (its own column names, `dd-MMM-yyyy` posting dates, comma-grouped
 *     quoted amounts, composite `LedgerAccount` codes next to `MainAccount`)
 *     imports without the user hand-mapping a single column, and the numbers
 *     that come out are cent-exact and balanced;
 *  2. facts the export carries survive the trip: account names, currency,
 *     legal entity, voucher reference, source row and file hash;
 *  3. a Dynamics 365 Business Central `G/L Entries` export flows through the
 *     same gate with the same guarantees;
 *  4. rows a D365 export must never turn into postings — a `Total` summary
 *     line and a calendar-invalid date — are named by source row with a reason
 *     and block the whole file (FR-002, DEC-007): nothing is silently
 *     discarded and nothing is silently adopted.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import GLUploadPage from '@/pages/data/GLUploadPage';
import { useGLStore } from '@/store/glStore';
import { actAs } from '@/test/rbacFixtures';
import { setClock, resetClock } from '@/utils/clock';
import { hashFileBytes } from '@/services/import/importProvenance';
import { computeBalanceSheet } from '@/pages/reports/balanceSheetData';

/** Pinned instant: batch ids and "Imported at" must not drift (NFR-001). */
const PINNED = '2026-02-10T09:00:00.000Z';

/**
 * Synthetic Dynamics 365 F&O general-journal export for legal entity USMF,
 * January 2026. Real column names, `dd-MMM-yyyy` posting dates, comma-grouped
 * quoted amounts, and `LedgerAccount` carrying the MainAccount-Department-
 * CostCentre composite next to the plain `MainAccount`.
 *
 * Four balanced vouchers, six accounts across classes 1/3/4/5/6:
 *   US-0001  Dr 1000 Cash 500,000.00        Cr 3000 Common Stock 500,000.00
 *   US-0002  Dr 1100 AR 120,000.00          Cr 4000 Revenue 120,000.00
 *   US-0003  Dr 5000 COGS 30,000.00         Cr 1200 Inventory 30,000.00
 *   US-0004  Dr 6000 OpEx 45,000.00         Cr 1000 Cash 45,000.00
 * Debits = credits = 695,000.00.
 */
const D365_FO_HEADER = [
  'DataAreaId',
  'MainAccount',
  'MainAccountName',
  'LedgerAccount',
  'AccountingDate',
  'SubledgerVoucher',
  'TransactionCurrencyCode',
  'AccountingCurrencyDebitAmount',
  'AccountingCurrencyCreditAmount',
  'Text',
].join(',');

const D365_FO_ROWS = [
  'USMF,1000,Cash and Cash Equivalents,1000-001-010,05-Jan-2026,US-0001,USD,"500,000.00",,Capital injection',
  'USMF,3000,Common Stock,3000-001-010,05-Jan-2026,US-0001,USD,,"500,000.00",Capital injection',
  'USMF,1100,Accounts Receivable,1100-001-020,15-Jan-2026,US-0002,USD,"120,000.00",,Invoice 4471',
  'USMF,4000,Product Revenue,4000-001-020,15-Jan-2026,US-0002,USD,,"120,000.00",Invoice 4471',
  'USMF,5000,Cost of Goods Sold,5000-001-030,20-Jan-2026,US-0003,USD,"30,000.00",,January COGS',
  'USMF,1200,Inventory,1200-001-030,20-Jan-2026,US-0003,USD,,"30,000.00",January COGS',
  'USMF,6000,Operating Expense,6000-001-040,31-Jan-2026,US-0004,USD,"45,000.00",,January payroll',
  'USMF,1000,Cash and Cash Equivalents,1000-001-010,31-Jan-2026,US-0004,USD,,"45,000.00",January payroll',
];

const D365_FO_CSV = [D365_FO_HEADER, ...D365_FO_ROWS, ''].join('\n');

/**
 * Synthetic Dynamics 365 Business Central `G/L Entries` export: its own column
 * names (`G/L Account No.`, `Posting Date`, `Document No.`, `Debit Amount`)
 * and one `dd-MMM-yyyy` date. One balanced voucher, 2,500.00 each side.
 */
const D365_BC_CSV = [
  'Entry No.,G/L Account No.,G/L Account Name,Posting Date,Document No.,Description,Debit Amount,Credit Amount,Currency Code,Business Unit Code',
  '1,1000,Cash,10-Feb-2026,BC-101,Client payment,"2,500.00",,USD,HO',
  '2,4000,Service Revenue,10-Feb-2026,BC-101,Client payment,,"2,500.00",USD,HO',
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

/**
 * Upload CSV bytes through the real drop zone and wait for the Map step to
 * unlock Preview. Preview only unlocks once `accountCode` and `postDate` are
 * mapped, so reaching it is itself the assertion that the D365 column names
 * were recognised without the user touching a dropdown.
 */
async function upload(csv: string, name: string): Promise<void> {
  const input = await screen.findByLabelText('Upload file');
  fireEvent.change(input, { target: { files: [new File([csv], name, { type: 'text/csv' })] } });
  await screen.findByText('Map Columns');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Preview Data' })).toBeEnabled());
}

async function preview(summary: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Preview Data' }));
  expect(await screen.findByText(summary)).toBeTruthy();
}

describe('D365 import → output integration (NFR-004)', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    resetGLStore();
  });

  afterEach(() => {
    resetClock();
  });

  it('imports a synthetic D365 F&O export and derives cent-exact, balanced outputs from it', async () => {
    const filename = 'GeneralJournalAccountEntry_USMF_2026-01.csv';
    renderPage();
    await upload(D365_FO_CSV, filename);
    await preview('0 errors detected in 8 rows');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Import Data' }));

    expect(await screen.findByText('Import Complete')).toBeTruthy();
    expect(screen.getByText('Successfully imported 8 rows.')).toBeTruthy();

    // --- the ledger: facts the export carried, canonicalised --------------
    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(8);
    expect(st.entries.map((e) => e.date)).toEqual([
      '2026-01-05',
      '2026-01-05',
      '2026-01-15',
      '2026-01-15',
      '2026-01-20',
      '2026-01-20',
      '2026-01-31',
      '2026-01-31',
    ]);
    // The main account is the ledger identity, not the composite
    // MainAccount-Department-CostCentre string D365 also exports.
    expect(st.entries.map((e) => e.accountCode)).toEqual([
      '1000',
      '3000',
      '1100',
      '4000',
      '5000',
      '1200',
      '6000',
      '1000',
    ]);
    expect(st.entries.map((e) => e.accountName)).toEqual([
      'Cash and Cash Equivalents',
      'Common Stock',
      'Accounts Receivable',
      'Product Revenue',
      'Cost of Goods Sold',
      'Inventory',
      'Operating Expense',
      'Cash and Cash Equivalents',
    ]);
    expect(st.entries.every((e) => e.currency === 'USD')).toBe(true);
    expect(st.entries.every((e) => e.entityId === 'USMF')).toBe(true);
    expect(st.entries.map((e) => e.reference)).toEqual([
      'US-0001',
      'US-0001',
      'US-0002',
      'US-0002',
      'US-0003',
      'US-0003',
      'US-0004',
      'US-0004',
    ]);
    expect(st.entries.map((e) => e.provenance?.sourceRow)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(st.entries.every((e) => e.provenance?.sourceFile === filename)).toBe(true);

    // --- control totals and scope, independently computed (FR-004/FR-001) --
    const hist = st.importHistory[0]!;
    expect(hist.status).toBe('success');
    expect(hist.controlTotals).toEqual({
      rows: 8,
      debit: '695000.00',
      credit: '695000.00',
      net: '0.00',
    });
    expect(hist.fileHash).toBe(hashFileBytes(new TextEncoder().encode(D365_FO_CSV)));
    const evidence = screen.getByTestId('import-batch-evidence').textContent ?? '';
    expect(evidence).toContain('Periods2026-01 (2026-01-05 → 2026-01-31)');
    expect(evidence).toContain('EntitiesUSMF');
    expect(evidence).toContain('CurrenciesUSD');

    // --- OUTPUT 1: the trial balance the Trial Balance screen reads --------
    st.generateTrialBalance();
    const tb = useGLStore.getState().trialBalance;
    expect(tb.map((r) => r.accountCode)).toEqual([
      '1000',
      '1100',
      '1200',
      '3000',
      '4000',
      '5000',
      '6000',
    ]);
    expect(tb.map((r) => [r.accountCode, r.debit, r.credit, r.netChange])).toEqual([
      ['1000', 500000, 45000, 455000],
      ['1100', 120000, 0, 120000],
      ['1200', 0, 30000, -30000],
      ['3000', 0, 500000, -500000],
      ['4000', 0, 120000, -120000],
      ['5000', 30000, 0, 30000],
      ['6000', 45000, 0, 45000],
    ]);
    expect(tb.find((r) => r.accountCode === '1000')?.accountName).toBe('Cash and Cash Equivalents');

    // --- OUTPUT 2: the balance sheet the Balance Sheet screen reads --------
    const bs = computeBalanceSheet(useGLStore.getState().entries, '2026-01-31');
    expect(bs).toMatchObject({
      totalAssets: 545000, // 455,000 cash + 120,000 AR − 30,000 inventory
      totalLiabilities: 0,
      postedEquity: 500000,
      currentPeriodEarnings: 45000, // 120,000 revenue − 30,000 COGS − 45,000 OpEx
      totalEquity: 545000,
      totalLiabilitiesAndEquity: 545000,
      diff: 0,
      isBalanced: true,
      entryCount: 8,
      unclassifiedCount: 0,
    });
  });

  it('imports a synthetic D365 Business Central export through the same gate', async () => {
    renderPage();
    await upload(D365_BC_CSV, 'GL_Entries_HO_2026-02.csv');
    await preview('0 errors detected in 2 rows');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Import Data' }));
    expect(await screen.findByText('Import Complete')).toBeTruthy();

    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(2);
    expect(st.entries.map((e) => e.accountCode)).toEqual(['1000', '4000']);
    expect(st.entries.map((e) => e.accountName)).toEqual(['Cash', 'Service Revenue']);
    // `10-Feb-2026` is the Business Central text date, canonicalised on entry.
    expect(st.entries.map((e) => e.date)).toEqual(['2026-02-10', '2026-02-10']);
    expect(st.entries.map((e) => e.reference)).toEqual(['BC-101', 'BC-101']);
    expect(st.entries.every((e) => e.currency === 'USD')).toBe(true);
    expect(st.entries.every((e) => e.entityId === 'HO')).toBe(true);
    expect(st.importHistory[0]!.controlTotals).toEqual({
      rows: 2,
      debit: '2500.00',
      credit: '2500.00',
      net: '0.00',
    });

    const bs = computeBalanceSheet(st.entries, '2026-02-28');
    expect(bs).toMatchObject({
      totalAssets: 2500,
      totalLiabilities: 0,
      postedEquity: 0,
      currentPeriodEarnings: 2500,
      totalEquity: 2500,
      diff: 0,
      isBalanced: true,
      entryCount: 2,
      unclassifiedCount: 0,
    });
  });

  it('names a D365 summary row and a calendar-invalid date by source row and blocks the file', async () => {
    // A D365 export can carry a trailing grand-total line, and a mistyped
    // posting date. Neither may become a posting: the summary line would
    // double every total it summarises, and both must be reported with their
    // source-file row and reason (FR-002). DEC-007 then refuses the whole
    // file rather than committing a filtered remainder.
    const csv = [
      D365_FO_HEADER,
      ...D365_FO_ROWS,
      'USMF,Total,,,31-Jan-2026,,USD,"695,000.00","695,000.00",Grand total',
      'USMF,1000,Cash and Cash Equivalents,1000-001-010,31-Feb-2026,US-0005,USD,"10.00",,Impossible date',
      '',
    ].join('\n');

    renderPage();
    await upload(csv, 'GeneralJournalAccountEntry_USMF_broken.csv');
    await preview('2 errors detected in 10 rows');

    // Each rejected line is named by its source-file row: the row-number cell
    // and the reason sit on the same table row.
    const summaryRow = screen
      .getByText(/non-transaction summary or header row "Total"/)
      .closest('tr') as HTMLElement;
    expect(within(summaryRow).getByRole('cell', { name: '10' })).toBeTruthy();

    const badDateRow = screen
      .getByText(/unparseable posting date "31-Feb-2026"/)
      .closest('tr') as HTMLElement;
    expect(within(badDateRow).getByRole('cell', { name: '11' })).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Fix Errors to Continue' })).toBeDisabled();

    // The gate runs before the store: not one row may land.
    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(0);
    expect(st.importHistory).toHaveLength(0);
    expect(st.importStatus).toBe('idle');
  });
});

describe('DEC-015(d) — trial-balance snapshot refusal', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    resetGLStore();
  });
  afterEach(() => {
    resetClock();
  });

  it('refuses a trial-balance snapshot by name and imports nothing', async () => {
    const tbCsv = [
      'Main account,Main account name,Opening balance,Debit,Credit,Closing balance',
      '1000,Cash,"400,000.00","150,000.00","50,000.00","500,000.00"',
      '3000,Common Stock,"-500,000.00",,"100,000.00","-600,000.00"',
      '',
    ].join('\n');

    renderPage();
    const input = await screen.findByLabelText('Upload file');
    fireEvent.change(input, {
      target: { files: [new File([tbCsv], 'TrialBalance_USMF.csv', { type: 'text/csv' })] },
    });

    // The refusal names what the file IS and what to export instead.
    expect(await screen.findByText(/trial balance snapshot/i, {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.queryByText('Map Columns')).toBeNull();

    const st = useGLStore.getState();
    expect(st.entries).toHaveLength(0);
    expect(st.importHistory).toHaveLength(0);
  });
});

describe('IMP-02 — source-side control totals in the wizard', () => {
  beforeEach(() => {
    actAs('Admin');
    setClock(PINNED);
    resetGLStore();
  });
  afterEach(() => {
    resetClock();
  });

  it('reconciles the batch against totals the owner read in D365', async () => {
    renderPage();
    await upload(D365_FO_CSV, 'GeneralJournalAccountEntry_USMF_2026-01.csv');
    await preview('0 errors detected in 8 rows');

    fireEvent.change(screen.getByLabelText(/expected total debit/i), {
      target: { value: '695,000.00' },
    });
    fireEvent.change(screen.getByLabelText(/expected total credit/i), {
      target: { value: '695000.00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Import Data' }));

    expect(await screen.findByText('Import Complete')).toBeTruthy();
    const evidence = screen.getByTestId('import-batch-evidence').textContent ?? '';
    expect(evidence).toContain('Reconciled to the totals read in Dynamics 365');
    expect(useGLStore.getState().importHistory[0]?.reconciliation?.status).toBe('reconciled');
  });

  it('shows the mismatch difference and never calls the batch reconciled', async () => {
    renderPage();
    await upload(D365_FO_CSV, 'GeneralJournalAccountEntry_USMF_2026-01.csv');
    await preview('0 errors detected in 8 rows');

    fireEvent.change(screen.getByLabelText(/expected total debit/i), {
      target: { value: '700,000.00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm & Import Data' }));

    expect(await screen.findByText('Import Complete')).toBeTruthy();
    const evidence = screen.getByTestId('import-batch-evidence').textContent ?? '';
    expect(evidence).toContain('Does not match');
    expect(evidence).toContain('-5000.00');
    expect(useGLStore.getState().importHistory[0]?.reconciliation?.status).toBe('mismatch');
  });
});
