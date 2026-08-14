import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

import { VersionDiffViewer } from '@/components/ui/VersionDiffViewer';

describe('VersionDiffViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with empty entries', () => {
    const { container } = render(
      <VersionDiffViewer diffEntries={[]} sourceLabel="v1" targetLabel="v2" />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays change count', () => {
    render(<VersionDiffViewer diffEntries={[]} sourceLabel="v1.0" targetLabel="v2.0" />);
    expect(screen.getByText('0 changes between v1.0 and v2.0')).toBeInTheDocument();
  });

  it('displays "No differences found" when empty', () => {
    render(<VersionDiffViewer diffEntries={[]} sourceLabel="v1" targetLabel="v2" />);
    expect(screen.getByText('No differences found.')).toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <VersionDiffViewer
        diffEntries={[]}
        sourceLabel="v1"
        targetLabel="v2"
        title="Budget Changes"
      />
    );
    expect(screen.getByText('Budget Changes')).toBeInTheDocument();
  });

  it('does not display title when not provided', () => {
    const { container } = render(
      <VersionDiffViewer diffEntries={[]} sourceLabel="v1" targetLabel="v2" />
    );
    expect(container.querySelector('h3')).toBeNull();
  });

  it('displays correct count with entries', () => {
    const entries = [
      { field: 'revenue', oldValue: 100, newValue: 200, changeType: 'modified' },
    ] as unknown as readonly import('@/engines/VersionControlEngine').DiffEntry[];
    render(<VersionDiffViewer diffEntries={entries} sourceLabel="v1" targetLabel="v2" />);
    expect(screen.getByText('1 changes between v1 and v2')).toBeInTheDocument();
  });
});
