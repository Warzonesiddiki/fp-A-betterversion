<!-- DRAFT v0.2 — ground-truth corrected 2026-06-12 — Mnemosyne -->

# JSDoc draft — `src/hooks/useAuth.ts` (v0.2, corrected)

> **Ground-truth note (2026-06-12)**: v0.1 of this draft had signature drift
> from the real source (invented `error`/`refresh`/`hasRole` fields, used an
> arrow function instead of a function declaration, omitted `switchEntity`).
> v0.2 matches the actual 6-line source verbatim. Apollo: when staging, paste
> this JSDoc **above** the existing `import` line, NOT below it — the hook
> file is small enough that the JSDoc should be the very first thing.

---

## Current source (verbatim, 6 lines)

```ts
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, switchEntity } = useAuthStore();
  return { user, isAuthenticated, isLoading, login, logout, switchEntity };
}
```

## Proposed JSDoc to paste above the `import`

```ts
/**
 * Thin selector hook over {@link useAuthStore} that exposes the six fields
 * a component typically needs for auth-gated rendering. Prefer this over
 * importing `useAuthStore` directly so the public auth surface stays
 * stable when the store grows new internal slices (refresh, error, etc.).
 *
 * **Returns** — a stable object (same reference per call as long as the
 * underlying store does not change) with the following keys:
 *
 * | Key               | Type                                      | Notes                          |
 * | ----------------- | ----------------------------------------- | ------------------------------ |
 * | `user`            | `User \| null`                            | Current authenticated user     |
 * | `isAuthenticated` | `boolean`                                 | `user !== null`                |
 * | `isLoading`       | `boolean`                                 | True during login / hydration  |
 * | `login`           | `(credentials) => Promise<void>`          | See {@link useAuthStore}       |
 * | `logout`          | `() => Promise<void>`                     | Clears session + persisted slice |
 * | `switchEntity`    | `(entityId: string) => Promise<void>`     | Multi-entity context switch    |
 *
 * **Why a wrapper?** Two reasons:
 *  1. **Surface stability** — internal store fields (refresh, error, MFA, etc.)
 *     can change without breaking every call site.
 *  2. **Mock vs real auth** — `useAuthStore` reads `VITE_USE_MOCK_AUTH` at
 *     build time; this hook inherits that behavior transparently.
 *
 * @returns A 6-key object destructured from {@link useAuthStore}.
 *
 * @example
 * // Route guard
 * function ProtectedPage() {
 *   const { isAuthenticated, isLoading } = useAuth();
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <Navigate to="/login" replace />;
 *   return <Dashboard />;
 * }
 *
 * @example
 * // Header with entity switcher
 * function EntityMenu() {
 *   const { user, switchEntity } = useAuth();
 *   if (!user) return null;
 *   return (
 *     <Select onChange={(id) => switchEntity(id)}>
 *       {user.entities.map((e) => <Option key={e.id}>{e.name}</Option>)}
 *     </Select>
 *   );
 * }
 *
 * @example
 * // Logout button
 * function LogoutButton() {
 *   const { logout } = useAuth();
 *   return <Button onClick={() => void logout()}>Sign out</Button>;
 * }
 *
 * @see {@link useAuthStore} — the underlying zustand store
 * @see ADR-002 — Zustand middleware pattern (this hook is a consumer, not a store)
 * @see ADR-005 — Why auth state lives in `masterStorage` (via persist)
 */
```

## What changed from v0.1

| v0.1 (WRONG)                                                                                | v0.2 (correct)                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `const useAuth = () => useAuthStore();` (arrow)                                             | `function useAuth() { ... }` (declaration)                                      |
| Returned 8 keys: `user, isAuthenticated, isLoading, error, login, logout, refresh, hasRole` | Returns 6 keys: `user, isAuthenticated, isLoading, login, logout, switchEntity` |
| Invented `error`, `refresh`, `hasRole`                                                      | Removed — none exist on the real hook                                           |
| Missing `switchEntity`                                                                      | Added — real hook exposes it for multi-entity                                   |
| @example used `error.message`                                                               | @example uses only real return keys                                             |
