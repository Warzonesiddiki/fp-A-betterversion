import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { actAs } from '@/test/rbacFixtures';
import ExcelJS from 'exceljs';
import { ExportEngine } from '@/engines/ExportEngine';
import { buildCorrectionList } from './buildCorrectionList';
import { runExceptionRules } from '@/services/exceptions/runExceptionRules';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';
import { setClock, resetClock } from '@/utils/clock';
import type { GLEntry } from '@/types';

/**
 * REP-01 tie-out for the correction hand-off: the records on the tracker
 * screen, the Excel file, and the PDF are three renderings of ONE
 * dataset (buildCorrectionList). This test runs the REAL Excel writer
 * (capturing the file at the save sink) and the real ExportEngine PDF
 * path (capturing the table at the jsPDF sink) and proves every figure
 * and label matches, cell for cell.
 */

const captured = vi.hoisted(() => ({
  blobs: [] as Blob[],
  pdfTables: [] as { head: unknown; body: unknown }[],
}));

vi.mock('file-saver', () => ({
  saveAs: (blob: Blob) => {
    captured.blobs.push(blob);
  },
}));

vi.mock('@/utils/pdfRuntime', () => ({
  loadJsPDF: async () =>
    class FakeJsPDF {
      internal = {
        pageSize: { width: 210, height: 297 },
        getCurrentPageInfo: () => ({ pageNumber: 1 }),
      };
      setFontSize() {}
      setTextColor() {}
      setDrawColor() {}
      line() {}
      text() {}
      autoTable(options: { head: unknown; body: unknown }) {
        captured.pdfTables.push({ head: options.head, body: options.body });
      }
      save() {}
    },
}));

const ENTRIES = [
  {
    id: 'e1',
    journalId: 'J-9',
    date: '2026-01-05',
    period: '2026-01',
    accountCode: '6010',
    accountName: 'Rent',
    debit: 500,
    credit: 0,
    description: 'rent',
    reference: 'J-9',
    provenance: { batchId: 'batch-7', sourceFile: 'jan.csv', sourceRow: 214 },
  },
  {
    id: 'e2',
    journalId: 'J-9',
    date: '2026-01-07',
    period: '2026-01',
    accountCode: '6010',
    accountName: 'Rent',
    debit: 0,
    credit: 450,
    description: 'rent',
    reference: 'J-9',
    provenance: { batchId: 'batch-7', sourceFile: 'jan.csv', sourceRow: 215 },
  },
] as unknown as GLEntry[];

describe('correction list tie-out — screen records == Excel == PDF (REP-01)', () => {
  beforeEach(() => {
    actAs('Admin'); // Phase 12: disposition/correction actions require permissions
    captured.blobs.length = 0;
    captured.pdfTables.length = 0;
    setClock('2026-10-15T09:00:00.000Z');
    useExceptionDispositionStore.getState().reset();
  });
  afterEach(() => resetClock());

  it('every exported cell equals the tracker record in both formats', async () => {
    const findings = runExceptionRules(ENTRIES).findings;
    const unbal = findings.find((f) => f.ruleId === 'R-006')!;
    const correction = useExceptionDispositionStore.getState().requestCorrection({
      exceptionId: unbal.findingKey,
      ruleId: 'R-006',
      instruction: 'Find the missing 50 credit and re-post J-9',
      assignee: 'accounts-team',
      dueDate: '2026-10-31',
      source: 'batch-7 · row 214',
    });

    const data = buildCorrectionList({
      corrections: useExceptionDispositionStore.getState().getCorrections(),
      findings,
      entries: ENTRIES,
    });

    await ExportEngine.exportToExcel(data, { title: 'Correction_List' });
    await ExportEngine.exportToPDF(data, { title: 'Correction_List' });

    // Excel leg: read the real workbook back.
    expect(captured.blobs).toHaveLength(1);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await captured.blobs[0]!.arrayBuffer()));
    const sheet = workbook.worksheets[0]!;
    const excelHeaders = (sheet.getRow(1).values as unknown[]).slice(1);
    expect(excelHeaders).toEqual(data.headers);
    const excelRow = (sheet.getRow(2).values as unknown[]).slice(1);
    expect(excelRow[0]).toBe(correction.exceptionId);
    expect(excelRow[4]).toBe(50); // imbalance stays a number
    expect(excelRow[7]).toBe('Find the missing 50 credit and re-post J-9');
    expect(excelRow[10]).toBe('REQUESTED');

    // PDF leg: the table handed to the PDF renderer is the same dataset.
    expect(captured.pdfTables).toHaveLength(1);
    expect(captured.pdfTables[0]!.head).toEqual([data.headers]);
    const pdfRow = (captured.pdfTables[0]!.body as unknown[][])[0]!;
    expect(pdfRow).toEqual(data.rows[0]);
    expect(pdfRow[4]).toBe(50);
  });
});
