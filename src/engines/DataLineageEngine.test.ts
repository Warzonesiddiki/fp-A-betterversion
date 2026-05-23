import { describe, it, expect, beforeEach } from 'vitest';
import { DataLineageEngine, type DataSource } from './DataLineageEngine';
import type { LineageGraph } from './DataLineageEngine';

describe('DataLineageEngine', () => {
  let engine: DataLineageEngine;

  beforeEach(() => {
    engine = new DataLineageEngine();
  });

  describe('buildGraph', () => {
    it('should build graph from data sources', () => {
      const sources: DataSource[] = [
        { id: 'src-1', name: 'GL Source', type: 'file', status: 'active' },
        { id: 'src-2', name: 'API Source', type: 'api', status: 'active' },
      ];
      const graph = engine.buildGraph(sources);
      expect(graph.nodes).toHaveLength(2);
      expect(graph.nodes[0].type).toBe('source');
    });

    it('should return empty graph for empty sources', () => {
      const graph = engine.buildGraph([]);
      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });
  });

  describe('traceForward', () => {
    it('should trace forward through edges', () => {
      engine.addEdge('A', 'B');
      engine.addEdge('B', 'C');
      const graph: LineageGraph = {
        nodes: [
          { id: 'A', name: 'Source', type: 'source' },
          { id: 'B', name: 'Transform', type: 'transform' },
          { id: 'C', name: 'Report', type: 'report' },
        ],
        edges: engine['edges'],
      };
      const result = engine.traceForward('A', graph);
      expect(result).toContain('B');
      expect(result).toContain('C');
    });

    it('should return empty for leaf node', () => {
      const graph: LineageGraph = {
        nodes: [{ id: 'A', name: 'Source', type: 'source' }],
        edges: [],
      };
      expect(engine.traceForward('A', graph)).toEqual([]);
    });

    it('should handle missing source', () => {
      engine.addEdge('A', 'B');
      const graph: LineageGraph = { nodes: [], edges: engine['edges'] };
      expect(engine.traceForward('X', graph)).toEqual([]);
    });
  });

  describe('traceBackward', () => {
    it('should trace backward through edges', () => {
      engine.addEdge('A', 'B');
      engine.addEdge('B', 'C');
      const graph: LineageGraph = {
        nodes: [
          { id: 'A', name: 'Source', type: 'source' },
          { id: 'B', name: 'Transform', type: 'transform' },
          { id: 'C', name: 'Report', type: 'report' },
        ],
        edges: engine['edges'],
      };
      const result = engine.traceBackward('C', graph);
      expect(result).toContain('B');
      expect(result).toContain('A');
    });
  });

  describe('getImpactAnalysis', () => {
    it('should identify affected reports and sources', () => {
      engine.addEdge('src-1', 'transform-1');
      engine.addEdge('transform-1', 'report-1');
      const graph: LineageGraph = {
        nodes: [
          { id: 'src-1', name: 'Source', type: 'source' },
          { id: 'transform-1', name: 'Transform', type: 'transform' },
          { id: 'report-1', name: 'Report', type: 'report' },
        ],
        edges: engine['edges'],
      };
      const result = engine.getImpactAnalysis('src-1', graph);
      expect(result.affectedReports).toContain('report-1');
    });
  });
});
