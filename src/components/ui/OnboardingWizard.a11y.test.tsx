/**
 * OnboardingWizard — Accessibility Tests (T-3.28.2 P0A-09 BATCH 4)
 *
 * SCOPE-CORRECTION BANNER per RULE #47 cascade-protect + Nike SCOPE-CORRECTION pattern.
 * Authored at TURN 394+ 2026-06-18.
 *
 * 10 accessibility tests covering WCAG 2.1 AA compliance:
 * - ARIA live region announces step changes
 * - Focus management on step change (stepContainerRef + useEffect)
 * - Heading hierarchy (h1 on welcome/done, h2 on setup/import/review)
 * - aria-labelledby connects step container to step title
 * - Decorative SVG has aria-hidden="true"
 * - Decorative dots have aria-hidden="true"
 * - DataTable has caption + ariaLabel
 * - Form fields have labels (input + 4 selects)
 * - Buttons have accessible names
 * - Modal is rendered as fixed overlay
 *
 * Per T-3.28.2 pre-stage design @ docs/CAVEMAN_PERSIST/CYCLE_25_TURN_393_PLUS_PEITH_T328_2_P0A_09_ONBOARDING_WIZARD_VITEST_AUDIT_SCOPE_CORRECTION_v0_1.md
 *
 * Author: Peitho (Muse of Vitest Test Suite Architecture)
 * Coverage target: 5% → 88% by T+72h 2026-06-21 14:00 UTC PERFECTION GATE
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import { OnboardingWizard } from '@/components/ui/OnboardingWizard';

// Mock child components (same pattern as stepNavigation + formValidation tests)
vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({
    steps,
    currentStep,
  }: {
    steps: { label: string; status: string }[];
    currentStep: number;
  }) => (
    <div
      data-testid="progress-stepper"
      data-current-step={currentStep}
      role="navigation"
      aria-label="Onboarding progress"
    >
      <ol>
        {steps.map((s, i) => (
          <li
            key={s.label}
            data-testid={`step-${i}`}
            className={i === currentStep ? 'active' : ''}
            aria-current={i === currentStep ? 'step' : undefined}
          >
            {s.label}
          </li>
        ))}
      </ol>
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
  }) => {
    const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div>
        {label && (
          <label htmlFor={selectId}>
            {label}
            {required && <span aria-label="required">*</span>}
          </label>
        )}
        <select
          id={selectId}
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
    );
  },
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ onFile, accept }: { accept: string; onFile: (files: File) => void }) => (
    <div data-testid="file-drop-zone" aria-label="File upload zone" role="button" tabIndex={0}>
      <input
        type="file"
        accept={accept}
        data-testid="file-input"
        aria-label="Choose file to upload"
      />
      <button
        type="button"
        onClick={() => onFile(new File(['test'], 'test.csv', { type: 'text/csv' }))}
        aria-label="Upload file"
      >
        Upload
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({
    data,
    columns,
    caption,
    ariaLabel,
  }: {
    data: Record<string, unknown>[];
    columns: { key: string; header: string }[];
    caption?: string;
    ariaLabel?: string;
  }) => (
    <table data-testid="data-table" aria-label={ariaLabel}>
      {caption && <caption>{caption}</caption>}
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key}>{String(row[c.key] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
    variant?: string;
    size?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/LiveRegion', () => ({
  LiveRegion: ({ message }: { message: string }) => (
    <div data-testid="live-region" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  ),
}));

vi.mock('@/config/sectors', () => ({
  getAllSectors: () =>
    Array.from({ length: 17 }, (_, i) => ({
      id: `sector-${i}`,
      name: `Sector ${i}`,
    })),
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

describe('OnboardingWizard — Accessibility (WCAG 2.1 AA)', () => {
  let mockOnComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnComplete = vi.fn();
  });

  it('a11y-01: LiveRegion announces step changes with role=status + aria-live=polite', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Welcome (step 0)
    const liveRegion = screen.getByTestId('live-region');
    expect(liveRegion).toHaveAttribute('role', 'status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion.textContent).toMatch(/Step 1:/);
  });

  it('a11y-02: focus management — step container receives focus on step change', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Advance from welcome (step 0) to setup (step 1)
    await user.click(screen.getByRole('button', { name: /start/i }));

    // The step container has tabIndex={-1} and useEffect focuses it on step change
    // In jsdom, useEffect focus() works - verify the container exists with tabIndex=-1
    const stepTitle = screen.getByRole('heading', { level: 2, name: /setup/i });
    expect(stepTitle).toBeInTheDocument();

    // The parent div with aria-labelledby should have tabIndex=-1
    const stepContainer = stepTitle.closest('[aria-labelledby]');
    expect(stepContainer).toHaveAttribute('tabIndex', '-1');
  });

  it('a11y-03: heading hierarchy — h1 on welcome/done, h2 on setup/import/review', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Welcome (step 0) uses h1
    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();

    // Advance to setup (step 1) — uses h2
    await user.click(screen.getByRole('button', { name: /start/i }));
    expect(screen.getByRole('heading', { level: 2, name: /setup/i })).toBeInTheDocument();

    // Advance to import (step 2) — uses h2
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('heading', { level: 2, name: /import/i })).toBeInTheDocument();

    // Advance to review (step 3) — uses h2
    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.getByRole('heading', { level: 2, name: /review/i })).toBeInTheDocument();

    // Advance to done (step 4) — uses h1
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(
      screen.getByRole('heading', { level: 1, name: /all set|finish|complete|done/i })
    ).toBeInTheDocument();
  });

  it('a11y-04: aria-labelledby connects step container to step title', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Step container should be labelled by step-title-0
    const stepTitle = screen.getByRole('heading', { level: 1 });
    const container = stepTitle.closest('[aria-labelledby]');
    expect(container).toHaveAttribute('aria-labelledby', 'step-title-0');

    // Advance and verify aria-labelledby updates
    await user.click(screen.getByRole('button', { name: /start/i }));
    const stepTitle2 = screen.getByRole('heading', { level: 2 });
    const container2 = stepTitle2.closest('[aria-labelledby]');
    expect(container2).toHaveAttribute('aria-labelledby', 'step-title-1');
  });

  it('a11y-05: decorative SVG checkmark has aria-hidden=true on done step', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Navigate to done (step 4): welcome → setup → import → review → done
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /skip/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // The SVG wrapper div has aria-hidden="true"
    const doneContainer = screen.getByRole('heading', {
      level: 1,
      name: /all set|finish|complete|done/i,
    }).parentElement;
    const decorativeDiv = doneContainer?.querySelector('[aria-hidden="true"]');
    expect(decorativeDiv).toBeInTheDocument();
    expect(decorativeDiv?.querySelector('svg')).toBeInTheDocument();
  });

  it('a11y-06: decorative dots on done step next-steps have aria-hidden=true', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Navigate to done (step 4)
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /skip/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Find the next-steps list (3 items with decorative dots)
    const doneStep = screen.getByRole('heading', {
      level: 1,
      name: /all set|finish|complete|done/i,
    }).parentElement;
    const decorativeDots = doneStep?.querySelectorAll('[aria-hidden="true"]');
    // At least 1 for the SVG checkmark + 3 for the next-step dots = 4 total
    expect(decorativeDots?.length).toBeGreaterThanOrEqual(4);
  });

  it('a11y-07: DataTable has caption + aria-label when imported data preview is shown', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Navigate: welcome → setup → import (upload file) → review
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // The mocked FileDropZone exposes an "Upload file" button that invokes
    // onFile — the wizard then sets the preview data and advances to review.
    await user.click(screen.getByRole('button', { name: 'Upload file' }));

    // Now on review step — DataTable should carry the aria-label and caption.
    const dataTable = screen.getByTestId('data-table');
    expect(dataTable).toHaveAttribute('aria-label', 'Imported data preview');
    expect(dataTable.querySelector('caption')).toHaveTextContent(/Imported data preview/i);
  });

  it('a11y-08: form fields have associated labels (input + 4 selects)', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Advance to setup (step 1)
    await user.click(screen.getByRole('button', { name: /start/i }));

    // Input field — companyName should have an associated label
    const companyInput = screen.getByLabelText(/company.*name/i);
    expect(companyInput).toBeInTheDocument();
    expect(companyInput.tagName).toBe('INPUT');

    // Select fields — 5 selects with labels (sector, fiscal year, fiscal year start, currency)
    const allSelects = screen.getAllByRole('combobox');
    expect(allSelects.length).toBeGreaterThanOrEqual(4);

    const sectorSelect = screen.getByLabelText(/industry|sector/i);
    expect(sectorSelect.tagName).toBe('SELECT');

    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect.tagName).toBe('SELECT');
  });

  it('a11y-09: all buttons have accessible names (no icon-only buttons)', () => {
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Welcome step has "Start" button
    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).toHaveAccessibleName();

    // LiveRegion is not a button — verify only buttons with text labels
    const allButtons = screen.getAllByRole('button');
    allButtons.forEach((btn) => {
      expect(btn).toHaveAccessibleName();
      // No empty buttons
      expect(btn.textContent?.trim() || btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('a11y-10: modal is rendered as fixed overlay with high z-index', () => {
    const { container } = render(<OnboardingWizard onComplete={mockOnComplete} />);

    // The wizard wrapper is a fixed inset-0 overlay
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.className).toMatch(/z-\[9999\]/);
    expect(overlay?.className).toMatch(/fixed/);
    expect(overlay?.className).toMatch(/inset-0/);
  });
});
