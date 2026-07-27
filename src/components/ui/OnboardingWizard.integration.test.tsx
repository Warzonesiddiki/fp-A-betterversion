/**
 * OnboardingWizard — Integration Tests (T-3.28.2 P0A-09 BATCH 5)
 *
 * SCOPE-CORRECTION BANNER per RULE #47 cascade-protect + Nike SCOPE-CORRECTION pattern.
 * Authored at TURN 394+ 2026-06-18.
 *
 * 8 integration tests covering full wizard flow with store interactions:
 * - Complete onboarding flow with imported data → onComplete + setEntries called
 * - Skip import flow → onComplete + setEntries NOT called
 * - Stores updated correctly: updateOrganization + updatePreferences
 * - GL entries generated from imported data with date conversion
 * - Empty importedData → setEntries NOT called
 * - Date format conversion: fiscalYearStart='January' → '2024-01-01'
 * - All 17 sectors from getAllSectors rendered in select dropdown
 * - Single onComplete call per wizard completion
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

// Mock child components (same pattern as BATCH 1-4)
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
  }) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : 'select-unknown');
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
  }
}));

vi.mock('@/components/ui/FileDropZone', () => ({
  FileDropZone: ({ onFile, accept }: { accept: string; onFile: (files: File) => void }) => (
    <div data-testid="file-drop-zone">
      <input type="file" accept={accept} data-testid="file-input" />
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
  }: {
    data: Record<string, unknown>[];
    columns: { key: string; header: string }[];
    caption?: string;
    ariaLabel?: string;
  }) => (
    <table data-testid="data-table">
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
  LiveRegion: ({ message }: { message: string }) => <div data-testid="live-region">{message}</div>,
}));

vi.mock('@/config/sectors', () => ({
  getAllSectors: () =>
    Array.from({ length: 17 }, (_, i) => ({
      id: `sector-${i}`,
      name: `Sector ${i}`,
    })),
}));

// Mock stores — capture calls for assertion
const mockUpdateOrganization = vi.fn();
const mockUpdatePreferences = vi.fn();
const mockSetEntries = vi.fn();

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: {
    updateOrganization: (...args: unknown[]) => mockUpdateOrganization(...args),
    updatePreferences: (...args: unknown[]) => mockUpdatePreferences(...args),
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: {
    setEntries: (...args: unknown[]) => mockSetEntries(...args),
  },
}));

describe('OnboardingWizard — Integration (full flow + store interactions)', () => {
  let mockOnComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnComplete = vi.fn();
  });

  it('int-01: complete onboarding flow with imported data → onComplete + setEntries called', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // welcome → setup
    await user.click(screen.getByRole('button', { name: /start/i }));

    // Fill form
    const companyInput = screen.getAllByLabelText(/company.*name/i)[0]!;
    await user.type(companyInput, 'Acme Corp');

    // setup → import
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Upload file
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    await user.click(uploadButton);

    // review → done
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // done → confirm → onComplete called
    const goDashboardButton = screen.getByRole('button', { name: /dashboard/i });
    await user.click(goDashboardButton);

    // Verify: onComplete called once
    expect(mockOnComplete).toHaveBeenCalledTimes(1);

    // Verify: setEntries called with 2 mock entries from imported data
    expect(mockSetEntries).toHaveBeenCalledTimes(1);
    const entriesArg = mockSetEntries.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    expect(entriesArg).toHaveLength(2);
    expect(entriesArg[0]).toMatchObject({
      accountCode: 'Revenue',
      debit: 50000,
      credit: 0,
    });
    expect(entriesArg[1]).toMatchObject({
      accountCode: 'Payroll',
      debit: 0,
      credit: 20000,
    });
  });

  it('int-02: skip import flow → onComplete called + setEntries NOT called', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // welcome → setup → continue → import
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.type(screen.getAllByLabelText(/company.*name/i)[0]!, 'Beta Inc');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Skip import → review
    await user.click(screen.getByRole('button', { name: /skip/i }));

    // review → done (confirm)
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // done → confirm → onComplete called
    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    // Verify: onComplete called once
    expect(mockOnComplete).toHaveBeenCalledTimes(1);

    // Verify: setEntries NOT called (no imported data)
    expect(mockSetEntries).not.toHaveBeenCalled();
  });

  it('int-03: stores updated correctly on confirm — updateOrganization + updatePreferences', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // welcome → setup
    await user.click(screen.getByRole('button', { name: /start/i }));

    // Fill form with specific values
    await user.type(screen.getAllByLabelText(/company.*name/i)[0]!, 'Gamma LLC');
    await user.selectOptions(screen.getByLabelText(/industry|sector/i), 'sector-5');
    await user.selectOptions(screen.getAllByRole('combobox', { name: /fiscal year$/i })[0]!, '2025');
    await user.selectOptions(screen.getAllByLabelText(/fiscal year start|month/i)[0]!, 'April');
    await user.selectOptions(screen.getAllByLabelText(/currency/i)[0]!, 'EUR');

    // setup → import → skip → review
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /skip/i }));

    // review → done → confirm
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    // Verify: updateOrganization called with correct form data
    expect(mockUpdateOrganization).toHaveBeenCalledTimes(1);
    expect(mockUpdateOrganization).toHaveBeenCalledWith({
      name: 'Gamma LLC',
      fiscalYear: 2025,
      fiscalYearStart: '2024-04-01', // April = month index 3 + 1 = 4 → '04'
      baseCurrency: 'EUR',
    });

    // Verify: updatePreferences called with sector
    expect(mockUpdatePreferences).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreferences).toHaveBeenCalledWith({
      activeSector: 'sector-5',
    });
  });

  it('int-04: GL entries generated from imported data with date conversion', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // welcome → setup (fill) → import (upload) → review
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.type(screen.getAllByLabelText(/company.*name/i)[0]!, 'Delta Co');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Upload file (mock has 2 entries: Revenue 50000 + Payroll -20000)
    await user.click(screen.getByRole('button', { name: /upload file/i }));

    // review → done → confirm
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    // Verify: GL entries generated with correct fields
    const entriesArg = mockSetEntries.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    expect(entriesArg).toHaveLength(2);

    // First entry: Revenue 50000 (positive → debit)
    expect(entriesArg[0]).toMatchObject({
      accountId: 'Revenue',
      accountCode: 'Revenue',
      accountName: 'Revenue',
      period: '2025-01', // date.slice(0, 7)
      periodName: '2025-01',
      debit: 50000,
      credit: 0,
      netChange: 50000,
      amount: 50000,
      date: '2025-01-01',
      description: 'Initial import during onboarding',
      reference: 'ONBOARDING',
    });
    expect(entriesArg[0]?.id).toMatch(/^gl-init-\d+-0$/);

    // Second entry: Payroll -20000 (negative → credit)
    expect(entriesArg[1]).toMatchObject({
      accountId: 'Payroll',
      accountCode: 'Payroll',
      accountName: 'Payroll',
      period: '2025-01',
      periodName: '2025-01',
      debit: 0,
      credit: 20000,
      netChange: -20000,
      amount: -20000,
      date: '2025-01-02',
    });
    expect(entriesArg[1]?.id).toMatch(/^gl-init-\d+-1$/);
  });

  it('int-05: empty importedData → setEntries NOT called', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // welcome → setup → import → skip → review (empty state) → done
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.type(screen.getAllByLabelText(/company.*name/i)[0]!, 'Epsilon Ltd');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /skip/i }));

    // review should show empty state (no DataTable)
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();

    // review → done → confirm
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    // Verify: setEntries NOT called
    expect(mockSetEntries).not.toHaveBeenCalled();

    // Verify: onComplete still called once
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('int-06: date format conversion — fiscalYearStart="January" → "2024-01-01"', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    await user.click(screen.getByRole('button', { name: /start/i }));

    // January = month index 0 + 1 = 1 → '01'
    await user.selectOptions(screen.getAllByLabelText(/fiscal year start|month/i)[0]!, 'January');

    // December = month index 11 + 1 = 12 → '12'
    // Test December in a separate flow would need re-render; just verify January here
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /skip/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    expect(mockUpdateOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        fiscalYearStart: '2024-01-01',
      })
    );
  });

  it('int-07: all 17 sectors from getAllSectors rendered in select dropdown', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    await user.click(screen.getByRole('button', { name: /start/i }));

    // Industry/Sector select should have 17 options (sector-0 to sector-16)
    const sectorSelect = screen.getByLabelText(/industry|sector/i) as HTMLSelectElement;
    expect(sectorSelect.options).toHaveLength(17);
    expect(sectorSelect.options[0]?.value).toBe('sector-0');
    expect(sectorSelect.options[0]?.text).toBe('Sector 0');
    expect(sectorSelect.options[16]?.value).toBe('sector-16');
    expect(sectorSelect.options[16]?.text).toBe('Sector 16');

    // Default value should be 'technology' per initial state (which doesn't exist in mock → falls back to first)
    expect(sectorSelect.value).toBe('sector-0');
  });

  it('int-08: onComplete called exactly once per wizard completion (idempotent guard)', async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={mockOnComplete} />);

    // Full flow
    await user.click(screen.getByRole('button', { name: /start/i }));
    await user.type(screen.getAllByLabelText(/company.*name/i)[0]!, 'Zeta Corp');
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await user.click(screen.getByRole('button', { name: /upload file/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));
    await user.click(screen.getByRole('button', { name: /dashboard/i }));

    // Verify exactly 1 call
    expect(mockOnComplete).toHaveBeenCalledTimes(1);

    // Verify all stores called exactly once
    expect(mockUpdateOrganization).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreferences).toHaveBeenCalledTimes(1);
    expect(mockSetEntries).toHaveBeenCalledTimes(1);
  });
});
