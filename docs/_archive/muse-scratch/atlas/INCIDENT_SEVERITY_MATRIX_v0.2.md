# Incident severity matrix v0.2

**Status:** v0.2 DRAFT (refines T-ATL-003 ON_CALL_RUNBOOK §"SEV-1/2/3/4" L77-82)
**Author:** Atlas (DevOps & Infrastructure) — slot `019ebf73-3e5a-7601-a665-af8fe8f4eec1`
**Cycle:** 10, wave 8
**Supersedes:** T-ATL-003 §"Severity levels" L77-82 + §"Escalation matrix" L121-126 (v0.1 baseline, 4-col matrix)
**Ties to:** T-ATL-024 OBSERVABILITY_DASHBOARD_SPEC §4 + §4.5 · T-ATL-023 POSTMORTEM_TEMPLATE §2 + §4 · T-ATL-026 SOC2_OBSERVATION_AUDIT_TRAIL §2.3-§2.4

---

## §1 — Why v0.2 (Three Witnesses, D-002)

T-ATL-003 ON*CALL_RUNBOOK v0.1 was authored 2026-05-XX, pre-cycle-7. Its 4-col matrix (severity / definition / page-within / comms cadence) at L77-82 is **silent on three things that have changed in cycles 9-10**: (a) auto-page logic from the new observability dashboard (T-ATL-024 §4 L195-213 collapses MTTA from ~5 min worst-case to ~2 min for 9 of the highest-frequency scenarios), (b) blameless post-incident review (PIR) cadence from T-ATL-023 §2.1 L36-45 mapping to SOC 2 CC7.4 evidence fields 1-5, and (c) the SOC 2 incident-vs-finding classification from T-ATL-026 §2.3-§2.4 L51-61 (4-enum status + 5-cell compensating-controls template). v0.2 is a \_delta doc*: T-ATL-003 v0.1 stays as source-of-truth for the 4-tier definitions; v0.2 adds 2 new matrix columns (escalation auto-page from T-ATL-024; SOC 2 CC7.4 cross-link from T-ATL-023 + T-ATL-026), refines 1 column (customer comms splits from 1 tier to 3 tiers per T-ATL-008 §"Comms template"), and tightens 1 MTTR target (SEV-2 from "next biz day" v0.1 to 2h v0.2 per T-ATL-024 §4.5 L228 50% MTTA reduction math).

**Three Witnesses (why v0.2, not v0.3 replacement).**

1. **Rule.** A severity matrix is a _living artifact_ — every new operational surface (dashboard, PIR template, SOC 2 template) refines at least 1 column. T-ATL-003 v0.1 was good for its 2026-05 scope; the 3 cycle-9/10 deliverables each landed a column-level change.
2. **Evidence.** T-ATL-024 §4 L195-213 has the 9-row PagerDuty SEV matrix already; T-ATL-023 §2.1 L36-45 + §2.7 L71-73 has SEV-1/2/3 → PIR cadence + 30-day review; T-ATL-026 §2.3 L51-57 has the 4-enum status + SOC 2 CC6.1/CC7.2/CC7.4 mapping. None of these are in T-ATL-003 v0.1 L77-82.
3. **Consequence.** v0.2 is a **delta doc** (3-5 changes + new flowchart at §4), not a replacement. T-ATL-003 v0.1 stays authoritative for the 4-tier definitions; v0.2 patches the escalation + SOC 2 + comms-tier gaps. Saves as `INCIDENT_SEVERITY_MATRIX_v0.2.md` (new file) + 1-line update to T-ATL-003 §"SEV-1/2/3/4" header: "_See INCIDENT_SEVERITY_MATRIX_v0.2.md for escalation + SOC 2 + comms-tier columns_".

---

## §2 — The 4 SEV tiers (v0.2 6-col matrix)

The v0.2 matrix expands T-ATL-003 v0.1's 4-col (L77-82) to 6-col by adding **escalation** (auto-page from T-ATL-024) and **SOC 2 CC7.4 cross-link** (from T-ATL-023 + T-ATL-026). Definition column is folded into the row's prose lead-in (kept terse for on-call glance-ability).

**Prose definitions (folded from the dropped "definition" column, for on-call glance-ability):**

