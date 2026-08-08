import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIIntelligencePage from '../../ai/AIIntelligencePage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  LineChart: () => <div />,
  Line: () => null,
  AreaChart: () => <div />,
  Area: () => null,
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign((selector?: (s: any) => any) =>
    selector
      ? selector({ entries: [], accounts: [], filters: {} })
      : { entries: [], accounts: [], filters: {} }
  ),
}));

vi.mock('lucide-react', () => ({
  Cpu: () => <svg />,
  Brain: () => <svg />,
  CheckCircle: () => <svg />,
  Zap: () => <svg />,
  RefreshCw: () => <svg />,
  Download: () => <svg />,
  Search: () => <svg />,
  Sparkles: () => <svg />,
  Activity: () => <svg />,
  AlertTriangle: () => <svg />,
  TrendingUp: () => <svg />,
  Clock: () => <svg />,
  Eye: () => <svg />,
  Play: () => <svg />,
  Square: () => <svg />,
  Settings: () => <svg />,
  Send: () => <svg />,
  ChevronDown: () => <svg />,
  ChevronUp: () => <svg />,
  Check: () => <svg />,
  X: () => <svg />,
  Loader2: () => <svg />,
  StopCircle: () => <svg />,
  BarChart3: () => <svg />,
  LineChart: () => <svg />,
}));

describe('AIIntelligencePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the AI intelligence main heading', () => {
    render(<AIIntelligencePage />);
    expect(screen.getByRole('heading', { level: 1, name: /ai intelligence/i })).toBeInTheDocument();
  });
});
