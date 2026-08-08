import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DriverPlanningPage from '../../forecasts/DriverPlanningPage';

vi.mock('@/components/finance/CascadeRuleBuilder', () => ({
  CascadeRuleBuilder: () => <div data-testid="cascade-builder" />,
}));

vi.mock('@/components/charts/HeatmapChart', () => ({
  HeatmapChart: () => <div data-testid="heatmap" />,
}));

vi.mock('@/components/ui/DriverSlider', () => ({
  DriverSlider: () => <div data-testid="driver-slider" />,
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi">{label}</div>,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock('lucide-react', () => ({
  Sliders: () => <svg />,
  Plus: () => <svg />,
  Trash2: () => <svg />,
  RotateCcw: () => <svg />,
  Zap: () => <svg />,
  ChevronDown: () => <svg />,
  ChevronUp: () => <svg />,
  AlertTriangle: () => <svg />,
  Copy: () => <svg />,
  BookTemplate: () => <svg />,
  ArrowRight: () => <svg />,
}));

describe('DriverPlanningPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders driver planning heading without crashing', () => {
    render(<DriverPlanningPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /driver-based planning/i })
    ).toBeInTheDocument();
  });
});
