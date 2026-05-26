import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

export interface SankeyChartProps {
  links: SankeyLink[];
  width?: number | string;
  height?: number;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (link: SankeyLink) => void;
}

export const SankeyChart: React.FC<SankeyChartProps> = ({
  links,
  width = '100%',
  height = 400,
  title,
  className,
  loading = false,
  error,
  onClick,
}) => {
  const { sources, targets, totalValue } = useMemo(() => {
    if (!links || links.length === 0) return { sources: [], targets: [], totalValue: 0 };
    const sMap: Record<string, number> = {};
    const tMap: Record<string, number> = {};
    let total = 0;

    links.forEach((link) => {
      const val = Math.max(0, link.value); // Guard against negative values
      sMap[link.source] = (sMap[link.source] || 0) + val;
      tMap[link.target] = (tMap[link.target] || 0) + val;
      total += val;
    });

    const sNodes = Object.entries(sMap).sort((a, b) => b[1] - a[1]);
    const tNodes = Object.entries(tMap).sort((a, b) => b[1] - a[1]);

    return {
      sources: sNodes,
      targets: tNodes,
      totalValue: total,
    };
  }, [links]);

  if (loading) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (totalValue === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const NODE_WIDTH = 20;
  const GAP = 10;
  const VIEW_HEIGHT = height - 40;

  // Calculate vertical offsets
  const getSourceY = (source: string) => {
    let offset = 0;
    for (const [s, val] of sources) {
      if (s === source) break;
      offset += (val / totalValue) * VIEW_HEIGHT + GAP;
    }
    return offset;
  };

  const getTargetY = (target: string) => {
    let offset = 0;
    for (const [t, val] of targets) {
      if (t === target) break;
      offset += (val / totalValue) * VIEW_HEIGHT + GAP;
    }
    return offset;
  };

  const colors = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#ca8a04',
    '#9333ea',
    '#0891b2',
    '#ea580c',
    '#475569',
    '#be185d',
  ];

  return (
    <div
      className={cn(
        'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
        className
      )}
    >
      {title && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            {title}
          </h3>
        </div>
      )}

      <div style={{ width, height }} className="relative">
        <svg width="100%" height="100%" viewBox={`0 0 800 ${height}`} preserveAspectRatio="none">
          {/* Flows */}
          {links.map((link, idx) => {
            const sY = getSourceY(link.source);
            const tY = getTargetY(link.target);

            // This is simplified: need to track how much of each node is already used
            // For a robust one, we'd need internal state for cumulative offsets per node
            // But let's stick to a clean visualization for now
            const linkHeight = (link.value / totalValue) * VIEW_HEIGHT;
            const startY = sY + linkHeight / 2;
            const endY = tY + linkHeight / 2;

            const path = `M ${NODE_WIDTH} ${startY} 
                          C 400 ${startY}, 400 ${endY}, 780 ${endY}`;

            return (
              <path
                key={`link-${idx}`}
                d={path}
                fill="none"
                stroke={link.color || colors[idx % colors.length]}
                strokeWidth={linkHeight}
                strokeOpacity={0.2}
                className="transition-all hover:stroke-opacity-50 cursor-pointer"
                onClick={onClick ? () => onClick(link) : undefined}
              />
            );
          })}

          {/* Source Nodes */}
          {sources.map(([name, val], idx) => {
            const y = getSourceY(name);
            const h = (val / totalValue) * VIEW_HEIGHT;
            return (
              <g key={`source-${idx}`}>
                <rect x={0} y={y} width={NODE_WIDTH} height={h} fill="#475569" rx={2} />
                <text
                  x={NODE_WIDTH + 8}
                  y={y + h / 2}
                  fontSize="10"
                  fontWeight="bold"
                  alignmentBaseline="middle"
                  fill="#64748b"
                >
                  {name} ({((val / totalValue) * 100).toFixed(0)}%)
                </text>
              </g>
            );
          })}

          {/* Target Nodes */}
          {targets.map(([name, val], idx) => {
            const y = getTargetY(name);
            const h = (val / totalValue) * VIEW_HEIGHT;
            return (
              <g key={`target-${idx}`}>
                <rect x={780} y={y} width={NODE_WIDTH} height={h} fill="#475569" rx={2} />
                <text
                  x={780 - 8}
                  y={y + h / 2}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                  alignmentBaseline="middle"
                  fill="#64748b"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
