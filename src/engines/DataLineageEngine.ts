import type { DataSource } from '@/types/sector-types';

export interface LineageNode {
  id: string;
  name: string;
  type: 'source' | 'transform' | 'report';
}

export interface LineageEdge {
  from: string;
  to: string;
  label?: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface ImpactAnalysis {
  affectedReports: string[];
  affectedSources: string[];
  path: string[];
}

export class DataLineageEngine {
  private edges: LineageEdge[] = [];

  addEdge(from: string, to: string, label?: string): void {
    this.edges.push({ from, to, label });
  }

  buildGraph(sources: DataSource[]): LineageGraph {
    if (sources.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: LineageNode[] = sources.map((s) => ({
      id: s.id,
      name: s.name,
      type: 'source',
    }));

    return { nodes, edges: this.edges };
  }

  traceForward(sourceId: string, graph: LineageGraph): string[] {
    const visited = new Set<string>();
    const queue = [sourceId];
    const results: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      if (current !== sourceId) results.push(current);

      const next = graph.edges.filter((e) => e.from === current).map((e) => e.to);
      queue.push(...next);
    }

    return results;
  }

  traceBackward(reportId: string, graph: LineageGraph): string[] {
    const visited = new Set<string>();
    const queue = [reportId];
    const results: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      if (current !== reportId) results.push(current);

      const next = graph.edges.filter((e) => e.to === current).map((e) => e.from);
      queue.push(...next);
    }

    return results;
  }

  getImpactAnalysis(nodeId: string, graph: LineageGraph): ImpactAnalysis {
    const affectedReports: string[] = [];
    const affectedSources: string[] = [];
    const path: string[] = [];

    const forward = this.traceForward(nodeId, graph);
    forward.forEach((id) => {
      const node = graph.nodes.find((n) => n.id === id);
      if (node?.type === 'report') affectedReports.push(id);
    });

    const backward = this.traceBackward(nodeId, graph);
    backward.forEach((id) => {
      const node = graph.nodes.find((n) => n.id === id);
      if (node?.type === 'source') affectedSources.push(id);
    });

    return {
      affectedReports,
      affectedSources,
      path,
    };
  }
}
