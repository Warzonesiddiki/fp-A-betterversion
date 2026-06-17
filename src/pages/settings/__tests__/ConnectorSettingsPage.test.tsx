import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/engines/ConnectorEngine', () => ({
  ConnectorEngine: {
    listConnectors: vi.fn(() => []),
    register: vi.fn(),
    remove: vi.fn(),
    testConnection: vi.fn(),
  },
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
    Plug: makeIcon(),
    Plus: makeIcon(),
    Trash2: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    RefreshCw: makeIcon(),
    Database: makeIcon(),
  };
});

import ConnectorSettingsPage from '@/pages/settings/ConnectorSettingsPage';

describe('ConnectorSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<ConnectorSettingsPage />);
    expect(screen.getAllByText(/connector/i).length).toBeGreaterThan(0);
  });
});
