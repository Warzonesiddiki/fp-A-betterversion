/**
 * Export percent-cell honesty — the class guard (backlog P1 item 4).
 *
 * WHY THIS EXISTS
 * ---------------
 * `ExportEngine.exportToExcel` (`src/engines/exportExcel.ts`) stamps
 * `$#,##0.00` on EVERY numeric data cell, so a percentage handed to it as a
 * number is published to the reader as dollars. Six pages did exactly that:
 * their Excel export said `$25.00` under a "Budget Utilization (%)" label
 * while the same page's PDF branch and its own on-screen table said `25%`.
 * `InsurancePage` went further and wrote `insuranceStats.lossRatio ?? 0`,
 * so a ledger with no earned premium published `$0.00` where the screen said
 * `N/A` — a missing-not-zero violation, not just a format one.
 *
 * The board pack had the same defect and now has a full screen↔workbook
 * tie-out (`BoardPackPage.exportTieOut.test.tsx`). This file is the mechanical
 * class guard for the rest of the surface, and it is deliberately not a
 * value oracle: each page's own numbers are already pinned elsewhere:
 *
 *   RULE  A cell whose label is a percentage must reach the workbook as a
 *         STRING shaped like the screen (`25%`), never as a number the engine
 *         would currency-format.
 *   RULE  A ratio the supplied ledger cannot support must be the page's
 *         declared not-available marker (`N/A`), never `0` / `$0.00`.
 *   RULE  Money stays money: the same sheets must still carry real numbers
 *         under their money labels, so a "fix" that stringifies everything
 *         fails here too.
 *
 * Only the browser end (`file-saver`) is mocked. `ExportEngine` is the real
 * one and every assertion is made against the real workbook it writes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExcelJS from 'exceljs';
import type { ReactElement } from 'react';

const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({ saveAs: mockSaveAs }));

import GovernmentPage from './government/GovernmentPage';
import InsurancePage from './insurance/InsurancePage';
import LogisticsPage from './logistics/LogisticsPage';
import FXExposurePage from './treasury/FXExposurePage';
import PromoAnalysisPage from './retail/PromoAnalysisPage';
import UnderwritingPage from './insurance/UnderwritingPage';
import { useGLStore } from '@/store/glStore';
import { useLogisticsStore } from '@/store/logisticsStore';
import { useRetailStore } from '@/store/retailStore';
import type { GLEntry } from '@/types';

/* ------------------------------------------------------------------ fixture */

let seq = 0;

/** A balanced-ish GL row with only the fields these six pages read. */
function gl(accountCode: string, debit: number, credit: number): GLEntry {
  seq += 1;
  const id = `pct-${seq}`;
  return {
    id,
    accountId: id,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-08',
    periodName: '2026-08',
    debit,
    credit,
    netChange: debit - credit,
    date: '2026-08-01',
    amount: debit + credit,
    description: `percent-honesty entry ${id}`,
    reference: id,
    currency: 'USD',
  } as GLEntry;
}

function seedGl(entries: GLEntry[]): void {
  act(() => {
    useGLStore.setState({ entries, importError: null });
  });
}

function seedLogistics(): void {
  act(() => {
    useLogisticsStore.setState({
      shipments: [
        {
          id: 's1',
          origin: 'A',
          destination: 'B',
          carrier: 'C1',
          status: 'Delivered',
          cost: 100,
          eta: '2026-08-02',
        },
        {
          id: 's2',
          origin: 'A',
          destination: 'B',
          carrier: 'C1',
          status: 'Delivered',
          cost: 100,
          eta: '2026-08-02',
        },
        {
          id: 's3',
          origin: 'A',
          destination: 'B',
          carrier: 'C1',
          status: 'Delivered',
          cost: 100,
          eta: '2026-08-02',
        },
        {
          id: 's4',
          origin: 'A',
          destination: 'B',
          carrier: 'C2',
          status: 'Delayed',
          cost: 100,
          eta: '2026-08-03',
        },
      ] as never,
    });
  });
}

