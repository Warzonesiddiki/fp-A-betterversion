import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { financialStatusValues } from '@/components/ui/FinancialStatusBadge';
import AtlasVisualBaselinePage from './AtlasVisualBaselinePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/visual/atlas']}>
      <AtlasVisualBaselinePage />
    </MemoryRouter>
  );
}

describe('AtlasVisualBaselinePage (F-02 visual-regression harness)', () => {
  it('renders the page header with a certified baseline status', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Atlas Visual Baseline' })).toBeTruthy();
    expect(screen.getByText('Baseline fixtures fixed')).toBeTruthy();
  });

  it('renders all ten FinancialStatusBadge lifecycle states', () => {
    renderPage();

    const badgeSection = screen.getByTestId('badge-baseline');
    // Every badge is role="status" (non-colour-only state contract).
    expect(badgeSection.querySelectorAll('[role="status"]')).toHaveLength(
      financialStatusValues.length
    );
    expect(financialStatusValues).toHaveLength(10);
  });

  it('renders the PageHeader full anatomy and minimal variant', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Executive Dashboard' })).toBeTruthy();
    expect(screen.getByText('3 entries · 1 accounts · 0 budgets')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Chart of Accounts' })).toBeTruthy();
  });

  it('renders the canonical FinancialWorkspaceEmptyState with its three setup steps', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Set up your finance workspace' })
    ).toBeTruthy();
    expect(screen.getByLabelText('Setup steps').children).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Import actuals' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Set up accounts' })).toBeTruthy();
  });
});
