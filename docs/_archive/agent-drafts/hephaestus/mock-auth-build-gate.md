<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-12 -->

# Artifact 3 — Mock-Auth Build Gate

> **Owner:** Hephaestus (aionrs/MiniMax-M3)
> **Date:** 2026-06-12
> **Apollo task served:** [`019ebce7-…` P0 #4 — Mock auth bypass: add `VITE_USE_MOCK_AUTH` build-time gate](../../task-board.json)
> **Threat model reference:** Hephaestus audit 2026-06-12, finding P0-#4 (`authStore.ts:222-231` accepts any password for `MOCK_USERS` emails; if the real backend is unreachable in production, any unauthenticated attacker can log in as `admin@finplan.com`).
> **Status:** DRAFT v0.1 — 4-line patch compiles; tests included; full audit of `MOCK_*` symbols in `src/` provided.

---

## 1. The fix (4 lines, top of `src/main.tsx`)

```ts
// ─── Mock-auth production gate (Hephaestus 2026-06-12, P0 #4) ──────────
// Refuse to start the app in production if mock auth is enabled.
// The mock auth path accepts any password for offline mode; that is
// acceptable in dev but catastrophic in production. The build-time
// scanner (scripts/check-secrets.ts) enforces the same rule for VITE_*
// env vars; this enforces it for VITE_USE_MOCK_AUTH at app start.
if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
  throw new Error(
    '[FATAL] VITE_USE_MOCK_AUTH=true is not allowed in production builds. ' +
      'The mock auth path accepts any password and would let an unauthenticated ' +
      'attacker log in as admin@finplan.com. Set VITE_USE_MOCK_AUTH=false in .env.production ' +
      'or remove the variable. See docs/drafts/hephaestus/mock-auth-build-gate.md.'
  );
}
```

**Where this lives:** the first 4 lines of `src/main.tsx`, before any other code that might call `authStore.login()`. The throw happens at module-evaluation time, which means the React tree never mounts, no side effects run, and the browser console shows a clear actionable error.

**Why a runtime gate is necessary in addition to a build-time check:** Vite cannot statically remove `if (import.meta.env.PROD && ...)` from the bundle without a separate plugin. The runtime gate is the _only_ reliable way to refuse production startup, because:

- Build-time replacements can be defeated by overriding `import.meta.env` in DevTools (no, in production this is read-only; but in dev it would be defeat-able).
- The `import.meta.env.PROD` check is a compile-time constant in Vite (it becomes `true` in `npm run build` and `false` in `npm run dev`). The bundler dead-code-eliminates the false branch in production, so the check costs zero bytes in the production bundle.

**Wait** — that last point means the build-time constant `import.meta.env.PROD` is replaced with `true` at build time, and the entire `if (true && ...)` block is kept. Good. The block is **kept** in production, which is what we want. The `import.meta.env.VITE_USE_MOCK_AUTH` value is also inlined at build time, so the comparison is against the static value that was set in the build environment.

---

## 2. Code patch: `src/store/authStore.ts` (defense in depth)

The runtime gate above is the first line of defense. The second is to gate the mock auth path _inside_ `authStore.ts` so a future developer who removes the gate from `main.tsx` still cannot accidentally ship mock auth. Apply this diff at the top of the `login` action (around line 215):

```ts
// Defense-in-depth: refuse to authenticate against the mock table in
// production unless VITE_USE_MOCK_AUTH is explicitly 'true'. This is a
// belt-and-braces check; the primary gate is in src/main.tsx.
if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_AUTH !== 'true') {
  throw new Error(
    '[FATAL] Mock auth path is disabled in production. ' +
      'Connect the app to a real backend (VITE_API_URL) or set VITE_USE_MOCK_AUTH=true ' +
      'for local offline development only.'
  );
}
```

Apply the same gate at the top of the `register` action (around line 308). The exact location is `src/store/authStore.ts:310` where the second `MOCK_USERS` lookup happens.

---

## 3. Audit of every `MOCK_*` symbol in `src/`

The following table lists every place in `src/` that references mock auth or mock users. Apollo must verify each entry before the patch is committed.

| File                                    | Line    | Symbol                                   | Verdict       | Notes                                                                                                 |
| --------------------------------------- | ------- | ---------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `src/store/authStore.ts`                | 103     | `MOCK_USERS` table                       | **MUST GATE** | The table itself is fine to keep; the gate is on lookup.                                              |
| `src/store/authStore.ts`                | 151     | `generateMockToken`                      | **MUST GATE** | Function itself is fine; callers must be gated.                                                       |
| `src/store/authStore.ts`                | 216-217 | `MOCK_USERS[email]` lookup in `login`    | **MUST GATE** | This is the bypass. Add the defense-in-depth check from §2.                                           |
| `src/store/authStore.ts`                | 232-233 | mock token creation in `login`           | **MUST GATE** | Reachable only via the gated path; safe if §2 patch is in place.                                      |
| `src/store/authStore.ts`                | 310     | `MOCK_USERS[email]` lookup in `register` | **MUST GATE** | Same pattern as login. Add the same defense-in-depth check.                                           |
| `src/store/authStore.ts`                | 339     | mock token creation in `register`        | **MUST GATE** | Same.                                                                                                 |
| `src/store/authStore.ts`                | 365     | mock token creation in reauth            | **MUST GATE** | Reachable only from an already-mock-authenticated session; gate at session validation instead.        |
| `src/test/mockFactories.ts`             | 60      | `mockUser()` test factory                | **SAFE**      | False positive; not auth, just a test helper.                                                         |
| `src/hooks/usePresence.test.ts`         | 58-62   | `mockUsers` test variable                | **SAFE**      | False positive; local variable in a unit test.                                                        |
| `src/store/__tests__/authStore.test.ts` | 6       | `mockUser` test fixture                  | **SAFE**      | False positive; test setup.                                                                           |
| `src/utils/tokenRotation.test.ts`       | 87-132  | `mockUser`/`makeMockUser` test fixtures  | **SAFE**      | False positive; test setup.                                                                           |
| `src/services/mockData/index.ts`        | 41      | `mockUserPreferences` export             | **SAFE**      | Mock data for dev; not auth. Should be guarded by `import.meta.env.DEV` but is not security-critical. |
| `src/services/mockData/settings.ts`     | 41      | `mockUserPreferences` definition         | **SAFE**      | Same as above.                                                                                        |

**Summary of MUST GATE sites:** 4 locations in `src/store/authStore.ts` (216, 232, 310, 339, 365). All are inside the same store; a single defense-in-depth check at the top of the file (or a small helper `isMockAuthAllowed()`) is sufficient. Apollo's call on the exact refactor pattern.

---

## 4. `.env.example` updates

The existing `.env.example` already mentions `VITE_USE_MOCK_AUTH` (per the scan in Artifact 1 §4). The wording should be tightened to make the production prohibition explicit. Replace the existing line with:

```bash
# ─── Mock auth (dev only) ──────────────────────────────────────────
# Offline development mode. The MOCK_USERS table in authStore.ts
# contains seeded accounts (admin@finplan.com, analyst@finplan.com)
# that accept ANY password. This is fine for local development but
# would be a critical security hole in production.
#
# ─────────────────────────────────────────────────────────────────
# ⚠  NEVER set VITE_USE_MOCK_AUTH=true in a production build.
# The runtime gate in src/main.tsx will refuse to start the app
# and the build-time scanner (scripts/check-secrets.ts) will refuse
# to build if it detects an unsafe combination.
# ─────────────────────────────────────────────────────────────────
VITE_USE_MOCK_AUTH=false
```

**`.env.production`** (deploy-time only, not in repo):

```bash
VITE_USE_MOCK_AUTH=false
# Plus the real backend URL and secrets:
# VITE_API_URL=https://api.finplan.pro
# NIM_API_KEY (server-side, not VITE_)
# JWT_SECRET (server-side)
```

---

## 5. Test: `src/store/__tests__/authStore.test.ts` (additional case)

Add the following test to the existing test file. It verifies that the gate is in place and refuses to run in production mode with mock auth enabled.

```ts
/**
 * @file src/store/__tests__/authStore.test.ts (additional case)
 * @description Verifies the VITE_USE_MOCK_AUTH production gate.
 * @author Hephaestus (aionrs/MiniMax-M3), 2026-06-12
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('VITE_USE_MOCK_AUTH production gate', () => {
  const originalImportMetaEnv = (import.meta as { env: Record<string, unknown> }).env;

  beforeEach(() => {
    // Reset modules so the gate is re-evaluated
    vi.resetModules();
  });

  afterEach(() => {
    (import.meta as { env: Record<string, unknown> }).env = originalImportMetaEnv;
  });

  it('throws when VITE_USE_MOCK_AUTH=true in production', async () => {
    // Stub import.meta.env
    (import.meta as { env: Record<string, unknown> }).env = {
      PROD: true,
      VITE_USE_MOCK_AUTH: 'true',
    };
    // Re-import main.tsx (or the gate module) and expect the throw
    await expect(import('@/main')).rejects.toThrow(/VITE_USE_MOCK_AUTH=true is not allowed/);
  });

  it('does not throw when VITE_USE_MOCK_AUTH=false in production', async () => {
    (import.meta as { env: Record<string, unknown> }).env = {
      PROD: true,
      VITE_USE_MOCK_AUTH: 'false',
    };
    await expect(import('@/main')).resolves.toBeDefined();
  });

  it('does not throw when VITE_USE_MOCK_AUTH=true in dev', async () => {
    (import.meta as { env: Record<string, unknown> }).env = {
      PROD: false,
      VITE_USE_MOCK_AUTH: 'true',
    };
    await expect(import('@/main')).resolves.toBeDefined();
  });
});
```

**Note:** The test relies on `vi.resetModules()` to re-evaluate `src/main.tsx` and the gate. The exact import path (`@/main`) is the alias from `tsconfig.json`. If the alias is unavailable in the test runner, use a relative import.

---

## 6. Operational runbook

### Local development

- `VITE_USE_MOCK_AUTH=true` in `.env.local` (gitignored) is fine.
- The seeded accounts in `MOCK_USERS` accept any password. Use `admin@finplan.com` for full access, `analyst@finplan.com` for read-only.

### Staging / production

- `VITE_USE_MOCK_AUTH` must be `false` or unset.
- The real backend must be reachable at `VITE_API_URL`. If it is not, login attempts fail with the standard "Invalid credentials" error — **not** the mock bypass.

### If the gate fires at startup

- A red error appears in the browser console and a blank page is shown.
- The error message is actionable: it tells the operator which env var to change.
- To recover: edit the deploy environment to set `VITE_USE_MOCK_AUTH=false`, rebuild, and redeploy.

### Emergency override (NOT recommended)

- If you absolutely must start a production build with mock auth (e.g. to recover from a broken backend), the only way is to comment out the gate. **Do this only in a private build, never commit the override.**

---

## 7. Limitations

- The gate is a runtime check. A determined attacker who controls the source repo can comment it out. The scanner (Artifact 1) and code review are the upstream defenses.
- The defense-in-depth check inside `authStore.ts` (§2) is not a substitute for the `main.tsx` gate — it is a backup. If you remove one, keep the other.
- Mock auth is a development convenience, not a security feature. **No real data should ever be entered into a build with mock auth enabled.** Treat the gate as the minimum; treat mock auth as ephemeral.

---

## 8. Cross-references

- **Apollo task 019ebce7-… P0 #4** — Mock auth bypass: add `VITE_USE_MOCK_AUTH` build-time gate (this artifact is the patch)
- **`docs/drafts/hephaestus/build-time-secret-scanner.md`** (Artifact 1) — companion guard rail for `VITE_*` env vars
- **`docs/drafts/hephaestus/vite-proxy-architecture.md`** (Artifact 2) — companion architectural fix for the Vite-inlining P0
- **Hephaestus audit 2026-06-12** — finding P0-#4 (mock auth accepts any password)
- **`src/store/authStore.ts`** — the file being patched

---

## 9. Changelog

- **v0.1** (2026-06-12, Hephaestus) — initial draft. 4-line `main.tsx` patch, defense-in-depth `authStore.ts` patch, full `MOCK_*` symbol audit, `.env.example` updates, vitest test.

— End of Artifact 3 —
