# Reasoning Ledger — FinPlan Pro (BMAD v5.0)

> **Established:** 2026-08-10 (v5.0 method upgrade) · **Purpose:** The project's permanent intellectual record. Every meaningful decision is logged with its DRP summary, confidence score, and autonomy level. Required reading for any agent inheriting ambiguous state.
> **Rule:** Every A5 decision logs full rationale; every A3/A2/A1 decision logs the reasoning and the human's response. Entries are append-only.

## Backfilled entries (2026-08-10 session history)

## Ledger Entry #1 — 2026-08-10 — Rex/System

### Decision/Topic: Adopt BMAD v5.0 ULTRA-YOLO as the project operating method (owner direction)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Owner provided the v5.0 ULTIMATE prompt and directed: upgrade the working style, restart from step 1, update existing work to the new standard, continue. Root need: preserve the research-first, zero-compromise foundation while adding self-governed execution (DRP + reasoning ledger + autonomy matrix).                                                                                            |
| Evidence               | v4.0 charter, path-lock, and all artifacts exist and are hypothesis-approved (G0–G5). v5.0 preserves the same phases/gates/agents and adds the reasoning engine; no artifact contract is invalidated.                                                                                                                                                                                                    |
| Options Considered     | (a) Rewrite all artifacts to v5 template wholesale — rejected: churn without value; v5 adds process, not new product decisions. (b) Create v5 charter + reasoning ledger + autonomy tracker, supersede v4, backfill ledger, keep existing artifacts — ADOPTED: upgrades the operating system without destabilizing approved content. (c) Ignore v5 and continue v4 — rejected: explicit owner direction. |
| Risk Probe             | Risk: ledger backfill could misrepresent past decisions. Mitigation: entries record what was actually done with evidence links. Risk: reference churn breaks docs-link-check. Mitigation: keep v4 file as historical; update the single project-context reference; re-run strict link check.                                                                                                             |
| Consequence Projection | Immediate: new charter + ledger + autonomy tracker committed. Downstream: every future decision appends a ledger entry; escalation triggers are repo-mapped; existing path-lock and gates remain authoritative.                                                                                                                                                                                          |
| Confidence Score       | 92%                                                                                                                                                                                                                                                                                                                                                                                                      |
| Autonomy Level         | A5 — FULL YOLO (owner-directed, reversible via artifact edits)                                                                                                                                                                                                                                                                                                                                           |

### Adopted Path:

v5.0 charter (`_bmad/BMAD_V5_OPERATING_CHARTER.md`), v4 superseded in place, reasoning ledger established, project-context gains Autonomy Tracker + Ledger Reference.

### Rejected Alternatives:

Wholesale v5 template rewrite of every artifact (churn, no added decision value); continue v4 (ignores owner direction).

### Open Items:

None.

## Ledger Entry #2 — 2026-08-10 — Rex

### Decision/Topic: Record CI failure root cause as GitHub account billing block (E-005), not a code regression

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Why is CI red on merged main? Question required a verifiable root cause before any "fix".                                                                                                                                                                                                                                                                                         |
| Evidence               | GitHub check-run annotations on every failed job (CI, tsc, lint, test-unit, build, deploy, cascade-hold, sentry-self-test): "The job was not started because recent account payments have failed or your spending limit needs to be increased." Failures predate PR #53 on other commits; jobs complete in seconds with zero steps; logs unretrievable (EOF) because nothing ran. |
| Options Considered     | (a) Treat as code regression and debug the build — rejected: no job ever started; zero steps prove no code executed. (b) Treat as environment/billing issue and document — ADOPTED. (c) Ignore — rejected: silent state change.                                                                                                                                                   |
| Risk Probe             | Risk: owner assumes PR #53 broke CI. Mitigation: evidence recorded in `_bmad/qa/ci-actions-billing-block-2026-08-10.md` with run IDs and annotation text.                                                                                                                                                                                                                         |
| Consequence Projection | Owner action required (Billing & plans); CI status must not be treated as code evidence until jobs run.                                                                                                                                                                                                                                                                           |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                               |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                                                                                                                |

### Adopted Path:

Dedicated QA note + project-context §CI status + evidence-log E-005.

### Rejected Alternatives:

Code-level CI debugging (no steps ever ran); silent acceptance of red CI.

