/**
 * @vitest-environment jsdom
 *
 * MigrationWizard must actually migrate.
 *
 * The defect this file exists for: `handleImport` never touched the engine. It
 * looped `setTimeout` from 0 to 100 %, set the message "Import complete", and
 * called `onComplete('snapshot-' + Date.now())` — with the comment "In a real
 * implementation, this would call engine.importData()". So the wizard reported
 * a finished import, handed its caller a snapshot id that existed nowhere, and
 * `MigrationPage.handleComplete` then navigated to /data with
 * `migrationComplete: true` plus that fabricated id and refreshed a history
 * list that could never contain it.
 *
 * These tests drive the real wizard with a real xlsx workbook and the real
 * `MigrationEngine`, so every assertion is about what the product does rather
 * than about what a mock was told to return. Only `FileDropZone` is stubbed, to
 * hand the wizard the workbook the test built.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import ExcelJS from 'exceljs';
import type { MigrationEngine } from '@/engines/MigrationEngine';
import MigrationWizard from './MigrationWizard';

// The workbook the stubbed drop zone hands to the wizard on click.
let pendingFile: File | null = null;

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ onFile }: { onFile: (f: File) => void }) => (
    <div data-testid="file-drop-zone">
      <button data-testid="upload-btn" onClick={() => onFile(pendingFile!)}>
        Upload
      </button>
    </div>
  ),
}));

/** Build a real .xlsx workbook so the engine's real parse path is exercised. */
async function xlsxFile(
  rows: (string | number)[][],
  fileName: string,
  sheetName = 'Data'
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  for (const row of rows) {
    worksheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

const THREE_ROWS: (string | number)[][] = [
  ['Account', 'Amount'],
  ['4000', '50000'],
  ['5000', '20000'],
];

function renderWizard(props: { engine?: MigrationEngine } = {}) {
  const onComplete = vi.fn();
  const onCancel = vi.fn();
  render(<MigrationWizard onComplete={onComplete} onCancel={onCancel} {...props} />);
  return { onComplete, onCancel };
}

/** source → upload → mapping → preview → confirm. */
async function reachConfirmStep(): Promise<void> {
  await act(async () => {
    screen.getByText('Excel (.xlsx/.xls)').click();
  });
  await act(async () => {
    screen.getByTestId('upload-btn').click();
  });
  await waitFor(() => expect(screen.getByText('Column Mapping')).toBeInTheDocument());
  await act(async () => {
    screen.getByRole('button', { name: /Continue/ }).click();
  });
  await waitFor(() => expect(screen.getByText('Data Preview')).toBeInTheDocument());
  await act(async () => {
    screen.getByRole('button', { name: /Continue/ }).click();
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Start Import/ })).toBeInTheDocument()
  );
}

async function startImport(): Promise<void> {
  await act(async () => {
    screen.getByRole('button', { name: /Start Import/ }).click();
  });
}

beforeEach(() => {
  pendingFile = null;
  vi.clearAllMocks();
});

