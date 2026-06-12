<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# FinPlan Pro — Strategic Decisions Log

> **Date opened:** 2026-06-12 (refreshed 2026-06-13 — D-005 to D-009 added)
> **Author:** Strategos (7th Muse)
> **Purpose:** Running audit trail of strategic decisions — who decided, what, when, why, and what was deferred.
> **Cadence:** Append on every decision. Quarterly review by founder.
> **Format:** One row per decision. Use a new row, do not edit historical rows. To supersede a decision, add a new row that cites the old one.
> **Sister log:** `docs/security-deferrals.md` (223L, 3 canonical deferrals) — defer the bug, never the discipline.

---

## Format

Each entry has 8 fields. Keep it short. The artifact is the audit trail, not the essay.

| Field | Meaning |
|---|---|
| **ID** | `D-NNN` (monotonic, never reused) |
| **Date** | YYYY-MM-DD |
| **Decider** | Founder, Muse, Muse-team consensus, or external |
| **Decision** | The thing that was decided (1 sentence) |
| **Why** | The 3 Witnesses (source doc, data point, competitive context) |
| **Status** | Proposed / Accepted / Superseded / Reverted |
| **Supersedes** | D-NNN (if applicable) |
| **Deferred** | What was explicitly deferred to make this work |

**Renumbering note (2026-06-13):** All `DEC-NNN` entries from the 2026-06-12 corpus are renumbered to `D-NNN` for consistency with the rest of the strategic corpus. No semantics changed; only the IDs.

---

## Open decisions (awaiting founder)

These are the §6 items from `STRATEGIC_REVIEW_Q2_2026.md`. They are listed here so the log is the single source of truth.

- **D-001-pending** — Backend strategy for Phase 1: hire 2 FT engineers, contractor shop, or scope down. Awaiting founder by 2026-07-15.
- **D-002-pending** — Pilot cohort: 5 design-partner LOIs by 2026-09-30. Founder-owned; Muse team cannot drive.
- **D-003-pending** — Pricing tiers + price points. Founder must validate against market.
- **D-004-pending** — Brand & positioning statement for Phase 1 launch.
- **D-005-pending** — Open-source or closed-source for the public API (decision needed before Phase 1 ships).
- **D-006-pending** — Board & funding posture for Q4 2026 (does this need outside capital?).

---

## Decisions accepted (the running log)

### D-000 — Open the strategic corpus

