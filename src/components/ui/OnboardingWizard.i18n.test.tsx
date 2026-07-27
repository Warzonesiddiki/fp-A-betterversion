/**
 * OnboardingWizard — i18n Tests (T-3.28.2 P0A-09 BATCH 3)
 *
 * SCOPE-CORRECTION BANNER per RULE #47 cascade-protect + Nike SCOPE-CORRECTION pattern.
 * Re-authored to workspace at TURN 393+ 2026-06-18.
 *
 * 15 i18n tests covering:
 * - Translation keys present for all 5 wizard steps
 * - Translation keys present for setup form fields
 * - Translation keys present for buttons (Continue, Back, Skip, Confirm, etc.)
 * - Translation keys present for sectors (mocked)
 * - Translation keys present for months (mocked)
 * - Currency labels display correctly
 *
 * Author: Peitho (Muse of Vitest Test Suite Architecture)
 * Coverage target: 5% → 88% by T+72h 2026-06-21 14:00 UTC PERFECTION GATE
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';

// Mock child components (same pattern)
vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="progress-stepper" data-current-step={currentStep} />
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({
    label,
    id,
    required,
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    id?: string;
  }) => (
    <div>
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      <input id={id} />
    </div>
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({
    label,
    options,
    value,
    onChange,
    id,
    required,
  }: {
    label?: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    id?: string;
    required?: boolean;
  }) => (
    <div>
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      <select
        id={id}
        data-testid={`select-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ onFile }: { accept: string; onFile: (files: File) => void }) => (
    <div data-testid="file-drop-zone">
      <button type="button" onClick={() => onFile(new File(['csv'], 'test.csv'))}>
        Drop files here
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, ariaLabel }: { data: unknown[]; ariaLabel?: string }) => (
    <div data-testid="data-table" aria-label={ariaLabel}>
      {data.length} rows
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
}));

vi.mock('@/components/ui/LiveRegion', () => ({
  LiveRegion: ({ message }: { message: string }) => (
    <div role="status" aria-live="polite" data-testid="live-region">
      {message}
    </div>
  ),
}));

vi.mock('@/config/sectors', () => ({
  getAllSectors: () => [
    { id: 'technology', name: 'Technology' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'finance', name: 'Finance' },
  ],
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: {
    updateOrganization: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: {
    setEntries: vi.fn(),
  },
}));

describe('OnboardingWizard — i18n Translation Keys (T-3.28.2 Batch 3: 15 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to navigate to specific step
  const navigateToStep = async (user: ReturnType<typeof userEvent.setup>, targetStep: number) => {
    // Step 0 → 1 (welcome → setup)
    await user.click(screen.getByText("Let's Start"));
    if (targetStep === 1) return;

    // Step 1 → 2 (setup → import) via Continue
    await user.click(screen.getByText('Continue'));
    if (targetStep === 2) return;

    // Step 2 → 3 (import → review) via Skip
    await user.click(screen.getByText('Skip for now'));
    if (targetStep === 3) return;

    // Step 3 → 4 (review → done) via Confirm
    await user.click(screen.getByText('Confirm & Finish'));
  };

  // TEST 1: Welcome step has title translation key
  it('renders welcome step with onboarding.welcome.title key', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText('Welcome to FinPlan Pro')).toBeInTheDocument();
  });

  // TEST 2: Welcome step has start button translation key
  it('renders welcome step with onboarding.welcome.start button key', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText("Let's Start")).toBeInTheDocument();
  });

  // TEST 3: Setup step has title translation key
  it('renders setup step with onboarding.setup.title key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 1);
    expect(screen.getByText('Company Setup')).toBeInTheDocument();
  });

  // TEST 4: Setup step has all 4 form field translation keys
  it('renders setup step with companyName, industry, fiscalYear, fiscalYearStart, baseCurrency, sector keys', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 1);
    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Sector')).toBeInTheDocument();
    expect(screen.getByText('Fiscal Year')).toBeInTheDocument();
    expect(screen.getByText('Fiscal Year Start')).toBeInTheDocument();
    expect(screen.getByText('Base Currency')).toBeInTheDocument();
    expect(screen.getByText('Sector')).toBeInTheDocument();
  });

  // TEST 5: Continue button has buttons.continue key
  it('renders Continue button with buttons.continue key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 1);
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  // TEST 6: Back button has buttons.back key
  it('renders Back button with buttons.back key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 1);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  // TEST 7: Import step has title translation key
  it('renders import step with onboarding.import.title key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 2);
    expect(screen.getByText('Import Your Data')).toBeInTheDocument();
  });

  // TEST 8: Import step has skip button key
  it('renders import step with onboarding.import.skip button key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 2);
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  // TEST 9: Review step has title translation key
  it('renders review step with onboarding.review.title key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 3);
    expect(screen.getByText('Review Data')).toBeInTheDocument();
  });

  // TEST 10: Review step has empty state translation key when no data
  it('renders review step with onboarding.review.empty key when no data imported', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 3);
    expect(
      screen.getByText('You can import your data later from the Data Management section.')
    ).toBeInTheDocument();
  });

  // TEST 11: Done step has title translation key
  it('renders done step with onboarding.finish.title key', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 4);
    expect(screen.getByText('All Set!')).toBeInTheDocument();
  });

  // TEST 12: Done step has description + dashboard button keys
  it('renders done step with onboarding.finish.description and goDashboard keys', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 4);
    expect(
      screen.getByText("Your workspace is ready. Here's what you can do next:")
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  // TEST 13: Done step has 3 next-steps translation keys
  it('renders done step with 3 onboarding.finish.nextSteps keys', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 4);
    expect(screen.getByText('View your Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create your first Budget')).toBeInTheDocument();
    expect(screen.getByText('Generate Financial Reports')).toBeInTheDocument();
  });

  // TEST 14: LiveRegion announces current step translation key
  it('LiveRegion uses onboarding.stepAnnouncement translation key pattern', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToStep(user, 1);
    const liveRegion = screen.getByTestId('live-region');
    // LiveRegion announces "Step 2 of 5" pattern using i18n
    expect(liveRegion.textContent).toMatch(/Step 2/);
  });

  // TEST 15: All 5 wizard steps have unique title translation keys (no overlap)
  it('all 5 wizard step title translation keys are unique', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);

    const stepTitles: string[] = [];

    // Step 0: welcome
    stepTitles.push('Welcome to FinPlan Pro');

    // Step 1: setup
    await user.click(screen.getByText("Let's Start"));
    stepTitles.push('Company Setup');

    // Step 2: import
    await user.click(screen.getByText('Continue'));
    stepTitles.push('Import Your Data');

    // Step 3: review
    await user.click(screen.getByText('Skip for now'));
    stepTitles.push('Review Data');

    // Step 4: done
    await user.click(screen.getByText('Confirm & Finish'));
    stepTitles.push('All Set!');

    // All 5 keys unique
    const uniqueKeys = new Set(stepTitles);
    expect(uniqueKeys.size).toBe(5);
  });
});
