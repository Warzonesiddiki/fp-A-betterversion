import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    organization: {
      name: 'Test Org',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      baseCurrency: 'USD',
      decimalPlaces: 2,
    },
    preferences: {},
    updateOrganization: vi.fn(),
    updatePreferences: vi.fn(),
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
    Settings: makeIcon(),
    LogOut: makeIcon(),
    Save: makeIcon(),
    Clock: makeIcon(),
    Globe: makeIcon(),
    DollarSign: makeIcon(),
    Palette: makeIcon(),
  };
});

import ProfilePage from '@/pages/ProfilePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <ProfilePage />
    </MemoryRouter>
  );
}

describe('ProfilePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays Profile heading', () => {
    renderPage();
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