function seedPromotions(): void {
  act(() => {
    useRetailStore.setState({
      promotions: [
        {
          id: 'p1',
          name: 'Summer Sale',
          type: 'Percentage',
          discountPercent: 15,
          startDate: '2026-06-01',
          endDate: '2026-06-30',
          cost: 45_000,
          revenue: 320_000,
          baselineRevenue: 210_000,
          grossMarginPercent: 40,
          status: 'completed',
        },
      ] as never,
    });
  });
}

/* ------------------------------------------------------------------ harness */

interface Sheet {
  headers: string[];
  rows: unknown[][];
}

function renderPage(page: ReactElement) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

async function exportWorkbook(button: HTMLElement): Promise<Sheet> {
  mockSaveAs.mockClear();
  fireEvent.click(button);
  await waitFor(() => expect(mockSaveAs).toHaveBeenCalledTimes(1), { timeout: 10_000 });

  const [blob] = mockSaveAs.mock.calls[0] as [Blob, string];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await blob.arrayBuffer());
  const sheet = workbook.worksheets[0]!;

  const all: unknown[][] = [];
  sheet.eachRow((row) => {
    const cells: unknown[] = [];
    for (let column = 1; column <= sheet.columnCount; column += 1)
      cells.push(row.getCell(column).value);
    all.push(cells);
  });

  return { headers: (all[0] ?? []).map((h) => String(h)), rows: all.slice(1) };
}

/**
 * The value of the first row whose first cell is `label`. Every export in this
 * file is `[label, value, …notes]`, so the value is the second cell.
 */
function rowValue(sheet: Sheet, label: string): unknown {
  const row = sheet.rows.find((cells) => cells[0] === label);
  expect(row, `export published no row labelled "${label}"`).toBeDefined();
  return row![1];
}

/** Every non-empty value under a column header. */
function columnValues(sheet: Sheet, header: string): unknown[] {
  const index = sheet.headers.indexOf(header);
  expect(
    index,
    `export published no column headed "${header}" (headers: ${sheet.headers.join(', ')})`
  ).toBeGreaterThan(-1);
  return sheet.rows
    .map((cells) => cells[index])
    .filter((v) => v !== null && v !== undefined && v !== '');
}

/** RULE 1 — a percentage reaches the workbook as a string, not a number. */
function expectPercentCell(value: unknown, where: string): void {
  expect(
    typeof value,
    `${where}: the workbook cell is a ${typeof value} (${String(value)}). Numbers get $#,##0.00 from ` +
      `ExportEngine, so a percentage must be published as the string the screen shows.`
  ).toBe('string');
  expect(String(value), `${where}: "${String(value)}" is not a percent string`).toMatch(
    /^-?\d+(\.\d+)?%$/
  );
}

/** RULE 3 — money must still be money. */
function expectMoneyCell(value: unknown, where: string): void {
  expect(typeof value, `${where}: money must stay a number, got "${String(value)}"`).toBe('number');
}

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useGLStore.setState({ entries: [], importError: null });
    useLogisticsStore.setState({ shipments: [] });
    useRetailStore.setState({ promotions: [] });
  });
});

/* ------------------------------------------------------------------- cases */

