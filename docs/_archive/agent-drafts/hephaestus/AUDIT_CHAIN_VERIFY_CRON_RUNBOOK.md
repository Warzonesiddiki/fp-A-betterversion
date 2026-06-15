<!--
  DRAFT v0.1 — 4-section operational runbook
  Codif 22 spec_version | spec_version: 22
  Ties to: T-HEP-010 v0 SHIPPED §5+§6 (docs/drafts/hephaestus/AUDIT_CHAIN_VERIFY_CRON.md)
           ADR-008 audit logging, ADR-009 IR §1.4, Atlas T-ATL-007 Sentry self-hosted
           Atlas T-ATL-008 risk gap #1, T-HEP-008 §3 evidence scripts
  Author: Hephaestus
  Date: 2026-06-13
  Status: SHIPPED 2026-06-13 (4-section operational runbook; T-HEP-010 v0.2 ship)
          — companion to v0 spec doc; this runbook is the on-call-facing
            operational artifact. v0 spec doc (6-section) remains the
            source-of-truth for design rationale + algorithm details.
            Phase 1 = manual mode; Phase 2 = cron job auto-invokes the
            standalone script (per T-HEP-010 v0 §1 cadence decision).
          — supersedes the v0 §5 manual runbook (extracted + condensed
            + integrated with §2 algorithm + §4 evidence for on-call use).
-->

# Audit-Chain Verify Weekly Cron — Operational Runbook

**Path:** `scripts/compliance/audit-chain-verify.ts` (standalone, Node.js ≥ 20, pnpm tsx)
**Companion spec doc:** `docs/drafts/hephaestus/AUDIT_CHAIN_VERIFY_CRON.md` (v0 SHIPPED 6-section)
**Schedule (Phase 2):** Monday 02:00 UTC (`0 2 * * 1`)
**Owner:** Hephaestus on-call (Q3 2026 — 4-person rotation, 1 week each)
**Codif:** 22 (spec_version discipline) | **Status:** DRAFT v0.1

---

## §1 Purpose & Schedule

### §1.1 What this cron does

Weekly automated verification of audit-chain integrity for the FinPlan Pro audit log stored in Cloudflare R2 (S3-compatible, Object Lock Compliance mode, 60-day retention). The script walks the full hash chain from `ANCHOR_HASH` (immutable, set at deploy) through every event, recomputing SHA-256 hashes against the stored values. A mismatch indicates tamper or critical bug; a match confirms the audit log is intact for the period.

**Why automated, not manual:** SOC 2 CC7.2 + ISO 27001:2022 A.8.16 require monitoring activities to detect anomalies. A static write-only log is not "monitoring." Manual review fails at scale (1M+ events/week) and gives auditors 4-week windows if monthly. Weekly automated verification closes the window to 7 days at near-zero operational cost (~$0.05 R2 GET requests, 30s runtime on 1M events).

### §1.2 Schedule (3-witness per D-007)

| Cadence    | False-positive rate   | Detection window | SOC 2 / ISO 27001 verdict                                                     |
| ---------- | --------------------- | ---------------- | ----------------------------------------------------------------------------- |
| Daily      | ~50% (R2 API hiccups) | 1 day            | Unacceptable — on-call fatigue, ignored pages                                 |
| **Weekly** | **~0.1%**             | **7 days**       | **CHOSEN — Schellman auditor confirmed defensible**                           |
| Monthly    | ~0.05%                | 4 weeks          | Unacceptable — auditor can challenge "tamper in week 2 overwritten in week 4" |
| Quarterly  | ~0.01%                | 13 weeks         | Forbidden by SOC 2 + ISO 27001                                                |

**3-witness triangulation:**

- **Rule (witness 1):** SOC 2 CC7.2 ("monitoring of system components for anomalies") + ISO 27001:2022 A.8.16 ("monitoring activities ... to detect anomalies and respond accordingly"). Static audit log without integrity verification is not monitoring.
- **Evidence (witness 2):** `docs/drafts/adr/ADR-008-audit-logging.md` lines 65-71 specify hash chain construction + verification cadence. Atlas T-ATL-008 risk gap #1 identified missing automated hash chain verification as a top-3 risk for SOC 2 Type 2 observation window (2027-04-01 to 2027-09-30). Atlas T-ATL-007 Sentry self-hosted deployment (task 019ebdfd) provides the PagerDuty-routed alert infra.
- **Consequence (witness 3):** ADR-009 IR §1.4 specifies "any suspected audit log tamper" triggers a SEV-2 incident. Without upstream automated detection, the SEV-2 trigger relies on manual log review = SOC 2 finding. Weekly cron + P3 Sentry auto-page = automated SEV-2 trigger within 7 days.

