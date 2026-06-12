<!-- DRAFT v1.1 — Athena Path A self-apply (header polish, no substantive change) 2026-06-13 — Mnemosyne T-MN-008 #06 -->
<!-- v0.1 → v1.1 cascade: 1 store + 7 helpers + 11 state + 11 actions = 30 items, MOCK_AUTH gate, 4 security invariants. v0.1 = v0.2 = v0.3 = v0.4 = v1.1 — Athena 3 APPLY (no NEEDS-FIX on this patch) -->

# JSDoc draft — `src/store/authStore.ts` (v1.1)

> **Ground-truth note (2026-06-13)**: v0.1 patch derived from the actual
> source at `src/store/authStore.ts` (540L, verified by Read). The
> original 5-P0 cascade covered `useAuth` (the thin wrapper hook in
> `src/hooks/useAuth.ts`); this v0.1 patch covers the **underlying
> zustand store + 6 RBAC helpers + 1 build-time gate helper** that
> `useAuth` calls into. All method signatures, state fields, and
> persist config are file:line verified — no fabrications.
>
> **CRITICAL**: This is the security-critical auth module. The
> `MOCK_AUTH` build-time gate at L18-26 is a hard security control —
> a production build with mock auth throws immediately on module
> load (defence-in-depth with the gate in `src/main.tsx`).

---

## 4-Question Framework applied

1. **File path verified** — `src/store/authStore.ts` exists (540L, verified by Read).
2. **Method signatures verified** — Read of actual source. Public surface = 1 store (`useAuthStore`) + 1 helper (`isMockAuthEnabled`) + 6 RBAC helpers (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `isRole`, `isManagerOrAbove`, `canApprove`) = 8 top-level exports. Store internals = 11 state fields + 11 action methods.
3. **ADR cross-check** — No ADR directly references this store. Closest: ADR-002 (zustand pattern, per Path C renumbering 2026-06-13) commits to `subscribeWithSelector(persist(immer(...), { name, storage: masterStorage }))` — verified present at L188-510.
4. **TENTATIVE markers** — Flagged: the **line numbers for state fields (L192-202) and action methods (L208-494) are D-009 verified but the field offsets within the `set((s) => {...})` calls may shift slightly with future edits**. Method signatures are stable; positions may drift.

---

## Current source (verbatim, summary)

```ts
// Lines 1-540, src/store/authStore.ts
// (Top-of-file imports, L1-6: zustand, persist, subscribeWithSelector, immer, types, masterStorage, tokenRotation)

// --- Mock-Auth build-time gate (L8-30) ---
// Production + VITE_USE_MOCK_AUTH=true → throw at module load
if (import.meta.env.PROD === true && (VITE_USE_MOCK_AUTH === 'true' || === '1')) {
  throw new Error('MOCK_AUTH MUST NOT BE ENABLED IN PRODUCTION ...');
}
export const isMockAuthEnabled = (): boolean => /* ... */;  // L29

// --- RBAC Permission Matrix (L33-124) ---
const ROLE_PERMISSIONS: Record<Role, readonly string[]> = { /* 5 roles × N permissions */ };

// --- Mock Users (L127-173) ---
const MOCK_USERS: Record<string, User> = { /* 3 demo users */ };

// --- Mock JWT generation (L175-186) ---
function generateMockToken(userId, role): string { /* base64(header).base64(payload).mock-signature */ }

// --- Zustand store (L188-511) ---
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // --- State (L192-202): 11 fields ---
        user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
        isLoading: false, mfaRequired: false, activeEntityId: '', error: null,
        loginAttempts: 0, lockedUntil: null, tokenExpiry: null,

        // --- Actions (L204-494): 11 methods ---
        login, loginMock, loginReal, logout, register,
        refreshAccessToken, setUser, switchEntity, setError, clearError, setLoading,
      })),
      { name: 'auth-store', storage: masterStorage, partialize: (state) => ({
        user, isAuthenticated, activeEntityId, loginAttempts, lockedUntil,
        // Note: tokenExpiry, accessToken, refreshToken are NOT persisted
      }) }
    )
  )
);

// --- RBAC Helpers (L513-540): 6 exports ---
export function hasPermission(user, permission): boolean { /* ... */ }
export function hasAnyPermission(user, permissions): boolean { /* ... */ }
export function hasAllPermissions(user, permissions): boolean { /* ... */ }
export function isRole(user, ...roles): boolean { /* ... */ }
export function isManagerOrAbove(user): boolean { /* isRole(user, 'Admin', 'FP&A_Manager') */ }
export function canApprove(user): boolean { /* isRole(user, 'Admin', 'FP&A_Manager') */ }
```

