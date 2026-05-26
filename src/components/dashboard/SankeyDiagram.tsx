import { useMemo, memo } from 'react';
import { cn } from '@/utils/cn';

export interface SankeyNode {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title?: string;
  width?: number;
  height?: number;
  format?: 'currency' | 'compact' | 'number';
  className?: string;
  onNodeClick?: (nodeId: string) => void;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
];

function formatVal(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'compact':
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    default:
      return value.toLocaleString();
  }
}

interface LayoutNode {
  id: string;
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
  h: number;
  col: number;
}

interface LayoutLink {
  sourceNode: LayoutNode;
  targetNode: LayoutNode;
  value: number;
  sy: number;
  ty: number;
  sh: number;
  th: number;
}

export const SankeyDiagram = memo(function SankeyDiagram({
  nodes,
  links,
  title,
  width = 800,
  height = 400,
  format = 'compact',
  className,
  onNodeClick,
}: SankeyDiagramProps) {
  const { layoutNodes, layoutLinks } = useMemo(() => {
    const nodeMap = new Map<string, SankeyNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      outDegree.set(n.id, 0);
    });
    links.forEach((l) => {
      inDegree.set(l.target, (inDegree.get(l.target) ?? 0) + 1);
      outDegree.set(l.source, (outDegree.get(l.source) ?? 0) + 1);
    });

    const columns = new Map<string, number>();
    const assigned = new Set<string>();

    const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
    roots.forEach((r) => {
      columns.set(r.id, 0);
      assigned.add(r.id);
    });

    let changed = true;
    while (changed) {
      changed = false;
      links.forEach((l) => {
        if (assigned.has(l.source) && !assigned.has(l.target)) {
          columns.set(l.target, (columns.get(l.source) ?? 0) + 1);
          assigned.add(l.target);
          changed = true;
        }
      });
    }

    nodes.forEach((n) => {
      if (!assigned.has(n.id)) {
        columns.set(n.id, 0);
      }
    });

    const colGroups = new Map<number, SankeyNode[]>();
    nodes.forEach((n) => {
      const col = columns.get(n.id) ?? 0;
      if (!colGroups.has(col)) colGroups.set(col, []);
      colGroups.get(col)!.push(n);
    });

    const numCols = Math.max(...colGroups.keys()) + 1;
    const colWidth = (width - 80) / numCols;
    const padding = 8;

    const layoutNodeMap = new Map<string, LayoutNode>();
    const lNodes: LayoutNode[] = [];

    colGroups.forEach((colNodes, colIdx) => {
      const totalValue = colNodes.reduce((s, n) => s + n.value, 0);
      const availableH = height - 60 - (colNodes.length - 1) * padding;
      let yOffset = 30;

      colNodes.forEach((n, nIdx) => {
        const nodeH = totalValue > 0 ? Math.max(8, (n.value / totalValue) * availableH) : 20;
        const ln: LayoutNode = {
          id: n.id,
          label: n.label,
          value: n.value,
          color: n.color ?? DEFAULT_COLORS[nIdx % DEFAULT_COLORS.length],
          x: 40 + colIdx * colWidth,
          y: yOffset,
          h: nodeH,
          col: colIdx,
        };
        lNodes.push(ln);
        layoutNodeMap.set(n.id, ln);
        yOffset += nodeH + padding;
      });
    });

    const lLinks: LayoutLink[] = [];
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();

    links.forEach((l) => {
      const sn = layoutNodeMap.get(l.source);
      const tn = layoutNodeMap.get(l.target);
      if (!sn || !tn) return;

      const sTotal = links.filter((x) => x.source === l.source).reduce((s, x) => s + x.value, 0);
      const tTotal = links.filter((x) => x.target === l.target).reduce((s, x) => s + x.value, 0);

      const sOff = sourceOffsets.get(l.source) ?? 0;
      const tOff = targetOffsets.get(l.target) ?? 0;

      const sh = sTotal > 0 ? (l.value / sTotal) * sn.h : sn.h;
      const th = tTotal > 0 ? (l.value / tTotal) * tn.h : tn.h;

      lLinks.push({
        sourceNode: sn,
        targetNode: tn,
        value: l.value,
        sy: sn.y + sOff,
        ty: tn.y + tOff,
        sh,
        th,
      });

      sourceOffsets.set(l.source, sOff + sh);
      targetOffsets.set(l.target, tOff + th);
    });

    return { layoutNodes: lNodes, layoutLinks: lLinks };
  }, [nodes, links, width, height]);

  return (
    <div
      className={cn(
        'w-full p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
        className
      )}
    >
      {title && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            {title}
          </h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="min-w-[600px]">
          {layoutLinks.map((link, idx) => {
            const x0 = link.sourceNode.x + 16;
            const x1 = link.targetNode.x;
            const midX = (x0 + x1) / 2;

            const path = `M${x0},${link.sy}
              C${midX},${link.sy} ${midX},${link.ty} ${x1},${link.ty}
              L${x1},${link.ty + link.th}
              C${midX},${link.ty + link.th} ${midX},${link.sy + link.sh} ${x0},${link.sy + link.sh}
              Z`;

            return (
              <path
                key={idx}
                d={path}
                fill={link.sourceNode.color}
                opacity={0.3}
                stroke={link.sourceNode.color}
                strokeWidth={0.5}
              >
                <title>{`${link.sourceNode.label} → ${link.targetNode.label}: ${formatVal(link.value, format)}`}</title>
              </path>
            );
          })}

          {layoutNodes.map((node) => (
            <g
              key={node.id}
              className={cn(onNodeClick && 'cursor-pointer')}
              onClick={() => onNodeClick?.(node.id)}
            >
              <rect x={node.x} y={node.y} width={16} height={node.h} fill={node.color} rx={2} />
              {node.h > 20 ? (
                <>
                  <text
                    x={node.col === 0 ? node.x - 4 : node.x + 20}
                    y={node.y + node.h / 2 - 6}
                    textAnchor={node.col === 0 ? 'end' : 'start'}
                    fill="var(--text-primary)"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.col === 0 ? node.x - 4 : node.x + 20}
                    y={node.y + node.h / 2 + 8}
                    textAnchor={node.col === 0 ? 'end' : 'start'}
                    fill="var(--text-muted)"
                    fontSize={10}
                  >
                    {formatVal(node.value, format)}
                  </text>
                </>
              ) : (
                <text
                  x={node.col === 0 ? node.x - 4 : node.x + 20}
                  y={node.y + node.h / 2 + 4}
                  textAnchor={node.col === 0 ? 'end' : 'start'}
                  fill="var(--text-muted)"
                  fontSize={9}
                >
                  {node.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
});

export const RevenueBridgeSankey = memo(function RevenueBridgeSankey({
  className,
}: {
  className?: string;
}) {
  const nodes: SankeyNode[] = [
    { id: 'revenue', label: 'Revenue', value: 10000000, color: '#3b82f6' },
    { id: 'cogs', label: 'COGS', value: -4000000, color: '#ef4444' },
    { id: 'gross', label: 'Gross Margin', value: 6000000, color: '#10b981' },
    { id: 'opex', label: 'OpEx', value: -3000000, color: '#f59e0b' },
    { id: 'ebitda', label: 'EBITDA', value: 3000000, color: '#8b5cf6' },
  ];

  const links: SankeyLink[] = [
    { source: 'revenue', target: 'cogs', value: 4000000 },
    { source: 'revenue', target: 'gross', value: 6000000 },
    { source: 'gross', target: 'opex', value: 3000000 },
    { source: 'gross', target: 'ebitda', value: 3000000 },
  ];

  return <SankeyDiagram nodes={nodes} links={links} title="Revenue Bridge" className={className} />;
});
