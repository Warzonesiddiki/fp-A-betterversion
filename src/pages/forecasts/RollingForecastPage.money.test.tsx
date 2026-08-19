import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import { useGLStore } from '@/store/glStore';

/**
 * Money / anti-fabrication probe for the rolling forecast.
 *
 * The derivation runs for real. Seeded ledger: revenue and expenses both grow
 * exactly 10% a month (100,000 → 133,100 and 50,000 → 66,550), so posted
 * revenue is 464,100, posted expenses 232,050, growth 10.0%, and the
 * walk-forward backtest scores 100%.
 */
const LEDGER = ['2026-01', '2026-02', '2026-03', '2026-04'].flatMap((period, i) => {
  const revenue = [100000, 110000, 121000, 133100][i]!;
  const expenses = [50000, 55000, 60500, 66550][i]!;
  return [
    { id: `r${i}`, accountCode: '4000', debit: 0, credit: revenue, period, date: `${period}-15` },
    { id: `e${i}`, accountCode: '6000', debit: expenses, credit: 0, period, date: `${period}-15` },
  ];
});

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('@/components/ui/HelpPanel', () => ({ HelpPanel: () => <div /> }));

import RollingForecastPage from '@/pages/forecasts/RollingForecastPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/forecasts/rolling']}>
      <RollingForecastPage />
    </MemoryRouter>
  );
}

describe('RollingForecastPage — posted actuals are labelled as posted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: LEDGER as never, isLoading: false, importError: null } as never);
  });

  it('does not present posted actuals as a forecast', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Posted Revenue');
    expect(text).toContain('Posted Expenses');
    expect(text).toContain('$464,100');
    expect(text).toContain('$232,050');
    expect(text).not.toContain('Forecast Revenue');
    expect(text).not.toContain('Forecast Expenses');
  });

  it('reports a backtested accuracy, not a volatility count', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Method Accuracy (backtest)');
    expect(text).toContain('100.0%');
    expect(text).toMatch(/walk-forward, 1 period/);
    expect(text).not.toContain('Forecast Accuracy');
  });

  it('shows growth measured separately for revenue and expenses', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('Revenue Growth (mean MoM)');
    expect(text).toContain('Expense Growth (mean MoM)');
    expect(text).toContain('10.0%');
  });

  it('discloses the projection method and the missing confidence interval', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toMatch(/Compound extrapolation of the mean month-over-month/);
    expect(text).toContain('Confidence interval — unavailable.');
    expect(text).not.toContain('95% CI');
    expect(text).not.toContain('8.5%');
  });

  it('labels every projected row as projected', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('projected');
    expect(text).toContain('2026-05'); // first projected month
    expect(text).toContain('posted');
  });

  it('empty-states with no entries', () => {
    useGLStore.setState({ entries: [] } as never);
    const { container } = renderPage();
    expect(container.textContent).not.toContain('$464,100');
  });
});

describe('RollingForecastPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'RollingForecastPage.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('declares no fixed confidence interval', () => {
    expect(source).not.toMatch(/confidenceInterval:\s*[\d.]+/);
    expect(source).not.toMatch(/95% CI/);
  });

  it('does not compute accuracy from month-over-month volatility', () => {
    expect(source).not.toMatch(/Math\.abs\(v\)\s*<\s*0\.1/);
    expect(source).not.toMatch(/forecastAccuracy/);
  });

  it('does not accumulate debit − credit across all accounts', () => {
    expect(source).not.toMatch(/actual\s*\+=/);
    expect(source).not.toMatch(/e\.debit\s*-\s*e\.credit/);
  });

  it('derives everything through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/forecasts\/rollingForecastModel'/);
    expect(source).toMatch(/deriveRollingForecast\(entries, periodMonths\)/);
  });

  it('keeps layout scaling out of money expressions and off decimalUtils', () => {
    expect(source).not.toMatch(/\(d\.\w+\s*\/\s*maxVal\)\s*\*\s*100/);
    expect(source).toMatch(/scaleToPercent/);
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });
});
