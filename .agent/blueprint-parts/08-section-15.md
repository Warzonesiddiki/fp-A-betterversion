# SECTION 15 — API SPECIFICATION

## 15.1 API principles

```
AP1  The API is the product surface. The UI is one client among several
     (web, desktop, Excel add-in, partner integrations). No privileged client.
AP2  Commands are idempotent. Every mutating call carries an Idempotency-Key.
AP3  Reads are governed. Every read passes the RLS predicate (PC4). No bypass.
AP4  Contracts are typed end-to-end. Zod schemas generate both runtime validation
     and the OpenAPI document. The spec cannot drift from the code.
AP5  Money crosses the wire as a decimal STRING with a currency code, never as a
     JSON number. A JSON number for money is a build failure (RULE D1).
AP6  Errors use the registry (F-ERR-001): stable code, message, remediation, correlation id.
AP7  Versioned: /v1. Breaking changes require a new version and a deprecation window.
AP8  Every response carries the correlation id used for tracing and audit.
```

## 15.2 Resource surface (v1)

```
POST   /v1/auth/login                      OIDC/SAML/password + MFA
POST   /v1/auth/refresh                    rotating refresh token
POST   /v1/auth/logout
GET    /v1/me                              identity, roles, entitlements

GET    /v1/tenants/:id                     tenant config
GET    /v1/environments                    dev | uat | prod
POST   /v1/environments/:id/promote        governed promotion (Part XL)

GET    /v1/entities                        hierarchy, SCD2-aware (?asOf=)
POST   /v1/entities
GET    /v1/accounts                        COA, ?asOf=
POST   /v1/accounts/bulk                   validated bulk upsert
GET    /v1/dimensions/:code/members        ?asOf= &status=
POST   /v1/dimensions/:code/members/merge  MDM merge with survivorship record

GET    /v1/periods                         calendar, status
POST   /v1/periods/:id/close               7-step protocol, irreversible
POST   /v1/periods/:id/reopen              admin + reason + audit

GET    /v1/books                           MGMT | IFRS | LOCAL_xx | TAX
GET    /v1/scenarios
POST   /v1/scenarios                       create / branch
POST   /v1/scenarios/:id/lock              immutable thereafter
GET    /v1/scenarios/:a/compare/:b         typed delta

GET    /v1/facts                           governed query (see 15.3)
POST   /v1/facts:batch                     command; validated; reconciled; audited
GET    /v1/facts/:id/lineage               upstream + downstream graph

GET    /v1/metrics                         governed metric catalog
POST   /v1/metrics                         propose (maker)
POST   /v1/metrics/:id/certify             checker; version bump
GET    /v1/metrics/:id/versions

POST   /v1/calc/run                        scenario recalc; returns job id
GET    /v1/jobs/:id                        progress, cancellable
POST   /v1/consolidate                     entity set + period + book

GET    /v1/reports
POST   /v1/reports/:id/render               → snapshot id
GET    /v1/snapshots/:id                    reproducible artefact
POST   /v1/exports                          format + scope; audited

GET    /v1/workflows/:code/instances
POST   /v1/workflows/instances/:id/transition   event + reason

GET    /v1/integrations
POST   /v1/integrations/:id/sync
GET    /v1/integrations/:id/reconciliation/:syncId
GET    /v1/integrations/:id/dlq
POST   /v1/integrations/:id/dlq/:itemId/replay

GET    /v1/audit                            filtered, paginated, never mutable
GET    /v1/audit/verify                     hash-chain integrity check

GET    /v1/fx/rates                         ?period= &type=
POST   /v1/fx/rates                         board-approved rate publication

POST   /v1/ai/query                         NL → structured query (redaction-gated)
POST   /v1/ai/narrative                     draft commentary (redaction-gated)
GET    /v1/health                           liveness, readiness, dependency status
```

## 15.3 The governed query endpoint

`GET /v1/facts` is the single read path for financial data. It accepts a structured query
(entity set, account set, period range, scenario, book, dimension filters, metric
expressions, grain) and returns facts or aggregates. It:

1. resolves the caller's RLS predicate and injects it — unconditionally;
2. applies field masking before serialisation;
3. estimates cost and rejects over-budget queries (QP2);
4. paginates by keyset (QP3);
5. returns amounts as decimal strings with currency (AP5);
6. includes `lineage_node_id` on every returned fact;
7. logs the query shape (never the values) for observability.

## 15.4 Command semantics

Every mutating endpoint is a command with: an `Idempotency-Key` header (replay returns the
original result, never a duplicate write), a `version` for optimistic concurrency (CL3),
server-side validation via Zod, a policy check, a period-lock check, a maker-checker
check, three-statement validation where applicable (TS4), an audit write, a lineage write,
and an outbox event. **Any of these failing rolls back the entire command.** Partial
application is banned.

## 15.5 Errors

```jsonc
{
  "error": {
    "code": "OMNI-PERIOD-0201",
    "message": "Period 2026-03 is closed; posting rejected.",
    "remediation": "Post an adjusting entry to the next open period, or request a reopen from a controller.",
    "severity": 2,
    "correlationId": "0f2c...",
    "details": { "periodId": "...", "closedAt": "2026-04-05T09:12:00Z" },
  },
}
```

HTTP mapping: 400 validation, 401 unauthenticated, 403 policy/SoD denial, 404 not found
**or not permitted** (never leak existence), 409 conflict/version stale, 422 business-rule
violation, 429 rate limit, 500 unexpected (always with a correlation id), 503 dependency
unavailable.

## 15.6 Rate limiting, quotas, and pagination

Per-tenant and per-user token buckets, with separate budgets for reads, commands, exports,
and AI calls. Quotas are visible to the tenant admin. Pagination is keyset-based with an
opaque cursor and a documented maximum page size. Bulk endpoints stream with backpressure.

## 15.7 Webhooks & public API

Outbound webhooks are delivered from the outbox with signature (HMAC), retries with
backoff, and a DLQ. Subscribable events include: period closed, scenario locked, forecast
published, approval completed, metric certified, integration sync completed or failed,
three-statement violation detected. The public API (Phase 3) is the same `/v1` surface with
scoped API keys, documented in an OpenAPI spec generated from the Zod schemas — never
hand-written, because hand-written specs lie.
