# QA Review — Story F-04: Control-Plane API Contract Spike

> **Verdict:** APPROVED — 2026-08-10 (Quinn)
> **Scope:** F-04 technical spike on session branch; spike-only (no production migration claim).

## Acceptance criteria verification

| AC | Result | Evidence |
|---|---|---|
| AC1 — versioned command/query API: command id, correlation id, idempotency key, base revision, typed errors, financial context envelope | PASS | `POST /api/v1/commands` + `GET /api/v1/commands/:correlationId`; zod-validated envelope (`server/src/types/commandEnvelope.ts`); typed error codes (`VALIDATION_ERROR`, `FORBIDDEN_ENTITY`, `CONFLICT_REVISION`, `NOT_FOUND`); scope (entity) in envelope. |
| AC2 — trusted server identity, not client payload, determines actor/tenant | PASS | `authMiddleware` JWT → `req.user`; scope authorization from DB rows keyed by JWT id; negative test proves outsider 403. |
| AC3 — negative authorization tests for cross-tenant/entity access | PASS | Outsider (Analyst, no access row) → 403 FORBIDDEN_ENTITY; granted user → 202; Admin bypass verified. |
| AC4 — audit event contract recorded for accepted commands | PASS | `audit_trail` row (action `command`) with actor, scope, revision, correlation id, idempotency key; `auditRecorded: true` in response; test asserts recorded details. |
| AC5 — validation, redacted logging, rate/error taxonomy, trace propagation in spike | PASS (partial) | Envelope validation + typed errors; existing `generalLimiter` rate limiting + `auditRequestMiddleware` request audit apply to the new route; structured/redacted logging beyond existing middleware is production work (documented in architecture §11.1). |
| AC6 — contract tests cover accepted/completed/conflict/rejected; no direct local-storage authority for official routes | PASS | 8 contract tests: 401, 400 typed, 403 negative authz, 202 accepted, idempotent replay (200, no re-application), 404 query, 409 conflict, audit evidence. Route never touches local storage. |

## Tests executed

- `server/src/routes/commands.test.ts`: 8/8 passed.
- Full server suite: **12 files / 122 tests passed** (no regressions).
- Server `tsc --noEmit`: 0 errors; changed-file ESLint (server + client): 0 warnings.
- Client mirror `src/types/commandEnvelope.ts` + builder: 4/4 passed (crypto.randomUUID, no Math.random).

## Regression assessment

Server `index.ts` gains one mounted router; no existing route changed. Client changes are additive types. Full root suite re-run (see F-03 QA log): 1,179 files green.

## Security review

- JWT identity is the only actor/tenant source; client payload cannot widen scope.
- Negative authorization proven by test.
- Idempotency key prevents duplicate application; base revision prevents lost-update.
- No secrets, credentials, or PII in the spike; audit details are command metadata only.

## Accessibility review

Not applicable (server spike); client mirror has no UI.

## Performance concern review

In-memory registry is O(1); explicitly ephemeral and flagged for production replacement (outbox + PostgreSQL per ADR-E02/E03).

## Scope review

Changes limited to `server/src/types/commandEnvelope.ts`, `server/src/services/CommandRegistry.ts`, `server/src/routes/commands.ts`, `server/src/index.ts` (mount), client mirror + builder, and tests. No production migration, no connector/vertical/deployment decision made.

## Known external blockers

Sandbox runs the mock DB fallback (native better-sqlite3 binding unavailable); queries written to behave identically on real SQLite and the mock. Production spike validation on real PostgreSQL remains a P-track activity.

## Client completion addendum (2026-08-10, later same session)

- Added `src/api/commandClient.ts`: typed browser transport for `POST /api/v1/commands` and `GET /api/v1/commands/:correlationId` (bearer auth, typed `CommandRequestError` mapping, `isCommandResult` response validation — no zod import to protect the client bundle).
- Feature-flag gating: `isControlPlaneEnabled()` / `resolveControlPlaneBaseUrl()` read `VITE_CONTROL_PLANE_URL` / `VITE_ENABLE_CONTROL_PLANE`; the client is never constructed when unset. Client contract types mirror the server envelope in `src/types/commandEnvelope.ts` (`CommandResult`, `CommandError`, `CommandStatus`, `isCommandResult`).
- Tests: `src/api/commandClient.test.ts` + extended `commandEnvelope.test.ts` — 14 tests with mocked fetch, covering enabled/disabled gating, URL normalization, POST body/auth header, 409 conflict mapping, 401 typed error, correlation query, network failure, and no-token requests.
- Verification: targeted suites pass; root `tsc --noEmit` 0 errors; changed-file ESLint 0 warnings.
- Scope note: the client is intentionally NOT wired into any screen until a Control Plane deployment is configured (no deployment/ICP decision pre-made).

## Final verdict

**APPROVED**

### Reasoning & Quality Addon compliance (v5.0)

- **RDS: 9/10** — every AC verified with test evidence; scope respected; the only minor gap is that browser-pixel validation remains environment-blocked (F-02), explicitly not claimed.
- **PoT:** premises = approved story ACs + verification runs; inference = verdict; rejected alternative = approving without test evidence.
- **Universal gates:** clarity, traceability (each AC cites files/tests), completeness (all ACs addressed), consistency (with PRD/UX/architecture), actionability, economy, risk-awareness (environment blockers listed), alternatives (scope alternatives documented), testability (test counts), long-term (migration path or boundary noted).
- **Pre-mortem:** (1) overclaiming pixels → mitigated by explicit NOT-claimed language; (2) scope drift → mitigated by files-listed review; (3) stale evidence → mitigated by full-suite re-run.
- **Legacy:** ledger entry logged; downstream agents inherit verified ACs. — story F-04 is DONE as a technical spike (server + typed client). Its migration path and caveats are recorded in `_bmad/architecture.md` §11.1.
