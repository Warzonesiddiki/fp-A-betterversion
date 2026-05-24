import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({ organization: {} })),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({ user: { name: 'Test' } })),
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
    Shield: makeIcon(),
    Lock: makeIcon(),
    Eye: makeIcon(),
    EyeOff: makeIcon(),
    Key: makeIcon(),
    Clock: makeIcon(),
    AlertTriangle: makeIcon(),
    CheckCircle: makeIcon(),
    Fingerprint: makeIcon(),
    Smartphone: makeIcon(),
  };
});

import SecuritySettingsPage from '@/pages/settings/SecuritySettingsPage';

describe('SecuritySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<SecuritySettingsPage />);
    expect(screen.getByText(/Security/i)).toBeTruthy();
  });
});
