import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Database,
  GitBranch,
  Layers,
  FileText,
  ArrowRight,
  ChevronRight,
  Activity,
  Zap,
} from 'lucide-react';

interface LineageNode {
  id: string;
  label: string;
  type: 'source' | 'import' | 'store' | 'engine' | 'page';
  icon: React.ReactNode;
  color: string;
  glow: string;
  details: string[];
  connections: string[];
}

const defaultNodes: LineageNode[] = [
  {
    id: 'excel',
    label: 'Excel / CSV',
    type: 'source',
    icon: <FileText className="w-5 h-5" />,
    color: 'border-emerald-500 bg-emerald-500/10',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    details: ['GL dumps', 'Budget templates', 'Actuals export'],
    connections: ['import-engine'],
  },
  {
    id: 'import-engine',
    label: 'Import Engine',
    type: 'import',
    icon: <Database className="w-5 h-5" />,
    color: 'border-cyan-500 bg-cyan-500/10',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    details: [
      'ExcelImportEngine (412 lines)',
      'SmartImportMapper (337 lines)',
      'StreamImportEngine (202 lines)',
    ],
    connections: ['gl-store', 'budget-store'],
  },
  {
    id: 'gl-store',
    label: 'GL Store',
    type: 'store',
    icon: <Layers className="w-5 h-5" />,
    color: 'border-violet-500 bg-violet-500/10',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    details: ['9,994+ entries', '156 accounts', 'IndexedDB persistence'],
    connections: ['formula-engine', 'consolidation-engine', 'report-engine'],
  },
  {
    id: 'budget-store',
    label: 'Budget Store',
    type: 'store',
    icon: <Layers className="w-5 h-5" />,
    color: 'border-violet-500 bg-violet-500/10',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    details: ['Incremental + ZBB modes', 'Workflow states', 'Undo/redo'],
    connections: ['formula-engine', 'scenario-engine'],
  },
  {
    id: 'formula-engine',
    label: 'Formula Engine',
    type: 'engine',
    icon: <Zap className="w-5 h-5" />,
    color: 'border-amber-500 bg-amber-500/10',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    details: ['245+ functions', '7 categories', 'Dependency graph (CalculationGraph)'],
    connections: ['dashboard-page', 'report-page'],
  },
  {
    id: 'consolidation-engine',
    label: 'Consolidation Engine',
    type: 'engine',
    icon: <GitBranch className="w-5 h-5" />,
    color: 'border-amber-500 bg-amber-500/10',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    details: ['ASC 810 compliant', 'IC elimination', 'FX translation'],
    connections: ['consolidation-page'],
  },
  {
    id: 'scenario-engine',
    label: 'Scenario Engine',
    type: 'engine',
    icon: <Activity className="w-5 h-5" />,
    color: 'border-amber-500 bg-amber-500/10',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    details: ['Monte Carlo simulation', 'Sensitivity analysis', 'What-if sandbox'],
    connections: ['scenario-page'],
  },
  {
    id: 'report-engine',
    label: 'Report Engine',
    type: 'engine',
    icon: <FileText className="w-5 h-5" />,
    color: 'border-amber-500 bg-amber-500/10',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    details: ['P&L, BS, CF generation', 'PDF/Excel export', 'Report scheduling'],
    connections: ['report-page'],
  },
  {
    id: 'dashboard-page',
    label: 'Dashboard',
    type: 'page',
    icon: <Activity className="w-5 h-5" />,
    color: 'border-rose-500 bg-rose-500/10',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    details: ['KPI cards', 'Charts', 'NLQ chat'],
    connections: [],
  },
  {
    id: 'report-page',
    label: 'Reports',
    type: 'page',
    icon: <FileText className="w-5 h-5" />,
    color: 'border-rose-500 bg-rose-500/10',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    details: ['P&L, BS, CF', 'Variance analysis', 'Export'],
    connections: [],
  },
  {
    id: 'consolidation-page',
    label: 'Consolidation',
    type: 'page',
    icon: <GitBranch className="w-5 h-5" />,
    color: 'border-rose-500 bg-rose-500/10',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    details: ['Multi-entity', 'IC elimination', 'FX translation'],
    connections: [],
  },
  {
    id: 'scenario-page',
    label: 'Scenarios',
    type: 'page',
    icon: <Activity className="w-5 h-5" />,
    color: 'border-rose-500 bg-rose-500/10',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    details: ['Compare scenarios', 'Sensitivity', 'What-if'],
    connections: [],
  },
];

