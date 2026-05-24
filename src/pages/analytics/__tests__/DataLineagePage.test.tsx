import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    GitBranch: makeIcon(),
    ArrowRight: makeIcon(),
    Database: makeIcon(),
  };
});

import DataLineagePage from '@/pages/analytics/DataLineagePage';

describe('DataLineagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<DataLineagePage />);
    expect(screen.getByText(/Data Lineage/i)).toBeTruthy();
  });
});
