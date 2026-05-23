import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({ steps }: { steps: Array<{ label: string }> }) => (
    <div data-testid="progress-stepper">{steps.map((s) => s.label).join(', ')}</div>
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
    expect(container).toBeTruthy();
  });
  it('displays setup wizard heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Setup Wizard/i })).toBeTruthy();
  });
  it('displays welcome step', () => {
    renderPage();
    expect(screen.getByText(/Welcome to FinPlan Pro/i)).toBeTruthy();
  });
});