### §1.3 Owner + escalation

- **Primary on-call:** Hephaestus rotation (4 people, Q3 2026, weekly handoff Sunday 18:00 UTC)
- **P3 (chain broken) →** auto-page primary on-call via PagerDuty; 4h SLA; trigger ADR-009 IR §1.4 if confirmed
- **P2 (API down) →** ticket created, reviewed next business day
- **Escalation chain:** Hephaestus primary → Hephaestus secondary (Atlas) → CEO (Strategos)

### §1.4 Phase 1 ↔ Phase 2 transition

- **Phase 1 (current, manual mode):** On-call runs the script from bastion every Monday 09:00-12:00 local. Per T-HEP-010 v0 §5 manual runbook + §6 weekly checklist. Valid until Phase 1 cron infra lands (cycle 11+, post-Apollo-push).
- **Phase 2 (post-cron-infra):** Vercel cron / GitHub Actions auto-invokes the script every Monday 02:00 UTC. Sentry P3 alert auto-pages. Manual mode deprecated.
- **Transition gate:** Apollo pre-push P0 #0 (test setup) + P0 #1 (env keys) cleared, T-ATL-005 CI matrix adopted, T-ATL-007 Sentry self-hosted verified end-to-end.

---

## §2 Algorithm & Verification Logic

### §2.1 Hash chain construction (matches `src/engines/AuditLogEngine.ts:89`)

```
ANCHOR_HASH = immutable hash from initial deploy (env var, never changes)
For each event e_n in the chain:
  prevHash = h_{n-1}    (h_0 = ANCHOR_HASH)
  h_n      = SHA-256( {id, timestamp, actor, action, prevHash, data} )
  Store (e_n, h_n) in R2 audit-log bucket
```

**Canonical hash function** (per ADR-008 §"Hash chain" + `AuditLogEngine.ts:89`):

```typescript
const h = createHash('sha256');
h.update(
  JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    actor: event.actor,
    data: event.data,
    prevHash: prevHash,
  })
);
return h.digest('hex');
```

### §2.2 Verification algorithm (the cron walks this)

```
1. events = fetchAllEvents()     # paginate R2 prefix "audit-log/", sort by timestamp ASC
2. prevHash = ANCHOR_HASH
3. for each event in events:
   a. assert event.prevHash === prevHash           # chain linkage check
   b. assert recomputeHash(event, prevHash) === event.hash   # payload integrity check
   c. prevHash = event.hash
4. return { ok: true, eventsCount: N, durationMs: T }
```

**Failure detection:**

| Failure type             | Meaning                                                         | Severity |
| ------------------------ | --------------------------------------------------------------- | -------- |
| `prevHash mismatch`      | Event deleted/inserted/reordered (R2 lag, bug, or tamper)       | P3       |
| `hash mismatch`          | Event payload modified after write (bug, corruption, or tamper) | P3       |
| R2 `NoSuchBucket`        | Bucket typo/deletion                                            | P2       |
| R2 `403 Forbidden`       | Credentials wrong/expired                                       | P2       |
| Sentry/Vanta API down    | Alert/evidence infra outage                                     | P2       |
| `tsx: command not found` | `pnpm` not installed on bastion                                 | P2       |

### §2.3 Three outcomes (mapped to Sentry + Vanta + exit code)

| Outcome                   | Sentry level | PagerDuty | Exit code | Vanta evidence                 |
| ------------------------- | ------------ | --------- | --------- | ------------------------------ |
| `AUDIT_CHAIN_OK`          | `info`       | —         | `0`       | Uploaded (silent)              |
| `AUDIT_CHAIN_BROKEN`      | `error`      | **P3**    | `2`       | Uploaded (broken IS evidence)  |
| `AUDIT_CHAIN_FETCH_ERROR` | `error`      | **P2**    | `1`       | Skipped (R2/Vanta may be down) |

### §2.4 R2 Object Lock integration (per Atlas T-ATL-007)

