import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { runMonteCarlo } from '@/workers';
import GoalSeekPage from '@/pages/analytics/GoalSeekPage';
import type { GLEntry } from '@/types';

vi.mock('@/workers', () => ({
  runMonteCarlo: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/analytics/goal-seek']}>
      <Routes>
        <Route path="/analytics/goal-seek" element={<GoalSeekPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const operatingEntries = [
  {
    id: '1',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 1000,
    netChange: 1000,
    date: '2026-01-15',
    amount: 1000,
    description: 'Sale',
    reference: '',
  },
  {
    id: '2',
    accountId: '5000',
    accountCode: '5000',
    accountName: 'COGS',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 400,
    credit: 0,
    netChange: 400,
    date: '2026-01-15',
    amount: 400,
    description: 'COGS',
    reference: '',
  },
] as GLEntry[];

describe('GoalSeekPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the Financial Modeling heading', () => {
    renderPage();
    expect(screen.getByText(/Financial Modeling/i)).toBeInTheDocument();
  });

  it('displays the Break-Even mode button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Break-Even/i })).toBeInTheDocument();
  });

  it('displays the Calculate button for break-even mode', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Calculate/i })).toBeInTheDocument();
  });

  it('renders the known-answer contribution identity in the DOM', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Calculate/i }));
    expect(screen.getByText('40.0%')).toBeInTheDocument();
    expect(screen.getByText('$1,250,000')).toBeInTheDocument();
    expect(screen.getByText('$3,750,000')).toBeInTheDocument();
  });

  it('does not invent a $1,000,000 Monte Carlo base on an empty ledger', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Monte Carlo/i }));
    expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/\$1,000,000/);
    expect(runMonteCarlo).not.toHaveBeenCalled();
  });

  it('summarises a mocked Monte Carlo draw through the money helpers', async () => {
    const user = userEvent.setup();
    useGLStore.setState({ entries: operatingEntries });
    vi.mocked(runMonteCarlo).mockResolvedValue({
      results: [
        { iteration: 0, values: { revenue: 100, costs: 40 }, output: 60 },
        { iteration: 1, values: { revenue: 100, costs: 80 }, output: 20 },
        { iteration: 2, values: { revenue: 100, costs: 90 }, output: 10 },
      ],
      statistics: {
        mean: 30,
        stdDev: 0,
        min: 10,
        max: 60,
        p5: 10,
        p25: 10,
        p50: 20,
        p75: 60,
        p95: 60,
      },
    });
    renderPage();
    await user.click(screen.getByRole('button', { name: /Monte Carlo/i }));
    await user.click(screen.getByRole('button', { name: /Run Simulation/i }));
    expect(await screen.findByText('$30')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});
