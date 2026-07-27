/**
 * DAG Engine — Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildDAG,
  topologicalSortWithValidation,
  detectCycles,
  recalculate,
  getTransitiveDependencies,
  getTransitiveDependents,
  findLeafNodes,
  findRootNodes,
} from '../DAGEngine';
import type { DAGNode } from '@/types/dag';

function makeNode(id: string, deps: string[] = []): DAGNode {
  return {
    cellId: id,
    label: id,
    dependencies: deps,
    dependents: [],
    isEvaluated: false,
    formula: null,
    value: null,
    inputHash: '',
  };
}

describe('DAGEngine', () => {
  describe('buildDAG', () => {
    it('builds a simple linear graph', () => {
      const nodes = [
        makeNode('A'),
        makeNode('B', ['A']),
        makeNode('C', ['B']),
      ];
      const graph = buildDAG(nodes);

      expect(graph.nodeCount).toBe(3);
      expect(graph.edgeCount).toBe(2);
      expect(graph.cycles).toHaveLength(0);
      expect(graph.topologicalOrder).toEqual(['A', 'B', 'C']);
    });

    it('builds a diamond graph', () => {
      const nodes = [
        makeNode('A'),
        makeNode('B', ['A']),
        makeNode('C', ['A']),
        makeNode('D', ['B', 'C']),
      ];
      const graph = buildDAG(nodes);

      expect(graph.nodeCount).toBe(4);
      expect(graph.edgeCount).toBe(4);
      expect(graph.cycles).toHaveLength(0);
      // A must come before B and C; D must come after B and C
      expect(graph.topologicalOrder.indexOf('A')).toBeLessThan(
        graph.topologicalOrder.indexOf('B')
      );
      expect(graph.topologicalOrder.indexOf('A')).toBeLessThan(
        graph.topologicalOrder.indexOf('C')
      );
      expect(graph.topologicalOrder.indexOf('B')).toBeLessThan(
        graph.topologicalOrder.indexOf('D')
      );
      expect(graph.topologicalOrder.indexOf('C')).toBeLessThan(
        graph.topologicalOrder.indexOf('D')
      );
    });

    it('detects a simple cycle', () => {
      const nodes = [
        makeNode('A', ['C']),
        makeNode('B', ['A']),
        makeNode('C', ['B']),
      ];
      const graph = buildDAG(nodes);

      expect(graph.cycles.length).toBeGreaterThan(0);
      expect(graph.topologicalOrder).toHaveLength(0);
    });

    it('handles missing dependency nodes', () => {
      const nodes = [makeNode('A', ['MISSING'])];
      const graph = buildDAG(nodes);

      expect(graph.nodeCount).toBe(2); // A + placeholder for MISSING
      expect(graph.nodes.has('MISSING')).toBe(true);
    });

    it('handles empty graph', () => {
      const graph = buildDAG([]);
      expect(graph.nodeCount).toBe(0);
      expect(graph.topologicalOrder).toHaveLength(0);
    });
  });

  describe('topologicalSortWithValidation', () => {
    it('returns success for acyclic graph', () => {
      const nodes = [makeNode('A'), makeNode('B', ['A'])];
      const graph = buildDAG(nodes);
      const result = topologicalSortWithValidation(graph);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(['A', 'B']);
      expect(result.cycles).toHaveLength(0);
    });

    it('returns failure for cyclic graph', () => {
      const nodes = [makeNode('A', ['B']), makeNode('B', ['A'])];
      const graph = buildDAG(nodes);
      const result = topologicalSortWithValidation(graph);

      expect(result.success).toBe(false);
      expect(result.order).toHaveLength(0);
      expect(result.cycles.length).toBeGreaterThan(0);
    });
  });

  describe('recalculate', () => {
    it('recalculates only affected cells', () => {
      const nodes = [
        makeNode('A'),
        makeNode('B', ['A']),
        makeNode('C', ['B']),
        makeNode('D'), // independent
      ];
      const graph = buildDAG(nodes);
      const evaluated: string[] = [];
      const evaluateCell = (id: string) => {
        evaluated.push(id);
        return 0;
      };

      const result = recalculate(graph, evaluateCell, new Set(['A']));

      expect(result.recomputedCells).toContain('A');
      expect(result.recomputedCells).toContain('B');
      expect(result.recomputedCells).toContain('C');
      expect(result.recomputedCells).not.toContain('D');
      expect(result.skippedCells).toContain('D');
    });

    it('returns cycle errors when graph has cycles', () => {
      const nodes = [makeNode('A', ['B']), makeNode('B', ['A'])];
      const graph = buildDAG(nodes);

      const result = recalculate(graph, () => 0, new Set(['A']));

      expect(result.hasCycles).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]!.errorCode).toBe('CIRCULAR_REF');
    });
  });

  describe('transitive queries', () => {
    const nodes = [
      makeNode('A'),
      makeNode('B', ['A']),
      makeNode('C', ['B']),
      makeNode('D', ['C']),
    ];
    const graph = buildDAG(nodes);

    it('gets transitive dependencies', () => {
      const deps = getTransitiveDependencies(graph, 'D');
      expect(deps).toContain('C');
      expect(deps).toContain('B');
      expect(deps).toContain('A');
    });

    it('gets transitive dependents', () => {
      const deps = getTransitiveDependents(graph, 'A');
      expect(deps).toContain('B');
      expect(deps).toContain('C');
      expect(deps).toContain('D');
    });

    it('finds leaf nodes', () => {
      const leaves = findLeafNodes(graph);
      expect(leaves).toContain('D');
    });

    it('finds root nodes', () => {
      const roots = findRootNodes(graph);
      expect(roots).toContain('A');
    });
  });
});
