import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('./Modal', () => ({
  Modal: ({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

vi.mock('./DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data.length} rows</div>
  ),
}));

import { DrillDownModal } from '@/components/ui/DrillDownModal';
import { useGLStore } from '@/store/glStore';

const mockUseGLStore = vi.mocked(useGLStore);

describe('DrillDownModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGLStore.mockImplementation((selector) => selector({ entries: [] }));
  });

  it('renders without crashing when open', () => {
    const { container } = render(
      <DrillDownModal isOpen={true} onClose={() => {}} title="Test Modal" />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <DrillDownModal isOpen={false} onClose={() => {}} title="Test Modal" />
    );
    expect(container.textContent).toBe('');
  });

  it('displays the title', () => {
    render(<DrillDownModal isOpen={true} onClose={() => {}} title="GL Drill Down" />);
    expect(screen.getByText('GL Drill Down')).toBeInTheDocument();
  });

  it('displays transaction count', () => {
    render(<DrillDownModal isOpen={true} onClose={() => {}} title="Test" />);
    expect(screen.getByText('0 transactions found')).toBeInTheDocument();
  });
});
