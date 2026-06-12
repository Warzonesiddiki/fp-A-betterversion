/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ChartCard } from './ChartCard';

describe('ChartCard', () => {
  it('renders title and children', () => {
    render(
      <ChartCard title="Revenue Chart">
        <div>Chart Content</div>
      </ChartCard>
    );
    expect(screen.getByText('Revenue Chart')).toBeInTheDocument();
    expect(screen.getByText('Chart Content')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <ChartCard title="Revenue" subtitle="Q1 2024">
        <div>Content</div>
      </ChartCard>
    );
    expect(screen.getByText('Q1 2024')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <ChartCard title="Test" actions={<button>Action</button>}>
        <div>Content</div>
      </ChartCard>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });
});
