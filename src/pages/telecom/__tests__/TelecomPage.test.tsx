import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/store/telecomStore', () => ({
  useTelecomStore: vi.fn(() => ({})),
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
    Wifi: makeIcon(),
    DollarSign: makeIcon(),
    Users: makeIcon(),
    Activity: makeIcon(),
  };
});

import TelecomPage from '@/pages/telecom/TelecomPage';

describe('TelecomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<TelecomPage />);
    expect(screen.getByText(/Telecom/i)).toBeTruthy();
  });
});
