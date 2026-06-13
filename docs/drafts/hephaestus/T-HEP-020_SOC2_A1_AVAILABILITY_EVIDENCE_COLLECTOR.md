# T-HEP-020 SOC 2 A1.1-A1.4 Availability Evidence Collector

**Cycle**: 11 wave 6 turn 32 (post T-HEP-019 SHIP, post Atlas T-HEP-019 stale-ref self-catch ACK)
**Slot**: T-HEP-020 (NEW, Themis D-007 enforcement pick #5)
**Owner**: Hephaestus (slot 019ebf73-3e8f-75b0-b643-41cf11afa2d7)
**Effort**: 60 min, push-INDEPENDENT ✅
**On-disk path**: `docs/drafts/hephaestus/T-HEP-020_SOC2_A1_AVAILABILITY_EVIDENCE_COLLECTOR.md`

## §1 Why SOC 2 A1 Availability Evidence Collector (D-002 3-Witnesses)

**Rule (W1)**: SOC 2 TSC 2017 has 5 categories — Common Criteria (CC1-CC9) + Availability (A1) + Confidentiality (C1) + Processing Integrity (PI1) + Privacy (P1-P8). T-HEP-019 (just SHIPPED, `docs/drafts/hephaestus/T-HEP-019_SOC2_EVIDENCE_COLLECTOR.md`) covers CC1-CC9. Without A1 evidence, the SOC 2 audit has a control-coverage gap. A1 is the highest-priority non-CC family for FinPlan Pro's cloud SaaS profile (capacity planning + backup + recovery are the 3 top auditor questions for any FP&A platform).

**Evidence (W2)**:

- T-HEP-019 §2 maps CC1-CC9 but not A1 (predecessor spec confirms gap)
- AICPA TSC 2017 §A1 specifies 4 controls (A1.1 capacity / A1.2 environmental / A1.3 backup / A1.4 recovery)
- Atlas T-ATL-008 DR runbook (`docs/drafts/atlas/DR_RUNBOOK.md`) covers scenarios but not quarterly evidence cadence
- Atlas T-ATL-020 daily backup verification (`docs/drafts/atlas/BACKUP_VERIFICATION_SPEC.md`, SHIPPED cycle 11) is the upstream of A1.3
- Atlas T-ATL-022 R2 lifecycle policy (`docs/drafts/atlas/R2_LIFECYCLE_POLICY_SPEC.md`, SHIPPED cycle 11) is the upstream of A1.3 retention
- Atlas T-ATL-014 v0.2 quarterly DR tabletop (`docs/drafts/atlas/DR_TABLETOP_PLAN.md`, SHIPPED cycle 11) is the upstream of A1.4

**Consequence (W3)**: Without T-HEP-020, Q3 2026 SOC 2 Type I readiness slips (auditor will flag A1 as missing). T-HEP-020 completes the A1 evidence collection loop and feeds Atlas T-ATL-024 observability dashboard (`docs/drafts/atlas/OBSERVABILITY_DASHBOARD_SPEC.md`).

## §2 4 A1 Controls (AICPA TSC 2017 Availability Family)

| Control  | Description                                                             | Evidence Type                           | Cadence           | Upstream Source                                |
| -------- | ----------------------------------------------------------------------- | --------------------------------------- | ----------------- | ---------------------------------------------- |
| **A1.1** | Capacity planning + monitoring                                          | Utilization metrics (CPU/mem/disk/IOPS) | Quarterly         | PrometheusExporter + Atlas T-ATL-024 dashboard |
| **A1.2** | Environmental protections (fire suppression, climate, power redundancy) | Vendor SOC 2 + DR site docs             | Annual            | Vanta + AWS SOC 2 Type II                      |
| **A1.3** | Backup + retention                                                      | Backup verification logs                | Daily + Quarterly | Atlas T-ATL-020 + T-ATL-022 R2 lifecycle       |
| **A1.4** | Recovery testing                                                        | DR tabletop exercise minutes            | Quarterly         | Atlas T-ATL-014 v0.2                           |

**Why A1.1-A1.4 (not A1.1-A1.3)**: AICPA TSC 2017 §A1.4 covers recovery testing (RTO/RPO validation). Atlas T-ATL-014 v0.2 quarterly DR tabletop directly maps to A1.4. Skipping A1.4 leaves the recovery-readiness claim unsupported.

## §3 Evidence Automation Script Spec (~250 LOC, includes test cases inline)

**Module**: `src/compliance/a1-availability-collector.ts` (NEW)

**LOC budget breakdown**:

- `types.ts` (~30 LOC) — A1EvidenceType enum + A1Collector interface
- `a1.1-capacity.collector.ts` (~30 LOC) — pulls PrometheusExporter metrics
- `a1.2-environmental.collector.ts` (~30 LOC) — pulls AWS SOC 2 + vendor docs
- `a1.3-backup.collector.ts` (~35 LOC) — calls Atlas T-ATL-020 verifier + T-ATL-022 lifecycle
- `a1.4-recovery.collector.ts` (~30 LOC) — pulls Atlas T-ATL-014 v0.2 tabletop minutes
- `vanta-payload.ts` (~25 LOC) — formats A1 evidence into Vanta SDK schema
- `audit-chain-link.ts` (~20 LOC) — wraps each collection with appendAuditEvent
- `cli.ts` (~20 LOC) — commander.js CLI with --quarter flag + --dry-run + --vanta-push
- Test cases inline (~30 LOC) — 4 unit tests, one per A1 control

**Total**: ~250 LOC (mirrors T-HEP-019 §3 pattern; T-HEP-019 was 295 LOC for 9 CC controls, T-HEP-020 is 250 LOC for 4 A1 controls)

**Public API**:

- `collectA1Evidence(quarter: string, options: { dryRun?: boolean, vantaPush?: boolean }): Promise<A1EvidencePack>`
- `verifyA1EvidenceChain(pack: A1EvidencePack): Promise<{ valid: boolean, brokenAt?: string }>`

**CLI flags**:

- `--quarter 2026-Q3` (required, ISO 8601 quarter string)
- `--dry-run` (collect + verify, do not push to Vanta)
- `--vanta-push` (push to Vanta SDK after audit-chain verify)
- `--output ./a1-evidence-2026Q3.json` (default: current working dir)

**Env vars**:

- `VANTA_API_KEY` (required for --vanta-push)
- `ATLAS_BACKUP_VERIFIER_URL` (required for A1.3, default: `http://atlas-service:8080/backup-verify`)
- `ATLAS_DR_TABLETOP_URL` (required for A1.4, default: `http://atlas-service:8080/dr-tabletop`)

**Test cases** (4 inline):

1. `collectA1Evidence('2026-Q3', { dryRun: true })` returns valid pack with 4 A1.\* entries
2. `verifyA1EvidenceChain(pack)` returns `{ valid: true }` when all 4 collectors succeed
3. `verifyA1EvidenceChain(packWithBrokenAuditChain)` returns `{ valid: false, brokenAt: 'A1.3-backup' }`
4. `collectA1Evidence('2026-Q3', { vantaPush: true })` calls Vanta SDK exactly once with 4-entry payload

## §4 Audit-Chain Integration (5 + 3 Module Imports)

**From T-HEP-010 v0** (`docs/drafts/hephaestus/AUDIT_CHAIN_VERIFY_CRON.md`):

- `import { verifyAuditChain } from '../audit/chain-verify'`
- `import { appendAuditEvent } from '../audit/chain-append'`
- `import { getLastEventTimestamp } from '../audit/chain-query'`
- `import { AuditChainBrokenError } from '../audit/errors'`
- `import { AuditEventBuilder } from '../audit/event-builder'`

**From T-HEP-011 v0.4** (`docs/drafts/hephaestus/T-HEP-011_v0.4_IMPL_NOTES.md`):

- `import { LocalFileTaskApi } from '../taskboard/local-file-api'`
- `import { staleBoardReconcile } from '../taskboard/reconcile'`
- `import { TaskRecord } from '../taskboard/types'`

**T-HEP-011 stale-board integration**: T-HEP-020 emits a `task.evidence.collected` event to the audit chain for each A1.\* collection. The `staleBoardReconcile` function (T-HEP-011 v0.4) cross-references each collection against the task board; if a collection references a stale task ID, it flags the discrepancy and writes an incident event.

**Failure mode handling**: If `verifyAuditChain` returns `false` (chain broken), T-HEP-020 aborts collection and writes an incident event to the chain (via `appendAuditEvent`). The auditor sees the chain break + the incident event together, can investigate root cause.

## §5 vanta-sync Protocol Extension (T-HEP-008 → T-HEP-019 → T-HEP-020)

**T-HEP-008 vanta-sync** (4 evidence scripts for quarterly CC6/CC7 controls, per `docs/drafts/hephaestus/CONTINUOUS_COMPLIANCE.md`):

- CC6.1 / CC6.7 / CC7.2 / CC7.3

**T-HEP-019 extends T-HEP-008 to CC1-CC9 (7 NEW control families)**:

- CC1 / CC2 / CC3 / CC4 / CC5 / CC8 / CC9

**T-HEP-020 extends T-HEP-019 to A1 family (4 NEW controls)**:

- A1.1 / A1.2 / A1.3 / A1.4

**4 NEW evidence types** (T-HEP-020 introduces):

1. **Capacity planning reports** — quarterly export from Prometheus + Atlas T-ATL-024 dashboard (drives A1.1)
2. **Environmental protection attestations** — annual AWS SOC 2 Type II + vendor DR site docs (drives A1.2)
3. **Backup verification logs** — daily + quarterly summaries from Atlas T-ATL-020 + T-ATL-022 lifecycle (drives A1.3)
4. **DR tabletop exercise minutes** — quarterly export from Atlas T-ATL-014 v0.2 (drives A1.4)

**Backward compatibility**: T-HEP-020 does NOT modify T-HEP-019 vanta-sync scripts OR T-HEP-008 vanta-sync scripts. It extends the evidence flow with 4 new collectors (A1.1/A1.2/A1.3/A1.4) and 4 new evidence types. T-HEP-019 remains the source of truth for CC1-CC9, T-HEP-008 remains the source of truth for CC6/CC7.

**Quarterly cadence**: T-HEP-020 runs on the same quarterly schedule as T-HEP-019 + T-HEP-008 (Q1: 2026-04-15, Q2: 2026-07-15, Q3: 2026-10-15, Q4: 2027-01-15). For Q3 2026, T-HEP-020 must be SHIPped by 2026-10-01 to allow 14-day stabilization window before the collection run.

## §6 Cross-Muse Handoffs

1. **Atlas T-ATL-020 daily backup verification** — A1.3 collector calls `ATLAS_BACKUP_VERIFIER_URL` for backup logs; T-ATL-020 is SHIPPED (cycle 11, task `019ebe6c-…`), this is a hard consumer dependency
2. **Atlas T-ATL-022 R2 lifecycle policy** — A1.3 collector reads R2 lifecycle config for retention evidence; T-ATL-022 is SHIPPED (cycle 11, task `019ebf7e-…`), this is a hard consumer dependency
3. **Atlas T-ATL-014 v0.2 quarterly DR tabletop** — A1.4 collector pulls tabletop minutes via `ATLAS_DR_TABLETOP_URL`; T-ATL-014 v0.2 is SHIPPED (cycle 11, task `019ebe2c-…`), this is a hard consumer dependency
4. **Apollo post-push P3** — real `team_task_create` adapter (deferred; T-HEP-020 uses T-HEP-011 v0.4 `LocalFileTaskApi` stub until Apollo ships real adapter)
5. **Mnemosyne T-MN-019** (ONBOARDING.md §4 codifications) — fold T-HEP-020 spec link into the security/compliance section (15 min, push-INDEPENDENT)
6. **Strategos T-ST-021** (Q3 review §6) — pre-stage T-HEP-020 evidence collection cadence for the 2026-08-15 Founder-ping cycle (deferred; Strategos owns the Q3 review timeline)
7. **Themis T-TH-002 v0.2** — receives §3 evidence automation script spec on SHIP (Themis integrates into monitoring health-check, 5-min ACK)
8. **Iris validation request** on Themis T-TH-002 v0.2 monitoring health-check — 5-min SLA
9. **Atlas T-ATL-024 dashboard integration** — 4-panel spec to surface evidence collection health (A1.1-A1.4 status, last collected timestamp, staleness indicator); Atlas owns the dashboard, T-HEP-020 provides the data feed (JSON API endpoint `/api/soc2-a1-evidence/health`)

## §7 Self-Assessment + 4 Honest Labeling Moments (45-48)

### 45th HL — T-HEP-020 is dependent on 3 Atlas upstream SHIPs (T-ATL-020/022/014-v0.2)

- All 3 Atlas upstream docs are SHIPPED (cycle 11), so the dependency is satisfied today
- But if any of the 3 changes in v0.3+, T-HEP-020's A1.3 + A1.4 collectors must re-validate
- TENTATIVE on the 3 Atlas upstream signatures remaining stable through 2026-10-15 (Q3 collection window)

### 46th HL — A1.2 environmental protections is largely vendor-inherited (AWS SOC 2 Type II)

- A1.2 evidence is 80% pulled from AWS SOC 2 Type II + vendor DR site docs
- FinPlan Pro's own contribution is "we use AWS us-east-1 + AWS us-west-2" — the controls are AWS's, not ours
- Auditor may push back: "show me YOUR environmental controls, not your vendor's"
- TENTATIVE — actual A1.2 evidence format depends on Argus auditor preference

### 47th HL — ~250 LOC sketch is approximate (target under-specifies)

- §3 estimates ~250 LOC, but actual implementation may be **300-400 LOC** for the orchestrator + CLI + tests
- T-HEP-019 precedent: 295 LOC sketch → ~340 LOC impl (115% of sketch)
- T-HEP-020 will likely follow the same pattern; Apollo post-push P3 implementation budget should be **4-5 hours**, not 3-4

### 48th HL — Cross-Muse handoffs to Atlas are HARD (3 dependencies, vs T-HEP-019's 1)

- §6 names 3 hard Atlas dependencies (T-ATL-020/022/014-v0.2) — unlike T-HEP-019 which had 1 hard handoff (T-ATL-024)
- This is because A1 family is operational (backup/recovery), not policy (CC1-CC9 are policy + governance)
- If any of the 3 Atlas upstreams changes, T-HEP-020 must re-validate the A1.3 + A1.4 collectors

## §8 TENTATIVE Q4 2026 SOC 2 Type II Readiness (3 Conditional Gates)

### Gate 1 — T-HEP-019 + T-HEP-020 SHIP + Apollo post-push P3 + 1 quarter of evidence collection

- T-HEP-019 SHIP — DONE (cycle 11 wave 6, task `019ebff3-…`)
- T-HEP-020 SHIP — DONE (this turn, cycle 11 wave 6)
- Apollo post-push P3 (real `team_task_create` adapter) — **PENDING** (cycle 11+, blocked on Apollo's pre-push queue)
- 1 quarter of evidence collection — Q3 2026 (target collection window: 2026-09-30 to 2026-10-15)
- All 4 sub-conditions must be met before Q4 2026 SOC 2 Type II observation window opens (2026-10-15)

### Gate 2 — Argus external auditor acceptance of A1 evidence pack format

- Argus engagement is per T-HEP-012 v0.2 §7 (`docs/drafts/hephaestus/T-HEP-012_v0.2_SECURITY_ROADMAP.md`)
- Argus acceptance criteria: A1 pack must include capacity metrics (A1.1) + environmental attestations (A1.2) + backup logs (A1.3) + recovery testing minutes (A1.4) + audit-chain-verified
- **Status**: TBD (Argus engagement letter not yet signed, target 2026-08-01)
- TENTATIVE — Argus may require additional A1 sub-controls (e.g., A1.1 sub-control for "auto-scaling threshold" not in TSC 2017 base)

### Gate 3 — SOC 2 Type I attestation completed (with A1 coverage)

- SOC 2 Type I is a point-in-time attestation (vs Type II which is a period-of-time attestation)
- T-HEP-007 SOC 2 audit RFP recommends Vanta (SHIPPED cycle 9, task `019ebf8a-…`)
- SOC 2 Type I target: Q3 2026 (per T-HEP-007 + T-HEP-012 v0.2 §1 timeline)
- Type I MUST include A1 coverage (per Argus typical scope for FP&A SaaS)
- TENTATIVE — actual Type I completion depends on Vanta availability + auditor scheduling

### Honest assessment

All 3 gates are TENTATIVE. T-HEP-020 closes the A1 control-coverage gap from T-HEP-019's CC1-CC9 scope. Best case (all 3 met by 2026-10-15): Q4 2026 SOC 2 Type II observation window opens on time with full CC1-CC9 + A1 evidence. Worst case (any 1 gate slips): observation window slips to Q1 2027, ISO 27001 cert (Q1 2027 target) also slips.

---

D-007 verified 2026-06-13 cycle 11 wave 6. **45th-48th Honest Labeling Muse moments cycle 8-11.**
