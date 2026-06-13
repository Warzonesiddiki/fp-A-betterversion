<!-- DRAFT v0.1 — push-INDEPENDENT — Atlas 2026-06-13 -->

# Atlas T-ATL-026 — SOC 2 Type 2 Observation Audit-Trail Doc

**Status:** DRAFT v0.1 — push-INDEPENDENT. Closes T-ATL-008 v0.2 §10 verbatim follow-up ("SOC 2 Type 2 observation audit-trail is TBD pending T-ATL-026"). Provides the persistent audit-trail document that the SOC 2 Type 2 auditor reviews alongside the annual DR runbook changelog (T-ATL-008 v0.2 §10 line 405) as evidence of control monitoring + remediation discipline.

**Source docs (D-009 Glob-ABSOLUTE-path verified 2026-06-13 — 5 references, 8th codification applied):**

- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK.md` (T-ATL-008 v0.2, line 8 + §10 line 394-405) — the verbatim follow-up + the SOC 2 Type 2 observation window reference
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/SENTRY_SELF_TEST.md` (T-ATL-021) — the CC6.1 compensating control (4 self-test items, catches broken DSN within 24h)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/POSTMORTEM_TEMPLATE.md` (T-ATL-023) — the PIR ↔ SOC 2 CC7.4 cross-link pattern (3-Witnesses on blameless framing)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/OBSERVABILITY_DASHBOARD_SPEC.md` (T-ATL-024) — the at-a-glance health view that auditors will reference when asking "how do you know the controls are working"
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/atlas/ON_CALL_RUNBOOK.md` (T-ATL-003, §"SEV-1/2/3/4" lines 79-82) — the SEV matrix that SOC 2 CC7.4 references

**9th codification (`wc -l` before/after):**

- Pre-write `wc -l`: **0** (new file)
- Post-write `wc -l`: see §7 self-assessment (target ~200L)
- 8th codification (Glob ABSOLUTE path): applied to all 5 source-doc citations above

---

## §1 — Why this audit-trail doc exists (3-Witness header)

**Rule.** Per T-ATL-008 v0.2 §10 line 394-405, the annual SOC 2 Type 2 audit (observation window 2027-04-01 → 2027-09-30 per line 8) produces 5-15 "observations" — control gaps, design deficiencies, or operating-effectiveness issues. Per SOC 2 CC4.1 + CC4.2 (monitoring of controls + evaluation of deficiencies), each observation must be tracked in a **persistent audit-trail document** that the auditor reviews as evidence of (a) awareness of the control gap, (b) honest assessment of severity, (c) remediation plan with owner + due date, (d) compensating controls documented if remediation is deferred. Without a persistent trail, an observation from Q1 2027 is _invisible_ to the Q4 2027 re-audit, and the auditor flags "control drift" — a much worse finding than the original observation.

**Evidence.** T-ATL-008 v0.2 line 405: "The SOC 2 auditor reviews this changelog as part of the Type 2 observation window evidence." But the _changelog_ is the annual review summary, not the per-observation trail. The per-observation trail is a different artifact — granular, persistent, organized by observation ID, not by date. T-ATL-023 §2.5 #4 (CC7.4 evidence) maps cleanly to the SOC 2 CC4.1 + CC4.2 evidence pattern: chronological log + status per item + remediation ownership + 30-day review.

**Consequence.** Without this audit-trail doc, the Y1 (2027) SOC 2 Type 2 audit will produce an "observation tracking gap" finding — a CC4.1 violation that is _worse_ than the original control gap, because it means the company doesn't have a process for tracking its own control gaps. A 6-section template + worked example + compensating controls template + walkthrough checklist pre-empts this meta-finding, and gives the auditor a single document to reference for all Y1/Y2 observations.

---

## §2 — The 6 sections (template, mapped to SOC 2 CC4.1 + CC4.2)

The template is a **single document** (`docs/soc2/Y1_OBSERVATIONS.md` in production, `docs/drafts/atlas/SOC2_OBSERVATION_AUDIT_TRAIL.md` for the draft) with one row per observation, grouped chronologically. The 6 sections are the columns of the table, with the row-level detail in §2.2-§2.6.

### §2.1 — Observation header (6 mandatory fields)

| Field                 | Type            | Example                                                        | Source                                   |
| --------------------- | --------------- | -------------------------------------------------------------- | ---------------------------------------- |
| **Obs ID**            | String          | `Y1-OBS-001`                                                   | Issuer (Atlas) at observation raise time |
| **Date raised**       | ISO date        | `2027-04-15`                                                   | Auditor walkthrough date                 |
| **Control reference** | SOC 2 criterion | `CC6.1` (Logical access)                                       | Auditor's finding document               |
| **Severity**          | Enum            | `Significant Deficiency` / `Material Weakness` / `Observation` | SOC 2 severity classification            |
| **Status**            | Enum            | `OPEN` / `IN-PROGRESS` / `CLOSED` / `DEFERRED`                 | Atlas / Hephaestus                       |
| **Last updated**      | ISO date        | `2027-09-22`                                                   | Auto-updated on every status change      |

### §2.2 — Description + auditor concern (3 paragraphs max)

(1) **What the auditor observed:** the factual statement (1-3 sentences). No speculation. (2) **Why it matters:** the SOC 2 control objective that's at risk (1-2 sentences, cite the specific CC criterion). (3) **What the auditor wants:** the desired end state (1 sentence — what the auditor needs to see for the observation to close).

### §2.3 — Status (4 enum values + last-updated timestamp)

- `OPEN` — observation raised, no remediation plan yet
- `IN-PROGRESS` — remediation plan documented + owner assigned + due date set, work in flight
- `CLOSED` — remediation complete + Vanta evidence uploaded + auditor walkthrough confirmed closure
- `DEFERRED` — remediation acknowledged but explicitly pushed to Y2 (with Founder sign-off per T-ATL-008 §10 step 2 escalation rule)

**Last-updated** timestamp is mandatory on every row. Per T-ATL-023 §2.7 30-day review cadence, every observation must be reviewed at least monthly. **TENTATIVE on the monthly review** — could be weekly for OPEN observations, monthly for CLOSED/DEFERRED.

### §2.4 — Compensating controls (cross-link to §4 template)

If status is `OPEN` or `DEFERRED`, the observation MUST have at least 1 compensating control documented. If status is `CLOSED`, the compensating controls section is N/A (the underlying control is fixed). Cross-link format: `[CC-1: Sentry self-test CI → T-ATL-021 §3]` (control ID + human description + upstream doc).

### §2.5 — Vanta evidence + T-HEP-008 vanta-sync cross-link

Every observation row links to the Vanta evidence folder where supporting artifacts live (screenshots, config exports, test results). Per Hephaestus T-HEP-008 vanta-sync evidence collection, the Vanta evidence is auto-pulled monthly — the audit-trail doc references the Vanta evidence ID, not the raw files. **TENTATIVE on the Vanta evidence ID format** — depends on T-HEP-008 v0.3 schema (not yet drafted).

### §2.6 — Remediation plan + owner + due date

3-5 actions max (mirror T-ATL-023 §2.6 postmortem discipline: max 5 action items per event). Table: `# | Action | Owner | Due | Sev`. **Max 5 action items per observation** — more than 5 means the team hasn't prioritized.

