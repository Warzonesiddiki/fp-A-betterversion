import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockEntries: {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}[] = [];

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: mockEntries };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: mockEntries }) }
  ),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Repeat: makeIcon(),
    ArrowRight: makeIcon(),
    AlertTriangle: makeIcon(),
    RefreshCw: makeIcon(),
  };
});

import TranslationResultPage from '@/pages/currency/TranslationResultPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/currency/translation']}>
      <TranslationResultPage />
    </MemoryRouter>
  );
}

const glEntry = (overrides: Partial<{ accountCode: string; debit: number; credit: number }>) => ({
  accountCode: '4000',
  accountName: 'Revenue',
  debit: 1000,
  credit: 0,
  ...overrides,
});

describe('TranslationResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEntries = [];
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays empty state when no data', () => {
    renderPage();
    expect(screen.getByText(/No Data to Translate/)).toBeTruthy();
  });

  it('translates a supported pair and renders both totals without fake P&L', () => {
    mockEntries = [glEntry({ accountCode: '4000', accountName: 'Revenue', debit: 1000 })];
    renderPage();
    expect(screen.getByText('Translated (EUR)')).toBeTruthy();
    expect(screen.queryByText(/Gain\/Loss/i)).toBeNull();
    expect(screen.queryByText(/Translation Gain\/Loss/i)).toBeNull();
  });

  it('blocks translation with an error state when the pair has no rate (F-0001)', () => {
    // CHF has no source rate table; pre-fix this silently translated at 1.0.
    mockEntries = [glEntry({})];
    renderPage();
    fireEvent.change(screen.getByLabelText(/Source Currency/i), { target: { value: 'CHF' } });

    expect(screen.getByText('Missing exchange rate')).toBeTruthy();
    expect(screen.getByTestId('error-code').textContent).toBe('MISSING_FX_RATE');
    expect(screen.getByText(/No exchange rate is available for CHF . EUR/)).toBeTruthy();

    // No computed results may be shown for a missing pair.
    expect(screen.queryByText('Translated (EUR)')).toBeNull();
    expect(screen.queryByText(/Original \(CHF\)/)).toBeNull();
  });

  it('recovers once a supported pair is selected after a missing-rate error', () => {
    mockEntries = [glEntry({})];
    renderPage();
    fireEvent.change(screen.getByLabelText(/Source Currency/i), { target: { value: 'CHF' } });
    expect(screen.getByText('Missing exchange rate')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Source Currency/i), { target: { value: 'USD' } });
    expect(screen.queryByText('Missing exchange rate')).toBeNull();
    expect(screen.getByText('Translated (EUR)')).toBeTruthy();
  });
});
