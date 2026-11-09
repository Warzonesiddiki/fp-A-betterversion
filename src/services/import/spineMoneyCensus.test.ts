/**
 * DATA→CLOSE spine money census (N8).
 *
 * WHY THIS EXISTS
 * ---------------
 * (Q5 stage 4: `parseGLRows` now emits `Money` and therefore imports the
 * primitive, so it is no longer listed as non-monetary — that is the census
 * tracking the code, not the code being bent to satisfy the census.)
 *
 * `npm run money:adoption` reports 29.99 % (305 of 1,017 scanned modules) and N8
 * asks for 100 % of *supported* modules. Measured on 2026-10-21, the gap is not
 * a safety gap:
 *
 *   - `npm run money:ast` finds 0 unsafe money operations across 988 modules,
 *     including every spine path (the detector is deliberately conservative, so
 *     that is absence-of-evidence, not proof).
 *   - `npm run money:adoption` finds 0 raw value-producing `toFixed(n)` sites.
 *   - Every non-adopting module on the spine does NO money arithmetic: it
 *     tokenises text, parses money strings through `parseFinancialAmount`,
 *     validates worker payloads, persists state, or compares dates.
 *
 * Forcing those files to `import '@/utils/money'` would move the ratio without
 * changing a single behaviour — raising a number by adding unused imports is
 * exactly the denominator-gaming N8 forbids.
 *
 * WHAT THIS TEST ENFORCES INSTEAD
 * -------------------------------
 * The property that actually matters, per spine module:
 *   1. it is on the money primitive, OR
 *   2. it is explicitly classified non-monetary WITH A REASON, and the
 *      classification is checked: a non-monetary module may not contain money
 *      arithmetic, `Math.round`, or a raw `toFixed(n)`.
 *
 * And the set cannot grow silently: any new file in the import directory, or any
 * new entry in the extra list, must be classified or this test fails.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SPINE_DIR = 'src/services/import';

/** Spine modules that live outside the import directory. */
const SPINE_EXTRA = [
  'src/engines/SmartImportMapper.ts',
  'src/engines/ExportEngine.ts',
  'src/store/glStore.ts',
  'src/store/periodCloseStore.ts',
  'src/services/export/financialPackageExport.ts',
  'src/workers/glIngestionRequest.ts',
] as const;

/**
 * Spine modules that deliberately do not import the money primitive, and why.
 * Every reason must describe why the module performs no money arithmetic —
 * "it is in scope" is not a reason.
 */
const NON_MONETARY: Record<string, string> = {
  'src/services/import/glCsvTokenizer.ts':
    'tokenises CSV/XLSX text and hashes chunks; emits strings, performs no arithmetic',
  'src/services/import/universalImportEngine.ts':
    'routes source rows to the existing GL parsers and aligns row-level results; no amount arithmetic',
  'src/services/import/universalImportTemplate.ts':
    'validates source-column mappings and template metadata; no amount arithmetic',
  'src/services/import/glPeriodWriteGuard.ts': 'date/period comparisons only; no amount arithmetic',
  'src/services/import/glStagingRepository.ts':
    'persists and reads staged rows; no amount arithmetic',
  'src/store/periodCloseStore.ts':
    'period state machine and lock transitions; no amount arithmetic',
  'src/workers/glIngestionRequest.ts':
    'validates and forwards worker payloads; checks finiteness/shape, performs no arithmetic',
  'src/engines/ExportEngine.ts':
    'renders already-formatted values into PDF/CSV artefacts; no amount arithmetic',
};

const MONEY_IMPORT = /from\s+['"](?:@\/utils\/money|(?:\.\.?\/)+utils\/money)['"]/;

/** Arithmetic shapes a "non-monetary" module must not contain. */
const MONEY_ARITHMETIC: { label: string; pattern: RegExp }[] = [
  { label: 'raw toFixed(n)', pattern: /\.toFixed\(\s*\d/ },
  { label: 'Math.round', pattern: /Math\.round\(/ },
  {
    label: 'compound assignment on a money-named identifier',
    pattern: /\b(?:amount|debit|credit|balance|netChange|total)\w*\s*(?:\+=|-=|\*=|\/=)/i,
  },
];

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function spineFiles(): string[] {
  const inDir = readdirSync(join(ROOT, SPINE_DIR))
    .filter((f) => f.endsWith('.ts') && !/\.(test|spec|bench|benchmark)\./.test(f))
    .map((f) => `${SPINE_DIR}/${f}`);
  return [...inDir, ...SPINE_EXTRA].sort();
}

describe('DATA→CLOSE spine money census (N8)', () => {
  const files = spineFiles();

  it('every spine module is either on the money primitive or explicitly classified', () => {
    const unclassified = files.filter((f) => !MONEY_IMPORT.test(read(f)) && !(f in NON_MONETARY));
    expect(
      unclassified,
      `Unclassified spine module(s). Either import '@/utils/money' or add a reason to NON_MONETARY:\n${unclassified.join('\n')}`
    ).toEqual([]);
  });

  it('the classification has no stale entries', () => {
    const stale = Object.keys(NON_MONETARY).filter((f) => !existsSync(join(ROOT, f)));
    expect(stale, `NON_MONETARY names file(s) that no longer exist:\n${stale.join('\n')}`).toEqual(
      []
    );
  });

  it('every non-monetary reason is a real justification, not a placeholder', () => {
    for (const [file, reason] of Object.entries(NON_MONETARY)) {
      expect(reason.trim().length, `${file} needs a substantive reason`).toBeGreaterThan(30);
    }
  });

  it('a module classified non-monetary contains no money arithmetic', () => {
    const offenders: string[] = [];
    for (const file of Object.keys(NON_MONETARY)) {
      if (!existsSync(join(ROOT, file))) continue;
      const text = read(file);
      for (const { label, pattern } of MONEY_ARITHMETIC) {
        if (pattern.test(text)) offenders.push(`${file}: ${label}`);
      }
    }
    expect(
      offenders,
      `A module declared non-monetary performs money arithmetic — route it through '@/utils/money' ` +
        `or reclassify it:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('a module classified non-monetary is not quietly importing the primitive', () => {
    // If it starts using the primitive, the reason is wrong and the census is
    // lying about the spine — keep the two views in agreement.
    const mislabelled = Object.keys(NON_MONETARY).filter(
      (f) => existsSync(join(ROOT, f)) && MONEY_IMPORT.test(read(f))
    );
    expect(
      mislabelled,
      `Module(s) listed as non-monetary now import '@/utils/money' — remove the entry:\n${mislabelled.join('\n')}`
    ).toEqual([]);
  });

  it('covers the spine surface this census claims to cover', () => {
    // A guard on the guard: if the import directory empties or the list is
    // truncated, the census would pass vacuously.
    expect(files.length).toBeGreaterThanOrEqual(14);
    expect(files).toContain('src/store/glStore.ts');
    expect(files).toContain('src/engines/SmartImportMapper.ts');
  });
});
