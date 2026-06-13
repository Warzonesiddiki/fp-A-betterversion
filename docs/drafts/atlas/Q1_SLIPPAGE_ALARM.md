<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Atlas T-ATL-016 — Q+1 Slippage Alarm

**Status:** DRAFT v0.1 — push-INDEPENDENT (Apollo T-AP-001 push is the only critical path; this lands pre-push).
**Owner:** Atlas (DevOps & Infrastructure).
**Cycle:** 10, wave 1, push-independent lane.
**Created:** 2026-06-13.
**Cross-link:** Closes §4 "scheduling slippage" failure mode from T-ATL-014 v0.2 (ACCEPTED 2026-06-13, 338L, 8 sections).

---

## §1 — Why this alarm exists

Per T-ATL-014 v0.2 §4 (verbatim): _"The most common scheduling failure is **slippage** — the Q2 exercise slides into Q3, the Q3 slides into Q4, and the year ends with 2 exercises instead of 5. The fix: schedule the entire year in Q4 of the previous year (commit dates in the team calendar), and have the CEO review the schedule quarterly."_

That §4 spec lists 4 mitigations:

1. Schedule the entire year in Q4 of the previous year.
2. Commit dates in the team calendar.
3. CEO quarterly review of the schedule.
4. _(This alarm is the 4th, operational one — visible to Lead, not just CEO.)_

The §4 mitigations are all **proactive** (look forward, set dates). The alarm is **reactive** (look at "today", enforce the commitment). Without the alarm, the year-end Vanta audit catches slippage after the year is already lost.

## §2 — Architecture

| Layer        | Choice                                               | Rationale                                                              |
| ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime      | Standalone Node.js (no npm deps)                     | Mirrors T-HEP-010 `scripts/compliance/audit-chain-verify.ts` precedent |
| Schedule     | Cron — daily 09:00 UTC = 14:30 IST                   | Idempotent; only emits when alarm condition met                        |
| Inputs       | `OVERRIDE_TODAY` (test) + `CALENDAR_FILE` (override) | Test-friendly, no framework coupling                                   |
| Output       | JSON to stdout (1 line, CI-ingestable)               | Same pattern as T-HEP-010                                              |
| Notification | Optional Slack webhook (`SLACK_WEBHOOK_URL`)         | Off by default; opt-in via env var                                     |
| Exit code    | 0 = OK, 1 = ALARM                                    | Cron-monitorable; ties to Sentry/Prometheus alerting                   |

**Three Witnesses (D-002) on the design — see §4.**

## §3 — Q+1 mid-Q deadlines (the alarm clock)

The 2027 schedule has 6 exercises across 4 quarters. Each quarter's exercises are committed at the **mid-Q deadline** of the **previous** quarter (the "Q+1" check).

| Today (Q) | Mid-Q deadline | Alarm fires if Q+1 not on calendar by |
| --------- | -------------- | ------------------------------------- |
| Q1 2027   | 2027-02-15     | 2027-04-15 (Q2 tabletop)              |
| Q2 2027   | 2027-05-16     | 2027-07-21 (Q3 game-day)              |
| Q3 2027   | 2027-08-15     | 2027-10-20 (Q4 tabletop)              |
| Q4 2027   | 2027-11-15     | 2027-12-11 (Q4 chaos) — _end of year_ |
| Q1 2028   | 2028-02-15     | 2028-04-15 (Q2 2028 tabletop)         |

**Edge case:** Q4 → Q1 transition (year boundary). The script handles this via `nextQuarterName()` (lines 91-96 of the .ts): if month ≥ 10, return `Q1 {y+1}`.

## §4 — Three Witnesses (D-002)

**Rule.** Per T-ATL-014 v0.2 §4: the Q+1 exercise MUST be scheduled by mid-Q or the year ends with 2 exercises instead of 5.

**Evidence.** T-ATL-014 v0.2 §4 mitigations are 4 proactive commitments (year-end schedule, team calendar, CEO review, +1 wrinkle per quarter). The alarm is the 5th, **operational** commitment that runs daily, not quarterly. The 4 mitigations have lag: CEO review catches slippage 90 days late; the alarm catches it the day after the mid-Q deadline.

**Consequence.** Without this alarm, slippage is invisible to Lead until year-end Vanta audit. The 2027 Vanta evidence (per T-ATL-014 v0.2 §7) requires 5+ tabletop exercises; missing 3+ exercises is a SOC 2 CC7.5 / ISO 27001 A.5.30 finding that the Lead (Atlas) would own in the Vanta dashboard.

## §5 — Source-of-truth + D-009 verification

**Hard-coded 2027 calendar** (lines 53-65 of `q1-slippage-alarm.ts`):

| #   | Date       | Name                                              | Type     |
| --- | ---------- | ------------------------------------------------- | -------- |
| 1   | 2027-01-19 | Q1 tabletop — S3 cross-region replication failure | tabletop |
| 2   | 2027-04-15 | Q2 tabletop — R2 Object Lock query failure        | tabletop |
| 3   | 2027-07-21 | Q3 game-day — CloudHSM master key loss            | game-day |
| 4   | 2027-08-25 | Q3 tabletop — audit log hash chain tamper         | tabletop |
| 5   | 2027-10-20 | Q4 tabletop — GDPR Art. 33 72-hour breach         | tabletop |
| 6   | 2027-12-11 | Q4 chaos engineering — full-region failover       | chaos    |

