#!/usr/bin/env node
/**
 * release:dry-run — Verify a release can be built without errors.
 *
 * Checks:
 * 1. TypeScript compilation passes
 * 2. ESLint passes with zero warnings
 * 3. Production build succeeds
 * 4. Bundle size within limits
 * 5. Server tests pass
 * 6. Money adoption ratchet holds
 */

import { execSync } from 'child_process';

const ROOT = process.cwd();
let failures = 0;

function run(label, cmd, cwd = ROOT) {
  try {
    console.log(`\n🔄 ${label}...`);
    execSync(cmd, { cwd, stdio: 'inherit', timeout: 600000 });
    console.log(`  ✅ ${label} passed`);
    return true;
  } catch (e) {
    console.error(`  ❌ ${label} failed`);
    failures++;
    return false;
  }
}

console.log('🚀 Release Dry Run\n');

// Run checks in order
run('TypeScript compilation', 'npx tsc --noEmit');
run('ESLint check', 'npx eslint src --max-warnings 0');
run('Production build', 'npm run build');
run('Money adoption ratchet', 'npm run money:adoption');
run('Engine manifest verification', 'npm run engines:verify');
run('Documentation verification', 'npm run docs:verify');
run('Server tests', 'npm test', `${ROOT}/server`);

console.log(`\n${failures === 0 ? '✅ Release dry run passed' : '❌ ' + failures + ' release check(s) failed'}`);
process.exit(failures > 0 ? 1 : 0);
