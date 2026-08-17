/**
 * Behavioural contract for the fabrication detector (Blueprint W0.1.7).
 *
 * Pins BOTH directions:
 *
 *   - must-catch   a literal `$12.4M` / `24.3%` in a displayed KPI value,
 *                  and a hardcoded `taxRate: 21` in a page
 *   - must-ignore  template marketing copy, SQL placeholders, Excel refs,
 *                  format patterns, purpose text, computed formatters
 *
 * A detector that nobody trusts gets switched off. Every must-ignore case
 * is a real false-positive class observed in this repository.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const DETECTOR = join(process.cwd(), 'scripts', 'fabrication-detector.mjs');

function analyse(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'fab-'));
  try {
    for (const [rel, source] of Object.entries(files)) {
      const full = join(dir, rel);
      mkdirSync(join(full, '..'), { recursive: true });
      writeFileSync(full, source, 'utf8');
    }
    const out = execFileSync(process.execPath, [DETECTOR, '--json'], {
      cwd: dir,
      encoding: 'utf8',
    });
    return JSON.parse(out) as {
      measured: {
        findings: number;
        filesWithFindings: number;
        exportEngineViolations: string[];
        byKind: Record<string, number>;
      };
      modules: Array<{
        file: string;
        count: number;
        findings: Array<{ kind: string; op: string; line: number }>;
      }>;
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('fabrication detector — must catch displayed invented figures', () => {
  it('flags $12.4M in a KPI value (session 010 board-pack regression)', () => {
    const { measured, modules } = analyse({
      'src/engines/ExportTemplateEngine.ts': `
        export function createBoardPackTemplate() {
          return { kpis: [{ label: 'Total Revenue', value: '$12.4M' }] };
        }
      `,
    });
    expect(measured.findings).toBeGreaterThan(0);
    expect(modules[0].findings.some((f) => f.kind === 'currency-literal')).toBe(true);
    expect(measured.exportEngineViolations).toContain('src/engines/ExportTemplateEngine.ts');
  });

  it('flags 24.3% in a KPI value', () => {
    const { modules } = analyse({
      'src/pages/reports/Pack.tsx': `
        export const kpis = [{ label: 'EBITDA Margin', value: '24.3%' }];
      `,
    });
    expect(modules[0].findings.some((f) => f.kind === 'percent-literal')).toBe(true);
  });

  it('flags a JSX value="$4.2M" on a report tile', () => {
    const { modules } = analyse({
      'src/pages/retail/RetailDashboardPage.tsx': `
        export function Tile() {
          return <KPIValue label="Revenue" value="$4.2M" />;
        }
      `,
    });
    expect(modules[0].findings.some((f) => f.kind === 'currency-literal')).toBe(true);
  });

  it('flags a hardcoded taxRate numeric literal in a page', () => {
    const { modules } = analyse({
      'src/pages/tax/TaxProvisionPage.tsx': `
        const rows = [{ jurisdiction: 'Federal', taxRate: 21, provision: 100 }];
        export const n = rows.length;
      `,
    });
    expect(modules[0].findings.some((f) => f.kind === 'hardcoded-rate')).toBe(true);
  });

  it('flags a fabricated fallback percent in a value expression', () => {
    const { modules } = analyse({
      'src/pages/sectors/LogisticsDashboardPage.tsx': `
        export const tile = { label: 'On time', value: onTime > 0 ? formatPercent(onTime) : '96.4%' };
        declare const onTime: number;
        declare function formatPercent(n: number): string;
      `,
    });
    expect(modules[0].findings.some((f) => f.op.includes('96.4%'))).toBe(true);
  });
});

describe('fabrication detector — must NOT flag non-displayed or computed figures', () => {
  it('ignores template marketing copy that mentions a scenario size', () => {
    const { measured } = analyse({
      'src/templates/ThreeStatementModel.ts': `
        export const description =
          'Pre-populated for a $200M industrial company.';
      `,
    });
    expect(measured.findings).toBe(0);
  });

  it('ignores SQL placeholders', () => {
    const { measured } = analyse({
      'src/engines/CubeEnginePersistence.ts': `
        export const sql = 'SELECT * FROM cube_cells WHERE cube = $1';
      `,
    });
    expect(measured.findings).toBe(0);
  });

  it('ignores Excel absolute refs and format patterns', () => {
    const { measured } = analyse({
      'src/engines/SafeMathParser.ts': `
        export const ref = '$A$1';
        export const fmt = '$#,##0.00';
      `,
    });
    expect(measured.findings).toBe(0);
  });

  it('ignores purpose / placeholder copy', () => {
    const { measured } = analyse({
      'src/pages/treasury/LoanAmortizationPage.tsx': `
        export function Page() {
          return <PageHeader purpose="The loan pays off to $0.00." />;
        }
      `,
    });
    expect(measured.findings).toBe(0);
  });

  it('ignores computed formatters (the honest path)', () => {
    const { measured } = analyse({
      'src/pages/tax/TaxProvisionPage.tsx': `
        export function row(fmt: { currency0: (n: number) => string }, pretax: number) {
          return { label: 'Pre-Tax Income', value: fmt.currency0(pretax) };
        }
      `,
    });
    expect(measured.findings).toBe(0);
  });

  it('ignores a taxRate coming from user input rather than a literal', () => {
    const { measured } = analyse({
      'src/pages/tax/TaxProvisionPage.tsx': `
        export function row(taxRate: number) {
          return { jurisdiction: 'user-supplied', taxRate };
        }
      `,
    });
    expect(measured.findings).toBe(0);
  });
});
