// =============================================================================
// WhatIfPage tests — K30 four-states
// -----------------------------------------------------------------------------
// The WhatIfSandboxEngine is REAL and fully synchronous: scenario creation,
// assumption edits and comparisons run against actual engine state (no store
// or engine mocks). Only icons (shared lucide double, N-0001) and the recharts
// SVG surface are stubbed.
//
// Honesty rule (K30): every derivation on this page is synchronous, so there
// is deliberately NO hydrate/loading skeleton — and this suite asserts none
// appears, so a fake loading state cannot be reintroduced silently.
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';
import WhatIfPage from '@/pages/forecasts/WhatIfPage';
import { WhatIfSandboxEngine } from '@/engines/WhatIfSandboxEngine';

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
}));

function openSelectTarget(value: string): void {
  fireEvent.change(screen.getByLabelText('Comparison target scenario'), {
    target: { value },
  });
}

describe('WhatIfPage — K30 four-states (real sandbox engine)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('K30: empty sandbox list renders the shared EmptyState under the page h1 with a create CTA', () => {
    render(<WhatIfPage />);
    // h1 discipline: PageHeader stays mounted in the empty branch.
    expect(screen.getByRole('heading', { name: /what-if sandbox/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no what-if scenarios yet/i)).toBeInTheDocument();
    expect(screen.getByTestId('whatif-empty-create')).toBeInTheDocument();
  });

  it('K30: the empty-state CTA creates a real sandbox and enters the content state synchronously', () => {
    render(<WhatIfPage />);
    fireEvent.click(screen.getByTestId('whatif-empty-create'));
    // Sliders are labelled and rendered from the real engine-backed sandbox.
    expect(screen.getByLabelText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what-if sandbox/i, level: 1 })).toBeInTheDocument();
    // The single scenario reports zero modifications — derived state, not an
    // invented baseline.
    expect(screen.getByText(/0 modifications · draft/i)).toBeInTheDocument();
  });

  it('K30 honesty: no hydrate skeleton or busy region exists in any state (synchronous derivation)', () => {
    const { container } = render(<WhatIfPage />);
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('[data-testid*="skeleton"]')).toBeNull();

    fireEvent.click(screen.getByTestId('whatif-empty-create'));
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('[data-testid*="skeleton"]')).toBeNull();
  });

  it('labels assumption starting values as editable defaults, not ledger-derived figures', () => {
    render(<WhatIfPage />);
    fireEvent.click(screen.getByTestId('whatif-empty-create'));
    const note = screen.getByTestId('whatif-defaults-note');
    expect(note).toHaveTextContent(/editable defaults supplied by the app/i);
    expect(note).toHaveTextContent(/not figures derived from your ledger/i);
  });

  it('gates comparison honestly until two scenarios exist', () => {
    render(<WhatIfPage />);
    fireEvent.click(screen.getByTestId('whatif-empty-create'));
    expect(screen.getByText(/create at least 2 scenarios to compare/i)).toBeInTheDocument();
    // No comparison result is fabricated for a single scenario.
    expect(screen.queryByLabelText('Scenario comparison differences')).not.toBeInTheDocument();
  });

  it('K30: failed comparison renders ErrorState (role=alert) whose retry succeeds', async () => {
    render(<WhatIfPage />);
    fireEvent.click(screen.getByTestId('whatif-empty-create')); // Scenario 1
    fireEvent.click(screen.getByRole('button', { name: /clone scenario/i })); // Scenario 1 (copy)

    const targetOption = screen.getByRole('option', { name: 'Scenario 1' });
    openSelectTarget(targetOption.getAttribute('value') ?? '');

    // First comparison attempt fails inside the real boundary; the retry call
    // falls through to the unmodified implementation.
    const spy = vi.spyOn(WhatIfSandboxEngine.prototype, 'compare').mockImplementationOnce(() => {
      throw new Error('sandbox snapshot missing');
    });

    fireEvent.click(screen.getByRole('button', { name: /^compare$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not compare scenarios/i);
    expect(screen.getByText(/sandbox snapshot missing/i)).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /retry compare/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('Scenario comparison differences')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // Retry re-ran exactly the failed action through the same handler.
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('keeps selections truthful when a compared sandbox is deleted', () => {
    render(<WhatIfPage />);
    fireEvent.click(screen.getByTestId('whatif-empty-create')); // Scenario 1
    fireEvent.click(screen.getByRole('button', { name: /clone scenario/i })); // Scenario 1 (copy), active
    // Clone the now-active copy (second row) so the third sandbox derives
    // from it; each row carries its own clone control.
    fireEvent.click(
      screen.getAllByRole('button', { name: /clone scenario/i })[1] as HTMLButtonElement
    ); // copy of the copy, active

    // Target the middle scenario while three exist, so the selector remains
    // mounted after one deletion.
    const targetOption = screen.getByRole('option', { name: 'Scenario 1 (copy)' });
    openSelectTarget(targetOption.getAttribute('value') ?? '');
    expect(screen.getByRole('button', { name: /^compare$/i })).toBeEnabled();

    // Delete the non-active target scenario; its stale selection must drop so
    // Compare cannot run against a missing snapshot.
    fireEvent.click(
      screen.getAllByRole('button', { name: /delete scenario/i })[1] as HTMLButtonElement
    );
    expect((screen.getByLabelText('Comparison target scenario') as HTMLSelectElement).value).toBe(
      ''
    );
    expect(screen.getByRole('button', { name: /^compare$/i })).toBeDisabled();
  });
});
