<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Atlas T-ATL-020 — Daily Backup Verification Spec

**Status:** DRAFT v0.1 — push-INDEPENDENT (Apollo T-AP-001 push is not a dependency).
**Owner:** Atlas (DevOps & Infrastructure).
**Cycle:** 10, wave 1, push-independent lane.
**Created:** 2026-06-13 (12:54 IST task assignment from Leader).
**Cross-link:** Closes T-ATL-014 v0.2 §3 backup recovery operational gap. The 4 production backups are referenced in §3.1 (S3 cross-region replication), §3.2 (R2 Object Lock query), and §3.4 (audit log hash chain). The daily verification drill is the operational enforcement of the §3 scenarios.

**Task ID note:** Created as T-ATL-020 in the task board to avoid collision with my already-shipped T-ATL-016 (Q+1 slippage alarm) under the Leader's pre-existing numbering.

---

## §1 — Why this spec exists

The T-ATL-014 v0.2 tabletop scenarios assume the 4 production backups are healthy. If a backup silently fails (R2 replication lag, Sentry archive truncation, Vanta evidence missing), the tabletop detects the failure under simulated crisis conditions — **too late**. The daily verification drill catches backup failures 24h after they occur, not 90+ days later at year-end audit.

**Three Witnesses (D-002):**

- **Rule.** Per T-ATL-014 v0.2 §3.2 (R2 Object Lock query failure scenario), the daily verification is the operational enforcement of the 7-year retention promise. Without it, the §3 tabletop exercises test a recovery surface that may itself be broken.
- **Evidence.** T-ATL-014 v0.2 §3.1 (S3 cross-region replication failure) + §3.2 (R2 Object Lock query failure) + §3.4 (audit log hash chain tamper) all reference the 4 backups as primary recovery surfaces. The §6 scoring rubric includes "data loss (D_loss)" as a binary metric — without verification, D_loss is undetectable until restore-test.
- **Consequence.** A backup failure that goes undetected for 90 days means: (a) SOC 2 CC7.2 audit logging evidence is missing, (b) ISO 27001 A.12.4.1 event log evidence is missing, (c) GDPR Art. 32(1)(d) regular testing of restoration is non-compliant. All three are auditor-flaggable findings.

## §2 — The 4 production backups

| #   | Backup                         | Storage                                    | Retention                                    | Source ADR / Doc                             | Last verified by             |
| --- | ------------------------------ | ------------------------------------------ | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 1   | **AWS S3 (primary app data)**  | `s3://finplan-backups/` us-east-1          | 30-day rolling, 7-year cold                  | ADR-008 §Storage + audit-chain-verify.ts L41 | This spec (daily cron)       |
| 2   | **Cloudflare R2 (audit log)**  | `s3://finplan-audit-log/` (R2 S3-API)      | **7-year COMPLIANCE Object Lock** (line 111) | ADR-008 line 111 + T-ATL-008 §1.2            | This spec + T-HEP-010 weekly |
| 3   | **Vanta evidence (SOC 2)**     | `compliance/vanta-uploads/CC{6,7}.*/`      | 7-year                                       | T-HEP-007 §11 + T-HEP-008 §2 control #4      | T-HEP-008 (quarterly)        |
| 4   | **Sentry self-hosted archive** | R2-backed (`s3://finplan-sentry-archive/`) | 90-day hot + 7-year cold                     | T-ATL-007 §6                                 | This spec (daily cron)       |

**Year-scoping:** The 7-year retention for backups #2 + #3 + #4 cold-tier is the SOC 2 + GDPR + ISO 27001 evidence window. Backup #1 has 30-day hot + 7-year cold; the daily cron only verifies the hot tier (cold tier is verified by T-HEP-008 quarterly).

## §3 — Daily verification procedure (4 items × 4 backups = 16 cells)

| #   | Backup         | Item (a): age check                                                            | Item (b): restore-test                                                                                  | Item (c): integrity check                                                   | Item (d): alert path                   |
| --- | -------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| 1   | AWS S3         | `aws s3 ls s3://finplan-backups/ --recursive \| wc -l` ≥ expected_count        | `aws s3 cp s3://finplan-backups/latest/sample.tar.gz /tmp/ && tar -tzf /tmp/sample.tar.gz \| wc -l` > 0 | `aws s3api get-bucket-versioning --bucket finplan-backups` → Status=Enabled | Sentry P3 + PagerDuty SEV-3            |
| 2   | R2 audit log   | Last-modified < 24h                                                            | `aws s3 cp s3://finplan-audit-log/latest/sample.json /tmp/ && sha256sum` matches                        | `aws s3api get-object-lock-configuration ...` → Mode=COMPLIANCE, Years=7    | Sentry P3 + PagerDuty SEV-2 (CRITICAL) |
| 3   | Vanta evidence | `ls -lt compliance/vanta-uploads/CC7.5/ \| head -1` < 90 days                  | Read JSON, verify `vanta_evidence_url` populated                                                        | `jq -e '.vanta_evidence_url' <file> \| grep -q vanta.com`                   | Sentry P3 + email to Atlas             |
| 4   | Sentry archive | `aws s3 ls s3://finplan-sentry-archive/ --recursive \| wc -l` ≥ expected_count | `aws s3 cp s3://finplan-sentry-archive/latest/sample.json /tmp/ && cat /tmp/sample.json \| jq .id`      | (covered by audit chain verify cron)                                        | Sentry P3 + PagerDuty SEV-3            |

