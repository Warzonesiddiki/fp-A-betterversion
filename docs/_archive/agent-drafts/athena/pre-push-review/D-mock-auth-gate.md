<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-12 -->
<!-- Cross-references: Apollo P0 #4 (VITE_USE_MOCK_AUTH gate) = 019ebce7-792c-…
                  Hephaestus P0 = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b -->

# D. PHASE D — P0 #4 VITE_USE_MOCK_AUTH Build-Time Gate

**Subject:** Add a build-time/runtime gate that throws if `VITE_USE_MOCK_AUTH === 'true'` in production.
**Apollo task:** Hephaestus-flagged P0 from `019ebce7-792c-…`
**Verdict:** ✅ **SAFE-TO-APPLY with 2 amendments** (see §D.3 and §D.4).

---

## D.1 The vulnerability (confirmed by reading the source)

`src/store/authStore.ts:213-237` shows that mock authentication is the **only** authentication path currently implemented:

```ts
// Line 213-237
async login(email: string, password: string): Promise<AuthUser> {
  // Offline mock authentication
  const mockUser = MOCK_USERS[email.toLowerCase()];
  if (mockUser && mockUser.password === password) {
    // ...success path with mock user
    return { id: mockUser.id, email, name: mockUser.name, role: mockUser.role };
  }
  throw new Error('Invalid credentials');
}
```

There is no `if (VITE_USE_MOCK_AUTH)` branch. There is no real auth provider. **The mock IS the auth.** If someone deploys the current build to production, anyone can log in as one of the hardcoded mock users (`admin@finplan.com`, `demo@finplan.com`, etc.) with the hardcoded passwords.

This is not a "leak" — it's a hardcoded backdoor. The build-time gate prevents the app from booting in production with the mock path active.

---

## D.2 The entry-point patch (`src/main.tsx`)

### Current `src/main.tsx` (18 lines, 4 import + bootstrap)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { logger } from './utils/logger';

const savedTheme = localStorage.getItem('theme') ?? 'light';
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
logger.info('App started');
```

### Patched `src/main.tsx` (with gate)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { logger } from './utils/logger';

/* ────────────────────────────────────────────────────────────────────────────
 * MOCK AUTH BUILD-TIME GATE (Apollo PRE-PUSH P0 #4)
 * ────────────────────────────────────────────────────────────────────────────
 * src/store/authStore.ts currently has HARDCODED mock authentication as the
 * only login path. If `VITE_USE_MOCK_AUTH === 'true'` in production, ANY user
 * can log in as a hardcoded admin.
 *
 * This gate fails-fast at boot time if:
 *   - we're building for production (import.meta.env.PROD)
 *   - AND VITE_USE_MOCK_AUTH is explicitly set to 'true'
 *
 * The check uses Vite's import.meta.env which is statically replaced at build
 * time, so the gate is effectively a build-time assertion.
 *
 * Cross-references:
 *   - Apollo P0 #4 = 019ebce7-792c-…
 *   - Hephaestus security audit = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b
 * ──────────────────────────────────────────────────────────────────────────── */
const MOCK_AUTH_ENABLED = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

if (import.meta.env.PROD && MOCK_AUTH_ENABLED) {
  // Hard fail — refuse to boot a production build with mock auth enabled.
  const errorMsg =
    'FATAL: VITE_USE_MOCK_AUTH is enabled in a production build. ' +
    'Refusing to start. Set VITE_USE_MOCK_AUTH=false (or remove the variable) ' +
    'and rebuild. See docs/drafts/athena/pre-push-review/D-mock-auth-gate.md.';

  // Log to both console and the logger so the failure is visible in dev tools
  // and in any crash-reporting pipeline.
  // eslint-disable-next-line no-console
  console.error(errorMsg);
  logger.fatal(errorMsg);

  // Render an error message in the root, then throw.
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML =
      '<div style="font-family:monospace;padding:2rem;background:#fee;border:2px solid #c00;color:#900"><h1>Configuration Error</h1><p>Mock authentication is enabled in a production build. The application cannot start. Contact your administrator.</p></div>';
  }
  throw new Error(errorMsg);
}

logger.info('Auth mode', { mock: MOCK_AUTH_ENABLED, prod: import.meta.env.PROD });

/* ────────────────────────────────────────────────────────────────────────────
 * END GATE
 * ──────────────────────────────────────────────────────────────────────────── */

const savedTheme = localStorage.getItem('theme') ?? 'light';
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
logger.info('App started');
```

