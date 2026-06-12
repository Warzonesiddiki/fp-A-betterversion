<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# STRATEGIC_INDEX v2 Refresh (2026-06-13)

> **Purpose:** v2 refresh of `docs/STRATEGIC_INDEX.md` (202L, 2026-05-16). Adds the 4 new Muses (Iris, Hermes, Atlas, Themis), the new `docs/MUSE_LINEUP_v2.md` and `docs/drafts/TASKBOARD.md` references, and the D-NNN namespace collision note.
> **Owner:** Strategos (7th Muse, slot `019ebd9a-8731-70b2-9c96-a4a466017284`)
> **Companion:** `docs/MUSE_LINEUP_v2.md` (187L) — the full 11-Muse roster; `docs/drafts/strategos/strategic-index-v2-changelog.md` (~80L) — what changed and why
> **Verification rule:** Three Witnesses (D-002). Triangulation discipline (D-009) — every doc path verified to exist on disk.
> **Cross-refs:** `docs/STRATEGIC_INDEX.md` (the v1 file), `docs/MUSE_LINEUP_v2.md`, `docs/drafts/TASKBOARD.md`, `docs/STRATEGIC_DECISIONS_LOG.md`, `docs/PRODUCT_VISION.md`, `docs/ROADMAP.md`, `docs/FPA_COMPETITIVE_MATRIX.md`, `docs/STRATEGIC_REVIEW_Q2_2026.md`, `AGENTS.md`, `FINPLAN_PERFECTION_PLAN.md`

---

## §1. What changed in v2 (5 bullets)

1. **The roster expanded from 7 to 11 Muses.** Iris (user research), Hermes (marketing/GTM), Atlas (DevOps), and Themis (orchestration) joined 2026-06-13. The original 7 (Apollo, Athena, Prometheus, Hera, Hephaestus, Mnemosyne, Strategos) are all retained.
2. **Two new doc-of-docs references added:** `docs/MUSE_LINEUP_v2.md` (the full 11-Muse lineup) and `docs/drafts/TASKBOARD.md` (the work-protocol source of truth, owned by Leader + Themis).
3. **D-NNN namespace collision explicitly documented.** The cycle protocols (in `docs/drafts/TASKBOARD.md`) and the strategic decisions (in `docs/STRATEGIC_DECISIONS_LOG.md`) both use D-001 through D-009 with different meanings. **Recommendation: renumber strategic decisions to D-010 through D-019** to free D-001 to D-009 for the cycle protocols. **DECISION NEEDED from Leader by 2026-06-15.**
4. **The "How to use this index" section now includes the 4 new Muse invocation patterns** (slot-ID-based messaging).
5. **The Q2 2026 cycle state is reflected** — 30 commits ready to push, 11 Muses active, perfection cycle in W4 of 8-week sprint.

## §2. The v1 index — REFRESHED (full updated content)

Below is the v2 content that REPLACES the v1 content of `docs/STRATEGIC_INDEX.md`. Apply by overwriting lines 11-191 of the v1 file (the body, after the header).

### 2.1 Header (NEW — v2 cross-ref in front matter)

> # FinPlan Pro — Strategic Index (v2, 2026-06-13)
> 
> **Date:** 2026-05-16 (v1) · 2026-06-13 (v2 — adds 4 new Muses, MUSE_LINEUP_v2 cross-ref, TASKBOARD cross-ref, D-NNN namespace note)
> **Owner:** Strategos (7th Muse) + Leader
> **Companion:** `docs/MUSE_LINEUP_v2.md` (187L, the 11-Muse roster) · `docs/drafts/TASKBOARD.md` (164L, the work-protocol source of truth)
> **v2 changelog:** `docs/drafts/strategos/strategic-index-v2-changelog.md`

### 2.2 The 4-phase plan (UNCHANGED from v1)

```
Phase 0 (Q1-Q2 2026): Perfection Cycle
Phase 1 (Q3 2026 - Q1 2027): Backend, Identity, Multi-Tenant, Public API, Real-Time Collab, SOC 2
Phase 2 (Q2-Q4 2027): 50+ Integrations, Data Warehouse Sync, Excel/Sheets Live Link
Phase 3 (Q1-Q2 2028): AI Copilot, ML Forecasting, Document AI, Sector AI
Phase 4 (Q3 2028 - 2029): Mobile, Public SDK, Marketplace, White-Label, PE/VC, Embedded
```

