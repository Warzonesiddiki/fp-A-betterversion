/**
 * Tests for server/src/config/env.ts
 *
 * Run:  npx tsx server/src/config/env.test.ts
 *
 * Covers:
 *   1. Hardcoded fallback removed from source files
 *   2. env.ts uses process.env.JWT_SECRET
 *   3. env.ts has production fail-fast logic
 *   4. env.ts has dev auto-generation logic
 *   5. .env.example exists and has JWT_SECRET placeholder
 */

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const serverRoot = resolve(__dirname, '..', '..');
const projectRoot = resolve(serverRoot, '..');

const FORBIDDEN_SECRET = 'finplan-dev-secret-change-in-production';

// ---------------------------------------------------------------------------
// Test 1: Hardcoded fallback removed from middleware/auth.ts
// ---------------------------------------------------------------------------
{
  const content = readFileSync(join(serverRoot, 'src', 'middleware', 'auth.ts'), 'utf-8');
  assert.ok(
    !content.includes(FORBIDDEN_SECRET),
    'Test 1 FAILED: middleware/auth.ts still contains the hardcoded fallback'
  );
  assert.ok(
    content.includes("from '../config/env.js'"),
    'Test 1 FAILED: middleware/auth.ts does not import from config/env.js'
  );
  console.log('PASS: Test 1 — hardcoded fallback removed from middleware/auth.ts');
}

// ---------------------------------------------------------------------------
// Test 2: Hardcoded fallback removed from routes/auth.ts
// ---------------------------------------------------------------------------
{
  const content = readFileSync(join(serverRoot, 'src', 'routes', 'auth.ts'), 'utf-8');
  assert.ok(
    !content.includes(FORBIDDEN_SECRET),
    'Test 2 FAILED: routes/auth.ts still contains the hardcoded fallback'
  );
  assert.ok(
    content.includes("from '../config/env.js'"),
    'Test 2 FAILED: routes/auth.ts does not import from config/env.js'
  );
  console.log('PASS: Test 2 — hardcoded fallback removed from routes/auth.ts');
}

// ---------------------------------------------------------------------------
// Test 3: env.ts validates JWT_SECRET and has production fail-fast
// ---------------------------------------------------------------------------
{
  const content = readFileSync(join(serverRoot, 'src', 'config', 'env.ts'), 'utf-8');
  assert.ok(
    content.includes('process.env.JWT_SECRET'),
    'Test 3 FAILED: env.ts does not read process.env.JWT_SECRET'
  );
  assert.ok(
    content.includes('process.exit(1)') || content.includes('process.exit('),
    'Test 3 FAILED: env.ts does not call process.exit for missing secret'
  );
  assert.ok(
    !content.includes(FORBIDDEN_SECRET),
    'Test 3 FAILED: env.ts still contains the hardcoded fallback'
  );
  console.log('PASS: Test 3 — env.ts has production fail-fast for JWT_SECRET');
}

// ---------------------------------------------------------------------------
// Test 4: env.ts has development auto-generation logic
// ---------------------------------------------------------------------------
{
  const content = readFileSync(join(serverRoot, 'src', 'config', 'env.ts'), 'utf-8');
  assert.ok(
    content.includes('crypto.randomBytes') || content.includes('randomUUID'),
    'Test 4 FAILED: env.ts does not auto-generate a secret for development'
  );
  assert.ok(
    content.includes('development') || content.includes('!IS_PRODUCTION'),
    'Test 4 FAILED: env.ts does not check for development mode'
  );
  console.log('PASS: Test 4 — env.ts auto-generates secret in development');
}

// ---------------------------------------------------------------------------
// Test 5: .env.example exists and has JWT_SECRET placeholder
// ---------------------------------------------------------------------------
{
  const envExample = join(serverRoot, '.env.example');
  assert.ok(existsSync(envExample), 'Test 5 FAILED: server/.env.example does not exist');
  const content = readFileSync(envExample, 'utf-8');
  assert.ok(
    content.includes('JWT_SECRET'),
    'Test 5 FAILED: .env.example does not mention JWT_SECRET'
  );
  assert.ok(
    !content.match(/JWT_SECRET=.+\S/),
    'Test 5 FAILED: .env.example should have an empty JWT_SECRET value (not a real secret)'
  );
  console.log('PASS: Test 5 — .env.example exists with JWT_SECRET placeholder');
}

// ---------------------------------------------------------------------------
// Test 6: No other files in server/src reference the hardcoded fallback
// ---------------------------------------------------------------------------
{
  const { readdirSync, statSync } = await import('node:fs');
  function walk(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...walk(full));
      } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.js'))) {
        files.push(full);
      }
    }
    return files;
  }

  const sourceFiles = walk(join(serverRoot, 'src'));
  const offenders: string[] = [];
  for (const file of sourceFiles) {
    // Skip this test file — it references the forbidden string for validation.
    if (file.endsWith('env.test.ts')) continue;
    const content = readFileSync(file, 'utf-8');
    if (content.includes(FORBIDDEN_SECRET)) {
      offenders.push(file);
    }
  }
  assert.equal(offenders.length, 0, `Test 6 FAILED: these files still contain the hardcoded fallback: ${offenders.join(', ')}`);
  console.log('PASS: Test 6 — no server source files contain the hardcoded fallback');
}

console.log('\nAll 6 env tests passed.');
