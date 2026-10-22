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
