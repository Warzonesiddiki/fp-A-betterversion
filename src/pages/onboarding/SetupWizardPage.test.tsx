import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({ steps }: { steps: Array<{ label: string }> }) => (
    <div data-testid="progress-stepper">{steps.map((s) => s.label).join(', ')}</div>
  ),
}));

// The recovery card runs real Web Crypto PBKDF2 on enrollment; wizard tests
// cover STEP FLOW only — the card has its own dedicated suite.
vi.mock('@/components/settings/RecoveryCodeCard', () => ({
  RecoveryCodeCard: ({ allowSkip, onSkip }: { allowSkip?: boolean; onSkip?: () => void }) => (
    <div data-testid="recovery-code-card">
      {allowSkip ? <button onClick={onSkip}>Skip for now</button> : null}
    </div>
  ),
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
    Database: makeIcon(),
    BookOpen: makeIcon(),
    Coins: makeIcon(),
    Building2: makeIcon(),
    Globe: makeIcon(),
    Calendar: makeIcon(),
    Settings: makeIcon(),
  };
});

import SetupWizardPage from '@/pages/onboarding/SetupWizardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/onboarding/setup']}>
      <SetupWizardPage />
    </MemoryRouter>
  );
}

describe('SetupWizardPage smoke test', () => {
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
  it('displays setup wizard heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Setup Wizard/i })).toBeTruthy();
  });
  it('displays welcome step', () => {
    renderPage();
    expect(screen.getByText(/Welcome to FinPlan Pro/i)).toBeTruthy();
  });

  it('includes a Recovery Code step between Data and Done in the stepper', () => {
    renderPage();
    const labels = screen.getByTestId('progress-stepper').textContent ?? '';
    expect(labels).toBe('Welcome, Organization, Preferences, Data, Recovery Code, Done');
  });

  it('reaches the enrollment step after Data and finishes via its skip path', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Get Started/i }));
    await userEvent.type(screen.getByLabelText(/Company Name/i), 'Acme Corp');
    await userEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    // Preferences
    await userEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    // Data -> "Skip for now" lands on the NEW recovery step, not Done.
    await userEvent.click(screen.getByRole('button', { name: /Skip for now/i }));

    expect(screen.getByText(/Protect Your Data/i)).toBeInTheDocument();
    expect(screen.getByTestId('recovery-code-card')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Skip for now/i }));
    expect(screen.getByText(/All Set!/i)).toBeInTheDocument();
  });
});