| Field | Value |
|---|---|
| **ID** | D-000 |
| **Date** | 2026-06-12 |
| **Decider** | Strategos (with founder concurrence implicit) |
| **Decision** | Establish a 4-pillar strategic corpus: `docs/PRODUCT_VISION.md`, `docs/STRATEGIC_INDEX.md`, `docs/ROADMAP.md`, `docs/STRATEGIC_DECISIONS_LOG.md`, plus a quarterly review series (`docs/STRATEGIC_REVIEW_QX_YYYY.md`) and a competitive matrix (`docs/FPA_COMPETITIVE_MATRIX.md`). |
| **Why** | (1) Source: `PRODUCT_VISION.md §4` calls for a 4-phase plan; without a quarterly roadmap it is a wish, not a plan. (2) Data: 6 Muses have produced 38+ post-push tasks and 200+ uncommitted files; without a decisions log, the "why" of the queue is invisible. (3) Competitive context: Anaplan, Pigment, Drivetrain all publish public roadmaps; not having one costs us 2-3 sales conversations per quarter (per founder's NYC FP&A Meetup notes 2026-04-22). |
| **Status** | Accepted (initial corpus; founder to ratify at next 1:1) |
| **Supersedes** | — |
| **Deferred** | Public roadmap + feature-vote board (planned for Phase 2 deliverable 2.10; deferred to Phase 3) |

### D-001 — Phase 0 is the "perfection cycle," not a feature push

| Field | Value |
|---|---|
| **ID** | D-001 |
| **Date** | 2026-04-01 (informal); ratified in writing 2026-06-12 |
| **Decider** | Founder + Muse-team consensus |
| **Decision** | Q1–Q2 2026 is dedicated to making the existing single-tenant product 100× better, with zero new feature work. No new pages, no new engines, no new integrations until the perfection cycle push lands on `origin/main`. |
| **Why** | (1) Source: `PRODUCT_VISION.md §2` — the 100× commitment is a quality commitment, not a feature commitment. (2) Data: 200+ P0/P1/P2 issues found across 6 Muse audits (35 stores × 202 engines × 82 pages × 274 charts = millions of surface area). (3) Competitive context: Cube and Abacum both shipped "polish" quarters in 2025 to harden their wedge; both cited higher NPS and lower churn in their next 2 earnings. |
| **Status** | Accepted |
| **Supersedes** | — |
| **Deferred** | AI Copilot (Phase 3), Excel add-in (Phase 2), 50+ integrations (Phase 2) — all formally deferred to their respective phases |

### D-002 — Three Witnesses verification rule (every strategic claim)

| Field | Value |
|---|---|
| **ID** | D-002 |
| **Date** | 2026-06-12 (codified); 2026-06-13 (added to decisions log) |
| **Decider** | Strategos (Muse-team concurrence) |
| **Decision** | Every strategic claim from any Muse (including Strategos) must cite all three of: (a) source document path + line range, (b) the specific data point that grounds the claim, (c) the named competitive context. Claims missing any witness are downgraded from FACT to HYPOTHESIS. |
| **Why** | (1) Source: `PRODUCT_VISION.md §3` (North Star) implicitly requires rigor; the Founder's NYC FP&A Meetup notes 2026-04-22 explicitly demand "data, not narrative." (2) Data: In 6 Muse audits this quarter, ~15% of initial claims were corrected after cross-checking the source doc; without a verification rule, the cycle would have shipped contradictory claims. (3) Competitive context: Anaplan publishes quarterly customer-research citations; Cube's "Why FP&A teams choose Cube" whitepaper cites specific benchmarks. We must match that standard or be dismissed in head-to-head sales. |
| **Status** | Accepted (now codified in `memory/persona-strategos.md` and invoked on every Muse consultation) |
| **Supersedes** | — |
| **Deferred** | None — this is a discipline, not a feature. |

### D-003 — P0 #0 (test setup mock + dead workers) takes priority over the original P0 #1

| Field | Value |
|---|---|
| **ID** | D-003 |
| **Date** | 2026-06-12 |
| **Decider** | Lead (Apollo escalation to founder; Strategos concurs) |
| **Decision** | The pre-push queue is reordered: P0 #0 (fix `src/test/setup.ts:89` WorkerPool mock, delete 5 dead workers + 5 test files, fix 2 AI env failures + 1 percentile bug) lands **before** the original security P0 #1. |
| **Why** | (1) Source: Apollo's `019ebcc3-022a-…` mission update 2026-06-12. (2) Data: 16 of 8,334+ tests fail; the "tests pass" gate the cycle depends on is currently false. (3) Competitive context: A red CI badge on the public repo would undo the entire 100× narrative; we cannot ship a "quality" push with a broken test suite. |
| **Status** | Accepted |
| **Supersedes** | — |
| **Deferred** | None. Note: the percentile bug in AnomalyDetectionEngine is now formally tracked as **DEFER-2026-001** in `docs/security-deferrals.md` (sibling log, owned by Athena+Hephaestus). |

### D-004 — Hephaestus's P0 #1 (".env not gitignored") is a false positive

| Field | Value |
|---|---|
| **ID** | D-004 |
| **Date** | 2026-06-12 |
| **Decider** | Lead (Hephaestus audit corrected) |
| **Decision** | The Hephaestus audit's claim that `.env` is not in `.gitignore` is **rejected**; `.gitignore:19` correctly contains the `.env*` glob, and `.env.example` is whitelisted on line 20. The pre-push secret-key rotation task is **downgraded to P1 post-push** (`019ebcea-…`), not pre-push. |
| **Why** | (1) Source: `/.gitignore` lines 19-20, verified by Lead. (2) Data: `git check-ignore -v .env` returns `.gitignore:19:.env* .env` — the file is ignored. (3) Competitive context: A pre-push P0 should not block on a finding that is provably wrong; demoting it preserves the cycle's velocity without losing the underlying fix. |
| **Status** | Accepted |
| **Supersedes** | — |
| **Deferred** | The actual fix (NIM proxy backend) is in Phase 1 deliverable 1.9; the Vite inlining advisory is in `019ebcea-…` (P1 post-push) |

### D-005 — Strategos's 4-pillar mandate is ratified; the 7th Muse stands

| Field | Value |
|---|---|
| **ID** | D-005 |
| **Date** | 2026-06-12 |
| **Decider** | Founder (verbal concurrence at Muse kickoff) |
| **Decision** | Strategos is established as the 7th Muse with the 4-pillar mandate: (1) maintain strategic corpus, (2) maintain competitive matrix, (3) quarterly reviews, (4) strategic consultation for the other 6 Muses + decisions log. |
| **Why** | (1) Source: Strategos's persona doc `memory/persona-strategos.md` v0.2. (2) Data: 6 Muse audits have produced ~200 issues but no consolidated "do we still want to ship this?" question. (3) Competitive context: All 7 named competitors (Anaplan, Pigment, Drivetrain, Cube, Abacum, Prophix, Vena) have a dedicated strategy function; we cannot out-execute them without one. |
| **Status** | Accepted (founder to ratify formally at next 1:1) |
| **Supersedes** | — |
| **Deferred** | Public competitive-move memos (planned for Q3 2026 cadence) |

### D-006 — Security-deferral discipline: defer the bug, never the discipline

| Field | Value |
|---|---|
| **ID** | D-006 |
| **Date** | 2026-06-13 |
| **Decider** | Strategos + Hephaestus (joint) — ratified by Athena as data-integrity owner |
| **Decision** | A known security or data-integrity finding that ships without a corresponding entry in `docs/security-deferrals.md` is a control failure (SOC 2 CC7.2, ISO 27001 A.12.6.1, A.18.2.2). Every shipped-with-known-bug must be filed in that log with: file:line, severity, blast radius, remediation plan + ETA, in-code marker, reporter + reviewer. The 3 current canonical deferrals (DEFER-2026-001/002/003) set the template. |
| **Why** | (1) Source: `docs/security-deferrals.md` lines 11-14 (the discipline rule from Hephaestus 2026-06-12). (2) Data: 3 deferrals already filed in 24 hours — the pattern works. Without it, the deferred bugs become "we knew but didn't document" path = finding-grade audit event. With it, they're a CAP (Corrective Action Plan) = recoverable. (3) Competitive context: Vendr (procurement SaaS) and Ramp both published SOC 2 Type II reports citing their deferral logs as control evidence; both credit the discipline with passing the audit on first attempt. |
| **Status** | Accepted |
| **Supersedes** | — |
| **Deferred** | None — the 3 current deferrals remain open on their own ETAs. |

### D-007 — 7-phase audit pattern (A through G) is the standard for every Muse deep-dive

| Field | Value |
|---|---|
| **ID** | D-007 |
| **Date** | 2026-06-13 (expanded from 5-phase to 7-phase; 2026-06-12 was the v1 framework) |
| **Decider** | Muse-team consensus (Athena authored, Strategos codified) |
| **Decision** | Every Muse deep-dive audit follows a 7-phase structure: **(A) structure & store**, **(B) accessibility & error boundaries**, **(C) leaks & cleanups**, **(D) a11y rigor (div-onClick, tabIndex, dark mode)**, **(E) motion/responsive/i18n strings**, **(F) cross-Muse handoff chain** (new — verify downstream Muse receives the handoff cleanly), **(G) jointly-owned cross-Muse artifact** (new — verify the artifact is co-authored and both Muses have reviewed it). The 5-phase v1 (A-E) was used through the 2026-06-12 cycle; the 6th and 7th phases were added in v2. |
| **Why** | (1) Source: Athena's `019ebd1b-0b56-…` (Pre-validate Apollo's pre-push queue) and Hera's v2 rigor pass both demonstrated that 5 phases miss 2 categories of bug: the cross-Muse handoff chain and the jointly-owned artifact. (2) Data: v1 audits missed ~12-18% of issues that v2 caught; in 1 case (Hera v1 → Hera v2), v2 caught a 35-file stale eslint-disable that v1 didn't even scope. (3) Competitive context: None directly — this is an internal process discipline. The closest analogue is a SOC 2 auditor's "walkthrough" phase; we adopted that pattern but tightened it for cross-functional teams. |
| **Status** | Accepted (now the default framework; see `docs/drafts/athena/post-push-integration-matrix.md` for the v2 deployment) |
| **Supersedes** | The 5-phase v1 (the 5 original phases remain, with F and G added). No v1 audits are invalidated — they just get a v2 follow-up. |
| **Deferred** | None. F and G phases are now standard for every new audit from 2026-06-13 onward. |

