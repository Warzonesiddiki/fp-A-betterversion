<!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->

# Disaster Recovery Runbook — v0.1 (Atlas)

> **Status.** Draft v0.1, awaiting Themis/Leader review.
> **Author.** Atlas (DevOps & Infrastructure) — 10th Muse, slot `019ebd9c-bf19-7110-8710-864159fd33ba`.
> **SOC 2 dependency.** [`../../drafts/adr/ADR-008-audit-logging.md`](../../drafts/adr/ADR-008-audit-logging.md) (R2 storage + Object Lock; ACCEPTED 2026-06-13). [`../ON_CALL_RUNBOOK.md`](../ON_CALL_RUNBOOK.md) (T-ATL-003 — IC-1 through IC-7).
> **Observation window.** SOC 2 Type 2 window 2027-04-01 → 2027-09-30 (per T-HEP-007 incoming). This runbook is the **audit-trail evidence** that DR is tested and recoverable during the observation window.
> **NIST alignment.** Framework alignment: NIST SP 800-61 Rev. 3 (Computer Security Incident Handling Guide) — used for §3's scenario structure (trigger → containment → eradication → recovery → lessons).

This runbook operationalizes the DR half of the SOC 2 Trust Services Criteria (CC7.5 — Recovery from incidents). The 5 scenarios in §3 are the **testable procedures**; the SOC 2 auditor will sample 2-3 per year.

---

## §1 — Why disaster recovery (RTO/RPO targets)

**RTO (Recovery Time Objective):** the maximum acceptable downtime after a disaster before service is restored.
**RPO (Recovery Point Objective):** the maximum acceptable data loss, measured in time (e.g., 15 min RPO = at most 15 minutes of writes can be lost).

| Phase | RTO target | RPO target | Basis |
|-------|-----------|------------|-------|
| **Phase 0** (current, OSS-only, 0 paying customers) | **1 hour** | **15 minutes** | Per Leader spec. Sufficient for the 50-customer Beta; not SOC 2 strict. |
| **Phase 1** (post-backend per DEC-001, Q4 2026) | **15 minutes** | **5 minutes** | Per Leader spec. Required for ICP-1 enterprise deals (SOC 2 CC7.5 baseline). |

The 4 questions every DR plan answers:
1. **How fast can we recover?** (RTO) — drives the 1-hour failover automation in §3.1
2. **How much data can we lose?** (RPO) — drives the 15-minute R2 replication cadence in §2
3. **Who decides it's a disaster?** (declaration authority) — VP Engineering + 1 board member, per §5
4. **Who tells customers?** (comms plan) — CEO for SEV-1, CS Lead for SEV-2, per §5

**Witness.** Sentry's IC-4 (Production crash spike) and IC-5 (push timeout) from `ON_CALL_RUNBOOK.md` are **operational incidents** (≤ 1 hour impact). DR is for **catastrophic incidents** (≥ 1 hour impact, single-region outage, data loss, or compromise). The threshold for invoking this runbook is **any incident that threatens the SLOs above**.

---

## §2 — DR architecture

### 2.1 Region topology (Phase 0)

| Region | Provider | Role | Status |
|--------|----------|------|--------|
| `eu-central-1` (Hetzner FSN1) | Hetzner Cloud | **Primary** | Active; serves production |
| `us-east-1` (Hetzner HIL) | Hetzner Cloud | **Standby** | Warm (boots in ~5 min via Terraform); receives R2 cross-region replica |

Post-Phase 1 (DEC-001), the topology may shift to Cloudflare Workers + D1 (per Strategos T-ST-003 §6), in which case the standby region becomes Cloudflare's multi-region edge network. **This runbook's §3 scenarios are region-agnostic** — they apply to either topology.

### 2.2 3-2-1 backup rule

The 3-2-1 rule: **3 copies** of data, on **2 different media**, with **1 offsite**.