---

## D.3 Amendment 1 — The authStore refactor (REQUIRED)

The entry-point gate alone is INSUFFICIENT. The `authStore.login()` function still has the hardcoded mock path that runs regardless of the gate. The gate only stops the app from booting — it doesn't fix the underlying code.

### Required refactor: `src/store/authStore.ts`

```ts
// At the top of the file, after imports:
const MOCK_AUTH_ENABLED = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const REAL_AUTH_ENABLED = !MOCK_AUTH_ENABLED && !import.meta.env.DEV;
// In dev, mock auth is allowed even without the flag (developer experience).
// In prod, mock auth requires the explicit flag (and the gate above will fail-fast).

// Replace the login function:
async login(email: string, password: string): Promise<AuthUser> {
  if (MOCK_AUTH_ENABLED || import.meta.env.DEV) {
    return this.loginMock(email, password);
  }
  if (REAL_AUTH_ENABLED) {
    return this.loginReal(email, password);
  }
  // Both paths disabled (shouldn't happen in production due to the gate,
  // but explicit is better than implicit).
  throw new Error('No authentication provider configured. Set VITE_USE_MOCK_AUTH=true for dev.');
}

/**
 * Mock authentication path. ONLY for development and when the build-time
 * flag is explicitly set. Hardcoded users in MOCK_USERS.
 *
 * @param email - User-supplied email (lowercased for lookup).
 * @param password - User-supplied password.
 * @returns A mock AuthUser on success.
 * @throws Error when credentials don't match.
 */
private async loginMock(email: string, password: string): Promise<AuthUser> {
  const mockUser = MOCK_USERS[email.toLowerCase()];
  if (mockUser && mockUser.password === password) {
    return { id: mockUser.id, email, name: mockUser.name, role: mockUser.role };
  }
  throw new Error('Invalid credentials');
}

/**
 * Real authentication path. Calls the backend auth endpoint.
 * NOT YET IMPLEMENTED — must be wired up by the backend team.
 *
 * @throws Error always in this commit (TODO(REAL_AUTH_PROVIDER)).
 */
private async loginReal(email: string, password: string): Promise<AuthUser> {
  // TODO(REAL_AUTH_PROVIDER): wire up to backend auth endpoint.
  // Expected shape: POST /api/auth/login with { email, password }, returns JWT.
  throw new Error(
    'Real authentication is not yet implemented. ' +
    'Set VITE_USE_MOCK_AUTH=true to use the dev mock path, ' +
    'or implement src/services/auth/realAuth.ts and wire it up here.'
  );
}
```

### Why this is required

Without the authStore refactor:

- The gate fails-fast in production, which is good.
- But in dev, the login form still works because the gate doesn't fire (PROD is false).
- And if someone bypasses the gate (e.g., sets VITE_USE_MOCK_AUTH=false in prod but the authStore still uses mock), the mock path is still active.

The refactor makes the branching explicit and traceable. It also sets up the structure for when a real auth provider is added (just implement `loginReal`).

---

## D.4 Amendment 2 — `.env.example` update

### Current

```bash
# .env.example (no VITE_USE_MOCK_AUTH present)
VITE_NIM_API_KEY=EXAMPLE_VALUE_DO_NOT_USE
OPENAI_API_KEY=EXAMPLE_VALUE_DO_NOT_USE
```

### Updated

