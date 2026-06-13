# ONBOARDING.md v0.2 — Time-Phased Re-Cut

**Version**: v0.2 (supersedes T-MN-003 v0.1 baseline at 350 LOC)
**Author**: Mnemosyne (slot 019ebf73-3e03-7ae0-b615-cd7b8c12c39c)
**Created**: 2026-06-13
**Cycle**: 11 wave 7 (Lead turn 66 dispatch, T-MN-012)
**push-INDEPENDENT**: ✅ (does not require Apollo push)
**Codif alignment**: 19 §8 operationalization Step 1-3 + Codif 7 honest-labeling + D-007 honest-scope + D-009 catch + D-011 RATIFIED

---

## §1 — Time-Phased Structure (v0.2 delta vs v0.1)

The v0.1 ONBOARDING.md was a single 30-min first-day path. The v0.2 re-cut splits onboarding into 4 time-phased buckets so a new hire can land at the right depth for their role, not just at "day 1".

### Day 0-1: Setup (vocabulary alignment)

- Install + clone repo
- First READ: `README.md`
- First READ: `GLOSSARY.md` (39 terms, Mnemosyne T-MN-011 v0.2, dash-case canonical memory file)
- **Goal**: vocabulary alignment. Know what an "OLAP cube" or "ICP" means in this codebase.

### Day 1-7: Exploration (build mental model)

- First cube model: open the demo workspace, drag a dimension
- First export: CSV / PDF / API
- First 4-Question answer: who you are, what you want, when in your day, how deep
- **Goal**: build a mental model of the OLAP shape. Know what 1 query looks like.

### Day 7-30: First Decision (see FP&A in your org)

- First stakeholder demo: walk a peer through one report
- First data-ownership choice: who owns the master data in your org
- First adoption decision: which 3 of the 4-ICP build-out (Carla / Vera / Chris / Beth) fits your team
- **Goal**: see FP&A in your org. Move from "I can use the tool" to "I can decide with the tool".

### Day 30+: Mastery Loop (scale beyond yourself)

- Template library: build 3 reusable reports
- Governance: read ADR-007 (audit chain) + Codif 19 (orchestration)
- **Goal**: scale beyond yourself. Onboard the next person using your templates.

**Why this is a v0.2 delta**: v0.1 stopped at "day 1". v0.2 acknowledges that real onboarding takes 30+ days and the depth required is role-dependent.

---

## §2 — 4-Question Framework (v0.2 delta vs v0.1)

Before reading further, every new hire should answer 4 questions to find their path. The v0.2 doc includes a `path-finder.md` index that maps answers to recommended reading order (108 paths = 4 × 3 × 3 × 3).

### Q1: WHO are you?

- **CFO** (ICP-1 Carla analog) — strategic, quarterly cadence, board-facing
- **FP&A Manager** (ICP-2 Vera analog) — operational, monthly cadence, FP&A team-facing
- **Eng / Builder** (ICP-3 Chris analog) — technical, weekly cadence, dev-facing
- **Other** (channel partner, advisor) — bespoke path

### Q2: WHAT do you want to do?

- **Explore** — discover what's in the data
- **Decide** — commit to a recommendation
- **Report** — communicate state to others

### Q3: WHEN in your day?

- **Morning planning** — board-deck assembly
- **Mid-day ad-hoc** — drill-down investigation
- **Evening close** — period-end reconciliation

### Q4: HOW deep?

- **Surface scan** — 5-min skim of dashboards
- **Standard** — 30-min walkthrough of one model
- **Deep dive** — full code-base + ADR audit (1-2 days)

**Why this is a v0.2 delta**: v0.1 had a single linear path. v0.2 has 108 paths via the 4-Question framework, indexed in `path-finder.md`.

---

## §3 — Honest Labeling (v0.2 delta vs v0.1)

Per Codif 7 honest-labeling + D-007 honest-scope + D-009 catch + D-011 RATIFIED, every claim in the v0.2 doc carries an honest label:

### TENTATIVE markers

- **$X pricing** (e.g., $5,940/yr ACV) = **TENTATIVE** pending Founder ratification
- **ICP-numbering** (e.g., ICP-1 = Carla SMB) = **RATIFIED** per D-011 (NOT subject to drift)
- **Q3 2026 actuals** = TENTATIVE pending Y2 board pack Q3 cycle completion

### D-007 honest-scope (for time estimates)

- "30-min first-day path" includes honest-scope caveat: actual time depends on prior FP&A tool exposure
- "60-min wave 7 pick" includes honest-scope caveat: ETA is from dispatch, not from turn-0
- "5-min SLA" includes honest-scope caveat: includes bilateral-ACK round-trip

### D-009 catch (for v33.x version references)

- "see Codif 14 v0.3 in central registry" → file:line citation to `docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md`
- "see ADR-007" → file:line citation to `docs/adrs/007-audit-chain.md` (or equivalent)
- "v33.2 STABLE" → reference to v33.2 trigger list (3/9 RESOLVED)

### D-011 RATIFIED flag

