#!/usr/bin/env tsx
/**
 * Security Headers Scan Script
 * Tests the Express server for proper security headers
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_DIR = join(__dirname, '..');

interface SecurityCheck {
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

async function startServer(): Promise<{ process: any; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('tsx', ['src/index.ts'], {
      cwd: SERVER_DIR,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3001',
        CORS_ORIGIN: 'https://finplan.app',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        serverProcess.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 10000);

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(`[server] ${output.trim()}`);
      if (output.includes('FinPlan Pro API running') && !started) {
        started = true;
        clearTimeout(timeout);
        resolve({ process: serverProcess, baseUrl: 'http://localhost:3001' });
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[server error] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      if (!started) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

async function fetchHeaders(baseUrl: string, path: string): Promise<Record<string, string>> {
  const response = await fetch(`${baseUrl}${path}`, { method: 'HEAD' });
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

function checkHeader(
  headers: Record<string, string>,
  name: string,
  expected?: string | RegExp
): SecurityCheck {
  const actual = headers[name.toLowerCase()];
  const passed =
    actual !== undefined &&
    (expected === undefined ||
      (typeof expected === 'string' ? actual.includes(expected) : expected.test(actual)));
  return {
    name,
    passed,
    expected: expected instanceof RegExp ? expected.source : expected,
    actual,
    severity: 'high',
  };
}

function checkCSP(headers: Record<string, string>): SecurityCheck {
  const csp = headers['content-security-policy'] || headers['content-security-policy-report-only'];
  const checks = [
    { directive: 'default-src', pattern: /default-src\s+['"]self['"]/ },
    { directive: 'script-src', pattern: /script-src\s+['"]self['"]/ },
    { directive: 'style-src', pattern: /style-src\s+['"]self['"]/ },
    { directive: 'frame-ancestors', pattern: /frame-ancestors\s+['"]none['"]/ },
    { directive: 'object-src', pattern: /object-src\s+['"]none['"]/ },
    { directive: 'base-uri', pattern: /base-uri\s+['"]self['"]/ },
    { directive: 'form-action', pattern: /form-action\s+['"]self['"]/ },
  ];

  let allPassed = true;
  const failures: string[] = [];

  if (!csp) {
    return {
      name: 'Content-Security-Policy',
      passed: false,
      actual: 'MISSING',
      severity: 'critical',
    };
  }

  for (const check of checks) {
    if (!check.pattern.test(csp)) {
      allPassed = false;
      failures.push(check.directive);
    }
  }

  return {
    name: 'Content-Security-Policy',
    passed: allPassed,
    expected: 'All required CSP directives present',
    actual: csp,
    severity: 'critical',
  };
}

async function runSecurityScan(): Promise<void> {
  console.log('='.repeat(60));
  console.log('FinPlan Pro - Security Headers Scan');
  console.log('='.repeat(60));
  console.log('');

  let server: any = null;
  const results: SecurityCheck[] = [];

  try {
    // Start server
    console.log('[scan] Starting server in production mode...');
    const { process: serverProcess, baseUrl } = await startServer();
    server = serverProcess;

    // Wait a moment for server to be fully ready
    await new Promise((r) => setTimeout(r, 1000));

    // Test endpoints
    const endpoints = ['/api/health', '/api/auth/login', '/api/budgets'];

    for (const endpoint of endpoints) {
      console.log(`\n[scan] Testing ${endpoint}...`);
      const headers = await fetchHeaders(baseUrl, endpoint);

      // Core security headers
      results.push(checkHeader(headers, 'strict-transport-security', 'max-age='));
      results.push(checkHeader(headers, 'x-content-type-options', 'nosniff'));
      results.push(checkHeader(headers, 'x-frame-options', 'DENY'));
      results.push(checkHeader(headers, 'x-xss-protection', '1; mode=block'));
      results.push(checkHeader(headers, 'referrer-policy', 'strict-origin-when-cross-origin'));
      results.push(checkHeader(headers, 'cross-origin-opener-policy', 'same-origin'));
      results.push(checkHeader(headers, 'cross-origin-embedder-policy', 'require-corp'));
      results.push(checkHeader(headers, 'cross-origin-resource-policy', 'same-origin'));
      results.push(checkHeader(headers, 'permissions-policy'));
      results.push(checkCSP(headers));
      results.push(checkHeader(headers, 'x-powered-by', undefined)); // Should NOT have this

      // Rate limit headers (draft-7)
      results.push(checkHeader(headers, 'ratelimit-limit'));
      results.push(checkHeader(headers, 'ratelimit-remaining'));
      results.push(checkHeader(headers, 'ratelimit-reset'));
    }
  } catch (error) {
    console.error('[scan] Error during scan:', error);
  } finally {
    if (server) {
      console.log('\n[scan] Stopping server...');
      server.kill();
    }
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('SECURITY HEADERS SCAN RESULTS');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;
  let criticalFailed = 0;

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const severity = result.severity.toUpperCase();
    console.log(`${status} [${severity}] ${result.name}`);
    if (!result.passed) {
      console.log(`   Expected: ${result.expected ?? 'present'}`);
      console.log(`   Actual:   ${result.actual ?? 'MISSING'}`);
      failed++;
      if (result.severity === 'critical') criticalFailed++;
    } else {
      passed++;
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Summary: ${passed} passed, ${failed} failed (${criticalFailed} critical)`);
  console.log('='.repeat(60));

  if (criticalFailed > 0) {
    console.log('\n❌ CRITICAL FAILURES - Server NOT production ready');
    process.exit(1);
  } else if (failed > 0) {
    console.log('\n⚠️  Some non-critical headers missing');
    process.exit(1);
  } else {
    console.log('\n✅ All security headers present - Server is production ready');
    process.exit(0);
  }
}

runSecurityScan().catch((err) => {
  console.error('[scan] Fatal error:', err);
  process.exit(1);
});
