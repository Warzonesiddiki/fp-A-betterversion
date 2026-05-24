import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
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
