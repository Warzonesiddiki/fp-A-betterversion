/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ExecutiveSummary } from '../ExecutiveSummary';

vi.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/Sparkline', () => ({ Sparkline: () => <div data-testid="sparkline" /> }));

describe('ExecutiveSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders KPI cards', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('EBITDA')).toBeTruthy();
    expect(screen.getByText('Cash Flow')).toBeTruthy();
  });

  it('renders commentary', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Management Commentary')).toBeTruthy();
  });
});
