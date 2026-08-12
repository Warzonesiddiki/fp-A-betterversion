# Reasoning Ledger — FinPlan Pro (BMAD v5.0)

> **Established:** 2026-08-10 (v5.0 method upgrade) · **Purpose:** The project's permanent intellectual record. Every meaningful decision is logged with its DRP summary, confidence score, and autonomy level. Required reading for any agent inheriting ambiguous state.
> **Rule:** Every A5 decision logs full rationale; every A3/A2/A1 decision logs the reasoning and the human's response. Entries are append-only.

## Backfilled entries (2026-08-10 session history)

## Ledger Entry #1 — 2026-08-10 — Rex/System

### Decision/Topic: Adopt BMAD v5.0 ULTRA-YOLO as the project operating method (owner direction)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Owner provided the v5.0 ULTIMATE prompt and directed: upgrade the working style, restart from step 1, update existing work to the new standard, continue. Root need: preserve the research-first, zero-compromise foundation while adding self-governed execution (DRP + reasoning ledger + autonomy matrix). |
| Evidence | v4.0 charter, path-lock, and all artifacts exist and are hypothesis-approved (G0–G5). v5.0 preserves the same phases/gates/agents and adds the reasoning engine; no artifact contract is invalidated. |
| Options Considered | (a) Rewrite all artifacts to v5 template wholesale — rejected: churn without value; v5 adds process, not new product decisions. (b) Create v5 charter + reasoning ledger + autonomy tracker, supersede v4, backfill ledger, keep existing artifacts — ADOPTED: upgrades the operating system without destabilizing approved content. (c) Ignore v5 and continue v4 — rejected: explicit owner direction. |
| Risk Probe | Risk: ledger backfill could misrepresent past decisions. Mitigation: entries record what was actually done with evidence links. Risk: reference churn breaks docs-link-check. Mitigation: keep v4 file as historical; update the single project-context reference; re-run strict link check. |
| Consequence Projection | Immediate: new charter + ledger + autonomy tracker committed. Downstream: every future decision appends a ledger entry; escalation triggers are repo-mapped; existing path-lock and gates remain authoritative. |
| Confidence Score | 92% |
| Autonomy Level | A5 — FULL YOLO (owner-directed, reversible via artifact edits) |

### Adopted Path:
v5.0 charter (`_bmad/BMAD_V5_OPERATING_CHARTER.md`), v4 superseded in place, reasoning ledger established, project-context gains Autonomy Tracker + Ledger Reference.

### Rejected Alternatives:
Wholesale v5 template rewrite of every artifact (churn, no added decision value); continue v4 (ignores owner direction).

### Open Items:
None.

## Ledger Entry #2 — 2026-08-10 — Rex

### Decision/Topic: Record CI failure root cause as GitHub account billing block (E-005), not a code regression

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Why is CI red on merged main? Question required a verifiable root cause before any "fix". |
| Evidence | GitHub check-run annotations on every failed job (CI, tsc, lint, test-unit, build, deploy, cascade-hold, sentry-self-test): "The job was not started because recent account payments have failed or your spending limit needs to be increased." Failures predate PR #53 on other commits; jobs complete in seconds with zero steps; logs unretrievable (EOF) because nothing ran. |
| Options Considered | (a) Treat as code regression and debug the build — rejected: no job ever started; zero steps prove no code executed. (b) Treat as environment/billing issue and document — ADOPTED. (c) Ignore — rejected: silent state change. |
| Risk Probe | Risk: owner assumes PR #53 broke CI. Mitigation: evidence recorded in `_bmad/qa/ci-actions-billing-block-2026-08-10.md` with run IDs and annotation text. |
| Consequence Projection | Owner action required (Billing & plans); CI status must not be treated as code evidence until jobs run. |
| Confidence Score | 95% |
| Autonomy Level | A5 |

### Adopted Path:
Dedicated QA note + project-context §CI status + evidence-log E-005.

### Rejected Alternatives:
Code-level CI debugging (no steps ever ran); silent acceptance of red CI.