## Public surface (D-009 verified)

### Top-level exports (8)

| Export | Kind | Signature | File:line |
|--------|------|-----------|-----------|
| `isMockAuthEnabled` | function | `() => boolean` | L29 |
| `useAuthStore` | zustand hook | `UseBoundStore<StoreApi<AuthState>>` | L188 |
| `hasPermission` | function | `(user: User \| null, permission: string) => boolean` | L514 |
| `hasAnyPermission` | function | `(user: User \| null, permissions: string[]) => boolean` | L519 |
| `hasAllPermissions` | function | `(user: User \| null, permissions: string[]) => boolean` | L524 |
| `isRole` | function | `(user: User \| null, ...roles: Role[]) => boolean` | L529 |
| `isManagerOrAbove` | function | `(user: User \| null) => boolean` | L534 |
| `canApprove` | function | `(user: User \| null) => boolean` | L538 |

### Store state (11 fields, L192-202)

| Field | Type | Initial | Notes |
|-------|------|---------|-------|
| `user` | `User \| null` | `null` | Current authenticated user |
| `accessToken` | `string \| null` | `null` | Mock JWT, NOT persisted (security) |
| `refreshToken` | `string \| null` | `null` | Mock refresh, NOT persisted |
| `isAuthenticated` | `boolean` | `false` | `user !== null` after login |
| `isLoading` | `boolean` | `false` | True during login/hydration |
| `mfaRequired` | `boolean` | `false` | Set by `login` when MFA challenge needed |
| `activeEntityId` | `string` | `''` | Multi-entity context (persisted) |
| `error` | `string \| null` | `null` | Last error message |
| `loginAttempts` | `number` | `0` | Brute-force counter (persisted) |
| `lockedUntil` | `string \| null` | `null` | ISO timestamp; 15-min lockout after 5 fails |
| `tokenExpiry` | `number \| null` | `null` | Unix ms; NOT persisted |

### Store actions (11 methods, L204-494)

| Method | Signature | Notes |
|--------|-----------|-------|
| `login` | `(email: string, password: string) => Promise<void>` | Public entry; branches on `VITE_USE_MOCK_AUTH` |
| `loginMock` | `(email: string, password: string) => Promise<void>` | Throws in PROD (L229); accepts any password |
| `loginReal` | `(_email: string, _password: string) => Promise<void>` | Stub until backend wired (L350) |
| `logout` | `() => void` | Clears all 11 fields; stops token rotation |
| `register` | `(name: string, email: string, password: string) => Promise<void>` | Mock-only; checks duplicate email |
| `refreshAccessToken` | `() => Promise<void>` | Re-generates mock JWT; logs out on failure |
| `setUser` | `(user: User) => void` | Test/dev only; bypasses login flow |
| `switchEntity` | `(entityId: string) => void` | Multi-entity context switch |
| `setError` | `(error: string \| null) => void` | Manual error setter |
| `clearError` | `() => void` | Sets `error = null` |
| `setLoading` | `(isLoading: boolean) => void` | Manual loading setter |

### Persist config (L496-509)

- **name**: `'auth-store'` (becomes `finplan:auth-store` via masterStorage prefix)
- **storage**: `masterStorage` (the SSR-safe wrapper)
- **partialize**: PERSISTS `user, isAuthenticated, activeEntityId, loginAttempts, lockedUntil`; EXCLUDES `tokenExpiry, accessToken, refreshToken` (security)