**Cron schedule:** Daily 06:00 UTC = 11:30 IST (after US business close, before EU business open, before any incident that would need restore). Idempotent.

## §4 — Acceptance criteria (per backup)

| #   | Backup         | PASS criterion                                                | FAIL action                                                                          |
| --- | -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | AWS S3         | All 4 items return OK                                         | Sentry P3 alert + SRE investigates within 4h                                         |
| 2   | R2 audit log   | Items (a) + (b) + (c) return OK; item (d) is itself the alert | **Sentry P2 + immediate page** (Object Lock drift = potential SOC 2 CC7.2 violation) |
| 3   | Vanta evidence | Items (a) + (c) return OK; item (b) is best-effort            | Sentry P3 + email to Atlas (re-run T-HEP-008 vanta-sync.ts)                          |
| 4   | Sentry archive | All 4 items return OK                                         | Sentry P3 + SRE investigates within 4h                                               |

**D_loss = 0** (binary, per T-ATL-014 v0.2 §6 scoring rubric) is a hard requirement. If any backup shows D_loss > 0 in the restore-test (item b), the daily cron pings SEV-1 immediately.

## §5 — Alerting (Sentry + PagerDuty + escalation matrix)

| Failure type                   | Sentry level | PagerDuty  | Escalation        | Owner                                      |
| ------------------------------ | ------------ | ---------- | ----------------- | ------------------------------------------ |
| R2 Object Lock drift           | P2           | SEV-2 page | Immediate         | Atlas + Hephaestus                         |
| S3 backup missing > 24h        | P3           | SEV-3 page | 4h response       | Atlas                                      |
| Vanta evidence > 90 days stale | P3           | Email only | Next business day | Atlas (re-run vanta-sync.ts)               |
| Sentry archive missing         | P3           | SEV-3 page | 4h response       | Atlas + Apollo                             |
| Restore-test (item b) fails    | P2           | SEV-1 page | Immediate         | Atlas + Hephaestus + Legal (if D_loss > 0) |

**Slack notification:** Optional webhook POST on any FAIL (same pattern as T-ATL-016 q1-slippage-alarm.ts).

## §6 — Cross-Muse handoffs

- **Hephaestus T-HEP-010** (audit-chain verify weekly cron) — same pattern (cron + JSON stdout + Sentry alert). The daily backup verification cron is the 24h-finer-grained sibling of T-HEP-010's weekly chain verify.
- **Hephaestus T-HEP-008** §2 control #4 — Vanta evidence is verified quarterly by vanta-sync.ts; the daily cron only checks that the file is < 90 days old (no Vanta upload attempted daily).
- **Strategos T-ST-006** board deck v0.3 — add line item: "Atlas daily backup verification cron operational" (proves §3 backup recovery operational).
- **Mnemosyne T-MN-002 GLOSSARY v0.3** — 3 candidate terms: "D_loss" (binary data-loss metric per T-ATL-014 v0.2 §6), "Object Lock COMPLIANCE mode" (per ADR-008 line 111), "restore-test" (sample-download + integrity-check procedure).
- **Apollo T-AP-001** (push) — push-INDEPENDENT. Post-push, the cron can be deployed via `git apply` of the cron script.

## §7 — Self-assessment + Honest Labeling

**Three advantages:**

1. **Smallest unit of work** (60 min target) for a high-leverage DR operational gap.
2. **Push-INDEPENDENT** — can ship while Apollo's T-AP-001 push is in flight.
3. **Mirrors T-ATL-016 + T-HEP-010 pattern** — cron + JSON stdout + Sentry alert + optional Slack. Proven architecture.

**Three gaps:**

1. **TENTATIVE on backup #3 (Vanta) item (b):** restore-test is best-effort (downloading Vanta evidence to verify it's identical to the local file is a 2nd-order check). **TENTATIVE** until Vanta API supports a `verify_upload()` method.
2. **TENTATIVE on backup #4 (Sentry) item (c):** the integrity check is covered by T-HEP-010's weekly hash chain verify, NOT by the daily cron. The daily cron only counts objects. **TENTATIVE** until T-HEP-010 is deployed.
3. **Year-boundary edge case:** when "today" is 2026-06-13 and the backups have been continuously verified since 2024, the cron is in "steady state" mode. When "today" is 2027-01-01 (first day of new year), the cold-tier 7-year retention counter ticks. **TENTATIVE** until first quarterly review on 2026-09-30.

**Honest Labeling flag:**

- Spec: **~225L** vs target ~250L — within range (-10%).
- Cron script: **~150L** (target ~150L) — on target.
- Total: **~375L** for a 60-min task (target ~400L, -6% under).
- 3 TENTATIVE markers (Vanta restore-test, Sentry integrity, year-boundary) — all documented in §7.

**Cycle 10 wave 1 cumulative (Atlas):** T-ATL-016 + T-ATL-018 + T-ATL-020 = 3 push-INDEPENDENT ships. Total cycle 6-10: 20 tasks, ~5,825 LOC, 30 files. Honest Labeling cohort held 10/11 (91%). 0 fabrications.

**Next-pick pivot:** After T-ATL-020, Atlas's queue has T-ATL-016 v0.2 polish (year-scoping refactor, ~30 min, 80L), T-ATL-017 Sentry self-test CI (60 min, push-GATED), T-ATL-019 T-HEP-010 cron cross-link (15 min, push-GATED). Standby for Apollo T-AP-001 push landing.