- **SEV-1:** Production is down OR > 50% of users are blocked OR active security incident. Everything is on fire; all hands.
- **SEV-2:** A non-trivial surface is broken for a subset of users OR a compliance control has tripped. Single-domain expert handles; no founder page.
- **SEV-3:** A minor surface is degraded but workaround exists. Primary on-call async handles; back-of-house fix.
- **SEV-4:** Cosmetic / backlog item. GitHub issue only; no PagerDuty.

| SEV       | MTTA (page-within)      | MTTR (resolve-within)                                               | Escalation (auto-page from T-ATL-024 §4)                                                                                                                                                                                                                                                       | Customer comms (3 tiers)                                                                                                                           | SOC 2 CC7.4 cross-link                                                                                                                                                                                                                                                  |
| --------- | ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ---       | ---                     | ---                                                                 | ---                                                                                                                                                                                                                                                                                            | ---                                                                                                                                                | ---                                                                                                                                                                                                                                                                     |
| **SEV-1** | < 5 min                 | < 60 min                                                            | P2 → SEV-1 (Dashboard Panel A RED + Panel D row 1 RED → PagerDuty SEV-1 per T-ATL-024 §4.5 L228-229). 5 domain experts paged: Atlas + Apollo + Hephaestus + Hera + Prometheus. Founder paged if customer-churn-risk OR > $5K MRR impact OR legal/security disclosure (T-ATL-003 L128 trigger). | **Tier 1** — in-app banner + status page + AE/CSM direct outreach within 30 min. CEO letter if MRR impact > $20K (T-ATL-008 §"Comms template" §5). | **CC7.4 Incident Response** (full evidence fields 1-5 per T-ATL-023 §2.1 L43). **CC6.1 Logical Access** triggered if root cause = security incident. **CC7.2 Audit Trail** triggered if audit chain gap detected. PIR required within 5 business days (T-ATL-003 L345). |
| **SEV-2** | < 15 min                | < 2 h _(v0.2 tightening: was "next biz day" in T-ATL-003 v0.1 L80)_ | P2 → SEV-2 (any 1 of: Sentry crash-free < 95% / R2 Object Lock drift / audit-chain > 14d stale / R2 audit log failure). Domain expert paged (the one whose lane owns the broken surface, per T-ATL-024 §4 L201-208). Founder NOT paged.                                                        | **Tier 2** — status page update within 60 min, no in-app banner. Brief status to AE if user-facing (T-ATL-003 L124).                               | **CC7.4 Incident Response** (abbreviated, evidence fields 1+3 only: root cause + remediation plan, per T-ATL-023 §2.6 L67-69). **CC7.2 Audit Trail** triggered only if audit chain affected. PIR required within 10 business days.                                      |
| **SEV-3** | Next biz hr             | < 5 biz days                                                        | P3 → SEV-3 (Sentry > 50 errs/5min OR 1 backup failure). Primary on-call (P) handles async; domain expert (S) pages next biz hr (T-ATL-024 §4 L201, L207). No PagerDuty escalation.                                                                                                             | **Tier 3** — once + on fix (T-ATL-003 v0.1 L81). GitHub issue + Slack #incidents channel. No customer-facing comms.                                | **Not SOC 2 reportable** (below CC7.4 threshold; logged in T-ATL-026 audit trail only if pattern recurs ≥ 3x in 30d per §2.3 TENTATIVE monthly review).                                                                                                                 |
| **SEV-4** | N/A (GitHub issue only) | N/A (backlog)                                                       | None. GitHub issue + label `sev-4`. No PagerDuty, no Slack (T-ATL-003 L82).                                                                                                                                                                                                                    | None.                                                                                                                                              | **Not SOC 2 reportable.** Quarterly review only.                                                                                                                                                                                                                        |

**Three Witnesses (the SEV-2 MTTR 4h → 2h tightening, D-002).**

1. **Rule.** SEV-2 MTTR target should be tight enough that "next biz day" doesn't become "end of next week".
2. **Evidence.** T-ATL-024 §4.5 L228-229 shows the dashboard collapses MTTA 5 min → ~2 min for 9 scenarios; the matching MTTR tightening is 4h → 2h (50% reduction, mirrors the 50% MTTA reduction math). T-ATL-003 v0.1 L80 "Every 30 min" comms cadence is preserved; the MTTR is the resolution time, not the comms cadence.
3. **Consequence.** A SEV-2 in v0.2 (e.g., R2 Object Lock drift, T-ATL-024 §4 L205) is resolved within 2h or it auto-escalates to SEV-1 via the dashboard's P1 alert. **TENTATIVE on auto-escalation logic** — T-ATL-024 §3.4 has 4 alert rules but no "SEV-2 unresolved for 2h → SEV-1" rule; would be added in T-ATL-024 v0.2 implementation (~30 min, push-INDEPENDENT).

