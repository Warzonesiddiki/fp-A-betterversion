#!/usr/bin/env node
/**
 * Structural and pinned-claim gate for the owner checklist coverage annex.
 *
 * The checker verifies every mapped row's five-column shape, unique contiguous
 * numbering, and status vocabulary. It also checks two machine-backed claims:
 * the RBAC AST inventory in row 26 against its committed snapshot, and the
 * store/persisted-store counts in row 45 against source files. The owner
 * original annex retains its 110-section header; the supplemental scope
 * contract (DEC-034/037) records the current expected scope and source-owed
 * range. Both gaps are enforced, never silently truncated at the old header.
 * Other free-text claims remain subject to the plan's evidence/owner-DEC gates;
 * this script does not certify the prose semantically.
 *
 * Usage: node scripts/check-coverage-annex.mjs [--file path] [--scope-file path]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_FILE = join(ROOT, 'docs/MASTER_CHECKLIST_COVERAGE.md');
const DEFAULT_SCOPE_FILE = join(ROOT, 'docs/discovery/OWNER_SCOPE_REGISTER_111_200.md');
const RBAC_SNAPSHOT = join(ROOT, 'src/store/__snapshots__/rbacMatrixCompleteness.test.ts.snap');
const STORE_DIR = join(ROOT, 'src/store');
const STATUS_PREFIX =
  /^(?:WORKS|PARTIAL|UNWIRED|MISSING|DECIDE|EVIDENCE-OWED|UNASSESSED)(?:\b|\s|\/|—)/;

function getCliFile(argv, flag, fallback) {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? resolve(argv[index + 1]) : fallback;
}

function parseRows(markdown) {
  const rows = [];
  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    const number = Number(cells[0]);
    rows.push({ number, cells, line: index + 1 });
  }
  return rows;
}

function formatRange(values) {
  if (values.length === 0) return '';
  if (values.length === 1) return String(values[0]);
  const contiguous = values.every((value, index) => index === 0 || value === values[index - 1] + 1);
  return contiguous ? `${values[0]}–${values.at(-1)}` : values.join(', ');
}

function getRbacCounts() {
  const snapshot = readFileSync(RBAC_SNAPSHOT, 'utf8');
  const actions = [...snapshot.matchAll(/^\s+"[^"\n]+ — (GUARDED|EXCEPTION:[^"\n]+)"[,]?$/gm)];
  if (actions.length === 0) throw new Error('RBAC snapshot contains no pinned action inventory');
  const guarded = actions.filter((match) => match[1] === 'GUARDED').length;
  const exceptions = actions.length - guarded;
  return { total: actions.length, guarded, exceptions };
}

function getStoreCounts() {
  const files = readdirSync(STORE_DIR).filter(
    (name) => name.endsWith('.ts') && !/\.test\.|\.bench\./.test(name)
  );
  const persistKeys = new Set();
  for (const name of files) {
    const source = readFileSync(join(STORE_DIR, name), 'utf8');
    for (const match of source.matchAll(/name:\s*['"]([a-z0-9-]+-store)['"]/g)) {
      persistKeys.add(match[1]);
    }
  }
  return { stores: files.length, persisted: persistKeys.size };
}

function parseScopeContract(markdown) {
  const match = markdown.match(/<!-- coverage-scope: (.+) -->/);
  if (!match) return null;
  try {
    const contract = JSON.parse(match[1]);
    const { expectedSections, sourceOwed, decision } = contract;
    if (
      !Number.isSafeInteger(expectedSections) ||
      expectedSections < 1 ||
      !Array.isArray(sourceOwed) ||
      !sourceOwed.every(
        (number) => Number.isSafeInteger(number) && number > 0 && number <= expectedSections
      ) ||
      new Set(sourceOwed).size !== sourceOwed.length ||
      typeof decision !== 'string' ||
      !/^DEC-\d+$/.test(decision)
    )
      return null;
    return { expectedSections, sourceOwed, decision };
  } catch {
    return null;
  }
}

export function checkCoverageAnnex(markdown, scopeMarkdown) {
  const failures = [];
  const warnings = [];
  const declared = markdown.match(
    /^# Master Checklist Coverage — owner checklist \((\d+) sections\)/m
  );
  if (!declared) {
    return { failures: ['missing declared owner checklist section count'], warnings, rowCount: 0 };
  }
  const ownerSections = Number(declared[1]);
  const scope = parseScopeContract(scopeMarkdown);
  if (!scope) {
    return {
      failures: ['missing or invalid coverage-scope contract in owner scope register'],
      warnings,
      rowCount: 0,
    };
  }
  if (scope.expectedSections < ownerSections) {
    failures.push('supplemental owner scope cannot truncate the declared annex scope');
  }
  if (scope.expectedSections > ownerSections) {
    warnings.push(
      `legacy annex declares ${ownerSections} sections; ${scope.decision} scope contract expects ` +
        `${scope.expectedSections}; preserve the header until source/version reconciliation`
    );
  }
  const sourceOwed = new Set(scope.sourceOwed);
  const rows = parseRows(markdown);
  if (rows.length === 0) {
    return { failures: ['no numbered coverage rows found'], warnings, rowCount: 0 };
  }

  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.number))
      failures.push(`duplicate coverage row ${row.number} (line ${row.line})`);
    seen.add(row.number);
    if (row.cells.length !== 5) {
      failures.push(`row ${row.number} must have exactly 5 columns; found ${row.cells.length}`);
      continue;
    }
    if (row.cells.slice(1).some((cell) => cell.length === 0)) {
      failures.push(
        `row ${row.number} contains an empty title, evidence, disposition, or completion-gate cell`
      );
    }
    if (sourceOwed.has(row.number) && row.cells[2] !== 'UNASSESSED — SOURCE OWED') {
      failures.push(
        `row ${row.number} is source-owed; only UNASSESSED — SOURCE OWED is allowed until ` +
          'the source register is reviewed and its contract deliberately updated by decision'
      );
    }
    if (row.cells[2].startsWith('UNASSESSED') && row.cells[2] !== 'UNASSESSED — SOURCE OWED') {
      failures.push(`row ${row.number} must use the explicit UNASSESSED — SOURCE OWED status`);
    }
    if (!STATUS_PREFIX.test(row.cells[2])) {
      failures.push(
        `row ${row.number} has an unrecognized evidence status prefix: ${row.cells[2].slice(0, 32)}`
      );
    }
  }

  const numbers = rows.map((row) => row.number);
  const expectedMapped = Array.from({ length: Math.max(...numbers) }, (_, index) => index + 1);
  const internalMissing = expectedMapped.filter((number) => !seen.has(number));
  if (numbers[0] !== 1) failures.push(`coverage rows must start at 1; found ${numbers[0]}`);
  if (internalMissing.length > 0) {
    failures.push(`coverage row sequence has an internal gap: ${formatRange(internalMissing)}`);
  }
  if (Math.max(...numbers) > scope.expectedSections) {
    failures.push(
      `coverage row ${Math.max(...numbers)} exceeds expected owner scope ${scope.expectedSections}`
    );
  }

  const missingOwnerRows = Array.from({ length: ownerSections }, (_, index) => index + 1).filter(
    (number) => !seen.has(number)
  );
  if (missingOwnerRows.length > 0) {
    const gap = formatRange(missingOwnerRows);
    const disclosure = `Rows ${gap} remain unresolved`;
    if (
      !markdown.includes(disclosure) ||
      !/missing is not zero|missing is not .*complete/i.test(markdown)
    ) {
      failures.push(
        `owner scope rows ${gap} are missing without an explicit not-zero/not-complete disclosure`
      );
    } else {
      warnings.push(
        `${missingOwnerRows.length} owner sections ${gap} remain unresolved; missing is not zero or complete`
      );
    }
  } else if (/Rows\s+\d+[–-]\d+\s+remain unresolved/.test(markdown)) {
    failures.push(
      'stale unresolved-owner-row disclosure remains after all declared rows are mapped'
    );
  }

  const reviewedMissing = [];
  for (let number = 1; number <= scope.expectedSections; number += 1) {
    if (!seen.has(number) && !sourceOwed.has(number)) reviewedMissing.push(number);
  }
  if (reviewedMissing.length > 0) {
    failures.push(`reviewed owner sections ${formatRange(reviewedMissing)} require coverage rows`);
  }
  const unassessed = new Set(scope.sourceOwed);
  for (let number = 1; number <= scope.expectedSections; number += 1) {
    if (!seen.has(number)) unassessed.add(number);
  }
  for (const row of rows) {
    if (row.cells[2] === 'UNASSESSED — SOURCE OWED') unassessed.add(row.number);
  }
  if (unassessed.size > 0) {
    warnings.push(
      `${unassessed.size} sections UNASSESSED — SOURCE OWED ` +
        `(${formatRange([...unassessed].sort((a, b) => a - b))}); missing is not zero or complete`
    );
  }

  const byNumber = new Map(rows.map((row) => [row.number, row]));
  const rbacRow = byNumber.get(26);
  if (!rbacRow || rbacRow.cells.length !== 5) {
    failures.push('row 26 is missing or structurally invalid; cannot verify pinned RBAC census');
  } else {
    const expected = getRbacCounts();
    const claim = rbacRow.cells[2];
    const hasClaims =
      claim.includes(`${expected.total} Zustand store actions`) &&
      claim.includes(`${expected.guarded} guarded`) &&
      claim.includes(`${expected.exceptions} explicit reasoned exceptions`);
    if (!hasClaims) {
      const claimedTotal = claim.match(/pins (\d+) Zustand store actions/)?.[1] ?? 'missing';
      const claimedGuarded = claim.match(/\((\d+) guarded/)?.[1] ?? 'missing';
      const claimedExceptions =
        claim.match(/, (\d+) explicit reasoned exceptions/)?.[1] ?? 'missing';
      failures.push(
        `row 26 pinned RBAC count mismatch: claimed ${claimedTotal} actions ` +
          `(${claimedGuarded} guarded / ${claimedExceptions} exceptions); expected ` +
          `${expected.total} actions (${expected.guarded} guarded / ${expected.exceptions} exceptions)`
      );
    }
  }

  const auditRow = byNumber.get(45);
  if (!auditRow || auditRow.cells.length !== 5) {
    failures.push('row 45 is missing or structurally invalid; cannot verify pinned store counts');
  } else {
    const expected = getStoreCounts();
    const claim = auditRow.cells[2];
    if (
      !claim.includes(`${expected.stores} Zustand stores`) ||
      !claim.includes(`${expected.persisted} persisted`)
    ) {
      failures.push(
        `row 45 pinned store count mismatch: expected ${expected.stores} Zustand stores, ` +
          `${expected.persisted} persisted`
      );
    }
  }

  return { failures, warnings, rowCount: rows.length, ownerSections: scope.expectedSections };
}

function main() {
  const args = process.argv.slice(2);
  const file = getCliFile(args, '--file', DEFAULT_FILE);
  const scopeFile = getCliFile(args, '--scope-file', DEFAULT_SCOPE_FILE);
  let markdown;
  try {
    markdown = readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`FAIL  cannot read coverage annex ${file}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  let scopeMarkdown;
  try {
    scopeMarkdown = readFileSync(scopeFile, 'utf8');
  } catch (error) {
    console.error(`FAIL  cannot read owner scope register ${scopeFile}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const result = checkCoverageAnnex(markdown, scopeMarkdown);
  for (const warning of result.warnings) console.warn(`WARN  ${warning}`);
  for (const failure of result.failures) console.error(`FAIL  ${failure}`);
  if (result.failures.length > 0) {
    console.error(`\n${result.failures.length} coverage-annex check(s) failed.`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `PASS  ${result.rowCount} mapped rows; all rows have five non-empty columns and known statuses.`
  );
  if (result.warnings.length === 0)
    console.log(`PASS  all ${result.ownerSections} declared owner sections are mapped.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
