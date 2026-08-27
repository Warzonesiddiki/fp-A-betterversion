import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Lane R34 (W-A11Y-002 M5): hoisted-mutable store ref so specs can drive the
// page into its loading branch without re-importing modules.
const glState = vi.hoisted(() => ({
  value: {
    entries: [] as unknown[],
    isLoading: false,
    importError: null as string | null,
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/store/glStore', () => ({
  useGLStore: () => glState.value,
}));
vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel">HelpPanel</div>,
}));
vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table">DataTable</div>,
}));

describe('LeaseAccountingPage', () => {
  beforeEach(() => {
    glState.value.entries = [];
    glState.value.isLoading = false;
    glState.value.importError = null;
  });

  it('renders without crashing', async () => {
    const { default: LeaseAccountingPage } = await import('./LeaseAccountingPage');
    render(<LeaseAccountingPage />);
    expect(screen.getByRole('heading', { name: /Lease Accounting/i })).toBeInTheDocument();
  });

  // W-A11Y-002 M5 announce-once: the hydrate skeleton owns exactly ONE polite
  // status announcement and every decorative bar stays out of the a11y tree.
  it('loading branch announces once via srLabel with decorative bars hidden', async () => {
    glState.value.isLoading = true;
    const { default: LeaseAccountingPage } = await import('./LeaseAccountingPage');
    const { container } = render(<LeaseAccountingPage />);
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true');
    expect(statuses[0]).toHaveTextContent('Loading lease accounting…');
    expect(statuses[0]).toHaveClass('sr-only');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
