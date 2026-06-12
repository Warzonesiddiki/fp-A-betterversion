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
    __esModule: true,
    GitBranch: makeIcon(),
    ArrowRight: makeIcon(),
    ArrowDown: makeIcon(),
    Database: makeIcon(),
    FileText: makeIcon(),
    Server: makeIcon(),
    HardDrive: makeIcon(),
    Boxes: makeIcon(),
    Layers: makeIcon(),
    ChevronRight: makeIcon(),
    Activity: makeIcon(),
    Zap: makeIcon(),
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
