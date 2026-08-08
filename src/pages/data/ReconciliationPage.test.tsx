import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [] }),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('./ReconciliationPanel', () => ({
  ReconciliationPanel: () => <div data-testid="rec-panel">ReconciliationPanel</div>,
}));
vi.mock('./ReconciliationResults', () => ({
  ReconciliationResults: () => <div data-testid="rec-results">ReconciliationResults</div>,
}));

describe('ReconciliationPage', () => {
  it('renders without crashing', async () => {
    const { default: ReconciliationPage } = await import('./ReconciliationPage');
    render(<ReconciliationPage />);
    expect(screen.getByRole('heading', { name: /Data Reconciliation/i })).toBeInTheDocument();
  });
});
