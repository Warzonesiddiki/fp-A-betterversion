// =============================================================================
// FORMULA FUNCTION REGISTRY — Logical & Information Functions
// =============================================================================
import type { FormulaFunction } from './helpers';

// =============================================================================
// LOGICAL FUNCTIONS
// =============================================================================

export function IFS(c: number, t: number, f: number): number {
  return c !== 0 ? t : f;
}
export function CHOOSE(idx: number, ...vals: number[]): number {
  return idx < 0 || idx >= vals.length ? 0 : vals[idx]!;
}
export function BETWEEN(v: number, lo: number, hi: number): number {
  return v >= lo && v <= hi ? 1 : 0;
}
export function CLAMP(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
export function COALESCE(...vals: number[]): number {
  for (const v of vals) if (v !== 0 && !isNaN(v) && isFinite(v)) return v;
  return 0;
}
export function AND(...vals: number[]): number {
  return vals.every((v) => v !== 0) ? 1 : 0;
}
export function OR(...vals: number[]): number {
  return vals.some((v) => v !== 0) ? 1 : 0;
}
export function NOT(v: number): number {
  return v === 0 ? 1 : 0;
}
export function XOR(...vals: number[]): number {
  return vals.filter((v) => v !== 0).length % 2 === 1 ? 1 : 0;
}
export function IFERROR(v: number, alt: number): number {
  return isNaN(v) || !isFinite(v) ? alt : v;
}
export function IFNA(v: number, alt: number): number {
  return isNaN(v) ? alt : v;
}
export function SWITCH(val: number, ...args: number[]): number {
  for (let i = 0; i < args.length - 1; i += 2) {
    if (val === args[i]!) return args[i + 1]!;
  }
  return args.length % 2 === 1 ? args[args.length - 1]! : 0;
}

// =============================================================================
// INFORMATION FUNCTIONS
// =============================================================================

export function ISBLANK(v: number): number {
  return v === 0 ? 1 : 0;
}
export function ISERR(v: number): number {
  return isNaN(v) ? 0 : 1;
}
export function ISERROR(v: number): number {
  return isNaN(v) || !isFinite(v) ? 1 : 0;
}
export function ISEVEN(v: number): number {
  return Math.round(v) % 2 === 0 ? 1 : 0;
}
export function ISODD(v: number): number {
  return Math.round(v) % 2 !== 0 ? 1 : 0;
}
export function ISLOGICAL(v: number): number {
  return v === 0 || v === 1 ? 1 : 0;
}
export function ISNA(v: number): number {
  return isNaN(v) ? 1 : 0;
}
export function ISNONTEXT(_v: number): number {
  return 1;
}
export function ISNUMBER(v: number): number {
  return isNaN(v) ? 0 : 1;
}
export function ISTEXT(_v: number): number {
  return 0;
}
export function ISREF(_v: number): number {
  return 1;
}
export function TYPE(v: unknown): number {
  return Array.isArray(v) ? 64 : isNaN(v as number) ? 16 : 1;
}
export function NA(): number {
  return NaN;
}
export function ERROR_TYPE(v: number): number {
  return isNaN(v) ? 7 : !isFinite(v) ? 2 : 0;
}
export function SHEET(): number {
  return 1;
}
export function SHEETS(): number {
  return 1;
}

// =============================================================================
// REGISTER ALL LOGICAL & INFORMATION FUNCTIONS
// =============================================================================

export function registerLogicalFunctions(r: (fn: FormulaFunction) => void): void {
  r({
    name: 'IFS',
    category: 'logical',
    description: 'Conditional value',
    minArgs: 3,
    maxArgs: 3,
    impl: IFS,
  });
  r({
    name: 'CHOOSE',
    category: 'logical',
    description: 'Choose value by index',
    minArgs: 2,
    maxArgs: -1,
    impl: CHOOSE,
  });
  r({
    name: 'BETWEEN',
    category: 'logical',
    description: 'Check if between',
    minArgs: 3,
    maxArgs: 3,
    impl: BETWEEN,
  });
  r({
    name: 'CLAMP',
    category: 'logical',
    description: 'Clamp to range',
    minArgs: 3,
    maxArgs: 3,
    impl: CLAMP,
  });
  r({
    name: 'COALESCE',
    category: 'logical',
    description: 'First non-zero',
    minArgs: 1,
    maxArgs: -1,
    impl: COALESCE,
  });
  r({
    name: 'AND',
    category: 'logical',
    description: 'Logical AND',
    minArgs: 1,
    maxArgs: -1,
    impl: AND,
  });
  r({
    name: 'OR',
    category: 'logical',
    description: 'Logical OR',
    minArgs: 1,
    maxArgs: -1,
    impl: OR,
  });
  r({
    name: 'NOT',
    category: 'logical',
    description: 'Logical NOT',
    minArgs: 1,
    maxArgs: 1,
    impl: NOT,
  });
  r({
    name: 'XOR',
    category: 'logical',
    description: 'Logical XOR',
    minArgs: 1,
    maxArgs: -1,
    impl: XOR,
  });
  r({
    name: 'IFERROR',
    category: 'logical',
    description: 'Return alt if error',
    minArgs: 2,
    maxArgs: 2,
    impl: IFERROR,
  });
  r({
    name: 'IFNA',
    category: 'logical',
    description: 'Return alt if NA',
    minArgs: 2,
    maxArgs: 2,
    impl: IFNA,
  });
  r({
    name: 'SWITCH',
    category: 'logical',
    description: 'Switch on value',
    minArgs: 3,
    maxArgs: -1,
    impl: SWITCH,
  });
  r({
    name: 'IF',
    category: 'logical',
    description: 'Conditional value',
    minArgs: 2,
    maxArgs: 3,
    impl: (c: number, t: number, f = 0) => (c !== 0 ? t : f),
  });
  r({
    name: 'TRUE',
    category: 'logical',
    description: 'Boolean true',
    minArgs: 0,
    maxArgs: 0,
    impl: () => 1,
  });
  r({
    name: 'FALSE',
    category: 'logical',
    description: 'Boolean false',
    minArgs: 0,
    maxArgs: 0,
    impl: () => 0,
  });
  r({
    name: 'LET',
    category: 'logical',
    description: 'Let binding',
    minArgs: 3,
    maxArgs: -1,
    impl: (...args: number[]) => args[args.length - 1]!,
  });

  // Information
  r({
    name: 'ISBLANK',
    category: 'information',
    description: 'Is blank',
    minArgs: 1,
    maxArgs: 1,
    impl: ISBLANK,
  });
  r({
    name: 'ISERR',
    category: 'information',
    description: 'Is error (not NA)',
    minArgs: 1,
    maxArgs: 1,
    impl: ISERR,
  });
  r({
    name: 'ISERROR',
    category: 'information',
    description: 'Is any error',
    minArgs: 1,
    maxArgs: 1,
    impl: ISERROR,
  });
  r({
    name: 'ISEVEN',
    category: 'information',
    description: 'Is even',
    minArgs: 1,
    maxArgs: 1,
    impl: ISEVEN,
  });
  r({
    name: 'ISODD',
    category: 'information',
    description: 'Is odd',
    minArgs: 1,
    maxArgs: 1,
    impl: ISODD,
  });
  r({
    name: 'ISLOGICAL',
    category: 'information',
    description: 'Is logical',
    minArgs: 1,
    maxArgs: 1,
    impl: ISLOGICAL,
  });
  r({
    name: 'ISNA',
    category: 'information',
    description: 'Is NA',
    minArgs: 1,
    maxArgs: 1,
    impl: ISNA,
  });
  r({
    name: 'ISNONTEXT',
    category: 'information',
    description: 'Is non-text',
    minArgs: 1,
    maxArgs: 1,
    impl: ISNONTEXT,
  });
  r({
    name: 'ISNUMBER',
    category: 'information',
    description: 'Is number',
    minArgs: 1,
    maxArgs: 1,
    impl: ISNUMBER,
  });
  r({
    name: 'ISTEXT',
    category: 'information',
    description: 'Is text',
    minArgs: 1,
    maxArgs: 1,
    impl: ISTEXT,
  });
  r({
    name: 'ISREF',
    category: 'information',
    description: 'Is reference',
    minArgs: 1,
    maxArgs: 1,
    impl: ISREF,
  });
  r({
    name: 'TYPE',
    category: 'information',
    description: 'Type of value',
    minArgs: 1,
    maxArgs: 1,
    impl: TYPE,
  });
  r({
    name: 'NA',
    category: 'information',
    description: 'Not available',
    minArgs: 0,
    maxArgs: 0,
    impl: NA,
  });
  r({
    name: 'ERROR.TYPE',
    category: 'information',
    description: 'Error type code',
    minArgs: 1,
    maxArgs: 1,
    impl: ERROR_TYPE,
  });
  r({
    name: 'SHEET',
    category: 'information',
    description: 'Sheet number',
    minArgs: 0,
    maxArgs: 0,
    impl: SHEET,
  });
  r({
    name: 'SHEETS',
    category: 'information',
    description: 'Number of sheets',
    minArgs: 0,
    maxArgs: 0,
    impl: SHEETS,
  });
}
