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
    expect(screen.getByRole('heading', { name: /Multi-Book Accounting/i })).toBeTruthy();
  });

  it('shows an honest empty state until books are created (no fabricated counts)', () => {
    render(<MultiBookPage />);
    expect(screen.getByText(/No books yet/i)).toBeInTheDocument();
    expect(screen.getByText(/MultiBookEngine/i)).toBeInTheDocument();
  });
});
