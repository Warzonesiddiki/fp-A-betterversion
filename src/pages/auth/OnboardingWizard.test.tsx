import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({ steps }: { steps: Array<{ label: string }> }) => (
    <div data-testid="progress-stepper">
      {steps.map((s) => (
        <span key={s.label}>{s.label}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector?: (s: { user: null }) => unknown) =>
    selector ? selector({ user: null }) : { user: null },
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
    Rocket: makeIcon(),
    Database: makeIcon(),
    BookOpen: makeIcon(),
    CheckCircle2: makeIcon(),
    Building2: makeIcon(),
    Globe: makeIcon(),
    Calendar: makeIcon(),
    ChevronRight: makeIcon(),
    ChevronLeft: makeIcon(),
  };
});

import OnboardingWizard from '@/pages/auth/OnboardingWizard';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OnboardingWizard smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });

  it('displays the welcome heading', () => {
    renderPage();
    expect(screen.getByText(/Welcome to FinPlan Pro/i)).toBeInTheDocument();
  });

  it('displays the get started button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
  });

  it('renders the progress stepper', () => {
    renderPage();
    expect(screen.getByTestId('progress-stepper')).toBeInTheDocument();
  });
});