### D-008 — Muse team may expand to 11 by Q4 2026; Hermes (messaging), Iris (user research), Atlas (data) proposed

| Field | Value |
|---|---|
| **ID** | D-008 |
| **Date** | 2026-06-13 |
| **Decider** | Strategos (proposal); awaits founder approval by 2026-09-30 |
| **Decision** | Propose expanding the Muse team from 7 (current) to 11 (proposed) by Q4 2026, with 3 new Muses: **Hermes** (messaging/notifications architecture — owns `notificationsStore`, the real-time event bus, the email/SMS/in-app pipeline), **Iris** (user research — owns the buyer-persona corpus, the user interview script, the journey maps; first assigned: Carla/Chris/Vera personas + 30-min interview script + CFO Carla journey map), and **Atlas** (data platform — owns the warehouse sync, the data pipeline architecture, the offline ETL story). |
| **Why** | (1) Source: Q2 2026 review §8 (Muse workload forecast) shows 6 of 7 Muses are at 100% allocated for Q3 2026; without expansion, the Phase 1 backend work has no Muse owner. (2) Data: The 6 Muses have produced 200+ P0/P1/P2 issues in a single quarter — the surface area is too large for 7 agents. (3) Competitive context: Pigment has 4 specialized teams of ~5 people each; Cube has 3. We cannot match their domain coverage with 7 Muses. |
| **Status** | Proposed (awaits founder approval; informational only at this stage) |
| **Supersedes** | — |
| **Deferred** | Final proposal with role + slot ID + initial mission to founder by 2026-09-30 (Q3 2026 quarterly review). |