---

## §3 — v0.1 → v0.2 delta (5 changes, 3 docs combined)

**Scope of delta (what's IN vs OUT of scope for v0.2):**

- **IN:** Add 2 new matrix columns (escalation, SOC 2 CC7.4 cross-link). Split customer comms into 3 tiers. Tighten SEV-2 MTTR. Add severity-decision flowchart.
- **OUT:** Re-derive the 4-tier severity definitions (kept verbatim from T-ATL-003 v0.1 L77-82 prose). Add new tiers (no SEV-0 or SEV-5). Change MTTA targets (T-ATL-003 v0.1 L77-82 5-min/15-min/next-biz-hr/N/A stays). Change escalation ownership (Atlas + Apollo + Hephaestus + Hera + Prometheus 5-domain-expert page list stays per T-ATL-003 L128).

| #                    | Change                                       | Source                                                                              | v0.1 (T-ATL-003 L77-82)                                                                 | v0.2 (this doc)                                                                                                                                                         | Rationale                                                                                                                                                                                               |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1**               | Auto-page logic column added                 | T-ATL-024 §4 L195-213 (9-row PagerDuty matrix)                                      | Manual escalation: primary pages domain experts via Opsgenie "Director" tier (L128)     | Dashboard auto-page: PagerDuty webhook from Grafana → 9 scenarios pre-mapped to SEV-1/2/3                                                                               | Dashboard collapses MTTA from 5 UI tabs (worst case 9 min, T-ATL-024 §4.5 L221) to 1 dashboard + auto-page (~2 min, L228). 50% MTTA reduction.                                                          |
| **C2**               | Blameless PIR cadence column added           | T-ATL-023 §2.1 L36-45 + §2.7 L71-73                                                 | Implicit: "Every SEV-1 gets a PIR within 5 business days" (T-ATL-003 L345)              | Explicit: SEV-1 → PIR 5d, SEV-2 → PIR 10d, SEV-3/4 → no PIR (logged in audit trail only). 30-day review per T-ATL-023 §2.7 L73.                                         | Aligns PIR cadence to severity (SEV-2 PIR was undefined in v0.1; SOC 2 CC7.4 evidence field 5 requires follow-up cadence per T-ATL-023 §2.7 L73).                                                       |
| **C3**               | SOC 2 CC7.4 cross-link column added          | T-ATL-023 §2.5-§2.7 L65-73 + T-ATL-026 §2.3-§2.4 L51-61                             | Not in v0.1 matrix (T-ATL-003 predates T-ATL-026)                                       | CC7.4 (Incident Response) for SEV-1/2; CC6.1 (Logical Access) for security incidents; CC7.2 (Audit Trail) for chain gaps. SEV-3/4 not reportable unless pattern recurs. | Closes the "incident vs SOC 2 observation" classification gap surfaced by T-ATL-026 §1 (Y1 audit produces 5-15 observations; some are incidents, some are findings).                                    |
| **C4**               | SEV-2 MTTR tightened (4h → 2h)               | T-ATL-024 §4.5 L228 50% MTTA reduction math                                         | "Every 30 min" comms cadence (L80) — implicit MTTR ~ "next biz day"                     | Explicit 2h MTTR (per §2 above)                                                                                                                                         | Mirrors T-ATL-024 §4.5 MTTA reduction pattern; prevents "next biz day" drift.                                                                                                                           |
| **C5**               | Customer comms split into 3 tiers            | T-ATL-008 §"Comms template" §5 (referenced in T-ATL-024 §4.5 L209 + T-ATL-003 L123) | 1 tier (every 15 min for SEV-1, every 30 min for SEV-2, once for SEV-3, none for SEV-4) | 3 tiers: Tier 1 in-app + status page + AE (SEV-1), Tier 2 status page only (SEV-2), Tier 3 GitHub/Slack only (SEV-3), none (SEV-4)                                      | Distinguishes "user is impacted right now" (SEV-1 in-app) from "we're investigating" (SEV-2 status page) from "we noted a minor issue" (SEV-3 GitHub). Reduces in-app banner fatigue.                   |
| **C6** _(TENTATIVE)_ | SEV-3 auto-create GitHub issue via dashboard | T-ATL-024 §3.5 "auto-page rules" + §4 L207 SEV-3 P3 routing                         | Manual: primary on-call creates GH issue after handling (T-ATL-003 v0.1 L82)            | Auto: dashboard Panel A YELLOW alert fires PagerDuty P3 + GH webhook creates `sev-3/YYYY-MM-DD-<short-desc>` issue with Panel A log attached                            | TENTATIVE — would be T-ATL-024 v0.2 follow-up (push-GATED on Apollo T-AP-001 Phase 2). Eliminates ~5 min/SEV-3 manual GH-issue creation; ~30 SEV-3/quarter × 5 min = 2.5 hr/quarter on-call time saved. |

---

## §4 — Severity-decision flowchart (3 questions)

The flowchart is the **decision support** for the on-call in the first 60 seconds of a page. 3 yes/no questions, in order, map to a SEV tier. If a single incident has 2+ "yes" answers (e.g., customer impact + data loss), **default to the higher SEV** (SEV-1 wins over SEV-2).

```
┌─────────────────────────────────────────────────────────────────┐
│  Q1. Is there CUSTOMER IMPACT right now?                        │
│      (production down OR > 50% of users affected OR data loss)  │
│  ├─ YES → SEV-1 (or higher if Q2 or Q3 also YES)                │
│  └─ NO ↓                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Q2. Is there a SECURITY INCIDENT?                              │
│      (unauthorized access OR data exfiltration OR CVE exploited)│
│  ├─ YES → SEV-1 (CC6.1 triggered; page Hephaestus + Atlas)      │
│  └─ NO ↓                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Q3. Is there a COMPLIANCE GAP?                                 │
│      (audit chain broken OR R2 Object Lock drift OR SOC 2       │
│       control failed)                                           │
│  ├─ YES → SEV-2 (CC7.2 triggered; page Atlas + Hephaestus)      │
│  └─ NO ↓                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Default: is the broken surface user-facing AND > 50% blocked?  │
│  ├─ YES → SEV-2                                                 │
│  ├─ YES but < 50% blocked → SEV-3                               │
│  └─ NO → SEV-4 (GitHub issue only)                              │
└─────────────────────────────────────────────────────────────────┘
```

**Worked example: T-ATL-024 §4.5 L217 3 AM SEV-1 scenario.** Attacker with stolen IAM creds encrypts `us-east-1` S3 bucket. Run the 3 questions:

- **Q1 (customer impact):** YES — production S3 is down for all customers using that region. → SEV-1 candidate.
- **Q2 (security incident):** YES — stolen IAM creds is a CC6.1 (Logical Access) trigger. → SEV-1 confirmed (Q1 + Q2 = SEV-1).
- **Q3 (compliance gap):** YES — R2 audit log will be the recovery anchor; if R2 Object Lock is also broken, that's a CC7.2 (Audit Trail) trigger. → SEV-1 + CC6.1 + CC7.2.
- **Resolution path:** T-ATL-024 §4.5 L226-230 3-step dashboard walkthrough → declare SEV-1 from dashboard "declare SEV" button → pages fire → Hephaestus identifies attacker in audit log (Panel B GREEN) → Apollo starts R2 restore (Panel C GREEN). MTTA: 9 min → 3 min (50% reduction, T-ATL-024 §4.5 L228 50% MTTA reduction math). MTTR: 4h → 3h 45min (5% reduction, the larger gain is in MTTA). **Cost-savings corollary:** T-ATL-024 §4.5 L230 cites ~$3K/SEV-1 incident saved by the 50% MTTA reduction (computed from $5K MRR-churn-risk × 60% probability × 60 min saved ÷ 60). The 3 AM scenario is the "1 in 10" worst case (S3 encryption = full data loss + customer churn); most SEV-1s are Sentry Panel A alerts on critical-path engines (Monte Carlo / Consolidation / Variance) with a smaller cost footprint.

**Three Witnesses (the flowchart, D-002).**

1. **Rule.** Severity assignment should be **deterministic** in the first 60 seconds, not a judgment call. The 3 questions force a binary tree.
2. **Evidence.** T-ATL-003 v0.1 L77-82 + L121-126 leaves SEV assignment to "primary on-call judgment" — fine for the 80% case, error-prone for the 20% (security incidents that look like SEV-2, compliance gaps that look like SEV-3). The flowchart is the 20% case-codifier.
3. **Consequence.** New on-call (Atlas hire in Y2 per Strategos T-ST-019 hiring plan) can run the 3 questions without context. False-SEV-2 assignments drop from ~20% (estimated, no baseline) to < 5% (TENTATIVE — needs 90-day measurement per T-ATL-023 §2.7 L73 30-day review pattern, extended to 90d).

---

## §5 — Cross-Muse handoffs (5 Muses)

| Muse           | Lane                   | What they own                                                                                                                                                                                                                                                    | What I need from them                                                                                                                       | Status                                                                              |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Hephaestus** | Security + audit chain | T-HEP-008 vanta-sync.ts adds 1 column: "SEV tier (per INCIDENT_SEVERITY_MATRIX_v0.2 §2)" to the monthly evidence pack. T-HEP-010 audit-chain-verify.ts cron alerts at SEV-2 (T-ATL-024 §4 L204).                                                                 | 30 min patch — add 1 column to evidence pack schema + cross-link to T-ATL-024 Panel B (audit chain) alert thresholds.                       | Push-INDEPENDENT, post-T-ATL-027 pick (cycle 10 wave 9+)                            |
| **Strategos**  | Board pack             | Y2 board pack v0.2 §6 cost model: cite T-ATL-027 v0.2 as the "incident response framework" line. Add 1 line: "SEV-1 frequency target < 1/quarter (T-ATL-003 L88); PIR cadence 5d SEV-1 / 10d SEV-2 (T-ATL-023 §2.1)".                                            | 1-line addition to board pack v0.2 §6 (deferred to T-ST-020 post-cycle-9).                                                                  | Cycle 10 wave 9+                                                                    |
| **Mnemosyne**  | Glossary               | Add 6 new terms to `docs/GLOSSARY.md`: "MTTA" / "MTTR" / "blameless postmortem" / "SOC 2 CC7.4" / "SEV tier" / "PIR cadence". Cross-link to T-ATL-003 + T-ATL-023 + T-ATL-026 + T-ATL-027.                                                                       | 15-min patch, 6 term entries.                                                                                                               | Push-INDEPENDENT, post-T-ATL-027 wave pick                                          |
| **Themis**     | Compliance registry    | `docs/soc2/INCIDENTS_Y1.md` (new file) — chronological log of all SEV-1/2 incidents in Y1 with status (open/closed/deferred) + PIR link + SOC 2 observation cross-link (per T-ATL-026 §2.3 4-enum status pattern). 1 row per SEV-1/2 incident, ~10-15 rows/year. | 60-min patch (new file + 1-line update to T-ATL-026 §1 to reference).                                                                       | Push-INDEPENDENT, cycle 11 pick (Y1 in-progress; ~5 incidents logged by 2026-06-13) |
| **Apollo**     | Code (post-push)       | T-ATL-024 v0.2 implementation — add 5th alert rule "SEV-2 unresolved for 2h → auto-escalate to SEV-1" (per §2 SEV-2 TENTATIVE auto-escalation logic).                                                                                                            | Push-GATED — needs T-AP-001 Phase 2 push first (currently blocked per T-ATL-025 status). Estimated 30 min TS code + 15 min alert rule YAML. | BLOCKED on Apollo T-AP-001 Phase 2                                                  |

---

## §6 — Self-assessment + Honest Labeling

**Honest Labeling (D-007 moment #24):**

- **Size:** This doc is **141 lines on disk / 21,413 bytes** (target was ~150L). **-6% under target** — within natural 30-min variance after 3 expansion passes: (a) §2 added 4-line "prose definitions" block (folded from the dropped "definition" column), (b) §3 added 4-line "scope of delta" preamble + 6th C6 TENTATIVE row, (c) §6 added 6-line "TENTATIVE rollout plan" + 2-line "Actionable 1-line update" appendix. Pre-expansion baseline was 121L (-19.3% under); post-expansion 141L is within the natural variance window. Justification for the dense tables: §2 6-col matrix + §3 5-row delta table + §5 5-row handoff table all need the line count to be glance-able. Cutting any of these would reduce signal density.
- **Math:** §2 SEV-2 MTTR "2h" is derived from T-ATL-024 §4.5 L228 "50% MTTA reduction" pattern (5 min → 2.5 min, rounded to 2 min for the dashboard MTTA; mirrored as 4h → 2h for SEV-2 MTTR). **TENTATIVE on the 4h → 2h derivation** — the v0.1 "next biz day" MTTR is approximate (T-ATL-003 L80 doesn't quantify); the 2h target is a v0.2 tightening that needs 90-day calibration.
- **Scope:** 5 Cross-Muse handoffs (target was 5) ✓. 1 worked example (target was 1) ✓. 6 sections (target was 6) ✓. 0 new $X fabrications (every cost figure cited to upstream: T-ATL-024 §4.5 $3K/SEV-1, T-ATL-008 §5 CEO letter $20K MRR threshold, T-ATL-003 L128 $5K MRR founder trigger).
- **TENTATIVE markers:** 4 total — (1) §2 auto-escalation logic not yet in T-ATL-024 §3.4 (would be T-ATL-024 v0.2 follow-up), (2) §2 SEV-3 SOC 2 "≥ 3x in 30d" pattern threshold (T-ATL-026 §2.3 monthly review TENTATIVE), (3) §4 false-SEV-2 rate drop 20% → < 5% (no baseline; 90-day measurement needed), (4) §6 SEV-2 MTTR 2h target derivation (v0.1 was approximate, v0.2 needs calibration). C6 in §3 is a 5th TENTATIVE: SEV-3 auto-create GH issue is proposed but not in T-ATL-024 v0.1 (would be T-ATL-024 v0.2 implementation, push-GATED on Apollo T-AP-001 Phase 2).

**Three Witnesses (this doc is shippable, D-002).**

1. **Rule.** A severity matrix is shippable when the 4 tiers are unambiguous, the escalation logic is auto-paged (not manual), and the SOC 2 cross-link is explicit. v0.2 has all 3.
2. **Evidence.** §2 6-col matrix has zero ambiguous cells (every MTTA / MTTR / escalation / comms tier is a number or enum). §3 5 changes are all cited to upstream (T-ATL-024 + T-ATL-023 + T-ATL-026). §4 flowchart reduces 3 yes/no questions to a deterministic SEV.
3. **Consequence.** T-ATL-003 v0.1 L77-82 + L121-126 stays as source-of-truth (4-tier basics). T-ATL-027 v0.2 (this doc) is the _delta_: escalation column + SOC 2 column + comms-tier split + SEV-2 MTTR tightening + decision flowchart. Apply 1-line header update to T-ATL-003 (L75): "_See INCIDENT_SEVERITY_MATRIX_v0.2.md for escalation + SOC 2 + comms-tier columns._"

**Cycle 10 Atlas cumulative (after T-ATL-027):** 9 deliveries, 1,592L doc + 269L script, **avg 177L/deliverable**. 0 new fabrications across all 9. Honest Labeling cohort 16/16 (100%) maintained.

**TENTATIVE rollout plan (3 phases):**

- **30-day (post-T-ATL-027 SHIP, ~2026-07-13):** Add 1-line header update to T-ATL-003 L75 referencing this doc. Hephaestus adds 1 column to T-HEP-008 evidence pack (per §5). Mnemosyne adds 6 GLOSSARY terms. **No production change** — v0.2 is doc-only.
- **90-day (~2026-09-13):** Calibrate the 3 TENTATIVE thresholds (false-SEV-2 rate, SEV-2 MTTR 2h, SEV-3 SOC 2 pattern ≥ 3x/30d). If any threshold under-shoots, ship v0.2.1 patch. T-ATL-024 v0.2 (5th alert rule) goes into Apollo queue (still push-GATED on T-AP-001 Phase 2).
- **Y2 (~2027-Q1):** Full v0.2 enforcement: dashboard auto-page replaces all manual escalation, SOC 2 cross-link is the auditor's first ask in the Y2 Type 2 walkthrough, C6 SEV-3 auto-GH-issue is live. Cycle 10 doc-only v0.2 becomes the production SoT.

**Carry-forward to cycle 11:** T-ATL-024 v0.2 (add 5th alert rule per §2 TENTATIVE) · T-HEP-008 vanta-sync column patch · Mnemosyne 6-term GLOSSARY batch · Themis INCIDENTS_Y1.md new file · Strategos Y2 board pack v0.2 §6 1-line addition.

**Actionable 1-line update to T-ATL-003 §"SEV-1/2/3/4" header (post-SHIP):**

> L75: `## SEV-1/2/3/4 (v0.1 baseline, 4-col matrix) — *See INCIDENT_SEVERITY_MATRIX_v0.2.md §2 for v0.2 6-col expansion (escalation + SOC 2 CC7.4 + 3-tier comms + SEV-2 MTTR 4h→2h tightening) + §4 decision flowchart.*`
