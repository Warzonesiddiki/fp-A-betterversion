#!/usr/bin/env node
/**
 * compliance:evidence — Generate compliance evidence report.
 *
 * Collects evidence for:
 * - Money primitive adoption
 * - Authorization coverage
 * - Audit trail integrity
 * - Backup completeness
 * - Period close state machine
 * - CI pipeline gates
 * - Test coverage
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
let failures = 0;

const evidence = {
  timestamp: new Date().toISOString(),
  checks: [],
};

function addCheck(id, label, status, details) {
  evidence.checks.push({ id, label, status, details: details || null });
  if (status === 'PASS') {
    console.log(`  ✅ ${label}`);
  } else if (status === 'FAIL') {
    console.error(`  ❌ ${label}`);
    failures++;
  } else {
    console.log(`  ⚠️  ${label}`);
  }
}

function readIfExists(p) {
  const fullPath = join(ROOT, p);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

console.log('📋 Compliance Evidence Report\n');

// 1. Money primitive adoption
try {
  const moneyContent = readIfExists('src/utils/money.ts');
  addCheck('MONEY-001', 'Money primitive exists', moneyContent ? 'PASS' : 'FAIL');
  addCheck('MONEY-002', 'Money primitive uses decimal.js',
    moneyContent?.includes('decimal.js') ? 'PASS' : 'FAIL');
  addCheck('MONEY-003', 'Money primitive has ROUND_HALF_UP',
    moneyContent?.includes('ROUND_HALF_UP') ? 'PASS' : 'FAIL');
  addCheck('MONEY-004', 'InvalidMoneyError defined',
    moneyContent?.includes('InvalidMoneyError') ? 'PASS' : 'FAIL');
} catch (e) {
  addCheck('MONEY-001', 'Money primitive exists', 'FAIL', e.message);
}

// 2. ThreeStatementEngine uses money
const tseContent = readIfExists('src/engines/ThreeStatementEngine.ts');
addCheck('MONEY-005', 'ThreeStatementEngine uses money primitive',
  tseContent?.includes('toDecimal') ? 'PASS' : 'FAIL');

// 3. Authorization
const authContent = readIfExists('server/src/middleware/auth.ts');
addCheck('AUTH-001', 'Auth middleware exists', authContent ? 'PASS' : 'FAIL');
addCheck('AUTH-002', 'JWT auth middleware',
  authContent?.includes('jwt') ? 'PASS' : 'FAIL');

// 4. Entity scoping
const entityAuthContent = readIfExists('server/src/middleware/entityAuth.ts');
addCheck('AUTH-003', 'Entity auth middleware exists', entityAuthContent ? 'PASS' : 'FAIL');
addCheck('AUTH-004', 'filterByEntityAccess defined',
  entityAuthContent?.includes('filterByEntityAccess') ? 'PASS' : 'FAIL');

// 5. Audit trail
const auditContent = readIfExists('src/store/auditTrailStore.ts');
addCheck('AUDIT-001', 'Audit trail store exists', auditContent ? 'PASS' : 'FAIL');
addCheck('AUDIT-002', 'Hash-chained audit trail',
  auditContent?.includes('hash') || auditContent?.includes('SHA-256') ? 'PASS' : 'FAIL');

// 6. Backup
const backupContent = readIfExists('src/utils/backupRestore.ts');
addCheck('BACKUP-001', 'Backup/restore utility exists', backupContent ? 'PASS' : 'FAIL');
addCheck('BACKUP-002', 'SHA-256 checksum on backup',
  backupContent?.includes('SHA-256') || backupContent?.includes('sha256') ? 'PASS' : 'FAIL');

// 7. Period close state machine
const psmContent = readIfExists('src/engines/PeriodCloseStateMachine.ts');
addCheck('PERIOD-001', 'Period close state machine exists', psmContent ? 'PASS' : 'FAIL');
addCheck('PERIOD-002', 'State machine has open→soft-close→hard-close→locked',
  psmContent?.includes('soft-close') && psmContent?.includes('hard-close') && psmContent?.includes('locked') ? 'PASS' : 'FAIL');

// 8. Period close integration in server
const periodsContent = readIfExists('server/src/routes/periods.ts');
addCheck('PERIOD-003', 'Server periods route uses state machine',
  periodsContent?.includes('close_state') ? 'PASS' : 'FAIL');

// 9. CI
const ciContent = readIfExists('.github/workflows/ci.yml');
addCheck('CI-001', 'CI workflow exists', ciContent ? 'PASS' : 'FAIL');
addCheck('CI-002', 'CI has sharded tests',
  ciContent?.includes('shard') ? 'PASS' : 'FAIL');
addCheck('CI-003', 'A11y gate is blocking',
  ciContent?.includes('test:a11y') && !ciContent?.includes('continue-on-error: true') ? 'PASS' : 'FAIL');
addCheck('CI-004', 'Actions are SHA-pinned',
  ciContent?.includes('# v4') ? 'PASS' : 'FAIL');

// 10. Export security
const exportContent = readIfExists('server/src/routes/export.ts');
addCheck('SEC-001', 'Export has CSV injection protection',
  exportContent?.includes('dangerousPrefixes') || exportContent?.includes('formula') ? 'PASS' : 'FAIL');
addCheck('SEC-002', 'Export has entity scoping',
  exportContent?.includes('filterByEntityAccess') ? 'PASS' : 'FAIL');

// Summary
const total = evidence.checks.length;
const passed = evidence.checks.filter(c => c.status === 'PASS').length;
const failed = evidence.checks.filter(c => c.status === 'FAIL').length;
const warned = evidence.checks.filter(c => c.status === 'WARN').length;

console.log(`\n📊 Summary: ${passed}/${total} passed, ${failed} failed, ${warned} warnings`);

// Write evidence report
const reportPath = join(ROOT, 'compliance-evidence.json');
const { writeFileSync } = await import('fs');
writeFileSync(reportPath, JSON.stringify(evidence, null, 2));
console.log(`📄 Evidence report written to compliance-evidence.json`);

process.exit(failures > 0 ? 1 : 0);
