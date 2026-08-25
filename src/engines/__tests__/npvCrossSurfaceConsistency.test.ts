/**
 * npvCrossSurfaceConsistency.test.ts — NPV/MIRR cross-surface consistency gate.
 *
 * Original defect: NPV was implemented with divergent discount conventions per
 * surface (t0-included `^i` in financial.ts / CapExEngine vs Excel
 * end-of-period `^(i+1)` already used by SafeMathParser and FormulaEngine), so
 * identical inputs produced different values depending on which surface a
 * caller hit. Canonical decision ledger #51 (2026-08-25): EXCEL-compatible
 * conventions everywhere — all four surfaces must agree on identical inputs.
 */
import { describe, expect, it } from 'vitest';
import { MIRR, NPV as financialNpv } from '../formula-functions/financial';
import { CapExEngine } from '../CapExEngine';
import { FormulaEngine } from '../FormulaEngine';
import { FormulaFunctionRegistry } from '../FormulaFunctionRegistry';
import { safeMathParser } from '../SafeMathParser';

interface NpvFixture {
  label: string;
  rate: number;
  flows: number[];
  /** Hand-computed Excel end-of-period NPV: Σ cf_i / (1+rate)^(i+1). */
  expected: number;
}

const NPV_FIXTURES: NpvFixture[] = [
  {
    label: 'textbook project',
    rate: 0.1,
    flows: [-1000, 500, 400, 300],
    expected: 9.5621883751109,
  },
  { label: 'single flow at t1', rate: 0.05, flows: [0, 1050], expected: 952.380952381 },
  {
    label: 'five-period project',
    rate: 0.12,
    flows: [-5000, 1500, 2000, 2500, 1800],
    expected: 765.229133973195,
  },
];

function safeParserNpv(rate: number, flows: number[]): number {
  return safeMathParser.evaluate(`NPV(${rate}, ${flows.join(', ')})`);
}

/** FormulaEngine has no negative literals; feed flows through cell refs. */
function formulaEngineNpv(rate: number, flows: number[]): number {
  const formula = `NPV(${rate}, A1:A${flows.length})`;
  const { nodes, valid } = FormulaEngine.parseFormula(formula);
  if (!valid || nodes.length === 0) throw new Error(`parse failed: ${formula}`);
  const values = new Map<string, number>();
  flows.forEach((cf, i) => values.set(`A${i + 1}`, cf));
  return FormulaEngine.evaluate(nodes, (ref) => values.get(ref) ?? 0).value;
}

describe('NPV cross-surface consistency (ledger #51 — EXCEL conventions)', () => {
  it.each(NPV_FIXTURES)('$label: all four surfaces agree with the Excel oracle', (fx) => {
    const financial = financialNpv(fx.rate, fx.flows);
    const capex = CapExEngine.calculateNPV(fx.flows, fx.rate);
    const parser = safeParserNpv(fx.rate, fx.flows);
    const engine = formulaEngineNpv(fx.rate, fx.flows);

    // Unrounded surfaces must match the hand-computed oracle tightly.
    expect(capex).toBeCloseTo(fx.expected, 6);
    expect(parser).toBeCloseTo(fx.expected, 6);
    expect(engine).toBeCloseTo(fx.expected, 6);
    // financial.ts rounds to cents before returning.
    expect(financial).toBeCloseTo(fx.expected, 2);

    // The consistency statement itself: identical inputs, identical cents
    // across every surface.
    const cents = [financial, capex, parser, engine].map((v) => Math.round(v * 100));
    expect(new Set(cents).size).toBe(1);
  });

  it('financial.ts no longer discounts t0-included (the divergent old value is absent)', () => {
    // Old t0-included math gave NPV(0.1,[-1000,500,400,300]) ≈ 10.52; the
    // Excel convention gives ≈ 9.56219 (rounds to 9.56 at cents). Pin both
    // directions so a regression re-diverges loudly instead of silently.
    expect(financialNpv(0.1, [-1000, 500, 400, 300])).toBeCloseTo(9.56, 2);
    expect(financialNpv(0.1, [-1000, 500, 400, 300])).not.toBeCloseTo(10.52, 1);
  });

  it('MIRR agrees between financial.ts, SafeMathParser and the registry chain', () => {
    const canonical = MIRR([-1000, 300, 400, 400, 300], 0.1, 0.12);
    expect(canonical).toBeCloseTo(0.13697, 4);
    expect(safeMathParser.evaluate('MIRR(-1000, 300, 400, 400, 300, 0.1, 0.12)')).toBeCloseTo(
      canonical,
      6
    );
    expect(FormulaFunctionRegistry.MIRR([-1000, 300, 400, 400, 300], 0.1, 0.12)).toBe(canonical);
    expect(FormulaFunctionRegistry.has('MIRR')).toBe(true);
  });
});
