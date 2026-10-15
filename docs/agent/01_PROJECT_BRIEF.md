# 01 — Project brief

## The product, honestly

**Ambition (owner-stated):** an all-in-one FP&A workspace that becomes the
owner's trusted one-stop solution.

**The workflow that exists today (owner-stated, Known):** every month the
owner exports a General Ledger dump from Microsoft Dynamics 365, performs
FP&A work on it, and highlights abnormalities and potentially incorrect
entries by hand.

**What the product must therefore do first (plan of record, Gate 2 in
`docs/discovery/roadmap.md`):**

```text
D365 GL export (CSV/XLSX)
  → import: schema validation, file hash, batch id, per-row rejection reasons,
    atomic commit, control totals, source-row provenance        [partially built]
  → period scope: which period/entity/currency this batch covers [partially built]
  → trial balance tie-out and statement views with drill-to-source [TB exists; drill open]
  → exception review: versioned rules → findings with evidence → human disposition [not built]
  → board outputs: Excel / PDF / (PPT) that tie out to the screen   [Excel/PDF exist, no tie-out test]
```

Everything else in the codebase — 18 sector dashboards, consolidation,
collaboration, plugins, AI copilots, 9 ERP connectors — is **out of scope
until the spine above works end-to-end on a synthetic D365 file and the
owner has validated it.** Do not extend it; do not delete it without the
owner's decision (DEC-006 covers documents; code archival is a separate
decision to raise).

## Who uses it

- **Primary:** the owner, an FP&A practitioner doing month-end review.
  Single user, single company, one currency as far as we know (Q7/Q10 in
  `docs/discovery/current-workflow.md` are unanswered).
- **Secondary (future, undecided):** reviewers/approvers; see DEC-004.

## Non-goals for v1 (until the owner says otherwise)

- No cloud sync, no multi-tenant login, no real-time collaboration.
- No ERP write-back; the GL is read-only input.
- No consolidation / FX translation in the first spine.
- No AI that computes or posts numbers. AI may draft commentary only from
  approved, verified facts (AI-001) and is deferred.
- No new industry packs, dashboards, or connectors.

## What is true right now (measured 2026-10-15)

| Area               | Truth                                                                                                                                                                                    | Where measured                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Build & gates      | `tsc`, `eslint`, `prettier`, full suite (8 shards) green on the working branch                                                                                                           | `npm run check`                                     |
| CI on `main`       | red since 2026-08-20 (E2E job has no timeout); fix is in `ci-patches/`, needs a human                                                                                                    | `gh run list`                                       |
| Import             | CSV/XLSX via `GLUploadPage` → `importGLData`. SHA-256 idempotency, atomic on validation errors, per-row rejections, provenance, control totals, scope — on the branch                    | `glStore.provenance.test.ts`                        |
| Export contract    | none: no agreed D365 column dictionary, no synthetic sample                                                                                                                              | DEC-001 open                                        |
| Persistence        | whole Zustand stores as encrypted JSON blobs in one `stores(id,value)` table; 35-table relational schema unused by the client                                                            | `src/utils/masterStorage.ts`, `08_DATA_MODEL.md`    |
| Server             | Express/SQLite with JWT+RBAC exists; the GL store has a commit client (`src/sdk/`) but it is unconfigured by default and nothing else calls the server; not bundled with the desktop app | `02_ARCHITECTURE.md`                                |
| Auth offline       | production build refuses mock auth and real auth needs the server → desktop cannot sign in offline                                                                                       | DEC-004 open                                        |
| Money              | `src/utils/money.ts` correct; domain types still `number`; adoption 28.9 %                                                                                                               | `money:adoption`                                    |
| Determinism        | 518 wall-clock/random sites in calculation paths, ratcheted per file                                                                                                                     | `determinism:ratchet`                               |
| Engines            | 182 engine modules; 95 reachable from runtime, 87 orphaned                                                                                                                               | `verify-readme-stats.mjs --list`                    |
| Exceptions         | anomaly services exist, unwired; no rule catalogue, finding key, or disposition                                                                                                          | `09_KNOWN_GAPS.md`                                  |
| Dynamics connector | targets Dataverse CRM entities, not F&O/BC GL; unwired                                                                                                                                   | `src/services/api-integration/DynamicsConnector.ts` |

## Open decisions that gate work (owner)

| ID      | Decision                                                     | Blocks                                                                   |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| DEC-001 | First supported D365 export shape (product, columns, sample) | export contract, atomic policy, control-total comparison, rule catalogue |
| DEC-002 | First FP&A view / exception use case                         | which statement view and which rules first                               |
| DEC-003 | Data storage and external-service/AI policy                  | Sentry/PWA/LLM flags, retention                                          |
| DEC-004 | Authentication and offline model                             | login, RBAC, server role                                                 |
| DEC-005 | Store of record (blob vs relational SQLite vs server)        | queries, drill-down, schema tests                                        |
| DEC-006 | Plan-of-record documents (archive the rest)                  | repository hygiene                                                       |

Ask for these explicitly; never resolve them implicitly in code.

## Success looks like (first working week, from the roadmap)

A synthetic D365 export imports with a visible batch record; every row is
accepted with provenance or rejected with a reason; control totals tie to the
source; the trial balance balances; one agreed exception rule produces
findings with evidence; the owner can mark a finding reviewed with a note
that survives reload; and `npm run check` is green with no claim in any doc
that a script cannot back.
