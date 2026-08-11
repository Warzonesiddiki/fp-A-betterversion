# Research Validation Plan — FinPlan Strategic Wedge

> **Status:** ACTIVE · **Version:** 2.2 (solo-dev evidence strategy 2026-08-11) · **Owner:** Rex + Ana · **Purpose:** Turn desk-research hypotheses into buyer, user, security, and economic evidence before Release 1 scope is finalized.
> **Owner re-baseline (2026-08-11):** enterprise participant interviews are unavailable (solo development — `owner-direction-record-2026-08-11-solo-dev.md`). See §Solo-dev evidence strategy below.
> **Execution kits (2026-08-11):** `_bmad/research/r02-session-kit-2026-08-11.md` (per-role runbook + probes sharpened by secondary evidence), `_bmad/research/outreach-execution-kit-2026-08-11.md` (per-channel outreach variants + scheduling), `_bmad/research/r03-synthesis-framework-2026-08-11.md` (evidence → status rules + decision memo), `_bmad/research/r04-pilot-selection-framework-2026-08-11.md` (evidence-sourced selection matrix + charter pre-draft), `_bmad/research/secondary-evidence-synthesis-2026-08-11.md` (secondary calibration only).
> **Session status:** R-01 recruitment operations are prepared (screener, outreach template, tracker, session-notes template); no participants or anonymized notes have been received. No primary evidence recorded (E-004/E-005 are technical/environmental, not market evidence). Do not fabricate sessions to "complete" this plan.

## Decision to validate

Can FinPlan win an initial enterprise segment with a **controlled close-to-decision-to-board-pack** workflow, delivered as an analyst-grade workspace plus authoritative control plane?

## Initial ICP hypothesis

> [ASSUMPTION A-13] The intended first ICP is enterprise, multi-entity organizations with a CFO/finance, controller, FP&A, IT/security, and procurement buying committee. This is owner direction, not market truth. Exact entity scale, vertical, and implementation profile remain research questions.

## Research tracks and exit thresholds

| Track | Participants / evidence | Core question | Exit threshold | Decision if failed |
|---|---|---|---|---|
| Buyer economics | 12 CFO/VP Finance interviews; 3 commercial proposals | Is the pain material enough for premium platform + implementation spend? | ≥4 participants quantify a material close/planning cost/risk and ≥2 accept a paid pilot/LOI path | Reposition to lower ACV/segment or narrow workflow |
| Controller workflow | 8 controllers/consolidation leads; observe 3 closes | Does the controlled close wedge eliminate a meaningful workaround? | ≥70% rank reconciliation/certification/evidence as top-three urgent pain | Shift wedge toward planning/operational finance |
| Analyst workflow | 8 FP&A analysts; task observation | Is governed grid speed more valuable than generic dashboards? | ≥80% complete prototype tasks; no critical keyboard/paste objection | Rework model workspace or retain Excel-native path |
| IT/security | 6 enterprise security/IT buyers; security questionnaire | Is local-first/hybrid accepted and under what boundaries? | clear deployment/security pattern accepted by ≥4; no unmitigated critical blocker | make managed cloud authoritative default; restrict offline scope |
| Integration | customer stack survey and sample extracts | Which connector/data contract creates initial time-to-value? | one connector appears in ≥50% of target accounts or CSV/XLSX is accepted for paid pilot | delay connector, sell implementation accelerator |
| Competitive/WTP | win/loss interviews and vendor comparison | Why switch from OneStream/Anaplan/Pigment/Excel? | differentiated message repeated unprompted by ≥50% of buyers | revise positioning; do not claim $500k+ value |

## Interview guide

### CFO / buyer

1. Walk through the last decision that required reforecasting or board intervention. What evidence was missing?
2. What did the process cost in time, delay, risk, or external support?
3. Which systems and people were involved? What broke or was manually reconciled?
4. What would need to be true to fund a $500k+ programme rather than extend your current platform?
5. How do you evaluate deployment, data residency, audit, and AI risk?

### Controller

1. Show the close checklist, reconciliation, certification, and exception process—not an idealized description.
2. Which control fails, is delayed, or is evidenced outside the current system?
3. How are adjustments, FX, intercompany exceptions, and sign-offs tracked?
4. What must an auditor independently reconstruct?

### FP&A analyst

1. Observe a forecast change from source data to approval; capture tools, exports, rework, and handoffs.
2. What Excel behavior is non-negotiable? Which behavior is dangerous?
3. How do you know a number is current, approved, or explainable?
4. Show a variance that required a narrative and accountable action.

### Security / IT

1. What deployment patterns are permitted for financial data?
2. What controls are required for SSO, tenant isolation, endpoint/local data, encryption, audit, retention, backups, and AI providers?
3. What would block a local workspace, browser app, or hybrid model?

## Evidence capture format

For every research session record role/segment, system landscape, verbatim pain statement, observed workflow, quantified cost/time, key objection, quote consent, assumption IDs touched, and follow-up. Do not store customer financial data in research notes.

## Decision cadence

- Weekly: update assumption registry with evidence and confidence.
- After 10 completed interviews: hold a research synthesis/Blaze challenge session.
- Do not reapprove PRD/UX/architecture until A-01, A-02, A-03, A-07, and A-13 have evidence-based disposition.

---

## Solo-dev evidence strategy (2026-08-11, owner re-baseline)

### Rationale
Solo development cannot recruit enterprise interviewees. Validation must use evidence a solo developer can genuinely collect, while keeping the honesty bar intact.

### Evidence tiers (label in evidence-log)
| Tier | Type | Label | Threshold for use | What it can change |
|---|---|---|---|---|
| 1 | Enterprise interviews (future) | PRIMARY | ≥3 participants + contradictions documented | Assumption VALIDATED/INVALIDATED |
| 2 | Product-led: beta usage, waitlist, workflow completion, retention, unsolicited demand | BETA-USAGE | real, consent-aware, anonymized | PARTIAL-validation signals; scope/pilot-segment selection |
| 3 | Public practitioner artifacts (threads, case studies, conference content) | ARTIFACT | real public sources cited | Hypothesis refinement; competitive calibration |
| 4 | Secondary surveys/vendor analysis | SECONDARY | public sources cited | Question sharpening only |

### Product-led validation loop (what a solo dev can run)
1. **Public beta / waitlist**: deploy a real beta (browser/PWA unblocking is a prerequisite — A-12), collect signups; threshold: ≥30 qualified signups for a demand signal.
2. **Real usage**: ≥10 weekly active beta users; ≥5 complete a real close→decision→board-pack loop with their own data.
3. **Feedback**: structured session-notes from volunteer beta users (anonymized, consent-aware) — these are real users, not invented ones.
4. **Community engagement**: r/FPandA, Indie Hackers, HN — share the real product, collect real reactions (ARTIFACT evidence).
5. **Unsolicited demand**: ≥3 "I'd pay for this" signals from unrelated users → PARTIAL A-01 signal (never VALIDATED).

### Honesty rules (unchanged)
- No fabrication; every evidence row labeled by tier.
- Only Tier 1 (or verified operational artifact equivalent) changes `VALIDATED` status.
- Tiers 2–4 update Confidence + scope decisions; assumption Status column remains UNVALIDATED until Tier 1.
- If enterprise access ever appears, revive the interview kits (R-01 source map + outreach kit + session kit).
