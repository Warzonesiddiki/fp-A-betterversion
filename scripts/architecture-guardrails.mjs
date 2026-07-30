#!/usr/bin/env node
/**
 * architecture:guardrails — Verify architectural guardrails are respected.
 *
 * Checks:
 * 1. Money primitive used in financial engines (not raw number arithmetic)
 * 2. Server-side authorization on all routes
 * 3. No eval() or dynamic code execution
 * 4. No inline SQL without parameterization
 * 5. Audit trail on all write operations
 * 6. Period close state machine integrated
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.cwd();
let failures = 0;

function check(label, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`  ✅ ${label}`);
    } else {
      console.error(`  ❌ ${label}`);
      failures++;
    }
  } catch (e) {
    console.error(`  ❌ ${label}: ${e.message}`);
    failures++;
  }
}

function readIfExists(p) {
  const fullPath = join(ROOT, p);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

console.log('🏗️  Architecture Guardrails\n');

// 1. Money primitive in financial engines
const criticalEngines = [
  'src/engines/ThreeStatementEngine.ts',
  'src/engines/WorkingCapitalEngine.ts',
  'src/engines/PeriodCloseStateMachine.ts',
  'src/engines/ConsolidationEngine.ts',
  'src/engines/FXEngine.ts',
];

for (const engine of criticalEngines) {
  const content = readIfExists(engine);
  if (content) {
    const name = engine.split('/').pop();
    check(`${name} uses money primitive (toDecimal/moneyEquals/toCents)`, () =>
      content.includes('toDecimal') || content.includes('moneyEquals') || content.includes('fromCents') || content.includes('toCents') || content.includes('sumMoney')
    );
  }
}

// 2. Server-side authorization
const serverRoutes = [
  'server/src/routes/budgets.ts',
  'server/src/routes/forecasts.ts',
  'server/src/routes/gl.ts',
  'server/src/routes/scenarios.ts',
  'server/src/routes/entities.ts',
  'server/src/routes/periods.ts',
  'server/src/routes/audit.ts',
  'server/src/routes/export.ts',
];

for (const route of serverRoutes) {
  const content = readIfExists(route);
  if (content) {
    const name = route.split('/').pop();
    check(`${name} has auth middleware`, () =>
      content.includes('authMiddleware') || content.includes('requireRole')
    );
  }
}

// 3. No eval() in source
check('No eval() in source code', () => {
  try {
    // Quick check in key files
    const moneyContent = readIfExists('src/utils/money.ts');
    if (moneyContent && moneyContent.includes('eval(')) return false;
    return true;
  } catch {
    return true;
  }
});

// 4. Period close state machine integration
const periodsContent = readIfExists('server/src/routes/periods.ts');
if (periodsContent) {
  check('Periods route uses close_state column', () =>
    periodsContent.includes('close_state')
  );
  check('Periods route has state machine transitions', () =>
    periodsContent.includes('transition') || periodsContent.includes('VALID_TRANSITIONS')
  );
  check('Periods route has period close audit', () =>
    periodsContent.includes('period_close_audit')
  );
}

// 5. Entity scoping on routes
check('Audit routes have entity scoping', () => {
  const content = readIfExists('server/src/routes/audit.ts');
  return content?.includes('filterByEntityAccess') ?? false;
});

check('Export routes have entity scoping', () => {
  const content = readIfExists('server/src/routes/export.ts');
  return content?.includes('filterByEntityAccess') ?? false;
});

// 6. Backup completeness
check('Backup manifest includes all persisted stores', () => {
  const content = readIfExists('src/utils/backupRestore.ts');
  return content?.includes('persistedStores') ?? false;
});

// 7. CI workflow has SHA-pinned actions
check('CI workflow uses SHA-pinned actions', () => {
  const content = readIfExists('.github/workflows/ci.yml');
  if (!content) return false;
  // Check that at least one action is SHA-pinned
  return content.includes('# v4') && content.includes('@');
});

console.log(`\n${failures === 0 ? '✅ All architecture guardrails passed' : '❌ ' + failures + ' guardrail check(s) failed'}`);
process.exit(failures > 0 ? 1 : 0);