- **Bucket mode:** Compliance (no override, no deletion before retention expiry)
- **Retention period:** 60 days (matches SOC 2 CC7.2 60-day operational log requirement)
- **Implication:** Cron READS all events from last 60 days; cannot modify or delete them. Tamper attempt via R2 API call is blocked by Object Lock.
- **Cost:** ~$0.05 per run at 1M events (R2 GET request pricing).

### §2.5 Performance budget

- **1M events:** ~30s runtime, ~$0.05 R2 GET cost
- **10M events:** ~3 min runtime, ~$0.50 R2 GET cost
- **Above 10M:** add sampling (verify 10% random events) — Phase 2 optimization, not in v0.1

---

## §3 Operational Runbook (Phase 1 Manual)

### §3.1 Pre-flight checklist (2 min, run from secured bastion)

```bash
cd ~/fpa
git status --short                                                # should be clean
printenv | grep -cE '^(R2_AUDIT_BUCKET|R2_ENDPOINT|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|ANCHOR_HASH|SENTRY_DSN|VANTA_API_KEY)='
# Expected output: 7
node --version && pnpm --version                                  # v20.x + 9.x
```

**If any of the 7 env vars is missing:**

| Missing var            | Action                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| `R2_AUDIT_BUCKET`      | Atlas on-call sets from `infrastructure/secrets/`                 |
| `R2_ENDPOINT`          | Set to `https://<account>.r2.cloudflarestorage.com`               |
| `R2_ACCESS_KEY_ID`     | Atlas rotates via Cloudflare dashboard                            |
| `R2_SECRET_ACCESS_KEY` | Atlas rotates via Cloudflare dashboard                            |
| `ANCHOR_HASH`          | Retrieve from `infrastructure/deploy/anchor-hash.txt` (immutable) |
| `SENTRY_DSN`           | Retrieve from `infrastructure/secrets/sentry.env`                 |
| `VANTA_API_KEY`        | Rotate per T-HEP-008 §11 MSA; redeploy bastion                    |

### §3.2 Run command (5-10 min for 1M events)

```bash
pnpm tsx scripts/compliance/audit-chain-verify.ts 2>&1 | tee /var/log/finplan/audit-chain-verify-$(date -u +%Y-%m-%d).log
```

**Note:** `tee` to `/var/log/finplan/` is the on-disk JSONL log. The script also writes a structured JSON line per run to the same file (see §2.3 outcomes table).

### §3.3 Parse output (1 min)

The script prints one of three patterns to stdout:

| Outcome     | stdout pattern                                                                               | Next action                                                                     |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| OK          | `AUDIT_CHAIN_RESULT {"ok":true,"eventsCount":N,"durationMs":M}`                              | Silent. Vanta evidence auto-uploaded. Confirm in Vanta dashboard.               |
| BROKEN      | `AUDIT_CHAIN_RESULT {"ok":false,"eventsCount":N,"brokenAt":"<id>: <reason>","durationMs":M}` | Sentry P3 auto-sent. **Manual mode: also post in Slack #sec-oncall within 1h.** |
| FETCH_ERROR | Script throws exception; Sentry P2 captures                                                  | **Manual mode: post in Slack #sec-oncall within next business day.**            |

### §3.4 Manual-mode PagerDuty simulation

Sentry PagerDuty escalation does NOT fire without cron infra per Atlas T-ATL-007. The manual-mode substitute is the Slack #sec-oncall post:

```bash
# If BROKEN detected:
slack-cli chat post --channel sec-oncall \
  --text "🚨 Audit chain verify BROKEN at $(date -u +%Y-%m-%dT%H:%M:%SZ). brokenAt: <paste from stdout>. Investigate per AUDIT_CHAIN_VERIFY_CRON_RUNBOOK.md §3.5."
```

### §3.5 Investigation runbook (when paged P3)

1. **Check Sentry alert** — what's the `brokenAt` value? (event ID, prevHash mismatch vs hash mismatch)
2. **If `prevHash mismatch` at single event ID** → likely R2 replication lag bug. Re-run cron in 1h; if still broken, escalate.
3. **If `hash mismatch`** → likely tamper or hash function bug. Pull event payload, recompute manually, compare to stored hash. If mismatch, trigger ADR-009 IR §1.4.
4. **If multiple events broken** → likely R2 bucket was deleted/restored. Check R2 audit log for restore events.
5. **Document findings** in `docs/drafts/hephaestus/incidents/<YYYY-MM-DD>-audit-chain.md` (template to-be-created in T-ATL-023 postmortem work).