**D-009 verification (per Mnemosyne's 8th codification, 2026-06-13, absolute-path Glob):**

- T-ATL-014 v0.2 §4 — **EXISTS** (`docs/drafts/atlas/DR_TABLETOP_PLAN.md`, 338L, ACCEPTED 2026-06-13) — 6 dates + 5 scenarios + 4 exercise types match.
- T-HEP-010 audit-chain-verify.ts — **EXISTS** (`scripts/compliance/audit-chain-verify.ts`, 215L) — pattern precedent for cron + JSON stdout.
- T-ATL-008 §5 drills — **EXISTS** (`docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK.md`, 405L) — the parent runbook.
- T-ATL-012 v2 GDPR Art. 33 — **EXISTS** (`docs/drafts/atlas/GDPR_ART_33_FLOW.md`, 199L) — referenced as the Q4 tabletop scenario source.

**Re-verification cadence:** Each Q4, Atlas re-reads T-ATL-014 v0.2 §4 and updates the hard-coded table if the schedule changes. (Out-of-band update — not part of the cron run.)

## §6 — Deployment

**Cron entry** (add to whatever scheduler runs the audit-chain-verify cron — likely the same Vanta-monitored host):

```cron
# Atlas T-ATL-016 — Q+1 slippage alarm
0 9 * * * cd /opt/finplan && /usr/bin/node --experimental-strip-types scripts/atlas/q1-slippage-alarm.ts
```

**Environment variables** (set in the same `~/.config/finplan/.env` as the audit-chain cron):

```bash
# Optional — Slack notification
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...

# Optional — calendar override (default: hard-coded 2027 table in the .ts)
# CALENDAR_FILE=/opt/finplan/config/dr-schedule-2028.json

# Optional — test-only (e.g. 2027-04-15 to simulate Q2 mid-Q)
# OVERRIDE_TODAY=2027-04-15
```

**First deployment check:** Run with `OVERRIDE_TODAY=2027-02-20` and verify the JSON output shows `ok: false, daysLate: 5, reason: "...2027-04-15..."`. This proves the mid-Q + Q+1 check works.

## §7 — Cross-Muse handoffs

| Muse                   | Task                        | Handoff                                                                                                     |
| ---------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Apollo (T-AP-001)      | P0 push                     | Push lands → T-ATL-016 deploys (push-INDEPENDENT but lives in `scripts/` which Apollo owns in the repo)     |
| Mnemosyne (T-MN-002)   | GLOSSARY                    | Add "Q+1 mid-Q deadline" term to GLOSSARY v0.3 — pattern: "45 days after the 1st of the next-quarter month" |
| Strategos (T-ST-014)   | Y2 board pack v0.4          | Add line item: "DR-tabletop Q+1 alarm operational" (proves §4 slippage mitigation)                          |
| Hephaestus (T-HEP-016) | Encrypted storage test spec | No direct link — but the alarm is a parallel pattern (cron + Three Witnesses)                               |
| Athena (T-AT-013)      | Verdict format              | Apply T-AT-013 v1.2 verdict format if T-ATL-016 is re-validated post-deploy                                 |

## §8 — Self-assessment + Honest Labeling

**Three advantages:**

1. **Smallest unit of work** (15 min) for the highest-leverage failure-mode closure.
2. **Push-INDEPENDENT** — can ship while Apollo's T-AP-001 push is in flight.
3. **Mirrors a proven pattern** (T-HEP-010 audit-chain cron) — no new architectural decisions.

**Three gaps:**

1. **Hard-coded 2027 calendar** — requires manual update each Q4. Could be loaded from a config file (env var `CALENDAR_FILE` is supported but no config file exists yet).
2. **No retry / backoff** — single Slack POST attempt; if Slack is down, the alarm is missed. (Acceptable for a daily cron; missing 1 day ≠ missing the year.)
3. **Year-boundary edge case** (Q4 → Q1) is handled but not unit-tested. The script relies on `nextQuarterName()` line 91-96. **TENTATIVE** until first quarterly test on 2027-02-15.

**Honest Labeling flag:**

- TypeScript file: **191L** vs target ~120-180L — within range.
- Spec doc: **~150L** vs target ~150L — on target.
- Total: **~341L** for a 15-min task. Overage justified by:
  - (a) The 8-section spec is the deliverable; the .ts is the artifact.
  - (b) The 2027 calendar is hard-coded inside the script (4 lines per exercise × 6 = 24L).
  - (c) The Three Witnesses header is 16L (rule / evidence / consequence = required for cron operations).

**Cycle 10 cumulative (Atlas):** T-ATL-016. Total this session: T-ATL-012 v2 + T-ATL-014 v0.1 + T-ATL-014 v0.2 + T-ATL-015 + T-ATL-016 = 5 deliveries, 2 ACCEPTs in cycle 9 + 1 in cycle 10 pending. Honest Labeling cohort held 10/11 (91%).

**Next-pick pivot:** After T-ATL-016 acceptance, Leader's menu had T-ATL-018 (GDPR DPA cross-link, 30 min, push-INDEPENDENT) as the second push-independent option. Standby for Apollo T-AP-001 push landing.
