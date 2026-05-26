import { memo } from 'react';

export interface DataLineageViewerProps {
  graph: {
    nodes: { id: string; name: string; type: 'source' | 'transform' | 'report' }[];
    edges: { from: string; to: string }[];
  };
  onNodeClick?: (id: string) => void;
  height?: number;
}

export const DataLineageViewer = memo(function DataLineageViewer({
  graph,
  onNodeClick,
  height = 400,
}: DataLineageViewerProps) {
  if (!graph.nodes.length) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-slate-950 border border-slate-800 rounded-lg"
      >
        <span className="text-slate-500">No lineage data</span>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden p-6"
    >
      <svg width="100%" height="100%" viewBox="0 0 800 400">
        {graph.nodes.map((node, i) => {
          const x = node.type === 'source' ? 100 : node.type === 'transform' ? 400 : 700;
          const y = (i % 5) * 80 + 40;
          const color =
            node.type === 'source' ? '#22c55e' : node.type === 'transform' ? '#f59e0b' : '#3b82f6';

          return (
            <g
              key={node.id}
              className="cursor-pointer group"
              onClick={() => onNodeClick?.(node.id)}
            >
              <rect
                x={x - 60}
                y={y - 20}
                width={120}
                height={40}
                rx={4}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={2}
                className="group-hover:fill-opacity-30 transition-all"
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize="12"
                className="pointer-events-none"
              >
                {node.name}
              </text>
            </g>
          );
        })}
        {graph.edges.map((edge, i) => {
          const fromNode = graph.nodes.find((n) => n.id === edge.from);
          const toNode = graph.nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const x1 = fromNode.type === 'source' ? 160 : fromNode.type === 'transform' ? 460 : 760;
          const y1 = (graph.nodes.indexOf(fromNode) % 5) * 80 + 40;
          const x2 = toNode.type === 'source' ? 40 : toNode.type === 'transform' ? 340 : 640;
          const y2 = (graph.nodes.indexOf(toNode) % 5) * 80 + 40;

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke="#334155"
              strokeWidth="2"
              fill="none"
            />
          );
        })}
      </svg>
    </div>
  );
});
