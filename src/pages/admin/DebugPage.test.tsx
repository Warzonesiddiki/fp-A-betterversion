import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../components/admin/DependencyGraph', () => ({
  default: () => <div data-testid="dep-graph" />,
}));

describe('DebugPage', () => {
  it('renders without crashing', async () => {
    const { default: DebugPage } = await import('./DebugPage');
    render(<DebugPage />);
    expect(screen.getByRole('heading', { level: 1, name: /System Debug/i })).toBeInTheDocument();
  });
});
