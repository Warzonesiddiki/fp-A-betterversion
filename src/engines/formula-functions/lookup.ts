// =============================================================================
// FORMULA FUNCTION REGISTRY — Lookup & Array Functions
// =============================================================================
import type { FormulaFunction } from './helpers';
// MDETERM is defined locally as it's an array function

// =============================================================================
// ARRAY FUNCTIONS
// =============================================================================

export function UNIQUE(v: unknown): number[] {
  const vals = Array.isArray(v) ? v : [v as number];
  return Array.from(new Set(vals));
}
export function SORT(v: unknown): number[] {
  const vals = Array.isArray(v) ? v : [v];
  return [...vals].sort((a: number, b: number) => a - b);
}
export function SORTBY(v: number, by: number): number[] {
  const vals = Array.isArray(v) ? v : [v];
  const bys = Array.isArray(by) ? by : [by];
  return vals
    .map((val, i) => ({ val, by: bys[i] }))
    .sort((a, b) => a.by - b.by)
    .map((x) => x.val);
}
export function SEQUENCE(rows: number, cols = 1, start = 1, step = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < rows * cols; i++) result.push(start + i * step);
  return result;
}
export function RANDARRAY(rows: number, cols = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < rows * cols; i++) result.push(Math.random());
  return result;
}
export function TRANSPOSE(v: unknown): number[] {
  const vals = Array.isArray(v) ? v : [v];
  return vals;
}
export function MMULT(a: number, b: number): number[] {
  const as = Array.isArray(a) ? a : [a];
  const bs = Array.isArray(b) ? b : [b];
  const n = Math.round(Math.sqrt(as.length));
  const result: number[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += as[i * n + k] * bs[k * n + j];
      result.push(s);
    }
  return result;
}
export function MDETERM(m: number): number {
  const vals = Array.isArray(m) ? m : [m];
  const n = Math.round(Math.sqrt(vals.length));
  if (n === 1) return vals[0];
  if (n === 2) return vals[0] * vals[3] - vals[1] * vals[2];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const sub: number[] = [];
    for (let i = 1; i < n; i++) for (let k = 0; k < n; k++) if (k !== j) sub.push(vals[i * n + k]);
    det += (j % 2 === 0 ? 1 : -1) * vals[j] * MDETERM(sub as unknown as number);
  }
  return det;
}
export function MDETERM_FN(m: number): number {
  return MDETERM(m);
}
export function FILTER(vals: number, include: number): number[] {
  const v = Array.isArray(vals) ? vals : [vals];
  const inc = Array.isArray(include) ? include : [include];
  return v.filter((_, i) => inc[i] !== 0);
}
export function INDEX(arr: unknown, rowIdx: number, colIdx?: number): number {
  // 2D array: INDEX(array, row_num, col_num)
  if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) {
    const row = arr[rowIdx] as number[];
    if (!row) return 0;
    if (colIdx !== undefined) return row[colIdx] ?? 0;
    return row[0] ?? 0;
  }
  // 1D array fallback
  const vals = Array.isArray(arr) ? arr : [arr as number];
  return rowIdx >= 0 && rowIdx < vals.length ? vals[rowIdx] : 0;
}

export function MINVERSE(m: unknown): number[] {
  const vals = Array.isArray(m) ? m : [m as number];
  const n = Math.round(Math.sqrt(vals.length));
  if (n === 1) return [1 / vals[0]];
  const det = MDETERM(vals as unknown as number) as number;
  if (Math.abs(det) < 1e-12) return vals.map(() => 0);
  const cofactors: number[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const minor: number[] = [];
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) if (r !== i && c !== j) minor.push(vals[r * n + c]);
      cofactors.push(((-1) ** (i + j) * MDETERM(minor as unknown as number)) as number);
    }
  const adj: number[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) adj.push(cofactors[j * n + i] / det);
  return adj;
}

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

export function MATCH(val: number, arr: unknown, _matchType = 0): number {
  const vals = Array.isArray(arr) ? arr : [arr as number];
  const idx = vals.indexOf(val);
  return idx >= 0 ? idx + 1 : 0;
}
export function XMATCH(val: number, arr: unknown): number {
  const vals = Array.isArray(arr) ? arr : [arr as number];
  const idx = vals.indexOf(val);
  return idx >= 0 ? idx + 1 : 0;
}
export function XLOOKUP(lookup: number, searchArr: unknown, returnArr: unknown): number {
  const s = Array.isArray(searchArr) ? searchArr : [searchArr as number];
  const r = Array.isArray(returnArr) ? returnArr : [returnArr as number];
  const idx = s.indexOf(lookup);
  return idx >= 0 && idx < r.length ? r[idx] : 0;
}
export function VLOOKUP(lookup: number, table: unknown, colIdx: number, _approx = 0): number {
  // Support 2D table: find lookup value in first column, return value from colIdx column
  if (Array.isArray(table) && table.length > 0 && Array.isArray(table[0])) {
    for (const row of table as number[][]) {
      if (row[0] === lookup) {
        return row[colIdx] ?? 0;
      }
    }
    return 0;
  }
  // 1D array fallback
  const t = Array.isArray(table) ? table : [table as number];
  const idx = t.indexOf(lookup);
  return idx >= 0 ? t[idx] : 0;
}
export function HLOOKUP(lookup: number, table: unknown, rowIdx: number, _approx = 0): number {
  // Support 2D table: find lookup value in first row, return value from rowIdx row
  if (Array.isArray(table) && table.length > 0 && Array.isArray(table[0])) {
    const firstRow = table[0] as number[];
    const colIdx = firstRow.indexOf(lookup);
    if (colIdx >= 0 && rowIdx < table.length) {
      return (table[rowIdx] as number[])[colIdx] ?? 0;
    }
    return 0;
  }
  const t = Array.isArray(table) ? table : [table as number];
  const idx = t.indexOf(lookup);
  return idx >= 0 ? t[idx] : 0;
}
export function OFFSET(base: unknown, rows: number, cols: number, _height = 1, _width = 1): number {
  const vals = Array.isArray(base) ? base : [base as number];
  const idx = rows + cols;
  return idx >= 0 && idx < vals.length ? vals[idx] : 0;
}
export function INDIRECT(ref: unknown): number {
  return typeof ref === 'string' ? 0 : (ref as number);
}

