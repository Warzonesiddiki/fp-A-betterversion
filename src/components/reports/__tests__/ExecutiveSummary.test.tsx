import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { useGLStore } from '@/store/glStore';
import { ExecutiveSummary } from '../ExecutiveSummary';

vi.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));

describe('ExecutiveSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders KPI cards', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('Operating income')).toBeTruthy();
    expect(screen.getByText('Cash')).toBeTruthy();
  });

  it('renders the not-derivable disclosure instead of invented commentary', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText(/Not derivable from the posted GL/i)).toBeTruthy();
  });
});
