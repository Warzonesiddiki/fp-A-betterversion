# Role-Based Access Control (RBAC) Architecture

**Status:** short reference summary, rechecked 2026-11-11. Authoritative detail is
[`security.md`](security.md) §4 and the mission decision record DEC-103.

## Overview

RBAC exists at two layers that are **not** equivalent in strength. The shipped
desktop/browser client enforces RBAC in the client only; the optional Express
server has its own middleware. The client does not depend on the server for
authorization today, so client RBAC is a UI-integrity and mistake-prevention
control, **not** a security boundary against the local user.

## Layers (as implemented)

- **Client role catalogue.** `Permissions` in `src/utils/rbacEnforcer.ts`
  (94 strings) with grants in `ROLE_PERMISSIONS` (`src/store/authStore.ts`)
  across five roles: `Admin`, `FP&A_Manager`, `Analyst`, `Department_Head`,
  `Viewer`.
- **Client enforcement.** Store actions are wrapped with `enforce()` /
  `withRBAC()`, which throw `PermissionError` when
  `hasPermission(user, permission)` is false. Invariants are machine-checked by
  `src/store/rbacMatrixCompleteness.test.ts`, and denial behaviour by
  `src/store/rbacNegativeAuthorization.test.ts` (35 tests).
- **Server middleware.** `authMiddleware`, `requireRole`, `requireEntityAccess`
  and `requireEntityWriteAccess` live under `server/src/middleware/`. Entity-level
  roles are read from the `user_entity_access` table
  (`server/src/middleware/entityAuth.ts`). These are real implementations, but
  they protect the optional server API — not the local client's own data path.

## Boundaries and open items

- **Client-only enforcement (F-0016, open).** A user who edits `authStore` state
  in devtools can bypass client RBAC, because the data lives locally and there
  is no server in the write path.
- **Entity scope is not a shipped authorization rule.** The `user_entity_access`
  model exists server-side, while entity-scope authoring on the client remains
  unresolved against DEC-103's single-user product decision. The preceding
  claims of "granular entity-level permissions" enforced "across both client UI
  and server API endpoints" and of "zero reliance on client-side state
  manipulation" were not supported by the client code path.
- Server-side authorization is required before any multi-user or
  untrusted-user deployment. Current product decisions are single-user and
  local-first (DEC-004/DEC-103).