describe('MigrationWizard import execution', () => {
  it('analyzes the uploaded workbook with the real engine before offering to import', async () => {
    pendingFile = await xlsxFile(THREE_ROWS, 'budget.xlsx');
    renderWizard();

    await reachConfirmStep();

    // The mapping table is populated from the engine's real autoMapColumns
    // result, and the confirm step shows the real file name and row count.
    expect(screen.getByText('budget.xlsx')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('imports the rows through MigrationEngine instead of simulating progress', async () => {
    pendingFile = await xlsxFile(THREE_ROWS, 'budget.xlsx');
    renderWizard();
    await reachConfirmStep();

    await startImport();

    // The engine's own completion message names the row count it validated and
    // the sheet it read. The simulated loop said "Import complete" for any
    // file, including one with nothing in it.
    await waitFor(
      () => expect(screen.getByText(/Imported 2 rows from "Data"/i)).toBeInTheDocument(),
      {
        timeout: 8000,
      }
    );
    expect(screen.queryByText('Import complete')).toBeNull();
  });

  it('reports the snapshot id the engine recorded, not a fabricated one', async () => {
    pendingFile = await xlsxFile(THREE_ROWS, 'budget.xlsx');
    const { onComplete } = renderWizard();
    await reachConfirmStep();

    await startImport();

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 8000 });
    const reportedId = onComplete.mock.calls[0]![0] as string;
    // MigrationEngine ids its snapshots `migration-<nowMs()>`. The wizard used
    // to invent `snapshot-<Date.now()>`, an id no store or engine ever held, so
    // MigrationPage navigated away claiming a migration that did not exist.
    expect(reportedId).toMatch(/^migration-\d+$/);
  });

  it('reports readiness as unavailable for a workbook with no data rows', async () => {
    pendingFile = await xlsxFile([['Account', 'Amount']], 'header-only.xlsx');
    renderWizard();

    await act(async () => {
      screen.getByText('Excel (.xlsx/.xls)').click();
    });
    await act(async () => {
      screen.getByTestId('upload-btn').click();
    });
    await waitFor(() => expect(screen.getByText('Column Mapping')).toBeInTheDocument());

    // A header-only workbook has nothing to assess. The wizard used to show
    // "Readiness Score 100%" with a green icon for it. Scope the score
    // assertion to the readiness KPI: the mapping table legitimately renders
    // 100% confidence for exact column matches.
    const readinessKpi = screen.getByRole('region', { name: 'Readiness Score' });
    expect(within(readinessKpi).getByText('—')).toBeInTheDocument();
    expect(within(readinessKpi).queryByText('100%')).toBeNull();
    expect(screen.getByTestId('readiness-not-assessed')).toHaveTextContent(/no data rows/i);
    expect(screen.queryByText('null%')).toBeNull();
  });

  it('refuses to claim success for a workbook that holds no data rows', async () => {
    // Header only: readiness cannot be earned and there is nothing to import.
    pendingFile = await xlsxFile([['Account', 'Amount']], 'header-only.xlsx');
    const { onComplete } = renderWizard();
    await reachConfirmStep();

    await startImport();

    await waitFor(
      () =>
        expect(
          screen.getByText(/Sheet must have a header row and at least one data row/i)
        ).toBeInTheDocument(),
      { timeout: 8000 }
    );
    expect(screen.queryByText(/Import completed successfully/i)).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('uses the engine instance the caller injects, so the snapshot lands in the caller history', async () => {
    pendingFile = await xlsxFile(THREE_ROWS, 'budget.xlsx');

    const executeMigration = vi.fn(async () => ({
      result: {
        valid: true,
        errors: [],
        warnings: [],
        rowCount: 2,
        columnCount: 2,
        columns: ['Account', 'Amount'],
        preview: [],
      },
      snapshot: {
        id: 'migration-injected-1',
        timestamp: '2026-03-31T12:00:00.000Z',
        source: 'excel' as const,
        fileName: 'budget.xlsx',
        plan: {
          source: 'excel' as const,
          sheets: [{ name: 'Data', rows: 2, columns: ['Account', 'Amount'] }],
          mappings: [],
          estimatedDuration: '< 1 minute',
          warnings: [],
        },
        data: [],
        applied: true,
      },
    }));
    const injected = {
      onProgress: vi.fn(() => () => {}),
      analyzeMigration: vi.fn(async () => ({
        source: 'excel' as const,
        readiness: {
          score: 100,
          status: 'green' as const,
          issues: [],
          sheetCount: 1,
          totalRows: 2,
          detectedColumns: [
            {
              sourceColumn: 'Account',
              targetField: 'account',
              confidence: 1,
              matchType: 'exact' as const,
            },
            {
              sourceColumn: 'Amount',
              targetField: 'amount',
              confidence: 1,
              matchType: 'exact' as const,
            },
          ],
          unmappedColumns: [],
          formulaComplexity: 'simple' as const,
          hasExternalLinks: false,
          hasMergedCells: false,
          hasHiddenRows: false,
        },
        plan: {
          source: 'excel' as const,
          sheets: [{ name: 'Data', rows: 2, columns: ['Account', 'Amount'] }],
          mappings: [],
          estimatedDuration: '< 1 minute',
          warnings: [],
        },
        workbook: {},
      })),
      executeMigration,
    } as unknown as MigrationEngine;

    const { onComplete } = renderWizard({ engine: injected });
    await reachConfirmStep();

    await startImport();

    await waitFor(() => expect(executeMigration).toHaveBeenCalledTimes(1), { timeout: 8000 });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 8000 });
    expect(onComplete.mock.calls[0]![0]).toBe('migration-injected-1');
    // The workbook the caller injected is the one that was executed.
    expect(executeMigration.mock.calls[0]![0]).toBe(pendingFile);
  });
});
