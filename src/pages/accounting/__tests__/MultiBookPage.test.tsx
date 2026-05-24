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
    BookOpen: makeIcon(),
    Download: makeIcon(),
    Plus: makeIcon(),
  };
});

import MultiBookPage from '@/pages/accounting/MultiBookPage';

describe('MultiBookPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<MultiBookPage />);
    expect(screen.getByText(/Multi-Book/i)).toBeTruthy();
  });
});
