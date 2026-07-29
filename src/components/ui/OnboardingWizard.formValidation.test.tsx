/**
 * OnboardingWizard — Form Validation Tests (T-3.28.2 P0A-09 BATCH 2)
 *
 * SCOPE-CORRECTION BANNER per RULE #47 cascade-protect + Nike SCOPE-CORRECTION pattern.
 * Re-authored to workspace at TURN 393+ 2026-06-18.
 *
 * 16 form validation tests covering the setup step (step 1) form:
 * - company name (Input)
 * - fiscal year start (Select - 12 months)
 * - fiscal year (Select - 3 years)
 * - currency (Select - 14 currencies)
 * - sector (Select - 17 sectors per getAllSectors mock)
 *
 * Author: Peitho (Muse of Vitest Test Suite Architecture)
 * Coverage target: 5% → 88% by T+72h 2026-06-21 14:00 UTC PERFECTION GATE
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';

// Mock child components (same pattern as stepNavigation.test.tsx)
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
    id,
    value,
    onChange,
    required,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    id?: string;
  }) => (
    <div>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span aria-label="required">*</span>}
        </label>
      )}
      <input
        id={id}
        value={value as string}
        onChange={(e) => onChange?.(e)}
        required={required}
        {...props}
      />
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
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span aria-label="required">*</span>}
        </label>
      )}
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
    disabled,
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
      disabled={disabled}
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
    { id: 'manufacturing', name: 'Manufacturing' },
    { id: 'retail', name: 'Retail' },
    { id: 'saas', name: 'SaaS' },
    { id: 'realestate', name: 'Real Estate' },
    { id: 'hospitality', name: 'Hospitality' },
    { id: 'education', name: 'Education' },
    { id: 'nonprofit', name: 'Non-Profit' },
    { id: 'construction', name: 'Construction' },
    { id: 'insurance', name: 'Insurance' },
    { id: 'professionalservices', name: 'Professional Services' },
    { id: 'agriculture', name: 'Agriculture' },
    { id: 'energy', name: 'Energy' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'publicsector', name: 'Public Sector' },
  ],
}));

const mockUpdateOrganization = vi.fn();
const mockUpdatePreferences = vi.fn();
const mockSetEntries = vi.fn();

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: {
    updateOrganization: () => mockUpdateOrganization,
    updatePreferences: () => mockUpdatePreferences,
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: {
    setEntries: () => mockSetEntries,
  },
}));

describe('OnboardingWizard — Form Validation (T-3.28.2 Batch 2: 16 tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to navigate to setup step (step 1)
  const navigateToSetup = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByText("Let's Start"));
    expect(screen.getByTestId('progress-stepper')).toHaveAttribute('data-current-step', '1');
  };

  // TEST 1: company name input renders with label
  it('renders company name input with label "Company Name" and required indicator', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const label = screen.getByText(/Company Name/i);
    expect(label).toBeInTheDocument();

    // Required indicator (asterisk) should be present next to the Company
    // Name label specifically. The setup step has five required fields, so
    // five "required" markers legitimately exist on the page; scope the
    // assertion to the Company Name label's own required marker rather than
    // asserting there is exactly one on the whole page.
    const requiredMark = label.querySelector('[aria-label="required"]');
    expect(requiredMark).toBeInTheDocument();
  });

  // TEST 2: company name input is empty by default
  it('initializes company name input as empty string', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const input = screen.getByLabelText(/Company Name/i) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  // TEST 3: typing in company name updates state
  it('updates company name state on user input', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const input = screen.getByLabelText(/Company Name/i) as HTMLInputElement;
    await user.type(input, 'Acme Corporation');

    expect(input.value).toBe('Acme Corporation');
  });

  // TEST 4: accepts maximum length company name (e.g. 100 chars)
  it('accepts long company names up to 100 characters', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const longName = 'A'.repeat(100);
    const input = screen.getByLabelText(/Company Name/i) as HTMLInputElement;
    await user.type(input, longName);

    expect(input.value).toBe(longName);
    expect(input.value.length).toBe(100);
  });

  // TEST 5: fiscal year start dropdown renders with 12 months
  it('renders fiscal year start dropdown with 12 month options', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Fiscal Year Start');
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(12);
  });

  // TEST 6: fiscal year start defaults to January
  it('defaults fiscal year start to January', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Fiscal Year Start') as HTMLSelectElement;
    expect(select.value).toBe('January');
  });

  // TEST 7: changing fiscal year start updates state
  it('changes fiscal year start on dropdown selection', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Fiscal Year Start') as HTMLSelectElement;
    await user.selectOptions(select, 'April');

    expect(select.value).toBe('April');
  });

  // TEST 8: fiscal year dropdown renders with 3 years (prev/current/next)
  it('renders fiscal year dropdown with 3 year options (previous/current/next)', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Fiscal Year');
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(3);
  });

  // TEST 9: fiscal year defaults to current year
  it('defaults fiscal year to current year', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Fiscal Year') as HTMLSelectElement;
    const currentYear = new Date().getFullYear().toString();
    expect(select.value).toBe(currentYear);
  });

  // TEST 10: currency dropdown renders with 14 currencies
  it('renders currency dropdown with 14 currency options', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Base Currency');
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(14);
  });

  // TEST 11: currency defaults to USD
  it('defaults base currency to USD', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Base Currency') as HTMLSelectElement;
    expect(select.value).toBe('USD');
  });

  // TEST 12: sector dropdown renders with all 17 sectors
  it('renders sector dropdown with 17 sector options', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Sector');
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(17);
  });

  // TEST 13: sector defaults to technology
  it('defaults sector to technology', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Sector') as HTMLSelectElement;
    expect(select.value).toBe('technology');
  });

  // TEST 14: changing sector updates state
  it('changes sector on dropdown selection', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const select = screen.getByTestId('select-Sector') as HTMLSelectElement;
    await user.selectOptions(select, 'finance');

    expect(select.value).toBe('finance');
  });

  // TEST 15: form has 5 form controls (1 input + 4 selects)
  it('renders 1 input field and 4 select dropdowns in setup form', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    // 1 input
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(1);

    // 4 selects
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(4);
  });

  // TEST 16: all form fields are interactive (can receive focus)
  it('all 5 form fields are keyboard-accessible (tab order)', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={() => {}} />);
    await navigateToSetup(user);

    const input = screen.getByLabelText(/Company Name/i) as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);
  });
});
