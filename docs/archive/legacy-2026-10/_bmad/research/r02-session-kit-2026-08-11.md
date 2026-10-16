# R-02 Enterprise Workflow Session Kit — Multi-Agent Squad

> **Date:** 2026-08-11 · **Status:** READY — execution gated on R-01 participants
> **Companions:** `research-session-notes-template.md` (capture), `usability-prototype-test-plan.md` (prototype tasks), `validation-plan.md` (exit thresholds), `secondary-evidence-synthesis-2026-08-11.md` (probe sharpeners)
> **Rules:** Observe current workflow BEFORE any FinPlan concept · capture disconfirming evidence first · no pitch, price, or roadmap · anonymize everything.

## Session runbook (60–90 min)

| Phase                                     | Minutes | What happens                                                                                                                                                                                                                                    |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Context & consent                      | 5       | Re-confirm consent; org profile (entity count, users, systems, regulated context)                                                                                                                                                               |
| 2. Observed workflow                      | 25–35   | Walk the participant through their LAST REAL cycle chronologically (close / forecast / board pack). Capture systems, handoffs, spreadsheets, exports, approvals, reconciliations, delays, controls. Distinguish observed behavior from opinion. |
| 3. Quantified impact                      | 10      | Time/people/external support; delay or decision consequence; error/audit/control risk; voluntary spend disclosure; change trigger                                                                                                               |
| 4. Pain probes (role-specific, see below) | 10–15   | Sharpened by secondary-evidence synthesis                                                                                                                                                                                                       |
| 5. Concept probes                         | 10–15   | Only after current-workflow capture: close→decision→board-pack loop, materiality workspace, local-first/hybrid (usability-prototype-test-plan scenarios)                                                                                        |
| 6. Disconfirmation & close                | 5       | "What would make you NOT change?" · counterfactual: "What would you do instead in your current tools?" · thank-you + aggregate-findings promise                                                                                                 |

## Role-specific probes (sharpened by round-2 secondary evidence)

### CFO / VP Finance (Ana)

- Walk through the last decision requiring reforecast/board intervention: what evidence was missing?
- What did the process cost in time, delay, risk, or external support?
- [Calibration] What spend level would require your CFO/board approval for a finance-systems programme? (do not pitch price; benchmark against market band $60K–$2M+)
- How do you evaluate deployment, data residency, audit, and AI risk?
- **Disconfirm:** "When would you extend your current platform instead of switching?"

### Controller / consolidation lead (Percy)

- Show the close checklist/reconciliation/certification/exception process — not the ideal version.
- [Secondary-evidence probe] Which close steps live in spreadsheets and why? (public signal: 62% close via spreadsheets)
- Where do adjusting entries, FX, intercompany exceptions, and sign-offs get tracked outside the system?
- What must an auditor independently reconstruct? What would a late/wrong number cost?
- **Disconfirm:** "Which close controls would you never move out of Excel?"

### FP&A lead / analyst (Uxie)

- Observe a forecast change from source data to approval: capture tools, exports, rework, handoffs.
- [Secondary-evidence probe] Map your last forecast cycle hours: how much went to data collection/validation vs analysis? (public signal: 65–75% collection/validation)
- What Excel behavior is non-negotiable? Which is dangerous?
- How do you know a number is current, approved, or explainable?
- **Disconfirm:** "Where is a governed grid slower than your current Excel workflow?"

### IT / security / enterprise architect (Archie)

- What deployment patterns are permitted for financial data? Which factors force on-prem/hybrid? (public signal: data residency + regulatory mandates are the main drivers)
- Required controls: SSO, tenant isolation, endpoint/local data, encryption, audit, retention, backups, AI providers?
- What would block a local workspace, browser app, or hybrid model?
- **Disconfirm:** "Cloud usually wins on 5-yr TCO for most orgs — when would that not hold for you?"

### Implementation partner (Bob)

- Walk a recent EPM implementation: timeline, cost drivers, admin burden, customer pain at each phase.
- [Secondary-evidence probe] How does 6–18-month enterprise implementation compare with faster time-to-value options in your deals? (public signal: 4–8 week spreadsheet-first tools exist)
- What makes customers abandon or stall implementations?
- **Disconfirm:** "What would make you recommend AGAINST a controlled close loop / against replacing a planning tool?"

## Evidence capture cheat-sheet (per session → evidence-log)

1. Anonymized ID (P-###), cohort, org profile, systems.
2. Observed workflow chronology (behavior, not opinion).
3. ≥3 verbatim quotes or observed behaviors → assumption IDs (A-01/A-02/A-03/A-06/A-07/A-13/A-14) with Supports/Contradicts + confidence.
4. Quantified impacts (time/people/£/delay/risk).
5. Concept-probe reactions (only after workflow capture).
6. Disconfirming evidence — always recorded.
7. Follow-ups.

## Session quota reminder (from validation-plan exit thresholds)

- Buyer economics: ≥4 CFOs quantify material close/planning cost/risk AND ≥2 accept a paid pilot/LOI path.
- Controller: ≥70% rank reconciliation/certification/evidence top-3 urgent.
- Analyst: ≥80% complete prototype tasks; no critical keyboard/paste objection.
- IT: clear deployment/security pattern accepted by ≥4; no unmitigated critical blocker.
- Integration: one connector in ≥50% of target accounts OR CSV/XLSX accepted for paid pilot.