## Ledger Entry #3 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: Implement F-03 (Financial Context + Atlas Shell) with typed contract, URL serialization, five-pillar navigation, permission filtering

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | PRD E1 requires context (Scope→Time→Version→Currency→Freshness) to be typed, visible, serializable, permission-aware, and server-filtered for official views. |
| Evidence | UX §4.1 contract; ROLE_PERMISSIONS matrix exists; Atlas foundations merged (PR #53). |
| Options Considered | (a) Full five-pillar shell with route migration — rejected: pre-decides navigation/UX beyond safe foundation. (b) Typed context + context bar + role-filtered sidebar reusing existing routes + legacy group — ADOPTED: preserves all destinations, adds pillar semantics without direction change. (c) Context store only — rejected: leaves UX contract unmet. |
| Risk Probe | Risk: sidebar restructure breaks existing tests — mitigated: updated both Sidebar test files to pillar structure; all destinations preserved in pillars or Legacy group. Risk: URL serialization loops — mitigated: replace-only writes + equality guard. |
| Consequence Projection | Enables F-04 envelope sharing and context-aware pilot screens; no ICP/connector/vertical decision made. |
| Confidence Score | 90% |
| Autonomy Level | A5 |

### Adopted Path:
`src/types/financialContext.ts`, `financialContextStore`, `FinancialContextBar`, `navigation.ts`, `usePillarNavigation`, Sidebar/AppLayout updates; 50 targeted tests; QA APPROVED.

### Rejected Alternatives:
Full shell migration (direction change); store-only (contract unmet).

## Ledger Entry #4 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: F-04 Control-Plane spike — typed command envelope server + in-memory registry, idempotency, base revisions, negative authorization, audit evidence

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Prove the authoritative command boundary as a spike before any production migration: typed envelope, trusted-actor scope, idempotency, concurrency (revisions), audit. |
| Evidence | Architecture §§3/6; existing auth/entityAuth middleware + AuditService + audit_trail schema; ADR-E02/E03. |
| Options Considered | (a) Production-grade PostgreSQL implementation — rejected: beyond spike scope, no deployment decision made. (b) In-memory spike with explicit ephemerality + migration path — ADOPTED. (c) No spike — rejected: A-04/A-05 stay untested technically. |
| Risk Probe | Risk: sandbox mock-DB fallback misleads — mitigated: queries written correct on real SQLite and mock; caveat documented. Risk: idempotency key collisions — UUIDs via crypto.randomUUID, never Math.random. |
| Consequence Projection | 8 contract tests + 121 server tests; migration path recorded in architecture §11.1; client boundary proven. |
| Confidence Score | 90% |
| Autonomy Level | A5 |

### Adopted Path:
`server/src/types/commandEnvelope.ts`, `CommandRegistry`, `routes/commands.ts` (`POST/GET /api/v1/commands`), mounted in index.ts; QA APPROVED.

### Rejected Alternatives:
Production implementation (scope); skipping the spike (unvalidated).

## Ledger Entry #5 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: F-04 client completion — typed CommandClient, feature-flag gated, no zod import

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The client needs a typed, safe transport that can never accidentally act without a configured Control Plane; bundle limits are strict. |
| Evidence | Architecture calls for typed checked client; zod is available but adds bundle weight; bundle-check enforces gzip limits. |
| Options Considered | (a) zod-validated client — rejected: bundle cost vs. benefit; server already validates authoritatively. (b) Manual `isCommandResult` guard + feature flag — ADOPTED: lean, typed, safe. (c) Wire client into a screen — rejected: pre-decides deployment; flag stays off. |
| Risk Probe | Risk: envelope drift between server/client — mitigated: mirrored contract types + tests on both sides. Risk: accidental use without config — mitigated: ControlPlaneDisabledError + isControlPlaneEnabled gate. |
| Consequence Projection | 14 client/contract tests; inventory registers Command Client (UNVERIFIED maturity); no screen wiring until a Control Plane is configured. |
| Confidence Score | 92% |
| Autonomy Level | A5 |

### Adopted Path:
`src/api/commandClient.ts` + contract types + env typing; QA addendum; capability generator extended for `src/api`.

### Rejected Alternatives:
zod client (bundle); screen wiring (pre-decides deployment).

## Ledger Entry #6 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: CI governance hardening — SHA-pin actions, shard unit tests, blocking a11y gate; preserve workflow changes when push lacks `workflows` permission

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | CI cannot run (billing block), but the CI *configuration* must still satisfy the repo's own governance scripts (compliance-evidence 19/22 → 22/22). |
| Evidence | `compliance-evidence.mjs` CI-002/003/004 FAIL; `architecture-guardrails.mjs` SHA-pin check failed; all workflow uses were `@vN` tags. |
| Options Considered | (a) Fix config, push — blocked by missing `workflows` permission. (b) Fix config, preserve as documented worktree changes, push everything pushable — ADOPTED. (c) Skip — rejected: leaves governance red. |
| Risk Probe | Risk: workflow changes lost across sandbox recycles — mitigated: backed up, documented in two artifacts with exact content. Risk: SHA resolution wrong — mitigated: resolved current tag SHAs via git ls-remote; guardrail passes. |
| Consequence Projection | Compliance 22/22; a11y gate blocking (runner exists, passes locally 448 tests); sharding verified locally; owner must land workflow files. |
| Confidence Score | 88% |
| Autonomy Level | A4 (STEALTH — high-criticality config change verified in parallel; push caveat escalated A3 to owner) |

### Adopted Path:
9 workflow files pinned + sharded + a11y blocking (worktree, documented); compliance-evidence.json + notes committed.

### Rejected Alternatives:
Skipping hardening (governance stays red); force-pushing without permission (impossible/improper).

## Ledger Entry #7 — 2026-08-10 — Amelia/Quinn

### Decision/Topic: Extend F-02 interim structural baselines (empty+populated Dashboard, context bar, all 10 status states, PageHeader) — never claim pixels

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | F-02 needs visual-regression evidence; the sandbox cannot run a browser. Interim evidence must strengthen without overclaiming. |
| Evidence | VISUAL_REGRESSION_RUNBOOK scenarios; existing structural baseline precedent (AtlasFoundations, DashboardPage.populated.contract). |
| Options Considered | (a) Fabricate pixel baselines — rejected: violates zero-compromise evidence rule. (b) DOM/class structural baselines for each runbook scenario — ADOPTED. (c) Stop F-02 work — rejected: safe foundations may progress. |
| Risk Probe | Risk: snapshots treated as pixel proof — mitigated: every file/QA note states pixels/fonts/theme remain unverified. |
| Consequence Projection | 8-test Atlas suite + populated Dashboard baseline; real heading-order defect found and fixed (h1→h3). |
| Confidence Score | 95% |
| Autonomy Level | A5 |

### Adopted Path:
Structural baselines + jest-axe; F-02 verdict stays REJECTED — REQUIRES COMPLETION.

### Rejected Alternatives:
Fabricated baselines (never); stopping safe foundation work.

## Ledger Entry #8 — 2026-08-10 — System

### Decision/Topic: Sandbox recycle reconciliation procedure — verified fast-forward + index refresh, never destructive commands

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The sandbox has recycled repeatedly: git refs return to the shallow `f3834e2` clone while the worktree keeps all files. The invariant: never lose work, never use reset/restore/clean. |
| Evidence | Multiple occurrences observed; remote branch always holds the authoritative commits; worktree content verified byte-identical via git show/diff. |
| Options Considered | (a) reset --hard — rejected: destructive, prohibited by handover. (b) update-ref + git add -A + verify diff vs FETCH_HEAD — ADOPTED: ref-only move, index refresh, zero data loss. |
| Risk Probe | Risk: staging the 9 intentional workflow changes into commits — mitigated: `git restore --staged .github/workflows/` after each `add -A`; documented caveat. |
| Consequence Projection | Reliable recovery across 5+ recycle events; workflow files persist as intentional worktree-only changes. |
| Confidence Score | 95% |
| Autonomy Level | A5 |

### Adopted Path:
Documented reconciliation sequence used every recycle; no destructive command ever run.

### Rejected Alternatives:
reset/clean/restore (prohibited); abandoning work (unacceptable).

---

## New entries (from this method-upgrade session)

## Ledger Entry #9 — 2026-08-10 — Rex

### Decision/Topic: v5 restart Step 1 — re-certify Phase 0 (research baseline + assumptions with confidence scoring)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | v5 requires confidence-governed autonomy: every assumption needs an explicit confidence score in addition to its validation status. |
| Evidence | research-report v2.0, assumption-registry v2.0 (14 assumptions), validation-plan v2.0, evidence-log E-001..E-005; no new primary evidence. |
| Options Considered | Rewrite research (rejected: churn, no evidence change); re-certify + add Confidence/Last-reviewed columns (ADOPTED); skip (rejected: v5 standard unmet). |
| Risk Probe | Confidence scores misread as validation — mitigated: scores are confidence-in-hypothesis; Status column remains UNVALIDATED; header note explains. |
| Consequence Projection | Registry v2.1; every assumption scored honestly (A-05 40% highest, A-01 10% lowest); gates unchanged. |
| Confidence Score | 94% |
| Autonomy Level | A5 |

### Adopted Path: registry v2.1 + research-report v2.1 header + `_bmad/v5-restart-2026-08-10.md` Step 1.

## Ledger Entry #10 — 2026-08-10 — Ana

### Decision/Topic: v5 restart Step 2 — re-certify Phase 1 (Product Brief)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Brief must stay traceable to research/assumptions; v5 adds the reasoning ledger requirement. |
| Evidence | product-brief v2.2 (G1-approved); thesis, evidence table, A-13-tagged target customer all intact. |
| Options Considered | Rewrite (rejected); re-certify (ADOPTED); skip (rejected). |
| Risk Probe | Stale claims — verified sections still match research v2.x. |
| Confidence Score | 93% · Autonomy Level | A5 |

### Adopted Path: brief v2.3 header + restart record Step 2.

## Ledger Entry #11 — 2026-08-10 — Percy/Uxie

### Decision/Topic: v5 restart Step 3 — re-certify Phase 2 (PRD + UX)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Every requirement/UX pattern must trace to research or assumptions; NFRs measurable. |
| Evidence | prd v2.1 (G2), ux-design v2.1 (G3), traceability matrix; F-03 implemented the UX §4 trust-language contract (context bar + badges). |
| Options Considered | Rewrite (rejected); re-certify (ADOPTED); skip (rejected). |
| Risk Probe | Requirements drift — traceability matrix verified current (R-01..R-07, A-01..A-14). |
| Confidence Score | 93% · Autonomy Level | A5 |

### Adopted Path: PRD/UX v5 headers + restart record Step 3.

## Ledger Entry #12 — 2026-08-10 — Archie

### Decision/Topic: v5 restart Step 4 — re-certify Phase 3 (Architecture + ADRs)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Architecture decisions trace to requirements; rejected alternatives documented; spike evidence recorded. |
| Evidence | architecture v2.1 (G4) with ADR register; F-04 spike outcome §11.1 (envelope, scope, idempotency, audit; migration path); alignment report. |
| Options Considered | Rewrite (rejected); re-certify (ADOPTED); skip (rejected). |
| Risk Probe | Spike claims overread — §11.1 explicitly marks spike-only and sandbox mock-DB caveat. |
| Confidence Score | 92% · Autonomy Level | A5 |

### Adopted Path: architecture v5 header + restart record Step 4.

## Ledger Entry #13 — 2026-08-10 — Bob/Amelia/Quinn

### Decision/Topic: v5 restart Step 5 — re-certify Phase 4 (Delivery: sprint plan, stories, verification)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Delivery must sequence evidence (R) before pilot commitments (P), with safe foundations (F) that do not pre-decide market choices; statuses must match QA evidence. |
| Evidence | sprint-plan v2.1 status table; stories R-01 (IN PROGRESS), R-02..04 (BLOCKED), F-01/F-03/F-04 (DONE/QA-APPROVED), F-02 (IN PROGRESS); QA reports filed. |
| Options Considered | Re-shard (rejected: approved plan stands); re-certify statuses (ADOPTED); skip (rejected). |
| Risk Probe | Status drift — each status cross-checked against its QA report before this entry. |
| Consequence Projection | Restart record complete; open escalations (CI billing, workflows permission, R-01, F-02 browser) carried forward. |
| Confidence Score | 94% · Autonomy Level | A5 |

### Adopted Path: sprint-plan v2.2 header + restart record Step 5 + this ledger set.

---

## Ledger Entry #14 — 2026-08-10 — System (All agents)

### Decision/Topic: Activate the BMAD v5.0 Reasoning & Quality Addon (Ultimate Thought Protocol) as a durable operating layer

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The owner supplied the addon to elevate reasoning rigor and quality standards; Law 4 (context on disk) requires it to live in the repo, not chat. |
| Evidence | Owner-provided addon prompt; existing v5 charter/ledger structure ready to receive it. |
| Options Considered | (a) Chat-only application — rejected: violates context-on-disk; lost across sessions. (b) Durable artifact `_bmad/BMAD_V5_REASONING_QUALITY_ADDON.md` + charter link + ledger entry — ADOPTED. (c) Rewrite existing artifacts to addon format — rejected: churn without content change. |
| Risk Probe | Risk: addon becomes ceremony — mitigation: charter mandates PoT for QA verdicts/ACs/assumptions/ADRs and RDS ≥ 8 gate; this turn applies it to real work. |
| Consequence Projection | Every future artifact carries PoT where mandated, an RDS score, and passes the final execution check; QA verdicts now require explicit reasoning evidence. |
| Confidence Score | 94% |
| Autonomy Level | A5 |

### Adopted Path: `_bmad/BMAD_V5_REASONING_QUALITY_ADDON.md` (full addon text), linked from `BMAD_V5_OPERATING_CHARTER.md` and `project-context.md`.

### Rejected Alternatives: chat-only application (lost state); wholesale artifact rewrite (churn).

---

## Ledger Entry #15 — 2026-08-10 — Quinn (security audit under v5 addon)

### Decision/Topic: Fix CSRF token fallback — fail closed instead of Math.random (security finding)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Stated rule: "Never use Math.random for security IDs/tokens." Audit found `generateCSRFToken()` fallback using `Math.floor(Math.random() * chars.length)` when `crypto.getRandomValues` is absent. |
| Evidence | `src/utils/security.ts` lines 437–441 (pre-fix); `src/utils/cryptoId.ts` documents the same rule; `auditTrailStore.ts` already enforces CSPRNG for audit IDs. |
| Options Considered | (a) Keep Math.random fallback — rejected: violates the rule and the "no silent security failures" standard. (b) Fail closed with a descriptive throw — ADOPTED. (c) Alternate PRNG fallback — rejected: still not cryptographically secure. |
| Risk Probe | Risk: a crypto-less runtime now throws at token time — acceptable: crypto exists in all realistic runtimes; failing loudly is correct. Tests stub crypto, so primary path coverage is unaffected. |
| Consequence Projection | `security.test.ts` gains a fail-closed regression test (51/51 pass); lint + tsc green; full suite re-run in progress. |
| Confidence Score | 95% |
| Autonomy Level | A5 |

### Adopted Path: fail-closed throw + regression test; evidence logged.

### Rejected Alternatives: keep weak fallback (rule violation); alternate PRNG (not secure).

---

## Ledger Entry #16 — 2026-08-10 — Quinn/Amelia (real-SQLite server verification)

### Decision/Topic: Run the server suite against REAL SQLite (native better-sqlite3) and fix everything the mock DB had masked

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The server suite ran against an in-memory mock DB (native binding unavailable) — meaning schema, FK, and SQL-correctness bugs were invisible. Real verification requires the real database. |
| Evidence | `node-gyp` needs nodejs.org headers (TLS-blocked); local headers exist at /usr/local/include/node → `npm_config_nodedir=/usr/local` built the native binding. First real-DB run: 7/11 suites failed. |
| Options Considered | (a) Keep mock and claim 121 passing — rejected: masks bugs. (b) Build native + fix all surfaced issues — ADOPTED. (c) Skip server verification — rejected. |
| Risk Probe | Risk: test isolation — parallel files shared one DB file (one file's cleanup deleted another's live DB) → fixed with per-worker FINPLAN_DB_PATH. Risk: schema changes affect Tauri — audit_trail reconciled in place; Tauri never reads it. |
| Consequence Projection | All 198 server tests now pass on real SQLite (13 files, native config). |
| Confidence Score | 93% |
| Autonomy Level | A5 |

### Adopted Path: native binding + schema guarantee + canonicalization + seeding. See Evidence E-007.

### Rejected Alternatives: keep mock (masks bugs); change routes to legacy schema (loses semantics).

---

## Ledger Entry #17 — 2026-08-10 — Quinn

### Decision/Topic: Add real-SQLite regression tests for the schema reconciliation; harden ensureServerColumns for absent tables

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The reconciliation logic fixed real bugs (E-007) but had no regression coverage — the addon mandates tests for every new code path. |
| Evidence | ensureCanonicalAuditTrail/ensureServerColumns were exercised only implicitly via the server suite; a direct test exposed that ensureServerColumns threw on absent tables (partial/legacy DBs). |
| Options Considered | (a) Test only the happy paths — rejected: leaves the throw-on-missing-table landmine. (b) Harden the function (skip absent tables with a warning; 001 remains the table-creation authority) + cover happy, no-op, idempotent, legacy-migration, and missing-table cases — ADOPTED. |
| Risk Probe | Risk: skipping absent tables could mask a genuinely broken schema — mitigated: 001 runs first in ensureSchema (table creation), so absence here means partial/legacy DBs, logged explicitly. |
| Consequence Projection | 6 new real-SQLite tests; server suites 127/127 (default) and 204/204 (native). Tauri-side verified: no Rust/SQL consumer of the legacy audit_trail shape. |
| Confidence Score | 94% |
| Autonomy Level | A5 |

### Adopted Path: schemaReconciliation.test.ts + skip-absent-table hardening in ensureServerColumns.

### Rejected Alternatives: happy-path-only tests (landmine remains); throwing on absent tables (breaks partial DBs).

---

## Ledger Entry #18 — 2026-08-10 — Quinn

### Decision/Topic: Boot-contract verification + mock-fallback honesty resolution

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | After the real-SQLite migration, the boot path (fresh DB -> ensureSchema/runMigrations -> route tables) had no direct contract test, and the mock-fallback path's post-migration behavior was unknown. |
| Evidence | bootSchema.test.ts (3 tests, both configs): fresh per-worker DB has all 17 route tables, canonical audit_trail shape, server columns. runMigrations() probe: idempotent, no throw. Mock-fallback probe: the fallback cannot be forced under vitest while the native binding exists (createRequire resolves the real module), and production forbids the fallback (fail-fast) — so it is a dev-only escape hatch, not a product path. |
| Options Considered | (a) Invest in refactoring connection.ts to make the mock unit-testable — rejected: the mock is a deliberately-ephemeral dev fallback; production fails fast without native; testing it adds surface without product value. (b) Boot-contract test + explicit fallback-honesty note — ADOPTED. (c) Remove the mock entirely — rejected: it keeps sandbox/CI dev runs alive when the native binding cannot be built. |
| Risk Probe | Risk: a future change breaks boot without CI noticing — mitigated: bootSchema.test.ts is in both server suites. Risk: someone trusts the mock as verification — mitigated: architecture/QA notes state real SQLite is the verification path; mock is dev-only. |
| Consequence Projection | Server suites 130/130 default, 207/207 native; boot path locked by contract test. |
| Confidence Score | 93% |
| Autonomy Level | A5 |

### Adopted Path: bootSchema.test.ts (durable) + fallback-honesty documentation.

### Rejected Alternatives: mock-refactor for testability (no product value); mock removal (breaks dev fallback).

---

## Ledger Entry #19 — 2026-08-10 — Quinn

### Decision/Topic: compliance-evidence determinism + security audit completion (cryptoId) + server coverage confirmation

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | (1) compliance-evidence.json produced timestamp-only diffs on every run — violating the repo's deterministic-governance standard (capability matrix is deterministic). (2) E-006 flagged cryptoId.ts's fallback as "previously weakened" — needed verification. (3) Server coverage completeness was unverified. |
| Evidence | compliance-evidence.mjs line 23 wrote `new Date().toISOString()`; only the script + package.json reference the file (no runtime consumer of `timestamp`). cryptoId.ts uses randomUUID → getRandomValues hex → throws (never Math.random) and has full test coverage (format/prefix/uniqueness/no-CSPRNG-throw). Native vitest config runs all 15 server test files (207 tests); default runs 13 (excludes the 2 native-DB suites by design). |
| Options Considered | (a) Keep the timestamp — rejected: perpetual dirty tree. (b) Deterministic `generatedAt: 'from current working tree'` matching the capability-matrix convention — ADOPTED. (c) Gitignore the file — rejected: it is a committed evidence artifact; determinism is the right fix. |
| Risk Probe | Risk: losing "when evidence was produced" — mitigated: git history records when checks changed; the script is the source of truth. |
| Consequence Projection | compliance-evidence.json is now deterministic (hash-stable across runs); security audit closed (no finding in cryptoId); coverage confirmed complete. |
| Confidence Score | 95% |
| Autonomy Level | A5 |

### Adopted Path: deterministic generatedAt marker; security audit closed; coverage confirmed.

### Rejected Alternatives: keep timestamp (dirty tree); gitignore (loses committed evidence).

---

## Ledger Entry #20 — 2026-08-11 — Rex (multi-agent R-01 squad)

### Decision/Topic: Advance R-01 via a multi-agent research squad — real public recruitment channels, no fabricated participants

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | R-01 needs real participants. The owner directed using multiple agent personas with real-world/internet access. Compliance boundary: I can research REAL public channels and build an outreach-ready pool; I must NOT fabricate participants or impersonate interviewees (repo evidence rules; R-01 blocker text). |
| Evidence | Live web research on 2026-08-11 verified 19 real channels across five cohorts (conferences, associations, communities, implementation partners) — all with public URLs. Secondary practitioner signals captured and labeled (r/FPandA EPM thread). |
| Options Considered | (a) Simulate participants to "complete" R-01 — rejected: fabrication, violates the core evidence rule. (b) Multi-agent real research → source map + tracker OUTREACH-READY + owner executes outreach — ADOPTED. (c) Leave R-01 untouched — rejected: owner asked for progress. |
| Risk Probe | Risk: channels treated as evidence — mitigated: E-011 explicitly SECONDARY; no assumption validated. Risk: PII in repo — mitigated: no contact details stored; owner executes outreach. |
| Consequence Projection | R-01 is now outreach-ready with 19 real venues; owner action converts channels to participants; R-02..R-04 remain gated on real evidence. |
| Confidence Score | 93% |
| Autonomy Level | A5 (within the fabrication boundary) |

### Adopted Path: participant-source-map + tracker update + E-011 + this entry.

### Rejected Alternatives: simulated participants (fabrication — never); no-op (ignores direction).

---

## Ledger Entry #21 — 2026-08-11 — Rex (multi-agent squad round 2)

### Decision/Topic: Complete all research-part readiness — round-2 squad research + full R-02/03/04 execution kits

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The owner directed: "COMPLETE ALL RESEARCH PART FIRST" and earlier authorized multi-agent personas with real internet access. The research part has two halves: (a) real secondary intelligence to sharpen questions, (b) an execution stack so R-02/03/04 run the moment participants exist. Primary validation cannot be completed without real participants — that remains owner-executed outreach. |
| Evidence | Round-2 live web research (5 searches across commercial/close/FP&A/deployment/implementation domains) produced the secondary-evidence synthesis (E-012) with real, citable public sources. All five kits built (E-013) extending the existing templates. |
| Options Considered | (a) Fabricate participants to "complete" R-02/03/04 — rejected: violates the core evidence rule permanently. (b) Build readiness + secondary intelligence, mark stories READY with explicit participant gate — ADOPTED. (c) Stop at R-01 channels — rejected: leaves the research part under-prepared. |
| Risk Probe | Risk: kits mistaken for evidence — mitigated: E-012/E-013 explicitly NOT participant evidence; stories say READY not DONE; no assumption status changed. |
| Consequence Projection | The moment the owner returns anonymized participant outcomes, R-02/03/04 execute with zero further preparation. |
| Confidence Score | 94% |
| Autonomy Level | A5 (within the fabrication boundary) |

### Adopted Path: 5 research artifacts + validation-plan v2.1 + story statuses READY + evidence E-012/E-013.

### Rejected Alternatives: fabricated participants (never); partial readiness (under-prepared).

---

## Ledger Entry #22 — 2026-08-11 — Rex (owner direction)

### Decision/Topic: Re-baseline the research/validation path for solo development (no enterprise participants)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Owner: "we don't have such option available — we are solo developing the project." The R-track as specified (enterprise interviews → sessions → synthesis → pilot) cannot execute; keeping it blocked stalls the project; fabricating participants destroys integrity permanently. |
| Evidence | Owner direction (verbal, recorded 2026-08-11); existing R-01 kits (source map, outreach kit, session kit) now retained for future revival; validation-plan v2.1 with thresholds. |
| Options Considered | (a) Keep R-track blocked indefinitely — rejected: project stalls. (b) Fabricate participants — rejected: permanent integrity violation. (c) Solo-achievable evidence strategy (Tier 2–4: beta signals, artifacts, secondary) with strict honesty labels, R-01 REDIRECTED, P-track re-scoped to public-beta segment — ADOPTED. (d) Silent continuation without documentation — rejected: violates no-silent-state-change. |
| Risk Probe | Risk: beta signals overread as validation — mitigated: only Tier 1 changes VALIDATED; tiers 2–4 update confidence/scope only. Risk: losing the enterprise path — mitigated: kits retained; revivable. Risk: P-track scope creep — mitigated: re-scoped explicitly to public-beta segment. |
| Consequence Projection | Browser/PWA unblocking (A-12) becomes a beta prerequisite; F-track continues; assumption statuses unchanged. |
| Confidence Score | 92% |
| Autonomy Level | A5 (direction explicitly owner-given) |

### Adopted Path: owner-direction record + path-lock update + validation-plan v2.2 + registry v2.2 + stories R-01..R-04 re-baselined + sprint-plan + evidence E-014.

### Rejected Alternatives: indefinite block (stall); fabrication (integrity); silent change (path-lock violation).

---

## Ledger Entry #23 — 2026-08-11 — Amelia/Quinn (F-05)

### Decision/Topic: Implement flag-gated browser beta enablement (solo-dev validation loop enabler)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The solo-dev evidence strategy needs a public beta; the app hard-blocks non-Tauri. Enable browser rendering ONLY behind an explicit flag so the default runtime behavior is unchanged and no unsupported-capability claim is made. |
| Evidence | App.tsx gate (`!isTauri` → alert + null); 14 files import @tauri-apps (most already guarded: DashboardPage modal fallback, useTauriMenu dynamic import). Owner direction 2026-08-11 (solo dev). |
| Options Considered | (a) Remove the gate entirely — rejected: silently broadens supported runtime, contradicts honesty rules. (b) Flag-gated (VITE_BETA_WEB) with pure testable gate module + honest marker — ADOPTED. (c) Full browser hardening now — deferred: needs the remaining-work list (storage/shortcuts no-ops). |
| Risk Probe | Risk: beta mode crashes on unguarded Tauri calls — mitigated: remaining-work list + full-suite verification; DashboardPage already falls back. Risk: overclaim — mitigated: marker + console note + A-12 unchanged. |
| Consequence Projection | Beta channel exists; P-track re-scoped to public-beta segment becomes actionable; browser hardening continues as F-05 remaining work. |
| Confidence Score | 90% |
| Autonomy Level | A5 (within story scope) |

### Adopted Path: betaMode.ts + tests (5/5) + App.tsx gate + env typing; story F-05 AC1-AC6.

### Rejected Alternatives: remove gate (overclaim); full hardening in one turn (too broad without browser env).

---

## Ledger Entry #24 — 2026-08-11 — Amelia/Quinn (F-05 hardening slice)

### Decision/Topic: Complete F-05 remaining work — Tauri-import hardening, in-browser no-op fallbacks, beta smoke test, full beta-mode suite

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Browser beta mode must render without crashing, must never silently claim Tauri capabilities, and must degrade gracefully when a Tauri-only facility is unavailable (storage, shortcuts, native windows, notifications). The solo-dev validation loop (Tier 2 BETA-USAGE) needs this channel to be crash-proof. |
| Evidence | Import-time probe of `@tauri-apps/api`, `plugin-sql`, `plugin-notification`, `plugin-global-shortcut`, `api/webviewWindow` in a non-Tauri runtime: ALL imports safe; ALL calls throw without Tauri internals. Audit of all 14 `@tauri-apps` import sites: 7 runtime sites (all previously guarded at call time), 7 test/mock/type sites. Full default suite 1,188 files / 13,372 tests + full beta-mode suite 1,188 files / 13,373 tests, both 0 failures. |
| Options Considered | (a) Smoke test only, no code change — rejected: leaves top-level Tauri imports in the browser bundle; latent risk; handover explicitly lists stubs. (b) Guarded lazy imports + no-op fallbacks + smoke test — ADOPTED. (c) Vite alias mocking of `@tauri-apps` for browser builds — rejected: masks real behavior, more surface. |
| Risk Probe | Risk: lazy-import refactor changes Tauri behavior — mitigated: identical modules/calls, full default suite green. Risk: tests encoded the old storage contract — updated to the new no-op contract (storage tests 24/24). Risk: marker set on blocked path (minor honesty bug found by smoke test) — fixed: marker only when beta actually active; runtime check per-render. Risk: IndexedDB absent in some browsers — CubeEnginePersistence now falls back to an in-memory backend (8 new tests). |
| Consequence Projection | F-05 hardening complete; beta channel crash-proof; T-05 launch kit drafted; R-track Tier-2 loop unblocked (deploy decision stays owner's). |
| Confidence Score | 90% |
| Autonomy Level | A5 (within F-05 story scope; handover §12 item 1) |

### Adopted Path: 6 runtime files hardened, 2 test files updated to the no-op contract, 3 new test files (smoke 4 tests, in-memory fallback 8 tests, viewport contract 5 tests), `.env.example` feature-flag docs, server test-DB litter cleanup (vitest 4 `afterAll` per-file; native config gains setup isolation), dead `server/src/test/seedHelpers.ts` deleted, vitest exclusion decision documented, F-05 QA review recorded.

### Rejected Alternatives: smoke-test-only (latent risk); vite-alias mocking (masks behavior); `globalTeardown` for DB cleanup (vitest 4 removed it — per-file `afterAll` used instead).

### Open Items: F-05 final visual sign-off needs a browser-capable environment (T-10-style); beta deploy decision remains owner's (T-06).

---

## Ledger Entry #25 — 2026-08-11 — Rex/Amelia (V-series verification gaps + canary disposition)

### Decision/Topic: Run the never-run verification commands (D1) and dispose of the dangling canary scripts

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Handover addon D1 lists five verification commands as NEVER RUN: canary:stage1\|2\|3, sbom, release:dry-run, full audit, test:bench. Running them is required before any "verified" claim; a command that cannot run must be disposed of honestly, not silently. |
| Evidence | `npm run sbom`: PASS — 40 components (CycloneDX to stdout). `npm run release:dry-run`: PASS — all 7 checks (root tsc, eslint src, production build, money:adoption, engines:verify, docs:verify, server tests 130/130). `npm run test:bench`: PASS — 13 files / 59 tests. `npm audit` (full): 0 vulnerabilities (after brace-expansion override). `npm run canary:stage1\|2\|3`: FAIL — the scripts reference `scripts/canary-2.0/...` runner files that were never committed; verified via `git log --all` (no such files in history) and repo grep (no CI/docs references). |
| Options Considered | (a) Invent canary runners — rejected: no contract exists for what stage1/2/3 should check; fabricating a verification tool is fabrication-adjacent. (b) Remove the 3 dangling scripts from package.json — ADOPTED: restores manifest truth; the handover's "NEVER RUN" item is disposed of as "runners never existed — removed 2026-08-11". (c) Leave broken — rejected: guaranteed failure for any reviewer/CI invoking them. |
| Risk Probe | Risk: removing scripts breaks CI — verified none reference them. Risk: `@huggingface/transformers` "missing" flagged by `npm ls` — verified it is an OPTIONAL peer dependency (peerDependenciesMeta.optional, AIEngine runtime-computed specifier, N-0004/N-0005 CVE rationale) and intentionally not installed; NOT drift. Risk: release dry-run failure initially — root-caused to missing native better-sqlite3 binding after a node_modules recycle (mock fallback masks server columns), not a code regression; rebuild fixed it, 7/7 passed. |
| Consequence Projection | All D1 commands now have recorded PASS dispositions; package.json no longer advertises broken scripts; environment note: node_modules does not persist across sandbox turn boundaries (snapshot exclusion) — every session must re-run `npm ci` + server native rebuild before verification, and a missing-binding failure must be treated as environment, not regression. |
| Confidence Score | 92% |
| Autonomy Level | A5 (hygiene/verification scope, handover addon D1/D3) |

### Adopted Path: removed 3 dangling canary scripts; ran and recorded sbom / release:dry-run / test:bench / full audit; documented optional-peer by-design for @huggingface/transformers.

### Rejected Alternatives: invented canary runners (fabrication-adjacent); leaving broken scripts; treating optional-peer "missing" as lock drift.

### Open Items: none new; owner-side blockers unchanged (billing, workflows permission, browser env, hosting decision).

---

## Ledger Entry #26 — 2026-08-12 — Owner/System (restored from HANDOVER_PROMPT_SESSION11; the post-merge docs commit 7e490cd carrying this entry was deleted with the arena branch — content reconstructed from the handover's documented risk decision, §11)

### Decision/Topic: Merge PR #55 (feat(f-05): browser beta hardening + verification gap closure) into main at the owner's explicit instruction despite failing CI

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Required checks were red at merge time, but every job fails before starting due to the repo-wide GitHub Actions billing block (E-005: "recent account payments have failed or your spending limit needs to be increased") — an account-level infrastructure condition predating PR #53. No job ever executed, so red CI carries no code-failure signal; treating it as a code gate would block all owner-requested delivery indefinitely. |
| Evidence | Same billing annotation on every job of every workflow (see `_bmad/qa/ci-actions-billing-block-2026-08-10.md`); identical precedent for the PR #53 and PR #54 merges at owner instruction; local verification of the merged content green: root 1,189 files / 13,377 tests 0 failures (default and beta-mode identical), server 130/130 default + 207/207 native, tsc 0 (root + server), eslint full src 0, compliance 22/22 (with worktree workflows applied), guardrails PASS, audit 0 (prod + full), release:dry-run 7/7, sbom 40. |
| Options Considered | (a) Block the merge until CI turns green — rejected: the billing block is owner-side (Billing & plans) and no code change can clear it; the branch was feature-complete and locally verified. (b) Merge at the owner's explicit instruction with the risk decision documented — ADOPTED (PR #55 comment + this ledger entry). |
| Risk Probe | Risk: a latent regression lands untested by CI — mitigated by the local verification battery above (13,377 tests) and the T-15 triage plan: after billing clears, re-run workflows on main and classify failures as environment/bootstrap (native modules in server tests) vs regressions. |
| Consequence Projection | F-05 lands on main; future required-check bypasses must NOT happen without explicit owner instruction plus a documented risk decision. |
| Confidence Score | 92% |
| Autonomy Level | A3 (merge required owner instruction; executed on it) |

### Adopted Path: PR #55 merged 2026-08-12 (merge commit `8d17058`); risk decision documented on the PR #55 comment and here.

### Rejected Alternatives: blocking the merge until CI is green (owner-side infrastructure block, no code remedy).

### Open Items: re-run workflows on main after the billing block clears (T-14/T-15 triage); land the 9 hardened workflow files with a workflows-enabled token (T-13).

---

## Ledger Entry #27 — 2026-08-12 — System (post-handover session start: sandbox recycle recovery + worktree reconciliation)

### Decision/Topic: Recover the recycled sandbox worktree and restore the documented uncommitted workflow-hardening state

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The sandbox recycle wipes node_modules and left the git worktree incomplete: the restore-time checkout was interrupted (stale 0-byte `index.lock`, empty index, ~2,700 HEAD files missing from disk; only ~51 top-level paths restored). Local refs were already correct (HEAD == origin/main == `8d17058`, the PR #55 merge), and the arena branch had been deleted from the remote after merge (no refs remain; `7e490cd` existed only on that branch). The handover's `git add -A` reconciliation would have staged 2,907 deletions — it was blocked by the stale lock, which is why the empty-index state was detectable before any damage. |
| Evidence | `git ls-files` = 0 entries; `git diff HEAD` = 2,907 phantom deletions; `.github/workflows/*` present on disk byte-identical to HEAD (the uncommitted hardening was NOT in the snapshot; only the committed `ci-patches/` survive); object DB intact (`git show HEAD:package.json` reads fine); other Freebuff worktrees hold only partial/older states (main worktree = SHA-pinned but pre-shard intermediate). |
| Options Considered | (a) Handover's `git add -A` + unstage workflows — rejected: would stage 2,907 deletions given the missing files (index-destructive). (b) `git checkout HEAD -- .` / `git restore .` — rejected: charter + handover forbid; would overwrite existing files. (c) Remove stale lock → `git read-tree HEAD` (index-only) → `git checkout-index -a` WITHOUT `-f` (writes only missing files, skips existing) — ADOPTED: strictly additive, preserves all on-disk content. |
| Risk Probe | Risk: existing files differ from HEAD (uncommitted work) — mitigated: checkout-index skips existing files; post-recovery status showed exactly one diff (`scripts/compliance-evidence.mjs`, a 0-byte truncated file from the interrupted restore — restored from HEAD) and zero remaining missing files. Risk: workflow hardening lost with the snapshot — mitigated: reconstructed from committed patches; `ci-patches/0002-loop3-sha-pin-shard-a11y-block.patch` is the exact scope the 2026-08-10 change log and the committed `compliance-evidence.json` describe (SHA-pin all actions, test sharding, blocking a11y gate); applying it reproduces the documented 22/22 + guardrails-PASS state, and the regenerated `compliance-evidence.json` is byte-identical to the committed oracle. Patches 0001/0003/0004/N-0004 do not stack on 0002 (overlapping ci.yml hunks) and are not required by any local gate — left in `ci-patches/` for future use. |
| Consequence Projection | Worktree == main + the 9 uncommitted hardened workflow files (the handover's documented state); the owner can commit them unchanged once `workflows` permission is granted (T-13). |
| Confidence Score | 90% |
| Autonomy Level | A5 (charter-sanctioned reconciliation: "verified fast-forward + index refresh; never reset/restore/clean") |

### Adopted Path: removed stale `index.lock`; `git read-tree HEAD`; `git checkout-index -a` (existing files preserved); restored the 0-byte `scripts/compliance-evidence.mjs` from HEAD; applied `ci-patches/0002-loop3-sha-pin-shard-a11y-block.patch` (worktree-only, unstaged); verified compliance-evidence 22/22, architecture guardrails PASS, no duplicate `if:` in the ci.yml summary job, F-05 beta tests 9/9 in both env variants.

### Rejected Alternatives: `git add -A` (would stage deletions); `git checkout`/`git restore .` (forbidden, destructive); stacking all five ci-patches (hunks overlap; 0002 alone reproduces the documented oracle state).

### Open Items: none new; owner-side blockers unchanged (billing E-005, workflows permission T-13, browser env T-10, hosting decision T-06).

---

## Ledger Entry #28 — 2026-08-12 — Owner/System (desktop-only product decision: browser beta channel removed)

### Decision/Topic: Remove the F-05 browser beta channel — the product is a desktop app, not a web app

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Owner direction (2026-08-12): "we are building an app not a web app or website" → "Beta channel: Desktop-only — remove it". The F-05 `VITE_BETA_WEB` channel existed solely to enable a Tier-2 BETA-USAGE evidence loop (validation-plan v2.2); it was never a supported capability (A-12 UNVALIDATED). Removing it restores the pre-F-05 Tauri-only contract: a plain browser must alert and render nothing. The removal must be honest and complete (no dead knob left documented, no orphaned module) without touching unrelated hardening the test suite depends on. |
| Evidence | Beta surface mapped: `src/utils/betaMode.ts` (isTauriRuntime/isBrowserBetaAllowed/isRenderAllowed), `betaMode.test.ts` (5 tests), `betaMode.app.test.tsx` (4 smoke tests), `src/App.tsx` (data-beta-web effect + gate), `src/store/uiStore.ts` (isTauriRuntime import), `src/vite-env.d.ts` (VITE_BETA_WEB), `.env.example` (flag doc), README browser claims. No CI/test-config/scripts references to VITE_BETA_WEB exist (rg across `.github/`, `scripts/`, `src/test/`, vitest configs: 0 hits). `isTauriRuntime` consumers outside App: uiStore only (lazy notification-import guard). The F-05 lazy/guarded `@tauri-apps` imports and non-Tauri fallbacks (tauriSqlStorage no-op, CubeEnginePersistence in-memory, …) are exercised by the jsdom suite and retained. |
| Options Considered | (a) Keep the beta channel dormant (flag exists, never set) — rejected: contradicts the owner's desktop-only direction; leaves a documented knob with no consumer. (b) Remove only the flag + marker, keep the betaMode module — rejected: a file named `betaMode.ts` with no beta mode is dishonest naming. (c) Full removal + rename to `tauriRuntime.ts` + desktop-only App gate — ADOPTED: honest, complete, minimal; guarded-import hardening retained with rationale recorded. |
| Risk Probe | Risk: jsdom test suite breaks if the gate hardens to Tauri-only — mitigated: jsdom has no `__TAURI_INTERNALS__`, so App renders the alert+null path exactly as before (the pre-F-05 suite already ran this way); new `App.runtime.test.tsx` pins both paths (blocked browser / rendering Tauri). Risk: README "runs in the browser" claims become false — mitigated: hero line + Deployment table Web row corrected to desktop-only wording. Risk: `.env.example` still documents VITE_BETA_WEB — environmental: the workspace env-file guard blocks edits to `.env*` paths; the knob is dead (no code reads it); flagged as the sole residual doc-drift item. |
| Consequence Projection | The app is desktop-only again; the Tier-2 hosted-browser evidence path is closed — the product-led evidence strategy needs a desktop-channel alternative (owner decision, recorded in `_bmad/project-context.md` next-actions). A-12 stays UNVALIDATED with no active evidence path. Verification battery: root tsc 0, targeted suites green (tauriRuntime 2, App.runtime 2, tauriSqlStorage, uiStore, useTauriGlobalShortcuts, CubeEnginePersistence), changed-file eslint 0. |
| Confidence Score | 90% |
| Autonomy Level | A4 (owner-directed product decision; executed the removal) |

### Adopted Path: deleted `src/utils/betaMode.ts`, `betaMode.test.ts`, `betaMode.app.test.tsx`; created `src/utils/tauriRuntime.ts` (+tests) and `src/App.runtime.test.tsx`; `src/App.tsx` gate is strictly `isTauriRuntime()` (alert + null in a browser), beta effect/marker/imports removed; `uiStore.ts` import + comment updated; `VITE_BETA_WEB` removed from `vite-env.d.ts`; README hero + Deployment table corrected to desktop-only; F-05 guarded-import hardening retained.

### Rejected Alternatives: keeping a dormant flag; partial removal leaving the misnamed module; reverting the F-05 lazy/guarded Tauri-import hardening (jsdom-load-bearing, no user-visible benefit to revert).

### Open Items: `.env.example` still documents the dead VITE_BETA_WEB key (env-file guard blocks edits — needs a token/tool with file access or owner apply); owner to choose the desktop-channel Tier-2 evidence strategy; owner-side blockers unchanged (billing E-005, workflows permission T-13, browser env T-10).

---

## Ledger Entry #34 — 2026-08-12 — Owner/System (all-in-one FP&A platform + ZohoBooks-grade UX direction)

### Decision/Topic: Owner directs the product goal as an all-in-one FP&A platform ("user should not need any other tool", all industries) with ZohoBooks-grade UI/UX and extreme optimization; grants maximum autonomy within BMAD discipline

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Owner direction (2026-08-12): all-in-one FP&A for all industries; ZohoBooks-comparable UI/UX; highly optimized; "free to do everything… with absolute extreme perfection". The repo is already breadth-rich (200+ lazy routes across 40+ domain dirs; 193 engines; 44 stores; 263 UI primitives) but depth and polish are the open fronts. The direction re-frames scope ambition (wedge remains the strategic anchor) without changing any validation status. |
| Evidence | Route/page inventory read-verified (src/App.tsx 200+ lazy imports; 40+ domain dirs incl. healthcare/energy/government/manufacturing all with real engines + tests); design system is dark-first Bloomberg-inspired with working light theme (ThemeContext dark/light/system; index.css 853 lines of tokens); bundle gates exist (main <150KB gzip, total <2MB gzip) but dist not built this session; T-13 (9 hardened workflow files) LANDED via platform commit b23e41a (git diff 8d17058..b23e41a -- .github/workflows = 9 files +110/−59) — docs still said owner-side; all 14 assumptions remain UNVALIDATED (assumption-registry read-verified). |
| Options Considered | (a) Treat direction as validation — rejected: violates evidence sovereignty (A-01…A-14 stay UNVALIDATED; Tier 1 only). (b) Silently re-theme the app to light-only ZohoBooks look — rejected: theme direction is a design decision to work with owner-visible audit, both themes polished. (c) Record direction + produce owner-visible master completion plan (all pending tasks across UI/depth/perf/engineering/research/governance) + multi-agent roadmap + desktop Tier-2 evidence kit, then execute in phases — ADOPTED. |
| Risk Probe | Risk: breadth work overclaims vertical certification — mitigated: D-09 sector audit + honesty appendix (breadth ≠ certified depth). Risk: scope creep without gates — mitigated: every task has an acceptance criterion; phases ordered engineering-first. Risk: CI stays red — owner-side E-005, unchanged; T-13 status corrected in docs. |
| Consequence Projection | Owner has a complete, prioritized task inventory to drive the project to "extreme perfection"; BMAD discipline preserved (no assumption validated, no fabrication, no silent state change); next session can execute Phase 1 gates (full-suite count, bundle audit) then the UI/UX flagship track. |
| Confidence Score | 90% |
| Autonomy Level | A4 (owner-directed scope; executed with evidence-first honesty) |

### Adopted Path: `_bmad/project-completion-plan.md` (master plan, 6 tracks × 40+ tasks with acceptance gates) + `_bmad/research/owner-direction-record-2026-08-12-all-in-one.md` (direction record) + `agents/` A1–A5 multi-agent roadmap + `_bmad/research/desktop-tier2-evidence-kit-2026-08-12.md` (Tier-2 evidence drafts) + T-13 status correction + project-context/evidence-log/sprint-plan updates.

### Rejected Alternatives: treating owner direction as market validation; silent theme flip; proceeding without an owner-visible task inventory.

### Open Items: full-suite count still derived (13,438/1,195) pending P-01; CI billing block E-005 owner-side; `.env.example` dead VITE_BETA_WEB key (env-file guard); desktop Tier-2 evidence execution owner's call (T-06/T-07).

---

## Ledger Entry #33 — 2026-08-12 — Amelia/Quinn (F-02 pixel baseline COMPLETE — runbook executed in a real browser)

### Decision/Topic: Execute the F-02 visual-regression runbook (T-10) — establish deterministic browser screenshot baselines and flip F-02 from QA REJECTED to QA APPROVED

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | F-02 was REJECTED solely on the pixel baseline: "an interim deterministic DOM/class snapshot baseline... does not validate rendered pixels". The blocker was environmental (Playwright Chromium download failed with TLS resets on 2026-08-10). This environment HAS a working browser, so the runbook (`docs/design/VISUAL_REGRESSION_RUNBOOK.md`) can now be executed — the honest completion of a safe-foundation story, no ICP/connector/vertical/deployment decision made. |
| Evidence | `tests/e2e/atlas-visual.spec.ts` 5/5 passing under chromium (badge dark+light; PageHeader wide+compact; FinancialWorkspaceEmptyState dark+light; Dashboard empty 1440+390; Dashboard populated 1440/1024 dark + 1440 light with visible `Draft` trust status). 11 deterministic PNG baselines in `tests/e2e/atlas-visual.spec.ts-snapshots/`; re-run produces byte-identical images (md5-stable), i.e. the render is deterministic. Determinism discipline held: fixed viewport/UTC/en-US/reduced-motion/animation kill-switch; seeded fixture restored through the app's OWN canonical backup path (BackupRestore, SHA-256-verified), never by patching component internals; test-only `__TAURI_INTERNALS__` shim (never relaxes production policy). Dev-only harness page `/visual/atlas` (AtlasVisualBaselinePage, 4 unit tests) is not linked from navigation. Two spec defects found and fixed on first run: `getByLabelText` (Testing Library API, invalid in Playwright) → `getByLabel`; unstrict `getByRole('status')` (4 matches incl. toast container) → scoped `getByRole('main').getByRole('status', { name: /Draft/ })`. CSP: `'wasm-unsafe-eval'` added to index.html script-src (+ security.md documentation) — required for the browser SQL.js fallback storage backend used by the test baseline; the CSP3 keyword permits WASM compilation only, never JS eval. |
| Options Considered | (a) Claim F-02 done without pixels — rejected: violates zero-compromise honesty; the story's own runbook is explicit. (b) Execute the runbook now and re-run the QA review — ADOPTED. (c) Wait for CI — rejected: every workflow job is blocked by the account billing block (E-005); no browser-capable CI job can run. |
| Risk Probe | Risk: snapshots could encode a buggy render — mitigated: assertions pin the intended state BEFORE each screenshot (populated heading, Draft trust status in main, Total Revenue KPI, 3 setup steps, 10 badges); the populated fixture goes through the canonical backup-restore path, so the render is the product path. Risk: the P0 hydration defect (ledger #32) made the first populated render EMPTY — it surfaced exactly because of these assertions; after the fix the baselines were re-established on the FIXED render (verified: current pixels match the stored baselines byte-for-byte). Risk: snapshots drift across machines (font rendering) — mitigated: viewport/DSF/colorScheme/timezone fixed; Linux Chromium baselines are committed; any future diff must be reviewed as a code change (runbook rule). |
| Consequence Projection | F-02 pixel baseline CLOSED — the last rejection reason is gone; F-02 moves to QA APPROVED (pending this review's verdict recorded); T-10 removed from blockers; remaining owner-side blockers unchanged (billing E-005, workflows permission T-13, desktop-channel Tier-2 strategy, F-03 AC3 filter-reset explanation deferral stays deferred per F-04/P-01). Verification battery: e2e 5/5; root tsc 0; targeted unit suites (masterStorage 31, hooks 15, visual harness 4, pre-push focused subset 266, hydration-sensitive stores 44); eslint 0 on changed files; engines:verify/docs:verify/readme-claims 11-11/money ratchet/docs-link strict/capability-matrix/compliance-evidence all green; `git diff --check` clean. |
| Confidence Score | 90% |
| Autonomy Level | A5 (safe-foundation story execution; story was pre-approved with the pixel baseline as explicit AC) |

### Adopted Path: `tests/e2e/atlas-visual.spec.ts` + 11 committed PNG baselines + `src/pages/visual/AtlasVisualBaselinePage.tsx` (+4 tests) + `/visual/atlas` dev-only route + `tests/e2e/_helpers/atlas-seed-probe.mjs` (diagnostic) + CSP `'wasm-unsafe-eval'` (index.html + security.md) + QA review flipped to APPROVED + story/context/evidence updates.

### Rejected Alternatives: no-pixel claim (honesty); waiting for CI (billing-blocked, no browser job exists); using `--update-snapshots` to auto-approve diffs (runbook forbids; no diffs were auto-approved — current baselines re-established from the FIXED render).

### Open Items: none new; owner-side blockers unchanged (billing E-005, workflows T-13, desktop-channel Tier-2 strategy).

---

## Ledger Entry #32 — 2026-08-12 — Amelia (P0 hydration defect: zustand persist silently skipped rehydration on boot)

### Decision/Topic: Fix masterStorage.getItem to return the DESERIALIZED envelope object instead of the decrypted plaintext string (P0-2026-08-12)

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The F-02 browser baseline (this session) exposed a silent data-loss path: after a backup-restore + reload, the dashboard stayed EMPTY despite the seeded stores being present in the database. Root cause traced to the storage contract: `masterStorage.getItem` returned the decrypted PLAINTEXT STRING, but zustand persist v5's `hydrate()` reads `storageValue.state` / `.version` DIRECTLY and never JSON.parses a string return. Every persisted store therefore silently skipped hydration on boot — writes "succeeded" (they did), but state was never restored after a restart. This affected BOTH the browser SQL.js backend and the Tauri backend (all 29 persisted stores). |
| Evidence | `zustand-hydrate-probe.mjs` (real zustand + fake string-returning storage): hydrated x stays 0, confirming persist v5 does not parse string returns. `src/utils/masterStorage.hydration.test.ts` (2 tests) pins the round trip: a new store instance with the same key hydrates the persisted value (42) and the envelope object ({count:7}). Consumers of the old string contract were found and updated: `useFirstRun.ts` (marker compare), `usePersistence.ts` (double JSON.parse removed), `backupRestore.test.ts` (tamper path now mutates the nested envelope), `masterStorage.test.ts`, `usePersistence.test.ts` (mock now returns the object). |
| Options Considered | (a) Keep the string return and change every zustand store's `merge` — rejected: the persist middleware is library-owned; per-store `merge` hacks would be fragile and would leave backup/restore and migration consumers on the wrong contract. (b) Parse inside `masterStorage.getItem` with a non-JSON fallback — ADOPTED: one canonical fix at the single chokepoint every persisted store already funnels through; `JSON.parse` failure degrades to the raw string (first-run marker `'"true"'` and pre-envelope legacy rows stay readable). (c) Return both shapes — rejected: impossible to express honestly in one return type. |
| Risk Probe | Risk: non-JSON plaintext (marker strings, legacy rows) — mitigated: try-parse with raw-string fallback; first-run marker test passes both `'true'` and `true` forms. Risk: breaking consumers that expected a string — mitigated: full consumer sweep (rg for `masterStorage.getItem`), all updated; backupRestore tamper-path regression updated to the envelope shape (the test that previously mutated the serialized string). Risk: hydration timing in tests — the new regression test settles on the async encrypted write before creating the second store. |
| Consequence Projection | Persisted state now actually survives restarts in both backends — a P0 data-integrity fix surfaced by the visual baseline. Verification: hydration-sensitive suites green (masterStorage 31 tests incl. new 2, hooks 15, pre-push focused subset 266, uiStore/integrationStore/tauriSqlStorage/App.runtime 44); root tsc 0; eslint 0 on changed files. |
| Confidence Score | 92% |
| Autonomy Level | A5 (single-chokepoint bug fix with regression tests; no direction change) |

### Adopted Path: `masterStorage.getItem` returns `JSON.parse(plaintext)` with raw-string fallback; `useFirstRun` / `usePersistence` / `usePersistence.test` / `backupRestore.test` / `masterStorage.test` updated to the deserialized contract; `masterStorage.hydration.test.ts` added.

### Rejected Alternatives: per-store `merge` hacks (fragile, library-owned middleware); leaving the string contract (silent data loss on every restart).

### Open Items: none — the fix is covered by regression tests and exercised by the populated-dashboard visual baseline (restore → reload → populated render).

---

## Ledger Entry #31 — 2026-08-12 — System (post-commit verification, governance-drift repair, superseded connector route redirect)

### Decision/Topic: Verify the platform-absorbed commit (b23e41a), repair the governance drift it introduced (stale engine manifest + README claims + capability matrix), and remove the user-facing duplicate of the Integrations hub

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | A platform commit (b23e41a, "Update 47 files") absorbed three sessions of working-tree work (desktop-only beta removal, Integrations hub, connector→ledger import). The committed state is unverified at HEAD, and new source modules (ConnectorImportEngine) had not been propagated through the generated contracts (engine manifest, capability matrix, README stats). The old /settings/connectors page (in-memory ConnectorEngine — connections lost on reload) duplicates the real hub's surface for the same QuickBooks/NetSuite/Salesforce capabilities. |
| Evidence | `generate-engine-manifest.mjs --check` FAILED (manifest stale — 181 vs 182 measured); `verify-readme-stats.mjs` FAILED (README claims 181, measured 182); `check-readme-claims.mjs` FAILED (42 vs 44 stores); capability matrix drifted 17 lines (new modules unclassified); rg proved ConnectorEngine has exactly one consumer (ConnectorSettingsPage) plus the generated manifest + smoke test; README "13,290 tests"/"1,174 files" predate the 13,377/1,189 F-05 measurement (blame 0e300b8, 08-09) — already stale at HEAD, no gate validates them. |
| Options Considered | (a) Delete ConnectorSettingsPage + ConnectorEngine entirely — rejected this turn: blast radius includes generated manifest (181→180), README stats, reachability classifier, smoke tests, and the engine's legacy purity/cross-witness metadata; the page is unreachable except by direct URL. (b) Redirect /settings/connectors → /settings/integrations + mark the dead surface @superseded — ADOPTED: one-line honest fix, reversible, zero contract churn. (c) Leave the stale manifest/README/capability claims — rejected: they fail the project's own gates (engines:verify, docs:verify, check-readme-claims). |
| Risk Probe | Risk: manifest regen reorders/diff-blows — generator is deterministic (.sort()); diff was 6 lines. Risk: README numbers unmeasurable in sandbox (full suite exceeds 180s cap) — test/file counts are DERIVED (13,377 + 64 added − 9 removed = 13,432; 1,189 + 8 − 2 = 1,195), recorded as derivation pending full-suite confirmation; engine/store counts are MEASURED by the gates. Risk: redirect breaks smoke tests — smoke renders the page component directly (unaffected); route-level tests re-run green. |
| Consequence Projection | All project gates green again: manifest --check, docs:verify, check-readme-claims (11/11), capability:inventory, compliance-evidence, guardrails, docs-link strict, money ratchet, reachability; tsc 0; targeted suites 51/51 + 71/71; eslint 0 on changed files; diff --check clean. The F-03 AC3 filter-reset explanation deferral (server-authorized views, F-04/P-01) was re-confirmed as correctly deferred — client-side implementation would violate AC6. |
| Confidence Score | 90% |
| Autonomy Level | A4 (verification + governance repair within approved safe-foundations scope) |

### Adopted Path: `npm run engines:manifest` regen (181→182, ConnectorImportEngine now lazy-reachable); README claim repair (182 engines ×5 sites, 44 stores, 1,195 files / 13,432 tests — derived); capability matrix regenerated; /settings/connectors → <Navigate to="/settings/integrations" replace/> + @superseded banners on ConnectorSettingsPage and ConnectorEngine (kept, tested, unreachable — final removal deferred until the hub is committed/shipped).

### Rejected Alternatives: full deletion of the connector page/engine this turn; leaving generated contracts stale.

### Open Items: exact full-suite count needs a browser-capable/full-run environment (derived 13,432 / 1,195 documented); .env.example still documents VITE_BETA_WEB (env-file guard blocks edits — dead knob, no code reads it); owner-side blockers unchanged (billing E-005, workflows T-13, desktop-channel Tier-2 strategy, F-02 browser baseline T-10).

---

## Ledger Entry #30 — 2026-08-12 — System (Connector pull → Ledger import: controlled-loop "import actuals" wired to the Integrations hub)

### Decision/Topic: Give every connected integration a real "Import to Ledger" action — pull via the connector, map through a pure decimal-safe engine, write through the canonical `glStore.importGLData` (IMPORT_CREATE-gated) path

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | The Integrations hub (ledger #29) gave connectors real connect/test/sync, but sync only surfaced external data — it never fed the ledger. The controlled operating loop's "import actuals" step requires connector data to land in the GL journal. The canonical import path is `glStore.importGLData` (validates entries, applies rules, returns a typed `ImportResult` union). `enforce` (rba) propagates return values, so failures surface honestly to callers. |
| Evidence | `glStore.importGLData` signature + `ImportResult` union read-verified (src/store/glStore.ts, src/types/index.ts); `enforce` wrapper confirmed to return the inner function's value (src/utils/rba). Existing connectors expose `pull` returning ExternalTransaction-like records (RestApiClient-verified shapes; Stripe balance/charges, Plaid transactions with Link token, Slack webhook outbound-only — import not applicable for outbound-only, UI hides action accordingly). |
| Options Considered | (a) Per-connector bespoke write paths — rejected: duplicated validation/rules logic. (b) Write directly to glStore entries bypassing importGLData — rejected: bypasses IMPORT_CREATE gate and validation. (c) Pure `ConnectorImportEngine` mapping external transactions → GL journal rows (accounts receivable/sales revenue, accounts payable, fees/expense categories, cash/bank), then one importGLData call per provider — ADOPTED. Outbound-only connectors (Slack) and incomplete auth (Plaid without Link token) hide the action and surface honest per-provider errors. |
| Risk Probe | Risk: money conversion — mitigated: engine converts cents→dollars with exact decimal arithmetic (`fromCents`), tests assert exact values. Risk: store mock selector shape — caught by page test (busy flag truthy), fixed. Risk: lucide icon mock missing new icon in legacy `__tests__` duplicate — added `Plug` to both page-test mocks. Risk: immer-draft indexed access — guarded refs in the store action. |
| Consequence Projection | Connected integrations now feed the ledger through one gated, validated, honest path; sync counts and import results are surfaced in the UI. Verification battery: root tsc 0; ConnectorImportEngine + integrationStore + IntegrationSettingsPage suites green (140+ tests); changed-file eslint 0 (prettier-fixed); `git diff --check` clean; money-adoption ratchet holds. |
| Confidence Score | 86% |
| Autonomy Level | A4 (continuation of owner-directed feature; executed with evidence-first honesty) |

### Adopted Path: `src/engines/ConnectorImportEngine.ts` (+ test) pure mapping ExternalTransaction → GL journal rows; `importToLedger(provider)` action on `integrationStore` (pull → engine → `glStore.importGLData`, import count persisted in connection.lastImportCount) + tests; `IntegrationCard` "Import to Ledger" action; page wiring + tests.

### Rejected Alternatives: bespoke per-connector write paths; bypassing importGLData's gate/validation; claiming import for outbound-only connectors (Slack).

### Open Items: full OAuth2 browser redirect flow still future (F-04/P-track); Plaid Link access-token flow still needs owner-side Plaid account; owner-side blockers unchanged (billing E-005, workflows T-13, browser env T-10).

---

## Ledger Entry #29 — 2026-08-12 — Owner/System (Integrations hub: all helpful integrations surfaced + Stripe/Plaid/Slack added)

### Decision/Topic: Build a real Integrations hub — every integration with an implementation is connectable; no fake/placeholder connectors

### DRP Summary:
| Stage | Analysis |
|-------|----------|
| First Principles | Owner request: "add all Integrations integration which can be helpfull". Audit of the existing state found the app already had a complete, tested connector framework (`src/services/api-integration/`: RestApiClient + QuickBooks, Xero, NetSuite, Sage Intacct, Dynamics 365, Salesforce) with **zero UI**, plus two half-baked settings pages: `IntegrationSettingsPage` (cosmetic theater — hardcoded list incl. SAP/Power BI/Tableau/Slack/SharePoint/Google Sheets where Connect/Sync just flipped local state, no code behind them) and `ConnectorSettingsPage` (local `ConnectorEngine`, static Maps, not persisted). "Adding integrations" therefore means: surface the real connectors behind a persistent, tested hub and add the highest-value gaps (banking, payments, notifications) to the same standard — while NEVER presenting a connector that doesn't exist (honest-labeling discipline). |
| Evidence | Framework: 6 connectors + `ConnectorRegistry` + `BaseConnector` (connect/sync/checkHealth/disconnect), each with tests; imported only by `src/sdk/FpaClient.ts`, zero UI consumers (rg). `IntegrationSettingsPage.tsx` had `AVAILABLE_INTEGRATIONS` with fake entries and `handleConnect` doing `setIntegrations` state flips (read-verified). `PERSISTED_STORE_KEYS` registry (src/utils/persistedStores.ts) is cross-checked by `backupRestore.test.ts` — any new persisted store must be registered. Auth shapes read per connector (NetSuite oauth1 TBA, Sage oauth2_sage+sender, Dynamics oauth2_dataverse, QB/Xero/Salesforce oauth2; Salesforce health uses `{instanceUrl}/services/oauth2/userinfo`). |
| Options Considered | (a) Add fake "Connect" buttons for SAP/Power BI/Tableau/SharePoint/Google Sheets to match the old page — rejected: theater; violates the never-fabricate rule and the owner's own honesty bar. (b) Only rewrite the existing page cosmetically — rejected: no real connectivity. (c) Full hub: typed catalog (`src/config/integrations.ts`) mapping UI fields → ConnectorConfig → real connector class; persisted `integrationStore` (masterStorage, registered in PERSISTED_STORE_KEYS); page + card + connect-modal components; 3 new connectors (Stripe bearer-key, Plaid client_id+secret fetch pattern, Slack webhook) with tests — ADOPTED. OAuth2 connectors accept an optional pasted access token so "Test connection" works in-app (no callback server); a browser OAuth redirect flow stays a future server-authorized capability (F-04/P-track) — documented in the UI, not claimed. |
| Risk Probe | Risk: new persisted store breaks the backup registry test — mitigated: `integration-store` registered in `PERSISTED_STORE_KEYS` (alphabetical, between insurance and lease). Risk: connector auth guards reject catalog-built configs — mitigated: catalog test constructs every connector with dummy values (all 9 pass, guard shapes verified per connector). Risk: money discipline — mitigated: Stripe minor-unit conversion uses `fromCents` (exact decimal, ratchet-safe); Plaid/Slack pass amounts through unmodified. Risk: jsdom smoke tests render the new page — empty store renders cleanly (no network on render; network only inside connect/test/sync actions). |
| Consequence Projection | The app now has a real Integrations hub at /settings/integrations (linked from Settings → Data & Security): 9 integrations (6 pre-existing + Stripe + Plaid + Slack), persisted connections, real health checks/sync with honest status, local-credential security note. Fake SAP/Power BI/Tableau/SharePoint/Google Sheets entries removed — they were never implemented; adding them later means writing the connector first. Verification battery: root tsc 0, targeted suites (3 new connector tests, catalog, store, page, SettingsPage), changed-file eslint 0, `git diff --check` clean. |
| Confidence Score | 88% |
| Autonomy Level | A4 (owner-directed feature request; executed with evidence-first honesty) |

### Adopted Path: created `src/config/integrations.ts` (9-definition catalog, no placeholders) + test; `src/store/integrationStore.ts` (persisted, real connector lifecycle) + test; `src/services/api-integration/{Stripe,Plaid,Slack}Connector.ts` + tests + barrel exports; `src/components/integrations/{IntegrationCard,ConnectIntegrationModal}.tsx`; rewrote `IntegrationSettingsPage.tsx` + test (fake entries removed); SettingsPage Integrations nav card; `integration-store` registered in `PERSISTED_STORE_KEYS`.

### Rejected Alternatives: placeholder/fake connectors for unimplemented systems (SAP, Power BI, Tableau, SharePoint, Google Sheets); cosmetic-only page rewrite; storing credentials outside masterStorage.

### Open Items: full OAuth2 browser redirect flow is future work (F-04/P-track, server-authorized views); Plaid transaction pull requires a completed Link access token (documented in the UI); owner-side blockers unchanged (billing E-005, workflows permission T-13, browser env T-10).

---

<!-- Future entries append below this line. -->
