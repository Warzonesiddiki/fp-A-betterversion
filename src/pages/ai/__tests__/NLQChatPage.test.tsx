import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        account: '4000',
        accountName: 'Revenue',
        amount: 100000,
        period: '2026-01',
        department: 'Sales',
        type: 'revenue',
      },
      {
        id: '2',
        account: '5000',
        accountName: 'COGS',
        amount: 30000,
        period: '2026-01',
        department: 'COGS',
        type: 'expense',
      },
    ],
  })),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    MessageSquare: makeIcon(),
    Send: makeIcon(),
    Sparkles: makeIcon(),
  };
});

import { NLQChatPage } from '@/pages/ai/NLQChatPage';

describe('NLQChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<NLQChatPage />);
    expect(screen.getByText(/Natural Language|Query|AI/i)).toBeTruthy();
  });
});