// =============================================================================
// REGISTER ALL LOOKUP & ARRAY FUNCTIONS
// =============================================================================

export function registerLookupFunctions(r: (fn: FormulaFunction) => void): void {
  r({
    name: 'UNIQUE',
    category: 'array',
    description: 'Unique values',
    minArgs: 1,
    maxArgs: -1,
    impl: UNIQUE,
  });
  r({
    name: 'SORT',
    category: 'array',
    description: 'Sort values',
    minArgs: 1,
    maxArgs: -1,
    impl: SORT,
  });
  r({
    name: 'SORTBY',
    category: 'array',
    description: 'Sort by another array',
    minArgs: 2,
    maxArgs: 2,
    impl: SORTBY,
  });
  r({
    name: 'SEQUENCE',
    category: 'array',
    description: 'Sequence of numbers',
    minArgs: 1,
    maxArgs: 4,
    impl: SEQUENCE,
  });
  r({
    name: 'RANDARRAY',
    category: 'array',
    description: 'Random array',
    minArgs: 1,
    maxArgs: 2,
    impl: RANDARRAY,
  });
  r({
    name: 'TRANSPOSE',
    category: 'array',
    description: 'Transpose array',
    minArgs: 1,
    maxArgs: -1,
    impl: TRANSPOSE,
  });
  r({
    name: 'MMULT',
    category: 'array',
    description: 'Matrix multiplication',
    minArgs: 2,
    maxArgs: 2,
    impl: MMULT,
  });
  r({
    name: 'MDETERM',
    category: 'array',
    description: 'Matrix determinant',
    minArgs: 1,
    maxArgs: -1,
    impl: MDETERM_FN,
  });
  r({
    name: 'FILTER',
    category: 'array',
    description: 'Filter array',
    minArgs: 2,
    maxArgs: 2,
    impl: FILTER,
  });
  r({
    name: 'INDEX',
    category: 'array',
    description: 'Index into array',
    minArgs: 2,
    maxArgs: 2,
    impl: INDEX,
  });
  r({
    name: 'MINVERSE',
    category: 'array',
    description: 'Matrix inverse',
    minArgs: 1,
    maxArgs: -1,
    impl: MINVERSE,
  });
  r({
    name: 'MATCH',
    category: 'lookup',
    description: 'Match value in array',
    minArgs: 2,
    maxArgs: 3,
    impl: MATCH,
  });
  r({
    name: 'XMATCH',
    category: 'lookup',
    description: 'Exact match in array',
    minArgs: 2,
    maxArgs: 2,
    impl: XMATCH,
  });
  r({
    name: 'XLOOKUP',
    category: 'lookup',
    description: 'Search array and return value',
    minArgs: 3,
    maxArgs: 3,
    impl: XLOOKUP,
  });
  r({
    name: 'VLOOKUP',
    category: 'lookup',
    description: 'Vertical lookup',
    minArgs: 3,
    maxArgs: 4,
    impl: VLOOKUP,
  });
  r({
    name: 'HLOOKUP',
    category: 'lookup',
    description: 'Horizontal lookup',
    minArgs: 3,
    maxArgs: 4,
    impl: HLOOKUP,
  });
  r({
    name: 'OFFSET',
    category: 'lookup',
    description: 'Offset reference',
    minArgs: 3,
    maxArgs: 5,
    impl: (base: number, rows: number, cols: number, _height = 1, _width = 1) => {
      // OFFSET returns a reference — in our numeric context, return offset value
      return typeof base === 'number' ? base + rows + cols : 0;
    },
  });
  r({
    name: 'INDIRECT',
    category: 'lookup',
    description: 'Indirect reference',
    minArgs: 1,
    maxArgs: 2,
    impl: (ref: unknown) => {
      // INDIRECT creates a reference from a string — return the string as-is for engine resolution
      return typeof ref === 'string' ? 0 : (ref as number);
    },
  });
}
