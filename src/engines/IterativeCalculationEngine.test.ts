import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildDependencyGraph,
  detectCircularReferences,
  getCircularCells,
  solveIteratively,
  analyzeFormulas,
  DEFAULT_ITERATIVE_CONFIG,
  type IterativeConfig,
  type DependencyGraph,
  type CellValueAccessor,
} from './IterativeCalculationEngine';

describe('IterativeCalculationEngine', () => {
  it('should build dependency graph', () => {
    const formulas = new Map<string, string>([
      ['A1', '=B1+1'],
      ['B1', '=C1+2'],
      ['C1', '=10'],
    ]);
    const getDeps = (formula: string) => {
      const matches = formula.match(/[A-Z]\d+/g);
      return matches ?? [];
    };

    const graph = buildDependencyGraph(formulas, getDeps);
    expect(graph.dependencies.size).toBe(3);
    expect(graph.dependencies.get('A1')).toContain('B1');
    expect(graph.dependencies.get('B1')).toContain('C1');
  });

  it('should detect circular references', () => {
    const graph: DependencyGraph = {
      dependencies: new Map([
        ['A1', new Set(['B1'])],
        ['B1', new Set(['A1'])],
      ]),
    };

    const cycles = detectCircularReferences(graph);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0].cells).toContain('A1');
    expect(cycles[0].cells).toContain('B1');
  });

  it('should detect no circular references in acyclic graph', () => {
    const graph: DependencyGraph = {
      dependencies: new Map([
        ['A1', new Set(['B1'])],
        ['B1', new Set(['C1'])],
        ['C1', new Set()],
      ]),
    };

    const cycles = detectCircularReferences(graph);
    expect(cycles.length).toBe(0);
  });

  it('should get circular cells from cycles', () => {
    const graph: DependencyGraph = {
      dependencies: new Map([
        ['A1', new Set(['B1'])],
        ['B1', new Set(['A1'])],
      ]),
    };

    const cycles = detectCircularReferences(graph);
    const cells = getCircularCells(cycles);
    expect(cells.size).toBe(2);
    expect(cells.has('A1')).toBe(true);
    expect(cells.has('B1')).toBe(true);
  });

  it('should analyze formulas for circular references', () => {
    const formulas = new Map<string, string>([
      ['A1', '=B1+1'],
      ['B1', '=A1+1'],
    ]);
    const getDeps = (formula: string) => {
      const matches = formula.match(/[A-Z]\d+/g);
      return matches ?? [];
    };

    const result = analyzeFormulas(formulas, getDeps);
    expect(result.hasCircular).toBe(true);
    expect(result.cycles.length).toBeGreaterThan(0);
    expect(result.circularCells.size).toBeGreaterThan(0);
  });

  it('should solve iteratively for convergent formulas', () => {
    const config: IterativeConfig = {
      maxIterations: 100,
      maxChange: 0.001,
      enableIterativeCalc: true,
    };
    const cellValues = new Map<string, number>([
      ['A1', 0],
      ['B1', 0],
    ]);

    const accessor: CellValueAccessor = {
      getCellValue: (ref: string) => cellValues.get(ref) ?? 0,
      setCellValue: (ref: string, value: number) => {
        cellValues.set(ref, value);
      },
      recalcCell: (ref: string) => {
        if (ref === 'A1') {
          const val = (cellValues.get('B1') ?? 0) + 1;
          cellValues.set('A1', val);
          return val;
        } else {
          const val = (cellValues.get('A1') ?? 0) * 0.5;
          cellValues.set('B1', val);
          return val;
        }
      },
    };

    const circularCells = new Set(['A1', 'B1']);
    const result = solveIteratively(circularCells, accessor, config);
    expect(result.status).toBeDefined();
    expect(result.iterations).toBeGreaterThan(0);
  });

  it('should return not-started when iterative calc disabled', () => {
    const config: IterativeConfig = { ...DEFAULT_ITERATIVE_CONFIG, enableIterativeCalc: false };
    const circularCells = new Set(['A1']);

    const accessor: CellValueAccessor = {
      getCellValue: () => 0,
      setCellValue: () => {},
      recalcCell: () => 0,
    };

    const result = solveIteratively(circularCells, accessor, config);
    expect(result.status).toBe('not-started');
    expect(result.iterations).toBe(0);
  });
});