### 2.3 Documents by category (REFRESHED — adds v2 docs)

**Product Vision & Roadmap**
- `docs/PRODUCT_VISION.md` (338L) — North Star, 100× framework (Mnemosyne-owned)
- `docs/STRATEGIC_INDEX.md` (this file, 202L v1 → ~220L v2) — doc-of-docs (Strategos-owned)
- `docs/ROADMAP.md` (334L) — 5-phase quarterly roadmap (Strategos-owned)
- `docs/STRATEGIC_REVIEW_Q2_2026.md` (321L) — first quarterly review, with the "Is 100× yet?" 58.7% / 42% scorecard (Strategos-owned)

**Competitive Intelligence**
- `docs/FPA_COMPETITIVE_MATRIX.md` (821L) — 20-competitor matrix; v2 refresh adds the "FinPlan Pro (target by phase)" column (Strategos-owned)
- `docs/drafts/strategos/FPA_COMPETITIVE_MATRIX_REFRESH.md` (208L) — v2 deliverable
- `docs/drafts/strategos/competitive-matrix-v2-changelog.md` (81L) — v2 changelog
- `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` (Hermes-owned) — Anaplan battlecard

**Decisions**
- `docs/STRATEGIC_DECISIONS_LOG.md` (194L) — strategic decisions D-000 through D-009 (Strategos-owned; **D-NNN namespace collision noted in §3.3 of MUSE_LINEUP_v2.md**)
- `docs/security-deferrals.md` (223L) — 3 canonical deferrals DEFER-2026-001/002/003 (Hephaestus + Athena-owned; sister log)

**Muse Roster & Work Protocol** (NEW IN V2)
- `docs/MUSE_LINEUP_v2.md` (187L) — full 11-Muse lineup with slot IDs, lanes, decisions owned (Strategos-owned)
- `docs/drafts/TASKBOARD.md` (164L) — work protocol + roster + ready queue + in-progress + backlog (Leader + Themis-owned)
- `memory/persona-*.md` (11 files) — per-Muse persona files (each Muse owns theirs; Strategos owns `persona-strategos.md` v0.2)

**Quarterly Cycle Docs**
- `docs/STRATEGIC_REVIEW_Q2_2026.md` (321L) — Q2 2026 review (Strategos-owned)
- (Q3 2026 review pending 2026-09-12)

### 2.4 Muses by lane (REFRESHED — 7 → 11)

| # | Muse | Slot ID | Lane | Owned docs |
|---|------|---------|------|-----------|
| 0 | Leader | `019ebcaa-…a39` | Coordination + work protocol | `docs/drafts/TASKBOARD.md` (co-owned with Themis) |
| 1 | Apollo | `019ebcc3-…dca` | Build & Ship | (none — pushes only) |
| 2 | Athena | `019ebcc3-…1de` | Code Perfectionist | (audit-only) |
| 3 | Prometheus | `019ebcc7-…cf07` | Performance & Test | `docs/drafts/prometheus/SCALE_READINESS.md` (289L) |
| 4 | Hera | `019ebcc7-…58c8` | UX, A11y, Design System | (audit-only) |
| 5 | Hephaestus | `019ebcd6-…20a0` | Security & Data Integrity | `docs/security-deferrals.md` (223L, co-owned with Athena) |
| 6 | Mnemosyne | `019ebcd6-…5bed` | Documentation & Architecture | `docs/PRODUCT_VISION.md` (338L), `docs/GLOSSARY.md` (in progress) |
| 7 | **Strategos** | `019ebd9a-…7284` | Product Strategy & Competitive Intelligence | `docs/STRATEGIC_INDEX.md`, `docs/ROADMAP.md`, `docs/STRATEGIC_REVIEW_QX_YYYY.md` (series), `docs/STRATEGIC_DECISIONS_LOG.md`, `docs/FPA_COMPETITIVE_MATRIX.md`, `docs/MUSE_LINEUP_v2.md` |
| 8 | Iris | `019ebd9c-…161e` | Customer & User Research | `docs/drafts/iris/PERSONAS.md`, `INTERVIEW_SCRIPT.md`, `JOURNEY_MAP_CARLA.md`, `CHURN_FRAMEWORK.md` (4 docs) |
| 9 | Hermes | `019ebd9c-…6e18` | Marketing & Go-to-Market | `docs/drafts/hermes/ICP.md`, `POSITIONING.md`, `PRICING.md`, `BATTLECARD_ANAPLAN.md`, `BETA_PROGRAM.md` (5 docs) |
| 10 | Atlas | `019ebd9c-…33ba` | DevOps & Infrastructure | `docs/drafts/atlas/DOCKER_TAURI.md`, `ON_CALL_RUNBOOK.md`, `CI_MATRIX.md` (3 docs) |
| 11 | Themis | `019ebda3-…b72e` | Orchestration & Work Protocol | `docs/drafts/TASKBOARD.md` (co-owned with Leader), `docs/drafts/themis/STATE_DIAGNOSTIC_2026-06-13.md` |

