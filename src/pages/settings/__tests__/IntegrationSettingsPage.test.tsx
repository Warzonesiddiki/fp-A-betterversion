import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({ organization: {} })),
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
    Globe: makeIcon(),
    Database: makeIcon(),
    FileSpreadsheet: makeIcon(),
    Webhook: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    RefreshCw: makeIcon(),
    ExternalLink: makeIcon(),
    Settings: makeIcon(),
  };
});

import IntegrationSettingsPage from '@/pages/settings/IntegrationSettingsPage';

describe('IntegrationSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<IntegrationSettingsPage />);
    expect(screen.getByText(/Integration/i)).toBeTruthy();
  });
});