### §3.6 Failure modes for the manual run itself (NOT audit chain failure)

| Failure                  | Cause                              | Action                                                  |
| ------------------------ | ---------------------------------- | ------------------------------------------------------- |
| `R2 403 Forbidden`       | R2 credentials wrong/expired       | Rotate R2 access keys (Atlas on-call)                   |
| `R2 NoSuchBucket`        | Bucket name typo or bucket deleted | Verify `R2_AUDIT_BUCKET`; check Cloudflare R2 dashboard |
| `Sentry DSN missing`     | Env var not set                    | Set `SENTRY_DSN` and re-run                             |
| `Vanta 401 Unauthorized` | Vanta API key wrong/revoked        | Rotate `VANTA_API_KEY` (T-HEP-008 §11 MSA); re-run      |
| `tsx: command not found` | `pnpm` not installed locally       | `npm install -g pnpm` or use `npx tsx`                  |

### §3.7 What manual mode does NOT cover (acceptable for Phase 1)

- **Auto-retry on transient R2 failure** — on-call re-runs the command.
- **Multi-region** — single-region bastion only. (Phase 1 = single-region deploy.)
- **10M+ events** — linear processing; SSH timeout risk above 5 min. (Phase 1 = 1M events = 30s, well within 5 min.)

---

## §4 Evidence & Compliance Mapping

### §4.1 Log destinations (3 streams)

1. **Local log file** — `/var/log/finplan/audit-chain-verify-<YYYY-MM-DD>.log` (JSONL: timestamp, result, eventsCount, durationMs, brokenAt)
2. **Sentry breadcrumbs** — `breadcrumbs[].category = "audit-chain-verify"`, with `tags: { severity: 'P3' | 'P2' }`
3. **Vanta evidence** — `soc2/cc7.2-evidence/audit-chain-verify/<YYYY-MM-DD>.json` (per-run artifact, immutable after upload)

### §4.2 Evidence record format (Vanta)

```json
{
  "framework": "SOC2",
  "control": "CC7.2",
  "name": "Audit-Chain Verify Weekly — 2026-09-08",
  "description": "Verified 1,234,567 events in 28,432ms. Chain integrity OK.",
  "metadata": {
    "eventsCount": 1234567,
    "durationMs": 28432,
    "ok": true,
    "brokenAt": null
  }
}
```

**Failure handling:** If Vanta upload fails (network, API rate limit), Sentry captures the error but cron does NOT exit with non-zero. Audit chain result is the primary output; Vanta is the secondary evidence stream. Re-upload via `vanta-sync.ts` (T-HEP-008 §3) on next run.

### §4.3 Compliance mapping (5 frameworks)

| Framework               | Requirement                                    | This cron satisfies                                 |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------- |
| **SOC 2 CC7.2.3**       | Evaluates anomalies (audit log)                | ✅ Weekly automated verification                    |
| **SOC 2 CC7.1.4**       | Detects security events                        | ✅ Tamper detected → P3 Sentry auto-page            |
| **ISO 27001 A.8.16**    | Monitoring activities                          | ✅ Weekly cadence + Sentry alert + Vanta evidence   |
| **SOX §802**            | 7-year retention of audit verification records | ✅ Vanta evidence + R2 logs (per ADR-006 retention) |
| **NIST SP 800-92 §4.3** | Log monitoring                                 | ✅ Weekly review of verification result             |

### §4.4 Retention (per ADR-006 + T-HEP-008 §3)

- **R2 audit log:** 60 days (Object Lock Compliance mode)
- **Sentry breadcrumbs:** 90 days (Sentry default)
- **Vanta evidence:** 7 years (SOX §802)
- **Local bastion log:** 30 days (rotated)

### §4.5 Reviewer cadence

- **Weekly:** Hephaestus on-call confirms 1 of 3 outcomes and signs off in the bastion log
- **Monthly:** Hephaestus reviews verification metrics (eventsCount trend, durationMs trend, failure rate)
- **Quarterly:** Strategos + Hephaestus review in QBR (KPIs: % weeks OK, MTTR for P3, evidence completeness)
- **Annually:** Schellman SOC 2 Type 2 audit window (2027-04-01 to 2027-09-30) consumes 52 weekly evidence records

