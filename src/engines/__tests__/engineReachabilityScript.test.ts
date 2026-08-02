/**
 * GAP-3 (F-0028) regression lock for the engine-reachability CLASSIFIER.
 *
 * WHY THIS EXISTS
 * ---------------
 * `engineReachability.test.ts` (next to this file) already proves every engine
 * genuinely loads at runtime. Despite that, `scripts/engine-reachability.mjs`
 * kept reporting "105 orphan engines", and that number was carried into the gap
 * ledger as real outstanding work. It was a MEASUREMENT DEFECT, not a product
 * defect: the script only counted DIRECT static imports from
 * src/{pages,store,services,components,hooks} and therefore missed
 *
 *   - lazy reachability through `engineManifest.generated.ts` +
 *     `EngineRegistry`, surfaced to users by the routed `/admin/engines`
 *     Engine Catalog page, and
 *   - transitive reachability (engine imported by a reachable engine).
 *
 * A metric that overstates outstanding work by two orders of magnitude is as
 * dangerous as one that understates it — it hides the real remaining risk in
 * noise. This suite pins the corrected classifier so the false headline cannot
 * silently return, and so a genuinely unreachable engine is still caught.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface ReachabilityReport {
  total: number;
  reachable: number;
  reachable_direct: number;
  reachable_lazy: number;
  reachable_transitive: number;
  orphan_tested: number;
  orphan_untested: number;
  orphan_total: number;
  manifest_consumed_by_app: boolean;
  orphan_tested_list: string[];
  orphan_untested_list: string[];
}

const ROOT = process.cwd();

function runClassifier(): ReachabilityReport {
  const out = execFileSync('node', [join(ROOT, 'scripts', 'engine-reachability.mjs'), '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(out) as ReachabilityReport;
}

describe('GAP-3: engine reachability classifier', () => {
  const report = runClassifier();

  it('classifies every engine module', () => {
    expect(report.total).toBeGreaterThan(150);
    expect(report.reachable + report.orphan_total).toBe(report.total);
  });

  it('reports ZERO unreachable engines', () => {
    // The whole point of GAP-3. If this fails, a real engine lost its product
    // surface — the failure message names it.
    expect({
      tested: report.orphan_tested_list,
      untested: report.orphan_untested_list,
    }).toEqual({ tested: [], untested: [] });
    expect(report.orphan_total).toBe(0);
  });

  it('counts lazy manifest reachability, not just direct imports', () => {
    // Regression guard for the original defect: if this drops to 0 the
    // classifier has reverted to direct-imports-only and will again report
    // ~100 phantom orphans.
    expect(report.manifest_consumed_by_app).toBe(true);
    expect(report.reachable_lazy).toBeGreaterThan(50);
  });

  it('still counts direct static imports', () => {
    expect(report.reachable_direct).toBeGreaterThan(50);
  });

  it('keeps the type-only exclusion list in sync with the manifest generator', () => {
    // The classifier exits non-zero on drift; assert both files agree on the
    // modules that are plumbing rather than loadable engines.
    const classifier = readFileSync(join(ROOT, 'scripts', 'engine-reachability.mjs'), 'utf8');
    const generatorPath = join(ROOT, 'scripts', 'generate-engine-manifest.mjs');
    expect(existsSync(generatorPath)).toBe(true);
    const generator = readFileSync(generatorPath, 'utf8');

    for (const typeOnly of ['ReportBuilderTypes', 'report-builder-types', 'EngineRegistry']) {
      expect(classifier).toContain(`'${typeOnly}'`);
      expect(generator).toContain(`'${typeOnly}'`);
    }
  });

  it('excludes type-only modules from the engine population', () => {
    // A pure-type module has no runtime export to load, so counting it as an
    // unreachable ENGINE is a category error.
    const all = [...report.orphan_tested_list, ...report.orphan_untested_list];
    expect(all).not.toContain('src/engines/ReportBuilderTypes.ts');
    expect(all).not.toContain('src/engines/report-builder-types.ts');
  });

  it('exits 0 when there is no exclusion drift', () => {
    expect(() =>
      execFileSync('node', [join(ROOT, 'scripts', 'engine-reachability.mjs')], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      })
    ).not.toThrow();
  });
});