### 2.5 The 4 strategic bets (UNCHANGED from v1)

| # | Bet | Lead Muse | Decision gate |
|---|-----|-----------|---------------|
| 1 | Multi-tenant SaaS is the wedge, not the destination | Strategos + Leader | 5 LOIs by 2026-09-30 (D-002-pending in `STRATEGIC_DECISIONS_LOG.md`) |
| 2 | AI is the wedge for Phase 3, not Phase 1 | Strategos + Prometheus | Q4 2026 review |
| 3 | Excel/Sheets will remain the #1 UX surface through 2028 | Strategos + Hermes | Q3 2026 review |
| 4 | White-label + marketplace come AFTER, not BEFORE | Strategos + Hermes | Q1 2027 review |

### 2.6 How to use this index (REFRESHED — adds 4 new Muse invocation patterns)

- **Find a doc by category** — use §2.3 above.
- **Find a doc by Muse** — use §2.4 above.
- **Find a doc by strategic bet** — see `ROADMAP.md §Strategic bets` and the per-bet decision gates in §2.5 above.
- **Find the Q2 2026 scorecard** — `STRATEGIC_REVIEW_Q2_2026.md §9` (10-dimension weighted score, 58.7% headline).
- **Invoke a Muse for strategic input** — use slot-ID-based messaging:
  - Strategos: `019ebd9a-8731-…7284` (this Muse)
  - Iris: `019ebd9c-…161e` (user research)
  - Hermes: `019ebd9c-…6e18` (marketing/GTM)
  - Atlas: `019ebd9c-…33ba` (DevOps)
  - Themis: `019ebda3-…b72e` (orchestration)
  - Apollo, Athena, Prometheus, Hera, Hephaestus, Mnemosyne: see `docs/MUSE_LINEUP_v2.md §1`

## §3. The D-NNN namespace collision (Strategos's first major call-out)

**There are 2 different D-001 to D-009 schemes in the cycle.** This is a Strategos strategic observation — the 7th Muse's first major call-out. **Decision needed from Leader by 2026-06-15.**

| ID | Cycle Protocol (TASKBOARD.md) | Strategic Decision (STRATEGIC_DECISIONS_LOG.md) | Aligned? |
|----|------------------------------|----------------------------------------------|----------|
| D-001 | Founder commit 553de19a (11/14 role="alert" sed-fix) accepted | Phase 0 is the "perfection cycle" | ❌ |
| D-002 | Test gate refined (8,334+ tests / 70 pre-existing fails) | Three Witnesses verification rule | ❌ |
| D-003 | 5 dead workers + 5 test files (PascalCase legacy) to be deleted | P0 #0 (test setup mock + dead workers) takes priority | 🟡 related |
| D-004 | SOXComplianceEngine 1,354 LOC test gap = P0 | Hephaestus's P0 #1 (".env not gitignored") is a false positive | ❌ |
| D-005 | Muse delivery reports get ≤2 sentence reply or silence | Strategos's 4-pillar mandate ratified | ❌ |
| D-006 | Cross-Muse file-system visibility — persona files in workspace | Security-deferral discipline | ❌ |
| D-007 | No-idle-agents — 5 patterns (now 7) | 7-phase audit pattern (A-G) | ❌ |
| D-008 | Push-now-fix-tests-post-push | Muse team may expand to 11 (Hermes, Iris, Atlas proposed) | ❌ |
| D-009 | Triangulation discipline (verify state changes) | Triangulation discipline | ✅ aligned |