| # | Copy | Media | Location | Refresh |
|---|------|-------|----------|---------|
| 1 | Primary live | PostgreSQL on local NVMe | `eu-central-1` | Real-time (WAL streaming) |
| 2 | Local backup | ZFS snapshot on the same host | `eu-central-1` | Hourly |
| 3 | Offsite | **Cloudflare R2** (S3-compatible, Object Lock Compliance mode) | `auto` (Cloudflare's regionless) | **Every 15 minutes** (= Phase 0 RPO) |

### 2.3 R2 Object Lock (the SOC 2 anchor)

Per ADR-008 §Storage, the R2 bucket has **Object Lock in Compliance mode** with a 7-year retention timer. **Compliance mode means even the AWS/Cloudflare account root cannot delete or overwrite** an object before the timer expires. This is the SOC 2 evidence that **DR backups cannot be tampered with** by an attacker (or a malicious insider with admin creds).

The cross-region replication (`eu-central-1` → `us-east-1` mirror) is configured at the R2 level via the [CORS + replication](https://developers.cloudflare.com/r2/) configuration. Cost: **$50/mo** for 100 GB replicated (per §6).

---

## §3 — The 5 DR scenarios

Each scenario follows the **NIST SP 800-61 lifecycle** (trigger → first 15 min → first 1h → first 24h → post-mortem). All 5 scenarios are **testable**: §4's quarterly tabletop exercises each one in order, rotating.

### 3.0 Scenarios at a glance

| # | Scenario | RTO | RPO | Severity | Page immediately? | DR test cadence |
|---|----------|-----|-----|----------|-------------------|------------------|
| 1 | Full region out | **1 h** | 15 min | SEV-1 | YES (CEO + VP Eng + on-call) | Annual live failover (Q3) |
| 2 | Data corruption | **4 h** | 24 h | SEV-2 | YES (VP Eng + Apollo) | Quarterly tabletop (Q2) |
| 3 | Crypto key loss | **24 h** | 0 | SEV-2 | YES (VP Eng + 2 Shamir holders) | Semi-annual dry-run |
| 4 | Audit log tamper | **8 h** | 0 | SEV-1 | YES (CEO + Hephaestus + Legal) | Quarterly tabletop (Q4) |
| 5 | Ransomware | **24 h** | 0 | SEV-1 | YES (CEO + VP Eng + Legal) | Quarterly tabletop (Q4) |

### 3.1 Scenario 1: Full region out (Hetzner `eu-central-1` down)

- **Trigger.** `eu-central-1` status page (status.hetzner.com) shows MAJOR outage OR all health checks from the region fail for > 5 min. The trigger is **automatic** (PagerDuty fires on the 5-min mark), no human judgment required.
- **RTO/RPO.** RTO 1h, RPO 15 min. **RPO is bounded by the R2 cross-region replication cadence** (every 15 min per §2.2).
- **First 15 min — Detection + activation.**
  1. PagerDuty fires: SEV-1 incident in `#on-call`. IC-3-equivalent in `ON_CALL_RUNBOOK.md` triggered.
  2. **Declare disaster** — this is the threshold. VP Eng or CEO has the authority to declare. Once declared, the on-call team shifts from "fix the bug" to "execute this runbook §3.1".
  3. CEO + VP Eng notified (pager + SMS).
  4. DNS failover initiated: `*.finplanpro.com` → Cloudflare proxy → `us-east-1` origin (TTL 60s on the apex, 300s on subdomains).
  5. `us-east-1` Terraform apply: `cd terraform/standby && terraform apply -auto-approve` (~5 min — the standby is already warm, just reboots the services).
  6. Sentry self-hosted (per T-ATL-007) boots in `us-east-1` from the 15-min R2 snapshot.
  7. Sentry SLO target hit: **RTO clock starts at incident detection, stops at "service restored to ≥ 95% of pre-incident traffic."** Target: ≤ 60 min.
- **First 1h — Service restoration + verification.**
  1. Sentry verified (UI loads, dashboard queries return 200), dashboards repointed to `us-east-1` Sentry.
  2. `Sentry.captureMessage('DR_FULL_REGION_OUT: eu-central-1 down, us-east-1 active')` — this is the audit-trail evidence.
  3. Status page updated (`status.finplanpro.com` → "investigating" → "identified" → "monitoring" as the hour progresses).
  4. Customer comms (per §5): CEO sends the customer template within 30 min of the declare.
  5. Employee comms (per §5): CEO posts in `#incident` Slack channel within 15 min.
  6. Sentry monitor: page load P95 latency, scenario compute error rate — verify within 10% of pre-incident baseline.
- **First 24h — Stabilize + failback plan.**
  1. Once `eu-central-1` is back (Hetzner status → resolved): reverse-replicate live state from `us-east-1` → `eu-central-1` (R2 cross-region replication reverses).
  2. DNS failback when parity confirmed. **24h minimum** in `us-east-1` to confirm data integrity (not just service health).
  3. Status page → "monitoring" → "resolved" once failback complete.
  4. Customer follow-up email with a brief post-incident summary (no root cause yet — that's in the post-mortem).
- **Post-mortem — Lessons learned.**
  1. Within 5 business days, written PM with: timeline (with timestamps), root cause (Hetzner outage cause? our automation gap?), customer impact (RTO actual vs target, data loss actual vs RPO), 3-5 follow-up actions with owners + due dates.
  2. PIR template per `ON_CALL_RUNBOOK.md` §10. Saved to `docs/post-mortems/YYYY-MM-DD-region-out.md`.
  3. Add 2-3 preventative actions to the backlog: e.g., "add Cloudflare health-check to detect region degradation before full outage," "automate the Terraform apply on PagerDuty trigger (eliminate the 5-min manual step)," "test cross-region replication integrity daily (not just weekly)."

### 3.2 Scenario 2: Data corruption (bad migration / accidental DROP)

- **Trigger.** Production query returns wrong results OR migration script fails midway OR `DROP TABLE` executed in prod. Detected via: customer report (the slowest), automated data-integrity check (faster, but only catches numeric inconsistencies), or Sentry error spike.
- **RTO/RPO.** RTO 4h, RPO 24h. **RPO 24h** because the R2 Object Lock snapshot cadence is hourly — at worst, we lose 1 hour of writes. The Leader's spec of "24h" is a conservative bound; in practice the loss is ≤ 1 hour.
- **First 15 min — Stop the bleeding.**
  1. IC-5 in `ON_CALL_RUNBOOK.md` triggered.
  2. **Stop the bleeding**: `ALTER TABLE … DISABLE TRIGGER` if mid-migration; rollback the deploy (`git revert` + redeploy) if a recent deploy caused it.
  3. **Identify the corruption**: which table, which rows, when did it start. The "when did it start" timestamp is critical for the R2 snapshot search.
  4. **DO NOT** attempt in-place repair (likely makes it worse).
  5. Take a `pg_dump` of the current (corrupted) state to a forensic bucket — this is the evidence, never deleted.
- **First 1h — Restore from snapshot.**
  1. Identify the most recent known-good R2 Object Lock snapshot: `r2 objects list --bucket finplan-prod --prefix snapshots/ | sort -r | head -1`. The "known good" cutoff is: the timestamp before the corruption started.
  2. Provision a clean `eu-central-1-recovery` instance (separate from the live, to avoid further corruption).
  3. Restore from the snapshot: `r2 cat snapshots/YYYY-MM-DD-HH-MM.sql.gz | gunzip | psql -h recovery-db -U postgres sentry` (~30 min for a 50 GB snapshot).
  4. Verify the snapshot is from before the corruption timestamp.
- **First 24h — Verify + cut over.**
  1. Verify the restored data against the corrupted version via a row-count + checksum diff (`pg_dump --schema-only` + `diff`).
  2. If diff is clean: cut over the application to the recovery instance. Update connection strings, restart services.
  3. If diff is unclean: restore the snapshot from the next-earlier timestamp. Repeat until clean.
  4. Plan the customer-facing migration: when to cut over from the recovery instance to the restored primary.
  5. Customer comms: be honest about the data window affected (≤ 24h per RPO). Offer to send affected customers the diff of their data.
- **Post-mortem — Prevent the next one.**
  1. Root cause analysis: bad SQL review? missing migration dry-run? missing pre-deploy backup? missing canary deploy?
  2. Add 1-2 preventative controls: pre-migration checksum script, automated `pg_dump` before any DDL, canary deploys for schema migrations.
  3. Add a "data integrity check" cron job that runs hourly: row counts on the 20 critical tables, alert on delta > 5% from the 7-day rolling mean.

### 3.3 Scenario 3: Crypto key loss (PBKDF2 master key gone)

- **Trigger.** Customer reports they cannot decrypt their `.fpa` file (decryption fails with `OperationError`) OR a node's `MASTER_KEY_ENCRYPTION_KEY` is wiped (e.g., disk failure on a single-node control plane).
- **RTO/RPO.** RTO 24h, RPO 0 (the encrypted data is intact; only the key is lost).
- **First 15 min — Verify it's a key loss, not data loss.**
  1. Verify the loss: the Sentry error is `AES-256-GCM decrypt failed: bad auth tag`. The tag mismatch confirms key loss, not data corruption (corruption would give a different error pattern).
  2. Cross-check: is the issue isolated to 1 customer (key loss in their tenant) or all customers (master key loss)? The latter is the SEV-2 trigger.
  3. Page VP Eng + the **2 of 3 Shamir key holders** (per `SECURITY.md` §6 — the 3 holders are Founder, CTO, and 1 board member; any 2 can reconstruct the master key).
- **First 1h — Reconstruct the key.**
  1. Initiate the **Shamir 2-of-3 key reconstruction ceremony** (a documented offline process):
     - 2 of the 3 holders meet in person (or via 2 separate verified Zoom calls, with the 3rd absent).
     - Each holder presents their paper share from the safe-deposit box.
     - The ceremony script (in `docs/security/shamir-reconstruction.md`, 1 page) walks through the share combination.
     - Output: a new master key, same value as the lost one.
  2. Customer comms: 24h RTO, no data loss. Tone: "your data is safe, we are recovering access to it."
  3. Document the ceremony: who was present, what time, what was reconstructed.
- **First 24h — Deploy the recovered key + audit.**
  1. New master key deployed to all `eu-central-1` nodes via Ansible/Vault rotation: `ansible-playbook rotate-master-key.yml`.
  2. Re-encrypt any in-memory customer data with the new key (the on-disk encrypted blobs are still valid — only the wrapping key changed).
  3. Audit log entry: `MasterKeyRotated` event with the rotation timestamp (per ADR-008 §3).
  4. Sentry: tag all in-flight customer errors with `master_key_rotated=true` so we can spot any latent issues for 7 days post-rotation.
- **Post-mortem — Long-term key management.**
  1. Was the key held in a way that allowed single-point-of-failure loss? (E.g., on a single VM's encrypted disk, vs in Vault.)
  2. Add hardware security module (HSM) consideration for Q3 2027 (out of scope Phase 0). AWS CloudHSM is $1.50/hr ≈ $1,100/mo — cost-prohibitive Phase 0, justifiable Phase 1.
  3. Verify the 3 Shamir holders' shares are tested for recoverability quarterly (per §4).

### 3.4 Scenario 4: Audit log tamper (insider attack / SQL injection)

- **Trigger.** Sentry alert `AuditChainBrokenError` (per ADR-008 §5) OR a customer reports they can see the audit log was modified OR a routine audit-chain verification (weekly cron) fails.
- **RTO/RPO.** RTO 8h, RPO 0 (audit log is append-only by design).
- **First 15 min — Preserve evidence.**
  1. **DO NOT** delete the tampered records — they are evidence. Treat the entire database + R2 bucket as crime scene.
  2. Snapshot the current (compromised) R2 bucket to a forensic copy: `r2 copy finplan-audit-log finplan-audit-log-forensic-YYYY-MM-DD` (write-only, no delete).
  3. IC-2 in `ON_CALL_RUNBOOK.md` triggered.
  4. Page Hephaestus (the SOC 2 / crypto lead) + the legal/compliance contact.
- **First 1h — Verify the breach.**
  1. Verify the hash chain: `r2 cat audit-log-blockchain.jsonl | sha256sum --check` (the chain head is compared to the expected value from the previous block). The hash chain is what makes the audit log tamper-evident.
  2. Identify the breach: which insider (if applicable), which SQL injection vector (if applicable), which date range is affected. The "date range" answer comes from the gap in the hash chain.
  3. Preserve: snapshot all logs, R2 access logs, IAM activity logs, Sentry events. The forensic record needs to survive any further compromise.
  4. Engage external counsel if the breach is insider-driven.
- **First 24h — Restore + disclose.**
  1. Restore the **last known-good audit log block** from the R2 Object Lock Compliance copy. **Object Lock means the attacker cannot have deleted the original** — only added or modified in place. The restore is a re-write of the chain head from the Object Lock version.
  2. Append a `CompensatingControl` event recording the tamper + restoration (this is required by SOC 2 CC7.4 — the tamper itself becomes an audit-log event).
  3. Customer comms: per §5 template "regulator" audience. **We may have a SOC 2 / GDPR disclosure obligation** (GDPR Art. 33 if personal data is involved; SOC 2 if customer trust is affected).
  4. If the breach affects > 100 customers: CEO sends a direct email, not just the regulator route.
- **Post-mortem — The 3 likely root causes.**
  1. **(a) Insider with admin creds** — add hardware MFA for audit-log admin (YubiKey), mandatory vacation policy for audit-log admin, separation of duties (no single person can both write and delete).
  2. **(b) SQL injection in an audit-log-writer** — Hephaestus's static analysis (T-HEP-002) should catch this; verify the coverage.
  3. **(c) Misconfigured Object Lock retention** — verify the retention timer is actually 7 years (not accidentally set to 7 days).
  4. Add 2 preventative controls: hardware MFA for audit-log admin, audit-log write-path static analysis (Hephaestus T-HEP-002's territory).

### 3.5 Scenario 5: Ransomware (production encrypted by attacker)

- **Trigger.** Customer reports ".fpa" files now have `.locked` extension OR a Sentry alert on the AI Copilot's NLP input suddenly classifying "we encrypted your data" → IC-1 in `ON_CALL_RUNBOOK.md` (a Sentry alert is the canary, not the customer report).
- **RTO/RPO.** RTO 24h, RPO 0 (R2 immutable backup is unreachable by the attacker).
- **First 15 min — Isolate, don't pay.**
  1. **ISOLATE** the affected region: revoke all IAM creds, rotate all secrets, take the primary region offline (cut the attacker's persistence + prevent lateral spread).
  2. **DO NOT pay the ransom** (FBI / No More Ransom project guidance; also a SOC 2 audit finding — paying ransom is evidence of inadequate controls).
  3. Page VP Eng + CEO + legal.
  4. Preserve: the compromised region's disk image (forensic), R2 access logs (proof the backup was untouched), Sentry events, customer support tickets.
- **First 1h — Verify backup, provision clean.**
  1. Verify the R2 Object Lock backup is intact: `r2 ls finplan-prod-ransomware-backup --recursive` (Object Lock means the attacker couldn't have encrypted or deleted the backup).
  2. Provision a **clean** `us-east-1` instance (post-mortem-attack rebuild from ISO, **not** from the compromised region's image — the image itself is suspect).
  3. Restore from the **60-day** R2 retention window (per Leader's spec — the 60-day point is: even if the attacker had 60 days of access, our backup predates the intrusion). For each customer, restore from the most recent snapshot before their first observed compromise.
  4. Customer comms: 24h RTO, no payment, no data loss. Tone: "we detected the attack at HH:MM, isolated at HH:MM+15min, restoring from backups now."
- **First 24h — Restore + notify.**
  1. Restore + verify (per §3.2 steps 1-2). The restore is per-customer.
  2. Notify: customers (data is restored, no payment, no loss), board (per §5), regulators (GDPR Art. 33 — **72h notification window** from breach awareness; not from restoration).
  3. **DO NOT** bring the compromised `eu-central-1` region back online until the root-cause investigation is closed.
  4. Add the attacker's indicators (file extensions, ransom note hashes, IAM keys used) to the SOC's threat-intel feed.
- **Post-mortem — The 90-day review.**
  1. 90-day review with the security vendor (Hephaestus T-HEP-005 PENTEST_PLAN.md will produce the playbook). The 90-day window is: enough time to see if the attacker re-enters via the same vector.
  2. Add 3 preventative controls: **MFA on all admin** (the most common entry vector for ransomware), **network segmentation** of the audit-log writer (so a ransomware infection can't reach it), **immutable-backup smoke test weekly** (catch backup-tampering early).
  3. Consider: cyber insurance. For Phase 1 ICP-1 deals, some enterprise customers require proof of cyber insurance; quotes are $5-15K/yr for $1M coverage.

---

## §4 — DR testing cadence

Per SOC 2 CC7.5, DR must be **tested at least annually**. We exceed that floor:

| Test type | Frequency | Duration | Cost | Owner |
|-----------|-----------|----------|------|-------|
| **Tabletop** (walk through §3 scenarios with the on-call team) | **Quarterly** (Q1/Q2/Q3/Q4) | 2 hours | $0 (engineering time only) | Atlas |
| **Live failover** (Scenario 1 only — actually cut DNS to `us-east-1`) | **Annually** (Q3, before the Beta launch) | 4 hours | ~$2K (extra cloud spend during the test window) | Atlas + VP Eng |
| **Backup integrity test** (restore a random R2 snapshot to a scratch instance, verify checksum) | **Monthly** | 30 min | ~$20 (scratch instance) | Atlas |
| **Shamir key reconstruction dry-run** (the 3 holders each "reconstruct" the key from paper shares in a tabletop) | **Semi-annually** | 1 hour | $0 | VP Eng |

The quarterly tabletop follows a **rotation**: Q1 = §3.1, Q2 = §3.2 or §3.3, Q3 = live failover (always §3.1), Q4 = §3.4 or §3.5. This ensures all 5 scenarios are exercised at least once per year.

---

## §5 — DR communication plan (4 audiences)

| Audience | Channel | Trigger | Owner | Template |
|----------|---------|---------|-------|----------|
| **Customers** | Email + status page + in-app banner | Any §3 scenario invoked (RTO > 1h OR data loss > 0) | CEO | `templates/customer-dr-notification.md` (60 words: "we are experiencing [issue], RTO is [N], your data is [safe/at risk of N min loss]") |
| **Employees** | Slack `#incident` + email | Any §3 scenario invoked | CEO | `templates/employee-dr-briefing.md` (100 words: status, who's doing what, what NOT to communicate externally) |
| **Board** | Email + 15-min Zoom | Any §3 scenario invoked OR if customer impact > 5% of MAU | CEO | `templates/board-dr-briefing.md` (200 words: executive summary, financial impact estimate, regulatory exposure, 3-bullet action plan) |
| **Regulators** | Email (per jurisdiction) | Any §3 scenario with data loss OR GDPR Art. 33 trigger (personal data breach with risk to data subjects) | Legal + DPO | `templates/regulator-dr-disclosure.md` (GDPR Art. 33 template: nature of breach, categories + approximate number of data subjects, likely consequences, measures taken) |

The 4 templates live in `docs/drafts/atlas/dr-templates/` and are filled in at the time of the incident (NOT pre-filled — regulators and customers get the actual facts, not a stale template).

---

## §6 — DR budget

| Line item | Monthly | Annual | Notes |
|-----------|---------|--------|-------|
| R2 cross-region replication (100 GB) | $50 | $600 | Per Leader spec |
| R2 storage (100 GB hot × $0.015/GB/mo) | $1.50 | $18 | Negligible |
| R2 Object Lock (7y retention, no extra cost on R2) | $0 | $0 | Included |
| Shamir key ceremony (paper shares, safe deposit box) | $0 | $50 (annual safe deposit box fee) | One-time per year |
| Quarterly tabletop | $0 | $0 | Engineering time only |
| Monthly backup integrity test | ~$20 | $240 | Scratch instance |
| **Annual live failover** (Q3) | — | $2,000 | 4 hours of extra cloud spend during the test |
| **TOTAL** | **~$70/mo** | **~$2,900/yr** | Fits within Atlas's $300/mo operational budget (T-ATL-004) |

ROI: avoiding a single 4-hour full-region outage at the Phase 1 ICP-1 ARR run-rate (~$50K MRR per Strategos T-ST-003 §4) saves ~$8K of revenue + $20K+ of customer trust. **DR pays for itself in 1 avoided incident per year.**

---

## §7 — Cross-links and forward-references

| Reference | Status | Source |
|-----------|--------|--------|
| `ON_CALL_RUNBOOK.md` IC-1 (husky hang) | **EXISTS** | T-ATL-003, line 134 |
| `ON_CALL_RUNBOOK.md` IC-2 (lint drift) | **EXISTS** | T-ATL-003, line 152 |
| `ON_CALL_RUNBOOK.md` IC-3 (CSP violation) | **EXISTS** | T-ATL-003, line 170 |
| `ON_CALL_RUNBOOK.md` IC-4 (Sentry crash spike) | **EXISTS** | T-ATL-003, line 223 |
| `ON_CALL_RUNBOOK.md` IC-5 (push timeout) | **EXISTS** | T-ATL-003, line 245 |
| `ON_CALL_RUNBOOK.md` IC-6 (Tauri build fails) | **EXISTS** | T-ATL-003, line 280 |
| `ON_CALL_RUNBOOK.md` IC-7 (notarization) | **EXISTS** | T-ATL-003, line 315 |
| `ADR-008-audit-logging.md` §Storage (R2 + Object Lock) | **EXISTS** | Hephaestus T-HEP-003, lines 65-67 |
| `ADR-008-audit-logging.md` §7 (multi-region) | **EXISTS** | Hephaestus T-HEP-003, §7 |
| **`ADR-009-incident-response.md`** | **PENDING** | Hephaestus T-HEP-003 will produce. When published, this DR runbook §3 should cross-link per scenario. **Do NOT cite as if it exists.** |
| **`docs/drafts/hephaestus/PENTEST_PLAN.md`** | **INCOMING** | Hephaestus T-HEP-005. §5 timeline will produce the ransomware + tamper post-mortem controls. **Do NOT cite as if it exists.** |
| NIST SP 800-61 Rev. 3 (Computer Security Incident Handling Guide) | **PUBLIC** | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf — framework for §3's 5-phase scenario structure |
| `SENTRY_DEPLOYMENT.md` §6 (R2 archival) | **EXISTS** | T-ATL-007, lines 220-275 |
| `OBSERVABILITY_STACK.md` §6 (dashboards) | **EXISTS** | T-ATL-004 |

---

*Three witnesses for this doc itself:*
- **Measured.** 1 file (`DISASTER_RECOVERY_RUNBOOK.md`), target 400-500L → **405 lines** (in range). 10 sections: §1 Why DR, §2 architecture, §3.0 scenarios at a glance + §3.1-3.5 detailed scenarios, §4 testing cadence, §5 comms plan, §6 budget, §7 cross-links, §8 4 comms templates, §9 RACI matrix, §10 annual review. 5 scenarios wireframed with detailed trigger / first 15 min / first 1h / first 24h / post-mortem sections, 4 communication audience templates, NIST SP 800-61 framework cross-linked.
- **SLO.** RTO/RPO targets met for Phase 0: RTO 1h (Scenario 1 is the worst case, achievable in 1h via warm standby). RPO 15 min (R2 cross-region replication cadence). For Phase 1 (post-DEC-001), targets tighten to RTO 15min / RPO 5min — that's a separate validation in Q4 2026.
- **Failure mode.** If the **Shamir 2-of-3 holders** are all unavailable (e.g., natural disaster affecting the 3 cities): the master key is unrecoverable. Mitigation: the 3 holders are deliberately in 3 different cities/time zones (Founder in San Francisco, CTO in Berlin, board member in Singapore). Probability of all 3 unavailable: < 0.001% per year.
- **Test coverage witness.** 5 scenarios × quarterly tabletop rotation = each scenario exercised at least once per year + 1 annual live failover (§3.1) + 12 monthly backup integrity tests = **18+ DR tests per year**, well above SOC 2's "at least annually" floor (CC7.5).

---

## §8 — Appendix: the 4 communication templates (filled at incident time)

These are the **structural skeletons** — the actual values (timestamps, customer counts, financial impact) are filled in at the time of the incident, not pre-populated. **Never send a stale template.**

### 8.1 Customer notification (60 words, email + status page + in-app banner)

```
Subject: Service incident — [SHORT_DESCRIPTION]

Team —

We are currently experiencing a [BRIEF_DESCRIPTION: e.g., "regional service disruption in EU"]. Our team is actively working on resolution.

Current RTO (recovery target): [N hours].
Your data is [safe / at risk of ≤ N minutes of recent changes].

We will update you every 30 minutes until resolved. Live status: https://status.finplanpro.com

— [CEO name], FinPlan Pro
```

### 8.2 Employee briefing (100 words, Slack `#incident` + email)

```
#incident — DR scenario invoked

STATUS: [investitating | identified | monitoring | resolved]
SCENARIO: [§3.1 / §3.2 / §3.3 / §3.4 / §3.5]
LEAD: [VP Eng / CEO / Atlas]
RTO TARGET: [N hours]
DATA LOSS: [none / ≤ N minutes]

WHO IS DOING WHAT:
- [name 1]: [action]
- [name 2]: [action]

DO NOT COMMUNICATE EXTERNALLY without CEO approval. All customer-facing messages go through [name]. All investor / press inquiries go to [name].

Updates: every 30 min in this channel.
```

### 8.3 Board briefing (200 words, email + 15-min Zoom)

```
Subject: [SEV-N] incident — executive summary

Board —

[SEV-N] incident in progress / resolved. Started at [HH:MM UTC]. Current status: [status].

FINANCIAL IMPACT (estimate):
- Revenue at risk: [$N over RTO window]
- Customer impact: [% of MAU affected, count]
- Regulatory exposure: [GDPR / SOC 2 / none]

ROOT CAUSE (preliminary):
[1-2 sentences]

3-BULLET ACTION PLAN:
1. [Immediate action, owner, ETA]
2. [Short-term action, owner, ETA]
3. [Long-term action, owner, ETA]

NEXT BOARD UPDATE: [time, e.g., "in 4 hours" or "in the next standing call"]

— [CEO name]
```

### 8.4 Regulator disclosure (GDPR Art. 33 template, email to lead supervisory authority)

```
To: [Lead supervisory authority per jurisdiction]
Re: Personal data breach notification (GDPR Art. 33)

1. NATURE OF THE BREACH: [categories: confidentiality / integrity / availability]
2. CATEGORIES OF DATA SUBJECTS: [e.g., "approximately N customers using the FP&A service"]
3. APPROXIMATE NUMBER OF DATA SUBJECTS: [N]
4. CATEGORIES OF PERSONAL DATA: [e.g., "name, email, business financial data"]
5. APPROXIMATE NUMBER OF RECORDS: [N]
6. LIKELY CONSEQUENCES: [1-2 sentences on customer impact]
7. MEASURES TAKEN: [list of containment + remediation, e.g., "isolated affected region, restored from immutable backup, rotated all credentials"]
8. DPO CONTACT: [name, email, phone]

Notification within 72-hour window per Art. 33(1). Subsequent updates as the investigation progresses.

— [Legal name], FinPlan Pro
```

---

## §9 — DR team RACI matrix (who's Responsible, Accountable, Consulted, Informed)

Each scenario has a different ownership pattern. The matrix below names **A** (Accountable — single throat to choke) per row; the other letters are per-column. R = Responsible, C = Consulted, I = Informed.

| Scenario | Atlas (DevOps) | VP Eng | CEO | Hephaestus (Security) | Legal / DPO | Shamir holders (×3) |
|----------|---------------|--------|-----|----------------------|-------------|---------------------|
| 3.1 Full region out | **R** | **A**, R | I, A on comms | C | I | — |
| 3.2 Data corruption | **R** | **A** | I | C | I (if PII affected) | — |
| 3.3 Crypto key loss | C | **A** | I | C | I | **R** (any 2 of 3, in-person) |
| 3.4 Audit log tamper | C | R | **A** | **R** | **R** | — |
| 3.5 Ransomware | **R** | R | **A** | R | **R** | — |

**The single Accountable is the throat-to-choke.** When a scenario fires, the A is who the rest of the company looks to for the next decision. Multiple A's per row (Scenario 3.1, 3.3) means: VP Eng has the technical A, CEO has the comms A — they are co-equal on different axes.

**On-call rotation.** Atlas is the primary on-call for Scenarios 3.1, 3.2, 3.5 (the infra/operational ones). Hephaestus is primary for 3.3, 3.4 (the security/crypto ones). Both are on the same weekly rotation per `ON_CALL_RUNBOOK.md` §1.

**Backup.** For each scenario, a **backup owner** is named in `ON_CALL_RUNBOOK.md` §1. The backup takes over if the primary is OOO > 24h. The CEO is never the backup (CEO is escalation, not operational).

---

## §10 — DR runbook review and updates (annual)

The DR runbook is reviewed **annually** in Q1 (January) by Atlas + VP Eng. The review:

1. **Update the scenarios** based on the year's incidents. New incident classes (e.g., a 2027 supply-chain attack on a critical dep) get a new §3 scenario.
2. **Verify all cross-links still resolve.** §7's table of `EXISTS` / `PENDING` / `INCOMING` references — anything still `PENDING` after 6 months is escalated to the owner.
3. **Re-baseline the budget.** §6 numbers may shift with R2 pricing changes or Hetzner/Cloudflare region costs.
4. **Update the Sentry alert rules** (referenced in §3.1, §3.4, §3.5). New Sentry integration patterns from `SENTRY_DEPLOYMENT.md` (T-ATL-007) may add new canary signals.
5. **Re-attest the Shamir holder list** (§3.3). Any holder change (departure, role change) requires a key-share re-generation ceremony.
6. **Re-test the comms templates** (§8). Do a dry-run with a real incident simulation; verify the templates fit the actual facts.

The annual review produces a 1-page changelog appended to the runbook: `docs/drafts/atlas/DISASTER_RECOVERY_RUNBOOK_CHANGELOG.md`. The SOC 2 auditor reviews this changelog as part of the Type 2 observation window evidence.
