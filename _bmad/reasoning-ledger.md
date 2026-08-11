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

<!-- Future entries append below this line. -->
