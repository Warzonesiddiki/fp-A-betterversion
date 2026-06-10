#!/usr/bin/env node
// Coverage threshold check script for CI
// Validates that coverage meets minimum thresholds

import fs from 'fs';
import path from 'path';

const THRESHOLDS = {
  statements: 50,
  branches: 50,
  functions: 50,
  lines: 50,
};

const coverageFile = path.join(process.cwd(), 'coverage', 'json-summary.json');

function main() {
  console.log('## Coverage Report\n');

  if (!fs.existsSync(coverageFile)) {
    console.error('::error::Coverage report not found at coverage/json-summary.json');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  const total = coverage.total;

  console.log('| Metric | Coverage | Threshold | Status |');
  console.log('|--------|----------|-----------|--------|');

  let fail = 0;

  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    const actual = Math.round(total[metric].pct);
    const status = actual >= threshold ? ':white_check_mark: PASS' : ':x: FAIL';
    if (actual < threshold) fail = 1;
    console.log(`| ${metric} | ${actual}% | ${threshold}% | ${status} |`);
  }

  console.log('');

  if (fail) {
    console.log(':x: **Coverage check FAILED** - One or more thresholds not met');
    process.exit(1);
  } else {
    console.log(':white_check_mark: **Coverage check PASSED** - All thresholds met');
    process.exit(0);
  }
}

main();