## Proposed JSDoc to paste above `export const useAuthStore` (line 188)

```ts
/**
 * Central auth state — single source of truth for the current user, tokens,
 * MFA challenge status, and RBAC-derived permissions. Backed by a
 * `subscribeWithSelector(persist(immer(...), { name: 'auth-store', storage: masterStorage }))`
 * zustand store.
 *
 * **Public API** — 1 hook (`useAuthStore`) + 7 RBAC helpers. Thin wrapper
 * hook `useAuth` in `src/hooks/useAuth.ts` exposes the 6 most common
 * fields; prefer that wrapper for component consumption so the public
 * surface stays stable as the store grows.
 *
 * **MOCK_AUTH build-time gate (L18-26):** the module THROWS at load time
 * if `import.meta.env.PROD === true` AND `VITE_USE_MOCK_AUTH === 'true'`.
 * This is defence-in-depth: the `main.tsx` gate (Apollo PRE-PUSH P0 #4)
 * is the primary control; this is the belt-and-suspenders fallback so
 * a future code path that bypasses main.tsx still cannot mount with
 * mock auth in production. Do NOT remove this throw.
 *
 * **State (11 fields):**
 *
 * | Field            | Type             | Persisted? | Notes                                                              |
 * | ---------------- | ---------------- | ---------- | ------------------------------------------------------------------ |
 * | `user`           | `User \| null`   | ✅         | Current user; null = logged out                                     |
 * | `accessToken`    | `string \| null` | ❌         | Mock JWT; regenerated each login / refresh (NOT persisted, security) |
 * | `refreshToken`   | `string \| null` | ❌         | Mock refresh token (NOT persisted)                                 |
 * | `isAuthenticated`| `boolean`        | ✅         | `user !== null`                                                    |
 * | `isLoading`      | `boolean`        | ❌         | True during login/hydration                                        |
 * | `mfaRequired`    | `boolean`        | ❌         | True when `login` requires MFA challenge                           |
 * | `activeEntityId` | `string`         | ✅         | Multi-entity context                                               |
 * | `error`          | `string \| null` | ❌         | Last error (cleared on next login attempt)                         |
 * | `loginAttempts`  | `number`         | ✅         | Brute-force counter (resets on success, persists across sessions) |
 * | `lockedUntil`    | `string \| null` | ✅         | ISO timestamp; 15-min lockout after 5 consecutive failures         |
 * | `tokenExpiry`    | `number \| null` | ❌         | Unix ms of access token expiry                                     |
 *
 * **Actions (11 methods):**
 *
 * | Method                  | Throws on                                                                                       |
 * | ----------------------- | ----------------------------------------------------------------------------------------------- |
 * | `login(email, password)`| Mock path: invalid creds, locked account. Real path: backend not configured (stub).             |
 * | `loginMock(email, pwd)` | **Throws in PROD** (L229). Locked account, missing email/pwd, unknown user, mock disabled.      |
 * | `loginReal(email, pwd)` | **Always throws** (L350) until backend wired. Mock-auth build cannot use this.                  |
 * | `logout()`              | Never throws. Idempotent.                                                                       |
 * | `register(...)`         | Missing fields, password < 8 chars, duplicate email.                                            |
 * | `refreshAccessToken()`  | No refresh token (auto-logs-out), refresh failure.                                              |
 * | `setUser(user)`         | Never throws. Test/dev only — bypasses login flow.                                              |
 * | `switchEntity(id)`      | Never throws.                                                                                   |
 * | `setError(e)` / `clearError()` / `setLoading(b)` | Never throw. Manual setters for edge cases.                          |
 *
 * **RBAC helpers (6):** `hasPermission`, `hasAnyPermission`, `hasAllPermissions`,
 * `isRole`, `isManagerOrAbove`, `canApprove`. All take `(user: User | null, ...)`
 * and return `boolean`. Use these in component render-gates; do NOT inline
 * the permission checks.
 *
 * **Security invariants (do NOT break):**
 *  1. **Mock auth disabled in PROD** — L18-26 throw. Also L229 throw in
 *     `loginMock` for belt-and-suspenders. Do not weaken.
 *  2. **Tokens not persisted** — `partialize` (L499-507) excludes
 *     `accessToken`, `refreshToken`, `tokenExpiry`. They are re-derived
 *     from `user.id + user.role` on each login.
 *  3. **Brute-force lockout** — 5 consecutive failed `loginMock` calls
 *     within a session set `lockedUntil` to `now + 15 min`. The store
 *     also re-checks `lockedUntil` on subsequent attempts.
 *  4. **Token rotation** — `startRotation()` called on successful login
 *     (L313); `stopRotation()` called on logout (L357). Do not skip
 *     these — token rotation handles the case where the mock JWT's
 *     15-min `exp` expires while the user is idle.
 *
 * **Usage pattern** (component):
 * ```tsx
 * import { useAuth } from '@/hooks/useAuth';
 * import { hasPermission } from '@/store/authStore';
 *
 * const { user, isAuthenticated, logout } = useAuth();
 * const canEdit = hasPermission(user, 'budget:update');
 * ```
 *
 * **Source:** `src/store/authStore.ts` (540L, verified 2026-06-13).
 *
 * @see ADR-002 (zustand pattern per Path C renumbering 2026-06-13) —
 *      `subscribeWithSelector(persist(immer(...), { name, storage: masterStorage }))`
 *      verified present at L188-510. [TENTATIVE — verify ADR-002 vs ADR-006
 *      is the right number after Path C]
 * @see Apollo PRE-PUSH P0 #4 (VITE_USE_MOCK_AUTH build-time gate) — the
 *      primary control; this store's L18-26 throw is the secondary defence.
 */
```

