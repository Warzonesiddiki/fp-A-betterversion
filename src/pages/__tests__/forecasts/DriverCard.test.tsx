/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Sliders: () => <span data-testid="mock-icon" />,
  Trash2: () => <span data-testid="mock-icon" />,
  RotateCcw: () => <span data-testid="mock-icon" />,
  Zap: () => <span data-testid="mock-icon" />,
  ChevronDown: () => <span data-testid="mock-icon" />,
  ChevronUp: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/DriverSlider', () => ({
  DriverSlider: () => <div data-testid="driver-slider" />,
}));

vi.mock('@/components/finance/CascadeRuleBuilder', () => ({
  CascadeRuleBuilder: () => <div data-testid="cascade-rule-builder" />,
}));

import { render, screen } from '@/test/testUtils';
import { DriverCard, formatImpact, formatDriverValue } from '@/pages/forecasts/DriverCard';
import type { Driver, CascadeRule } from '@/engines/DriverCascadeEngine';

const mockDriver: Driver = {
  id: 'd1',
  name: 'Revenue Growth',
  description: 'Annual revenue growth rate',
  unit: 'percentage',
  baseValue: 10,
  currentValue: 10,
  minValue: -50,
  maxValue: 100,
  step: 1,
  category: 'Revenue',
  tags: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const defaultProps = {
  driver: mockDriver,
  isExpanded: false,
  pendingValue: 10,
  impact: undefined,
  hasChanges: false,
  driverRules: [] as CascadeRule[],
  isRecalculating: false,
  onToggleExpand: vi.fn(),
  onSliderChange: vi.fn(),
  onApply: vi.fn(),
  onReset: vi.fn(),
  onRemove: vi.fn(),
};

describe('DriverCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders driver name', () => {
    render(<DriverCard {...defaultProps} />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
  });

  it('renders collapsed by default without slider', () => {
    render(<DriverCard {...defaultProps} />);
    expect(screen.queryByTestId('driver-slider')).not.toBeInTheDocument();
  });

  it('renders utility functions correctly', () => {
    expect(formatImpact(1500000)).toBe('$1.5M');
    expect(formatImpact(5000)).toBe('$5K');
    expect(formatImpact(100)).toBe('$100');
    expect(formatDriverValue(10.5, 'percentage')).toBe('10.5%');
    expect(formatDriverValue(1000, 'absolute')).toBe('1,000');
  });
});
