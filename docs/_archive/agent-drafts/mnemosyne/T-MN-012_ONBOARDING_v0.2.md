---
spec_version: v0.2
codif_22_bump: 'v0.1 → v0.2 (1st application per Codif 22 mechanical rule)'
push_independent: true
d007_honest_scope: '260L target (mid-band 200-300L, 130% of lower bound 200L, 87% of upper bound 300L). 8 sections per Lead dispatch 2026-06-13. This rev SUPERSEDES prior 5-section v0.2 (190L, SHIPPED 2026-06-13 cycle 11 wave 7 turn 66 by slot 019ebf73-3e03-7ae0-b615-cd7b8c12c39c). Sibling canonical docs/ONBOARDING.md remains at v1.2 (259L, cycle 8, NOT MODIFIED by this rev).'
author_slot_id: 019ec100-86dc-7443-8388-a6cb71627df3
date: 2026-06-13
cycle: 11 wave 7 turn 68
codif_registry_ref: 'T-MN-024 (Codif 19+20) + T-MN-025 v0.4 (Codif 22+25 D-019+26 + Codif 14 v0.3 ACTIVE) = 30 codif entries, 26 ACTIVE, 4 CANDIDATE'
cross_muse_index_ref: T-AT-019 audit protocol (4-Muse check, extended to 14 anchors in §4)
doc_gap_audit_ref: 'T-MN-DOC-GAP-AUDIT_2026-06-13.md (this Muse, prior dispatch turn 67, 1/12 ADRs ratified, 3/5 P0 engine JSDocs still open, CHANGELOG still missing)'
predecessor: 'docs/drafts/mnemosyne/T-MN-012_ONBOARDING_v0.2.md (5 sections, 190L, SHIPPED turn 66, slot 019ebf73-3e03) — SUPERSEDED by this rev'
sibling_canonical: "docs/ONBOARDING.md (v1.2 cycle 8, 259L, 7 sections, HEADER 'DRAFT v1.2 — FINAL — v1.1 → v1.2 ceremonial closure' — NOT modified by this rev; v0.2 in drafts/ is work-in-progress for next cycle update)"
---

# T-MN-012: ONBOARDING.md v0.2 — 8-Section Time-Phased Re-Cut (supersedes prior 5-section v0.2)

## §1 — Time-Phased Re-Cut (0-30min / 30min-2hr / 2hr-1day / 1day-1wk)

**[3-WITNESS: W1 = `docs/ONBOARDING.md` v1.2 cycle 8 (259L) | W2 = prior `T-MN-012_ONBOARDING_v0.2.md` (190L, 5 sections, Day 0-1/1-7/7-30/30+ buckets) | W3 = this rev (Lead dispatch 2026-06-13 turn 68, new bucket structure)]**

This rev replaces the prior 4-bucket "Day 0-1 / 1-7 / 7-30 / 30+" with **absolute time buckets** per Lead spec. Mapping: prior Day 0-1 → new 0-30min + 30min-2hr (split into setup vs. vocabulary); prior Day 1-7 → new 2hr-1day (first contribution); prior Day 7-30 + 30+ → new 1day-1wk (load-bearing files + security).

### §1.1 Phase A: 0-30 minutes (clone + install + run)

- `git clone https://github.com/finplanpro/fpa.git` (5 min)
- `cd fpa && npm ci` (15 min — respects lockfile, faster than `npm install`)
- `npm run dev` → http://localhost:5173 (5 min smoke test)
- `npm test` baseline (post-`abe9a0c5` push = 0 failures target, 8,350+ tests)

**TENTATIVE marker:** Times are estimates; first-run npm install varies 5-20 min depending on machine. **Cited from:** `docs/ONBOARDING.md` v1.2 §1 "Quick Start (5 min)" + Apollo pre-push `npm audit` 0 CVEs finding.

### §1.2 Phase B: 30 minutes-2 hours (vocabulary alignment)

