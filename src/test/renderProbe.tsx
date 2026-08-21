/**
 * View-layer divergence render-probe harness (W0.1.x, processFinding2).
 *
 * WHY THIS EXISTS
 * ---------------
 * A page can compute correctly and render wrongly. Neither the money-AST
 * detector nor mocked-engine page tests catch that divergence: the detector
 * sees source text, and page tests that mock their data layer only prove the
 * component renders when handed a fixture — they never re-derive the figures.
 *
 * The probe closes the loop end-to-end:
 *
 *   1. seed a known small GL ledger into the REAL glStore,
 *   2. render the real page (no data mocks — only browser-API mocks),
 *   3. assert the DOM shows exactly the engine-computed figures, formatted
 *      with the same display formatters the pages use.
 *
 * If an engine is fixed but a view still divides by 1000, rounds twice, or
 * drops the sign, the probe fails even though every unit test stays green.
 *
 * USAGE (adopt this pattern for divergence-risk pages)
 * ----------------------------------------------------
 *   import { seedGLLedger, renderMoneyProbe, formatProbeUSD } from '@/test/renderProbe';
 *   import { computeBalanceSheet } from './balanceSheetData'; // the engine
 *
 *   it('renders what the engine computes', () => {
 *     const entries = seedGLLedger([
 *       { accountCode: '1010', debit: 100_000, credit: 0 },
 *     ]);
 *     const report = computeBalanceSheet(entries);
 *     renderMoneyProbe(<BalanceSheetPage />);
 *     // Assert DOM == engine, never hand-written constants:
 *     expectFigure(formatProbeUSD(report.totalAssets));
 *   });
 *
 * Mock ONLY infrastructure in the spec file (ExportEngine, recharts,
 * lucide-react). Never mock @/store/glStore or the engine under probe —
 * that would reintroduce the blind spot this harness exists to close.
 */
import { act, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

/** A partial ledger row; everything else is filled with deterministic values. */
export type GLSeed = Partial<GLEntry> & Pick<GLEntry, 'accountCode' | 'debit' | 'credit'>;

let probeSeq = 0;

/** Normalise a seed row into a fully-populated GLEntry for the store. */
export function makeGLEntry(seed: GLSeed): GLEntry {
  probeSeq += 1;
  const id = seed.id ?? `probe-${probeSeq}`;
  return {
    id,
    accountId: seed.accountId ?? id,
    accountCode: seed.accountCode,
    accountName: seed.accountName ?? `Account ${seed.accountCode}`,
    period: seed.period ?? seed.date?.slice(0, 7) ?? '2026-08',
    periodName: seed.periodName ?? seed.period ?? '2026-08',
    debit: seed.debit,
    credit: seed.credit,
    netChange: seed.netChange ?? seed.debit - seed.credit,
    date: seed.date ?? '2026-08-01',
    amount: seed.amount ?? seed.debit + seed.credit,
    description: seed.description ?? `Render-probe entry ${id}`,
    reference: seed.reference ?? id,
    currency: seed.currency ?? 'USD',
  } as GLEntry;
}

/**
 * Seed a known ledger into the REAL glStore (no mock) so pages read the same
 * state production reads. Returns the normalised entries for direct engine
 * computation in the test body.
 */
export function seedGLLedger(seeds: readonly GLSeed[]): GLEntry[] {
  const entries = seeds.map(makeGLEntry);
  act(() => {
    useGLStore.setState({ entries });
  });
  return entries;
}

/**
 * Render a real page inside the router provider. Infrastructure mocks
 * (ExportEngine / recharts / icons) belong in the calling spec file; do NOT
 * mock stores or engines here.
 */
export function renderMoneyProbe(ui: ReactElement): void {
  render(<BrowserRouter>{ui}</BrowserRouter>);
}

/**
 * The display formatter matching the pages' default USD rendering via
 * useCurrencyFormatter (en-US, whole units). Use it on ENGINE outputs so the
 * assertion compares engine → formatter → DOM, not hardcoded strings.
 */
export function formatProbeUSD(value: number): string {
  if (value === 0 || value == null) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
}

/** Assert the exact formatted figure is visible somewhere in the DOM. */
export function expectFigure(formatted: string): void {
  const hits = screen.queryAllByText(formatted, { exact: false });
  expect(hits.length).toBeGreaterThan(0);
}