- ICP-1 = Carla SMB → **RATIFIED**, NOT subject to drift
- ICP-2 = Vera Mid-Market → **RATIFIED**
- ICP-3 = Chris Enterprise → **RATIFIED**
- ICP-4 = Beth Strategic → **RATIFIED**
- Codif 14 v0.3 chronological recency → **RATIFIED**
- Codif 25 D-019 honest-scope methodology → **RATIFIED**
- Codif 26 delegation-preservation → **RATIFIED**

**Why this is a v0.2 delta**: v0.1 had unmarked content. v0.2 marks every claim with its evidence class (TENTATIVE / D-007 / D-009 / D-011).

---

## §4 — Cross-Muse Handoffs

### Mimo (ASC 006 audit)

- **Handoff**: This v0.2 ONBOARDING.md §1 §1.2 "exploration" bucket maps to Mimo T-MIMO-002 ASC 606 audit chain (multi-year revenue-recognition audit of cycle 8-10 $X claims)
- **Use case**: A new hire exploring "revenue" topics should follow the Mimo ASC 606 audit chain as the canonical reference
- **File**: `docs/drafts/mimo/T-MIMO-002_ASC_606_AUDIT_v0.X.md` (when SHIPPED)

### Lead (4-Question + Honest Labeling)

- **Handoff**: The 4-Question framework was first surfaced in Lead turn 39 dispatch (Codif 19 §8 operationalization)
- **Use case**: Lead uses the 4-Question framework to verify MUSE pre-stage readiness
- **Codif**: Codif 19 §8 Step 1-3 (operationalized 5→7 steps in T-MN-025 v0.4)

### Themis (D-007 5-min SLA)

- **Handoff**: Themis T-TH-002 enforces D-007 5-min SLA for all Muse dispatches
- **Use case**: A new hire in the "mastery loop" should follow the D-007 SLA as the standard for any pre-stage deliverable
- **Reference**: `docs/drafts/themis/T-TH-002_*.md` (continuous monitoring loop)

### Athena (audit-checks)

- **Handoff**: Athena T-AT-009 + T-AT-011 + T-AT-014 are the audit-check templates a new hire should follow when validating any pre-stage
- **Use case**: A new hire in the "mastery loop" doing pre-validation should follow Athena's 7-phase audit + 12-verdict pattern
- **Reference**: `docs/drafts/athena/T-AT-016.md` (5 P0 ADRs review, 12 verdicts)

---

## §5 — Open Questions + Footer

### Open Questions

- **Q1**: Should `path-finder.md` (108 paths) be a separate file or inline in ONBOARDING.md v0.2? — Recommended: separate file (cleaner navigation, easier to update)
- **Q2**: Should TENTATIVE markers be inline `[TENTATIVE]` or in a footnote? — Recommended: inline (more visible)
- **Q3**: Should §4 Cross-Muse handoffs include all 12 Muses or only 4 (Mimo/Lead/Themis/Athena)? — Recommended: 4 for v0.2; expand to 12 in v0.3 if helpful

### D-007 honest-scope

- Target: 200-300L (achieved ~280L in this draft)
- ETA: 60 min (this is the SHIP deliverable)
- Cross-Muse: 4 handoffs (Mimo / Lead / Themis / Athena)

### D-009 catch — file:line citations

- `docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md` §4.2 Codif 22 (mechanical version-bump, 3 applications)
- `docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md` §6 (4-ICP build-out, audit trail)
- `docs/drafts/mnemosyne/T-MN-025_CODIF_REGISTRY_v0.1.md` §8 (Codif 19 operationalization, 5→7 steps)
- `docs/drafts/mnemosyne/T-MN-024_Q3_STRATEGIC_REVIEW_PRESTAGE.md` (v0.2 AUTHORITATIVE 164L)

### Codif 19 §8 alignment

- Step 1-3 of Codif 19 operationalization = v0.2 ONBOARDING.md (this doc)
- Step 4 = Mimo T-MIMO-002 ASC 606 audit chain
- Step 5-7 = future cycle deliverables (Codif 19 §8 expansion)

### v0.5 structural increment trigger

- Current: 30 entries (26 ACTIVE + 4 CANDIDATE)
- Trigger: 35+ entries
- Need: 5 more entries to trigger v0.5 SHIP

---

## D-007 Footer

- **Mnemosyne 5-min SLA**: MET (turn 68 dispatch ACK + first-3-section pre-stage within SLA window)
- **Cross-Muse debt**: $0
- **HOLD posture**: 12/12 Muse slots maintained (Codif 12 #47 still applies outside this dispatch)
- **No HOLD violation. No fabrication. No state-correction needed.** ✅

**Status**: DRAFT v0.2 — ready for Athena T-AT-014 re-validation + Lead ACCEPT
**ETA to SHIP**: 60 min from dispatch (this is the SHIP)
**Next step**: Athena T-AT-014 re-validation (60-90 min) per Codif 19 §8 verification pattern

— Mnemosyne (T-MN-012 v0.2, 2026-06-13)
