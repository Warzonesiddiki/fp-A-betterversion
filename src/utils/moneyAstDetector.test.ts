/**
 * Behavioural contract for the AST money detector (Blueprint W0.1.0).
 *
 * A correctness detector that nobody trusts gets switched off, so this suite
 * pins BOTH directions:
 *
 *   - must-catch   real float arithmetic on money (a miss ships a wrong number)
 *   - must-ignore  counters, rates, indices, display strings and decimal.js
 *                  (a false positive trains people to ignore the gate)
 *
 * Every must-ignore case below was an actual false positive observed against
 * this repository on 2026-08-17 and fixed; they are regression locks, not
 * hypotheticals.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const DETECTOR = join(process.cwd(), 'scripts', 'money-ast-detector.mjs');

/**
 * Run the detector over a single synthetic module and return its findings.
 * The fixture is written into a temp checkout that mirrors a scanned path
 * (src/engines) so the real directory filter applies unchanged.
 */
function analyse(source: string) {
  const dir = mkdtempSync(join(tmpdir(), 'money-ast-'));
  try {
    const engines = join(dir, 'src', 'engines');
    mkdirSync(engines, { recursive: true });
    writeFileSync(join(engines, 'Fixture.ts'), source, 'utf8');
    const out = execFileSync(process.execPath, [DETECTOR, '--json'], {
      cwd: dir,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(out);
    const mod = parsed.modules.find((m: { file: string }) => m.file.endsWith('Fixture.ts'));
    return { count: mod ? mod.unsafe : 0, findings: mod ? mod.findings : [] };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('money AST detector — must catch unsafe monetary arithmetic', () => {
  it('flags float addition of two monetary fields', () => {
    const { count, findings } = analyse(`
      export function f(a: { revenue: number }, b: { revenue: number }) {
        return a.revenue + b.revenue;
      }
    `);
    expect(count).toBeGreaterThan(0);
    expect(findings[0].kind).toBe('arithmetic');
  });

  it('flags debit - credit, the canonical ledger mistake', () => {
    const { count } = analyse(`
      export const bal = (e: { debit: number; credit: number }) => e.debit - e.credit;
    `);
    expect(count).toBeGreaterThan(0);
  });

  it('flags compound assignment accumulating money', () => {
    const { findings } = analyse(`
      export function total(rows: { invoiceAmount: number }[]) {
        let totalRevenue = 0;
        for (const r of rows) totalRevenue += r.invoiceAmount;
        return totalRevenue;
      }
    `);
    expect(findings.some((f: { kind: string }) => f.kind === 'compound-assign')).toBe(true);
  });

  it('flags reduce() accumulating money on floats', () => {
    const { findings } = analyse(`
      export const sum = (rows: { salaryExpense: number }[]) =>
        rows.reduce((acc, r) => acc + r.salaryExpense, 0);
    `);
    expect(
      findings.some(
        (f: { kind: string }) => f.kind === 'reduce-accumulate' || f.kind === 'arithmetic'
      )
    ).toBe(true);
  });

  it('flags float comparison of two monetary values (approval thresholds)', () => {
    const { findings } = analyse(`
      export const over = (a: { invoiceAmount: number }, b: { budgetAmount: number }) =>
        a.invoiceAmount > b.budgetAmount;
    `);
    expect(findings.some((f: { kind: string }) => f.kind === 'comparison')).toBe(true);
  });

  it('flags === between monetary values (0.1 + 0.2 !== 0.3)', () => {
    const { findings } = analyse(`
      export const same = (a: { cashBalance: number }, b: { cashBalance: number }) =>
        a.cashBalance === b.cashBalance;
    `);
    expect(findings.some((f: { kind: string }) => f.kind === 'float-equality')).toBe(true);
  });

  it('flags toFixed() producing a monetary value', () => {
    const { findings } = analyse(`
      export const s = (r: { netRevenue: number }) => r.netRevenue.toFixed(2);
    `);
    expect(findings.some((f: { kind: string }) => f.kind === 'toFixed')).toBe(true);
  });

  it('flags Math.round on money', () => {
    const { findings } = analyse(`
      export const r = (x: { taxExpense: number }) => Math.round(x.taxExpense);
    `);
    expect(findings.some((f: { kind: string }) => f.kind === 'math-round')).toBe(true);
  });
});

describe('money AST detector — must NOT flag safe or non-monetary code', () => {
  it('ignores the canonical money primitive', () => {
    const { count } = analyse(`
      import { addMoney, sumMoney, subtractMoney } from '@/utils/money';
      export function f(a: number, b: number, rows: { revenue: number }[]) {
        const x = addMoney(a, b);
        const y = subtractMoney(x, 10);
        return sumMoney(rows.map((r) => r.revenue)).plus(y);
      }
    `);
    expect(count).toBe(0);
  });

  it('ignores decimal.js method chains', () => {
    const { count } = analyse(`
      import Decimal from 'decimal.js';
      export const f = (revenue: number, cogs: number) =>
        new Decimal(revenue).minus(cogs).times(100).div(2);
    `);
    expect(count).toBe(0);
  });

  it('ignores request counters incrementing by one (CircuitBreaker regression)', () => {
    const { count } = analyse(`
      export function tick(state: { totalAllowed: number; totalRejected: number }) {
        state.totalAllowed += 1;
        state.totalRejected += 1;
      }
    `);
    expect(count).toBe(0);
  });

  it('ignores a bare `total` used as a denominator (CircuitBreaker regression)', () => {
    const { count } = analyse(`
      export function failureRate(windowSuccesses: number, windowFailures: number) {
        const total = windowSuccesses + windowFailures;
        return (windowFailures / total) * 100;
      }
    `);
    expect(count).toBe(0);
  });

  it('ignores token-bucket cost arithmetic (RateLimiter regression)', () => {
    const { count } = analyse(`
      export function need(cost: number, bucket: { tokens: number }) {
        return cost - bucket.tokens;
      }
    `);
    expect(count).toBe(0);
  });

  it('ignores rates, percentages and ratios', () => {
    const { count } = analyse(`
      export function f(taxRate: number, growthPct: number, marginRatio: number) {
        return taxRate * 2 + growthPct / 4 - marginRatio;
      }
    `);
    expect(count).toBe(0);
  });

  it('ignores counts, indices and durations', () => {
    const { count } = analyse(`
      export function f(rowCount: number, pageIndex: number, durationMs: number) {
        return rowCount + pageIndex * 10 - durationMs;
      }
    `);
    expect(count).toBe(0);
  });

  it('ignores string building with a money value', () => {
    const { count } = analyse(`
      export const label = (r: { revenue: number }) => 'Revenue: ' + r.revenue;
    `);
    expect(count).toBe(0);
  });

  it('ignores PDF page geometry named `margin` (ExportEngine regression)', () => {
    // `margin` in the export engines is an A4 page margin in millimetres.
    // 37 findings across ProfessionalExportEngine.ts and ExportTemplateEngine.ts
    // were this and nothing else. Those files do no money arithmetic at all:
    // they receive pre-formatted strings and lay them out on a page.
    const { count } = analyse(`
      const margin = 14;
      export function layout(pageW: number, box: { left: number; right: number; top: number }) {
        const contentW = pageW - margin * 2;
        const x = box.left + 11;
        const y = box.top + 6;
        return contentW - box.right + x + y;
      }
    `);
    expect(count).toBe(0);
  });

  it('STILL flags qualified margin names, which are money', () => {
    // The suppression above is deliberately narrow: only the BARE identifier is
    // ambiguous. If this ever returns 0, the exclusion has been widened too far
    // and real profit-margin arithmetic is going unchecked.
    const { findings } = analyse(`
      export function f(grossMargin: number, marginPct: number, ebitdaMargin: number) {
        const a = grossMargin - 1;
        const b = ebitdaMargin + 2;
        return a + b + marginPct;
      }
    `);
    const flagged = findings.map((f: { code: string }) => f.code).join(' | ');
    expect(flagged).toContain('grossMargin');
    expect(flagged).toContain('ebitdaMargin');
  });

  it('modules with no monetary content at all', () => {
    const { count } = analyse(`
      export const add = (a: number, b: number) => a + b;
      export const idx = (xs: string[], i: number) => xs[i + 1];
    `);
    expect(count).toBe(0);
  });

  it('respects a `@money-ast-allow` file-level suppression (SankeyChart regression)', () => {
    // SankeyChart is page-geometry: `(val / totalValue) * VIEW_HEIGHT + GAP`
    // produces a SVG y-offset, not a currency amount. The detector cannot see
    // that VIEW_HEIGHT and GAP are pixel constants. A file-level
    // `@money-ast-allow` marker with a documented reason scopes the
    // suppression to one file and prints the reason to stderr.
    const { count, findings } = analyse(`
      // @money-ast-allow
      // Reason: page-geometry arithmetic — flow-weight × pixel height.
      export const offset = (val: number, totalValue: number, h: number) =>
        (val / totalValue) * h + 10;
    `);
    expect(count).toBe(0);
    expect(findings).toEqual([]);
  });

  it('does NOT silently suppress a file without the marker', () => {
    // The same arithmetic without the marker must still be flagged. The
    // suppression is opt-in, file-scoped, and requires a reason.
    const { count } = analyse(`
      export const offset = (val: number, totalValue: number, h: number) =>
        (val / totalValue) * h + 10;
    `);
    expect(count).toBeGreaterThan(0);
  });
});

describe('money AST detector — type-aware checks (W0.1.6)', () => {
  it('ignores === between string-typed ISO-4217 currency codes (FXPositionGrid regression)', () => {
    // The checker proves both operands are strings: identity comparison of
    // currency codes has no rounding or precision semantics. This retires the
    // whole currency-comparison @money-ast-allow class.
    const { count } = analyse(`
      export const same = (
        fromCurrency: string,
        toCurrency: string,
        r: { fromCurrency: string; toCurrency: string }
      ) => fromCurrency === toCurrency || r.fromCurrency !== r.toCurrency;
    `);
    expect(count).toBe(0);
  });

  it('ignores === between branded CurrencyCode strings', () => {
    const { count } = analyse(`
      type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };
      export const same = (a: CurrencyCode, b: CurrencyCode) => a === b;
    `);
    expect(count).toBe(0);
  });

  it('ignores bigint / PreciseAmount arithmetic — exact integers cannot drift', () => {
    const { count } = analyse(`
      type PreciseAmount = bigint;
      export interface PreciseFinancialValue {
        readonly amount: PreciseAmount;
        readonly scale: number;
      }
      export const net = (a: { amount: bigint }, b: { amount: bigint }) => a.amount - b.amount;
    `);
    expect(count).toBe(0);
  });

  it('flags arithmetic on an innocuously-named variable with a monetary TYPE (shadowed name)', () => {
    // Renaming `invoiceTotal` to `x` used to launder float arithmetic past
    // the gate. The checker reads the declared type name instead.
    const { count } = analyse(`
      type InvoiceAmount = number;
      export function add(x: InvoiceAmount, y: InvoiceAmount) {
        return x + y;
      }
    `);
    expect(count).toBeGreaterThan(0);
  });

  it('does NOT flag innocuously-named plain-number variables with neutral types', () => {
    const { count } = analyse(`
      type Pixel = number;
      export function offset(x: Pixel, w: Pixel) {
        return x + w * 2;
      }
    `);
    expect(count).toBe(0);
  });

  it('still flags string-typed operands ONLY for non-arithmetic misuse — string concat stays safe', () => {
    const { count } = analyse(`
      export const label = (code: string) => 'Currency: ' + code;
    `);
    expect(count).toBe(0);
  });
});
