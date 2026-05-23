import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressStepper, type Step } from './ProgressStepper';

const steps: Step[] = [
  { label: 'Import', status: 'done' },
  { label: 'Validate', status: 'done' },
  { label: 'Map', status: 'current' },
  { label: 'Export', status: 'pending' },
];

describe('ProgressStepper', () => {
  it('renders all step labels', () => {
    render(<ProgressStepper steps={steps} currentStep={2} />);
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('highlights current step label', () => {
    render(<ProgressStepper steps={steps} currentStep={2} />);
    const mapLabel = screen.getByText('Map');
    expect(mapLabel.className).toContain('text-blue-700');
  });

  it('shows step numbers for pending steps', () => {
    render(<ProgressStepper steps={steps} currentStep={2} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders step descriptions when provided', () => {
    const stepsWithDesc = [
      { label: 'Import', status: 'done' as const, description: 'Upload CSV' },
      { label: 'Export', status: 'current' as const, description: 'Download report' },
    ];
    render(<ProgressStepper steps={stepsWithDesc} currentStep={1} />);
    expect(screen.getByText('Upload CSV')).toBeInTheDocument();
    expect(screen.getByText('Download report')).toBeInTheDocument();
  });

  it('renders in vertical orientation', () => {
    const { container } = render(
      <ProgressStepper steps={steps} currentStep={2} orientation="vertical" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-col');
  });
});
