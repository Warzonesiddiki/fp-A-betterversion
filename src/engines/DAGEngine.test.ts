import { describe, it, expect } from 'vitest';
import type { DAGNode } from '@/types/dag';
import {
  buildDAG,
  topologicalSortWithValidation,
  getTransitiveDependencies,
  findRootNodes,
  findLeafNodes,
} from './DAGEngine';

const node = (
  cellId: string,
  dependencies: readonly string[],
  dependents: readonly string[]
): DAGNode => ({
  cellId,
  label: cellId,
  dependencies,
  dependents,
  isEvaluated: false,
  formula: null,
  value: null,
  inputHash: '',
});

describe('DAGEngine (BATCH-007 — test the untested orphan)', () => {
  it('topologically sorts an acyclic graph and identifies roots/leaves', () => {
    const dag = buildDAG([node('A', [], ['B']), node('B', ['A'], ['C']), node('C', ['B'], [])]);
    const result = topologicalSortWithValidation(dag);
    expect(result.success).toBe(true);
    expect(result.order).toHaveLength(3);
    // Dependencies must precede dependents: A before B before C.
    expect(result.order.indexOf('A')).toBeLessThan(result.order.indexOf('B'));
    expect(result.order.indexOf('B')).toBeLessThan(result.order.indexOf('C'));
    expect(findRootNodes(dag)).toContain('A'); // no dependencies
    expect(findLeafNodes(dag)).toContain('C'); // no dependents
  });

  it('detects a circular dependency and reports it (no stack overflow)', () => {
    const dag = buildDAG([node('X', ['Y'], ['Y']), node('Y', ['X'], ['X'])]);
    const result = topologicalSortWithValidation(dag);
    expect(result.success).toBe(false);
    expect(result.cycles.length).toBeGreaterThan(0);
  });

  it('computes transitive dependencies across the chain', () => {
    const dag = buildDAG([node('A', [], ['B']), node('B', ['A'], ['C']), node('C', ['B'], [])]);
    const deps = getTransitiveDependencies(dag, 'C');
    expect(deps).toContain('A');
    expect(deps).toContain('B');
  });
});
