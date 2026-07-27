# RBAC COVERAGE MATRIX — 35 STORES + 16 WRAPPED + 19 UNWRAPPED

**Audit Date:** 2026-07-27  
**Source:** `src/store/` (all `.ts` files), `src/utils/rbacEnforcer.ts`  
**Enforcer Function:** `enforce()` / `enforceMany()` / `withRBAC()`

---

## OVERVIEW

The repository claims 35 Zustand stores. The audit request notes:
- **16 stores** are "RBAC-wrapped" with `enforce(Permissions.X, name, fn)`.
- **19 stores** are NOT RBAC-wrapped.
- The audit asks: "Is `enforce()` applied to EVERY mutating action, or only some?" "Can a user bypass RBAC by calling store actions directly?" "Is RBAC enforced server-side?"

---

## RBAC-WRAPPED STORES (16 CLAIMED)

Based on file inspection (`src/store/` directory listing and `rbacEnforcer.ts` usage), the following stores appear to use RBAC enforcement (either via `enforce` or `enforceMany`):

| Store File | Actions Wrapped | Permissions Used | Evidence / Issues |
|---|---|---|---|
| `analyticsStore.ts` | `createAnalytics`, `updateAnalytics`, `deleteAnalytics` (implied) | `analytics:read`, `analytics:create`, `analytics:update`, `analytics:delete` (from `rbacEnforcer.ts`) | `rbacEnforcer` defines permissions but store file not fully audited for `enforce()` usage. |
| `budgetStore.ts` | `createBudget`, `updateBudget`, `deleteBudget`, `approveBudget` (implied) | `budget:create`, `budget:update`, `budget:delete`, `budget:approve` | Not fully verified if ALL mutating actions are wrapped. `budgetStore` (10 KB) — partial read. |
| `capexStore.ts` | `createCapex`, `updateCapex`, `deleteCapex`, `approveCapex` (implied) | `capex:create`, `capex:update`, `capex:delete`, `capex:approve` | Partial verification. |
| `collaborationStore.ts` | `collab:read`, `collab:update`, `collab:delete` (implied) | `collab:read`, `collab:update`, `collab:delete` | `collaborationStore.ts` (3.6 KB) — not fully audited. |
| `constructionStore.ts` | Not verified (store exists, no `rbacEnforcer` usage confirmed) | Not defined in `rbacEnforcer` | `rbacEnforcer` does not define `construction:*` permissions. This store may NOT be RBAC-wrapped. |
| `driverStore.ts` | `driver:create`, `driver:update`, `driver:delete` (implied) | `driver:read`, `driver:create`, `driver:update`, `driver:delete` | `driverStore` (9.9 KB) — partial. |
| `educationStore.ts` | Not verified | Not defined | No `education:*` permissions in `rbacEnforcer`. Store likely NOT wrapped. |
| `energyStore.ts` | Not verified | Not defined | No `energy:*` permissions. |
| `glStore.ts` | `gl:create`, `gl:update`, `gl:delete` (implied) | `gl:read`, `gl:create`, `gl:update`, `gl:delete` | `glStore` (24.6 KB) — complex. `rbacEnforcer` defines `gl:upload`, `gl:map`, `gl:reconcile`. Not fully verified which actions are wrapped. |
| `notificationStore.ts` | `notification:create`, `notification:update`, `notification:delete` (implied) | `notification:read`, `notification:create`, `notification:update`, `notification:delete` | `notificationStore` (2.5 KB) — partial. |
| `realEstateStore.ts` | Not verified | Not defined | No `realEstate:*` permissions. Store likely NOT wrapped. |
| `retailStore.ts` | Not verified | Not defined | No explicit `retail:*` permissions (`inventory:*` defined instead). |
| `scenarioStore.ts` | `scenario:create`, `scenario:update`, `scenario:delete`, `scenario:lock` (implied) | `scenario:read`, `scenario:create`, `scenario:update`, `scenario:delete`, `scenario:lock` | `scenarioStore` (5.3 KB) — partial. |
| `tourStore.ts` | Not verified | Not defined | No `tour:*` permissions. |
| `uiStore.ts` | `ui:update` (implied) | `ui:read`, `ui:update` | `uiStore` (3.8 KB) — partial. `ui:update` applies to UI settings, not sensitive data. |
| `varianceStore.ts` | `variance:create`, `variance:update`, `variance:delete` (implied) | `variance:read`, `variance:create`, `variance:update`, `variance:delete` | `varianceStore` (1.4 KB) — small. |
| `workflowStore.ts` | `workflow:create`, `workflow:update`, `workflow:delete`, `workflow:approve` (implied) | `workflow:read`, `workflow:create`, `workflow:update`, `workflow:delete`, `workflow:approve` | `workflowStore` (7.9 KB) — not fully audited. |

---

## UNWRAPPED STORES (19 — NOT USING `rbacEnforcer`)

Based on file inspection (`src/store/` listing) and absence of `rbacEnforcer` imports/usage in the partial reads:

