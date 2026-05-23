/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardTemplate, type DashboardTemplateProps } from './DashboardTemplate';

// Mock child components to isolate DashboardTemplate
vi.mock('./KPICardEnhanced', () => ({
  KPICardEnhanced: ({ title, onDrillDown }: { title: string; onDrillDown?: () => void }) => (
    <div data-testid="kpi-card">
      <span>{title}</span>
      {onDrillDown && <button onClick={onDrillDown}>drill</button>}
    </div>
  ),
}));

vi.mock('./TrafficLightIndicator', () => ({
  TrafficLightBatch: ({ items }: { items: Array<{ label: string }> }) => (
    <div data-testid="traffic-light-batch">
      {items.map((item, i) => (
        <span key={i}>{item.label}</span>
      ))}
    </div>
  ),
}));

vi.mock('./TornadoChart', () => ({
  TornadoChart: ({ title }: { title?: string }) => <div data-testid="tornado-chart">{title}</div>,
}));

vi.mock('./HeatmapGrid', () => ({
  HeatmapGrid: ({
    title,
    onCellClick,
  }: {
    title?: string;
    onCellClick?: (r: string, c: string, v: number) => void;
  }) => (
    <div data-testid="heatmap-grid">
      {title}
      {onCellClick && <button onClick={() => onCellClick('row', 'col', 1)}>cell</button>}
    </div>
  ),
}));

vi.mock('./SankeyDiagram', () => ({
  SankeyDiagram: ({ title }: { title?: string }) => <div data-testid="sankey-diagram">{title}</div>,
}));

vi.mock('./ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed</div>,
}));

const defaultProps: DashboardTemplateProps = {
  type: 'cfo',
};

describe('DashboardTemplate', () => {
  it('renders without crashing with default props', () => {
    render(<DashboardTemplate {...defaultProps} />);
    expect(screen.getByText('CFO View')).toBeInTheDocument();
  });

  it('renders all three view toggle buttons', () => {
    render(<DashboardTemplate {...defaultProps} />);
    expect(screen.getByText('CFO View')).toBeInTheDocument();
    expect(screen.getByText('Controller View')).toBeInTheDocument();
    expect(screen.getByText('Analyst View')).toBeInTheDocument();
  });

  it('highlights the active view button', () => {
    render(<DashboardTemplate type="cfo" />);
    const cfoButton = screen.getByText('CFO View');
    expect(cfoButton.className).toContain('bg-blue-600');
  });

  describe('CFO View', () => {
    it('renders KPI cards in CFO view', () => {
      render(<DashboardTemplate type="cfo" />);
      const kpiCards = screen.getAllByTestId('kpi-card');
      expect(kpiCards.length).toBeGreaterThanOrEqual(1);
    });

    it('renders SankeyDiagram in CFO view', () => {
      render(<DashboardTemplate type="cfo" />);
      expect(screen.getByTestId('sankey-diagram')).toBeInTheDocument();
    });

    it('renders TrafficLightBatch in CFO view', () => {
      render(<DashboardTemplate type="cfo" />);
      expect(screen.getByTestId('traffic-light-batch')).toBeInTheDocument();
    });

    it('does not render HeatmapGrid in CFO view', () => {
      render(<DashboardTemplate type="cfo" />);
      expect(screen.queryByTestId('heatmap-grid')).not.toBeInTheDocument();
    });

    it('does not render TornadoChart in CFO view', () => {
      render(<DashboardTemplate type="cfo" />);
      expect(screen.queryByTestId('tornado-chart')).not.toBeInTheDocument();
    });

    it('does not render ActivityFeed in CFO view', () => {
      render(<DashboardTemplate type="cfo" />);
      expect(screen.queryByTestId('activity-feed')).not.toBeInTheDocument();
    });
  });

  describe('Controller View', () => {
    it('switches to controller view on button click', () => {
      render(<DashboardTemplate type="cfo" />);
      fireEvent.click(screen.getByText('Controller View'));
      expect(screen.getByTestId('heatmap-grid')).toBeInTheDocument();
    });

    it('renders KPI cards in controller view', () => {
      render(<DashboardTemplate type="controller" />);
      const kpiCards = screen.getAllByTestId('kpi-card');
      expect(kpiCards.length).toBeGreaterThanOrEqual(1);
    });

    it('renders HeatmapGrid in controller view', () => {
      render(<DashboardTemplate type="controller" />);
      expect(screen.getByTestId('heatmap-grid')).toBeInTheDocument();
    });

    it('renders TrafficLightBatch in controller view', () => {
      render(<DashboardTemplate type="controller" />);
      expect(screen.getByTestId('traffic-light-batch')).toBeInTheDocument();
    });

    it('does not render SankeyDiagram in controller view', () => {
      render(<DashboardTemplate type="controller" />);
      expect(screen.queryByTestId('sankey-diagram')).not.toBeInTheDocument();
    });

    it('does not render TornadoChart in controller view', () => {
      render(<DashboardTemplate type="controller" />);
      expect(screen.queryByTestId('tornado-chart')).not.toBeInTheDocument();
    });
  });

  describe('Analyst View', () => {
    it('switches to analyst view on button click', () => {
      render(<DashboardTemplate type="cfo" />);
      fireEvent.click(screen.getByText('Analyst View'));
      expect(screen.getByTestId('tornado-chart')).toBeInTheDocument();
    });

    it('renders all major widgets in analyst view', () => {
      render(<DashboardTemplate type="analyst" />);
      expect(screen.getAllByTestId('kpi-card').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('tornado-chart')).toBeInTheDocument();
      expect(screen.getByTestId('heatmap-grid')).toBeInTheDocument();
      expect(screen.getByTestId('sankey-diagram')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <DashboardTemplate {...defaultProps} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('uses custom KPIs when provided', () => {
      const customKPIs = [{ title: 'Custom KPI', value: 100, format: 'number' as const }];
      render(<DashboardTemplate type="cfo" kpis={customKPIs} />);
      expect(screen.getByText('Custom KPI')).toBeInTheDocument();
    });

    it('calls onKPIClick when KPI drill-down is triggered', () => {
      const onKPIClick = vi.fn();
      render(<DashboardTemplate type="cfo" onKPIClick={onKPIClick} />);
      const drillButtons = screen.getAllByText('drill');
      fireEvent.click(drillButtons[0]);
      expect(onKPIClick).toHaveBeenCalled();
    });

    it('calls onCellClick when heatmap cell is clicked', () => {
      const onCellClick = vi.fn();
      render(<DashboardTemplate type="controller" onCellClick={onCellClick} />);
      fireEvent.click(screen.getByText('cell'));
      expect(onCellClick).toHaveBeenCalledWith('row', 'col', 1);
    });

    it('uses custom activities when provided', () => {
      const customActivities = [
        { id: '1', user: 'Custom User', action: 'Custom Action', timestamp: 'now' },
      ];
      render(<DashboardTemplate type="analyst" activities={customActivities} />);
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });
});
