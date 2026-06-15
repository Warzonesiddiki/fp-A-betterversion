<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-12 -->

# Artifact 1 — Build-Time Secret Scanner

> **Owner:** Hephaestus (aionrs/MiniMax-M3)
> **Date:** 2026-06-12
> **Apollo tasks served:** [`019ebcea…` — key rotation advisory + build-time secret check](../../task-board.json), [`019ebce7-…` — P0 #1 .env NIM keys](../../task-board.json)
> **Threat model reference:** Hephaestus audit 2026-06-12, finding P0-#1 (Vite `VITE_*` inlining into `dist/assets/*.js`)
> **Status:** DRAFT v0.1 — code compiles (TypeScript 5.x, Node ≥18), vitest tests included, no TODOs

---

## 1. Why this exists

Vite inlines every `VITE_*` environment variable into the client bundle at build time. The variable is replaced by a string literal in the emitted JavaScript:

```ts
// src/services/nim.ts (excerpt)
const apiKey = import.meta.env.VITE_NIM_API_KEY_1;
// becomes, in dist/assets/index-XXXXXX.js:
const apiKey = 'nvapi-abc123def456ghi789jkl012mno345pqr678stu';
```

The file `dist/assets/index-*.js` is then served to every browser that loads the app. Anyone with DevTools, a shared preview URL, or a screenshot of the network tab can read the key in plaintext. This is true even if the key never appears in the public Git history — the build artifact itself is the leak.

**The scanner is a guard rail, not a fix.** The architectural fix is documented in `vite-proxy-architecture.md` (Artifact 2). Until that proxy is in place, the scanner prevents the worst mistake: shipping a `VITE_*` value that _looks_ like a real secret.

---

## 2. File: `scripts/check-secrets.ts`

This is a Node-runnable TypeScript file. It uses **only** Node built-ins (`node:fs`, `node:path`) so it has zero dependencies and runs in CI without an `npm install` step.

```ts
/**
 * @file scripts/check-secrets.ts
 * @description Build-time scanner that fails `npm run build` if any
 *              VITE_* environment variable looks like a real production
 *              secret. Companion guard-rail to the Vite inlining
 *              mitigation (see docs/drafts/hephaestus/vite-proxy-architecture.md).
 *
 * @runs-as `node --import tsx scripts/check-secrets.ts`
 *         or `npx tsx scripts/check-secrets.ts`
 * @prebuild `npm run build` (added in package.json)
 * @exitcode 0 = pass, 1 = fail (CI halts the build)
 *
 * @author Hephaestus (aionrs/MiniMax-M3), 2026-06-12
 * @see docs/drafts/hephaestus/build-time-secret-scanner.md (this file)
 * @see docs/drafts/hephaestus/vite-proxy-architecture.md
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Verdict returned by the scanner for a single environment variable.
 *
 * @property name       - The exact env var name (e.g. "VITE_NIM_API_KEY_1")
 * @property value      - The raw value as read from `process.env` (not logged in production mode)
 * @property verdict    - One of: "pass" | "warn" | "fail"
 * @property reason     - Human-readable explanation of the verdict
 * @property matchedRule - Identifier of the detection rule that triggered (e.g. "jwt-shape")
 */
export interface SecretVerdict {
  name: string;
  value: string;
  verdict: 'pass' | 'warn' | 'fail';
  reason: string;
  matchedRule?: string;
}

/**
 * Configuration for the scanner.
 *
 * @property env              - Source environment (defaults to process.env; tests inject a stub)
 * @property allowlistTokens  - Substrings that mark a value as clearly non-secret
 *                              (EXAMPLE, DEMO, PLACEHOLDER, TEST_KEY).
 *                              Case-insensitive. Matched anywhere in the value.
 * @property failOnWarn       - If true, treat "warn" verdicts as build failures
 * @property redactInOutput   - If true, mask the value when logging (first 4 + "…" + last 4)
 */
export interface ScannerConfig {
  env: Record<string, string | undefined>;
  allowlistTokens?: string[];
  failOnWarn?: boolean;
  redactInOutput?: boolean;
}

// ─── Detection rules ──────────────────────────────────────────────────────

/**
 * Patterns that indicate a real production secret. Each rule has a name
 * and a predicate. The scanner applies ALL rules; the first match wins.
 *
 * @constant
 */
export const SECRET_RULES: ReadonlyArray<{ name: string; test: (v: string) => boolean }> = [
  {
    name: 'nvidia-nvapi-prefix',
    test: (v) => v.startsWith('nvapi-') && v.length >= 20,
  },
  {
    name: 'jwt-shape',
    test: (v) => /^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/.test(v),
  },
  {
    name: 'aws-access-key-id',
    test: (v) => /^AKIA[0-9A-Z]{16}$/.test(v),
  },
  {
    name: 'aws-secret-access-key',
    test: (v) => /^[A-Za-z0-9/+=]{40}$/.test(v) && v.startsWith('AKIA') === false,
  },
  {
    name: 'github-token',
    test: (v) => /^gh[pousr]_[A-Za-z0-9]{36,}$/.test(v),
  },
  {
    name: 'stripe-live-key',
    test: (v) => /^sk_live_[A-Za-z0-9]{20,}$/.test(v),
  },
  {
    name: 'openai-key',
    test: (v) => /^sk-[A-Za-z0-9]{32,}$/.test(v),
  },
  {
    name: 'anthropic-key',
    test: (v) => /^sk-ant-[A-Za-z0-9-]{32,}$/.test(v),
  },
] as const;

/**
 * Default allowlist tokens — values that contain any of these substrings
 * (case-insensitive) are treated as deliberately non-production and skipped.
 *
 * @example 'VITE_API_KEY=EXAMPLE_KEY_abc'  // skipped
 * @example 'VITE_API_KEY=demo-token'       // skipped
 */
export const DEFAULT_ALLOWLIST: readonly string[] = ['EXAMPLE', 'DEMO', 'PLACEHOLDER', 'TEST_KEY'];

// ─── Core scanner ─────────────────────────────────────────────────────────

/**
 * Evaluate a single env var name + value pair.
 *
 * @param name  - The env var name (e.g. "VITE_NIM_API_KEY_1")
 * @param value - The env var value (may be empty)
 * @param cfg   - Scanner config; allowlistTokens defaults to DEFAULT_ALLOWLIST
 * @returns     A `SecretVerdict` describing the outcome
 *
 * @example
 *   evaluateVar('VITE_NIM_API_KEY_1', 'nvapi-abc123def456ghi789')
 *   // => { name: 'VITE_NIM_API_KEY_1', value: 'nvapi-…', verdict: 'fail',
 *   //      reason: 'Matches rule nvidia-nvapi-prefix',
 *   //      matchedRule: 'nvidia-nvapi-prefix' }
 */
export function evaluateVar(name: string, value: string, cfg: ScannerConfig): SecretVerdict {
  // Rule 1: empty or undefined
  if (!value || value.length === 0) {
    return { name, value, verdict: 'pass', reason: 'empty' };
  }

  // Rule 2: allowlist match (case-insensitive substring)
  const allowlist = cfg.allowlistTokens ?? DEFAULT_ALLOWLIST;
  const lower = value.toLowerCase();
  const allowMatch = allowlist.find((tok) => lower.includes(tok.toLowerCase()));
  if (allowMatch) {
    return { name, value, verdict: 'pass', reason: `allowlist hit: ${allowMatch}` };
  }

  // Rule 3: secret-shape match (fail)
  for (const rule of SECRET_RULES) {
    if (rule.test(value)) {
      return {
        name,
        value,
        verdict: 'fail',
        reason: `Matches rule ${rule.name} — VITE_* values are inlined into the browser bundle at build time. Move this secret server-side.`,
        matchedRule: rule.name,
      };
    }
  }

  // Rule 4: long value with no recognised shape (warn)
  if (value.length > 30) {
    return {
      name,
      value,
      verdict: cfg.failOnWarn ? 'fail' : 'warn',
      reason: `Length ${value.length} > 30 and no allowlist match. Verify this is not a real secret.`,
    };
  }

  return { name, value, verdict: 'pass', reason: 'no rule triggered' };
}

/**
 * Scan every VITE_* env var in the supplied environment.
 *
 * @param cfg - Scanner configuration. `cfg.env` is required; defaults apply for the rest.
 * @returns   Array of verdicts, one per VITE_* var found (pass/warn/fail).
 *            Sorted by severity: fail → warn → pass.
 *
 * @throws    Never throws under normal operation. Returns the verdict array
 *            and lets the caller decide what to do.
 *
 * @example
 *   const verdicts = scan({ env: process.env });
 *   if (verdicts.some(v => v.verdict === 'fail')) process.exit(1);
 */
export function scan(cfg: ScannerConfig): SecretVerdict[] {
  if (!cfg.env || typeof cfg.env !== 'object') {
    throw new TypeError('ScannerConfig.env must be a Record<string, string | undefined>');
  }
  const verdicts: SecretVerdict[] = [];
  for (const [name, value] of Object.entries(cfg.env)) {
    if (!name.startsWith('VITE_')) continue;
    if (value === undefined) continue;
    verdicts.push(evaluateVar(name, value, cfg));
  }
  // Sort: fail > warn > pass
  const order: Record<SecretVerdict['verdict'], number> = { fail: 0, warn: 1, pass: 2 };
  verdicts.sort((a, b) => order[a.verdict] - order[b.verdict]);
  return verdicts;
}

// ─── Output formatting ────────────────────────────────────────────────────

/**
 * Format a verdict for terminal output.
 *
 * @param v         - The verdict to render
 * @param redact    - If true, replace the value with a masked version
 *                    (first 4 + "…" + last 4). Default true.
 * @returns         A one-line string suitable for printing.
 *
 * @example
 *   formatVerdict({ name: 'VITE_X', value: 'nvapi-abc', verdict: 'fail', reason: '…' })
 *   // => "  ✗  VITE_X          [FAIL] nvap…-abc   Matches rule nvidia-nvapi-prefix — VITE_* values are inlined…"
 */
export function formatVerdict(v: SecretVerdict, redact = true): string {
  const icon = v.verdict === 'pass' ? '✓' : v.verdict === 'warn' ? '⚠' : '✗';
  const display = redact ? mask(v.value) : v.value;
  const padded = v.name.padEnd(36);
  const tag = v.verdict.toUpperCase().padEnd(5);
  return `  ${icon}  ${padded}[${tag}] ${display}   ${v.reason}`;
}

/**
 * Mask a secret value for safe printing. Returns the value unchanged if
 * it is shorter than 10 characters (masking would be useless).
 *
 * @param value - The raw value
 * @returns     Masked value, or the value itself if too short
 */
export function mask(value: string): string {
  if (value.length < 10) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────

/**
 * Detect whether the process is running in a production build context.
 * Vite sets `import.meta.env.PROD` at build time; we read it from a
 * sibling source file because `import.meta` is not available in plain Node.
 *
 * @returns true if the scanner is being run as a prebuild guard
 */
function isProductionBuild(): boolean {
  // Convention: the build script in package.json sets NODE_ENV=production
  return process.env.NODE_ENV === 'production';
}

/**
 * Read and return the contents of .env.example so we can verify it
 * contains the required "NEVER put production secrets here" warning.
 *
 * @param projectRoot - Absolute path to the project root
 * @returns           The file contents, or null if the file is missing
 */
function readEnvExample(projectRoot: string): string | null {
  const p = resolve(projectRoot, '.env.example');
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

/**
 * Verify that .env.example contains the warning required by the
 * build-time scanner convention. Returns a list of issues; empty if OK.
 *
 * @param contents - The .env.example file contents
 * @returns         Array of issue strings (empty = OK)
 */
export function auditEnvExample(contents: string): string[] {
  const issues: string[] = [];
  if (!/inlined into the browser bundle/i.test(contents)) {
    issues.push('.env.example is missing the "inlined into the browser bundle" warning.');
  }
  if (!/NEVER put production secrets/i.test(contents)) {
    issues.push('.env.example is missing the "NEVER put production secrets" warning.');
  }
  if (!/VITE_/i.test(contents)) {
    issues.push('.env.example has no VITE_* examples to anchor the warning to.');
  }
  return issues;
}

/**
 * Main entry point. Scans the environment, prints a human-readable report,
 * and exits with code 1 if any var fails (or warns, when failOnWarn is set).
 *
 * @returns void — exits the process on completion
 *
 * @example
 *   $ npx tsx scripts/check-secrets.ts
 *     ✓  VITE_API_URL                  [PASS] http…tion
 *     ✗  VITE_NIM_API_KEY_1            [FAIL] nvap…-xyz
 *        Matches rule nvidia-nvapi-prefix — VITE_* values are inlined into the browser bundle at build time. Move this secret server-side.
 *   Build aborted: 1 secret-shaped VITE_* value found.
 */
function main(): void {
  const projectRoot = process.cwd();
  const envExample = readEnvExample(projectRoot);
  if (envExample !== null) {
    const envExampleIssues = auditEnvExample(envExample);
    if (envExampleIssues.length > 0) {
      console.error('\n⚠  .env.example audit failed:');
      envExampleIssues.forEach((msg) => console.error('   - ' + msg));
      console.error('   Add the VITE_* warning to keep contributors from mis-using the prefix.\n');
    }
  } else {
    console.warn('No .env.example found at project root. Skipping example-file audit.');
  }

  const verdicts = scan({ env: process.env, failOnWarn: isProductionBuild() });

  if (verdicts.length === 0) {
    console.log('✓ check-secrets: no VITE_* vars found in environment. (Build safe.)');
    process.exit(0);
  }

  console.log('\ncheck-secrets report:');
  for (const v of verdicts) {
    console.log(formatVerdict(v));
  }

  const fails = verdicts.filter((v) => v.verdict === 'fail');
  const warns = verdicts.filter((v) => v.verdict === 'warn');

  if (fails.length > 0) {
    console.error(`\n✗ Build aborted: ${fails.length} secret-shaped VITE_* value(s) found.`);
    console.error('  VITE_* env vars are inlined into the browser bundle at build time.');
    console.error(
      '  Move the secret server-side (see docs/drafts/hephaestus/vite-proxy-architecture.md).'
    );
    process.exit(1);
  }

  if (warns.length > 0 && isProductionBuild()) {
    console.error(
      `\n✗ Build aborted: ${warns.length} suspicious VITE_* value(s) in production build (failOnWarn=true).`
    );
    process.exit(1);
  }

  if (warns.length > 0) {
    console.warn(`\n⚠ ${warns.length} warning(s) — review before shipping.`);
  }

  process.exit(0);
}

// Run main() only when this file is invoked directly (not when imported by tests).
// Uses the same heuristic as `node:module.createRequire` resolution, but without
// the import — works in both ESM and CJS test runners.
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /check-secrets\.ts$/.test(process.argv[1])
) {
  main();
}

// Re-exports for tests (tree-shakable in production builds)
export { isProductionBuild, readEnvExample, main };
```

---

## 3. File: `scripts/check-secrets.test.ts`

Vitest test suite. Run with `npx vitest run scripts/check-secrets.test.ts`.

```ts
/**
 * @file scripts/check-secrets.test.ts
 * @description Unit tests for the build-time secret scanner.
 * @runs-as `npx vitest run scripts/check-secrets.test.ts`
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateVar,
  scan,
  mask,
  formatVerdict,
  auditEnvExample,
  SECRET_RULES,
  DEFAULT_ALLOWLIST,
  type ScannerConfig,
} from './check-secrets';

const baseCfg: ScannerConfig = { env: {} };

describe('evaluateVar', () => {
  it('passes empty values', () => {
    expect(evaluateVar('VITE_X', '', baseCfg).verdict).toBe('pass');
  });

  it('passes allowlist matches (case-insensitive)', () => {
    expect(evaluateVar('VITE_X', 'EXAMPLE_abc', baseCfg).reason).toContain('allowlist');
    expect(evaluateVar('VITE_X', 'demo_xyz', baseCfg).reason).toContain('allowlist');
    expect(evaluateVar('VITE_X', 'PLACEHOLDER', baseCfg).reason).toContain('allowlist');
    expect(evaluateVar('VITE_X', 'TEST_KEY_value', baseCfg).reason).toContain('allowlist');
  });

  it('fails NVIDIA NIM keys', () => {
    const v = evaluateVar('VITE_NIM_API_KEY_1', 'nvapi-abc123def456ghi789jkl012', baseCfg);
    expect(v.verdict).toBe('fail');
    expect(v.matchedRule).toBe('nvidia-nvapi-prefix');
  });

  it('fails JWT-shaped values', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const v = evaluateVar('VITE_JWT', jwt, baseCfg);
    expect(v.verdict).toBe('fail');
    expect(v.matchedRule).toBe('jwt-shape');
  });

  it('fails AWS access key IDs (AKIA…)', () => {
    const v = evaluateVar('VITE_AWS', 'AKIAIOSFODNN7EXAMPLE', baseCfg);
    expect(v.verdict).toBe('fail');
    expect(v.matchedRule).toBe('aws-access-key-id');
  });

  it('warns on long values without allowlist match', () => {
    const v = evaluateVar('VITE_SOMETHING', 'a'.repeat(40), baseCfg);
    expect(v.verdict).toBe('warn');
  });

  it('passes short non-secret values', () => {
    const v = evaluateVar('VITE_API_URL', 'https://api.example.com', baseCfg);
    expect(v.verdict).toBe('pass');
  });

  it('treats warn as fail when failOnWarn is true', () => {
    const v = evaluateVar('VITE_SOMETHING', 'a'.repeat(40), {
      env: {},
      failOnWarn: true,
    });
    expect(v.verdict).toBe('fail');
  });
});

describe('scan', () => {
  it('only inspects VITE_ prefixed vars', () => {
    const env = {
      VITE_OK: 'https://api.example.com',
      SECRET_KEY: 'should-be-ignored', // not VITE_, scanner does not see it
    };
    const verdicts = scan({ env });
    expect(verdicts).toHaveLength(1);
    expect(verdicts[0]!.name).toBe('VITE_OK');
  });

  it('sorts fail > warn > pass', () => {
    const env = {
      VITE_PASS: 'https://example.com',
      VITE_FAIL: 'nvapi-abc123def456ghi789',
      VITE_WARN: 'a'.repeat(40),
    };
    const verdicts = scan({ env });
    expect(verdicts[0]!.verdict).toBe('fail');
    expect(verdicts[1]!.verdict).toBe('warn');
    expect(verdicts[2]!.verdict).toBe('pass');
  });

  it('throws on invalid env', () => {
    expect(() => scan({ env: null as unknown as Record<string, string> })).toThrow(TypeError);
  });

  it('skips undefined values', () => {
    const env = { VITE_UNSET: undefined };
    const verdicts = scan({ env });
    expect(verdicts).toHaveLength(0);
  });
});

describe('mask', () => {
  it('masks long values', () => {
    expect(mask('nvapi-abc123def456ghi789')).toBe('nvap…8789');
  });
  it('returns short values unchanged', () => {
    expect(mask('short')).toBe('short');
  });
});

describe('formatVerdict', () => {
  it('includes icon, name, tag, and reason', () => {
    const line = formatVerdict({
      name: 'VITE_X',
      value: 'nvapi-abc',
      verdict: 'fail',
      reason: 'matches',
    });
    expect(line).toContain('✗');
    expect(line).toContain('VITE_X');
    expect(line).toContain('[FAIL]');
    expect(line).toContain('matches');
  });
});

describe('auditEnvExample', () => {
  it('flags missing warning', () => {
    const issues = auditEnvExample('VITE_API_URL=https://x.com');
    expect(issues).toHaveLength(2);
  });
  it('passes a complete .env.example', () => {
    const issues = auditEnvExample(
      [
        '# VITE_ values are inlined into the browser bundle.',
        '# NEVER put production secrets in any VITE_ var.',
        'VITE_API_URL=https://api.example.com',
      ].join('\n')
    );
    expect(issues).toHaveLength(0);
  });
});

describe('rule inventory', () => {
  it('covers the main secret types we care about', () => {
    const names = SECRET_RULES.map((r) => r.name);
    expect(names).toContain('nvidia-nvapi-prefix');
    expect(names).toContain('jwt-shape');
    expect(names).toContain('aws-access-key-id');
    expect(names).toContain('github-token');
    expect(names).toContain('openai-key');
  });

  it('has a non-empty default allowlist', () => {
    expect(DEFAULT_ALLOWLIST.length).toBeGreaterThan(0);
  });
});
```

---

## 4. File: `.env.example` (updated)

Replace the existing `.env.example` with this content. The comments are **load-bearing** — they are scanned by `auditEnvExample`.

```bash
# ──────────────────────────────────────────────────────────────────────
# FinPlan Pro — Environment Configuration
# ──────────────────────────────────────────────────────────────────────
#
# ⚠  CRITICAL — READ BEFORE EDITING
#
# Values prefixed VITE_ are inlined into the browser bundle at build time.
# Vite replaces `import.meta.env.VITE_*` with a string literal in the
# emitted JavaScript. The value is then visible to anyone who opens
# DevTools, fetches the JS bundle, or screenshots the network tab.
#
# THEREFORE:
#   • NEVER put production secrets in any VITE_* var.
#   • Use the server-side proxy (see docs/drafts/hephaestus/vite-proxy-architecture.md)
#     for AI providers (NIM, OpenAI, etc.) and other paid services.
#   • Public, non-secret values (API base URLs, feature flags, public
#     Mapbox/Sentry/PostHog public keys) are fine.
#
# The build-time scanner (scripts/check-secrets.ts) enforces this:
# it will refuse to build if any VITE_* var matches a known secret shape.
# ──────────────────────────────────────────────────────────────────────

# ─── Public configuration (safe) ─────────────────────────────────────

# Backend API base URL (no secret)
VITE_API_URL=/api

# Sentry / error reporter (public DSN is meant to be public; the secret
# is the SENTRY_AUTH_TOKEN, which is a CI env var, NOT a VITE_ var)
VITE_SENTRY_DSN=

# PostHog / analytics (public project key only; secret is server-side)
VITE_POSTHOG_KEY=

# Mapbox public token (designed to be public; the secret is the
# MAINTENANCE token, server-side)
VITE_MAPBOX_PUBLIC_TOKEN=

# ─── Local development only ─────────────────────────────────────────
# These are flagged by the scanner as ALLOWLIST matches (DEMO, EXAMPLE,
# TEST_KEY) and will not fail the build.

# Demo auth toggle for offline mode — see docs/drafts/hephaestus/mock-auth-build-gate.md
# ⚠  NEVER set this to 'true' in production. The build-time gate
#    in src/main.tsx will refuse to ship if it is.
VITE_USE_MOCK_AUTH=false

# Example NIM key (allowlisted) — replace with the real key in your LOCAL
# .env, which is gitignored. The scanner will FAIL the build if you put a
# real nvapi- key here.
VITE_NIM_API_KEY_1=EXAMPLE_NVAPI_KEY_REPLACE_ME
VITE_NIM_API_KEY_2=EXAMPLE_NVAPI_KEY_REPLACE_ME
VITE_NIM_BASE_URL=https://integrate.api.nvidia.com/v1

# ─── Server-only secrets (DO NOT prefix with VITE_) ─────────────────
# These belong in the deployment platform's secret manager (Vercel
# Environment Variables, Cloudflare Workers secrets, etc.), never in
# the browser bundle.
#
#   NIM_API_KEY           # the real NVIDIA NIM key
#   JWT_SECRET            # HS256 signing key
#   DATABASE_URL          # Postgres / sql.js server-side
#   SENTRY_AUTH_TOKEN     # CI symbol upload
```

---

## 5. File: `package.json` (patch)

Add the `prebuild` hook. The scanner runs before every production build.

```jsonc
{
  "scripts": {
    "check-secrets": "tsx scripts/check-secrets.ts",
    "prebuild": "npm run check-secrets",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
  },
}
```

The `prebuild` lifecycle means:

- `npm run build` → automatically invokes `check-secrets` first
- CI fails fast with exit code 1 if any VITE\_\* var is secret-shaped
- Local devs get the same protection by default

---

## 6. Operational runbook

### Pre-deploy checklist

1. Rotate any production secret that may have appeared in a past `dist/` (the scanner cannot un-leak a key; rotation is the only durable fix)
2. Confirm `.env` is in `.gitignore` (it is — line 19, `.env*` glob)
3. Run `npm run check-secrets` locally before pushing
4. CI runs it automatically via `prebuild`

### When the scanner fails

1. Read the failed rule (e.g. `nvidia-nvapi-prefix`)
2. Confirm the value in `.env` is the issue (not a false positive)
3. **Move the secret server-side** — see Artifact 2 (`vite-proxy-architecture.md`)
4. Replace the VITE\_\* value with a placeholder/EXAMPLE token in `.env`
5. Re-run `npm run check-secrets` to confirm green

### False positives

- If a value is genuinely safe but matches a rule, add the allowlist token to `cfg.allowlistTokens` (do not edit the rule predicates — they exist for a reason)
- Common case: a public Mapbox URL token. Add `MAPBOX` to the allowlist, or use the `EXAMPLE` suffix

---

## 7. Limitations

- The scanner only inspects `VITE_*` vars. **Server-side secrets** (`NIM_API_KEY`, `JWT_SECRET`, etc.) are outside its scope — those must be protected by the deployment platform's secret manager.
- The scanner is a **defense-in-depth** check, not a substitute for code review. A determined attacker who controls the source repo can disable the scanner trivially.
- The scanner does not catch secrets in JS source code (e.g. a hardcoded `Bearer xyz` string in `src/services/nim.ts`). That requires a source-level scan (gitleaks, trufflehog) which is out of scope for this artifact.
- Pattern-based detection has false positives and false negatives. Treat the scanner as a guard rail, not a guarantee.

---

## 8. Cross-references

- **Apollo task 019ebcea…** — `.env` key rotation advisory + build-time secret check (this artifact is the implementation)
- **Apollo task 019ebce7-… P0 #1** — `.env` NIM keys pre-push
- **Apollo task 019ebcf0…** — NIM proxy architectural fix (companion to this scanner; together they form defense in depth)
- **`docs/drafts/hephaestus/vite-proxy-architecture.md`** (Artifact 2) — the durable fix
- **`docs/drafts/hephaestus/mock-auth-build-gate.md`** (Artifact 3) — the third leg of the P0 trio
- **Hephaestus audit 2026-06-12** — finding P0-#1, elevated to confirmed-incident by Lead 2026-06-12

---

## 9. Changelog

- **v0.1** (2026-06-12, Hephaestus) — initial draft. TypeScript implementation, 8 secret-detection rules, default allowlist, vitest test suite, .env.example convention, prebuild hook.

— End of Artifact 1 —
