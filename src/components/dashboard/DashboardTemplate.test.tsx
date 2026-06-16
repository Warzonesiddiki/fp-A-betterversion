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
      fireEvent.click(drillButtons[0]!);
      expect(onKPIClick).toHaveBeenCalled();
    });

    it('calls onCellClick when heatmap cell is clicked', () => {
      const onCellClick = vi.fn();
      render(<DashboardTemplate type="controller" onCellClick={onCellClick} />);
      fireEvent.click(screen.getByText('cell'));
      expect(onCellClick).toHaveBeenCalledWith('row', 'col', 1);
    });

  // [Hera] a11y: tablist + tabpanel + keyboard nav + ARIA semantics (PICK C)
  describe('screen reader semantics', () => {
    it('renders a tablist with an accessible label', () => {
      render(<DashboardTemplate type="cfo" />);
      const tablist = screen.getByRole('tablist', { name: 'Dashboard persona views' });
      expect(tablist).toBeInTheDocument();
    });

    it('renders three tabs with role=tab and aria-selected', () => {
      render(<DashboardTemplate type="cfo" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('each tab has aria-controls pointing to a tabpanel', () => {
      render(<DashboardTemplate type="controller" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-cfo');
      expect(tabs[1]).toHaveAttribute('aria-controls', 'panel-controller');
      expect(tabs[2]).toHaveAttribute('aria-controls', 'panel-analyst');
    });

    it('renders the active tabpanel with matching id and aria-labelledby', () => {
      render(<DashboardTemplate type="analyst" />);
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'panel-analyst');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-analyst');
    });

    it('renders the correct tabpanel when type=cfo', () => {
      render(<DashboardTemplate type="cfo" />);
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'panel-cfo');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-cfo');
    });

    it('renders the correct tabpanel when type=controller', () => {
      render(<DashboardTemplate type="controller" />);
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'panel-controller');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-controller');
    });

    it('announces view changes to screen readers via LiveRegion', () => {
      render(<DashboardTemplate type="cfo" />);
      const controllerTab = screen.getAllByRole('tab')[1];
      fireEvent.click(controllerTab);
      // LiveRegion renders a polite live region with sr-only styling
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.textContent).toContain('Controller View');
    });

    it('uses roving tabindex: only the active tab has tabIndex=0', () => {
      render(<DashboardTemplate type="controller" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('tabindex', '-1');
      expect(tabs[1]).toHaveAttribute('tabindex', '0');
      expect(tabs[2]).toHaveAttribute('tabindex', '-1');
    });

    it('ArrowRight moves focus to the next tab and updates selection', () => {
      render(<DashboardTemplate type="cfo" />);
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
      expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('ArrowLeft wraps from first tab to last', () => {
      render(<DashboardTemplate type="cfo" />);
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
      expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('Home key moves to the first tab', () => {
      render(<DashboardTemplate type="analyst" />);
      const tabs = screen.getAllByRole('tab');
      tabs[2].focus();
      fireEvent.keyDown(tabs[2], { key: 'Home' });
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('End key moves to the last tab', () => {
      render(<DashboardTemplate type="cfo" />);
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      fireEvent.keyDown(tabs[0], { key: 'End' });
      expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('clicking a tab updates aria-selected', () => {
      render(<DashboardTemplate type="cfo" />);
      const controllerTab = screen.getAllByRole('tab')[1];
      fireEvent.click(controllerTab);
      expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'false');
    });

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