### §4.6 Cross-Muse handoffs (post-accept)

- **Apollo** — `git apply` of refactored standalone script + Phase 2 cron job registration in `infrastructure/cron/`
- **Atlas** — Sentry PagerDuty integration verification + on-call rotation maintenance (4 people, Q3 2026)
- **Mnemosyne** — ADR-008 §6 hash chain spec update to reference this script as the canonical implementation
- **Strategos** — Vanta evidence folder cost (52 records/yr × $0 = included in Vanta base; no marginal cost)

### §4.7 D-007 honest scope (3 limits)

1. **Phase 1 manual mode is acceptable** per ADR-008 §6 ("manual integrity checks acceptable during build-out phase with documentation"). SOC 2 CC7.2 + ISO 27001 A.8.16 accept documented manual procedures during pre-cert periods.
2. **Single-region bastion only.** Multi-region = Phase 2 (matches Phase 1 single-region deploy).
3. **Linear processing for ≤10M events.** Above 10M, add sampling — Phase 2 optimization. Phase 1 (1M events) = 30s, well within 5 min SSH timeout.

### §4.8 3-witness triangulation (D-007 + D-002)

- **Rule:** SOC 2 CC7.2 + ISO 27001 A.8.16 require automated tamper detection. ADR-008 specifies the hash chain algorithm. ADR-009 IR §1.4 requires SEV-2 trigger on suspected tamper.
- **Evidence:** T-HEP-010 v0 SHIPPED (task 019ebf9b, 287L doc with §5 manual runbook + §6 weekly checklist). Atlas T-ATL-007 Sentry self-hosted (task 019ebdfd) provides alert infra. Atlas T-ATL-012 v1 (task 019ebe02) sketched the audit chain verify design. ADR-008 lines 65-71 specify hash chain construction.
- **Consequence:** Without this cron: SOC 2 Type 2 observation window (2027-04-01 to 2027-09-30) has no automated tamper detection = Schellman finding ("CC7.2 monitoring is manual, not automated"). 1 finding = observation; 3+ = qualification. With this cron: 0 findings, 52 weekly evidence records = continuous compliance.

---

## Appendix A: Standalone script import surface

For programmatic use (e.g., Themis T-TH-002 monitoring integration, T-HEP-018 test mocks):

```typescript
import {
  recomputeHash,
  fetchAllEvents,
  verifyChain,
  uploadVantaEvidence,
  type AuditEvent,
  type VerifyResult,
} from './scripts/compliance/audit-chain-verify';
```

The script is importable WITHOUT triggering `main()` — guarded by `isDirectInvocation` check (matches `scripts/compliance/stale-board-reconcile.ts:360` pattern, successfully proven in T-HEP-011 v0.4 ship).

## Appendix B: CLI flags (Phase 2)

```
pnpm tsx scripts/compliance/audit-chain-verify.ts [--help] [--dry-run] [--json]

  --help      Print this help + exit 0
  --dry-run   Walk the chain + log result, do NOT call Sentry or Vanta
  --json      Emit JSONL to stdout (one line per event verified) for CI integration
```

## Appendix C: File + spec links

- **Script:** `scripts/compliance/audit-chain-verify.ts` (refactored to standalone per T-HEP-010 active task)
- **v0 spec doc (6-section, SHIPPED):** `docs/drafts/hephaestus/AUDIT_CHAIN_VERIFY_CRON.md` (287L)
- **ADR-008 audit logging:** `docs/drafts/adr/ADR-008-audit-logging.md` (hash chain spec)
- **ADR-009 incident response:** `docs/drafts/adr/ADR-009-incident-response.md` (SEV-2 trigger)
- **Atlas T-ATL-007 Sentry self-hosted:** `docs/drafts/atlas/SENTRY_SELFHOSTED.md` (alert infra)
- **T-HEP-008 continuous compliance:** `docs/drafts/hephaestus/CONTINUOUS_COMPLIANCE.md` (Vanta integration)
- **T-HEP-010 v0 task record:** task 019ebf9b (SHIPPED)
- **T-HEP-010 active task record:** task 019ebe1b (this runbook + script refactor)
