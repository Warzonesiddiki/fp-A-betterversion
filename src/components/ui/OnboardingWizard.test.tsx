import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('./ProgressStepper', () => ({
  ProgressStepper: ({
    steps,
    currentStep,
  }: {
    steps: { label: string; status: string }[];
    currentStep: number;
  }) => (
    <div data-testid="progress-stepper">
      {steps.map((s, i) => (
        <span key={s.label} className={i === currentStep ? 'active' : ''}>
          {s.label}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('./Input', () => ({
  Input: ({
    label,
    ...props
  }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) => (
    <div>
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  ),
}));

vi.mock('./Select', () => ({
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
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('./FileDropZone', () => ({
  FileDropZone: ({ accept }: { accept: string }) => (
    <div data-testid="file-drop-zone">Drop files here ({accept})</div>
  ),
}));

vi.mock('./DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data.length} rows</div>
  ),
}));

vi.mock('./Button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('./Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/config/sectors', () => ({
  getAllSectors: () => [
    { id: 'technology', name: 'Technology' },
    { id: 'healthcare', name: 'Healthcare' },
  ],
}));

import OnboardingWizard from '@/components/ui/OnboardingWizard';

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<OnboardingWizard onComplete={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('displays welcome message on first step', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText('Welcome to FinPlan Pro')).toBeInTheDocument();
  });

  it('displays progress stepper', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByTestId('progress-stepper')).toBeInTheDocument();
  });

  it('displays "Let\'s Start" button', () => {
    render(<OnboardingWizard onComplete={() => {}} />);
    expect(screen.getByText("Let's Start")).toBeInTheDocument();
  });
});