## Ledger Entry #3 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: Implement F-03 (Financial Context + Atlas Shell) with typed contract, URL serialization, five-pillar navigation, permission filtering

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | PRD E1 requires context (Scope→Time→Version→Currency→Freshness) to be typed, visible, serializable, permission-aware, and server-filtered for official views.                                                                                                                                                                                                    |
| Evidence               | UX §4.1 contract; ROLE_PERMISSIONS matrix exists; Atlas foundations merged (PR #53).                                                                                                                                                                                                                                                                             |
| Options Considered     | (a) Full five-pillar shell with route migration — rejected: pre-decides navigation/UX beyond safe foundation. (b) Typed context + context bar + role-filtered sidebar reusing existing routes + legacy group — ADOPTED: preserves all destinations, adds pillar semantics without direction change. (c) Context store only — rejected: leaves UX contract unmet. |
| Risk Probe             | Risk: sidebar restructure breaks existing tests — mitigated: updated both Sidebar test files to pillar structure; all destinations preserved in pillars or Legacy group. Risk: URL serialization loops — mitigated: replace-only writes + equality guard.                                                                                                        |
| Consequence Projection | Enables F-04 envelope sharing and context-aware pilot screens; no ICP/connector/vertical decision made.                                                                                                                                                                                                                                                          |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                              |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                                                                                               |

### Adopted Path:

`src/types/financialContext.ts`, `financialContextStore`, `FinancialContextBar`, `navigation.ts`, `usePillarNavigation`, Sidebar/AppLayout updates; 50 targeted tests; QA APPROVED.

### Rejected Alternatives:

Full shell migration (direction change); store-only (contract unmet).

## Ledger Entry #4 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: F-04 Control-Plane spike — typed command envelope server + in-memory registry, idempotency, base revisions, negative authorization, audit evidence

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Prove the authoritative command boundary as a spike before any production migration: typed envelope, trusted-actor scope, idempotency, concurrency (revisions), audit.                                                                               |
| Evidence               | Architecture §§3/6; existing auth/entityAuth middleware + AuditService + audit_trail schema; ADR-E02/E03.                                                                                                                                            |
| Options Considered     | (a) Production-grade PostgreSQL implementation — rejected: beyond spike scope, no deployment decision made. (b) In-memory spike with explicit ephemerality + migration path — ADOPTED. (c) No spike — rejected: A-04/A-05 stay untested technically. |
| Risk Probe             | Risk: sandbox mock-DB fallback misleads — mitigated: queries written correct on real SQLite and mock; caveat documented. Risk: idempotency key collisions — UUIDs via crypto.randomUUID, never Math.random.                                          |
| Consequence Projection | 8 contract tests + 121 server tests; migration path recorded in architecture §11.1; client boundary proven.                                                                                                                                          |
| Confidence Score       | 90%                                                                                                                                                                                                                                                  |
| Autonomy Level         | A5                                                                                                                                                                                                                                                   |

### Adopted Path:

`server/src/types/commandEnvelope.ts`, `CommandRegistry`, `routes/commands.ts` (`POST/GET /api/v1/commands`), mounted in index.ts; QA APPROVED.

### Rejected Alternatives:

Production implementation (scope); skipping the spike (unvalidated).

## Ledger Entry #5 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: F-04 client completion — typed CommandClient, feature-flag gated, no zod import

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The client needs a typed, safe transport that can never accidentally act without a configured Control Plane; bundle limits are strict.                                                                                                                                    |
| Evidence               | Architecture calls for typed checked client; zod is available but adds bundle weight; bundle-check enforces gzip limits.                                                                                                                                                  |
| Options Considered     | (a) zod-validated client — rejected: bundle cost vs. benefit; server already validates authoritatively. (b) Manual `isCommandResult` guard + feature flag — ADOPTED: lean, typed, safe. (c) Wire client into a screen — rejected: pre-decides deployment; flag stays off. |
| Risk Probe             | Risk: envelope drift between server/client — mitigated: mirrored contract types + tests on both sides. Risk: accidental use without config — mitigated: ControlPlaneDisabledError + isControlPlaneEnabled gate.                                                           |
| Consequence Projection | 14 client/contract tests; inventory registers Command Client (UNVERIFIED maturity); no screen wiring until a Control Plane is configured.                                                                                                                                 |
| Confidence Score       | 92%                                                                                                                                                                                                                                                                       |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                        |

### Adopted Path:

`src/api/commandClient.ts` + contract types + env typing; QA addendum; capability generator extended for `src/api`.

### Rejected Alternatives:

zod client (bundle); screen wiring (pre-decides deployment).

## Ledger Entry #6 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: CI governance hardening — SHA-pin actions, shard unit tests, blocking a11y gate; preserve workflow changes when push lacks `workflows` permission

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | CI cannot run (billing block), but the CI _configuration_ must still satisfy the repo's own governance scripts (compliance-evidence 19/22 → 22/22).                                                                                |
| Evidence               | `compliance-evidence.mjs` CI-002/003/004 FAIL; `architecture-guardrails.mjs` SHA-pin check failed; all workflow uses were `@vN` tags.                                                                                              |
| Options Considered     | (a) Fix config, push — blocked by missing `workflows` permission. (b) Fix config, preserve as documented worktree changes, push everything pushable — ADOPTED. (c) Skip — rejected: leaves governance red.                         |
| Risk Probe             | Risk: workflow changes lost across sandbox recycles — mitigated: backed up, documented in two artifacts with exact content. Risk: SHA resolution wrong — mitigated: resolved current tag SHAs via git ls-remote; guardrail passes. |
| Consequence Projection | Compliance 22/22; a11y gate blocking (runner exists, passes locally 448 tests); sharding verified locally; owner must land workflow files.                                                                                         |
| Confidence Score       | 88%                                                                                                                                                                                                                                |
| Autonomy Level         | A4 (STEALTH — high-criticality config change verified in parallel; push caveat escalated A3 to owner)                                                                                                                              |

### Adopted Path:

9 workflow files pinned + sharded + a11y blocking (worktree, documented); compliance-evidence.json + notes committed.

### Rejected Alternatives:

Skipping hardening (governance stays red); force-pushing without permission (impossible/improper).

## Ledger Entry #7 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: Extend F-02 interim structural baselines (empty+populated Dashboard, context bar, all 10 status states, PageHeader) — never claim pixels

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | F-02 needs visual-regression evidence; the sandbox cannot run a browser. Interim evidence must strengthen without overclaiming.                                                                                         |
| Evidence               | VISUAL_REGRESSION_RUNBOOK scenarios; existing structural baseline precedent (AtlasFoundations, DashboardPage.populated.contract).                                                                                       |
| Options Considered     | (a) Fabricate pixel baselines — rejected: violates zero-compromise evidence rule. (b) DOM/class structural baselines for each runbook scenario — ADOPTED. (c) Stop F-02 work — rejected: safe foundations may progress. |
| Risk Probe             | Risk: snapshots treated as pixel proof — mitigated: every file/QA note states pixels/fonts/theme remain unverified.                                                                                                     |
| Consequence Projection | 8-test Atlas suite + populated Dashboard baseline; real heading-order defect found and fixed (h1→h3).                                                                                                                   |
| Confidence Score       | 95%                                                                                                                                                                                                                     |
| Autonomy Level         | A5                                                                                                                                                                                                                      |

### Adopted Path:

Structural baselines + jest-axe; F-02 verdict stays REJECTED — REQUIRES COMPLETION.

### Rejected Alternatives:

Fabricated baselines (never); stopping safe foundation work.

## Ledger Entry #8 — 2026-08-10 — System

### Decision/Topic: Sandbox recycle reconciliation procedure — verified fast-forward + index refresh, never destructive commands

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The sandbox has recycled repeatedly: git refs return to the shallow `f3834e2` clone while the worktree keeps all files. The invariant: never lose work, never use reset/restore/clean. |
| Evidence               | Multiple occurrences observed; remote branch always holds the authoritative commits; worktree content verified byte-identical via git show/diff.                                       |
| Options Considered     | (a) reset --hard — rejected: destructive, prohibited by handover. (b) update-ref + git add -A + verify diff vs FETCH_HEAD — ADOPTED: ref-only move, index refresh, zero data loss.     |
| Risk Probe             | Risk: staging the 9 intentional workflow changes into commits — mitigated: `git restore --staged .github/workflows/` after each `add -A`; documented caveat.                           |
| Consequence Projection | Reliable recovery across 5+ recycle events; workflow files persist as intentional worktree-only changes.                                                                               |
| Confidence Score       | 95%                                                                                                                                                                                    |
| Autonomy Level         | A5                                                                                                                                                                                     |

### Adopted Path:

Documented reconciliation sequence used every recycle; no destructive command ever run.

### Rejected Alternatives:

reset/clean/restore (prohibited); abandoning work (unacceptable).

---

## New entries (from this method-upgrade session)

## Ledger Entry #9 — 2026-08-10 — Rex

### Decision/Topic: v5 restart Step 1 — re-certify Phase 0 (research baseline + assumptions with confidence scoring)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | v5 requires confidence-governed autonomy: every assumption needs an explicit confidence score in addition to its validation status.                      |
| Evidence               | research-report v2.0, assumption-registry v2.0 (14 assumptions), validation-plan v2.0, evidence-log E-001..E-005; no new primary evidence.               |
| Options Considered     | Rewrite research (rejected: churn, no evidence change); re-certify + add Confidence/Last-reviewed columns (ADOPTED); skip (rejected: v5 standard unmet). |
| Risk Probe             | Confidence scores misread as validation — mitigated: scores are confidence-in-hypothesis; Status column remains UNVALIDATED; header note explains.       |
| Consequence Projection | Registry v2.1; every assumption scored honestly (A-05 40% highest, A-01 10% lowest); gates unchanged.                                                    |
| Confidence Score       | 94%                                                                                                                                                      |
| Autonomy Level         | A5                                                                                                                                                       |

### Adopted Path: registry v2.1 + research-report v2.1 header + `_bmad/v5-restart-2026-08-10.md` Step 1.

## Ledger Entry #10 — 2026-08-10 — Ana

### Decision/Topic: v5 restart Step 2 — re-certify Phase 1 (Product Brief)

### DRP Summary:

| Stage              | Analysis                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- | --- |
| First Principles   | Brief must stay traceable to research/assumptions; v5 adds the reasoning ledger requirement.      |
| Evidence           | product-brief v2.2 (G1-approved); thesis, evidence table, A-13-tagged target customer all intact. |
| Options Considered | Rewrite (rejected); re-certify (ADOPTED); skip (rejected).                                        |
| Risk Probe         | Stale claims — verified sections still match research v2.x.                                       |
| Confidence Score   | 93% · Autonomy Level                                                                              | A5  |

### Adopted Path: brief v2.3 header + restart record Step 2.

## Ledger Entry #11 — 2026-08-10 — Percy/Uxie

### Decision/Topic: v5 restart Step 3 — re-certify Phase 2 (PRD + UX)

### DRP Summary:

| Stage              | Analysis                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --- |
| First Principles   | Every requirement/UX pattern must trace to research or assumptions; NFRs measurable.                                                |
| Evidence           | prd v2.1 (G2), ux-design v2.1 (G3), traceability matrix; F-03 implemented the UX §4 trust-language contract (context bar + badges). |
| Options Considered | Rewrite (rejected); re-certify (ADOPTED); skip (rejected).                                                                          |
| Risk Probe         | Requirements drift — traceability matrix verified current (R-01..R-07, A-01..A-14).                                                 |
| Confidence Score   | 93% · Autonomy Level                                                                                                                | A5  |

### Adopted Path: PRD/UX v5 headers + restart record Step 3.

## Ledger Entry #12 — 2026-08-10 — Archie

### Decision/Topic: v5 restart Step 4 — re-certify Phase 3 (Architecture + ADRs)

### DRP Summary:

| Stage              | Analysis                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| First Principles   | Architecture decisions trace to requirements; rejected alternatives documented; spike evidence recorded.                                    |
| Evidence           | architecture v2.1 (G4) with ADR register; F-04 spike outcome §11.1 (envelope, scope, idempotency, audit; migration path); alignment report. |
| Options Considered | Rewrite (rejected); re-certify (ADOPTED); skip (rejected).                                                                                  |
| Risk Probe         | Spike claims overread — §11.1 explicitly marks spike-only and sandbox mock-DB caveat.                                                       |
| Confidence Score   | 92% · Autonomy Level                                                                                                                        | A5  |

### Adopted Path: architecture v5 header + restart record Step 4.

## Ledger Entry #13 — 2026-08-10 — Bob/Amelia/Quinn

### Decision/Topic: v5 restart Step 5 — re-certify Phase 4 (Delivery: sprint plan, stories, verification)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| First Principles       | Delivery must sequence evidence (R) before pilot commitments (P), with safe foundations (F) that do not pre-decide market choices; statuses must match QA evidence. |
| Evidence               | sprint-plan v2.1 status table; stories R-01 (IN PROGRESS), R-02..04 (BLOCKED), F-01/F-03/F-04 (DONE/QA-APPROVED), F-02 (IN PROGRESS); QA reports filed.             |
| Options Considered     | Re-shard (rejected: approved plan stands); re-certify statuses (ADOPTED); skip (rejected).                                                                          |
| Risk Probe             | Status drift — each status cross-checked against its QA report before this entry.                                                                                   |
| Consequence Projection | Restart record complete; open escalations (CI billing, workflows permission, R-01, F-02 browser) carried forward.                                                   |
| Confidence Score       | 94% · Autonomy Level                                                                                                                                                | A5  |

### Adopted Path: sprint-plan v2.2 header + restart record Step 5 + this ledger set.

---

## Ledger Entry #14 — 2026-08-10 — System (All agents)

### Decision/Topic: Activate the BMAD v5.0 Reasoning & Quality Addon (Ultimate Thought Protocol) as a durable operating layer

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The owner supplied the addon to elevate reasoning rigor and quality standards; Law 4 (context on disk) requires it to live in the repo, not chat.                                                                                                                                       |
| Evidence               | Owner-provided addon prompt; existing v5 charter/ledger structure ready to receive it.                                                                                                                                                                                                  |
| Options Considered     | (a) Chat-only application — rejected: violates context-on-disk; lost across sessions. (b) Durable artifact `_bmad/BMAD_V5_REASONING_QUALITY_ADDON.md` + charter link + ledger entry — ADOPTED. (c) Rewrite existing artifacts to addon format — rejected: churn without content change. |
| Risk Probe             | Risk: addon becomes ceremony — mitigation: charter mandates PoT for QA verdicts/ACs/assumptions/ADRs and RDS ≥ 8 gate; this turn applies it to real work.                                                                                                                               |
| Consequence Projection | Every future artifact carries PoT where mandated, an RDS score, and passes the final execution check; QA verdicts now require explicit reasoning evidence.                                                                                                                              |
| Confidence Score       | 94%                                                                                                                                                                                                                                                                                     |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                      |

### Adopted Path: `_bmad/BMAD_V5_REASONING_QUALITY_ADDON.md` (full addon text), linked from `BMAD_V5_OPERATING_CHARTER.md` and `project-context.md`.

### Rejected Alternatives: chat-only application (lost state); wholesale artifact rewrite (churn).

---

## Ledger Entry #15 — 2026-08-10 — Quinn (security audit under v5 addon)

### Decision/Topic: Fix CSRF token fallback — fail closed instead of Math.random (security finding)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Stated rule: "Never use Math.random for security IDs/tokens." Audit found `generateCSRFToken()` fallback using `Math.floor(Math.random() * chars.length)` when `crypto.getRandomValues` is absent.                                          |
| Evidence               | `src/utils/security.ts` lines 437–441 (pre-fix); `src/utils/cryptoId.ts` documents the same rule; `auditTrailStore.ts` already enforces CSPRNG for audit IDs.                                                                               |
| Options Considered     | (a) Keep Math.random fallback — rejected: violates the rule and the "no silent security failures" standard. (b) Fail closed with a descriptive throw — ADOPTED. (c) Alternate PRNG fallback — rejected: still not cryptographically secure. |
| Risk Probe             | Risk: a crypto-less runtime now throws at token time — acceptable: crypto exists in all realistic runtimes; failing loudly is correct. Tests stub crypto, so primary path coverage is unaffected.                                           |
| Consequence Projection | `security.test.ts` gains a fail-closed regression test (51/51 pass); lint + tsc green; full suite re-run in progress.                                                                                                                       |
| Confidence Score       | 95%                                                                                                                                                                                                                                         |
| Autonomy Level         | A5                                                                                                                                                                                                                                          |

### Adopted Path: fail-closed throw + regression test; evidence logged.

### Rejected Alternatives: keep weak fallback (rule violation); alternate PRNG (not secure).

---

## Ledger Entry #16 — 2026-08-10 — Quinn/Amelia (real-SQLite server verification)

### Decision/Topic: Run the server suite against REAL SQLite (native better-sqlite3) and fix everything the mock DB had masked

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The server suite ran against an in-memory mock DB (native binding unavailable) — meaning schema, FK, and SQL-correctness bugs were invisible. Real verification requires the real database.                                                 |
| Evidence               | `node-gyp` needs nodejs.org headers (TLS-blocked); local headers exist at /usr/local/include/node → `npm_config_nodedir=/usr/local` built the native binding. First real-DB run: 7/11 suites failed.                                        |
| Options Considered     | (a) Keep mock and claim 121 passing — rejected: masks bugs. (b) Build native + fix all surfaced issues — ADOPTED. (c) Skip server verification — rejected.                                                                                  |
| Risk Probe             | Risk: test isolation — parallel files shared one DB file (one file's cleanup deleted another's live DB) → fixed with per-worker FINPLAN_DB_PATH. Risk: schema changes affect Tauri — audit_trail reconciled in place; Tauri never reads it. |
| Consequence Projection | All 198 server tests now pass on real SQLite (13 files, native config).                                                                                                                                                                     |
| Confidence Score       | 93%                                                                                                                                                                                                                                         |
| Autonomy Level         | A5                                                                                                                                                                                                                                          |

### Adopted Path: native binding + schema guarantee + canonicalization + seeding. See Evidence E-007.

### Rejected Alternatives: keep mock (masks bugs); change routes to legacy schema (loses semantics).

---

## Ledger Entry #17 — 2026-08-10 — Quinn

### Decision/Topic: Add real-SQLite regression tests for the schema reconciliation; harden ensureServerColumns for absent tables

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The reconciliation logic fixed real bugs (E-007) but had no regression coverage — the addon mandates tests for every new code path.                                                                                                                                                |
| Evidence               | ensureCanonicalAuditTrail/ensureServerColumns were exercised only implicitly via the server suite; a direct test exposed that ensureServerColumns threw on absent tables (partial/legacy DBs).                                                                                     |
| Options Considered     | (a) Test only the happy paths — rejected: leaves the throw-on-missing-table landmine. (b) Harden the function (skip absent tables with a warning; 001 remains the table-creation authority) + cover happy, no-op, idempotent, legacy-migration, and missing-table cases — ADOPTED. |
| Risk Probe             | Risk: skipping absent tables could mask a genuinely broken schema — mitigated: 001 runs first in ensureSchema (table creation), so absence here means partial/legacy DBs, logged explicitly.                                                                                       |
| Consequence Projection | 6 new real-SQLite tests; server suites 127/127 (default) and 204/204 (native). Tauri-side verified: no Rust/SQL consumer of the legacy audit_trail shape.                                                                                                                          |
| Confidence Score       | 94%                                                                                                                                                                                                                                                                                |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                 |

### Adopted Path: schemaReconciliation.test.ts + skip-absent-table hardening in ensureServerColumns.

### Rejected Alternatives: happy-path-only tests (landmine remains); throwing on absent tables (breaks partial DBs).

---

## Ledger Entry #18 — 2026-08-10 — Quinn

### Decision/Topic: Boot-contract verification + mock-fallback honesty resolution

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | After the real-SQLite migration, the boot path (fresh DB -> ensureSchema/runMigrations -> route tables) had no direct contract test, and the mock-fallback path's post-migration behavior was unknown.                                                                                                                                                                                                                               |
| Evidence               | bootSchema.test.ts (3 tests, both configs): fresh per-worker DB has all 17 route tables, canonical audit_trail shape, server columns. runMigrations() probe: idempotent, no throw. Mock-fallback probe: the fallback cannot be forced under vitest while the native binding exists (createRequire resolves the real module), and production forbids the fallback (fail-fast) — so it is a dev-only escape hatch, not a product path. |
| Options Considered     | (a) Invest in refactoring connection.ts to make the mock unit-testable — rejected: the mock is a deliberately-ephemeral dev fallback; production fails fast without native; testing it adds surface without product value. (b) Boot-contract test + explicit fallback-honesty note — ADOPTED. (c) Remove the mock entirely — rejected: it keeps sandbox/CI dev runs alive when the native binding cannot be built.                   |
| Risk Probe             | Risk: a future change breaks boot without CI noticing — mitigated: bootSchema.test.ts is in both server suites. Risk: someone trusts the mock as verification — mitigated: architecture/QA notes state real SQLite is the verification path; mock is dev-only.                                                                                                                                                                       |
| Consequence Projection | Server suites 130/130 default, 207/207 native; boot path locked by contract test.                                                                                                                                                                                                                                                                                                                                                    |
| Confidence Score       | 93%                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Adopted Path: bootSchema.test.ts (durable) + fallback-honesty documentation.

### Rejected Alternatives: mock-refactor for testability (no product value); mock removal (breaks dev fallback).

---

## Ledger Entry #19 — 2026-08-10 — Quinn

### Decision/Topic: compliance-evidence determinism + security audit completion (cryptoId) + server coverage confirmation

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | (1) compliance-evidence.json produced timestamp-only diffs on every run — violating the repo's deterministic-governance standard (capability matrix is deterministic). (2) E-006 flagged cryptoId.ts's fallback as "previously weakened" — needed verification. (3) Server coverage completeness was unverified.                                                                                                                             |
| Evidence               | compliance-evidence.mjs line 23 wrote `new Date().toISOString()`; only the script + package.json reference the file (no runtime consumer of `timestamp`). cryptoId.ts uses randomUUID → getRandomValues hex → throws (never Math.random) and has full test coverage (format/prefix/uniqueness/no-CSPRNG-throw). Native vitest config runs all 15 server test files (207 tests); default runs 13 (excludes the 2 native-DB suites by design). |
| Options Considered     | (a) Keep the timestamp — rejected: perpetual dirty tree. (b) Deterministic `generatedAt: 'from current working tree'` matching the capability-matrix convention — ADOPTED. (c) Gitignore the file — rejected: it is a committed evidence artifact; determinism is the right fix.                                                                                                                                                             |
| Risk Probe             | Risk: losing "when evidence was produced" — mitigated: git history records when checks changed; the script is the source of truth.                                                                                                                                                                                                                                                                                                           |
| Consequence Projection | compliance-evidence.json is now deterministic (hash-stable across runs); security audit closed (no finding in cryptoId); coverage confirmed complete.                                                                                                                                                                                                                                                                                        |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Adopted Path: deterministic generatedAt marker; security audit closed; coverage confirmed.

### Rejected Alternatives: keep timestamp (dirty tree); gitignore (loses committed evidence).

---

## Ledger Entry #20 — 2026-08-11 — Rex (multi-agent R-01 squad)

### Decision/Topic: Advance R-01 via a multi-agent research squad — real public recruitment channels, no fabricated participants

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | R-01 needs real participants. The owner directed using multiple agent personas with real-world/internet access. Compliance boundary: I can research REAL public channels and build an outreach-ready pool; I must NOT fabricate participants or impersonate interviewees (repo evidence rules; R-01 blocker text). |
| Evidence               | Live web research on 2026-08-11 verified 19 real channels across five cohorts (conferences, associations, communities, implementation partners) — all with public URLs. Secondary practitioner signals captured and labeled (r/FPandA EPM thread).                                                                 |
| Options Considered     | (a) Simulate participants to "complete" R-01 — rejected: fabrication, violates the core evidence rule. (b) Multi-agent real research → source map + tracker OUTREACH-READY + owner executes outreach — ADOPTED. (c) Leave R-01 untouched — rejected: owner asked for progress.                                     |
| Risk Probe             | Risk: channels treated as evidence — mitigated: E-011 explicitly SECONDARY; no assumption validated. Risk: PII in repo — mitigated: no contact details stored; owner executes outreach.                                                                                                                            |
| Consequence Projection | R-01 is now outreach-ready with 19 real venues; owner action converts channels to participants; R-02..R-04 remain gated on real evidence.                                                                                                                                                                          |
| Confidence Score       | 93%                                                                                                                                                                                                                                                                                                                |
| Autonomy Level         | A5 (within the fabrication boundary)                                                                                                                                                                                                                                                                               |

### Adopted Path: participant-source-map + tracker update + E-011 + this entry.

### Rejected Alternatives: simulated participants (fabrication — never); no-op (ignores direction).

---

## Ledger Entry #21 — 2026-08-11 — Rex (multi-agent squad round 2)

### Decision/Topic: Complete all research-part readiness — round-2 squad research + full R-02/03/04 execution kits

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | The owner directed: "COMPLETE ALL RESEARCH PART FIRST" and earlier authorized multi-agent personas with real internet access. The research part has two halves: (a) real secondary intelligence to sharpen questions, (b) an execution stack so R-02/03/04 run the moment participants exist. Primary validation cannot be completed without real participants — that remains owner-executed outreach. |
| Evidence               | Round-2 live web research (5 searches across commercial/close/FP&A/deployment/implementation domains) produced the secondary-evidence synthesis (E-012) with real, citable public sources. All five kits built (E-013) extending the existing templates.                                                                                                                                               |
| Options Considered     | (a) Fabricate participants to "complete" R-02/03/04 — rejected: violates the core evidence rule permanently. (b) Build readiness + secondary intelligence, mark stories READY with explicit participant gate — ADOPTED. (c) Stop at R-01 channels — rejected: leaves the research part under-prepared.                                                                                                 |
| Risk Probe             | Risk: kits mistaken for evidence — mitigated: E-012/E-013 explicitly NOT participant evidence; stories say READY not DONE; no assumption status changed.                                                                                                                                                                                                                                               |
| Consequence Projection | The moment the owner returns anonymized participant outcomes, R-02/03/04 execute with zero further preparation.                                                                                                                                                                                                                                                                                        |
| Confidence Score       | 94%                                                                                                                                                                                                                                                                                                                                                                                                    |
| Autonomy Level         | A5 (within the fabrication boundary)                                                                                                                                                                                                                                                                                                                                                                   |

### Adopted Path: 5 research artifacts + validation-plan v2.1 + story statuses READY + evidence E-012/E-013.

### Rejected Alternatives: fabricated participants (never); partial readiness (under-prepared).

---

## Ledger Entry #22 — 2026-08-11 — Rex (owner direction)

### Decision/Topic: Re-baseline the research/validation path for solo development (no enterprise participants)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | Owner: "we don't have such option available — we are solo developing the project." The R-track as specified (enterprise interviews → sessions → synthesis → pilot) cannot execute; keeping it blocked stalls the project; fabricating participants destroys integrity permanently.                                                                                                                                       |
| Evidence               | Owner direction (verbal, recorded 2026-08-11); existing R-01 kits (source map, outreach kit, session kit) now retained for future revival; validation-plan v2.1 with thresholds.                                                                                                                                                                                                                                         |
| Options Considered     | (a) Keep R-track blocked indefinitely — rejected: project stalls. (b) Fabricate participants — rejected: permanent integrity violation. (c) Solo-achievable evidence strategy (Tier 2–4: beta signals, artifacts, secondary) with strict honesty labels, R-01 REDIRECTED, P-track re-scoped to public-beta segment — ADOPTED. (d) Silent continuation without documentation — rejected: violates no-silent-state-change. |
| Risk Probe             | Risk: beta signals overread as validation — mitigated: only Tier 1 changes VALIDATED; tiers 2–4 update confidence/scope only. Risk: losing the enterprise path — mitigated: kits retained; revivable. Risk: P-track scope creep — mitigated: re-scoped explicitly to public-beta segment.                                                                                                                                |
| Consequence Projection | Browser/PWA unblocking (A-12) becomes a beta prerequisite; F-track continues; assumption statuses unchanged.                                                                                                                                                                                                                                                                                                             |
| Confidence Score       | 92%                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Autonomy Level         | A5 (direction explicitly owner-given)                                                                                                                                                                                                                                                                                                                                                                                    |

### Adopted Path: owner-direction record + path-lock update + validation-plan v2.2 + registry v2.2 + stories R-01..R-04 re-baselined + sprint-plan + evidence E-014.

### Rejected Alternatives: indefinite block (stall); fabrication (integrity); silent change (path-lock violation).

---

## Ledger Entry #23 — 2026-08-11 — Amelia/Quinn (F-05)

### Decision/Topic: Implement flag-gated browser beta enablement (solo-dev validation loop enabler)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | The solo-dev evidence strategy needs a public beta; the app hard-blocks non-Tauri. Enable browser rendering ONLY behind an explicit flag so the default runtime behavior is unchanged and no unsupported-capability claim is made.                                                                     |
| Evidence               | App.tsx gate (`!isTauri` → alert + null); 14 files import @tauri-apps (most already guarded: DashboardPage modal fallback, useTauriMenu dynamic import). Owner direction 2026-08-11 (solo dev).                                                                                                        |
| Options Considered     | (a) Remove the gate entirely — rejected: silently broadens supported runtime, contradicts honesty rules. (b) Flag-gated (VITE_BETA_WEB) with pure testable gate module + honest marker — ADOPTED. (c) Full browser hardening now — deferred: needs the remaining-work list (storage/shortcuts no-ops). |
| Risk Probe             | Risk: beta mode crashes on unguarded Tauri calls — mitigated: remaining-work list + full-suite verification; DashboardPage already falls back. Risk: overclaim — mitigated: marker + console note + A-12 unchanged.                                                                                    |
| Consequence Projection | Beta channel exists; P-track re-scoped to public-beta segment becomes actionable; browser hardening continues as F-05 remaining work.                                                                                                                                                                  |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                    |
| Autonomy Level         | A5 (within story scope)                                                                                                                                                                                                                                                                                |

### Adopted Path: betaMode.ts + tests (5/5) + App.tsx gate + env typing; story F-05 AC1-AC6.

### Rejected Alternatives: remove gate (overclaim); full hardening in one turn (too broad without browser env).

---

## Ledger Entry #24 — 2026-08-11 — Amelia/Quinn (F-05 hardening slice)

### Decision/Topic: Complete F-05 remaining work — Tauri-import hardening, in-browser no-op fallbacks, beta smoke test, full beta-mode suite

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Browser beta mode must render without crashing, must never silently claim Tauri capabilities, and must degrade gracefully when a Tauri-only facility is unavailable (storage, shortcuts, native windows, notifications). The solo-dev validation loop (Tier 2 BETA-USAGE) needs this channel to be crash-proof.                                                                                                                                                                                    |
| Evidence               | Import-time probe of `@tauri-apps/api`, `plugin-sql`, `plugin-notification`, `plugin-global-shortcut`, `api/webviewWindow` in a non-Tauri runtime: ALL imports safe; ALL calls throw without Tauri internals. Audit of all 14 `@tauri-apps` import sites: 7 runtime sites (all previously guarded at call time), 7 test/mock/type sites. Full default suite 1,188 files / 13,372 tests + full beta-mode suite 1,188 files / 13,373 tests, both 0 failures.                                         |
| Options Considered     | (a) Smoke test only, no code change — rejected: leaves top-level Tauri imports in the browser bundle; latent risk; handover explicitly lists stubs. (b) Guarded lazy imports + no-op fallbacks + smoke test — ADOPTED. (c) Vite alias mocking of `@tauri-apps` for browser builds — rejected: masks real behavior, more surface.                                                                                                                                                                   |
| Risk Probe             | Risk: lazy-import refactor changes Tauri behavior — mitigated: identical modules/calls, full default suite green. Risk: tests encoded the old storage contract — updated to the new no-op contract (storage tests 24/24). Risk: marker set on blocked path (minor honesty bug found by smoke test) — fixed: marker only when beta actually active; runtime check per-render. Risk: IndexedDB absent in some browsers — CubeEnginePersistence now falls back to an in-memory backend (8 new tests). |
| Consequence Projection | F-05 hardening complete; beta channel crash-proof; T-05 launch kit drafted; R-track Tier-2 loop unblocked (deploy decision stays owner's).                                                                                                                                                                                                                                                                                                                                                         |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Autonomy Level         | A5 (within F-05 story scope; handover §12 item 1)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Adopted Path: 6 runtime files hardened, 2 test files updated to the no-op contract, 3 new test files (smoke 4 tests, in-memory fallback 8 tests, viewport contract 5 tests), `.env.example` feature-flag docs, server test-DB litter cleanup (vitest 4 `afterAll` per-file; native config gains setup isolation), dead `server/src/test/seedHelpers.ts` deleted, vitest exclusion decision documented, F-05 QA review recorded.

### Rejected Alternatives: smoke-test-only (latent risk); vite-alias mocking (masks behavior); `globalTeardown` for DB cleanup (vitest 4 removed it — per-file `afterAll` used instead).

### Open Items: F-05 final visual sign-off needs a browser-capable environment (T-10-style); beta deploy decision remains owner's (T-06).

---

## Ledger Entry #25 — 2026-08-11 — Rex/Amelia (V-series verification gaps + canary disposition)

### Decision/Topic: Run the never-run verification commands (D1) and dispose of the dangling canary scripts

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Handover addon D1 lists five verification commands as NEVER RUN: canary:stage1\|2\|3, sbom, release:dry-run, full audit, test:bench. Running them is required before any "verified" claim; a command that cannot run must be disposed of honestly, not silently.                                                                                                                                                                                                                                                                                                              |
| Evidence               | `npm run sbom`: PASS — 40 components (CycloneDX to stdout). `npm run release:dry-run`: PASS — all 7 checks (root tsc, eslint src, production build, money:adoption, engines:verify, docs:verify, server tests 130/130). `npm run test:bench`: PASS — 13 files / 59 tests. `npm audit` (full): 0 vulnerabilities (after brace-expansion override). `npm run canary:stage1\|2\|3`: FAIL — the scripts reference `scripts/canary-2.0/...` runner files that were never committed; verified via `git log --all` (no such files in history) and repo grep (no CI/docs references). |
| Options Considered     | (a) Invent canary runners — rejected: no contract exists for what stage1/2/3 should check; fabricating a verification tool is fabrication-adjacent. (b) Remove the 3 dangling scripts from package.json — ADOPTED: restores manifest truth; the handover's "NEVER RUN" item is disposed of as "runners never existed — removed 2026-08-11". (c) Leave broken — rejected: guaranteed failure for any reviewer/CI invoking them.                                                                                                                                                |
| Risk Probe             | Risk: removing scripts breaks CI — verified none reference them. Risk: `@huggingface/transformers` "missing" flagged by `npm ls` — verified it is an OPTIONAL peer dependency (peerDependenciesMeta.optional, AIEngine runtime-computed specifier, N-0004/N-0005 CVE rationale) and intentionally not installed; NOT drift. Risk: release dry-run failure initially — root-caused to missing native better-sqlite3 binding after a node_modules recycle (mock fallback masks server columns), not a code regression; rebuild fixed it, 7/7 passed.                            |
| Consequence Projection | All D1 commands now have recorded PASS dispositions; package.json no longer advertises broken scripts; environment note: node_modules does not persist across sandbox turn boundaries (snapshot exclusion) — every session must re-run `npm ci` + server native rebuild before verification, and a missing-binding failure must be treated as environment, not regression.                                                                                                                                                                                                    |
| Confidence Score       | 92%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Autonomy Level         | A5 (hygiene/verification scope, handover addon D1/D3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### Adopted Path: removed 3 dangling canary scripts; ran and recorded sbom / release:dry-run / test:bench / full audit; documented optional-peer by-design for @huggingface/transformers.

### Rejected Alternatives: invented canary runners (fabrication-adjacent); leaving broken scripts; treating optional-peer "missing" as lock drift.

### Open Items: none new; owner-side blockers unchanged (billing, workflows permission, browser env, hosting decision).

---

## Ledger Entry #26 — 2026-08-12 — Owner/System (restored from HANDOVER_PROMPT_SESSION11; the post-merge docs commit 7e490cd carrying this entry was deleted with the arena branch — content reconstructed from the handover's documented risk decision, §11)

### Decision/Topic: Merge PR #55 (feat(f-05): browser beta hardening + verification gap closure) into main at the owner's explicit instruction despite failing CI

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Required checks were red at merge time, but every job fails before starting due to the repo-wide GitHub Actions billing block (E-005: "recent account payments have failed or your spending limit needs to be increased") — an account-level infrastructure condition predating PR #53. No job ever executed, so red CI carries no code-failure signal; treating it as a code gate would block all owner-requested delivery indefinitely.                                                                                             |
| Evidence               | Same billing annotation on every job of every workflow (see `_bmad/qa/ci-actions-billing-block-2026-08-10.md`); identical precedent for the PR #53 and PR #54 merges at owner instruction; local verification of the merged content green: root 1,189 files / 13,377 tests 0 failures (default and beta-mode identical), server 130/130 default + 207/207 native, tsc 0 (root + server), eslint full src 0, compliance 22/22 (with worktree workflows applied), guardrails PASS, audit 0 (prod + full), release:dry-run 7/7, sbom 40. |
| Options Considered     | (a) Block the merge until CI turns green — rejected: the billing block is owner-side (Billing & plans) and no code change can clear it; the branch was feature-complete and locally verified. (b) Merge at the owner's explicit instruction with the risk decision documented — ADOPTED (PR #55 comment + this ledger entry).                                                                                                                                                                                                         |
| Risk Probe             | Risk: a latent regression lands untested by CI — mitigated by the local verification battery above (13,377 tests) and the T-15 triage plan: after billing clears, re-run workflows on main and classify failures as environment/bootstrap (native modules in server tests) vs regressions.                                                                                                                                                                                                                                            |
| Consequence Projection | F-05 lands on main; future required-check bypasses must NOT happen without explicit owner instruction plus a documented risk decision.                                                                                                                                                                                                                                                                                                                                                                                                |
| Confidence Score       | 92%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Autonomy Level         | A3 (merge required owner instruction; executed on it)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Adopted Path: PR #55 merged 2026-08-12 (merge commit `8d17058`); risk decision documented on the PR #55 comment and here.

### Rejected Alternatives: blocking the merge until CI is green (owner-side infrastructure block, no code remedy).

### Open Items: re-run workflows on main after the billing block clears (T-14/T-15 triage); land the 9 hardened workflow files with a workflows-enabled token (T-13).

---

## Ledger Entry #27 — 2026-08-12 — System (post-handover session start: sandbox recycle recovery + worktree reconciliation)

### Decision/Topic: Recover the recycled sandbox worktree and restore the documented uncommitted workflow-hardening state

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The sandbox recycle wipes node_modules and left the git worktree incomplete: the restore-time checkout was interrupted (stale 0-byte `index.lock`, empty index, ~2,700 HEAD files missing from disk; only ~51 top-level paths restored). Local refs were already correct (HEAD == origin/main == `8d17058`, the PR #55 merge), and the arena branch had been deleted from the remote after merge (no refs remain; `7e490cd` existed only on that branch). The handover's `git add -A` reconciliation would have staged 2,907 deletions — it was blocked by the stale lock, which is why the empty-index state was detectable before any damage.                                                                                                                                                                                                                                                                                                             |
| Evidence               | `git ls-files` = 0 entries; `git diff HEAD` = 2,907 phantom deletions; `.github/workflows/*` present on disk byte-identical to HEAD (the uncommitted hardening was NOT in the snapshot; only the committed `ci-patches/` survive); object DB intact (`git show HEAD:package.json` reads fine); other Freebuff worktrees hold only partial/older states (main worktree = SHA-pinned but pre-shard intermediate).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Options Considered     | (a) Handover's `git add -A` + unstage workflows — rejected: would stage 2,907 deletions given the missing files (index-destructive). (b) `git checkout HEAD -- .` / `git restore .` — rejected: charter + handover forbid; would overwrite existing files. (c) Remove stale lock → `git read-tree HEAD` (index-only) → `git checkout-index -a` WITHOUT `-f` (writes only missing files, skips existing) — ADOPTED: strictly additive, preserves all on-disk content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Risk Probe             | Risk: existing files differ from HEAD (uncommitted work) — mitigated: checkout-index skips existing files; post-recovery status showed exactly one diff (`scripts/compliance-evidence.mjs`, a 0-byte truncated file from the interrupted restore — restored from HEAD) and zero remaining missing files. Risk: workflow hardening lost with the snapshot — mitigated: reconstructed from committed patches; `ci-patches/0002-loop3-sha-pin-shard-a11y-block.patch` is the exact scope the 2026-08-10 change log and the committed `compliance-evidence.json` describe (SHA-pin all actions, test sharding, blocking a11y gate); applying it reproduces the documented 22/22 + guardrails-PASS state, and the regenerated `compliance-evidence.json` is byte-identical to the committed oracle. Patches 0001/0003/0004/N-0004 do not stack on 0002 (overlapping ci.yml hunks) and are not required by any local gate — left in `ci-patches/` for future use. |
| Consequence Projection | Worktree == main + the 9 uncommitted hardened workflow files (the handover's documented state); the owner can commit them unchanged once `workflows` permission is granted (T-13).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Autonomy Level         | A5 (charter-sanctioned reconciliation: "verified fast-forward + index refresh; never reset/restore/clean")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Adopted Path: removed stale `index.lock`; `git read-tree HEAD`; `git checkout-index -a` (existing files preserved); restored the 0-byte `scripts/compliance-evidence.mjs` from HEAD; applied `ci-patches/0002-loop3-sha-pin-shard-a11y-block.patch` (worktree-only, unstaged); verified compliance-evidence 22/22, architecture guardrails PASS, no duplicate `if:` in the ci.yml summary job, F-05 beta tests 9/9 in both env variants.

### Rejected Alternatives: `git add -A` (would stage deletions); `git checkout`/`git restore .` (forbidden, destructive); stacking all five ci-patches (hunks overlap; 0002 alone reproduces the documented oracle state).

### Open Items: none new; owner-side blockers unchanged (billing E-005, workflows permission T-13, browser env T-10, hosting decision T-06).

---

## Ledger Entry #28 — 2026-08-12 — Owner/System (desktop-only product decision: browser beta channel removed)

### Decision/Topic: Remove the F-05 browser beta channel — the product is a desktop app, not a web app

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Owner direction (2026-08-12): "we are building an app not a web app or website" → "Beta channel: Desktop-only — remove it". The F-05 `VITE_BETA_WEB` channel existed solely to enable a Tier-2 BETA-USAGE evidence loop (validation-plan v2.2); it was never a supported capability (A-12 UNVALIDATED). Removing it restores the pre-F-05 Tauri-only contract: a plain browser must alert and render nothing. The removal must be honest and complete (no dead knob left documented, no orphaned module) without touching unrelated hardening the test suite depends on.                                                                                                                                                                                                  |
| Evidence               | Beta surface mapped: `src/utils/betaMode.ts` (isTauriRuntime/isBrowserBetaAllowed/isRenderAllowed), `betaMode.test.ts` (5 tests), `betaMode.app.test.tsx` (4 smoke tests), `src/App.tsx` (data-beta-web effect + gate), `src/store/uiStore.ts` (isTauriRuntime import), `src/vite-env.d.ts` (VITE_BETA_WEB), `.env.example` (flag doc), README browser claims. No CI/test-config/scripts references to VITE_BETA_WEB exist (rg across `.github/`, `scripts/`, `src/test/`, vitest configs: 0 hits). `isTauriRuntime` consumers outside App: uiStore only (lazy notification-import guard). The F-05 lazy/guarded `@tauri-apps` imports and non-Tauri fallbacks (tauriSqlStorage no-op, CubeEnginePersistence in-memory, …) are exercised by the jsdom suite and retained. |
| Options Considered     | (a) Keep the beta channel dormant (flag exists, never set) — rejected: contradicts the owner's desktop-only direction; leaves a documented knob with no consumer. (b) Remove only the flag + marker, keep the betaMode module — rejected: a file named `betaMode.ts` with no beta mode is dishonest naming. (c) Full removal + rename to `tauriRuntime.ts` + desktop-only App gate — ADOPTED: honest, complete, minimal; guarded-import hardening retained with rationale recorded.                                                                                                                                                                                                                                                                                       |
| Risk Probe             | Risk: jsdom test suite breaks if the gate hardens to Tauri-only — mitigated: jsdom has no `__TAURI_INTERNALS__`, so App renders the alert+null path exactly as before (the pre-F-05 suite already ran this way); new `App.runtime.test.tsx` pins both paths (blocked browser / rendering Tauri). Risk: README "runs in the browser" claims become false — mitigated: hero line + Deployment table Web row corrected to desktop-only wording. Risk: `.env.example` still documents VITE_BETA_WEB — environmental: the workspace env-file guard blocks edits to `.env*` paths; the knob is dead (no code reads it); flagged as the sole residual doc-drift item.                                                                                                            |
| Consequence Projection | The app is desktop-only again; the Tier-2 hosted-browser evidence path is closed — the product-led evidence strategy needs a desktop-channel alternative (owner decision, recorded in `_bmad/project-context.md` next-actions). A-12 stays UNVALIDATED with no active evidence path. Verification battery: root tsc 0, targeted suites green (tauriRuntime 2, App.runtime 2, tauriSqlStorage, uiStore, useTauriGlobalShortcuts, CubeEnginePersistence), changed-file eslint 0.                                                                                                                                                                                                                                                                                            |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Autonomy Level         | A4 (owner-directed product decision; executed the removal)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Adopted Path: deleted `src/utils/betaMode.ts`, `betaMode.test.ts`, `betaMode.app.test.tsx`; created `src/utils/tauriRuntime.ts` (+tests) and `src/App.runtime.test.tsx`; `src/App.tsx` gate is strictly `isTauriRuntime()` (alert + null in a browser), beta effect/marker/imports removed; `uiStore.ts` import + comment updated; `VITE_BETA_WEB` removed from `vite-env.d.ts`; README hero + Deployment table corrected to desktop-only; F-05 guarded-import hardening retained.

### Rejected Alternatives: keeping a dormant flag; partial removal leaving the misnamed module; reverting the F-05 lazy/guarded Tauri-import hardening (jsdom-load-bearing, no user-visible benefit to revert).

### Open Items: `.env.example` still documents the dead VITE_BETA_WEB key (env-file guard blocks edits — needs a token/tool with file access or owner apply); owner to choose the desktop-channel Tier-2 evidence strategy; owner-side blockers unchanged (billing E-005, workflows permission T-13, browser env T-10).

---

## Ledger Entry #34 — 2026-08-12 — Owner/System (all-in-one FP&A platform + ZohoBooks-grade UX direction)

### Decision/Topic: Owner directs the product goal as an all-in-one FP&A platform ("user should not need any other tool", all industries) with ZohoBooks-grade UI/UX and extreme optimization; grants maximum autonomy within BMAD discipline

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Owner direction (2026-08-12): all-in-one FP&A for all industries; ZohoBooks-comparable UI/UX; highly optimized; "free to do everything… with absolute extreme perfection". The repo is already breadth-rich (200+ lazy routes across 40+ domain dirs; 193 engines; 44 stores; 263 UI primitives) but depth and polish are the open fronts. The direction re-frames scope ambition (wedge remains the strategic anchor) without changing any validation status.                                                                                                                                                                                        |
| Evidence               | Route/page inventory read-verified (src/App.tsx 200+ lazy imports; 40+ domain dirs incl. healthcare/energy/government/manufacturing all with real engines + tests); design system is dark-first Bloomberg-inspired with working light theme (ThemeContext dark/light/system; index.css 853 lines of tokens); bundle gates exist (main <150KB gzip, total <2MB gzip) but dist not built this session; T-13 (9 hardened workflow files) LANDED via platform commit b23e41a (git diff 8d17058..b23e41a -- .github/workflows = 9 files +110/−59) — docs still said owner-side; all 14 assumptions remain UNVALIDATED (assumption-registry read-verified). |
| Options Considered     | (a) Treat direction as validation — rejected: violates evidence sovereignty (A-01…A-14 stay UNVALIDATED; Tier 1 only). (b) Silently re-theme the app to light-only ZohoBooks look — rejected: theme direction is a design decision to work with owner-visible audit, both themes polished. (c) Record direction + produce owner-visible master completion plan (all pending tasks across UI/depth/perf/engineering/research/governance) + multi-agent roadmap + desktop Tier-2 evidence kit, then execute in phases — ADOPTED.                                                                                                                        |
| Risk Probe             | Risk: breadth work overclaims vertical certification — mitigated: D-09 sector audit + honesty appendix (breadth ≠ certified depth). Risk: scope creep without gates — mitigated: every task has an acceptance criterion; phases ordered engineering-first. Risk: CI stays red — owner-side E-005, unchanged; T-13 status corrected in docs.                                                                                                                                                                                                                                                                                                           |
| Consequence Projection | Owner has a complete, prioritized task inventory to drive the project to "extreme perfection"; BMAD discipline preserved (no assumption validated, no fabrication, no silent state change); next session can execute Phase 1 gates (full-suite count, bundle audit) then the UI/UX flagship track.                                                                                                                                                                                                                                                                                                                                                    |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Autonomy Level         | A4 (owner-directed scope; executed with evidence-first honesty)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Adopted Path: `_bmad/project-completion-plan.md` (master plan, 6 tracks × 40+ tasks with acceptance gates) + `_bmad/research/owner-direction-record-2026-08-12-all-in-one.md` (direction record) + `agents/` A1–A5 multi-agent roadmap + `_bmad/research/desktop-tier2-evidence-kit-2026-08-12.md` (Tier-2 evidence drafts) + T-13 status correction + project-context/evidence-log/sprint-plan updates.

### Rejected Alternatives: treating owner direction as market validation; silent theme flip; proceeding without an owner-visible task inventory.

### Open Items: full-suite count still derived (13,438/1,195) pending P-01; CI billing block E-005 owner-side; `.env.example` dead VITE_BETA_WEB key (env-file guard); desktop Tier-2 evidence execution owner's call (T-06/T-07).

---

## Ledger Entry #33 — 2026-08-12 — Amelia/Quinn (F-02 pixel baseline COMPLETE — runbook executed in a real browser)

### Decision/Topic: Execute the F-02 visual-regression runbook (T-10) — establish deterministic browser screenshot baselines and flip F-02 from QA REJECTED to QA APPROVED

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | F-02 was REJECTED solely on the pixel baseline: "an interim deterministic DOM/class snapshot baseline... does not validate rendered pixels". The blocker was environmental (Playwright Chromium download failed with TLS resets on 2026-08-10). This environment HAS a working browser, so the runbook (`docs/design/VISUAL_REGRESSION_RUNBOOK.md`) can now be executed — the honest completion of a safe-foundation story, no ICP/connector/vertical/deployment decision made.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Evidence               | `tests/e2e/atlas-visual.spec.ts` 5/5 passing under chromium (badge dark+light; PageHeader wide+compact; FinancialWorkspaceEmptyState dark+light; Dashboard empty 1440+390; Dashboard populated 1440/1024 dark + 1440 light with visible `Draft` trust status). 11 deterministic PNG baselines in `tests/e2e/atlas-visual.spec.ts-snapshots/`; re-run produces byte-identical images (md5-stable), i.e. the render is deterministic. Determinism discipline held: fixed viewport/UTC/en-US/reduced-motion/animation kill-switch; seeded fixture restored through the app's OWN canonical backup path (BackupRestore, SHA-256-verified), never by patching component internals; test-only `__TAURI_INTERNALS__` shim (never relaxes production policy). Dev-only harness page `/visual/atlas` (AtlasVisualBaselinePage, 4 unit tests) is not linked from navigation. Two spec defects found and fixed on first run: `getByLabelText` (Testing Library API, invalid in Playwright) → `getByLabel`; unstrict `getByRole('status')` (4 matches incl. toast container) → scoped `getByRole('main').getByRole('status', { name: /Draft/ })`. CSP: `'wasm-unsafe-eval'` added to index.html script-src (+ security.md documentation) — required for the browser SQL.js fallback storage backend used by the test baseline; the CSP3 keyword permits WASM compilation only, never JS eval. |
| Options Considered     | (a) Claim F-02 done without pixels — rejected: violates zero-compromise honesty; the story's own runbook is explicit. (b) Execute the runbook now and re-run the QA review — ADOPTED. (c) Wait for CI — rejected: every workflow job is blocked by the account billing block (E-005); no browser-capable CI job can run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Risk Probe             | Risk: snapshots could encode a buggy render — mitigated: assertions pin the intended state BEFORE each screenshot (populated heading, Draft trust status in main, Total Revenue KPI, 3 setup steps, 10 badges); the populated fixture goes through the canonical backup-restore path, so the render is the product path. Risk: the P0 hydration defect (ledger #32) made the first populated render EMPTY — it surfaced exactly because of these assertions; after the fix the baselines were re-established on the FIXED render (verified: current pixels match the stored baselines byte-for-byte). Risk: snapshots drift across machines (font rendering) — mitigated: viewport/DSF/colorScheme/timezone fixed; Linux Chromium baselines are committed; any future diff must be reviewed as a code change (runbook rule).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Consequence Projection | F-02 pixel baseline CLOSED — the last rejection reason is gone; F-02 moves to QA APPROVED (pending this review's verdict recorded); T-10 removed from blockers; remaining owner-side blockers unchanged (billing E-005, workflows permission T-13, desktop-channel Tier-2 strategy, F-03 AC3 filter-reset explanation deferral stays deferred per F-04/P-01). Verification battery: e2e 5/5; root tsc 0; targeted unit suites (masterStorage 31, hooks 15, visual harness 4, pre-push focused subset 266, hydration-sensitive stores 44); eslint 0 on changed files; engines:verify/docs:verify/readme-claims 11-11/money ratchet/docs-link strict/capability-matrix/compliance-evidence all green; `git diff --check` clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Autonomy Level         | A5 (safe-foundation story execution; story was pre-approved with the pixel baseline as explicit AC)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Adopted Path: `tests/e2e/atlas-visual.spec.ts` + 11 committed PNG baselines + `src/pages/visual/AtlasVisualBaselinePage.tsx` (+4 tests) + `/visual/atlas` dev-only route + `tests/e2e/_helpers/atlas-seed-probe.mjs` (diagnostic) + CSP `'wasm-unsafe-eval'` (index.html + security.md) + QA review flipped to APPROVED + story/context/evidence updates.

### Rejected Alternatives: no-pixel claim (honesty); waiting for CI (billing-blocked, no browser job exists); using `--update-snapshots` to auto-approve diffs (runbook forbids; no diffs were auto-approved — current baselines re-established from the FIXED render).

### Open Items: none new; owner-side blockers unchanged (billing E-005, workflows T-13, desktop-channel Tier-2 strategy).

---

## Ledger Entry #32 — 2026-08-12 — Amelia (P0 hydration defect: zustand persist silently skipped rehydration on boot)

### Decision/Topic: Fix masterStorage.getItem to return the DESERIALIZED envelope object instead of the decrypted plaintext string (P0-2026-08-12)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The F-02 browser baseline (this session) exposed a silent data-loss path: after a backup-restore + reload, the dashboard stayed EMPTY despite the seeded stores being present in the database. Root cause traced to the storage contract: `masterStorage.getItem` returned the decrypted PLAINTEXT STRING, but zustand persist v5's `hydrate()` reads `storageValue.state` / `.version` DIRECTLY and never JSON.parses a string return. Every persisted store therefore silently skipped hydration on boot — writes "succeeded" (they did), but state was never restored after a restart. This affected BOTH the browser SQL.js backend and the Tauri backend (all 29 persisted stores). |
| Evidence               | `zustand-hydrate-probe.mjs` (real zustand + fake string-returning storage): hydrated x stays 0, confirming persist v5 does not parse string returns. `src/utils/masterStorage.hydration.test.ts` (2 tests) pins the round trip: a new store instance with the same key hydrates the persisted value (42) and the envelope object ({count:7}). Consumers of the old string contract were found and updated: `useFirstRun.ts` (marker compare), `usePersistence.ts` (double JSON.parse removed), `backupRestore.test.ts` (tamper path now mutates the nested envelope), `masterStorage.test.ts`, `usePersistence.test.ts` (mock now returns the object).                                   |
| Options Considered     | (a) Keep the string return and change every zustand store's `merge` — rejected: the persist middleware is library-owned; per-store `merge` hacks would be fragile and would leave backup/restore and migration consumers on the wrong contract. (b) Parse inside `masterStorage.getItem` with a non-JSON fallback — ADOPTED: one canonical fix at the single chokepoint every persisted store already funnels through; `JSON.parse` failure degrades to the raw string (first-run marker `'"true"'` and pre-envelope legacy rows stay readable). (c) Return both shapes — rejected: impossible to express honestly in one return type.                                                   |
| Risk Probe             | Risk: non-JSON plaintext (marker strings, legacy rows) — mitigated: try-parse with raw-string fallback; first-run marker test passes both `'true'` and `true` forms. Risk: breaking consumers that expected a string — mitigated: full consumer sweep (rg for `masterStorage.getItem`), all updated; backupRestore tamper-path regression updated to the envelope shape (the test that previously mutated the serialized string). Risk: hydration timing in tests — the new regression test settles on the async encrypted write before creating the second store.                                                                                                                       |
| Consequence Projection | Persisted state now actually survives restarts in both backends — a P0 data-integrity fix surfaced by the visual baseline. Verification: hydration-sensitive suites green (masterStorage 31 tests incl. new 2, hooks 15, pre-push focused subset 266, uiStore/integrationStore/tauriSqlStorage/App.runtime 44); root tsc 0; eslint 0 on changed files.                                                                                                                                                                                                                                                                                                                                   |
| Confidence Score       | 92%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Autonomy Level         | A5 (single-chokepoint bug fix with regression tests; no direction change)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Adopted Path: `masterStorage.getItem` returns `JSON.parse(plaintext)` with raw-string fallback; `useFirstRun` / `usePersistence` / `usePersistence.test` / `backupRestore.test` / `masterStorage.test` updated to the deserialized contract; `masterStorage.hydration.test.ts` added.

### Rejected Alternatives: per-store `merge` hacks (fragile, library-owned middleware); leaving the string contract (silent data loss on every restart).

### Open Items: none — the fix is covered by regression tests and exercised by the populated-dashboard visual baseline (restore → reload → populated render).

---

## Ledger Entry #31 — 2026-08-12 — System (post-commit verification, governance-drift repair, superseded connector route redirect)

### Decision/Topic: Verify the platform-absorbed commit (b23e41a), repair the governance drift it introduced (stale engine manifest + README claims + capability matrix), and remove the user-facing duplicate of the Integrations hub

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | A platform commit (b23e41a, "Update 47 files") absorbed three sessions of working-tree work (desktop-only beta removal, Integrations hub, connector→ledger import). The committed state is unverified at HEAD, and new source modules (ConnectorImportEngine) had not been propagated through the generated contracts (engine manifest, capability matrix, README stats). The old /settings/connectors page (in-memory ConnectorEngine — connections lost on reload) duplicates the real hub's surface for the same QuickBooks/NetSuite/Salesforce capabilities.                                                       |
| Evidence               | `generate-engine-manifest.mjs --check` FAILED (manifest stale — 181 vs 182 measured); `verify-readme-stats.mjs` FAILED (README claims 181, measured 182); `check-readme-claims.mjs` FAILED (42 vs 44 stores); capability matrix drifted 17 lines (new modules unclassified); rg proved ConnectorEngine has exactly one consumer (ConnectorSettingsPage) plus the generated manifest + smoke test; README "13,290 tests"/"1,174 files" predate the 13,377/1,189 F-05 measurement (blame 0e300b8, 08-09) — already stale at HEAD, no gate validates them.                                                                |
| Options Considered     | (a) Delete ConnectorSettingsPage + ConnectorEngine entirely — rejected this turn: blast radius includes generated manifest (181→180), README stats, reachability classifier, smoke tests, and the engine's legacy purity/cross-witness metadata; the page is unreachable except by direct URL. (b) Redirect /settings/connectors → /settings/integrations + mark the dead surface @superseded — ADOPTED: one-line honest fix, reversible, zero contract churn. (c) Leave the stale manifest/README/capability claims — rejected: they fail the project's own gates (engines:verify, docs:verify, check-readme-claims). |
| Risk Probe             | Risk: manifest regen reorders/diff-blows — generator is deterministic (.sort()); diff was 6 lines. Risk: README numbers unmeasurable in sandbox (full suite exceeds 180s cap) — test/file counts are DERIVED (13,377 + 64 added − 9 removed = 13,432; 1,189 + 8 − 2 = 1,195), recorded as derivation pending full-suite confirmation; engine/store counts are MEASURED by the gates. Risk: redirect breaks smoke tests — smoke renders the page component directly (unaffected); route-level tests re-run green.                                                                                                       |
| Consequence Projection | All project gates green again: manifest --check, docs:verify, check-readme-claims (11/11), capability:inventory, compliance-evidence, guardrails, docs-link strict, money ratchet, reachability; tsc 0; targeted suites 51/51 + 71/71; eslint 0 on changed files; diff --check clean. The F-03 AC3 filter-reset explanation deferral (server-authorized views, F-04/P-01) was re-confirmed as correctly deferred — client-side implementation would violate AC6.                                                                                                                                                       |
| Confidence Score       | 90%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Autonomy Level         | A4 (verification + governance repair within approved safe-foundations scope)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Adopted Path: `npm run engines:manifest` regen (181→182, ConnectorImportEngine now lazy-reachable); README claim repair (182 engines ×5 sites, 44 stores, 1,195 files / 13,432 tests — derived); capability matrix regenerated; /settings/connectors → <Navigate to="/settings/integrations" replace/> + @superseded banners on ConnectorSettingsPage and ConnectorEngine (kept, tested, unreachable — final removal deferred until the hub is committed/shipped).

### Rejected Alternatives: full deletion of the connector page/engine this turn; leaving generated contracts stale.

### Open Items: exact full-suite count needs a browser-capable/full-run environment (derived 13,432 / 1,195 documented); .env.example still documents VITE_BETA_WEB (env-file guard blocks edits — dead knob, no code reads it); owner-side blockers unchanged (billing E-005, workflows T-13, desktop-channel Tier-2 strategy, F-02 browser baseline T-10).

---

## Ledger Entry #30 — 2026-08-12 — System (Connector pull → Ledger import: controlled-loop "import actuals" wired to the Integrations hub)

### Decision/Topic: Give every connected integration a real "Import to Ledger" action — pull via the connector, map through a pure decimal-safe engine, write through the canonical `glStore.importGLData` (IMPORT_CREATE-gated) path

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | The Integrations hub (ledger #29) gave connectors real connect/test/sync, but sync only surfaced external data — it never fed the ledger. The controlled operating loop's "import actuals" step requires connector data to land in the GL journal. The canonical import path is `glStore.importGLData` (validates entries, applies rules, returns a typed `ImportResult` union). `enforce` (rba) propagates return values, so failures surface honestly to callers.                                                                                                              |
| Evidence               | `glStore.importGLData` signature + `ImportResult` union read-verified (src/store/glStore.ts, src/types/index.ts); `enforce` wrapper confirmed to return the inner function's value (src/utils/rba). Existing connectors expose `pull` returning ExternalTransaction-like records (RestApiClient-verified shapes; Stripe balance/charges, Plaid transactions with Link token, Slack webhook outbound-only — import not applicable for outbound-only, UI hides action accordingly).                                                                                                |
| Options Considered     | (a) Per-connector bespoke write paths — rejected: duplicated validation/rules logic. (b) Write directly to glStore entries bypassing importGLData — rejected: bypasses IMPORT_CREATE gate and validation. (c) Pure `ConnectorImportEngine` mapping external transactions → GL journal rows (accounts receivable/sales revenue, accounts payable, fees/expense categories, cash/bank), then one importGLData call per provider — ADOPTED. Outbound-only connectors (Slack) and incomplete auth (Plaid without Link token) hide the action and surface honest per-provider errors. |
| Risk Probe             | Risk: money conversion — mitigated: engine converts cents→dollars with exact decimal arithmetic (`fromCents`), tests assert exact values. Risk: store mock selector shape — caught by page test (busy flag truthy), fixed. Risk: lucide icon mock missing new icon in legacy `__tests__` duplicate — added `Plug` to both page-test mocks. Risk: immer-draft indexed access — guarded refs in the store action.                                                                                                                                                                  |
| Consequence Projection | Connected integrations now feed the ledger through one gated, validated, honest path; sync counts and import results are surfaced in the UI. Verification battery: root tsc 0; ConnectorImportEngine + integrationStore + IntegrationSettingsPage suites green (140+ tests); changed-file eslint 0 (prettier-fixed); `git diff --check` clean; money-adoption ratchet holds.                                                                                                                                                                                                     |
| Confidence Score       | 86%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Autonomy Level         | A4 (continuation of owner-directed feature; executed with evidence-first honesty)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Adopted Path: `src/engines/ConnectorImportEngine.ts` (+ test) pure mapping ExternalTransaction → GL journal rows; `importToLedger(provider)` action on `integrationStore` (pull → engine → `glStore.importGLData`, import count persisted in connection.lastImportCount) + tests; `IntegrationCard` "Import to Ledger" action; page wiring + tests.

### Rejected Alternatives: bespoke per-connector write paths; bypassing importGLData's gate/validation; claiming import for outbound-only connectors (Slack).

### Open Items: full OAuth2 browser redirect flow still future (F-04/P-track); Plaid Link access-token flow still needs owner-side Plaid account; owner-side blockers unchanged (billing E-005, workflows T-13, browser env T-10).

---

## Ledger Entry #29 — 2026-08-12 — Owner/System (Integrations hub: all helpful integrations surfaced + Stripe/Plaid/Slack added)

### Decision/Topic: Build a real Integrations hub — every integration with an implementation is connectable; no fake/placeholder connectors

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Owner request: "add all Integrations integration which can be helpfull". Audit of the existing state found the app already had a complete, tested connector framework (`src/services/api-integration/`: RestApiClient + QuickBooks, Xero, NetSuite, Sage Intacct, Dynamics 365, Salesforce) with **zero UI**, plus two half-baked settings pages: `IntegrationSettingsPage` (cosmetic theater — hardcoded list incl. SAP/Power BI/Tableau/Slack/SharePoint/Google Sheets where Connect/Sync just flipped local state, no code behind them) and `ConnectorSettingsPage` (local `ConnectorEngine`, static Maps, not persisted). "Adding integrations" therefore means: surface the real connectors behind a persistent, tested hub and add the highest-value gaps (banking, payments, notifications) to the same standard — while NEVER presenting a connector that doesn't exist (honest-labeling discipline). |
| Evidence               | Framework: 6 connectors + `ConnectorRegistry` + `BaseConnector` (connect/sync/checkHealth/disconnect), each with tests; imported only by `src/sdk/FpaClient.ts`, zero UI consumers (rg). `IntegrationSettingsPage.tsx` had `AVAILABLE_INTEGRATIONS` with fake entries and `handleConnect` doing `setIntegrations` state flips (read-verified). `PERSISTED_STORE_KEYS` registry (src/utils/persistedStores.ts) is cross-checked by `backupRestore.test.ts` — any new persisted store must be registered. Auth shapes read per connector (NetSuite oauth1 TBA, Sage oauth2_sage+sender, Dynamics oauth2_dataverse, QB/Xero/Salesforce oauth2; Salesforce health uses `{instanceUrl}/services/oauth2/userinfo`).                                                                                                                                                                                                 |
| Options Considered     | (a) Add fake "Connect" buttons for SAP/Power BI/Tableau/SharePoint/Google Sheets to match the old page — rejected: theater; violates the never-fabricate rule and the owner's own honesty bar. (b) Only rewrite the existing page cosmetically — rejected: no real connectivity. (c) Full hub: typed catalog (`src/config/integrations.ts`) mapping UI fields → ConnectorConfig → real connector class; persisted `integrationStore` (masterStorage, registered in PERSISTED_STORE_KEYS); page + card + connect-modal components; 3 new connectors (Stripe bearer-key, Plaid client_id+secret fetch pattern, Slack webhook) with tests — ADOPTED. OAuth2 connectors accept an optional pasted access token so "Test connection" works in-app (no callback server); a browser OAuth redirect flow stays a future server-authorized capability (F-04/P-track) — documented in the UI, not claimed.              |
| Risk Probe             | Risk: new persisted store breaks the backup registry test — mitigated: `integration-store` registered in `PERSISTED_STORE_KEYS` (alphabetical, between insurance and lease). Risk: connector auth guards reject catalog-built configs — mitigated: catalog test constructs every connector with dummy values (all 9 pass, guard shapes verified per connector). Risk: money discipline — mitigated: Stripe minor-unit conversion uses `fromCents` (exact decimal, ratchet-safe); Plaid/Slack pass amounts through unmodified. Risk: jsdom smoke tests render the new page — empty store renders cleanly (no network on render; network only inside connect/test/sync actions).                                                                                                                                                                                                                                |
| Consequence Projection | The app now has a real Integrations hub at /settings/integrations (linked from Settings → Data & Security): 9 integrations (6 pre-existing + Stripe + Plaid + Slack), persisted connections, real health checks/sync with honest status, local-credential security note. Fake SAP/Power BI/Tableau/SharePoint/Google Sheets entries removed — they were never implemented; adding them later means writing the connector first. Verification battery: root tsc 0, targeted suites (3 new connector tests, catalog, store, page, SettingsPage), changed-file eslint 0, `git diff --check` clean.                                                                                                                                                                                                                                                                                                               |
| Confidence Score       | 88%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Autonomy Level         | A4 (owner-directed feature request; executed with evidence-first honesty)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Adopted Path: created `src/config/integrations.ts` (9-definition catalog, no placeholders) + test; `src/store/integrationStore.ts` (persisted, real connector lifecycle) + test; `src/services/api-integration/{Stripe,Plaid,Slack}Connector.ts` + tests + barrel exports; `src/components/integrations/{IntegrationCard,ConnectIntegrationModal}.tsx`; rewrote `IntegrationSettingsPage.tsx` + test (fake entries removed); SettingsPage Integrations nav card; `integration-store` registered in `PERSISTED_STORE_KEYS`.

### Rejected Alternatives: placeholder/fake connectors for unimplemented systems (SAP, Power BI, Tableau, SharePoint, Google Sheets); cosmetic-only page rewrite; storing credentials outside masterStorage.

### Open Items: full OAuth2 browser redirect flow is future work (F-04/P-track, server-authorized views); Plaid transaction pull requires a completed Link access token (documented in the UI); owner-side blockers unchanged (billing E-005, workflows permission T-13, browser env T-10).

---

<!-- Future entries append below this line. -->

## UI-05 C — PageHeader rollout completion

**Decision: `titleId` as a dedicated prop rather than relying on the `...props`
spread.** `PageHeader` spreads unknown props onto its root `<header>`. Every one
of the 20 pages whose `<h1>` carried an `id` used that id as an
`aria-labelledby` target. Forwarding `id` via the spread would have moved the
label onto the header element, so the referencing region's accessible name would
become the header's whole subtree (title + purpose + action button labels)
instead of just the title. The prop puts the id on the heading.

**Decision: span mode instead of broadening the wrapper-collapse guard.** The
codemod refused headings inside `<main>`/`CardContent`. Rather than teach it to
collapse those wrappers — which would destroy page structure — it now replaces
only the heading run in place. Narrower transform, strictly safer, and it
unblocked the 7-page sector group.

**Decision: leave 8 centred card headings unconverted.** `PageHeader` is a
left-aligned flex row. The auth cards, the display 404, and the template error
state centre their heading above a centred icon. Converting them would be a
visual redesign smuggled in as a refactor, so they keep raw `<h1>`s.

**Decision: `sr-only` `<h1>` for `ReportDesignerPage`.** Full-bleed editor with a
toolbar, not a page header; it had no heading at all. A visually-hidden heading
fixes the a11y gap without touching the `h-full` layout.

**Guard integrity.** The `LAYOUT_RE`/`TYPO_RE` guards and the product-tour anchor
classes were left strict; conversion count was never the target.

## UI-04/05 B — light-mode contrast: a guard that vouched for the bug

**Finding.** `lightContrast.contract.test.ts` was green while a real
white-on-white heading was live. `DARK_BG` matched bare `bg-gradient`, so
`bg-gradient-to-br from-emerald-500/20 to-emerald-600/5` — effectively
transparent — was scored as a dark backdrop. `ReportTemplateLibrary.tsx:222`
sat on that gradient over a white Card.

**Decision: fix the guard, not just the call site.** Repointing the heading at
`--text-heading` alone would have left the detector still certifying every
other translucent-gradient surface. `DARK_BG` now rejects alpha-suffixed
gradient stops. Confirmed by reverting the source fix and observing the guard
fail on the exact line, then re-applying.

**Decision: verify a scanner against known-good patterns before believing its
count.** A fresh scanner reported 46 → 17 → 14 → 1 as false-positive classes
were removed (`dark:` pairings, dynamic `style={{backgroundColor}}`, saturated
`bg-*-500` badges). The plan's "64 sites / 29 files" was an artefact of the same
`dark:` blind spot. A count from an unvalidated matcher is an upper bound.

**Status correction.** UI-04 density was recorded as 0 consumers; it is fully
wired (AppLayout -> `<html data-density>` -> `--density-*` -> AG Grid and
`.fp-table`, with the SettingsPage control shipped). The baseline table was
stale, not the implementation.

## UI-01/1 — the third source of truth: deleted, not reconciled

**Finding.** `designTokens.ts` (344 lines, 13 token groups) was described as
"provably unconsumed". Half true, and the stale half mattered: `density` _is_
consumed by `useDensity.ts`. Every other group's only references were the
file's own exported type aliases (`ChartColor`, `SemanticTone`, `SectorKey`,
`RadiusKey`, `ZIndexKey`, `FontSizeKey`, `BreakpointKey`) — each with zero
external users. An unused export still typechecks, so nothing flagged it.

**Decision: delete rather than wire up.** The alternative — making it the
generator for the `@theme` block — means maintaining a TS palette _and_ a CSS
one and keeping them honest. The values had already drifted (radius `xs` 2px vs
4px, `sm` 4px vs 6px, negative `#dc2626` vs `#f43f5e`), which is exactly the
failure that argument predicts. `index.css` already drives the product and is
pinned by `tokenBridge.contract.test.ts`.

**Decision: keep `density` in TypeScript.** Not an inconsistency — AG Grid's
API needs numeric `rowHeight`/`headerHeight`, and a CSS custom property cannot
supply those to JS. The `[data-density]` blocks mirror the numbers for CSS and
`useDensity.test.ts` asserts the two stay in step.

**Guard.** The rewritten shape test asserts `Object.keys(designTokens)` is
exactly `['density']` and that the serialised object holds no hex or `rgb()`
literal, so a palette cannot quietly regrow. Mutation-verified by re-adding a
`radius` group.

## G3/G19 — a bundle budget that was measuring three of six chunks

**Finding (same shape as the contrast guard).** `scripts/bundle-check.js`
resolves each budgeted vendor with
`chunkStats.find((c) => c.file.startsWith(vendor + '-'))` and then did all its
work inside `if (match)`. A vendor that produced no chunk was skipped in
silence and still counted toward "G19 PASS". Of the six declared vendors, only
three existed; the gate printed three PASS lines and no indication that half
its budgets had never run.

**What that concealed.** `vite.config.ts` had no ag-grid rule, so ag-grid fell
into an anonymous `chunk-*.js` — at 298.3KB gzip the **largest artefact in the
build**, 1.7KB under the 300KB per-vendor limit that was supposed to govern it
and entirely unmeasured. `grid-community-vendor` and `grid-react-vendor` were
listed in the gate but never emitted by the build.

**Fixes.** Named the chunks (`grid-community-vendor` 284.85KB, now correctly
reported at 95% of budget; `grid-react-vendor` 14.29KB), and made a missing
chunk `::error::` + exit 1 instead of a silent skip. Mutation-verified with a
bogus vendor name.

**Refinement — absence is not always drift.** The strict check immediately
flagged `ai-vendor`, which is `@huggingface/transformers`: a deliberately
uninstalled optional peer that can never be emitted. Requiring it would fail
the gate forever; dropping it would lose the budget the day it is installed.
It is now conditional on `import.meta.resolve` succeeding, and prints an
explicit SKIP line rather than vanishing.

**Found and fixed — pdf-vendor in the critical path.** `pdf-vendor`
(616KB raw / 179.74KB gzip) is a `modulepreload` on first paint even though
`utils/pdfRuntime.ts` deliberately loads jsPDF via dynamic import. Cause is not
jsPDF: rolldown's injected preload helper (`\0vite/preload-helper.js`) landed
in that chunk, and 11 of its 13 importers — including the entry chunk and
`masterStorage` — import only that ~1KB helper. Returning a chunk name for the
helper's id does not work on its own: rolldown re-merges the sub-threshold
chunk, and rolldown-vite 8 rejects `output.minChunkSize` as an invalid key.

**What actually resolved it.** The helper does not need a chunk of its own — it
needs to stop living in a chunk that should be lazy. Assigning it to
`icon-vendor`, a group the config already declares and that is _already_ in the
preload set, moves it off `pdf-vendor` while adding no new critical-path bytes:

```ts
if (id.includes('lucide-react') || id.includes('vite/preload-helper')) return 'icon-vendor';
```

**Critical path 483.42 → 304.23KB gzip (−179.19KB, −37%), 17 → 16 chunks;
`pdf-vendor` absent from `dist/index.html`.** Total JS is unchanged
(2072.21 → 2071.86KB) — the bytes did not shrink, they stopped being fetched
before first paint, which is what `pdfRuntime.ts` intended all along.
`pdf-vendor`'s importers fell 13 → 4, and each survivor imports a real jsPDF
binding (`t`, `i`) rather than the helper binding (`a`).

**The generalisable bit:** a runtime helper is a _tenant_, and it drags its
whole host chunk into the graph of everything that imports it. The fix is
tenancy, not splitting — put shared helpers in a chunk you are happy to load
eagerly. Corollary, verified: naming an _auto-generated_ chunk (`'react'`)
achieves nothing, because `manualChunks` can only target groups the config
itself declares.

**Why this took two attempts to see.** The gate reported the critical path but
budgeted it at 750KB aggregate, so 483.42KB passed silently; and the obvious
suspect — a static `import jsPDF` in `AdvancedPDFEngine.ts` — was a red herring
that survived scrutiny because it is plausible. It fell apart only when the
minified _bindings_ were decoded: 11 importers were taking `a`, a ~1KB helper,
not jsPDF. Read what an importer actually pulls before blaming the library.
The guard added alongside is therefore per-chunk and by name rather than
aggregate: named lazy vendors must not appear in `index.html`'s modulepreloads.
Mutation-verified — reverting the one-line fix leaves the aggregate budget
PASSing and fails only the named check.

## UI-01 — one token cannot be both a text colour and a fill

**The task** was mechanical on its face: replace `bg-blue-600` with a semantic
token in the shadcn primitives so the Tailwind layer and the CSS layer stop
disagreeing. `Button` and `Card` alone have 281 and 273 importers, so whatever
they say propagates almost everywhere.

**The trap.** The obvious substitution — `bg-blue-600` becomes
`bg-[var(--accent-primary)]` — is a contrast _regression_, and nothing in the
build would have said so. Checked before applying it:

|                                   | white text on it | verdict   |
| --------------------------------- | ---------------- | --------- |
| `bg-blue-600` `#2563eb` (today)   | 5.17:1           | passes AA |
| `--accent-primary` dark `#0284c7` | **4.10:1**       | fails AA  |
| `--negative` dark `#f43f5e`       | **3.67:1**       | fails AA  |

The reason is structural, not a bad hex value. A token used as _text_ must
contrast with the page behind it; the same token used as a _fill under white
text_ must contrast with white. On a dark page those requirements point in
opposite directions — the text token wants to be light, the fill token wants to
be dark. `--accent-primary` was tuned for the first job and then used for the
second by `.btn-primary`, which sets `color: white`. **That defect is already
shipping**; the migration would merely have spread it.

**Resolution.** Separate tokens for the separate jobs: `--action-fill`,
`--action-fill-hover`, `--danger-fill`, `--danger-fill-hover`, defined per
theme against two constraints at once — white text ≥4.5:1 (AA) and the fill
itself ≥3:1 against the page (WCAG 1.4.11, so the control's edge is visible).
Hover travels _darker_ in light theme and _lighter_ in dark, so "more emphasis"
reads correctly against each background. The badge tints needed the same split:
`--negative` on `--negative-subtle` is 3.95:1 and `--positive` on
`--positive-subtle` 4.42:1 in light theme, so each tint got a paired
`--text-on-*-subtle`.

**A second trap, previously recorded and hit again.** The dark `-subtle` tokens
are `rgba(…, 0.15)`. Measuring text against that raw value is meaningless — it
has to be flattened over `--bg-surface` first. The contract test composites
alpha before computing any ratio; a mutation that only passes when compositing
is skipped scores 1.69:1 once it is applied.

**What the guard asserts, and why not a snapshot.** The existing primitive
tests asserted `className).toContain('bg-blue-600')`. That pins the _spelling_
of a utility: it breaks on every rename and never once says whether the button
is readable. `buttonContrast.contract.test.ts` instead reads `src/index.css`,
resolves `var()` alias chains, composites alpha, and asserts WCAG ratios for
both themes — so it fails when the _rendered result_ regresses, which is the
property anyone actually cares about. Mutation-verified 4/4, and each mutation
fails in exactly one theme, confirming the per-theme resolution is real.

**Scope discipline.** The lint rule and the contract test are scoped to the
four migrated files rather than all of `src/components/ui`. 95 of those 251
files still carry raw palette utilities; a blanket rule could only have landed
accompanied by ~91 disable comments, which is a rule that enforces nothing.
Both lists are ratchets — add a file as it is converted.

**Follow-up — extending the guard to the rendered DOM.** The file-level guards
read source: the lint rule bans raw utilities in the primitive files, the
contract test checks token values in `index.css`. Neither observes what the
browser gets, and both stay green while the element is wrong — `cn()` /
tailwind-merge can drop a class, a variant map can be keyed wrongly, and a
`var(--typo)` resolves to nothing and renders unstyled. So
`AtlasFoundations.visual-contract.test.tsx` now renders every Button and Badge
variant and asserts on the merged class list, including that every referenced
token is actually _declared_ in `index.css`. That last check is the one no
class-string assertion can make: `toContain('bg-[var(--action-fil)]')` passes
happily against a typo. Mutation-verified 3/3.

`Select` and `Alert` were then migrated on the same pattern (33 and 14
importers), bringing the ratcheted list to six files and the raw-utility
backlog in `src/components/ui` from 95 files to 92.

## UI-07/UI-08 — a contrast fix that had to preserve hierarchy, and an axe suite auditing empty pages

**Finding: raising a token to clear AA can destroy the type ramp.** `--text-muted`
failed AA on the two darkest surfaces (4.17 elevated, 3.60 hover). The obvious fix
is to lighten it until it passes — but `--text-muted`, `--text-secondary` and
`--text-primary` are a deliberate three-step hierarchy, and lightening the dimmest
step far enough to clear 4.5:1 walks it into the step above. Contrast here is a
_two-sided_ constraint: bright enough to read, dim enough to still read as
secondary.

**Decision: pick the darkest value that clears the worst surface, then pin the
separation.** `#7897c3` (min 4.59 on hover) rather than a comfortable margin,
because every extra point of luminance is spent from the hierarchy budget.
`#8aa2c9`, `#89a3cc` and `#8fa8ce` all pass AA and were rejected — they collapse
separation from `--text-secondary` to ≤1.19:1. The guard now asserts both
directions: each token clears AA on all four surfaces, _and_ the dimmer token of
each adjacent pair stays at least 1.2:1 apart from the brighter one. Without that
second assertion the correct fix and the hierarchy-destroying one are
indistinguishable to CI. Mutation-verified in both directions: reverting to
`#6484b4` fails 4 contrast assertions, and over-correcting to `#94b2db` — which
passes every contrast check — fails only the separation assertion. That second
mutation is the one that justifies the guard existing.

**`--text-tertiary` is an alias of `--text-muted`,** so this moved two named tokens
with one edit; and `@media (prefers-contrast: more)` re-declares these tokens
further down `index.css`. Check for that block before trusting a token's value —
the file has more than one answer for the same name.

**Finding: the axe suite was auditing empty pages.** UI-07 asked for axe at 0
critical/serious. The infrastructure already existed, undocumented, and was green
at 22 tests — the plan simply hadn't been updated. Before ticking it off, the
suite was instrumented to report how much DOM each scan actually saw. The report
routes were being audited at **5-6 elements and ~70 characters**: axe was only ever
looking at the "No data yet" empty state. The pages passed because there was
nothing there — no table, no column headers, no data cells, no controls beyond one
button. The claim was true and meaningless.

**Decision: fix the coverage, and make the hollow scan unrepresentable.**
`wcag-aa-populated.test.tsx` mocks the GL and budget stores so the four report
routes render real content (45-104 elements, 4-19 rows). All four came back clean,
so this closed a coverage gap rather than a defect — but the gap was the kind that
regrows silently, so every case also asserts it rendered ≥30 elements. A page that
falls back to its empty or loading state now fails loudly instead of passing on an
empty container. Mutation-verified both ways: an unlabelled `<button>` in the
populated render fails exactly one test on `button-name`; emptying the store mocks
fails all five on the element-count guard, not on axe.

**A stale comment is what made this look done.** The old suite's header still said
it was inert pending a `vitest-axe` install that had already happened. Trust an
executed run over a file header — and before building "missing" infrastructure,
grep for it.

## UI-08 — one hue cannot be both text and fill (`--negative`)

`--negative` (`#f43f5e`) failed AA as text on the two darkest dark surfaces —
4.34:1 on `--bg-elevated`, **3.75:1** on `--bg-hover`. The obvious fix is to
brighten it. Measuring the other direction first is what stopped that: `Navbar.tsx`
filled the notification badge with `var(--negative)` and set `text-white` on it,
shipping at **3.67:1**. Brightening the token to clear AA as text (`#fb7185`,
5.11:1) would have dragged white-on-fill down to **2.69:1** — trading a text
defect for a worse fill defect, and the badge is the more visible of the two.

**Decision: split the roles instead of retuning the token.** `--text-negative`
(`#fb7185` dark, `#dc2626` light) carries text; `--danger-fill` (`#dc2626`, white
at 4.83:1) carries fills. This is the second time a dual-role hue has been split,
so it is now the standing rule rather than a one-off. Non-text uses — `Select.tsx`
borders, the gauge and waterfall SVG strokes — stay on `--negative`: they only owe
3:1, and a failing ratio is not automatically a defect.

**The first grep missed the defect that mattered.** Searching for `bg-[var(--negative)]`
and `background:` returned nothing, which read as "text-only token, safe to
brighten." Only enumerating _every_ consumer and classifying each by role exposed
the Navbar fill. Enumerate, then classify — never grep per-role. Alias tokens
(`--color-error`) inherit the same defect and must be swept with the original.

**The guard passed on the defect it was written for.** The new fill ratchet was
green with the Navbar bug re-applied: it banned the `--text-*` twins as fills but
not `--negative` itself, which was in neither `TEXT_TOKENS` nor `FILL_ONLY` — the
exact gap that let this ship. Writing a test and watching it pass proves nothing;
the mutation is the test of the test.

**Widening it surfaced a second, unrelated defect.** `--color-error` was flagged in
`VarianceCommentaryPanel.tsx`, but as `bg-[var(--color-error)]/10` — a 10% tint,
not a solid fill, so white-on-fill never applied. A false positive for that rule,
and a real defect for another: the tint paired with `--text-negative` measured
**4.14:1** in light theme. The fill ratchet now exempts `/NN` tints, and a separate
ratchet _discovers_ every `bg-[var(--x)]/NN text-[var(--y)]` pairing in the repo
and composites it. Enumerating known pairings is how this one was missed, so the
new check finds its own inputs and asserts it found some — a regex that matches
nothing must not read as success.

## UI-07 — the last moderate: a heading skip owned by a primitive

`ChartOfAccountsPage` shipped an `h1` -> `h3` jump. `PageHeader` renders the
page `h1`; `CardTitle` hardcoded `<h3>`; the "Account Details" card sits directly
under the header, so the outline skipped `h2`. Screen-reader users navigating by
heading lose the cue that the card is a direct child of the page.

**The page was the symptom, not the cause.** Before patching it, the obvious
question was whether this was one page or a pattern: **53 pages** use `PageHeader`
and `CardTitle` together with no intervening `h2`, and `CardTitle` has 168 call
sites. Hardcoding `h2` in the primitive would have fixed those 53 and broken every
correctly-nested card. The level is genuinely context-dependent — a primitive
cannot know where it sits in the document — so it became an `as` prop defaulting
to `h3`, leaving all 168 existing usages byte-identical, and only the offending
page opts into `h2`.

**The ratchet asserts the outline, not the axe id.** Checking for the absence of
`heading-order` would pass if the rule were renamed or retired while the document
structure silently rotted. The test walks the rendered headings and fails on any
jump greater than one level, reporting the exact pair (`h1` -> `h3`).
Mutation-verified: reverting the `as="h2"` fails with that message.

**Two smaller things fell out.** The suite header still advertised the
`heading-order` finding as known-and-tolerated — the same stale-comment trap that
made the axe work look done last time, fixed in the same slice. And eslint caught
that the `jsx-a11y/heading-has-content` suppression on `CardTitle` had gone dead:
with a dynamic tag the rule can no longer analyse the element, so the directive was
removed rather than left as decoration. A warning about an unused suppression is
worth reading — it means the code moved out from under the rule.

Also closed: the two decorative `.` separators in `NLQChat` are now
`aria-hidden`, so they are not announced as content between the intent, confidence
and point-count values.

## UI-07 — the 1024×600 minimum was an unverified claim, not a resolved one

The tracker listed "5.5 Responsive layout (1024×600)" as done while the pending
ledger still had it open. The shell held the two invariants the minimum depends
on, but nothing pinned either of them, so the "done" was assertion rather than
evidence.

**jsdom cannot measure layout, and neither width nor height is otherwise visible
to the suite.** `scrollWidth` and `clientWidth` are both 0 under jsdom, so a
genuinely overflowing element is invisible to any DOM assertion — and the
Playwright browser download is blocked in this sandbox (TLS `ECONNRESET`), which
is why the prior session's T-11 note defers pixels to a browser gate (T-10). The
honest split is therefore: source-level width ratchet + structural height
contract, with pixel verification still deferred.

**Width — ban the unambiguous case, and prove the threshold.** The widest
content area the 1024 viewport can offer is 1024 − 64 (compact rail) − 48
(md padding) = 912px. A hardcoded width ≥900px is therefore a horizontal-scroll
defect by construction, whatever container wraps it. The ratchet
(`src/theme/viewport.contract.test.ts`) catches `w-[…px]`, inline
`style={{ width: '…px' }}` and CSS `width`/`min-width`, and asserts it scanned

> 400 sources so a silent regex reads as failure. The threshold was verified in
> both directions: 899px passes (no false positive at the boundary) and 900px,
> `minWidth: 905px`, and CSS `width: 950px` each fail with the file and line.

**Height — pin the mechanism, not a number.** At 600px nothing needs to _fit_;
it needs to be _reachable_. The root is `flex h-screen` and the one scrolling
surface is `<main class="overflow-y-auto">`. The render contract
(`src/components/layout/AppLayout.viewport-contract.test.tsx`) fails if any of
the mechanisms is weakened — `h-screen`, `overflow-y-auto`, the work area's
`flex-1 min-w-0 overflow-hidden`, the context bar's `flex-wrap`, or the rail's
`md:relative md:translate-x-0`. Each was mutation-tested by removing exactly one
and watching its own assertion fail (M4–M8).

**What this slice did _not_ do, on purpose.** Fixed-height grids and canvases
taller than 600px but inside the scrolling main (`GLTrialBalanceGrid`
`h-[600px]` — also a vestigial stub no page imports — and `BoardPackBuilder`
`min-h-[600px]`) are reachable and therefore not minimum-viewport violations;
they belong to the UI-04 density sweep. And "compact rail" at 1024–1439 is
satisfied by the collapsible rail rather than an invented auto-collapse default,
which would fight the persisted `sidebarCollapsed` preference without a browser
to validate the result.

---

## sess_032 — W0.2 Tenancy foundation (2026-08-22) · DRP-FULL · A5 (confidence 90%)

**Decision:** Land tenancy as additive schema + registry ratchet + leak-test suite, with
gl_entries routes as the first enforcement site. `tenant_id` on all 42 tenant-data tables
(both schema homes), `environment_id` on 13 governed surfaces, `tenants` root table,
idempotent `ensureTenancy(db)` reconciliation in ensureSchema + runMigrations.

**Evidence:** money-AST re-run 99.66%/25 ops; fabrication 0; server tsc clean;
schema-equality gate green; default server suite 183 passed / native-db 77 passed
(incl. 48 tenancy schema tests + 5 GL route leak tests).

**Options considered:** (1) registry-only ALTER without editing 001/002 SQL — rejected:
CREATE statements would misstate real shape and the Tauri shell embeds the same files via
include_str! (single source of truth preserved instead). (2) Full route retrofit across all
9 route files in one slice — rejected: exceeds one time-boxed cycle, risks half-mutated tree
(K9); replaced by declared W0.2b adoption queue with the registry ratchet guaranteeing no
silent gaps. (3) Chosen: additive columns + reconciliation + ratchet + GL-first enforcement.

**Assumptions tagged:** 'default'/'dev' literal ids acceptable until tenant provisioning
exists (Phase 1); users.email stays globally unique until composite uniqueness needed;
RLS deferred to Postgres S2 per blueprint S-state table.

**Consequence projection:** existing single-tenant data lands in tenant 'default' (K17
safe — numbers untouched, gl.money tests green); future facts cannot enter unregistered
tables without failing CI (K26 enforced mechanically).

---

## Ledger Entry #35 — 2026-08-23 — Mnemosyne/Lead (G-06 consolidated wave record: P-01 canonical counts + P-02 bundle audit + E-01 type-safety ratchet + UI-01 design-system audit + E-09 mock-honesty audit — all COMPLETE; gate GREENs with honest debts; doc-truth fixes; Grep-reliability caveat recorded)

### Decision/Topic: Consolidate the ENTIRE 2026-08-23 completion wave into ONE permanent record — P-01: canonical full-suite counts (1,287 files / 14,835 tests) replace the stale derived baseline; P-02: adjudicate Amelia's report (the ENFORCED bundle limit stands, gate GREEN "passed with 2 warnings"; the PLAN-LITERAL <2MB shortfall is recorded as HONEST DEBT P-02-R); E-01: type-safety ratchet GREEN (116 → 98 escapes; last 'as any' removed); UI-01: design-system audit delivered (10 ranked gaps, HYPOTHESIS pending Phase 3); E-09: mock-data honesty audit COMPLETE (gate met; specifics withheld pending redelivered report); correct AGENTS.md manual-chunk sentence AND testing-pool wording plus README count lines to measured truth; record the Grep-MCP reliability caveat

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | Two numeric truths coexist and neither may erase the other: the ENFORCED gate (`scripts/bundle-check.js:36` `TOTAL_JS_LIMIT_KB = 2248`) and the PLAN-LITERAL goal ("total JS 2MB gzip", AGENTS.md Build & Deploy). This build passed the first (measured total 2083.33KB gzip < 2248KB → GREEN) and has not yet met the second (2083.33 − 2048 = **+35.33KB over plan-literal**). Recording both truths plus a remediation path is the only option that does not drift; silently moving either goalpost is forbidden without owner direction.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Evidence               | Three witnesses per claim (D-002). (1) Read `vite.config.ts:229–279`: `manualChunks(id)` returns exactly **10 group names**, in file order — ai (L230), react (L241–243), icon (L262), grid-react (L272), grid-community (L273), chart (L274), excel (L275), excel-core (L276), pdf (L277), db (L278). (2) Read pre-edit `AGENTS.md:100`: claimed "react-vendor, chart-vendor, grid-vendor, form-vendor, state-vendor, ai-vendor" — `grid-vendor`/`form-vendor`/`state-vendor` exist in neither config nor build output. (3) Read `scripts/bundle-check.js:35–43`: MAIN_CHUNK_LIMIT_KB=150, TOTAL_JS_LIMIT_KB=2248, LAZY_VENDOR_LIMIT_KB=300, warn thresholds at 90%. Amelia's measured build output (relayed verbatim in the G-06 task assignment): total **2083.33KB gzip**; **8 chunks emitted** — react-vendor 54.44KB gz, chart-vendor 129.30, grid-community-vendor 284.85 [WARN @95% of ≤300KB budget], grid-react-vendor 14.29, excel-core-vendor 248.23, pdf-vendor 179.22, icon-vendor 13.86, db-vendor 13.61; the exceljs `/dist/exceljs/` rule produced **no separate file** this build; **ai-vendor conditionally absent** (deliberately uninstalled optional peer `@huggingface/transformers`; the gate prints an explicit SKIP — see the G3/G19 bundle-budget entry above). File-size witnesses (D-009, ReadAllLines count): AGENTS.md 149 lines; reasoning-ledger.md 1196 lines before this entry; project-context.md 191 lines. |
| Options Considered     | (a) Rewrite the plan text to 2.2MB so the number passes — rejected: silent goalpost move, FORBIDDEN without owner direction. (b) Red-denying the green script because the plan says 2MB — rejected: denies the enforced truth; the script is the enforcement instrument and its verdict stands. (c) Record BOTH truths — gate GREEN stands; plan-literal shortfall tracked as honest debt P-02-R (structural proposals: ag-grid modular imports, exceljs scope review); correct ONLY the factual chunk list in AGENTS.md — **ADOPTED** (Lead adjudication, executed by Mnemosyne).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Risk Probe             | Risk: a future reader sees GREEN and assumes <2MB is met — mitigated: this entry, the §15 changelog row, and open task P-02-R keep the +35.33KB debt visible. Risk: AGENTS.md re-drifts on the next config change — mitigated: the new wording lists stable rules (not volatile per-build sizes) and points to scripts/bundle-check.js for budgets. Risk: scope creep into other files — mitigated: single-line edit at AGENTS.md:100 only; no src/, tests/, or other \_bmad files touched; `scripts/bundle-check.js` header-comment drift (still says "total JS <= 2 MB" at L9 vs constant 2248 at L36) observed and flagged, NOT edited (out of G-06 scope).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Consequence Projection | Immediate: docs match measured reality; both goalposts preserved (enforcement 2248KB unchanged; plan-literal 2048KB explicitly unmet-by-35.33KB until P-02-R lands or the owner changes the goal). Downstream: the next agent inherits exact numbers instead of folklore; grid-community-vendor at 95% of its ≤300KB lazy budget is on record as a watch item.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Autonomy Level         | A5 — doc-truth consolidation under Lead adjudication, within honesty rules (no src/tests changes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Verbatim Lead adjudication (2026-08-23, recorded word-for-word per D-002):

1. ENFORCEMENT LIMIT STAYS: scripts/bundle-check.js TOTAL_JS_LIMIT_KB=2248 → P-02 gate verdict GREEN stands ("passed with 2 warnings").
2. PLAN-LITERAL <2MB (=2048KB) RECORDED AS NOT YET MET: measured total 2083.33KB gzip = +35.33KB over plan-literal. This is tracked as HONEST DEBT with a remediation path (task P-02-R, structural proposals: ag-grid modular imports, exceljs scope review). Moving either goalpost silently (rewriting plan text to 2.2MB, or red-denying the green script) is FORBIDDEN without owner direction.
3. DOC DRIFT CORRECTION AUTHORIZED: AGENTS.md "manual chunks" line must match measured truth — vite.config.ts defines 10 rules (ai, react, icon, grid-react, grid-community, chart, excel, excel-core, pdf, db); this build produced 8 chunks (react-vendor 54.44KB gz, chart-vendor 129.30, grid-community-vendor 284.85 [WARN @95% of ≤300KB budget], grid-react-vendor 14.29, excel-core-vendor 248.23, pdf-vendor 179.22, icon-vendor 13.86, db-vendor 13.61); NO form-vendor/state-vendor exist; the exceljs rule produced no separate file this build; ai-vendor conditionally absent (optional peer not installed). Fix ONLY that factual list in AGENTS.md — no other edits to it.

### P-01 canonical full-suite counts (Lead addendum folded into this entry):

RECORDED AS CANONICAL (measured full-suite run 2026-08-23): **1,287 test files / 14,835 tests — 14,834 passed + 1 by-design skip (`q5-2-focus-restore.test.tsx`), 0 failed**. REPLACES the stale derived baseline of **1,195 files / 13,438 tests** (off by −92 files / −1,397 tests). Three-witness agreement verified by Quinn per D-002 (vitest summary + on-disk enumeration + ANSI-stripped log lines). Environment: Node v26.7.0 · npm 12.0.2 · Windows_NT 10.0.26200 x86_64 · local run ≈17m36s.

### E-01 type-safety ratchet GREEN (Amelia — folded in per Lead addendum #2):

Baseline **116 escapes (2026-07-30)** → measured **98 after fix**: 0 `'as any'` anywhere in financial paths; 98 `'as unknown as'`; 0 ts-ignore; `tsc --noEmit` 0 errors BEFORE and AFTER. Single fix: `src/engines/MigrationEngine.ts:347–349` — removed the last `'as any'` plus its eslint suppression (verified provably non-behavioral). Inventory: ~142 non-test casts repo-wide; hotspot `SafeMathParser.ts` (**40 casts**, systemic pattern) inventoried and deliberately NOT touched — follow-up design proposal assigned as task **E-01-R**. Tests carry ~450 mock-idiom casts — out of ratchet scope BY DESIGN.

### UI-01 design-system audit delivered (Uxie — folded in per Lead addendum #3):

New file `_bmad/ui01-design-system-audit.md` (~160 lines; documentation only, zero code edits; HEAD fbe0c00b). **10 ranked gaps**, each with file:line witnesses; every recommendation labeled HYPOTHESIS pending Phase 3 validation; all efforts are ESTIMATES. Headline items (mirrored into project-context §2 next-action): light-theme hardcoded dark surfaces (**300 sites / 80 files**); DataTable lexical numeric-sort bug (data-trust defect, S effort — parked as task **UI-HF**); density contract ~0% adopted; form-control layer missing/minority; IA wayfinding absent at depth (requires explicit owner IA decision gate). Mnemosyne direct witnesses: git log HEAD = fbe0c00b (2026-08-23) ✓; Select-String found the headline strings present in the audit file ✓.

### E-09 mock-data honesty audit (Quinn — board-confirmed):

**COMPLETE, gate met.** Governance script `mock-data:audit` (`scripts/mock-data-audit.mjs`, package.json:28) GREEN exit 0, run twice (pre- and post-fix). Inventory verdict: every detected synthetic source disclosed EXCEPT `SOXCompliancePage.tsx` (was UNLABELED → fixed). SOX fix = **+31 purely additive lines**: `usingSampleFinancials` state :248–250; honest comment replacing the "sensible defaults" euphemism :357–359; `hasGLData` detection :391–392; amber `role="note"` banner `data-testid="sox-sample-data-notice"` :502–516 (shown when GL data absent — figures labeled illustrative defaults, not user financials); always-on caption re sample workflow/audit events :553–556. `smoke2.test.tsx` :429–434 comment-only rewrite removed a stale claim + phantom citation of GAP_LEDGER.md (verified nonexistent repo-wide, case-insensitive glob). Verification: targeted SOXCompliancePage.test.tsx + smoke2.test.tsx = **27/27 passed**; `tsc --noEmit` exit 0; audit still green post-fix. Severity: HIGH while unlabeled → **MEDIUM post-labeling**; structural remediation PARKED as task **E-09-F** (audit-script scope extension to stores/engines + "connect GL data" empty state + closedPeriods derivation from period store instead of hardcoded Q4-2025 ~:383). Known blind spot: script scans only src/pages + src/components. Metrics Lead-confirmed (full Quinn report delivered to Lead; relayed confidence 96%).

### E-02 a11y sweep GREEN (Quinn — placeholder fulfilled per Lead instruction):

**0 critical / 0 serious across 23 routes**; 6 violations found → ALL fixed; `wcag-aa{,-populated}.test.tsx` suites: **14 files / 488 passed + 1 by-design skip**; `tsc` clean; relayed confidence 97%. Coverage: 23 routes under axe gate = 9 pre-existing (incl. populated variants) + 14 new empty-state scans + 4 new populated-state scans; initial pass rate 35/36. Violations fixed: `/data/reconciliation` unlabeled #file-input (CRITICAL); FileDropZone nested-interactive (SERIOUS); reconciliation heading-order h1→h3 (MODERATE); CompetitiveGapsToolbar aria-required-children button-in-tablist (CRITICAL) + nested-interactive (SERIOUS) → real buttons in `role="group"` + `aria-pressed`; `/scenarios` heading-order (MODERATE). Notable side-fix: FileDropZone previously **SILENTLY DROPPED** caller-passed `aria-label` (TS-invisible) — prop now declared + forwarded. Files touched (Quinn's code changes, not Mnemosyne's): FileDropZone.tsx · ReconciliationPage/Panel/Results · ScenarioListPage · CompetitiveGapsToolbar{,.test} · wcag-aa{,-populated}.test.tsx. Escalation routed as task **E-02-F** (FileDropZone remove-button de-nesting; Lead UX ruling already issued); follow-up backlog: populated-state coverage for 6 of the 14 newly scanned routes.

### ENVIRONMENT CAVEAT — Grep MCP tool reliability (recorded for future sessions):

On 2026-08-23 the Grep MCP tool **intermittently returned WRONG results** across this wave — three independent reports (Amelia ×2, Uxie ×1), including false negatives on patterns verifiably present in files. Mnemosyne observed the same behavior class during this session: alternation patterns returning "No matches found" against known-present strings while single-term patterns matched. Consequence: **a single grep is no longer sufficient witness for critical claims.** Squad standard practice now: witness critical searches via PowerShell `Select-String` alongside (or instead of) Grep. Future readers should expect Select-String witnesses alongside greps in entries from this period and should NOT treat mixed sourcing as sloppiness.

### D-011 4-ICP Verdict:

VERDICT: 4/4 ICPs ACCEPT (Carla ✓ discipline kept, Vera ✓ both truths recorded, Chris ✓ enforcement stable, Beth ✓ user sees honest debt tracking). Numbering canonical per D-012.

### Adopted Path: Ledger Entry #35 (this entry, covering BOTH completions) + `_bmad/project-context.md` (header stamp → 2026-08-23/Mnemosyne; §2 next-action item (1) updated — P-01 + P-02 COMPLETE, E-02 remains; §15 changelog row dated 2026-08-23 covering both gates) + `AGENTS.md` two single-line factual corrections (Build & Deploy chunk list — 10 defined rules, 8 chunks emitted this build, no form-vendor/state-vendor, ai-vendor conditional, exceljs dist-entry rule may emit no separate file; Testing pool wording — forks → threads, matching vite.config.ts:299 `pool: 'threads'` / :303 `maxWorkers: 4`) + `README.md` count lines refreshed to measured truth labeled "measured full-suite run 2026-08-23" (hero stat Automated Tests → 14,835; quickstart quality-gate comment → 14,835; `npm test` row → "1,287 files / 14,835 tests"; quality-gates Vitest row → "1,287 files · 14,834 passed / 0 failed (+1 skipped · 14,835 collected)" with measured-run label replacing the fullsuite6 tag; certification bullet → "14,835 tests green"). Addendum-wave fold-ins (addenda #2/#3): E-01 / UI-01 / E-09 subsections + environment caveat recorded above; project-context §2 next-action extended with items (6)–(7) carrying UI-01 headline gaps (incl. UI-HF park, owner IA decision gate) and the E-01-R follow-up; §15 changelog row extended to name the full wave; nothing else edited.

### Rejected Alternatives: rewriting the plan literal to 2.2MB (silent goalpost move — forbidden without owner direction); red-denying the green gate script (denies the enforced truth); deleting the plan-literal line from AGENTS.md (erases the second goalpost); embedding volatile per-build KB numbers in AGENTS.md (guaranteed re-drift — sizes live in this ledger and the gate output instead).

### Open Items: **P-02-R honest debt** — total JS 2083.33KB gzip is +35.33KB over the plan-literal 2048KB; remediation proposals: ag-grid modular imports, exceljs scope review — OPEN until landed or the owner explicitly changes the goal. Watch item: grid-community-vendor at 284.85KB = 95% of its ≤300KB lazy budget. Cosmetic flag: `scripts/bundle-check.js` L9 header comment still reads "total JS <= 2 MB" while L36 enforces 2248 — left untouched (out of G-06 scope; belongs to the scripts owner). Addendum flags for Lead sign-off: (i) README L227/L234 still show an OLDER measured bundle figure (2,036.85 KB gzip vs Amelia's fresh 2,083.33 KB total; GAP-7 references a 2048 KB workflow cap) — NOT edited, outside authorized count lines; (ii) docs/CAPABILITY_TRUTH_MATRIX.md does not exist in-repo (generator scripts/generate-capability-truth-matrix.mjs present, output never committed) — there are NO capability-matrix count lines to correct; (iii) scripts/verify-readme-stats.mjs validates engines/stores/workers/coverage claims only — test-count lines are unchecked, so the README refresh cannot break `docs:verify`; (iv) package.json test/test:watch use --max-old-space-size=8192, CONFIRMING AGENTS.md's "8GB heap" claim (no mismatch to report). Wave-open items: **P-02-R** honest debt OPEN (−35.33KB vs plan literal); **E-01-R** SafeMathParser cast-pattern design proposal ASSIGNED (40 casts, systemic); **UI-HF** DataTable numeric-sort defect PARKED (S estimate); owner IA decision gate REQUIRED before deep IA-wayfinding work; E-09 metrics FOLDED (Lead-confirmed 2026-08-23) with structural follow-up PARKED as **E-09-F** (audit script scans only src/pages+src/components — extension proposed); **E-02** FOLDED GREEN (placeholder fulfilled) — escalation **E-02-F** OPEN (FileDropZone remove-button de-nesting) + populated-state coverage backlog (6 of 14 new routes); grid-community-vendor watch (95% of ≤300KB budget) unchanged; G-06-B resolutions recorded: README :227/:234 dual-truth refresh + bundle-check.js comment-truth fix EXECUTED (Lead-approved; scope judgment upheld), capability matrix REGENERATED via npm run capability:inventory with honest premise correction (tracked-and-modified, not nonexistent).

---

## Ledger Entry #36 — 2026-08-23 — Mnemosyne (wave-close consolidation: E-01-I ratchet drive GREEN + five-gate wave verdicts + completion-plan G-06 gate flipped DONE)

### Decision/Topic: Close the 2026-08-23 wave — record Amelia's E-01-I second-tier type-ratchet results (98 → 45 escapes; −71 vs baseline), cross-reference E-02's green sweep from #35, render the wave verdict across all five roadmap gates, and flip master-plan gate G-06 to DONE (explicitly Lead-authorized now that Entries #34+ are covered by #35+#36)

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | A ratchet only counts if every click holds: E-01-I's trajectory (98 → 98 → 69 → 58 → 45) was verified at EVERY checkpoint (`tsc --noEmit` 0 throughout) and closes with a 6-file / 597-test battery ALL PASS. Equally decisive for process trust: the MonteCarlo stop-revert proves the squad refuses wrong-shaped wins — a byte-identical revert beats merging a design mistake.                                                                                               |
| Evidence               | Three witnesses per claim (D-002): (1) Amelia's confirmed numbers relayed Lead-verbatim in the GO order (trajectory, battery, files, deferred set, discipline notes, confidence ~95%). (2) Prior-session repo witnesses already on record: SafeMathParser hotspot inventory + vite/package reads (#35); MigrationEngine fix site read during G-06. (3) This entry's own edits verified post-write via PowerShell Select-String (squad standard per the #35 environment caveat). |
| Options Considered     | (a) Fold E-01-I retroactively into #35's E-01 section — rejected: blurs provenance of two distinct tasks. (b) Flip G-06 before this entry existed — previously ruled DENIED, correctly. (c) Dedicated #36 at wave-close with cross-references + authorized flip — **ADOPTED**.                                                                                                                                                                                                  |
| Risk Probe             | Risk: double-counting E-01 progress (98-entry state in #35 vs 45-final here) — mitigated: trajectory explicitly anchored to #35's measured state. Risk: TODO(E-02-CLEAR) markers orphaned without an owning item — mitigated: Open Items carries the deferred bundle + MonteCarlo mutable-view design decision. Risk: premature DONE claim — mitigated: flip condition ("Entries #34+") is exactly met by #35+#36 and was Lead-preauthorized in writing.                        |
| Consequence Projection | Wave closes with all five roadmap gates COMPLETE (P-01 · P-02 · E-02 · E-09 · E-01/I) plus UI-01 delivered; Phase 3 UI flagship opens (already phrased into project-context §2). Remaining debt fully itemized instead of hidden: P-02-R honest debt, E-09-F, E-02-F, UI-HF, populated-state backlog, MonteCarlo mutable-view design, TODO(E-02-CLEAR) deferred bundle.                                                                                                         |
| Confidence Score       | 96%                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Autonomy Level         | A5 — consolidation under explicit Lead GO; completion-plan flip pre-authorized in writing                                                                                                                                                                                                                                                                                                                                                                                       |

### E-01-I confirmed results (Amelia; relayed Lead-confirmed):

- **Ratchet trajectory**: 98 (entry state = #35's measurement) → 98 (step 1, neutral) → 69 (step 2, text fns) → 58 (step 3, range fns) → **45 final** after second-tier (ProfessionalExportEngine 9→0; ExportEngine 4→0). Total −53 this task; **−71 vs the 116 baseline (2026-07-30)**. `tsc --noEmit` 0 at every checkpoint.
- **Final battery**: 6 files / **597 tests ALL PASS** (SafeMathParser main/oracle/branch + DriverCascadeEngine + ValidationEngine + ExportEngine).
- **Files**: `SafeMathParser.ts` — FuncEntry/TextFn/RangeFn shapes; TEXT_FUNCTIONS 26 cast-free entries; RANGE_FUNCTIONS 10 cast-free; lookupFunction wired (~:2006/:2519 areas); ONE boundary cast remains tagged `TODO(E-02-CLEAR)`. `ProfessionalExportEngine.ts` — geometry made public, 9→0. `ExportEngine.ts` — 4→0 incl. 2 identity casts removed outright. `MonteCarloEngine.ts` — **REVERTED byte-identical**: readonly ScenarioMetrics fields are deliberate immutability bypasses, not leftovers; proposal treatment was wrong there (mutable-view design decision parked).
- **Deferred (parked under TODO(E-02-CLEAR))**: step-5 typed-error semantics + oracle test updates; safeEvaluateFormula() opt-in API; all test-file edits; MonteCarlo readonly pattern.
- **Discipline notes**: documented ordering deviation (dispatch rewrite executed inside step 2 — both FUNCTIONS binding sites made move-without-dispatch behavior-breaking); two mid-task self-caught mistakes corrected BEFORE any verification ran; MonteCarlo stop-revert executed per charter A1. Amelia's confidence ~95%.

### E-02 cross-reference:

E-02 a11y sweep GREEN is recorded in full in entry #35 (placeholder fulfilled): 0 critical / 0 serious across 23 routes; 6 violations fixed; wcag-aa{,-populated} suites 14 files / 488 passed + 1 skip; escalations E-02-F + populated-state backlog. Incorporated here by reference as part of the five-gate verdict.

### Wave verdict (2026-08-23):

ALL FIVE ROADMAP GATES COMPLETE: **P-01** canonical counts (1,287 files / 14,835 tests) · **P-02** bundle gate GREEN w/ honest debt P-02-R · **E-02** a11y GREEN w/ E-02-F escalation · **E-09** honesty gate met w/ E-09-F structural follow-up · **E-01(+E-01-I)** ratchet 116 → 45 (−71), zero 'as any' anywhere in financial paths, tsc-clean throughout. Plus **UI-01** design-system audit delivered (10 ranked gaps, HYPOTHESIS-pending Phase 3). Master-plan gate **G-06 flipped DONE** in `_bmad/project-completion-plan.md` (:110) — condition met (Entries #34+ covered by #35+#36), Lead-authorized in writing. Authorization/discipline note: no fresh 4-ICP poll was taken for this entry; the flip rests on the Lead's standing D-011 acceptance of #35 plus the written GO order — recorded honestly rather than invented (D-007/D-002).

### Adopted Path: Entry #36 (this entry) + `_bmad/project-completion-plan.md` :110 G-06 row → DONE (ledger #35+#36 pointer) + `_bmad/project-context.md` §15 new changelog row for E-01-I/wave-close.

### Rejected Alternatives: retro-folding E-01-I into #35 (provenance blur between two distinct tasks); flipping G-06 before #36 existed (earlier DENIED ruling honored until conditions were genuinely met); inventing a fresh 4-ICP poll result that was never conducted.

### Open Items: **MonteCarloEngine readonly-bypass mutable-view design** — NEW parked future task (deliberate immutability bypasses need a proper mutable-view pattern). **TODO(E-02-CLEAR) deferred bundle**: step-5 typed-error semantics + oracle test updates; safeEvaluateFormula() opt-in API; test-file casts; SafeMathParser's single boundary cast. **E-01-R** (SafeMathParser cast-pattern design proposal) effectively delivered BY E-01-I's function-table redesign — flagged to owner for formal closure. Standing debts unchanged: P-02-R (−35.33KB vs plan literal; P-02-I owns gate tightening incl. the "/ 1.8MB" output-string fix), E-09-F, E-02-F, UI-HF, populated-state coverage backlog (6 of 14 new routes), grid-community-vendor watch @95%. Phase 3 UI flagship opening.

---

## Ledger Entry #37 — 2026-08-23 — Mnemosyne (hotfix-wave consolidation: E-02-F FileDropZone de-nesting + UI-HF DataTable numeric sort + DOC-SWEEP graph-clean; evidence log refreshed)

### Decision/Topic: Consolidate Quinn's two hotfixes delivered against #35/#36 escalations — E-02-F FileDropZone de-nesting (accessibility) and UI-HF type-aware numeric sort (data-trust) — record the clean repo-wide docs-link graph verdict (DOC-SWEEP), and refresh the evidence log with today's MEASURED verification battery

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------- |
| First Principles       | Both fixes close defects that were LIES rather than crashes: a screen-reader user could not act on a dropped file (nested interactive), and a finance grid silently sorted "100" < "20" < "3". A hotfix wave must also not widen the documentation graph while builders churn — DOC-SWEEP re-proved the docs-link gate green before AND after.                                                                                                                                                                                                                                                |
| Evidence               | Quinn's confirmed numbers relayed Lead-verbatim in the ENTRY-37 order (test deltas, axe results by state/severity, consumer sweeps, containment sweep); Mnemosyne's own DOC-SWEEP runs (`docs:links --strict` exit 0 twice, coverage witnessed from checker source: markdown links HARD + backtick citations strict-promoted, every repo .md incl. \_bmad/); Select-String verification of this entry's edits per squad standard.                                                                                                                                                             |
| Options Considered     | (a) Fold both fixes into #35's E-02/UI-HF escalation sections — rejected: escalations deserve their own delivery provenance. (b) Separate entries per fix — rejected: house preference for consolidated wave records. (c) Single #37 + evidence-log battery rows E-020–E-024 + §15 changelog row — **ADOPTED**. Also adopted within scope: repair of the pre-existing `                                                                                                                                                                                                                       |     | ` table-join defect in research/evidence-log.md L46 (E-015/E-016 crammed on one line since an earlier session). |
| Risk Probe             | Risk: display-variant FileDropZone breaks drag-drop UX — mitigated: non-interactive variant is the Lead's explicit UX ruling; Replace/Remove live in a sibling action row with filename-scoped aria-labels; 15 tests; axe 0 violations of ANY severity across empty/dragover/file-selected. Risk: comparator overreach changes intended string sorts — mitigated: locale-vs-ASCII discriminator test + repo-wide containment sweep NEGATIVE for sibling String()-coercion comparators. Risk: formatted strings re-entering DataTable cells — tracked as report-only side-check riding E-09-F. |
| Consequence Projection | Accessibility and data-trust debts shrink without opening new fronts; docs graph verified clean post-churn; evidence log now carries the day's measured battery (E-020–E-024) for future audits. Honest open status preserved: E-09-F and P-02-I are still RUNNING — the wave does NOT close on them.                                                                                                                                                                                                                                                                                         |
| Confidence Score       | 97%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Autonomy Level         | A5 — consolidation within the three authorized files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### E-02-F FileDropZone de-nesting GREEN (Quinn):

Non-interactive display variant chosen per Lead UX ruling; Replace/Remove moved to a sibling action row with filename-scoped aria-labels. `FileDropZone.test.tsx` expanded **7→15 tests**; axe reports **0 violations of ANY severity** across empty/dragover/file-selected states; consumer sweep **7 files / 41 tests**; tsc clean. Side-fix carried through from its #35 discovery: caller-passed `aria-label` is now declared+forwarded (was silently dropped, TS-invisible).

### UI-HF DataTable numeric-sort fix GREEN (Quinn):

Module-level type-aware comparator `compareCellValues`: number⊕number arithmetic; Date⊕Date epoch comparison; locale-aware string ordering; null/undefined/'' sort LAST in BOTH directions. Regression suite **24→31 tests** incl. the **100>20>3** discriminator in both directions plus a locale-vs-ASCII discriminator. Consumer sample **9 files / 62 tests**; repo-wide containment sweep **NEGATIVE** — no sibling String()-coercion comparators remain.

### DOC-SWEEP (Mnemosyne):

Repo-wide docs link/citation integrity via `npm run docs:links` (`node scripts/docs-link-check.mjs --strict`, package.json:40): BEFORE exit 0 → "✓ docs-link graph clean: 0 broken links, 0 broken citations (strict)"; AFTER identical. Coverage witnessed from checker source (markdown links HARD + backtick citations strict-promoted; every repo .md incl. \_bmad/; allowlist + reports/ + HANDOVER exemptions). Today's cross-references verified resolving (#36↔#35 same-file refs ×11; context §2 items (6)/(7) present; CAPABILITY_TRUTH_MATRIX.md hard-linked from ZERO_COMPROMISE_PRODUCT_BLUEPRINT.md:169 resolves post-regeneration; package.json:28 mock-data:audit citation exact). **Zero fixes required** — the historical 11-defect backtick-citation class did not recur.

### Wave/open status note:

**E-09-F** (mock-data audit scope extension to stores/engines + connect-GL empty state + closedPeriods derivation) and **P-02-I** (bundle gate tightening to plan-literal 2048 w/ proof; includes the "/ 1.8MB" output-string fix as scope item 6) are still RUNNING — the wave record does NOT close on them. New report-only side-check rides on E-09-F: sweep for formatted strings fed into DataTable cells.

### Adopted Path: Entry #37 (this entry) + `_bmad/research/evidence-log.md` rows E-020–E-024 appended (each labeled MEASURED with source ledger entry; plus L46 `||` join defect repaired) + `_bmad/project-context.md` §15 hotfix/doc-sweep changelog row.

### Rejected Alternatives: retro-folding into #35/#36 (provenance blur between escalation and delivery); separate entries per hotfix (house style prefers consolidated records); declaring the wave closed despite two running items.

### Open Items: **E-09-F RUNNING** (+ formatted-string-into-DataTable report-only side-check) · **P-02-I RUNNING** · MonteCarlo mutable-view design parked · TODO(E-02-CLEAR) deferred bundle · UI-HF / E-02-F delivered this entry (owner formalization pending) · grid-community-vendor watch @95% · populated-state coverage backlog (6 of 14 routes).

---## Ledger Entry #38 - 2026-08-24 - Lead (Wave-6 zero-flaw audit: 30/30 lanes reported; 16 unique P0 / 99 P1 / 62 P2 registered; Wave-7 fix program queued)

### Decision/Topic: Consolidate the Wave-6 all-domain zero-flaw audit ordered under the owner standing directive (one-stop ALL-INDUSTRY FP&A, zero compromises/flaws; board rule "always use all 30 subagents"). Thirty read-only audit lanes covered engines correctness+coverage, stores, routing, UI primitives, domain components, hooks, workers, services, plugins, storage/crypto, sector configs, types, i18n, templates, misc layers, Tauri shell, server backend, security posture, static test health, e2e journeys, build/bundle, CI gates, docs truth, a11y, performance, data I/O, PWA/offline, collab/locking, mission-gap map.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Zero-compromise is a verification property, not a slogan: it means every layer is inspected by an independent witness and every defect is registered with file:line evidence before any fix wave touches code. Read-only fan-out maximizes evidence throughput without risking the locked path.                                                                                                                                                                                     |
| Evidence               | Three orchestration passes (workflow wave6-zero-flaw-30-lane-audit: 19 schema-valid returns; wave6-retry-11-failed-lanes: 5; wave6-final-recovery-6-lanes: 6) = 30/30 lanes reporting. Raw pass-1 output archived at reports/WAVE6_WORKFLOW_RAW_2026-08-24.txt (50,246 bytes). Consolidated register: docs/audit/WAVE6_ZERO_FLAW_AUDIT_2026-08-24.md. Honest label: docs-truth lane detail lost to spill truncation; solo re-run dispatched, no P0/P1 from it entered the register. |
| Options Considered     | (a) Fix-as-you-find during audit - rejected: mixes evidence and mutation, breaks D-002 provenance. (b) 19 lanes sufficient - rejected: violates the owner standing 30-subagent directive and leaves known-uncovered lanes. (c) Consolidated register + queued Wave-7 batches with failing-test-first gating - ADOPTED.                                                                                                                                                              |
| Risk Probe             | Risk: agent findings could contain hallucinated anchors - mitigated: schema demanded file:line read witnesses, lanes self-reported two-witness counts, spot-checked lanes returned internally consistent citation chains; Wave-7 fixes must re-verify each anchor before editing. Risk: audit paralysis - mitigated: P0 register bounded at 16 with concrete fix directions.                                                                                                        |
| Consequence Projection | Product truth is now enumerable: wrong-numbers class (8 P0s), security class (4), integration-truth (1), product-surface (3). Five OWNER DECISIONS flagged (encryption escrow, sandbox wire-vs-deadvertise, server integration truth, browser/PWA story, updater channel) - these are NOT resolved by this entry.                                                                                                                                                                   |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Autonomy Level         | A5 - read-only audit + documentation within safe foundations; no product pivot, no connector commitments.                                                                                                                                                                                                                                                                                                                                                                           |

### Registered headline defects (full table in docs/audit/WAVE6_ZERO_FLAW_AUDIT_2026-08-24.md):

P0 examples: batch-calc evaluator silently zeroes under shipped Tauri CSP (batch-calc.worker.ts:173-182 + tauri.conf.json:26); PluginSandbox computed-key Function-constructor escape (PluginSandbox.ts:744-787); GL publish targets fictional api.finplanpro.dev/v1 (sdk DEFAULT_BASE_URL); dataStore mutators zero RBAC; ReportGrid colors negative metrics green (ReportGrid.tsx:158-162); cascade DSL mismatch freezes headline template rules (DriverCascadeEngine.ts:610-627); IRR/XIRR silent garbage on divergence (financial.ts:47-127); parseFloat truncates comma amounts; GL import unusable dates; undo/redo bypasses period hard-lock; sector KPI tiles render $0; native menu inert; ConfirmDialog deadlock; storage backends swallow errors defeating fail-closed design; encryption key co-located without escrow.

### Adopted Path: Entry #38 (this entry) + docs/audit/WAVE6_ZERO_FLAW_AUDIT_2026-08-24.md + reports/WAVE6_WORKFLOW_RAW_2026-08-24.txt + KANBAN Wave-7 card (4 batches: wrong-numbers / security / integration-truth / product-surface, each gated tsc-lint-test-build green).

### Rejected Alternatives: fix-during-audit (provenance blur); accepting partial 19-lane coverage (violates standing directive); immediate Wave-7 execution without owner review of the five flagged product decisions.

### Open Items: E-09-F RUNNING; P-02-I RUNNING (carried from #37); Wave-7 batches QUEUED pending owner visibility of this entry; docs-truth re-run lane in flight (append-only follow-up); five owner decisions open.

---## Ledger Entry #39 - 2026-08-24 - Lead (Wave-7A wrong-numbers batch CLOSED: 8 audit defects fixed failing-test-first; commit 3ebf4344; four gates green)

### Decision/Topic: Execute fix batch 7A from the Wave-6 register (docs/audit/WAVE6_ZERO_FLAW_AUDIT_2026-08-24.md): close the wrong-financial-output P0 class - W6-P0-01/06/09/10/11/12/15/16 plus consolidation apply-fix (P1) - while keeping tsc/lint/vitest/build green and preserving provenance against a concurrently-active session in the same worktree.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Wrong financial output is the zero-compromise red line: every fix lands with a regression test that was RED first; silent-fallback semantics (catch->0 / catch->current / string-prefix sign detection) are abolished at the chokepoints, not patched at call sites.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Evidence               | Commit 3ebf4344: 43 files, +3516/-228. Gates witnessed in-commit: tsc --noEmit exit 0; eslint src --max-warnings 0 exit 0; targeted vitest 14 files / 243 tests passed (financial 82+, GLUpload deep 61 new, budgetStore 47, ReportGrid, consolidation, cascade+contract, safeExpression 9, sectorKpis); npm run build exit 0 (PWA precache 472 entries). Pre-commit hook re-ran eslint/tsc/prettier/secret-scan on the exact staged set - all passed.                                                                                                                                                                                                                                                                                                                  |
| Options Considered     | (a) Re-delegate unfinished lanes to subagents - rejected: three agents had already silently completed edits without returning JSON; blind re-delegation risked double-editing. Captain finished the two genuinely-open items (cascade engine, batch-calc evaluator) directly with full context. (b) Commit everything green in tree - rejected: SafeMathParser.ts (+387 lines, cites \_bmad/safemath-parser-type-refactor-proposal.md E-01-R), SOXCompliancePage, grids and .market-acquire artifacts belong to the parallel session; pathspec-scoped commit preserves their provenance. (c) Leave foreign lint drift blocking build - rejected by owner directive: repaired mechanically (14 jsx keys, 2 prettier files) and attributed explicitly in the commit body. |
| Risk Probe             | Account-fallback identifier resolution could mask typos as account reads when callers return promiscuous defaults - mitigated: resolver returns undefined unless readCell yields a finite number, unit test uses selective stub to pin the throw path. Template edits via scripted replace mis-fired once (char-level flattening on 3 files); caught immediately by verification grep, restored from index, redone with straight-line replaces - zero residue (git status clean before re-edit).                                                                                                                                                                                                                                                                        |
| Consequence Projection | Silent-zero/silent-freeze classes are structurally dead: evaluateExpression throws SafeExpressionError, cascade counts formulaErrors, storage/import paths surface typed errors. New contract test locks ALL registered templates against future dead formulas. Remaining register: 8 P0s across security/integration-truth/product-surface batches (7B/7C/7D) + five owner decisions flagged in the audit report.                                                                                                                                                                                                                                                                                                                                                      |
| Confidence Score       | 96%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Autonomy Level         | A5 - fixes inside audited anchors only; no product decisions taken; five OWNER DECISIONS remain open.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Notes for successors: docs-truth solo lane (post-#38 follow-up): README top-5 hero claims verified code-backed; residual = money-headline absolutist wording (P1) + stale 24-vs-31 test count (P2) - both queued for the docs batch, NOT yet fixed. Memory-plugin workspace binding flapped between sessions during execution; durable records live here and in KANBAN.json.

---## Ledger Entry #40 - 2026-08-24 - Lead (Wave-7B security batch CLOSED: sandbox escape dead + loader wired, storage errors typed, RBAC across 11 stores, setUser derivation; commit 5c83551b)

### Decision/Topic: Execute security batch 7B from the Wave-6 register: W6-P0-02/03/04/14 plus authStore.setUser permission-injection P1. Deferred with recorded reasons: react-router ^8 cross-major override alignment (lockfile churn while a concurrent session runs npm installs) and Rust vault unlock verification model (owner decision on credential scheme - moved to the owner-decision bucket).

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Security fixes must close the CLASS, not the instance: computed-key rejection kills the bypass technique; Tier-A completeness scan makes unguarded store mutators structurally impossible to reintroduce; typed StorageBackendError revives masterStorage's entire fail-closed design instead of patching one call site.                                                                                                                                                                                                                                   |
| Evidence               | Commit 5c83551b: 36 files, +1922/-332. RED-first witnessed per lane (10 fromCharCode failures; 10 resolved-instead-of-rejecting; 6 enumerated unguarded mutators; 3 injection tests). GREEN: vitest src/plugins + src/store + storage utils = 68 files / 1149 tests passed; tsc --noEmit exit 0 (integrationStore parse-error scare was a concurrent-edit snapshot, clean at gate time); eslint changed set --max-warnings 0 exit 0; npm run build exit 0 (PWA precache 471 entries); pre-commit gates passed.                                             |
| Options Considered     | (a) Guard only dataStore - rejected by zero-compromise: Tier-A scan now fails ANY store exposing mutating actions without enforce(); ~70 actions guarded across 11 stores using ONLY existing permission strings. (b) Silent-warn mode for tests - rejected: glStore.cube fixture authenticated explicitly with cube:delete/cube:admin matching enforced contracts (F-0026 pattern). (c) Defer router override + vault model with reasons - ADOPTED over breaking a concurrently-running install or inventing a credential scheme without an owner ruling. |
| Risk Probe             | Account of residual risk documented in-lane: compiled plugin closures get AST gate + wall-clock budget but not retroactive scope isolation (worker isolation still open, tracked); auditTrail append-only family exempted from guards with written reasons inside rbacMatrixCompleteness.test.ts; Marketplace.install ignoring LoadResult failure remains open (pre-existing, queued 7D).                                                                                                                                                                  |
| Consequence Projection | Register after 7B: 16 unique P0 -> 7 remaining (P0-03 partially: loader wired; marketplace integrity + worker isolation remain), concentrated in integration-truth (7C) and product-surface (7D, incl. five OWNER DECISIONS).                                                                                                                                                                                                                                                                                                                              |
| Confidence Score       | 94%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Autonomy Level         | A5 - no product decisions taken; deferrals carry reasons and land on the board.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

---## Ledger Entry #41 - 2026-08-24 - Lead (Wave-7C integration-truth CLOSED: fictional API host killed, native menu bound end-to-end, ConfirmDialog FIFO+mounted; commit verified post-7C)

### Decision/Topic: Execute integration-truth batch 7C decision-neutrally (owner has NOT yet ruled on server-auth integration): make shipped behavior HONEST without committing to product expansion - W6-P0-13/07/08.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Principles       | A fantasy default host is worse than no host: it silently fabricates failures. Truth = fail fast with a typed ApiNotConfiguredError that names the env var, OR reach the real Express origin when configured. Same honesty bar applied to menus (remove decorative items rather than fake bindings) and confirms (a global host must exist or confirm.\* is a deadlock API).                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Evidence               | Commit (22 files, +1237/-387): sdk DEFAULT_BASE_URL deleted; VITE_API_URL-only resolution with ApiNotConfiguredError pre-transport (fetch-spy proven); bearer lazily from authStore getState; vite dev proxy /api->localhost:3001. Menu: shared manifest src/config/tauriMenuEvents.ts, exhaustive createMenuCommands (4 real routes), TauriMenuBridge mounted in App, decorative save_file/export_data REMOVED from Rust menu, sync enforced vitest-exhaustiveness + cargo include_str! (cargo lib 10 + bin 4 green). ConfirmDialog: FIFO queue (front settles first), dialogLayers topmost-Escape registry shared with Modal, global host mounted in App root. Gates: tsc 0; eslint set clean; vitest 11 files / 158 tests; build exit 0; pre-commit passed after one prettier fix on sdk/README.md. |
| Options Considered     | (a) Implement src/services/auth against Express now - rejected: that IS owner decision #3; lane stayed decision-neutral. (b) Keep decorative menu items until actions exist - rejected: dead UI is the defect class being purged. (c) Captain closed the ConfirmDialog mount gap after its agent lost its JSON return (edits were complete except App-root mount) - ADOPTED over re-delegation.                                                                                                                                                                                                                                                                                                                                                                                                        |
| Risk Probe             | ApiNotConfiguredError may surface in UI flows previously silently failing - intended (honest failure); follow-up queued to document VITE_API_URL in .env.example. Packaged-menu click-through needs manual verification (Playwright cannot reach native menus) - recorded as manual QA item.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Consequence Projection | Register: every mechanically-closable P0 is now closed; remainder are OWNER-GATED (P0-05 escrow UX, vault credential model, server-auth integration scope) plus tracked P1s (router override alignment, marketplace install integrity, worker-based plugin isolation). Next highest-value work: docs-truth wording fixes (money headline, stale test count), then P1 perf sweep pending owner steer.                                                                                                                                                                                                                                                                                                                                                                                                   |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

---## Ledger Entry #42 - 2026-08-24 - Lead (Wave-7D perf sweep CLOSED: ~200 selector-less subscriptions eliminated across 128 files; FULL suite 1298 files/15053 tests executed, all failures repaired; commit in git log wave-7d)

### Decision/Topic: Close the largest measured P1 cluster (app-wide over-render from zero-argument useXStore() subscriptions) plus three adjacent core fixes: DashboardPage discarded per-render O(n) aggregation, periodCloseStore off-canonical middleware stack, dead worker progress channel + error-listener leak.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Over-render is an architectural smell: components should subscribe to exactly what they read. The sweep is mechanical and behavior-preserving (selectors + useShallow + handler-scoped getState()), so risk concentrates in test mocks that were blind to selectors - those are updated to selector-aware implementations, never by weakening assertions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Evidence               | Commit (git log --grep wave-7d): 128 files, +2163/-1110. Sites rewritten: 20 (pages-A) + 56 (pages-B, 42 files) + 23 (components/hooks) + core (DashboardPage useMemo, periodClose canonical stack, progress ids threaded through 3 workers, error-listener cleanup with red-first leak regression test). Gates witnessed: tsc --noEmit 0; eslint src --max-warnings 0 clean after fixing 20 auto-fixables in 4 swept files; npm run build exit 0; FULL vitest suite executed to completion for the first time this program: 1298 files / 15053 tests, 11 files (38 tests) failed post-sweep - ALL traced to four selector-blind mocks (smoke-retail-saas, smoke-reports-retail-saas-1, ReportBookBuilder, InventoryPlanningPage), repaired selector-aware (38/38 re-run green); full-run log reports/FULL_TEST_RUN.log (gitignored, preserved on disk). |
| Options Considered     | (a) Ship sweep without full-suite run - rejected: cross-file mock coupling made targeted runs insufficient; full run caught 4 files every targeted pass had missed. (b) Weaken failing assertions to fake green - rejected outright (D-007). (c) Selector-aware fixture repair - ADOPTED.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Risk Probe             | Residual: selector-blind mocks may exist in suites outside src/pages/components/hooks scope; future sweeps should grep `vi.fn(() => ({` near store mocks. Concurrent-session commits raced several of today's commits (tracker auto-updates between pushes) - no conflicts encountered; provenance kept by pathspec staging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Consequence Projection | Register now: every mechanically-closable P0 closed; highest-value P1 clusters closed (perf, integration truth, RBAC breadth, worker protocol). Remaining actionable P1 tier: a11y cluster (~10 findings), marketplace install integrity, worker-based plugin isolation. Owner-gated bucket unchanged (5 rulings).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Confidence Score       | 93%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Autonomy Level         | A5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

---## Ledger Entry #43 - 2026-08-25 - Cowork Lead (ULTIMATE TEAM formed: 30 pre-existing teammates organized into 5 squads x 5 with named personas, dossiers, and board wiring; zero new spawns needed)

### Decision/Topic: Execute the owner directive "ULTIMATE TEAM — 25 workers + 5 managers, all-rounders, persona/DNA/memory for every member, ready for the all-in-one FP&A mission": roster audit -> rename/persona dossier layer -> squad task-board wiring -> BMAD-compliant dormancy/readiness protocol.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | An organized team beats a bigger one: the platform roster already held exactly 30 teammates (assistant_id bare:632f31d2), so "add 30 members" is satisfied by organizing, naming, and equipping what exists — not by duplicating agents. Every member must be an all-rounder with one focus territory; persona identity lives in durable repo dossiers (profile + DNA + personal memory log) because bare assistants carry no persistent persona field; discipline inheritance (D-002/D-007/D-009/D-011/D-012 + AGENTS.md law) is centralized in ROSTER.md §Team Law so 30 files never drift. |
| Evidence               | team*members: 31 total = Cowork lead + 30 teammates, all idle, assistant_id bare:632f31d2. Renames: 30/30 team_rename_agent acks (M1-M5 managers; W01-W25 workers). Files: Glob agents/ultimate-team/\**/\_.md = 31 hits (ROSTER.md + 30 persona dossiers). Board: 6 tasks created (task IDs 01a03601-c295/c2df/c2ff/c31f S1/S2/S4/S5 acks; 01a03602-0dc7 S3 ack; 01a03602-4e2d synthesis blocked_by all five). Ledger state: Get-Content count 1426 lines, last entry #42 (2026-08-24) -> this entry is #43.                                                                                 |
| Options Considered     | (a) Spawn 30 fresh agents — rejected: roster already at exactly 30; duplication would be wasteful and dishonest labeling. (b) Wake all 30 members immediately with persona briefs — rejected: 30 simultaneous wakes risk thundering-herd/provider-timeout failures and burn tokens before any mission exists; dormancy protocol adopted instead (5 managers ack readiness; workers receive persona brief inside their first real task dispatch). (c) Organize + rename + dossier + board wiring — ADOPTED.                                                                                    |
| Risk Probe             | Residual: personas are enforced socially (dossiers + manager verification) rather than by platform-level system prompts; mitigated by ROSTER.md dispatch pattern requiring dossier reference in every task description. Sequencing rule documented to prevent open-wait timeouts on dependent work. Idle notifications are normal-state, not failures.                                                                                                                                                                                                                                        |
| Consequence Projection | Team stands ready for Wave-1 missions; per \_bmad/path-lock.md the authoritative next action remains executing \_bmad/research/validation-plan.md — mass dispatch stays gated on owner green-light. Squad managers report readiness acks; synthesis task consolidates into a Wave-1 proposal.                                                                                                                                                                                                                                                                                                 |
| Confidence Score       | 96%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Autonomy Level         | A5 — staffing/organization only; no product decisions taken; missions remain owner-gated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

VERDICT: 4/4 ICPs ACCEPT (Carla ✓ cascade discipline preserved — path-lock untouched, D-rules inherited by all dossiers; Vera ✓ evidence-witnessed — roster/Glob/task-ID witnesses above; Chris ✓ operational — board wired, dormancy protocol avoids timeout herd; Beth ✓ user value — owner's exact 25+5 all-rounder structure delivered with zero-compromise law embedded).

---## Ledger Entry #44 - 2026-08-25 - Cowork Lead (Constitution v4→v5 co-authored refinement: 5/5 squad brainstorm complete; docs/CONSTITUTION_v5.md drafted pending Owner sign-off)

### Decision/Topic: Execute Owner directive "adapt FINAL_PROMPT.md, make it better - it was not properly refined and everything was not considered. RULE #1: never make compromises" via joint brainstorm (Lead + all 5 squad managers), then synthesize v5.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | A constitution that misdescribes the repo it governs cannot be enforced; zero-compromise means every law names its enforcer, every number its date+command, every capability its wiring. Round-1 design: 5 parallel tailored briefs (A conflicts/garbles, B truth-check w/ D-002 witnesses, C non-negotiables, D improvements, E reject-list), analysis-only, no repo mutation.                                                                                                                                                                                                                                                                                                                       |
| Evidence               | Reports received from M3 Orion Forge, M1 Atlas Prime, M2 Nova Ledger, M4 Sage Vector, M5 Titan Shield (all line-referenced, fresh measurements dated 2026-08-25). Key witnesses: ag-grid ^35.3.0 Community (0 enterprise lockfile refs); App.tsx 242 <Route / 228 path= / 182 lazy(); decimal.js in minority of engine modules with money-ast-detector.mjs + adoption baseline ALREADY shipped; tools/codegen/packs.ts + 4 Core-Promise specs ABSENT; server tenancy already real (82 hits, W02 lineage); SHI/UVI = ghost metrics (dangling §22.3 ref, no formula); env falsified (8 cores/~20GB/Node26/cargo present vs doc 2c/3GB/v22/no-cargo); Actions scope blocked → ci-patches handoff stands. |
| Options Considered     | (a) Patch v4 in place — REJECTED: keep-table/§3.3–3.4 unrecoverable at source fidelity; regenerate clean. (b) Re-plan from scratch ignoring BLUEPRINT — REJECTED: BLUEPRINT is LOCKED normative contract with TARGET/TODAY/DELTA discipline; import by reference. (c) Synthesize single canon harmonizing Owner intent + BLUEPRINT + repo law with named enforcers — ADOPTED.                                                                                                                                                                                                                                                                                                                         |
| Risk Probe             | Residual risks: stats methodology drift across reporters (stores 43–48, engines 187/214, blueprint lines 3551-nonblank vs 4448-physical) → mitigated by Part-8 generated-baseline law stamped at Wave-1 W1-A; K24 absolutism deferred behind ADR-004 D-011 ratification; Lighthouse demoted advisory until web build exists. Honest-labeling event: M5 could not reproduce Lead-flagged L672–675 garble → flag withdrawn as likely attachment drift.                                                                                                                                                                                                                                                  |
| Consequence Projection | v5 (docs/CONSTITUTION_v5.md) awaits Owner sign-off; on approval: AGENTS.md amendments (numeric pipeline text, ADR registry note), Wave-1 dispatch aligned to validation-plan + Phase-0 kernel wiring deliverables, Signal Panel printed per wave close.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Autonomy Level         | A5 — planning/artifact only; no product code touched; constitution adoption is Owner-gated per charter.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

VERDICT: 4/4 ICPs RECOMMEND ACCEPT of CONSTITUTION_v5 draft (Carla ✓ cascade/path-lock preserved — validation-plan stays authoritative next action; Vera ✓ all claims witnessed or marked stamp-pending; Chris ✓ enforcers cite existing shipped scripts, CI-block reality respected; Beth ✓ Core Promise becomes falsifiable day one, offline users protected by quarantine semantics). Owner sign-off: PENDING ⏳.

---## Ledger Entry #45 - 2026-08-25 - Cowork Lead (CONSTITUTION v5 RATIFIED by Owner ("SIGN"); Wave-1 W1-A dispatched to S5)

### Decision/Topic: Record Owner ratification of docs/CONSTITUTION_v5.md as governing constitution (supersedes FINAL_PROMPT v4); open Wave-1 per ratified Part 9 / path-lock.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Ratification converts the co-authored draft into binding law; first act under new law is MEASUREMENT, not change: stamp the Part-8 baseline truth table so every later delta is provable. Zero code changes in W1-A by design.                                                                                       |
| Evidence               | Owner message "SIGN" (2026-08-25). v5 status line updated to RATIFIED; ROSTER.md Wave table updated (W1-A DISPATCHED; W1-B/C queued behind W1-A per timeout-safe sequencing). Board task created for W1-A owned by M5 Titan Shield. Ledger #44 documents the 4/4 ICP recommendation; #45 records adoption.           |
| Options Considered     | (a) Dispatch W1-A+B+C simultaneously — REJECTED: violates sequencing discipline (B/C consume the baseline W1-A produces). (b) Dispatch W1-A only now — ADOPTED. (c) Wait for explicit per-wave approval — REJECTED: Owner's SIGN ratified the plan including Wave sequencing; autonomy A5 covers dispatch mechanics. |
| Risk Probe             | Gates may surface pre-existing reds; W1-A is REPORT-ONLY — no fixes inside the baseline wave, findings route to Wave-2 planning. Timing noise on shared machine noted in report format.                                                                                                                              |
| Consequence Projection | On W1-A completion: §8 table stamped, Signal Panel v0 gets its zero-point, W1-B (S1+S2 validation lanes) and W1-C (S3+S4 conformance audits) dispatch with the baseline attached.                                                                                                                                    |
| Confidence Score       | 97%                                                                                                                                                                                                                                                                                                                  |
| Autonomy Level         | A5 — execution mechanics under ratified plan; no law changes without new D-011 verdict + Owner visibility.                                                                                                                                                                                                           |

VERDICT: 4/4 ICPs ACCEPT dispatch of W1-A (Carla ✓ path-lock honored — validation-plan remains authoritative next action; Vera ✓ measurement-before-change is the evidence-first position; Chris ✓ single-owner wave avoids herd/timeouts; Beth ✓ owner signed exactly what ships next).

---## Ledger Entry #46 - 2026-08-25 - Cowork Lead (W1-A baseline received; 5 dispatch rulings issued; W2-A green-stamp micro-fix dispatched to S5 under CASCADE LAW)

### Decision/Topic: Adjudicate M5 Titan Shield's W1-A consolidated report (first full-cascade wave artifact) and authorize the minimal fix set needed to finalize the Part-8 baseline stamp.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Baseline before change (ratified sequencing); fixes must be minimal, targeted, and re-proven against gates; docs must match live hooks (docs-truth canon). Cascade compliance: W1-A·R worker subtasks (W21/W23/W24 verify+witness) observed on board — pattern working.                                                                                                                                                                                                                                                                                                                               |
| Evidence               | W1-A gate table: G1 tsc PASS 49.3s · G2 eslint FAIL 5 prettier errors (4 files, all auto-fixable) · G3a build FAIL (same lint; vite never ran) · G3b bundle-check PASS-with-warning on STALE dist (total JS 2006.47KB gzip = 98.0% of 2048KB; main 115.3/150KB) · G4 vitest shard PASS 24 files / 480 tests per LIVE .husky/pre-push. §8 proposed stamps incl. engines 187 top-level / 208 recursive (resolves historical 187-vs-214 confusion as scope-mixing), stores 42 (\*Store.ts glob), tests 1,319 colocated, routes UNSTAMPED (ROUTE_MAP stale exit 1), LOC 481,835 blank-inclusive src-only. |
| Options Considered     | (a) Batch ALL Wave-2 fixes now — REJECTED: only the 5 lint sites block the green stamp; everything else waits for W1-B/C findings. (b) Authorize targeted eslint --fix (5 sites) + ROUTE_MAP regen + AGENTS.md pre-push amendment + §8 finalization as ONE micro-wave W2-A — ADOPTED. (c) Leave docs drift (F4) — REJECTED by K0/docs-truth.                                                                                                                                                                                                                                                          |
| Risk Probe             | eslint --fix touches test files → Gate-4 vitest re-run ordered POST-FIX inside S5's sequence. Bundle re-measure will finally use FRESH dist (prior 98%-of-budget figure was stale-dist). ROUTE_MAP regen is a generated-artifact write, sanctioned by its own script.                                                                                                                                                                                                                                                                                                                                 |
| Consequence Projection | On W2-A completion: fully green gate table v2 + final §8 stamps in CONSTITUTION_v5.md + AGENTS.md pre-push truth restored. Concurrently W1-B (S1 in_progress) and W1-B/C (S2/S3/S4 pending pickup) audit lanes run read-only under full cascade.                                                                                                                                                                                                                                                                                                                                                      |
| Confidence Score       | 96%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Autonomy Level         | A5 — mechanical fixes + doc-truth restoration within ratified plan; no scope or law changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

VERDICT: 4/4 ICPs ACCEPT W2-A dispatch (Carla ✓ minimal-fix discipline, no scope creep; Vera ✓ every stamp carries command+date, fresh-dist rule enforced; Chris ✓ single-squad ownership, internal fix→test→stamp ordering avoids conflicts; Beth ✓ owner gets a truthful green baseline instead of a stale one).

---## Ledger Entry #47 - 2026-08-25 - Cowork Lead (WAVE-1 COMPLETE: all four squad consolidated reports received under full cascade; W2-A green stamp landed — every gate PASS on fresh artifacts; baseline finalized)

### Decision/Topic: Close Wave-1 (read-only truth wave): intake S4 analytics/product report + S1 addendum + S5 W2-A consolidated report; record gate-green status, corrections-of-record, and the Owner-verdict queue ahead of Wave-2 planning.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Truth before change: Wave-1 bought the map — engines carry semantic money defects invisible to primitive-level gates; data layer is solid-core/dangerous-edge; UI law is aspirational in pages but proven in components; product surface is broad-but-unwired in places. Zero-compromise now means fixing against a stamped, version-controlled baseline — not re-auditing forever.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Evidence               | S1: 15 unguarded headline engine defects (F7 wrong-account eliminations, NPV dual convention test-pinned both sides, D1 phantom +25% seasonal trend EXECUTED, D2 MC crash ≥200k iters EXECUTED, NCI 100× split, always-TRUE string equality, MIRR omission) + addendum: reconciliation identity absent repo-wide, percent-scale family violates decimal law (owner ruling queued), MC determinism PROVEN by execution. S2: H1 double-encrypt migration (latent S0), non-finite→null at rest PROMOTED to S1 risk, idempotency absent repo-wide, HMAC never verified, 10-item Part-3 enforcement-gap register. S3: five-state law 0/14 families, variance dual-canon (63-line emerald drift), live grid type-blind write defect, page-layer i18n zero. S4: Core-20 20/20 implemented w/ caveats, metrics 0/7 instrumented, export-verify silently green on missing files (F1), ExportDialog orphaned, PPTX unwired ×4-witnessed, guardrails strong w/ 3 gaps. S5/W2-A: G1–G4 ALL PASS post-fix on FRESH dist (eslint whole-tree clean; vite ran; shard 29 files/920 tests identical pre/post); M5 RETRACTED original G4 figure (drifted inline command) — file-anchored runs sole-authoritative; §8 stamps written into CONSTITUTION_v5.md; AGENTS.md pre-push section rewritten to live-hook canon. |
| Options Considered     | (a) Proceed straight into fixes — REJECTED pending Owner rulings on 6 verdict items that define "conformant". (b) Another audit round — REJECTED: diminishing returns; 40-task evidence base sufficient. (c) Synthesize + present Wave-2 dispatch plan with bundled owner decision pass — ADOPTED.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Risk Probe             | Bundle headroom ~40KB (98.0%) = next dependency bump trips budget → vendor-diet lane advisable early. F6 dead hook filter silently skips deleted-module coverage → include in Wave-2 gate-integrity batch. CONSTITUTION_v5.md git-untracked → durability risk until committed (Owner authorization requested). Percent-scale ruling blocks forecast/scenario fix design.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Consequence Projection | With Owner rulings: Wave-2 dispatches as P0 correctness bundles (S1 consolidation+numeric ADR implementation, S2 migration rewrite+guards+harness, S3 variance/states/grid fixes, S4 gate-repair/telemetry spine) each under full cascade with RED-first tests from squad-proposed suites.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Confidence Score       | 95%                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Autonomy Level         | A5 — synthesis/planning; no further mutations this wave; Wave-2 gated on Owner decisions per D-011.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

VERDICT: 4/4 ICPs ACCEPT Wave-1 closure and the synthesized findings package (Carla ✓ cascade executed end-to-end across 5 squads; Vera ✓ every headline witnessed at exact lines incl. two corrections-of-record honestly logged; Chris ✓ gates green on fresh artifacts, sequencing held, zero unauthorized mutations; Beth ✓ owner receives truthful system map + a single bundled decision pass instead of drip-feed escalations).

---## Ledger Entry #48 - 2026-08-25 - ox-alpha Lead (leadership handover Cowork → ox-alpha; hermes-agent onboarded as Deputy; team-comms channel established)

### Decision/Topic: Record Owner-directed leadership continuity — incumbent agent changes from Cowork to ox-alpha; hermes-agent joins as Deputy Lead executing under Lead guidance; file-based comms protocol created.

### DRP Summary:

| Stage                  | Analysis                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First Principles       | Continuity requires an unbroken decision record: handover is a governance event, not a silent swap. The 30-member cascade, path-lock, and Constitution v5 remain binding law; only the Lead seat and one new Deputy seat change.                                                                                                                                                                                      |
| Evidence               | Owner directive 2026-08-25 (this session). Witnessed state: ROSTER.md org-chart + slot map updated in place (agents/ultimate-team/ROSTER.md); agents/team-comms/COMMS_PROTOCOL.md + inbox-hermes.md + inbox-ox-alpha.md created; KANBAN.json Wave-7 card shows owner-gated remainder; ledger #47 closes Wave-1 with W2-A gates ALL PASS on fresh artifacts. Prior lead artifacts (ledger #38–#47) preserved verbatim. |
| Options Considered     | (a) Rebuild roster/teams fresh under new lead — REJECTED: destroys working cascade and violates no-silent-state-change. (b) Continue as Cowork identity — REJECTED: identity honesty (D-007); records must name the real acting agent. (c) Adopt existing structure + add Deputy seat + formal comms channel — ADOPTED.                                                                                               |
| Risk Probe             | Hermes is unproven: first mission M-H1 is read-only gate re-verification (tsc + eslint) with report-back to inbox before any write authority. Comms drift risk mitigated by shared repo-local memory graph (MEMORY/mcp-memory.json via .mcp.json memory server) + inbox files in-repo.                                                                                                                                |
| Consequence Projection | With M-H1 report accepted: Lead plans Wave-2 dispatch; owner-verdict queue from ledger #47/#Wave-7 card presented to Owner for rulings that define Wave-2 conformance scope.                                                                                                                                                                                                                                          |
| Confidence Score       | 96%                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Autonomy Level         | A5 — organizational mechanics under explicit owner direction; no law or scope change.                                                                                                                                                                                                                                                                                                                                 |

VERDICT: 4/4 ICPs ACCEPT (Carla ✓ cascade/path-lock untouched — only seat holders change; Vera ✓ all handover claims witnessed to live files; Chris ✓ comms channel is plain-file durable, zero new tooling deps; Beth ✓ owner gets continuity plus a named deputy without re-litigating ratified law).


---## Ledger Entry #49 - 2026-08-25 - ox-alpha Lead (owner ruling pass executed; checkpoint landed across 3 commits; comms-integrity incident + git law ratified; NCI dual-convention witnessed)

### Decision/Topic: Execute owner rulings (7/7 answered), land the 157-path durability checkpoint, respond to concurrent-commit and forged-directive incidents, and scope the Wave-2 engine correctness lane.

### DRP Summary:

| Stage | Analysis |
| --- | --- |
| First Principles | Durability first (untracked verified work = loss risk), truth-of-record second (attribution + directive authenticity), then correctness lanes. Concurrency on one checkout means git operations are single-writer territory: Lead-only commits are now law. |
| Evidence | RULINGS (2026-08-25): commit-checkpoint YES · P0-05 escrow IMPLEMENT · marketplace WIRE sandbox · server INTEGRATE auth client · desktop-only REMOVE PWA · updater CONFIGURE · lead lane ENGINE OBJECTIVE BUGS. CHECKPOINT: tsc PASS at commit time; gates landed as c7decc81 (9-file durability batch, hermes-executed under contested directive) + 2d1846b9 (328-file sweep under generic tracker message — CONTENT CORRECT, ATTRIBUTION BROKEN, corrected-of-record here) + bd26d23a (Lead straggler closure incl. .husky/pre-commit xargs -n batching fix for Windows 8KB argv limit code-123 failure, .prettierignore scoping: machine-generated .market-acquire/ + append-only inboxes/ledger excluded with F-0024 rationale; ledger oscillation verified non-idempotent). INCIDENT: inbox-hermes contains [MSG-005]-in-Lead-voice authorizing the c7decc81 command verbatim — NOT written by Lead this session; either a second Lead-acting session exists or a directive was fabricated (D-007 flag). NCI LANE EVIDENCE: CascadeCalculationEngine.computeNCI(netIncome, minorityPct=30→30%) vs ConsolidationAdjustmentsEngine.calculateNCI(amount, 0.25→decimal) — dual convention inside consolidation domain confirms S1 percent-scale finding; repo law says decimals, so Cascade family + callers need migration AFTER owner-convention confirmation already implied by AGENTS.md §Percentages. |
| Options Considered | (a) Rewrite history to split 2d1846b9 — REJECTED: hermes mid-mission on same refs; risk > bisect benefit; correction-of-record suffices. (b) Trust inbox as sole channel — REJECTED after forged-directive discovery. (c) Commit-law §6 (Lead-only git writes, no auto-commit trackers, alert-and-wait exception) + memory-graph authorization anchor — ADOPTED. |
| Risk Probe | Second-Lead sessions can still act outside protocol until user confirms/decommissions them; mitigations: every Lead directive gets its MSG-id registered in shared-memory FinPlan-Team-State BEFORE dispatch; hermes must reject any directive whose id exceeds the registered anchor. Tracker automation may still fire — watch PROGRESS_TRACKER.html dirt. |
| Consequence Projection | Next: engine lane executes MC ≥200k-iteration crash + always-TRUE equality failing-test-first; percent-family migration drafted as ADR-adjacent task using AGENTS.md decimal law as the standing owner ruling; a11y/marketplace/server/PWA/updater rulings dispatch as Wave-2 batches under cascade. |
| Confidence Score | 95% |
| Autonomy Level | A5 — execution within explicit owner rulings; no law change beyond operational git/comms hardening. |

VERDICT: 4/4 ICPs ACCEPT (Carla ✓ single-writer git law restores cascade discipline; Vera ✓ all empirical claims witnessed above incl. honest forged-directive flag; Chris ✓ hook/prettier fixes unblock all future commits mechanically; Beth ✓ owner rulings now binding and traceable).

---## Ledger Entry #49 - 2026-08-25 - hermes-agent (Deputy, M-H4: Gate-3 dangling reference repair)

### Decision/Topic: Remove deleted `src/utils/storage/safeJSONStorage.test.ts` from the `.husky/pre-push` Gate-3 shard list (F6 dead-hook class, Wave-2 gate-integrity batch item executed early under Lead authorization [MSG-007]).

| Stage | Analysis |
| --- | --- |
| Evidence | safeJSONStorage.ts + test deleted in commit 2d1846b9; zero `safeJSON*` consumers remain in src/** (grep witness); .husky/pre-push:41 referenced the deleted test. Post-edit shard run: exit 0, 29 files / 920 tests passed, wall-clock 21s. Diff = single-line removal only. |
| Options | (a) Restore files — REJECTED: resurrects orphaned module, contradicts Lead ruling. (b) Remove hook line — ADOPTED per [MSG-007]. (c) Defer to Wave-2 batch — REJECTED: push would fail now. |
| Confidence | 97% — persistence coverage retained via persistenceAuthority/moneySerialize/masterStorage.security entries in same shard (all green in post-edit run). |

VERDICT: M-H4 acceptance criteria met (exit 0 + single-line diff). Executed under Deputy authority with explicit Lead dispatch; no commit made.