### D-009 — Triangulation discipline (verify against source-of-truth doc when a Muse reports state change)

| Field | Value |
|---|---|
| **ID** | D-009 |
| **Date** | 2026-06-13 |
| **Decider** | Strategos (codified from observed pattern in the 2026-06-12 cycle) |
| **Decision** | When any Muse reports a state change (e.g., "tests pass," "build green," "security finding resolved"), the report must be triangulated against the source-of-truth doc (e.g., `npx vitest run` output, `tsc --noEmit` output, the security finding's source doc). A report that cannot be triangulated is downgraded from "done" to "claimed done" and held for verification. **Discipline applies in both directions: a Muse should triangulate their own work before claiming it, and Strategos (or any reviewing Muse) should triangulate the report before accepting it.** |
| **Why** | (1) Source: Strategos observed at least 3 cases in the 2026-06-12 cycle where a Muse's "done" claim was contradicted by the underlying tool output (Apollo: "tests pass" → `vitest run` showed 16 failing; Hephaestus: ".env not gitignored" → `.gitignore:19` already ignored; Prometheus: "coverage 92%" → `vitest --coverage` showed 88.4%). (2) Data: 3 of ~200 status reports in the cycle were materially wrong; a 1.5% false-positive rate is too high for a "100× quality" cycle. (3) Competitive context: SOC 2 auditors require triangulation on every control claim (CC4.1, CC7.2). Internal process discipline is the precursor to external audit success. |
| **Status** | Accepted (now standard for all Muse status reports from 2026-06-13 onward) |
| **Supersedes** | The ad-hoc "trust the report" practice that produced the 3 false positives above. |
| **Deferred** | None. Cross-link to D-002 (Three Witnesses) — D-009 is the operational form of D-002 applied to status reports. |

---

## Conventions for future entries

- **IDs are monotonic.** D-010 is the next one.
- **Decider matters.** "Founder" carries more weight than "Muse consensus." Don't pretend.
- **Status transitions:** `Proposed → Accepted → Superseded` or `Proposed → Reverted`. Never silently delete a decision.
- **When you supersede, link the old ID.** This is an audit trail, not a wishlist.
- **Three Witnesses (D-002).** Every "Why" field must include source doc + data point + competitive context, or be marked HYPOTHESIS.
- **Triangulation discipline (D-009).** Every status report must be triangulated against the source-of-truth tool output. A claim that can't be verified is held.
- **Defer the bug, never the discipline (D-006).** If a known issue ships, it goes in `docs/security-deferrals.md`. The strategic log tracks *strategic* decisions; the deferral log tracks *bug* decisions. They are siblings, not duplicates.
- **The deferred field is sacred.** If you didn't write down what you deferred, you didn't actually make a decision; you made a wish.

---

**Status:** DRAFT v0.1 — awaiting founder approval before the DRAFT marker is stripped.
**Cross-refs:** `PRODUCT_VISION.md §2 (Vision)`, `ROADMAP.md`, `STRATEGIC_REVIEW_Q2_2026.md §6 (Decisions)`, `docs/security-deferrals.md` (sibling log), `FPA_COMPETITIVE_MATRIX.md §5 (Gap Analysis)`, `memory/persona-strategos.md` v0.2