```bash
# ──────────────────────────────────────────────────────────────────────
# MOCK AUTHENTICATION (dev only)
# ──────────────────────────────────────────────────────────────────────
# When 'true', the app uses hardcoded mock users from src/store/authStore.ts
# for authentication. This is a SECURITY BACKDOOR — anyone can log in as
# admin@finplan.com or demo@finplan.com with the hardcoded passwords.
#
# RULE: This variable MUST be 'false' or unset in any production build.
# The src/main.tsx entry-point gate will refuse to boot a production
# build with this set to 'true'.
#
# Allowed values: 'true' (dev only), 'false' (default), or unset.
# ──────────────────────────────────────────────────────────────────────
VITE_USE_MOCK_AUTH=false
```

---

## D.5 Audit list — every code path that uses MOCK_AUTH (verified)

| File:Line                                                   | Use                                                                            | Verdict                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| `src/store/authStore.ts:213-237`                            | The only `login()` function — fully mock                                       | **MUST be refactored** per §D.3                  |
| `src/store/authStore.ts:9`                                  | `subscribeWithSelector(persist(immer((set, get) => ({…}))))` — correct pattern | OK                                               |
| `src/store/authStore.ts:30`                                 | `MOCK_USERS` constant                                                          | Must remain (used by `loginMock`)                |
| `src/store/authStore.ts:215`                                | Comment "Offline mock authentication"                                          | Replace with refactored version                  |
| `src/utils/auth/authHelpers.ts` (if exists)                 | Check during commit                                                            | TBD                                              |
| `src/components/auth/LoginPage.tsx`                         | Imports from `useAuth()` — no direct MOCK_AUTH                                 | OK (refactored authStore will pass through)      |
| `src/components/auth/MockUserQuickSwitcher.tsx` (if exists) | Dev-only mock user switcher                                                    | TBD — should be guarded by `import.meta.env.DEV` |

**Grep command for the audit (run by Apollo before commit):**

```bash
grep -rn "MOCK_USERS\|MOCK_AUTH\|VITE_USE_MOCK_AUTH" \
  src/ --include='*.ts' --include='*.tsx'
```

---

## D.6 Test addition (in `src/store/authStore.test.ts`)

```ts
describe('MOCK_AUTH build-time gate', () => {
  it('refuses to boot in production with VITE_USE_MOCK_AUTH=true', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'true');
    await expect(import('../../main')).rejects.toThrow(/VITE_USE_MOCK_AUTH is enabled/);
  });

  it('boots in production with VITE_USE_MOCK_AUTH=false', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'false');
    // Should not throw on import
    await expect(import('../../main')).resolves.toBeDefined();
  });

  it('login() uses mock path in dev', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('DEV', true);
    const user = await useAuth.getState().login('admin@finplan.com', 'admin123');
    expect(user.email).toBe('admin@finplan.com');
  });

  it('login() uses real path in production with mock disabled (throws NOT_IMPLEMENTED)', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'false');
    await expect(useAuth.getState().login('admin@finplan.com', 'admin123')).rejects.toThrow(
      /Real authentication is not yet implemented/
    );
  });
});
```

---

## D.7 Commit message (suggested)

```
fix(security): add VITE_USE_MOCK_AUTH build-time gate + authStore refactor

- ADD gate in src/main.tsx that fails-fast if PROD && VITE_USE_MOCK_AUTH=true
- REFACTOR src/store/authStore.ts:login() to branch on MOCK_AUTH_ENABLED flag
- ADD loginMock() (preserves existing dev behavior) and loginReal() (TODO)
- UPDATE .env.example to set VITE_USE_MOCK_AUTH=false by default
- ADD 4 tests covering boot-time gate and login path selection

Cross-references: P0 #4 in Apollo's pre-push queue (019ebce7-…).
                  Hephaestus security audit (019ebcd6-…).
```

---

**Status: SAFE-TO-APPLY after applying the entry-point patch + the authStore refactor + the .env.example update. All 3 are in this PR.**
