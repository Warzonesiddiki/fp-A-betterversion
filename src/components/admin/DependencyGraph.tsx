/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CalculationGraph, CellNode } from '../../engines/CalculationGraph';
import type { GraphStats, CycleResult } from '../../engines/CalculationGraph';
import { useUIStore } from '../../store/uiStore';

// Optional: if Tauri is available for a true native window popout
let WebviewWindow: { new (label: string, options: Record<string, unknown>): unknown } | null = null;
try {
  import('@tauri-apps/api/webviewWindow').then((module) => {
    WebviewWindow = module.WebviewWindow as unknown as typeof WebviewWindow;
  });
} catch (e) {
  // Ignore
}

const DEFAULT_CELLS = JSON.stringify(
  [
    { ref: 'A1', value: 100 },
    { ref: 'B1', value: 200 },
    { ref: 'C1', formula: 'A1 + B1' },
    { ref: 'D1', formula: 'C1 * 1.5' },
    { ref: 'E1', formula: 'D1 - A1' },
    { ref: 'F1', formula: 'G1 + 10' },
    { ref: 'G1', formula: 'F1 * 2' }, // Circular
  ],
  null,
  2
);

export const DependencyGraph: React.FC = () => {
  const [cellInput, setCellInput] = useState(DEFAULT_CELLS);
  const [graphData, setGraphData] = useState<{
    nodes: CellNode[];
    stats: GraphStats;
    cycles: CycleResult;
  } | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const engine = useMemo(() => new CalculationGraph(), []);

  const handleBuildGraph = () => {
    try {
      const parsedCells = JSON.parse(cellInput);
      if (!Array.isArray(parsedCells)) throw new Error('Input must be a JSON array of cells');

      engine.clear();
      const buildResult = engine.buildFromCells(parsedCells);
      const cycles = engine.detectCycles();

      // Access private nodes map via cast for debugging UI
      const nodesMap = (engine as unknown as { nodes: Map<string, CellNode> }).nodes;
      const nodes = Array.from(nodesMap.values());

      setGraphData({
        nodes,
        stats: engine.getStats(),
        cycles,
      });

      addToast({
        type: 'success',
        title: 'Graph Built',
        message: `Built with ${buildResult.nodeCount} nodes and ${buildResult.formulaCount} formulas.`,
      });
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Build Failed',
        message: e instanceof Error ? e.message : 'Invalid JSON format',
      });
    }
  };

  const openNativeWindow = () => {
    if (WebviewWindow) {
      new WebviewWindow('dependency-graph-debug', {
        url: '/admin/debug',
        title: 'Dependency Graph Debugger',
        width: 1000,
        height: 800,
      });
    } else {
      window.open('/admin/debug', '_blank', 'width=1000,height=800');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dependency Graph Engine</h2>
        <Button
          variant="outline"
          onClick={openNativeWindow}
          aria-label="Open graph debugger in new window"
        >
          Pop Out (Native Window)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cell Input (JSON)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:border-slate-600 bg-white dark:bg-gray-900 dark:bg-slate-900 px-3 py-2 text-sm font-mono min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={cellInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCellInput(e.target.value)}
              placeholder="[{ ref: 'A1', value: 10 }, { ref: 'B1', formula: 'A1 * 2' }]"
              aria-label="Cell Input (JSON)"
            />
            <Button onClick={handleBuildGraph} className="w-full">
              Analyze Graph
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engine Stats & Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            {!graphData ? (
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Run analysis to see stats.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 dark:bg-slate-800 rounded">
                    <div className="font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      Total Cells
                    </div>
                    <div className="text-xl">{graphData.stats.totalCells}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 dark:bg-slate-800 rounded">
                    <div className="font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      Formulas
                    </div>
                    <div className="text-xl">{graphData.stats.formulaCells}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 dark:bg-slate-800 rounded">
                    <div className="font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      Dependencies
                    </div>
                    <div className="text-xl">{graphData.stats.totalDependencies}</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 dark:bg-slate-800 rounded">
                    <div className="font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                      Cycles Detected
                    </div>
                    <div className="text-xl text-red-600 font-bold">
                      {graphData.cycles.cycles.length}
                    </div>
                  </div>
                </div>

                {graphData.cycles.cycles.length > 0 && (
                  <div className="mt-4 p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded">
                    <h4 className="font-semibold mb-2">Circular References Detected</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {graphData.cycles.cycles.map((cycle: string[], i: number) => (
                        <li key={i}>{cycle.join(' → ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {graphData && (
        <Card>
          <CardHeader>
            <CardTitle>Node List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 dark:bg-slate-800 text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-2" scope="col">
                      Ref
                    </th>
                    <th className="px-4 py-2" scope="col">
                      Formula / Value
                    </th>
                    <th className="px-4 py-2" scope="col">
                      Dependencies
                    </th>
                    <th className="px-4 py-2" scope="col">
                      Dependents
                    </th>
                    <th className="px-4 py-2" scope="col">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {graphData.nodes.map((node) => (
                    <tr key={node.ref}>
                      <td className="px-4 py-2 font-medium">{node.ref}</td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {node.formula ? `=${node.formula}` : String(node.value ?? 'null')}
                      </td>
                      <td className="px-4 py-2">
                        {Array.from(node.dependencies).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-2">{Array.from(node.dependents).join(', ') || '-'}</td>
                      <td className="px-4 py-2">
                        {node.error ? (
                          <span className="text-red-600 font-semibold">{node.error}</span>
                        ) : node.dirty ? (
                          <span className="text-yellow-600">Dirty</span>
                        ) : (
                          <span className="text-green-600">Clean</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DependencyGraph;