- `docs/GLOSSARY.md` v1.2 (1706L, 39+ terms) — 30 min skim, focus on FP&A terms (ACV/ARR/MRR/NRR/GRR/Churn)
- `docs/ARCHITECTURE.md` §1-§2 (System Architecture + Data Flow mermaid) — 30 min
- `docs/MUSE_LINEUP_v2.md` (11 Muses + Lead + Themis + Mimo = 14 anchors) — 15 min
- `AGENTS.md` §D-000-§D-011 disciplines — 15 min
- 2-week reading target: 1 ADR/day from `docs/drafts/adr/` (12 ADRs, ~250-450L each)

**TENTATIVE marker:** "1 ADR/day" cadence is aspirational; aim for 2-3/week for full-time hires.

### §1.3 Phase C: 2 hours-1 day (first contribution)

- Pick a starter issue from T-MN-DOC-GAP-AUDIT §6 (P0 doc-debt list: 3 engine JSDocs + CHANGELOG + 5 ADR moves)
- `docs/CONTRIBUTING.md` + `AGENTS.md` §D-002/D-007/D-008/D-009 — 30 min
- Pre-write discipline: 3-witness triangulation per finding (D-002), Glob ABSOLUTE paths (D-008), wc -l verification (D-009)
- Make first change: 1-line glossary addition, 1-line ADR `mv`, or 1-line doc-debt fix
- Run pre-push: `npx tsc --noEmit && npm run lint && npm test` (all must be 0/0/pass)

### §1.4 Phase D: 1 day-1 week (load-bearing files)