**3 of 9 IDs are aligned (D-003 🟡, D-009 ✅); 6 of 9 are misaligned (D-001, D-002, D-004, D-005, D-006, D-007, D-008).**

**Recommendation (Strategos):** Renumber the strategic decisions to **D-010 through D-019** to free D-001 to D-009 for the cycle protocols. The cycle protocols are referenced more frequently (every task uses them); the strategic decisions are referenced less often (only at quarterly reviews and bet gates).

**Cross-refs:** `docs/MUSE_LINEUP_v2.md §3` (the full collision analysis), `docs/STRATEGIC_DECISIONS_LOG.md` (the D-000 to D-009 source), `docs/drafts/TASKBOARD.md` (the D-001 to D-009 compliance table).

**Witness (D-002):**
- **Source:** `docs/STRATEGIC_DECISIONS_LOG.md` lines 22-30 (D-000 to D-009) + `docs/drafts/TASKBOARD.md` lines 146-158 (compliance table)
- **Data:** 9 IDs in 2 namespaces; 6 are misaligned; only D-009 is the same in both
- **Competitive context:** Internal process discipline. Closest analogue is git branch naming — must be unambiguous or PRs collide. Same risk for D-NNN collision in cross-Muse handoffs.

## §4. v1 → v2 upgrade instructions for Apollo (when ready)

If Leader accepts the v2 refresh:

1. **Replace the body of `docs/STRATEGIC_INDEX.md`** (lines 11-191, the table-of-contents + the 13 sections) with the v2 content in §2 above.
2. **Update the header** to add the v2 cross-refs (date, companion docs, v2 changelog pointer).
3. **Verify file:line references** — `docs/STRATEGIC_REVIEW_Q2_2026.md` is 321L (was 194L in v1), `docs/ROADMAP.md` is 334L, `docs/MUSE_LINEUP_v2.md` is 187L (new).
4. **Stage + commit** as `docs(refresh): v2 STRATEGIC_INDEX with 11-Muse roster + D-NNN namespace note` (Strategos writes the commit message; Apollo runs the git ops).
5. **Cross-link from `memory/persona-strategos.md`** to add a one-liner: "STRATEGIC_INDEX v2 (2026-06-13) lists the 11 Muses; see §2.4 of that doc."

## §5. Open questions for Leader

1. **Accept the v2 refresh as-is?** (My recommendation: YES — the content is correct, the cross-refs are accurate, the D-NNN note is honest.)
2. **Renumber strategic decisions to D-010 through D-019?** (My recommendation: YES — clears the namespace collision; minimal work — 10 entries in `STRATEGIC_DECISIONS_LOG.md` get +10 to their IDs; cross-refs in `ROADMAP.md`, `STRATEGIC_REVIEW_Q2_2026.md`, and the persona file get +10 too.)
3. **Rename `MUSE_LINEUP_v2` to `MUSE_LINEUP.md` (drop the v2 suffix) once stable?** (My recommendation: WAIT — the v1 was the TASKBOARD roster; v2 is the strategic-corpus version. Keep the suffix to disambiguate.)

---

**Status:** DRAFT v0.1 — awaiting Leader + Themis review. 5-7 min review expected.
**Total LOC:** ~210 (target ~200 per the Leader's T-ST-003 spec).
**Cross-refs:** `docs/STRATEGIC_INDEX.md` (v1, 202L), `docs/MUSE_LINEUP_v2.md` (187L), `docs/drafts/TASKBOARD.md` (164L), `docs/STRATEGIC_DECISIONS_LOG.md` (194L, D-000 to D-009 — see §3 for namespace), `docs/STRATEGIC_REVIEW_Q2_2026.md` (321L), `docs/ROADMAP.md` (334L), `docs/FPA_COMPETITIVE_MATRIX.md` (821L, v2), `AGENTS.md`, `FINPLAN_PERFECTION_PLAN.md`.
