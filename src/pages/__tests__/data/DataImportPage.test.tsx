import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataImportPage from '../../data/DataImportPage';

// Mock the router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
}));

// Mock lucide-react explicitly to an empty map (real icons aren't needed for h1 assertions)
vi.mock('lucide-react', () => ({
  Upload: () => <svg data-testid="icon-upload" />,
  Database: () => <svg />,
  CheckCircle: () => <svg />,
  XCircle: () => <svg />,
  AlertTriangle: () => <svg />,
  Activity: () => <svg />,
  Loader2: () => <svg />,
}));

// Mock MasterStorage hooks
vi.mock('@/hooks/useMasterStorage', () => ({
  useMasterStorage: () => ({
    dataSets: [],
    reconciliations: [],
    createDataSet: vi.fn(),
    updateDataSet: vi.fn(),
    deleteDataSet: vi.fn(),
    runReconciliation: vi.fn(),
    refreshFromMaster: vi.fn().mockResolvedValue(undefined),
    loading: false,
    error: null,
  }),
}));

describe('DataImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty-state with navigation to GL Upload when no data exists', () => {
    render(<DataImportPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /no data imported/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to gl upload/i })).toBeInTheDocument();
  });
});
