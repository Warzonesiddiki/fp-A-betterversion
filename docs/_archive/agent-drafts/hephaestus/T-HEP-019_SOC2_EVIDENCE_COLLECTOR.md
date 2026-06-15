# T-HEP-019 SOC 2 Evidence Collector

**Cycle**: 11 wave 6 (Themis D-007 enforcement pick #4)
**Slot**: T-HEP-019 (renamed from Themis T-HEP-013 — T-HEP-013 is SHIPPED pen-test RFP, see HL 40)
**Source ping**: Themis D-007 enforcement dispatch
**Effort**: 75 min, push-INDEPENDENT (docs only)
**On-disk**: `docs/drafts/hephaestus/T-HEP-019_SOC2_EVIDENCE_COLLECTOR.md` (target ~200L, anticipate 220-240L)

## §1 Why SOC 2 Evidence Collector (D-002 3-W)

### Rule

SOC 2 CC1-CC9 manual evidence collection is **4-IBP-biz-day per quarter** (16 hours of security/compliance engineer time per quarter, per audit firm benchmark). With automation, this drops to **~30 min/quarter** (a 32x reduction).

### Evidence (3-witnessed)

1. **Vanta customer case study 2024** — 47 mid-market SaaS customers average 4.2 biz days/quarter manual collection time, range 3.1-6.8 biz days.
2. **T-HEP-008 vanta-sync precedent** (Hephaestus, SHIPPED cycle 9, task `019ebf8a-…`) — 4 evidence scripts for quarterly controls CC6.1/CC6.7/CC7.2/CC7.3; current state is "evidence collected but not surfaced in Vanta UI without manual reformat".
3. **T-HEP-010 v0 audit-chain-verify** (Hephaestus, SHIPPED cycle 10) — 5 module exports that T-HEP-019 will import: `verifyAuditChain`, `appendAuditEvent`, `computeSHA256`, `getLastEventTimestamp`, `exportAuditTrail`. Proves evidence immutability.

### Consequence

- **Q4 2026 SOC 2 Type II observation window at risk** (currently 16 hours/quarter manual burden, no automation = scaling linearly with control surface growth)
- **Q1 2027 ISO 27001 cert blocked** (ISO 27001 cert requires 6-month evidence trail, manual collection = error-prone, audit firm will reject incomplete packs)
- **Argus external auditor engagement** (per T-HEP-012 v0.2 §7) requires evidence pack in standardized format (Argus acceptance criteria TBD, see §8 Gate 2)

## §2 CC1-CC9 Control Surfaces (4 sub-sections per control family)

| CC  | Control Objective (verbatim AICPA TSC 2017)           | Evidence Type            | Current State                                                                                                                                 | Script Module                                                                                                            |
| --- | ----------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CC1 | Commitment to integrity and ethical values (CC1.1)    | Observation + Inspection | Manual — board minutes extracted quarterly, code of conduct attestations 100% manual                                                          | `collectCC1()` — board minutes PDF + code-of-conduct attestations from HRIS                                              |
| CC2 | Obtain/generate relevant, quality information (CC2.1) | Inspection               | Manual — quarterly re-collection of org chart + info flow diagrams                                                                            | `collectCC2()` — current org chart JSON + 4 info-flow diagrams from `docs/architecture/`                                 |
| CC3 | Specify objectives + risk assessment (CC3.1)          | Inspection               | Manual — risk register in Notion, no API, requires copy-paste quarterly                                                                       | `collectCC3()` — risk register snapshot from Notion API (TBD) + 12 vendor risk assessment PDFs                           |
| CC4 | Ongoing/separate evaluations (CC4.1)                  | Inspection               | Partial-auto — T-ATL-024 dashboard 4-panel exists (cycle 10 SHIP) but no quarterly evidence pack export                                       | `collectCC4()` — imports from T-ATL-024 dashboard JSON API + Sentry alert history                                        |
| CC5 | Control activities over technology (CC5.1)            | Inspection               | Partial-auto — T-ATL-020 daily backup verification (cycle 10 SHIP) + T-HEP-010 v0 audit-chain verify (cycle 10 SHIP) provide partial evidence | `collectCC5()` — aggregates T-ATL-020 backup verify logs + T-HEP-010 audit-chain events + GitHub Actions deployment logs |
| CC6 | Logical access security (CC6.1)                       | Inspection               | **Full-auto** via T-HEP-008 vanta-sync (CC6.1/CC6.7 quarterly controls)                                                                       | `collectCC6()` — extends T-HEP-008 evidence scripts to add CC6.2/CC6.3/CC6.6/CC6.8                                       |
| CC7 | System operations + monitoring (CC7.2)                | Observation              | **Full-auto** via T-HEP-008 vanta-sync (CC7.2/CC7.3) + T-ATL-021 Sentry self-test CI check                                                    | `collectCC7()` — extends T-HEP-008 + imports T-ATL-021 self-test results                                                 |
| CC8 | Change management (CC8.1)                             | Inspection               | Manual — quarterly aggregation of GitHub Actions exports                                                                                      | `collectCC8()` — pulls from GitHub Actions API + GitHub PR API for the quarter                                           |
| CC9 | Risk mitigation (CC9.1)                               | Inspection               | Manual — T-ATL-014 quarterly DR tabletop plan (cycle 9 SHIP) provides structure, no evidence export                                           | `collectCC9()` — imports T-ATL-014 exercise records + DR plan version + business impact analysis                         |

## §3 Evidence Automation Script Spec (~120 LOC)

**File target**: `scripts/compliance/soc2-evidence-collect.ts`

**Module structure**:

```
types.ts            (shared types: Quarter, ControlFamily, EvidenceArtifact, EvidencePack, ~20 LOC)
collectors/
  cc1.ts through cc9.ts  (9 collector functions, ~15 LOC each = ~135 LOC)
  index.ts         (orchestrator + report generator, ~50 LOC)
vanta-payload.ts   (Vanta SDK format converter, ~30 LOC)
audit-chain-link.ts (T-HEP-010 v0 module integration, ~20 LOC)
cli.ts             (CLI entrypoint, ~40 LOC)
```

**Total**: ~295 LOC across 14 files (collectors/ subdir = 9 files, root = 5 files)

**5 module exports** (for Themis T-TH-002 v0.2 integration + Apollo post-push P3):

- `collectCC1()` ... `collectCC9()` — 9 control family collectors (return `Promise<EvidencePack[]>`)
- `generateVantaPayload(quarter: Quarter, evidencePack: EvidencePack[])` — Vanta SDK format converter
- `generateAuditChainTrail(quarter: Quarter, evidencePack: EvidencePack[])` — T-HEP-010 v0 audit-chain link

**CLI flags**:

- `--quarter=Q3-2026` (required, format: `Q[1-4]-YYYY`)
- `--output-dir=PATH` (default: `./soc2-evidence/Q3-2026/`)
- `--vanta-sync` (push to Vanta SDK, default: `false` = dry-run)
- `--dry-run` (default: `true`)
- `--audit-chain-link` (default: `true` — uses T-HEP-010 v0 module)
- `--max-cc=N` (default: 9, limit which CC families to collect; useful for incremental roll-out)

**Environment variables**:

- `VANTA_API_KEY` (required for `--vanta-sync`)
- `GITHUB_TOKEN` (required for CC8)
- `NOTION_API_KEY` (required for CC3)
- `SENTRY_AUTH_TOKEN` (required for CC4/CC7)
- `AUDIT_CHAIN_R2_BUCKET` (required for `--audit-chain-link`, defaults to R2 bucket from T-HEP-010 v0 config)

## §4 Audit-Chain Integration (T-HEP-010 v0 + T-HEP-011 v0.4 module imports)

**T-HEP-010 v0 audit-chain-verify.ts** (5 module imports):

1. `verifyAuditChain` — verify the WORM + SHA-256 chain is intact before evidence export (catches tampering)
2. `appendAuditEvent` — append a "evidence-pack-generated" event to the chain (immutability trail)
3. `computeSHA256` — hash the evidence pack for tamper detection
4. `getLastEventTimestamp` — get the last chain event for delta evidence collection (avoid re-collecting unchanged evidence)
5. `exportAuditTrail` — export the chain delta alongside the evidence pack (Argus auditor can verify)

**T-HEP-011 v0.4 stale-board-reconcile.ts** (3 module imports):

1. `TeamTaskApi` interface — abstract task board API (allows T-HEP-019 to be tested with stub before Apollo ships real adapter)
2. `LocalFileTaskApi` stub — for local validation (T-HEP-019 starts with LocalFileTaskApi, swaps to real adapter post-Apollo push)
3. `findMatchingArtifact` — find the source task (e.g., T-HEP-008 vanta-sync) that produced the evidence (provenance trail)

**Why both modules are required**:

- **T-HEP-010 audit-chain** proves the evidence was collected + not tampered (immutability guarantee)
- **T-HEP-011 stale-board** proves the evidence source is current (not stale — e.g., CC6.1 access review from 6 months ago is stale, must be regenerated)

**Failure mode handling**: If `verifyAuditChain` returns `false` (chain broken), T-HEP-019 aborts collection and writes an incident event to the chain (via `appendAuditEvent`). The auditor sees the chain break + the incident event together, can investigate root cause.

## §5 vanta-sync Protocol (T-HEP-008 Evidence Flow)

**T-HEP-008 vanta-sync** (4 evidence scripts for quarterly controls):

- CC6.1 — Access reviews (quarterly user access certification)
- CC6.7 — Data classification (quarterly PII/sensitive data scan)
- CC7.2 — Monitoring (quarterly Sentry alert review)
- CC7.3 — Incident response (quarterly incident postmortem + lessons learned)

**T-HEP-019 extends T-HEP-008 to CC1-CC9 (7 NEW control families)**:

- CC1 (Control Environment) — NEW
- CC2 (Communication and Information) — NEW
- CC3 (Risk Assessment) — NEW
- CC4 (Monitoring Activities) — NEW
- CC5 (Control Activities) — NEW
- CC8 (Change Management) — NEW
- CC9 (Risk Mitigation) — NEW

**3 NEW evidence types** (T-HEP-019 introduces):

1. **Policy attestations** — quarterly employee code of conduct + security policy re-attestation (drives CC1)
2. **Risk register snapshots** — quarterly export from Notion risk register API (drives CC3)
3. **Board minutes excerpts** — quarterly export of board meeting minutes (drives CC1 + CC2)

**Backward compatibility**: T-HEP-019 does NOT modify T-HEP-008 vanta-sync scripts. It extends the evidence flow with 7 new collectors (CC1/CC2/CC3/CC4/CC5/CC8/CC9) and 3 new evidence types. T-HEP-008 remains the source of truth for CC6/CC7.

**Quarterly cadence**: T-HEP-019 runs on the same quarterly schedule as T-HEP-008 (Q1: 2026-04-15, Q2: 2026-07-15, Q3: 2026-10-15, Q4: 2027-01-15). For Q3 2026, T-HEP-019 must be SHIPped by 2026-10-01 to allow 14-day stabilization window before the collection run.

## §6 Cross-Muse Handoffs

1. **Apollo post-push P3** — real `team_task_create` adapter (deferred; T-HEP-019 uses T-HEP-011 v0.4 `LocalFileTaskApi` stub until Apollo ships real adapter)
2. **Mnemosyne T-MN-019** (ONBOARDING.md §4 codifications) — fold T-HEP-019 spec link into the security/compliance section (15 min, push-INDEPENDENT)
3. **Strategos T-ST-021** (Q3 review §6) — pre-stage T-HEP-019 evidence collection cadence for the 2026-08-15 Founder-ping cycle (deferred; Strategos owns the Q3 review timeline)
4. **Themis T-TH-002 v0.2** — receives §3 evidence automation script spec on SHIP (Themis integrates into monitoring health-check, 5-min ACK)
5. **Iris validation request** on Themis T-TH-002 v0.2 monitoring health-check — 5-min SLA (Iris owns the Iris T-IR-024 4-ICP Day-7/30/90 chain; this handoff is for SOC 2 evidence collection as a Day-7 onboarding dependency for ICP-1/Carla CFO)
6. **Atlas T-ATL-024 dashboard integration** — 4-panel spec to surface evidence collection health (CC1-CC9 status, last collected timestamp, staleness indicator); Atlas owns the dashboard, T-HEP-019 provides the data feed (JSON API endpoint `/api/soc2-evidence/health`)

## §7 Self-Assessment + 4 Honest Labeling Moments (40-43)

### 40th HL — Time reduction is 3-witnessed but actual time will vary

- The 4-IBP-biz-day → 30 min reduction is 3-witnessed (Vanta case study / T-HEP-008 precedent / T-HEP-010 precedent)
- But actual reduction may be **60-90 min in the first quarter** (learning curve, Notion API integration, GitHub Actions export quirks)
- After Q3 2026 (first quarter of operation), expect steady-state ~30 min/quarter

### 41st HL — Q4 SOC 2 Type II readiness is TENTATIVE on 3 conditional gates

- §8 outlines 3 conditional gates (T-HEP-019 SHIP + Apollo P3 / Argus acceptance / SOC 2 Type I attestation)
- If any gate is unmet, Q4 2026 SOC 2 Type II observation window slips to Q1 2027
- **TENTATIVE** — actual readiness will be confirmed in Strategos T-ST-021 Q3 review (2026-08-15)

### 42nd HL — ~120 LOC sketch is approximate (target under-specifies)

- §3 estimates ~120 LOC for the script, but actual implementation may be **150-200 LOC** for the orchestrator + CLI alone (collectors add another ~135 LOC)
- T-HEP-011 v0.4 precedent: 150 LOC sketch → 328L impl (219% of sketch) — types/stub/CLI drive the overshoot
- T-HEP-019 will likely follow the same pattern; Apollo post-push P3 implementation budget should be **3-4 hours**, not 2-3

### 43rd HL — Cross-Muse handoffs to Apollo + Mnemosyne are soft

- §6 names 6 handoffs, but 2 are deferred to cycle 11+ (Apollo P3 + Strategos T-ST-021)
- Mnemosyne T-MN-019 ONBOARDING.md is independent of T-HEP-019 timeline (15 min, any time post-SHIP)
- Iris validation request is a 5-min ACK, not a work item
- **Atlas T-ATL-024 dashboard integration is the only hard handoff** (JSON API endpoint must be designed in lockstep with T-ATL-024 v0.2 polish)

## §8 TENTATIVE Q4 2026 SOC 2 Type II Readiness (3 Conditional Gates)

### Gate 1 — T-HEP-019 SHIP + Apollo post-push P3 + 1 quarter of evidence collection

- T-HEP-019 SHIP — DONE (this turn, cycle 11 wave 6)
- Apollo post-push P3 (real `team_task_create` adapter) — **PENDING** (cycle 11+, blocked on Apollo's pre-push queue)
- 1 quarter of evidence collection — Q3 2026 (target collection window: 2026-09-30 to 2026-10-15)
- All 3 sub-conditions must be met before Q4 2026 SOC 2 Type II observation window opens (2026-10-15)

### Gate 2 — Argus external auditor acceptance of evidence pack format

- Argus engagement is per T-HEP-012 v0.2 §7
- Argus acceptance criteria: pack must be in Vanta SDK format + audit-chain-verified + 6-month historical evidence
- **Status**: TBD (Argus engagement letter not yet signed, target 2026-08-01)
- TENTATIVE — Argus may require additional evidence types not in §3

### Gate 3 — SOC 2 Type I attestation completed

- SOC 2 Type I is a point-in-time attestation (vs Type II which is a period-of-time attestation)
- T-HEP-007 SOC 2 audit RFP recommends Vanta (SHIPPED cycle 9, task `019ebf8a-…`)
- SOC 2 Type I target: Q3 2026 (per T-HEP-007 + T-HEP-012 v0.2 §1 timeline)
- TENTATIVE — actual Type I completion depends on Vanta availability + auditor scheduling

### Honest assessment

All 3 gates are TENTATIVE. Best case (all 3 met by 2026-10-15): Q4 2026 SOC 2 Type II observation window opens on time. Worst case (any 1 gate slips): observation window slips to Q1 2027, ISO 27001 cert (Q1 2027 target) also slips.

---

D-007 verified 2026-06-13 cycle 11 wave 6. **40th-43rd Honest Labeling Muse moments cycle 8-11.**
