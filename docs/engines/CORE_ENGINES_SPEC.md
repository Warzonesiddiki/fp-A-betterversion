<!-- generated-by: gsd-doc-writer -->

# Core Engines Specification

This document provides detailed technical specifications for the core calculation and data engines in FinPlan Pro. These engines are pure TypeScript, deterministic, and designed for offline-first performance.

## 1. FormulaEngine

The `FormulaEngine` is responsible for parsing and evaluating spreadsheet-like formulas. It supports arithmetic operations, comparisons, and a broad range of financial and logical functions.

### API Signature

- `static parseFormula(formula: string): FormulaParseResult`: Parses a raw formula string into a syntax tree (AST).
- `static evaluate(nodes: FormulaNode[], getCellValue: (ref: string) => number): FormulaEvalResult`: Evaluates a parsed formula AST.
- `static getDependencies(formula: string): string[]`: Extracts all cell references and ranges as an array of unique dependencies.
- `static validateFormula(formula: string): { valid: boolean; error?: string }`: Returns the validity of a formula without full evaluation.
- `static recalculateWithCircularSupport(...)`: Orchestrates recalculation for sets of formulas, including iterative solving for circular references.

### Performance Characteristics

- **Max Formula Length**: 1,000 characters.
- **Max Nesting Depth**: 100 levels.
- **Max Array Size**: 100,000 elements (for range evaluations).
- **Complexity**: O(N) for parsing (where N is formula length); evaluation depends on tree depth and range sizes.

### Usage Example

```typescript
import { FormulaEngine } from '@/engines/FormulaEngine';

const formula = '=SUM(A1:A5) * 1.05';
const { nodes } = FormulaEngine.parseFormula(formula);
const result = FormulaEngine.evaluate(nodes, (ref) => {
  const values: Record<string, number> = { A1: 100, A2: 200, A3: 300, A4: 400, A5: 500 };
  return values[ref] || 0;
});

console.log(result.value); // Output: 1575
```

---

## 2. SafeMathParser

`SafeMathParser` is a "bulletproof" recursive descent parser designed for security. It intentionally avoids `eval()` and `new Function()` to prevent code injection while providing a massive library of 200+ financial and mathematical functions.

### Features

- **Security**: Strict tokenization and reserved word blocking (e.g., `window`, `process`, `import`).
- **Functionality**: Supports specialized FP&A functions like `XIRR`, `NPV`, `CAGR`, `WACC`, and `ROE`.
- **Constants**: Built-in support for `PI`, `E`, `TRUE`, and `FALSE`.

### Performance & Security Limits

- **Max Input Length**: 10,000 characters.
- **Max Recursion Depth**: 1,000 levels.
- **Max Tokens**: 10,000 per expression.
- **Max Function Arguments**: 100.

### Usage Example

```typescript
import { safeMathParser } from '@/engines/SafeMathParser';

// Complex financial calculation
const irr = safeMathParser.evaluate('IRR(-1000, 300, 420, 680)');
const taxImpact = safeMathParser.evaluate('EBIT(100000, 20000) * (1 - 0.25)');

console.log(`Project IRR: ${(irr * 100).toFixed(2)}%`);
```

---

## 3. CalculationGraph

The `CalculationGraph` manages cell dependencies in a Directed Acyclic Graph (DAG). It ensures that when a cell changes, only its downstream dependents are recalculated, in the correct topological order.

### API Signature

- `buildFromCells(cells: Array<{ ref: string; formula?: string; value?: unknown }>)`: Initializes the graph.
- `markDirty(ref: string): number`: Marks a cell and all its dependents as needing recalculation.
- `evaluateAll(options?: { ... })`: Evaluates all dirty cells using an iterative batching approach to keep the UI responsive.
- `detectCycles(): CycleResult`: Identifies circular references within the graph.

### Performance Characteristics

- **Recalculation Strategy**: Uses Kahn's algorithm for topological sorting.
- **Responsiveness**: Batches evaluations (default size: 500) with `setTimeout(0)` to prevent blocking the main thread during heavy recalcs.
- **Efficiency**: O(V + E) where V is the number of cells and E is the number of dependency links.

### Usage Example

```typescript
const graph = new CalculationGraph();
graph.buildFromCells([
  { ref: 'A1', value: 100 },
  { ref: 'A2', formula: '=A1 * 2' },
  { ref: 'B1', formula: '=A2 + 50' },
]);

// Change A1
graph.setValue('A1', 200);
graph.markDirty('A1');

// Only A2 and B1 will be re-evaluated
await graph.evaluateAll();
```

---

## 4. CubeEngine

`CubeEngine` provides a multi-dimensional OLAP (Online Analytical Processing) data model. It is the heart of the application's data layer, handling complex slice-and-dice queries, aggregations, and snapshots.

### Core Concepts

- **Dimensions**: Hierarchical structures (e.g., Year > Quarter > Month).
- **Measures**: Numerical values being tracked (e.g., Revenue, Headcount).
- **Cubes**: Combinations of dimensions and measures.
- **Snapshots**: Point-in-time captures of data for "What-If" analysis and variance reporting.

### API Signature

- `registerDimension(name, type, hierarchies, attributes)`: Defines a new axis.
- `writeCell(cube, cell)`: Persists a single data point with dimension coordinates.
- `query(query: CubeQuery): CubeResult`: Performs complex aggregations and filtering across multiple dimensions.
- `createSnapshot(name)`: Captures a differential snapshot of the current state.

### Performance Optimizations

- **Sparse Storage**: Uses a Map-based sparse storage model to efficiently handle large cubes with missing data.
- **Indexing**: Maintains multiple internal indexes (`cubeCellIndex`, `memberChildrenIndex`) to ensure O(1) member lookup and fast query filtering.
- **Differential Snapshots**: Only stores changed cell values in snapshots to minimize memory footprint.

### Usage Example

```typescript
const cube = new CubeEngine();
cube.registerDimension('Region');
cube.registerDimension('Time');

cube.addMember('Region', { code: 'US', name: 'United States', isLeaf: true });
cube.addMember('Time', { code: '2026-Q1', name: 'Q1 2026', isLeaf: true });

// Write data
await cube.writeCell('Sales', {
  coords: { Region: 'Region:US', Time: 'Time:2026-Q1' },
  measure: 'Revenue',
  value: 1250000,
  dataType: 'currency',
});

// Aggregate
const total = cube.aggregate('Sales', { Time: 'Time:2026-Q1' }, 'Revenue', 'sum');
```
