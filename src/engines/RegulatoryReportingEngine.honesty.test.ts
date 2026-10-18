/**
 * RegulatoryReportingEngine published assurance over absent data.
 *
 * Three static scorers answered a question that had not been asked:
 *  - `computeGDPRScore(0, 0, 0, 0)` returned `{ score: 100, issues: [] }`:
 *    an entity with no processing activities, no DPIAs, no breach records and
 *    no consent records on file was scored as fully GDPR compliant, because
 *    every deduction is guarded by `> 0` / `<` comparisons that zero inputs
 *    never trigger. Absence read as a perfect score.
 *  - `computeESGScore(all-zero metrics)` returned `e: 100` (zero emissions
 *    reported = a perfect environmental pillar) and `composite: 52`.
 *  - `computeSOXControlsCoverage(0, 0, 0)` returned
 *    `{ coverage: 0, effectiveness: 0, materialWeakness: true }`: with no
 *    controls in scope at all, the engine asserted a SOX material weakness —
 *    the same absence that scored 100 for GDPR here produced the strongest
 *    possible adverse finding. `(100, 0, 0)` did the same: nothing tested, so
 *    effectiveness 0, so "material weakness".
 *
 * The engine has no non-test callers (it is one of the orphan engines recorded
 * in `docs/agent/09_KNOWN_GAPS.md`), so nothing in the UI showed these numbers
 * — but a scorer that answers "100" or "material weakness" to an empty input is
 * a false claim waiting for the first caller. Missing is not zero, and absence
 * of testing is not a weakness: both now return `null` with a reason, and the
 * existing scoring of supplied data is unchanged (the three guard tests below
 * were green before this change and stay green).
 *
 * Not decided here: what a *partially* supplied record means (e.g. emissions
 * reported as a genuine 0 while diversity is unknown). Per-pillar availability
 * semantics are a domain decision; this only refuses to score a record in which
 * nothing at all was supplied.
 */
import { describe, it, expect } from 'vitest';
import { RegulatoryReportingEngine, type ESGMetrics } from './RegulatoryReportingEngine';

const EMPTY_ESG: ESGMetrics = {
  scope1Emissions: 0,
  scope2Emissions: 0,
  scope3Emissions: 0,
  waterUsage: 0,
  wasteRecycled: 0,
  diversityPct: 0,
  boardIndependence: 0,
};

const REAL_ESG: ESGMetrics = {
  scope1Emissions: 100,
  scope2Emissions: 200,
  scope3Emissions: 1000,
  waterUsage: 500000,
  wasteRecycled: 100,
  diversityPct: 50,
  boardIndependence: 70,
};

describe('RegulatoryReportingEngine — no score over absent data (NFR-002)', () => {
  it('does not report GDPR compliance when no records were supplied', () => {
    const r = RegulatoryReportingEngine.computeGDPRScore(0, 0, 0, 0);

    expect(r.score).toBeNull();
    expect(r.evaluated).toBe(false);
    expect(r.reason).toMatch(/nothing to assess/);
    expect(r.issues).toEqual([]);
  });

  it('still scores GDPR when records were supplied', () => {
    // 10 activities, 5 DPIAs (-20), 2 breaches (-10), 8/10 consents (-10).
    const r = RegulatoryReportingEngine.computeGDPRScore(10, 5, 2, 8);

    expect(r.score).toBe(60);
    expect(r.issues).toHaveLength(3);
  });

  it('does not report a perfect ESG pillar for an empty metric set', () => {
    const r = RegulatoryReportingEngine.computeESGScore(EMPTY_ESG);

    expect(r.composite).toBeNull();
    expect(r.e).toBeNull();
    expect(r.s).toBeNull();
    expect(r.g).toBeNull();
    expect(r.evaluated).toBe(false);
    expect(r.reason).toMatch(/nothing to assess/);
  });

  it('still scores ESG when metrics were supplied', () => {
    const r = RegulatoryReportingEngine.computeESGScore(REAL_ESG);

    // e = 100 - (100 + 200) / 1000 = 99.7, s = 50 * 0.6 + 40, g = 70,
    // composite = round(99.7 * 0.4 + 70 * 0.3 + 70 * 0.3).
    expect(r.e).toBe(100);
    expect(r.s).toBe(70);
    expect(r.g).toBe(70);
    expect(r.composite).toBe(82);
  });

  it('does not assert a material weakness when there are no controls in scope', () => {
    const r = RegulatoryReportingEngine.computeSOXControlsCoverage(0, 0, 0);

    expect(r.coverage).toBeNull();
    expect(r.effectiveness).toBeNull();
    expect(r.materialWeakness).toBeNull();
    expect(r.evaluated).toBe(false);
    expect(r.reason).toMatch(/no controls in scope/);
  });

  it('reports zero coverage but unknown effectiveness when nothing was tested', () => {
    const r = RegulatoryReportingEngine.computeSOXControlsCoverage(100, 0, 0);

    expect(r.coverage).toBe(0); // real: none of the 100 controls were tested
    expect(r.effectiveness).toBeNull(); // unknown, not 0
    expect(r.materialWeakness).toBeNull(); // untested is not a weakness
    expect(r.reason).toMatch(/none were tested/);
  });

  it('still reports a material weakness when tested controls fail', () => {
    const r = RegulatoryReportingEngine.computeSOXControlsCoverage(100, 100, 70);

    expect(r.coverage).toBe(100);
    expect(r.effectiveness).toBe(70);
    expect(r.materialWeakness).toBe(true);
  });
});
