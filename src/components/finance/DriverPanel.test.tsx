/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DriverPanel } from './DriverPanel';

import type { Driver } from '@/engines/DriverCascadeEngine';

// Mock the driver store
const mockListDrivers = vi.fn<() => Driver[]>(() => []);
const mockAnalyzeImpact = vi.fn(() => ({
  affectedCellCount: 5,
  totalImpact: 10000,
  impactByCube: { revenue: { count: 3, impact: 6000 } },
}));
const mockCalculateCascade = vi.fn(() => ({
  driverId: 'd1',
  driverName: 'Growth Rate',
  oldValue: 5,
  newValue: 7,
  affectedCells: [],
  totalImpact: 10000,
  duration: 2.5,
}));
const mockApplyCascade = vi.fn();

vi.mock('@/store/driverStore', () => ({
  useDriverStore: vi.fn(() => ({
    engine: {
      listDrivers: mockListDrivers,
      analyzeImpact: mockAnalyzeImpact,
      calculateCascade: mockCalculateCascade,
      applyCascade: mockApplyCascade,
    },
    isRecalculating: false,
    lastCascadeResult: null,
  })),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props}>{children}</h3>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>{children}</span>
  ),
}));

describe('DriverPanel', () => {
  const readCell = vi.fn(() => 100);
  const writeCell = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListDrivers.mockReturnValue([]);
  });

  it('renders without crashing', () => {
    const { container } = render(<DriverPanel readCell={readCell} writeCell={writeCell} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the Drivers header', () => {
    render(<DriverPanel readCell={readCell} writeCell={writeCell} />);
    expect(screen.getByText('Drivers')).toBeInTheDocument();
  });

  it('renders empty state when no drivers', () => {
    render(<DriverPanel readCell={readCell} writeCell={writeCell} />);
    expect(screen.getByText('No drivers configured')).toBeInTheDocument();
  });

  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(<DriverPanel readCell={readCell} writeCell={writeCell} onClose={onClose} />);
    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render close button when onClose is not provided', () => {
    const { container } = render(<DriverPanel readCell={readCell} writeCell={writeCell} />);
    // The close button area should not have an X button
    const closeButtons = container.querySelectorAll('button');
    // Only category expand buttons would exist if drivers were present; with 0 drivers, no buttons
    expect(closeButtons.length).toBe(0);
  });

  it('renders drivers when list is populated', () => {
    mockListDrivers.mockReturnValue([
      {
        id: 'd1',
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 5,
        currentValue: 5,
        minValue: 0,
        maxValue: 20,
        step: 0.5,
        category: 'Revenue',
        tags: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]);

    render(<DriverPanel readCell={readCell} writeCell={writeCell} />);
    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
  });

  it('renders driver category headers', () => {
    mockListDrivers.mockReturnValue([
      {
        id: 'd1',
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 5,
        currentValue: 5,
        minValue: 0,
        maxValue: 20,
        step: 0.5,
        category: 'Revenue',
        tags: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]);

    render(<DriverPanel readCell={readCell} writeCell={writeCell} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });
});