describe('exports never publish a percentage as money', () => {
  it('GovernmentPage: budget utilization is the same 25% its PDF branch prints', async () => {
    // utilization = credit / debit × 100 = 250 / 1000 × 100 = 25
    seedGl([gl('5100', 1000, 0), gl('4100', 0, 250)]);
    renderPage(<GovernmentPage />);

    const sheet = await exportWorkbook(screen.getByLabelText('Export Excel Workbook'));

    expectPercentCell(
      rowValue(sheet, 'Budget Utilization (%)'),
      'GovernmentPage · Budget Utilization (%)'
    );
    expect(rowValue(sheet, 'Budget Utilization (%)')).toBe('25%');
    expectMoneyCell(
      rowValue(sheet, 'Total Appropriations'),
      'GovernmentPage · Total Appropriations'
    );
  });

  it('InsurancePage: loss ratio is a percent, and an unsupportable ratio is N/A — never a zero cell', async () => {
    // loss ratio = losses (51xx) / earned premium (42xx) = 1000 / 4000 = 25
    seedGl([gl('4200', 0, 4000), gl('5100', 1000, 0)]);
    const view = renderPage(<InsurancePage />);

    const sheet = await exportWorkbook(screen.getByLabelText('Export Excel Workbook'));
    expectPercentCell(rowValue(sheet, 'Loss Ratio (%)'), 'InsurancePage · Loss Ratio (%)');
    expect(rowValue(sheet, 'Loss Ratio (%)')).toBe('25%');

    // Now the ledger carries losses but no earned premium: `percentOf` returns
    // null because the denominator is 0, and the screen says N/A. `?? 0` used to
    // publish `0`, which the engine then rendered as $0.00.
    view.unmount();
    seedGl([gl('5100', 1000, 0)]);
    renderPage(<InsurancePage />);
    const second = await exportWorkbook(screen.getByLabelText('Export Excel Workbook'));

    expect(
      typeof rowValue(second, 'Loss Ratio (%)'),
      'InsurancePage · Loss Ratio (%): an absent ratio was published as a number'
    ).toBe('string');
    expect(rowValue(second, 'Loss Ratio (%)')).toBe('N/A');
  });

  it('LogisticsPage: on-time delivery is a percent string', async () => {
    // 3 delivered of 4 delivered+delayed = 75
    seedLogistics();
    seedGl([gl('5100', 1000, 0), gl('4100', 0, 250)]);
    renderPage(<LogisticsPage />);

    const sheet = await exportWorkbook(screen.getByLabelText('Export Excel Workbook'));

    expectPercentCell(
      rowValue(sheet, 'On-Time Delivery Rate (%)'),
      'LogisticsPage · On-Time Delivery Rate (%)'
    );
    expect(rowValue(sheet, 'On-Time Delivery Rate (%)')).toBe('75%');
  });

  it('FXExposurePage: hedge ratio and spot rate are text, the G/L column is still money', async () => {
    renderPage(<FXExposurePage />);

    const sheet = await exportWorkbook(screen.getByRole('button', { name: /^Excel$/i }));

    const ratios = columnValues(sheet, 'Hedge Ratio');
    expect(ratios.length).toBeGreaterThan(0);
    ratios.forEach((value) => expectPercentCell(value, 'FXExposurePage · Hedge Ratio'));

    // A spot rate is a rate, not an amount: `1.08` was reaching the reader as $1.08.
    columnValues(sheet, 'Spot Rate').forEach((value) => {
      expect(
        typeof value,
        `FXExposurePage · Spot Rate: published as a number (${String(value)}), which the engine formats as money`
      ).toBe('string');
    });

    columnValues(sheet, 'Unrealized G/L').forEach((value) =>
      expectMoneyCell(value, 'FXExposurePage · Unrealized G/L')
    );
  });

  it('PromoAnalysisPage: the discount column is the percent its table renders', async () => {
    seedPromotions();
    renderPage(<PromoAnalysisPage />);

    const sheet = await exportWorkbook(screen.getByRole('button', { name: /^Excel$/i }));

    const discounts = columnValues(sheet, 'Discount');
    expect(discounts.length).toBeGreaterThan(0);
    discounts.forEach((value) => expectPercentCell(value, 'PromoAnalysisPage · Discount'));
    expect(discounts[0]).toBe('15%');
  });

  it('UnderwritingPage: the loss ratio row is the percent the KPI shows', async () => {
    // loss ratio = claims (5xxx) / premium (4xxx) = 400 / 1000 = 40
    seedGl([gl('4000', 0, 1000), gl('5000', 400, 0)]);
    renderPage(<UnderwritingPage />);

    const sheet = await exportWorkbook(screen.getByRole('button', { name: /Export Derivation/i }));

    expectPercentCell(rowValue(sheet, 'Loss ratio %'), 'UnderwritingPage · Loss ratio %');
    expect(rowValue(sheet, 'Loss ratio %')).toBe('40.0%');
  });
});
