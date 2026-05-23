/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataLineageViewer } from './DataLineageViewer';
import type { DataLineageViewerProps } from './DataLineageViewer';

const sampleGraph: DataLineageViewerProps['graph'] = {
  nodes: [
    { id: 'src1', name: 'ERP System', type: 'source' },
    { id: 't1', name: 'ETL Pipeline', type: 'transform' },
    { id: 'rpt1', name: 'P&L Report', type: 'report' },
  ],
  edges: [
    { from: 'src1', to: 't1' },
    { from: 't1', to: 'rpt1' },
  ],
};

describe('DataLineageViewer', () => {
  it('renders without crashing', () => {
    const { container } = render(<DataLineageViewer graph={sampleGraph} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders empty state when no nodes', () => {
    render(<DataLineageViewer graph={{ nodes: [], edges: [] }} />);
    expect(screen.getByText('No lineage data')).toBeInTheDocument();
  });

  it('renders empty state with custom height', () => {
    const { container } = render(
      <DataLineageViewer graph={{ nodes: [], edges: [] }} height={500} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('500px');
  });

  it('renders SVG when nodes exist', () => {
    const { container } = render(<DataLineageViewer graph={sampleGraph} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders node names in SVG', () => {
    render(<DataLineageViewer graph={sampleGraph} />);
    expect(screen.getByText('ERP System')).toBeInTheDocument();
    expect(screen.getByText('ETL Pipeline')).toBeInTheDocument();
    expect(screen.getByText('P&L Report')).toBeInTheDocument();
  });

  it('renders correct number of node groups', () => {
    const { container } = render(<DataLineageViewer graph={sampleGraph} />);
    const groups = container.querySelectorAll('g');
    expect(groups.length).toBe(3);
  });

  it('renders edge paths', () => {
    const { container } = render(<DataLineageViewer graph={sampleGraph} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
  });

  it('calls onNodeClick when a node is clicked', () => {
    const onNodeClick = vi.fn();
    render(<DataLineageViewer graph={sampleGraph} onNodeClick={onNodeClick} />);
    fireEvent.click(screen.getByText('ERP System'));
    expect(onNodeClick).toHaveBeenCalledWith('src1');
  });

  it('calls onNodeClick with transform node id', () => {
    const onNodeClick = vi.fn();
    render(<DataLineageViewer graph={sampleGraph} onNodeClick={onNodeClick} />);
    fireEvent.click(screen.getByText('ETL Pipeline'));
    expect(onNodeClick).toHaveBeenCalledWith('t1');
  });

  it('does not throw when onNodeClick is not provided', () => {
    render(<DataLineageViewer graph={sampleGraph} />);
    expect(() => fireEvent.click(screen.getByText('ERP System'))).not.toThrow();
  });

  it('renders with default height of 400', () => {
    const { container } = render(<DataLineageViewer graph={sampleGraph} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('400px');
  });

  it('applies custom height', () => {
    const { container } = render(<DataLineageViewer graph={sampleGraph} height={600} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('600px');
  });

  it('handles nodes with single type only', () => {
    const graph = {
      nodes: [
        { id: 's1', name: 'Source A', type: 'source' as const },
        { id: 's2', name: 'Source B', type: 'source' as const },
      ],
      edges: [{ from: 's1', to: 's2' }],
    };
    render(<DataLineageViewer graph={graph} />);
    expect(screen.getByText('Source A')).toBeInTheDocument();
    expect(screen.getByText('Source B')).toBeInTheDocument();
  });

  it('handles edges with missing from/to nodes gracefully', () => {
    const graph = {
      nodes: [{ id: 's1', name: 'Source', type: 'source' as const }],
      edges: [{ from: 's1', to: 'nonexistent' }],
    };
    const { container } = render(<DataLineageViewer graph={graph} />);
    // Should render without crashing; the path for a missing node is skipped
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
