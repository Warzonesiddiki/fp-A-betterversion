---
name: sqlite-and-server
description: >
  Use in `server/`: SQLite through Express with JWT, RBAC and tenancy. Small
  server, strict rules — it is the only place tenancy can be enforced.
group: engineering
---

# SQLite and the server

**Use when** a change touches `server/src`, a route, a migration or a query.

## Rules

1. **Every query is parameterised.** Template interpolation is a finding.
2. **Tenancy and role are checked per route**, from the token, not from the body.
3. **Transactions for multi-write operations**; a half-posted journal is worse than
   a failed request.
4. **Migrations are ordered, idempotent and never destructive** without a decision.
5. **No N+1**: one query per request, or a join; a loop of queries on 10k rows is a
   timeout waiting to happen.
6. **Errors do not leak internals** to the client; log the detail server-side with
   an id the client can quote.
7. **The server is not bundled** with the desktop app, and no `src/` module calls
   it today. Keep that true unless a decision says otherwise.
8. **Money on the wire** is decimal strings or integer minor units — never a JSON
   float — and the boundary conversion has one owner.

## In this repo

- `npm run architecture:guardrails` checks authorization, eval and inline SQL.
- Server tests are separate from the frontend suite; run them when touching
  `server/`.
- `npm run schema:equality` compares the relational schema with the store shapes it
  is supposed to back.

## Red flags

- `db.prepare(\`… ${id} …\`)`.
- A route that trusts `req.body.entityId` for scope.
- A migration that drops a column in the same release as the code change.

**Source:** original.

---

## 2026-11-11 review note (repository audit)

Verified against `server/` and `src/`. Rules 1–6 and 8 held on spot-check; rule 7 does not.

- **Rule 1 (parameterised queries) holds.** Two patterns look like interpolation but are not injection:
  `server/src/routes/budgets.ts:99-102` builds `WHERE ${conditions.join(' AND ')}` from *fixed* `'b.status = ?'` fragments with
  the values in `params`, and `:245-259` builds `SET ${key} = ?` from the keys of
  `UpdateBudgetSchema.safeParse(req.body)` — a Zod allowlist, not raw body keys. The red flag in this file
  (`db.prepare(\`… ${id} …\`)`) does not occur.
- **Rule 7 is false as written.** It says "the server is not bundled with the desktop app, and no `src/` module calls it today.
  Keep that true." `src/store/periodCloseStore.ts:417` **does** call it:
  ```ts
  fetch(`/api/periods/${encodeURIComponent(periodId)}/transition`, { method: 'POST', ... })
  ```
  inside the period-transition commit path, from an `if (typeof fetch === 'function')` guard — so it runs in every browser build, not
  only in a desktop shell. It sends **no `Authorization` header**, while `server/src/routes/periods.ts:10` mounts
  `router.use(authMiddleware)` and `server/src/middleware/auth.ts:32` answers **401** for a missing header. The `.catch(() => {})`
  swallows the rejection, so the failure is invisible and the local state machine silently covers for it.
  Net effect: the only client→server call in the app is **guaranteed to fail**, and the skill's claim that no such call exists is
  wrong. Treat rule 7 as "keep it true" — i.e. an aspiration violated by this one call site — rather than as a description.
- **Rule 2 is stronger than the route code alone.** `/api/periods` is scoped by `resolveTenantId` plus
  `filterByEntityAccess`, but the *client* side of the call carries no identity at all, so the tenancy check can never succeed for it.
- `npm run architecture:guardrails` exits 0 and does check authorization, eval and inline SQL — but it has **no rule about
  `src/` calling `/api/*`**, which is why rule 7's violation passes CI. That gap is recorded as AUD-120.