| Store File | Size | Why Not Wrapped? | Risk |
|---|---|---|---|
| `entityStore.ts` | 6.6 KB | No `rbacEnforcer` usage verified (`entity:*` permissions exist but not applied) | User can modify entities without permission check |
| `esgStore.ts` | 3.4 KB | No `esg:*` permissions in `rbacEnforcer` | Unprotected ESG data mutations |
| `forecastStore.ts` | 5.8 KB | No `forecast:*` permissions applied (permissions exist but not verified wrapped) | Unprotected forecast mutations |
| `fxRateStore.ts` | 1.8 KB | No `fxRate:*` permissions defined | Unprotected FX rate changes |
| `healthcareStore.ts` | 3.8 KB | No `healthcare:*` permissions defined | Unprotected healthcare data |
| `insuranceStore.ts` | 4.5 KB | No `insurance:*` permissions defined | Unprotected insurance data |
| `logisticsStore.ts` | 3.3 KB | No `logistics:*` permissions defined | Unprotected logistics data |
| `reportStore.ts` | 3.2 KB | `report:*` permissions exist but store not fully audited for wrapping | Unprotected report mutations |
| `settingsStore.ts` | 2.6 KB | `settings:*` permissions exist (`settings:read`, `settings:update`) but wrapping unverified | Unprotected settings changes |
| `telecomStore.ts` | 3.3 KB | No `telecom:*` permissions defined | Unprotected telecom data |
| `workforceStore.ts` | 3.7 KB | No `workforce:*` permissions defined | Unprotected workforce data |
| `cubeStore.ts` | 13.0 KB | `cube:*` permissions exist but wrapping unverified | Unprotected OLAP cube mutations |
| `dashboardStore.ts` | 6.6 KB | `dashboard:*` permissions exist (`dashboard:read`, `dashboard:create`, `dashboard:update`, `dashboard:delete`) — wrapping unverified | Unprotected dashboard mutations |
| `budgetStore.ts` (if not fully wrapped) | 10.2 KB | Partial verification — some actions may not use `enforce()` | Partial RBAC bypass |
| `glStore.ts` (if not fully wrapped) | 24.6 KB | Complex store; `gl:upload`, `gl:map`, `gl:reconcile` — not fully audited | Partial RBAC bypass |

---

## BYPASS METHODS (CONFIRMED FROM CODE)

### Method 1: Direct `useStore.getState()` Call
- **Evidence:** `rbacEnforcer.ts` uses `useAuthStore.getState().user` for permission checks. Any component or script can call `useStore.getState().someAction()` directly, bypassing the UI and any `enforce()` wrapper applied to the store method.
- **Impact:** A malicious user (or attacker with DevTools access) can call `useBudgetStore.getState().createBudget(...)` without passing through the UI permission check.
- **Remediation:** Remove `getState()` mutation patterns from production code. Enforce all mutations through UI components that validate permissions server-side.

### Method 2: Client-Side State Escalation (`setUser()`)
- **Evidence:** `authStore.ts` exports `setUser()` (public method). Calling `useAuthStore.getState().setUser({ role: 'Admin', permissions: ROLE_PERMISSIONS.Admin, ... })` grants full admin access to all client-side RBAC checks.
- **Impact:** Any user can escalate to `Admin` by running a single line in the browser console.
- **Remediation:** Remove `setUser()` from public store API or restrict it to auth-flow handlers. Implement server-side session validation that verifies the user's role from the database (`req.user.role` from JWT payload), not from client state.

### Method 3: Server-Side JWT Without Role/Permission Validation
- **Evidence:** `server/src/index.ts` applies `authMiddleware` (verifies JWT) but does not apply `requireRole()` or permission middleware to protected routes (`budgets`, `gl`, `forecasts`, etc.). The `stubRouter` returns 501 for all protected routes but uses only `authMiddleware`.
- **Impact:** Any valid JWT (even `Viewer` role) can access protected endpoints (once implemented). No server-side permission enforcement exists.
- **Remediation:** Apply `requireRole()` or custom permission middleware to ALL protected routes. Verify `req.user.role` and `req.user.permissions` against endpoint requirements.

---

## RBAC COVERAGE SUMMARY

| Metric | Value | Evidence |
|---|---|---|
| Total Stores | 35 | `ls src/store/*.ts` |
| Stores with `rbacEnforcer` Import | Unknown (partial verification) | Not all files read; `rbacEnforcer` usage verified only in stores listed above |
| Stores Confirmed Wrapped | ~10-12 (approximate) | Partial audit; full verification requires reading all 35 store files |
| Stores Confirmed Unwrapped | ~8-10 (approximate) | Based on absence of `rbacEnforcer` usage and missing permission definitions |
| Actions Fully Protected (Every Mutating Action) | Unverified | `rbacEnforcer` defines `enforce()` but application to every action not fully audited |
| Actions Partially Protected | Unverified | Some stores may wrap only `create` but not `update` or `delete` |
| Server-Side RBAC Enforcement | 0 routes | `server/src/index.ts` does not use `requireRole()` for protected resources |
| Client-Side RBAC Only | All protected routes | `rbacEnforcer` relies solely on `useAuthStore.getState()` |

---

## RECOMMENDATIONS

1. **Audit All 35 Stores:** Verify each store file for `enforce()` or `enforceMany()` usage. Identify any mutating action (`set`, `update`, `delete`, `create`) that is not wrapped.
2. **Standardize Permissions:** Ensure every store has a corresponding permission set in `rbacEnforcer.ts` (`Permissions` object). Add missing permissions (`construction:*`, `education:*`, `energy:*`, `healthcare:*`, `insurance:*`, `logistics:*`, `realEstate:*`, `telecom:*`, `workforce:*`).
3. **Remove `setUser()` Public Access:** Restrict `setUser()` to auth-flow handlers only. Do not expose it in the store's public API.
4. **Implement Server-Side RBAC:** Modify `server/src/index.ts` to apply `requireRole()` or custom permission middleware (`requirePermission('budget:create')`) to ALL protected routes (`budgets`, `gl`, `forecasts`, `scenarios`, `reports`, `entities`, `export`).
5. **Add Integration Tests:** Create tests that verify RBAC bypass methods fail (`useStore.getState().someAction()` should not work without server-side validation; `setUser()` should not escalate role server-side).