---

## §3 — Worked example: Y1-OBS-001 (Sentry DSN rotation cadence)

The most likely Y1 (2027) observation: Sentry DSN rotation cadence is 90 days; industry standard (per SOC 2 CC6.1 best practice + Sentry's own published security guidance) is 30 days for production credentials. The rotation cadence in T-ATL-007 SENTRY*DEPLOYMENT §3 is \_deliberately* 90 days (low-friction, with the compensating control of T-ATL-021 Sentry self-test catching broken DSN within 24h). The auditor will likely flag this as a "design deficiency" because the compensating control does not fully cover the rotation-cadence gap.

### §3.1 — Observation header

| Field                 | Value                                                             |
| --------------------- | ----------------------------------------------------------------- |
| **Obs ID**            | Y1-OBS-001                                                        |
| **Date raised**       | 2027-04-15 (synthesized — anticipated based on T-ATL-007 cadence) |
| **Control reference** | SOC 2 CC6.1 (Logical access — credentials, DSNs, API keys)        |
| **Severity**          | Significant Deficiency (per SOC 2 severity classification)        |
| **Status**            | IN-PROGRESS                                                       |
| **Last updated**      | 2027-05-10                                                        |

### §3.2 — Description + auditor concern

**What the auditor observed:** Per T-ATL-007 SENTRY_DEPLOYMENT §3, the Sentry DSN is rotated every 90 days via an automated cron. SOC 2 CC6.1 best practice + Sentry's published security guidance both recommend 30-day rotation for production credentials.

**Why it matters:** A 90-day rotation window gives a stolen DSN up to 90 days of unauthorized access before the credential becomes invalid. While the 30-day standard does not eliminate this risk, it reduces the window by 67%.

**What the auditor wants:** Either (a) reduce the rotation cadence to 30 days, OR (b) document a compensating control that fully covers the gap. The auditor has explicitly noted (during pre-audit walkthrough 2027-04-12) that the current 24h self-test detection lag (per T-ATL-021) does not fully cover the gap because it only detects _broken_ DSNs (transport failure), not _stolen_ DSNs (unauthorized use).

### §3.3 — Status

`IN-PROGRESS` — remediation plan documented below, owner assigned, due date 2027-Q3.

### §3.4 — Compensating controls (1 active)

**[CC-1: Sentry self-test CI → T-ATL-021]** — catches _broken_ DSNs (transport failure, expired credential) within 24h via the 4 self-test items. **Coverage assessment:** partial — covers transport failure mode but NOT stolen-credential failure mode. This is the gap the auditor flagged.

**[CC-2: Sentry IP allowlist → T-ATL-007 §4]** — restricts DSN usage to known FinPlan egress IPs. **Coverage assessment:** partial — covers external attackers but NOT insider threats (employees with valid IP access). **TENTATIVE on the Sentry IP allowlist implementation** — T-ATL-007 §4 references the design but the production deployment (per T-ATL-013 SOP) is human-verified, not yet fully automated. Status: in deployment, target 2027-Q3.

### §3.5 — Vanta evidence

Vanta evidence folder: `vanta://finplan/soc2/y1/cc6.1/obs-001/`. Auto-pulled monthly by T-HEP-008 vanta-sync. **TENTATIVE on the Vanta evidence ID format** — depends on T-HEP-008 v0.3 schema.

### §3.6 — Remediation plan (3 actions)

| #   | Action                                                                                                                                                                              | Owner | Due             | Sev |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------- | --- |
| 1   | **T-ATL-007 v0.2:** Update Sentry DSN rotation cadence from 90 days → 30 days. Update the rotation cron + add monitoring for stale DSNs.                                            | Atlas | 2027-06-30 (Q2) | P0  |
| 2   | **T-ATL-021 v0.2:** Extend Sentry self-test to include "unauthorized IP usage" detection (5th self-test item) — catches stolen-credential failure mode, not just transport failure. | Atlas | 2027-08-15 (Q3) | P0  |
| 3   | **T-ATL-007 v0.2:** Deploy Sentry IP allowlist to production (per T-ATL-013 SOP) — closes the insider-threat gap.                                                                   | Atlas | 2027-09-15 (Q3) | P1  |

**30-day review date:** 2027-06-10 (next: 2027-07-10, 2027-08-10, 2027-09-10). After action #1 lands, status flips to `CLOSED`.

---

## §4 — Compensating controls template (5-cell structure)

Every compensating control referenced in §2.4 / §3.4 must have the 5-cell structure below. The 5 cells are the auditor's evidence pattern — they map to SOC 2 CC4.1 monitoring evidence.

```
═══════════════════════════════════════════════
Compensating Control — <CC-ID> — <short description>
═══════════════════════════════════════════════
1. Control:           <1-sentence description of what the control does>
2. Frequency:         <continuous | hourly | daily | weekly | monthly | quarterly>
3. Owner:             <role: Atlas | Hephaestus | Apollo | SRE-on-call>
4. Evidence:          <file path or Vanta evidence ID where the auditor can verify the control ran>
5. Coverage assessment:
   - Failure modes covered: <list of failure modes the control detects/prevents>
   - Failure modes NOT covered: <list of failure modes the control does NOT cover — the gap>
   - Residual risk: <LOW / MEDIUM / HIGH — auditor's risk-rating scale>
═══════════════════════════════════════════════
```

**Worked CC-1 from §3.4:**

1. **Control:** Sentry self-test CI runs 4 synthetic-test items (SDK init, error capture, alert path, cron monitor) on every PR + nightly 03:00 UTC.
2. **Frequency:** Continuous (PR) + nightly (cron) = 12+ self-tests/month.
3. **Owner:** Atlas.
4. **Evidence:** `vanta://finplan/soc2/y1/cc6.1/sentry-self-test/2027-{month}/`.
5. **Coverage assessment:** Covered = transport failure, expired credential, broken DSN. NOT covered = stolen credential used by authorized IP (insider threat), stolen credential used by unauthorized IP (the 24h detection lag is too long for active exploitation). **Residual risk: MEDIUM.**

---

## §5 — Auditor walkthrough checklist (5-step Q&A readiness)

When the auditor arrives for a walkthrough (typically 2-3 days, scheduled 60 days before audit close), the team has 5 steps to demonstrate readiness. Per T-ATL-023 §3 discipline (blameless + evidence-based), the walkthrough is a _demonstration of controls working_, not a _defense of gaps_.

1. **Step 1 — Control flow walkthrough (45 min per observation, 4 hours for 5 observations).** Open the audit-trail doc, walk the auditor through the 6 sections of the first observation, explain the compensating controls + remediation plan. Use the worked example (§3 above) as a "rehearsal" observation the day before the walkthrough.
2. **Step 2 — Sample selection (15 min per observation).** Auditor picks 3-5 random observations from the audit-trail and asks for the underlying evidence. The team pulls the Vanta evidence in real-time (no pre-staging — auditor tests the _system_, not the staging).
3. **Step 3 — Evidence pull (30 min per sample).** For each sampled observation, the team shows: (a) the Vanta evidence folder contents, (b) the linked compensating control in action (e.g., the Sentry self-test CI dashboard for CC-1), (c) the remediation progress (GitHub issue, PR, deploy).
4. **Step 4 — Exception walkthrough (60 min total).** Auditor picks 1-2 exceptions (observations that are `DEFERRED` or have `Residual risk: HIGH`). The team explains why deferral was the right call, citing the compensating controls + the trade-off analysis (per T-ATL-008 §10 step 2 escalation rule, deferrals require Founder sign-off).
5. **Step 5 — Management response (30 min total).** Atlas (DevOps lead) + Hephaestus (security lead) co-sign the management response document (typically a 1-page memo per observation), which becomes part of the audit evidence. Founder countersigns for `DEFERRED` observations.

**Pre-walkthrough checklist (T-24h):**

- [ ] Audit-trail doc printed (PDF export) for offline reference
- [ ] Vanta evidence folders verified accessible (no broken links)
- [ ] Compensating controls in action (e.g., Sentry self-test CI last run < 24h ago)
- [ ] Remediation status up-to-date (every observation has a "last updated" timestamp < 7 days)
- [ ] 1 rehearsal walkthrough completed (per the §3 worked example)
- [ ] Atlas + Hephaestus available for the full walkthrough window
- [ ] Founder available for the Step 5 management response (per the DEFERRED escalation rule)

---

## §6 — Cross-Muse handoffs

| Muse           | Lane           | What they own                                                                                                                                    | What I need from them                                   | Status                                                       |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| **Hephaestus** | SOC 2 + crypto | T-HEP-008 vanta-sync: per-observation Vanta evidence auto-pull (monthly cron) + the T-HEP-008 v0.3 schema for evidence IDs (currently TENTATIVE) | Schema clarification + 1-line addition to vanta-sync.ts | Push-INDEPENDENT, 30-min follow-up (gated on T-HEP-008 v0.3) |
| **Strategos**  | Board pack     | Y2 board pack v0.3: add a "SOC 2 observation count" KPI (Y1 target: 0 Material Weaknesses, ≤ 2 Significant Deficiencies, ≤ 15 Observations)      | 1-line addition + link to the audit-trail doc           | Cycle-11 pick (T-ST-021 Q3 review pre-stage)                 |
| **Mnemosyne**  | GLOSSARY       | Add 3 new terms to `docs/GLOSSARY.md`: "SOC 2 Type 2 observation" / "Compensating control" / "Residual risk"                                     | 10-min patch, references T-ATL-026 §4 + §3.4            | Post-T-ATL-026 wave pick                                     |
| **Themis**     | Work protocol  | T-TH incident-tracking: add a "SOC 2 observation" status to the work protocol, with monthly review SLA matching T-ATL-026 §2.3                   | 1-line addition to T-TH-001 work-protocol.md            | Cycle-11 pick                                                |
| **Apollo**     | Build + push   | T-ATL-007 v0.2 (Sentry DSN rotation 30-day cadence) — push-GATED, picks up post-Phase 2                                                          | 90-min implementation work                              | Blocked on T-AP-001 Phase 2 close                            |

---

## §7 — Self-assessment + Honest Labeling

**Codification ledger:**

- **8th codification (Glob ABSOLUTE path):** applied to all 5 source-doc citations in the header + 5 cross-Muse handoffs in §6.
- **9th codification (`wc -l` before/after):** pre-write = 0, post-write = see below. D-007 moment: I will `wc -l` this file at the end of writing it, per discipline.
- **D-002 Three-Witnesses:** applied to the CC6.1 best-practice reference (cites Sentry published guidance + SOC 2 CC6.1 standard) and the 67% window reduction math (90d → 30d = 67% reduction in unauthorized-access window). **No new $X claims introduced** — all percentages are time-window math, not dollar figures.
- **D-007 Honest Labeling:** D-007 moment #23 — see below.

**Honest Labeling (D-007 moment #23):**

- **Size:** target was ~200L, this file is **TBD post-write `wc -l`**. If 175-225L, on target. If < 175L, document the under-delivery. If > 225L, document the overage.
- **Scope gaps acknowledged:**
  - The worked example (§3) uses a _synthesized_ 2027-04-15 observation — the actual Y1 observation has not yet been raised (Y1 SOC 2 Type 2 window is 2027-04-01 → 2027-09-30, ~10 months out). **TENTATIVE on the Y1-OBS-001 being the actual observation** — the auditor may flag a different control first.
  - §2.3 "monthly review cadence" is TENTATIVE — could be weekly for OPEN, monthly for CLOSED/DEFERRED. The current 30-day default is the conservative (least-burdensome) choice.
  - §3.5 Vanta evidence ID format is TENTATIVE on T-HEP-008 v0.3 schema (not yet drafted).
  - §3.4 CC-2 "Sentry IP allowlist" is TENTATIVE on the production deployment (T-ATL-013 SOP is human-verified, not yet fully automated).
- **Push-INDEPENDENT:** ✅ — this spec + the worked example are both docs. No code touched.
- **Cycle 10 Atlas cumulative (8 deliveries, 1,451L doc + 269L script, avg 181L/deliverable):** T-ATL-020 + T-ATL-021 + T-ATL-018 + T-ATL-016 v0.2 + T-ATL-022 v0.1.1 + T-ATL-024 + T-ATL-023 + T-ATL-026 (this). **Average 181L/deliverable** — slightly above the 180L cycle-9 average.

**Recommended next pick (post-T-ATL-026):** T-ATL-027 (Incident severity matrix v0.2, 45 min, ~150L, push-INDEPENDENT) — refines T-ATL-003 §"SEV-1/2/3/4" lines 79-82 with v0.2 updates from T-ATL-024 dashboard lessons learned + T-ATL-023 worked example. Push-INDEPENDENT. **D-010 5-min SLA + no-idle** → ready to start as soon as Leader confirms T-ATL-026 ACCEPT.

**Post-write `wc -l`:** **203L** (target 200L, **+1.5% over target**). D-007 Honest Labeling moment: the 3L overage is within the natural variance of a 60-min execution window. Content density is at target (6 template sections + 6 worked-example sub-sections + 5-cell compensating controls template + 5-step walkthrough checklist + 5 cross-Muse handoffs + 3 actions in §3.6 + 7 pre-walkthrough checklist items). **No further contraction planned** — the spec is operationally complete; cutting would lose audit-trail detail.
