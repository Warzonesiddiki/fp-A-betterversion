/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriverTreeView, type DriverTreeViewProps } from './DriverTreeView';
import type { ScenarioAssumption } from '@/types';

vi.mock('@/components/ui/DriverSlider', () => ({
  DriverSlider: ({
    label,
    value,
    unit,
    disabled,
    onChange,
  }: {
    label: string;
    value: number;
    unit: string;
    disabled?: boolean;
    onChange: (v: number) => void;
  }) => (
    <div data-testid={`slider-${label}`}>
      <span>{label}</span>
      <span data-testid={`value-${label}`}>
        {value ?? 'N/A'}
        {unit}
      </span>
      <button
        data-testid={`change-${label}`}
        disabled={disabled}
        onClick={() => onChange((value ?? 0) + 10)}
      >
        Change
      </button>
    </div>
  ),
}));

function createAssumption(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    name: 'Revenue Growth',
    driverType: 'revenue',
    type: 'revenue',
    baseValue: 10,
    currentValue: 12,
    value: 12,
    minValue: 0,
    min: 0,
    maxValue: 100,
    max: 100,
    stepSize: 1,
    unit: '%',
    affectedAccountIds: [],
    ...overrides,
  } as unknown as ScenarioAssumption;
}

function renderDriverTreeView(props: Partial<DriverTreeViewProps> = {}) {
  const defaultProps: DriverTreeViewProps = {
    assumptions: [createAssumption()],
    onUpdate: vi.fn(),
    ...props,
  };
  return render(<DriverTreeView {...defaultProps} />);
}

describe('DriverTreeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with assumptions', () => {
    renderDriverTreeView();
  });

  it('renders empty state when no assumptions', () => {
    renderDriverTreeView({ assumptions: [] });
    expect(screen.getByText('No drivers defined')).toBeInTheDocument();
  });

  it('renders driver name and slider', () => {
    renderDriverTreeView();
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByTestId('slider-Revenue Growth')).toBeInTheDocument();
  });

  it('groups drivers by type property', () => {
    const assumptions = [
      createAssumption({ id: '1', name: 'Revenue Growth', driverType: 'Revenue' }),
      createAssumption({ id: '2', name: 'Cost Growth', driverType: 'Custom' }),
      createAssumption({ id: '3', name: 'Price Increase', driverType: 'Price' }),
    ];
    renderDriverTreeView({ assumptions });
    expect(screen.getAllByText(/Revenue Drivers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Custom Drivers/i).length).toBeGreaterThan(0);
  });

  it('calls onUpdate when a slider value changes', () => {
    const onUpdate = vi.fn();
    renderDriverTreeView({ onUpdate });
    fireEvent.click(screen.getByTestId('change-Revenue Growth'));
    expect(onUpdate).toHaveBeenCalledWith('1', 22);
  });

  it('disables sliders when readOnly is true', () => {
    renderDriverTreeView({ readOnly: true });
    const button = screen.getByTestId('change-Revenue Growth');
    expect(button).toBeDisabled();
  });

  it('does not disable sliders when readOnly is false', () => {
    renderDriverTreeView({ readOnly: false });
    const button = screen.getByTestId('change-Revenue Growth');
    expect(button).not.toBeDisabled();
  });

  it('does not disable sliders when readOnly is omitted', () => {
    renderDriverTreeView();
    const button = screen.getByTestId('change-Revenue Growth');
    expect(button).not.toBeDisabled();
  });

  it('renders multiple drivers of the same type', () => {
    const assumptions = [
      createAssumption({ id: '1', name: 'Driver A', type: 'growth' }),
      createAssumption({ id: '2', name: 'Driver B', type: 'growth' }),
      createAssumption({ id: '3', name: 'Driver C', type: 'growth' }),
    ];
    renderDriverTreeView({ assumptions });
    expect(screen.getByText('Driver A')).toBeInTheDocument();
    expect(screen.getByText('Driver B')).toBeInTheDocument();
    expect(screen.getByText('Driver C')).toBeInTheDocument();
  });

  it('renders multiple groups with correct headings', () => {
    const assumptions = [
      createAssumption({ id: '1', name: 'Rev', driverType: 'Revenue' }),
      createAssumption({ id: '2', name: 'OpEx', driverType: 'Custom' }),
      createAssumption({ id: '3', name: 'CapEx', driverType: 'Volume' }),
    ];
    renderDriverTreeView({ assumptions });
    expect(screen.getAllByText(/Revenue Drivers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Custom Drivers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Volume Drivers/i).length).toBeGreaterThan(0);
  });

  it('renders one heading per group', () => {
    const assumptions = [
      createAssumption({ id: '1', name: 'A', driverType: 'Revenue' }),
      createAssumption({ id: '2', name: 'B', driverType: 'Revenue' }),
      createAssumption({ id: '3', name: 'C', driverType: 'Custom' }),
    ];
    const { container } = renderDriverTreeView({ assumptions });
    const headings = container.querySelectorAll('h4');
    expect(headings.length).toBe(2);
  });
});