const typeLabels: Record<string, string> = {
  source: 'Data Source',
  import: 'Import Layer',
  store: 'State Store',
  engine: 'Calculation Engine',
  page: 'UI Page',
};

export default function DataLineagePage() {
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodesByType = useMemo(() => {
    const groups: Record<string, LineageNode[]> = {};
    for (const node of defaultNodes) {
      if (!groups[node.type]) groups[node.type] = [];
      groups[node.type]!.push(node);
    }
    return groups;
  }, []);

  const getConnectedNodes = useCallback((nodeId: string) => {
    const node = defaultNodes.find((n) => n.id === nodeId);
    if (!node) return [];
    return node.connections
      .map((c) => defaultNodes.find((n) => n.id === c))
      .filter(Boolean) as LineageNode[];
  }, []);

  const isHighlighted = useCallback(
    (nodeId: string) => {
      if (!hoveredNode) return false;
      if (hoveredNode === nodeId) return true;
      const hovered = defaultNodes.find((n) => n.id === hoveredNode);
      return hovered?.connections.includes(nodeId) ?? false;
    },
    [hoveredNode]
  );

  const types: Array<{ key: string; label: string }> = [
    { key: 'source', label: 'Sources' },
    { key: 'import', label: 'Import' },
    { key: 'store', label: 'Stores' },
    { key: 'engine', label: 'Engines' },
    { key: 'page', label: 'Pages' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Lineage</h1>
        <p className="text-muted-foreground">Track how data flows from source to screen</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {types.map((t) => (
          <span
            key={t.key}
            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
          >
            {t.label}
          </span>
        ))}
      </div>

      <div className="relative overflow-x-auto pb-4">
        <div className="flex items-start gap-8 min-w-max">
          {types.map((type, typeIdx) => (
            <div key={type.key} className="flex flex-col items-center gap-3">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {type.label}
              </div>
              {nodesByType[type.key]?.map((node) => (
                <div key={node.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 cursor-pointer
                      ${node.color} ${node.glow}
                      ${selectedNode?.id === node.id ? 'ring-2 ring-white/30 scale-105' : ''}
                      ${isHighlighted(node.id) ? 'ring-2 ring-white/20' : ''}
                      hover:scale-105 hover:ring-2 hover:ring-white/20
                    `}
                  >
                    <div className="text-[var(--text-secondary)]">{node.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {node.label}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {typeLabels[node.type]}
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white dark:bg-gray-900 dark:bg-gray-900/20 animate-pulse" />
                  </button>
                  {typeIdx < types.length - 1 && node.connections.length > 0 && (
                    <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <Card className={`${selectedNode.glow} border-2 ${selectedNode.color.split(' ')[0]}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedNode.icon}
              <span>{selectedNode.label}</span>
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {typeLabels[selectedNode.type]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Details</div>
                <ul className="space-y-1">
                  {selectedNode.details.map((detail, i) => (
                    <li
                      key={i}
                      className="text-sm text-[var(--text-secondary)] flex items-center gap-2"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedNode.connections.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">
                    Flows To
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getConnectedNodes(selectedNode.id).map((conn) => (
                      <button
                        key={conn.id}
                        onClick={() => setSelectedNode(conn)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${conn.color} hover:scale-105`}
                      >
                        {conn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
