import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Sankey: () => <div data-testid="sankey" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

vi.mock('lucide-react', () => ({}));

import { render, screen } from '@/test/testUtils';
import DataFlowMapPage from '@/pages/data/DataFlowMapPage';

describe('DataFlowMapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<DataFlowMapPage />);
    expect(screen.getByText(/Data Flow Map/i)).toBeInTheDocument();
  });

  it('renders the sankey diagram container', () => {
    render(<DataFlowMapPage />);
    expect(screen.getByText(/Data Flow Sankey Diagram/i)).toBeInTheDocument();
  });

  it('renders the four legend cards', () => {
    render(<DataFlowMapPage />);
    expect(screen.getAllByText(/Data Sources/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Excel, CSV, ERP, API/i)).toBeInTheDocument();
    expect(screen.getByText(/159 calculation engines/i)).toBeInTheDocument();
    expect(screen.getByText(/22 Zustand stores/i)).toBeInTheDocument();
    expect(screen.getByText(/140 UI pages/i)).toBeInTheDocument();
  });
});
