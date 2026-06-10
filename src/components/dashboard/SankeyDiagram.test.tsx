/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import {
  SankeyDiagram,
  type SankeyDiagramProps,
  type SankeyNode,
  type SankeyLink,
} from './SankeyDiagram';

const mockNodes: SankeyNode[] = [
  { id: 'revenue', label: 'Revenue', value: 42500000, color: '#3b82f6' },
  { id: 'cogs', label: 'COGS', value: 16100000, color: '#ef4444' },
  { id: 'gross', label: 'Gross Margin', value: 26400000, color: '#10b981' },
];

const mockLinks: SankeyLink[] = [
  { source: 'revenue', target: 'cogs', value: 16100000 },
  { source: 'revenue', target: 'gross', value: 26400000 },
];

const defaultProps: SankeyDiagramProps = {
  nodes: mockNodes,
  links: mockLinks,
};

describe('SankeyDiagram', () => {
  it('renders without crashing', () => {
    const { container } = render(<SankeyDiagram {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the SVG element', () => {
    const { container } = render(<SankeyDiagram {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '800');
    expect(svg).toHaveAttribute('height', '400');
  });

  it('renders node labels in the SVG', () => {
    const { container } = render(<SankeyDiagram {...defaultProps} />);
    // SVG text elements contain the labels
    const textElements = container.querySelectorAll('svg text');
    const labels = Array.from(textElements).map((el) => el.textContent);
    expect(labels).toContain('Revenue');
    expect(labels).toContain('COGS');
    expect(labels).toContain('Gross Margin');
  });

  it('renders link paths between nodes', () => {
    const { container } = render(<SankeyDiagram {...defaultProps} />);
    const paths = container.querySelectorAll('svg path');
    // Should have at least 2 paths for 2 links
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('renders title when provided', () => {
    const { container } = render(<SankeyDiagram {...defaultProps} title="Revenue Bridge" />);
    const heading = container.querySelector('h3');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Revenue Bridge');
  });

  it('does not render title when not provided', () => {
    const { container } = render(<SankeyDiagram {...defaultProps} />);
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  describe('Node Rendering', () => {
    it('renders rect elements for each node', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const rects = container.querySelectorAll('svg rect');
      expect(rects.length).toBe(3);
    });

    it('applies node colors to rect elements', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const rects = container.querySelectorAll('svg rect');
      expect(rects[0]!).toHaveAttribute('fill', '#3b82f6');
    });
  });

  describe('Formatting', () => {
    it('formats values as compact by default', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const textElements = container.querySelectorAll('svg text');
      const values = Array.from(textElements).map((el) => el.textContent);
      // Should contain compact formatted values like $42.5M
      expect(values.some((v) => v?.includes('$'))).toBe(true);
    });

    it('formats values as currency when specified', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} format="currency" />);
      const textElements = container.querySelectorAll('svg text');
      const values = Array.from(textElements).map((el) => el.textContent);
      expect(values.some((v) => v?.includes('$'))).toBe(true);
    });

    it('formats values as number when specified', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} format="number" />);
      const textElements = container.querySelectorAll('svg text');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Click Behavior', () => {
    it('calls onNodeClick with node id when a node is clicked', () => {
      const onNodeClick = vi.fn();
      const { container } = render(<SankeyDiagram {...defaultProps} onNodeClick={onNodeClick} />);
      const nodeGroups = container.querySelectorAll('svg g[class*="cursor-pointer"]');
      fireEvent.click(nodeGroups[0]!);
      expect(onNodeClick).toHaveBeenCalled();
    });

    it('does not add cursor-pointer when onNodeClick is not provided', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const groups = container.querySelectorAll('svg g');
      groups.forEach((g) => {
        expect((g.className as unknown as { baseVal: string }).baseVal).not.toContain(
          'cursor-pointer'
        );
      });
    });

    it('adds cursor-pointer to nodes when onNodeClick is provided', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} onNodeClick={() => {}} />);
      const clickableGroups = container.querySelectorAll('svg g[class*="cursor-pointer"]');
      expect(clickableGroups.length).toBe(3);
    });
  });

  describe('Link Tooltips', () => {
    it('renders title elements inside link paths for tooltips', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const titles = container.querySelectorAll('svg path title');
      expect(titles.length).toBe(2);
    });

    it('formats tooltip text with source, target, and value', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const titles = container.querySelectorAll('svg path title');
      const tooltipTexts = Array.from(titles).map((t) => t.textContent);
      expect(tooltipTexts.some((t) => t?.includes('Revenue') && t?.includes('COGS'))).toBe(true);
    });
  });

  describe('Dimensions', () => {
    it('uses default width of 800', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '800');
    });

    it('uses default height of 400', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('height', '400');
    });

    it('applies custom width', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} width={600} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '600');
    });

    it('applies custom height', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} height={300} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('height', '300');
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(<SankeyDiagram {...defaultProps} className="custom-sankey" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-sankey');
    });
  });

  describe('Edge Cases', () => {
    it('handles nodes without custom colors', () => {
      const nodes: SankeyNode[] = [
        { id: 'a', label: 'A', value: 100 },
        { id: 'b', label: 'B', value: 50 },
      ];
      const links: SankeyLink[] = [{ source: 'a', target: 'b', value: 50 }];
      const { container } = render(<SankeyDiagram nodes={nodes} links={links} />);
      const rects = container.querySelectorAll('svg rect');
      expect(rects.length).toBe(2);
    });

    it('handles disconnected nodes gracefully', () => {
      const nodes: SankeyNode[] = [
        { id: 'a', label: 'A', value: 100 },
        { id: 'b', label: 'B', value: 50 },
        { id: 'c', label: 'C', value: 30 },
      ];
      const links: SankeyLink[] = [{ source: 'a', target: 'b', value: 50 }];
      // C has no links
      const { container } = render(<SankeyDiagram nodes={nodes} links={links} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });
});
