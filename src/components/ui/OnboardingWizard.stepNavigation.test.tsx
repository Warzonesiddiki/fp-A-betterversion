/**
 * OnboardingWizard — Step Navigation Tests (T-3.28.2 P0A-09 BATCH 1)
 *
 * SCOPE-CORRECTION BANNER per RULE #47 cascade-protect + Nike SCOPE-CORRECTION pattern.
 * Originally authored at TURN 389+ but reverted by 47-agent race per Morpheus D-007 8-9th SHL.
 * Re-authored to workspace at TURN 393+ 2026-06-18.
 *
 * 5 step navigation tests covering the 5-step wizard flow.
 * Per T-3.28.2 pre-stage design @ docs/CAVEMAN_PERSIST/CYCLE_25_TURN_393_PLUS_PEITH_T328_2_P0A_09_ONBOARDING_WIZARD_VITEST_AUDIT_SCOPE_CORRECTION_v0_1.md
 *
 * Author: Peitho (Muse of Vitest Test Suite Architecture)
 * Coverage target: 5% → 88% by T+72h 2026-06-21 14:00 UTC PERFECTION GATE
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';

// Mock child components (per existing pattern from OnboardingWizard.test.tsx)
vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({
    steps,
    currentStep,
  }: {
    steps: { label: string; status: string }[];
    currentStep: number;
  }) => (
    <div data-testid="progress-stepper" data-current-step={currentStep}>
      {steps.map((s, i) => (
        <span key={s.label} data-testid={`step-${i}`} className={i === currentStep ? 'active' : ''}>
          {s.label}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: ({
    label,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
    <div>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input {...props} />
    </div>
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({
    label,
    options,
    value,
    onChange,
  }: {
    label?: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      {label && <label>{label}</label>}
      <select
        data-testid={`select-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      <button
        type="button"
        onClick={() => onFile(new File(['csv'], 'test.csv', { type: 'text/csv' }))}
      >
        Drop files here
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({
    data,
    caption,
    ariaLabel,
  }: {
    data: unknown[];
    caption?: string;
    ariaLabel?: string;
  }) => (
    <div data-testid="data-table" aria-label={ariaLabel}>
      {caption && <p>{caption}</p>}
      {data.length} rows
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    variant?: string;
    size?: string;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
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

// Mock stores
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

describe('OnboardingWizard — Step Navigation (T-3.28.2 Batch 1: 5 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TEST 1: starts at welcome step (step 0)
  it('starts at welcome step (step 0) with current status', () => {
    render(<OnboardingWizard onComplete={() => {}} />);

    const stepper = screen.getByTestId('progress-stepper');
    expect(stepper).toHaveAttribute('data-current-step', '0');

    // LiveRegion announces current step
    expect(screen.getByTestId('live-region')).toHaveTextContent(/Step 1/);

    // Welcome title and start button visible
    expect(screen.getByText('Welcome to FinPlan Pro')).toBeInTheDocument();
    expect(screen.getByText("Let's Start")).toBeInTheDocument();
  });

  // TEST 2: advances welcome → setup (step 0 → step 1)
  it('advances from welcome (step 0) to setup (step 1) on Start button click', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);

    // Click "Let's Start" button
    const startButton = screen.getByText("Let's Start");
    await user.click(startButton);

    // Verify stepper advanced to step 1
    const stepper = screen.getByTestId('progress-stepper');
    expect(stepper).toHaveAttribute('data-current-step', '1');

    // Verify LiveRegion announced Step 2
    expect(screen.getByTestId('live-region')).toHaveTextContent(/Step 2/);

    // Verify setup form fields visible
    expect(screen.getByText('Company Setup')).toBeInTheDocument();
    expect(screen.getByText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Sector')).toBeInTheDocument();
    expect(screen.getByText('Fiscal Year')).toBeInTheDocument();
  });

  // TEST 3: advances setup → import (step 1 → step 2)
  it('advances from setup (step 1) to import (step 2) on Continue button click', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);

    // Navigate to setup step
    await user.click(screen.getByText("Let's Start"));

    // Verify we're at setup
    expect(screen.getByTestId('progress-stepper')).toHaveAttribute('data-current-step', '1');

    // Click Continue button
    const continueButton = screen.getByText('Continue');
    await user.click(continueButton);

    // Verify stepper advanced to step 2
    const stepper = screen.getByTestId('progress-stepper');
    expect(stepper).toHaveAttribute('data-current-step', '2');

    // Verify import step visible
    expect(screen.getByText('Import Your Data')).toBeInTheDocument();
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
    expect(screen.getByText('Skip for now')).toBeInTheDocument();
  });

  // TEST 4: advances import → review (step 2 → step 3) via Skip
  it('advances from import (step 2) to review (step 3) on Skip button click', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);

    // Navigate to import step
    await user.click(screen.getByText("Let's Start"));
    await user.click(screen.getByText('Continue'));

    // Verify we're at import
    expect(screen.getByTestId('progress-stepper')).toHaveAttribute('data-current-step', '2');

    // Click Skip button
    const skipButton = screen.getByText('Skip for now');
    await user.click(skipButton);

    // Verify stepper advanced to step 3
    const stepper = screen.getByTestId('progress-stepper');
    expect(stepper).toHaveAttribute('data-current-step', '3');

    // Verify review step visible with empty state (since we skipped)
    expect(screen.getByText('Review Data')).toBeInTheDocument();
    expect(
      screen.getByText('You can import your data later from the Data Management section.')
    ).toBeInTheDocument();
    expect(screen.getByText('Confirm & Finish')).toBeInTheDocument();
  });

  // TEST 5: advances review → done (step 3 → step 4)
  it('advances from review (step 3) to done (step 4) on Confirm button click', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);

    // Navigate through wizard to review
    await user.click(screen.getByText("Let's Start"));
    await user.click(screen.getByText('Continue'));
    await user.click(screen.getByText('Skip for now'));

    // Verify we're at review
    expect(screen.getByTestId('progress-stepper')).toHaveAttribute('data-current-step', '3');

    // Click Confirm button
    const confirmButton = screen.getByText('Confirm & Finish');
    await user.click(confirmButton);

    // Verify stepper advanced to step 4
    const stepper = screen.getByTestId('progress-stepper');
    expect(stepper).toHaveAttribute('data-current-step', '4');

    // Verify done step visible with success message and dashboard button
    expect(screen.getByText('All Set!')).toBeInTheDocument();
    expect(
      screen.getByText("Your workspace is ready. Here's what you can do next:")
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();

    // Verify next steps listed
    expect(screen.getByText('View your Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create your first Budget')).toBeInTheDocument();
    expect(screen.getByText('Generate Financial Reports')).toBeInTheDocument();
  });
});