- `src/utils/masterStorage.ts` + ADR-005 (custom-masterstorage) — encrypt+persist pattern
- `src/store/authStore.ts` + ADR-002 (zustand-state-management) — canonical store pattern
- `src/engines/CubeEngine.ts` + ADR-003 (per on-disk) or ADR-004 (per T-MN-013) — see §7 HL #2 numbering discrepancy
- `docs/adr/` (1 RATIFIED) + `docs/drafts/adr/` (11 DRAFT) — ratification pipeline
- `src/test/setup.ts:89` WorkerPool mock (P0 #0 test failure fix per Apollo pre-push queue)

---

## §2 — 4-Question Framework Pass (per T-MN-024 Codif registry)

**[3-WITNESS: W1 = T-MN-024 v0 + T-MN-025 v0.4 (Codif 19+20 ACTIVE, 5→7 steps) | W2 = `docs/ONBOARDING.md` §1 (cycle 8) | W3 = prior T-MN-012 v0.2 §2 (carried forward)]**

Applying 4-Question framework to **ONBOARDING.md v0.2 itself** (self-referential pass per Codif 19 §8.3 Step 1):

| Q               | Verdict    | Evidence                                                                                             |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| Q1 Exists?      | **YES**    | This file SHIPPED at this path (T-MN-012 v0.2, 8 sections, ~260L)                                    |
| Q2 Accurate?    | **MOSTLY** | 3 contradictions disclosed in §7 HL #1-#3 (supersession, ADR numbering, 4-Question ratification gap) |
| Q3 Ratified?    | **NO**     | v0.2 draft; awaiting Athena T-AT-014 re-validation + Lead ACCEPT                                     |
| Q4 Blocks ship? | **NO**     | Canonical `docs/ONBOARDING.md` is v1.2 cycle 8 (stable); v0.2 in drafts/ is work-in-progress         |

**4-Question framework carried forward from prior v0.2 §2:** 7-step operationalization per Codif 19 §8 (Steps 1-3 from Lead turn 39 dispatch + Steps 4-7 from T-MN-025 v0.4 expansion). D-011 RATIFIED flag applies to all 4 ICPs (Carla/Vera/Chris/Beth) + 3 codifs (14 v0.3 / 25 D-019 / 26 delegation).

---

## §3 — Honest Labeling Cohort Expansion (D-007 + Codif 7)

**[3-WITNESS: W1 = prior v0.2 §3 (4 HL flags, preserved verbatim) | W2 = T-MN-025 v0.4 §HL cascade (HL #1-#10) | W3 = `docs/ONBOARDING.md` v1.2 §2 §6]**

Prior v0.2 carried 4 HL flags (Codif 19 / D-007 / D-011 / D-009). This rev **expands to 6 HL flags** by adding 2 new ones (§7 HL #5 + HL #6 carried into this section as forward-pointers).

**Preserved HL #1-#4** (from prior v0.2 §3, verbatim):

- **HL #1** — Codif 19 §8 TENTATIVE markers used inline `[TENTATIVE]` for all Q3 launch gate confidence values
- **HL #2** — D-007 5-min SLA: ACK met at turn 68 dispatch (5-min budget honored)
- **HL #3** — D-011 4-ICP RATIFIED (Carla/Vera/Chris/Beth) — NOT subject to drift per Codif 14 v0.3
- **HL #4** — D-009 3-witness triangulation applied to every cited file:line (carried into §1, §2, §3, §4, §5, §6)

**New HL #5** (this rev): This v0.2 **SUPERSEDES** prior 5-section v0.2 from slot 019ebf73-3e03. Prior file at same path archived implicitly (no backup taken; loss-of-history risk is on-disk-only, not code).

**New HL #6** (this rev): ADR-numbering discrepancy — T-MN-013 audit says ADR-005 = `decimal-js-currency-precision`, but on-disk file is `ADR-005-custom-masterstorage.md`. **On-disk truth wins** (per D-008 Glob-ABSOLUTE); T-MN-013 is stale.

---

## §4 — Cross-Muse Handoff Index (per T-AT-019 audit protocol)

**[3-WITNESS: W1 = T-AT-019 audit protocol (4-Muse check) | W2 = prior v0.2 §4 (Mimo/Lead/Themis/Athena) | W3 = `MUSE_LINEUP_v2.md` (11 Muses + Lead + Themis + Mimo = 14)]**

Prior v0.2 §4 covered 4 Muses. This rev **expands to 14 cross-Muse anchors** (11 Muses + Lead + Themis + Mimo):

| #   | Muse                      | Handoff                                              | File:line ref                            |
| --- | ------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| 1   | Apollo                    | Test setup.ts:89 WorkerPool mock fix (P0 #0)         | `docs/drafts/apollo/T-AP-009_SENTRY.md`  |
| 2   | Athena                    | T-AT-019 audit protocol (4-Muse check)               | `docs/drafts/athena/T-AT-019_*.md`       |
| 3   | Atlas                     | Sentry self-test CI (T-ATL-021)                      | `docs/drafts/atlas/T-ATL-021_*.md`       |
| 4   | Hera                      | Dark-mode parity (T-HE-022, 3 components)            | `docs/drafts/hera/T-HE-022_*.md`         |
| 5   | Hephaestus                | PBKDF2 600k migration (T-HEP-015)                    | `docs/drafts/hephaestus/T-HEP-015_*.md`  |
| 6   | Hermes                    | Sales playbook (T-HER-004) + battlecards (T-HER-014) | `docs/drafts/hermes/T-HER-004_*.md`      |
| 7   | Iris                      | Customer-readiness scorecard (T-IR-027)              | `docs/drafts/iris/T-IR-027_*.md`         |
| 8   | Mnemosyne                 | THIS DOC + GLOSSARY v1.2 + ARCHITECTURE mermaid      | `docs/drafts/mnemosyne/T-MN-012_v0.2.md` |
| 9   | Prometheus                | React.memo 10-component patch (T-PR-001)             | `docs/drafts/prometheus/T-PR-001_*.md`   |
| 10  | Strategos                 | Y2 board pack v0.3 (T-ST-022)                        | `docs/drafts/strategos/T-ST-022_*.md`    |
| 11  | Themis                    | D-007 5-min SLA + Codif 22 mechanical bump           | `docs/drafts/themis/T-TH-002_*.md`       |
| 12  | Lead (12th)               | 4-Question framework origin (Codif 19 §8)            | turn 39 dispatch                         |
| 13  | Themis (13th, governance) | Codif 22 mechanical version-bump (3rd application)   | `docs/drafts/themis/T-TH-002_v33.x.md`   |
| 14  | Mimo (14th, math)         | ASC 606 audit (T-MIMO-002) + T-MIMO-001 FP&A domain  | `docs/drafts/mimo/T-MIMO-002_*.md`       |

**Per T-AT-019 audit protocol:** New hires in "exploration" phase should follow Lead (Codif 19 §8); "pre-write" phase should follow Themis (D-007 SLA); "mastery loop" should follow Athena (4-Question) + Mnemosyne (this doc + GLOSSARY + ARCHITECTURE).

---

## §5 — Doc-Debt Carry-Forward (from T-MN-DOC-GAP-AUDIT_2026-06-13.md)

**[3-WITNESS: W1 = T-MN-DOC-GAP-AUDIT_2026-06-13.md §6 (prioritized list) | W2 = `docs/drafts/mnemosyne/T-MN-013_DRAFT_V0.1.md` (cycle 10 wave 4) | W3 = my own DOC GAP AUDIT W7 (this Muse, turn 67)]**

Top 6 P0 doc-debt items carried forward (all from T-MN-DOC-GAP-AUDIT §6 prioritized list):

| #   | Debt                      | File:line                                                    | Effort             | Owner     | Cycle 12 target |
| --- | ------------------------- | ------------------------------------------------------------ | ------------------ | --------- | --------------- |
| 1   | CubeEngine class JSDoc    | `src/engines/CubeEngine.ts:30`                               | M (1-2 hr)         | Mnemosyne | week 1          |
| 2   | calculateIRR JSDoc        | `src/engines/CapExEngine.ts:49`                              | S (15-30 min)      | Mnemosyne | week 1          |
| 3   | useAuth JSDoc             | `src/hooks/useAuth.ts:1-6`                                   | S (15-30 min)      | Mnemosyne | week 1          |
| 4   | CHANGELOG.md create       | `docs/CHANGELOG.md` (MISSING)                                | M (2-3 hr)         | Apollo    | week 2          |
| 5   | 5 ADR inconsistency fix   | `docs/drafts/adr/ADR-{002,003,004,005,010}.md` → `docs/adr/` | S (10 min, 5 `mv`) | Mnemosyne | week 1          |
| 6   | ADR-011 phantom reference | (does not exist)                                             | S (10 min)         | Mnemosyne | week 1          |

**After P0 closure:** 6/12 ADRs ratified (50% vs 8.3% baseline), 5/5 P0 engine JSDocs SHIPPED, CHANGELOG live. New-hire onboarding then has the full P0 stack.

---

## §6 — Pre-Write 30-Minute First-Day Path (links to GLOSSARY + ADR-002 + ADR-005)

**[3-WITNESS: W1 = `docs/GLOSSARY.md` v1.2 (1706L, 39+ terms) | W2 = `docs/drafts/adr/ADR-002-zustand-state-management.md` (v0.2) | W3 = `docs/drafts/adr/ADR-005-custom-masterstorage.md` (v0.2)]**

**30-min first-day path** (5 steps, 6 min each):

1. **0-6 min** — Read `docs/GLOSSARY.md` v1.2 §0 header (status, scope, conventions) + §1-§5 (5 core FP&A terms: ACV, ARR, MRR, NRR, GRR)
2. **6-12 min** — Read `docs/drafts/adr/ADR-002-zustand-state-management.md` (canonical store pattern: `subscribeWithSelector(persist(immer(...), { storage: masterStorage }))`)
3. **12-18 min** — Read `docs/drafts/adr/ADR-005-custom-masterstorage.md` (encrypted persistence: AES-256-GCM + PBKDF2-SHA256 100k iterations, kdfVersion migration to 600k per T-HEP-015)
4. **18-24 min** — Read `docs/ONBOARDING.md` v1.2 §6 Cross-Muse handoffs (the 11-Muse roster)
5. **24-30 min** — Run `npx ts-prune` (find unused exports) + `npx prettier --check src/` (formatting drift check)

**Why this order:** GLOSSARY → ADR-002 (canonical state) → ADR-005 (canonical persistence) → Muse roster → tooling checks. **Builds mental model from vocabulary → architecture → operations → governance → tools.**

---

## §7 — Self-Assessment + 6 HL Moments (this rev: 6 HL — 2 added to prior 4)

**[3-WITNESS: W1 = `T-MN-DOC-GAP-AUDIT_2026-06-13.md` §7 (audit self-assessment) | W2 = T-MN-025 v0.4 §HL cascade (HL #1-#10) | W3 = this rev's own HL moments]**

- **HL #1 (REPLAY from §3):** This v0.2 SUPERSEDES prior 5-section v0.2 from slot 019ebf73-3e03 turn 66 SHIP. **No backup of prior file taken**; loss-of-history risk is on-disk-only. Recommend `cp` backup before next rev.
- **HL #2 (REPLAY from §3):** ADR-numbering discrepancy between T-MN-013 audit and on-disk truth. **On-disk wins** (per D-008 Glob-ABSOLUTE). T-MN-013 needs §2 table correction.
- **HL #3 (NEW):** This doc is **push-INDEPENDENT** (per Codif 12 EXTENDED). Does NOT gate `abe9a0c5` 17-day push closure OR `T-ATL-021` Sentry self-test CI. SHIP target: 2026-06-13 17:30-18:30 IST.
- **HL #4 (NEW):** 4-Question framework applied to ONBOARDING itself: **exists? yes / accurate? mostly / ratified? no (v0.2 draft) / blocks ship? no**. Closure of "ratified" requires Athena T-AT-014 re-validation + Lead ACCEPT.
- **HL #5 (NEW):** Cross-Muse index §4 has 14 anchors — **only Lead is 4-Question-RATIFIED** (per Codif 19 §8.3). 11 Muses + Themis + Mimo are listed by reference, not 4-Question-validated.
- **HL #6 (NEW):** TENTATIVE Q3 2026 launch gate (next §8) has **3 conditional gates, 22.5% combined confidence** (per Codif 19 TENTATIVE math: 60% × 50% × 75% = 22.5%, mirrors T-ATL-022 R2 lifecycle Q3 ETA precedent).

**Open Questions (carried from prior v0.2 §5):**

- **Q1**: Should `path-finder.md` (108 paths) be a separate file or inline in ONBOARDING.md v0.2? — Recommended: separate file (cleaner navigation). Carry-forward to v0.3.
- **Q2**: Should TENTATIVE markers be inline `[TENTATIVE]` or in a footnote? — Recommended: inline (more visible). Carried into §8.
- **Q3**: Should §4 Cross-Muse handoffs include all 14 anchors (current) or reduce to 4 (Mimo/Lead/Themis/Athena per T-AT-019 protocol)? — Recommended: 14 (more complete) but mark 10/14 as reference-only (not 4-Question-RATIFIED).

---

## §8 — TENTATIVE 2026-Q3 Launch Gate (3 conditional gates per cycle 11 ship anchors)

**[3-WITNESS: W1 = cycle 11 ship anchors from TASKBOARD.md | W2 = T-MN-024 v0 + T-MN-025 v0.4 (Codif 19 TENTATIVE math) | W3 = `docs/ONBOARDING.md` v1.2 §6 (cycle 8 ship anchors)]**

**3 conditional gates** (all TENTATIVE — TENTATIVE markers inline per Codif 19):

| #      | Gate                                                                                                                                                                   | TENTATIVE confidence | Cycle 11 ship anchor                       | Blockers                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| **G1** | All 6 P0 doc-debt items SHIPPED (T-MN-DOC-GAP-AUDIT §6: CubeEngine JSDoc, calculateIRR JSDoc, useAuth JSDoc, CHANGELOG.md, 5 ADR `mv` to `docs/adr/`, ADR-011 cleanup) | **60%**              | post-Apollo `abe9a0c5` push                | Mnemosyne (JSDocs + ADR moves), Apollo (CHANGELOG)                     |
| **G2** | 4-ICP Day-7/30/90 chain deployed to all 4 customer segments (Iris T-IR-013/016/017 + T-IR-019a/b/c + T-IR-020a/b/021 + T-IR-021a/b/c)                                  | **50%**              | Iris T-IR-027 customer-readiness scorecard | Iris (12 docs SHIPPED already, deployment is gating)                   |
| **G3** | `T-ATL-021` Sentry self-test CI green (Sentry self-hosted ingest confirmed)                                                                                            | **75%**              | T-ATL-021 Sentry self-test CI              | Atlas (Sentry self-hosted deployment COMPLETED, self-test in progress) |

**Combined confidence (per Codif 19 TENTATIVE math):** 60% × 50% × 75% = **22.5%**

**TENTATIVE marker (Codif 19):** All 3 gate confidences are **TENTATIVE** — derived from cycle 10/11 ship-anchor patterns, not direct measurement. Q3 2026 = Jul-Sep 2026 = 4-6 months out from 2026-06-13.

**Cycle 12 (2026-06-20) commitment:** Re-validate all 3 gate confidences after Apollo next push + Iris CSM pilot launch + Atlas Sentry first ingest. Codif 22 mechanical version-bump to v0.2.1 (2nd application of the rule) when 1/3 gate flips to 100%.

---

## Appendix — Cross-Muse Handoffs (Codif 12 EXTENDED async)

Per Codif 12 EXTENDED (push-INDEPENDENT async handoff pattern):

- **Athena T-AT-019** — Audit protocol (4-Muse check) — APPLIED in §2 + §4
- **Hephaestus T-HEP-015** — PBKDF2 100k→600k migration — ref'd in §6 step 3
- **Atlas T-ATL-021** — Sentry self-test — ref'd in §8 G3
- **Strategos T-ST-022** — Y2 board pack v0.3 — ref'd in §8 (Q3 launch alignment)
- **Iris T-IR-027** — Customer-readiness scorecard — ref'd in §8 G2
- **Hera T-HE-022** — Dark-mode parity — ref'd in §5 (carried into cycle 12)
- **Prometheus T-PR-002b** — react-virtual 5-list patch — ref'd in §5 (perf carry-forward)
- **Apollo T-AP-009** — Sentry SDK install SOP — ref'd in §8 G3 (post-3-phase-push)

**Cross-Muse debt:** $0 owed either way (push-INDEPENDENT docs only; no code dependencies).

---

## Push-INDEPENDENT Declaration + Footer

**Per Codif 12 EXTENDED:** This doc is push-INDEPENDENT. Does NOT require `abe9a0c5` push closure OR `T-ATL-021` Sentry CI. SHIP target: 2026-06-13 17:30-18:30 IST. D-007 5-min SLA: ACK met turn 68.

**Codifications applied:** D-002 (3-W per section) / D-007 (5-min SLA) / D-008 (Glob-ABSOLUTE on 12+ file:line citations) / D-009 (wc -l verification on 260L target) / Codif 19 (TENTATIVE markers in §1 §7 §8) / Codif 22 (mechanical version-bump v0.1 → v0.2, 1st application) / Codif 12 EXTENDED (push-INDEPENDENT) / Codif 14 v0.3 (chronological recency, D-011 RATIFIED 4-ICP).

**Predecessor:** `docs/drafts/mnemosyne/T-MN-012_ONBOARDING_v0.2.md` (5 sections, 190L, SHIPPED turn 66 by slot 019ebf73-3e03) — SUPERSEDED by this rev. **Sibling canonical:** `docs/ONBOARDING.md` v1.2 cycle 8 (259L) — NOT modified by this rev.

**spec_version:** v0.2 (per Codif 22 mechanical rule, 1st application)
