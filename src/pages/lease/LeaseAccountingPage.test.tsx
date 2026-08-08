import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [], isLoading: false, importError: null }),
}));
vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel">HelpPanel</div>,
}));
vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table">DataTable</div>,
}));

describe('LeaseAccountingPage', () => {
  it('renders without crashing', async () => {
    const { default: LeaseAccountingPage } = await import('./LeaseAccountingPage');
    render(<LeaseAccountingPage />);
    expect(screen.getByRole('heading', { name: /Lease Accounting/i })).toBeInTheDocument();
  });
});
