import { describe, it, expect } from 'vitest';
import { CalculationGraph } from './CalculationGraph';

describe('CalculationGraph', () => {
  it('should build graph from cells with formulas', () => {
    const graph = new CalculationGraph();
    const result = graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', value: 20 },
      { ref: 'C1', formula: '=A1+B1' },
    ]);

    expect(result.nodeCount).toBe(3);
    expect(result.formulaCount).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect dependencies', () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', formula: '=A1*2' },
      { ref: 'C1', formula: '=A1+B1' },
    ]);

    expect(graph.getDependencies('B1')).toContain('A1');
    expect(graph.getDependencies('C1')).toContain('A1');
    expect(graph.getDependencies('C1')).toContain('B1');
  });

  it('should detect dependents', () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', formula: '=A1*2' },
      { ref: 'C1', formula: '=A1+5' },
    ]);

    const dependents = graph.getDependents('A1');
    expect(dependents).toContain('B1');
    expect(dependents).toContain('C1');
  });

  it('should mark dirty and cascade', () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', formula: '=A1*2' },
      { ref: 'C1', formula: '=B1+5' },
    ]);

    // All start dirty
    const dirtyCount = graph.markDirty('A1');
    expect(dirtyCount).toBe(3); // A1, B1, C1
  });

  it('should get dirty cells in topological order', () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', formula: '=A1*2' },
      { ref: 'C1', formula: '=B1+5' },
    ]);

    const order = graph.getDirtyCellsInTopoOrder();
    expect(order.indexOf('A1')).toBeLessThan(order.indexOf('B1'));
    expect(order.indexOf('B1')).toBeLessThan(order.indexOf('C1'));
  });

  it('should detect circular references', () => {
    const graph = new CalculationGraph();
    const result = graph.buildFromCells([
      { ref: 'A1', formula: '=B1+1' },
      { ref: 'B1', formula: '=A1+1' },
    ]);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe('CIRCULAR_REFERENCE');
  });

  it('should evaluate formulas', async () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', value: 20 },
      { ref: 'C1', formula: '=A1+B1' },
    ]);

    const result = await graph.evaluateAll();
    expect(result.evaluated).toBe(3);
    expect(result.errors).toBe(0);

    const c1 = graph.getNode('C1');
    expect(c1?.value).toBe(30);
  });

  it('should return stats', () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([
      { ref: 'A1', value: 10 },
      { ref: 'B1', formula: '=A1*2' },
    ]);

    const stats = graph.getStats();
    expect(stats.totalCells).toBe(2);
    expect(stats.formulaCells).toBe(1);
    expect(stats.totalDependencies).toBe(1);
  });

  it('should clear graph', () => {
    const graph = new CalculationGraph();
    graph.buildFromCells([{ ref: 'A1', value: 10 }]);
    expect(graph.getStats().totalCells).toBe(1);

    graph.clear();
    expect(graph.getStats().totalCells).toBe(0);
  });
});
