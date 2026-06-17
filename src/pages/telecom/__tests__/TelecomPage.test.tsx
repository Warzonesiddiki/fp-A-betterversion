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

vi.mock('@/store/telecomStore', () => ({
  useTelecomStore: vi.fn(() => ({})),
}));

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  const Icon = (props: any) => <span data-testid="mock-icon" {...props} />;
  Icon.displayName = 'MockIcon';
  return {
    ...actual,
    default: Icon,
    Wifi: Icon,
    DollarSign: Icon,
    Users: Icon,
    Activity: Icon,
    ChevronUp: Icon,
    ChevronDown: Icon,
  };
});

import TelecomPage from '@/pages/telecom/TelecomPage';

describe('TelecomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<TelecomPage />);
    expect(screen.getAllByText(/telecom/i).length).toBeGreaterThan(0);
  });
});