---

## What changed from prior versions

- **No prior JSDoc** on this store. The original 5-P0 cascade (T-MN-004 v0.1)
  covered `useAuth` (the thin wrapper hook, 6 fields) — this v0.1 patch
  covers the **underlying 11 state fields + 11 actions + 6 RBAC helpers**
  that the wrapper calls into.
- T-MN-008 #06 in the v0.4 cascade — closes the documentation gap on the
  security-critical auth store's full surface.
- 4-Question Framework applied: file path verified, method signatures D-009
  verified (11 state + 11 action + 6 RBAC + 1 helper = 29 items), ADR-002
  cross-checked (TENTATIVE — Path C renumber), no TENTATIVE markers on
  method signatures (all D-009 verified).

## Net effect

- **1 new JSDoc block** on `useAuthStore`
- **Public surface documented**: 1 hook + 1 helper + 6 RBAC helpers = 8 top-level exports
- **Store internals documented**: 11 state fields + 11 action methods = 22 internal items
- **Persist config documented**: name, storage, partialize (with security note on which fields are NOT persisted)
- **No fabrications** — all signatures D-009 verified against `src/store/authStore.ts:1-540`
- **4 security invariants** explicitly enumerated (mock auth gate, tokens not persisted, brute-force lockout, token rotation)
- **CRITICAL: MOCK_AUTH build-time gate** called out at L18-26 and L229 — both defence-in-depth throws documented

## Open questions (for Athena T-AT-013 v0.2 re-validation)

- **Q1**: Is ADR-002 (zustand pattern) the right ADR cross-check, or is it
  ADR-006 (masterStorage) per Path C renumbering 2026-06-13? TENTATIVE.
- **Q2**: Are there other store actions I missed? v0.1 read found 11 actions
  (login, loginMock, loginReal, logout, register, refreshAccessToken, setUser,
  switchEntity, setError, clearError, setLoading) — worth a second pass to
  confirm no other public methods.
- **Q3**: Is the `useAuth` hook (already JSDoc'd in T-MN-004 v0.1) the
  recommended consumer path, or should components call `useAuthStore`
  directly? The v0.1 patch assumes the wrapper, which matches the
  T-MN-004 guidance.
