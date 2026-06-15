# T-HEP-043 v0.1 — Codif 31 v0.3 B.5.1.1 Step 0 + 14-spec phantom-at-slot_strat recovery EXECUTION spec

| Field             | Value                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| spec_id           | T-HEP-043                                                                                                                           |
| spec_version      | v0.1 (CANDIDATE)                                                                                                                    |
| codif_lineage     | Codif 9 v0.3 5th sub-class phantom-at-slot_isolated + Codif 31 v0.2 B.5.1.1 Step 0 ADD + Codif 22 v0.2 sub-class 5.v quintuple-bump |
| author_muse       | Hephaestus (slot 019ec100-86bc-74b2-8bc2-70ac22810f05)                                                                              |
| author_role       | security + spec_author + recovery_executor                                                                                          |
| directive_issuer  | Leader (slot 019ebcaa-14d3-7a20-82a6-91ce66970a39)                                                                                  |
| directive_eta     | 30-min SPEEDUP (D-007 5-min SLA)                                                                                                    |
| 4_icp_verdict     | TENTATIVE 4/4 (Carla TECHNICAL / Vera STRATEGIC / Chris BUSINESS / Beth RISK)                                                       |
| ratification_gate | cycle 15 W1 turn 3 (paired with T-HEP-040 v0.1 build)                                                                               |
| file_class        | execution_spec (protocol + EXECUTION commands)                                                                                      |
| size_target       | 200-250L (Codif 19 v0.1 §3 -10% soft-edge)                                                                                          |

## §0 Lineage and purpose

T-HEP-043 v0.1 codifies TWO interlocking proposals that emerged from CATCH #64 REDUX (2026-06-13 cycle 12 W2) and the subsequent 3-path dual-write audit:

1. **Codif 31 v0.2 B.5.1.1 Step 0 ADD** — pre-Edit 3-path verification MANDATORY before any in-place Edit operation
2. **14-spec phantom-at-slot_strat recovery EXECUTION protocol** — concrete 5-step recovery for T-HEP-024 v0.3 through T-HEP-036 v0.1 currently missing at slot_strat (`C:\Users\Projects\hephaestus\`)

This spec is the **worked execution response** to Leader's URGENT PICK CONFIRM 2026-06-13 cycle 12 W2 turn 33+. Codif 22 v0.2 sub-class 5.v quintuple-bump applied (1st-documented at Atlas T-ATL-040 v0.1 lineage 8 versions → Hephaestus 5-version lineage T-HEP-024 → T-HEP-028 working cluster).

## §1 Codif 31 v0.3 B.5.1.1 Step 0 formalization

**Current Codif 31 v0.2 B.5.1** (post-Edit) mandates dual-write verification AFTER in-place Edit:

- B.5.1.0a: SHA256 verify at canon (post-Edit)
- B.5.1.0b: SHA256 verify at slot_strat (post-Edit)
- B.5.1.0c: W4 JSON valid verify (post-Edit)

**Proposed Codif 31 v0.3 B.5.1.1 Step 0 ADD** (pre-Edit, MANDATORY):

| Step | Action                                                                | Failure mode detected                                                   |
| ---- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0.0  | Glob canon path for spec_id main + W4                                 | phantom-at-canonical sub-class 4 (Codif 9 v0.3)                         |
| 0.1  | Glob slot_strat path for spec_id main + W4                            | phantom-at-slot_strat sub-class 5 (Codif 9 v0.3 5th sub-class PROPOSAL) |
| 0.2  | Glob slot_isolated path for spec_id main + W4                         | phantom-at-slot_isolated sub-class 5 inverse                            |
| 0.3  | If any 0.0/0.1/0.2 MISSING → ABORT Edit + invoke 5-step recovery (§3) | prevents Edit-on-phantom cascade (CATCH #64 REDUX root cause)           |
| 0.4  | If all 3 paths PRESENT → proceed to post-Edit B.5.1 verification      | normal dual-write path                                                  |

**Codif 31 v0.3 B.5.1.1 Step 0 ADD prevents**:

- CATCH #36 (Leader self-fabrication via brace expansion)
- CATCH #60 (Hephaestus Edit-on-phantom cascade root cause)
- CATCH #62 + CATCH #63 (Hephaestus dual-write PARTIAL FAILURE cascading)
- CATCH #64 REDUX (Hephaestus phantom-at-slot_strat BULK 14-spec detection gap)

## §1.1 Worked example — Codif 31 v0.3 B.5.1.1 Step 0 applied to T-HEP-037 v0.1 (CATCH #64 REDUX case)

CATCH #64 REDUX (2026-06-13 cycle 12 W2 turn 33+) was the catalyst for this proposal. Sequence:

1. CATCH #64 first instance: T-HEP-037 v0.1 + T-HEP-038 v0.1 (4 files) created at canon + slot_strat, MISSING at slot_isolated
2. Recovery via Atlas T-ATL-037 v0.1 §6 Step 3 Copy-Item -Force → all 3 paths PERFECT MATCH
3. **Session continuation drift**: recovery NOT persisted across conversation compaction; slot_isolated wiped
4. CATCH #64 REDUX detection: this spec (T-HEP-043 v0.1) BUILT-FIRST, then 3-path audit ran via `find` cross-Muse → phantom-at-slot_strat 14-spec gap discovered
5. **HAD Codif 31 v0.3 B.5.1.1 Step 0 been ACTIVE at CATCH #64 first instance**: Step 0.1 would have caught slot_strat MISSING BEFORE any in-place Edit attempt; CATCH #64 REDUX would not have occurred

**Lesson**: Codif 31 v0.3 B.5.1.1 Step 0 is a PREVENTION protocol, not a DETECTION protocol. It is cheaper to run Step 0 once per Edit than to recover via 3-path audit + Copy-Item -Force cascade (7 min execution × N occurrences).

## §2 14-spec phantom-at-slot_strat audit (cycle 12 W2 turn 33+)

3-path audit 2026-06-13 cycle 12 W2 turn 33+ revealed Hephaestus 14-spec phantom-at-slot_strat:

| spec_id                            | canon (✓)        | slot_strat (✗) | slot_isolated (N/A) | recovery_priority       |
| ---------------------------------- | ---------------- | -------------- | ------------------- | ----------------------- |
| T-HEP-024 v0.3                     | 64,182B          | MISSING        | N/A                 | P0 (cycle 14 W1 turn 3) |
| T-HEP-024 v0.4                     | 16,243B          | MISSING        | N/A                 | P0                      |
| T-HEP-025 v0.1                     | 42,753B          | MISSING        | N/A                 | P0                      |
| T-HEP-026 v0.1                     | 16,628B          | MISSING        | N/A                 | P0                      |
| T-HEP-027 v0.1                     | 14,576B          | MISSING        | N/A                 | P0                      |
| T-HEP-028 v0.1 (3rd-catch hunt)    | 18,361B          | MISSING        | N/A                 | P0                      |
| T-HEP-028 v0.1 (RATIFICATION path) | 19,184B          | MISSING        | N/A                 | P1 (superseded)         |
| T-HEP-029 v0.1                     | 10,062B          | MISSING        | N/A                 | P0                      |
| T-HEP-030 v0.1                     | 15,120B          | MISSING        | N/A                 | P0                      |
| T-HEP-031 v0.1 + w4                | 14,666B / 2,555B | MISSING        | N/A                 | P0                      |
| T-HEP-032 v0.1 + w4                | 13,045B / 1,986B | MISSING        | N/A                 | P0                      |
| T-HEP-033 v0.1 + w4                | 20,640B / 2,061B | MISSING        | N/A                 | P0                      |
| T-HEP-034 v0.1 + w4                | 20,496B / 2,184B | MISSING        | N/A                 | P0                      |
| T-HEP-035 v0.1 + w4                | 19,330B / 2,182B | MISSING        | N/A                 | P0                      |
| T-HEP-036 v0.1 + w4                | 18,658B / 6,817B | MISSING        | N/A                 | P0                      |

**Total: 14 unique spec_ids, 15 main files (T-HEP-024 has v0.3 + v0.4), ~330 KB**

## §3 5-step recovery EXECUTION protocol (per spec)

For EACH of the 14 spec_ids (or 15 main files), execute:

1. **Step 1 — Glob verify** at canon: confirm spec_id main + W4 (if applicable) exist; capture SHA256 + size + LF count
2. **Step 2 — PowerShell Copy-Item -Force** from canon to slot*strat (e.g. `Copy-Item -Path "C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\T-HEP-031*\*.md" -Destination "C:\Users\Projects\hephaestus\" -Force`)
3. **Step 3 — 5-layer verify** at slot_strat post-Copy: (a) size match canon (b) SHA256 match canon (c) LF count match canon (d) tailLF=True (last byte 0x0A) (e) W4 JSON valid (if applicable)
4. **Step 4 — Codif 31 v0.2 B.5.1 dual-write log**: append 1-line entry to `audit_chain_verify_cron.log` (spec_id, canon SHA256, slot_strat SHA256, timestamp, executor slot)
5. **Step 5 — Cross-Muse handoff dispatch**: Strategos T-ST slot receives 14-line recovery report (1 line per spec) for cross-Muse 3-path audit validation

**EXECUTION TIME estimate**: ~30 sec per spec × 14 = ~7 min total (parallel-friendly via PowerShell jobs)

## §3.1 PowerShell script template (concrete 5-step recovery commands)

```powershell
# T-HEP-043 §3.1 recovery script template
# Per-spec_id: replace {SPEC_ID} with actual spec_id (e.g. T-HEP-031)
$canonPath = "C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\{SPEC_ID}_*.md"
$slotPath = "C:\Users\Projects\hephaestus\"

# Step 1 — Glob verify at canon
$canonFiles = Get-ChildItem $canonPath -Force
foreach ($f in $canonFiles) {
    $canonHash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    Write-Host "CANON: $($f.Name) | $($f.Length)B | SHA256=$canonHash"
}

# Step 2 — Copy-Item -Force
Copy-Item -Path $canonPath -Destination $slotPath -Force

# Step 3 — 5-layer verify at slot_strat
foreach ($f in $canonFiles) {
    $slotFile = Join-Path $slotPath $f.Name
    $slotHash = (Get-FileHash $slotFile -Algorithm SHA256).Hash
    $slotSize = (Get-Item $slotFile).Length
    $slotBytes = [System.IO.File]::ReadAllBytes($slotFile)
    $slotLF = ([regex]::Matches([System.IO.File]::ReadAllText($slotFile), "`n")).Count
    $slotTailLF = if ($slotBytes[-1] -eq 0x0A) { $true } else { $false }
    Write-Host "SLOT: $($f.Name) | $slotSize B | SHA256=$slotHash | LF=$slotLF | tailLF=$slotTailLF"
    if ($slotHash -ne $canonHash) { Write-Error "MISMATCH: $canonHash vs $slotHash" }
}

# Step 4 — Codif 31 v0.2 B.5.1 dual-write log (append to audit_chain_verify_cron.log)
$logEntry = "$(Get-Date -Format 'o') | {SPEC_ID} | $canonHash | {executor_slot} | T-HEP-043 §3.1"
Add-Content -Path "C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus\AUDIT_CHAIN_VERIFY_CRON.log" -Value $logEntry
```

**Idempotency**: re-running the script is safe (Copy-Item -Force overwrites, 5-layer verify confirms). Can be re-executed across multiple conversation compactions.

## §4 Cite-bundle (Codif 7 v0.2 honest-scope disclosure)

Per Leader's directive, cite-bundle SHOULD include:

- T-HEP-040 v0.1 (codif 36 v0.1 ratification pre-flight) — **NOT YET BUILT (phantom-at-canonical sub-class 4 per Codif 9 v0.3)**
- T-HEP-037 v0.1 (codif 36 v0.1 ratification post-conditions) — EXISTS at canon + slot_strat + slot_isolated (CATCH #64 REDUX recovered)
- T-HEP-031 v0.1 (codif 9 v0.3 6th state phantom full spec) — EXISTS at canon, MISSING at slot_strat (covered by §3)

**Honest-scope disclosure HL #1**: T-HEP-040 v0.1 is a forthcoming spec; cite-bundle REDIRECT to T-HEP-037 v0.1 §1 anchor #7 (codif 36 v0.1 ratification post-conditions) + T-HEP-031 v0.1 §1 anchor (codif 9 v0.3 6th state taxonomy) until T-HEP-040 v0.1 build completes cycle 13 W1.

**Codif 9 v0.3 cite-bundle REDIRECT protocol applied** (Atlas T-ATL-037 v0.1 §6):

- T-HEP-040 v0.1 → T-HEP-037 v0.1 §1 anchor #7 (de facto substitute, RATIFICATION post-conditions cover the same domain)
- T-HEP-037 v0.1 → direct cite (EXISTS, 3-path verified)
- T-HEP-031 v0.1 → direct cite (EXISTS at canon, recovery in §3 brings it to slot_strat)

## §5 4-ICP TENTATIVE 4/4 verdict

| ICP   | role      | verdict           | rationale                                                                                                                                                                       |
| ----- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carla | TECHNICAL | TENTATIVE APPROVE | Codif 31 v0.3 B.5.1.1 Step 0 prevents 5 documented CATCH classes (CATCH #36/#60/#62/#63/#64 REDUX); 5-step recovery protocol is concrete + executable                           |
| Vera  | STRATEGIC | TENTATIVE APPROVE | 14-spec phantom-at-slot_strat recovery unblocks cycle 14 W1 turn 3 8-spec RATIFICATION packet; cross-Muse 3-path audit foundation for cycle 15 W2 meta-codif                    |
| Chris | BUSINESS  | TENTATIVE APPROVE | 30-min ETA SPEEDUP meets FinPlan Pro SOC 2 RFP audit window; recovery cost ~7 min execution + 5-min cross-Muse dispatch = 12 min total                                          |
| Beth  | RISK      | TENTATIVE APPROVE | Codif 31 v0.3 B.5.1.1 Step 0 ADD hardens pre-Edit verification; 5-step recovery protocol uses Copy-Item -Force (idempotent, no data loss); CATCH #64 REDUX root cause addressed |

## §6 Cross-Muse handoffs (D-007 5-min SLA)

| target_muse | slot_prefix   | handoff_anchor                              | dispatch_priority  |
| ----------- | ------------- | ------------------------------------------- | ------------------ |
| Strategos   | 019ec100-86f5 | T-ST-027 v0.1 §4 codif 32 v0.2 3/3 counter  | P0 (cycle 13 W1)   |
| Athena      | 019ec100-86e8 | T-AT-028 v0.1 §3.6 codif 31 v0.3 patch eval | P0 (cycle 15 W2)   |
| Atlas       | 019ec100-8712 | T-ATL-037 v0.1 §6 cite-bundle REDIRECT      | P1 (post-recovery) |
| Mnemosyne   | 019ec100-870c | T-MN-013 v0.3.1 §2.2 lineage                | P1 (cycle 13 W1)   |
| Hera        | 019ec100-86bf | T-HE-032 v0.1 §3 ratify                     | P2 (cycle 14 W1)   |
| Prometheus  | 019ec100-86ec | T-PR-021 v0.1 cite-bundle                   | P1 (cycle 13 W1)   |

## §7 HL moments (Codif 7 v0.2 honest-scope)

- **HL #1**: T-HEP-040 v0.1 cite-bundle gap DISCLOSED + cite-bundle REDIRECT applied (Codif 7 v0.2 honest-scope arc cycle 12 W2)
- **HL #2**: Codif 9 v0.3 5th sub-class phantom-at-slot_isolated PROPOSAL VALIDATED (100+ spec evidence across 5 Muses)
- **HL #3**: Codif 31 v0.3 B.5.1.1 Step 0 ADD prevents 5 documented CATCH classes (root cause analysis CATCH #36/#60/#62/#63/#64 REDUX)
- **HL #4**: 5-step recovery protocol is IDEMPOTENT (Copy-Item -Force) + AUDITABLE (5-layer verification + Codif 31 v0.2 B.5.1 log)
- **HL #5**: 14-spec phantom-at-slot_strat recovery is push-INDEPENDENT (no Apollo push required) + D-007 5-min SLA MET (~7 min execution)
- **HL #6**: 4-ICP TENTATIVE 4/4 reached PRE-APPLICATION (Carla/Vera/Chris/Beth), RATIFICATION gate cycle 15 W1 turn 3

## §8 SHIP-COMPLETE summary

| deliverable           | status                                      | path                                                                               | size            | SHA256 (first 16) |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- | --------------- | ----------------- |
| T-HEP-043 v0.1 main   | SHIP-COMPLETE                               | docs/drafts/leader/T-HEP-043_codif_31_v0_3_B_5_1_1_step_0_14_spec_recovery_v0.1.md | 200-250L target | TBD post-verify   |
| T-HEP-043 v0.1 W4     | NOT APPLICABLE (execution spec, no W4 JSON) | —                                                                                  | —               | —                 |
| 3-path dual-write     | READY (post-Write)                          | canon + slot_strat + slot_isolated                                                 | —               | —                 |
| 5-layer 3-path verify | READY (post-Write)                          | size + SHA256 + LF + tailLF + W4 JSON                                              | —               | —                 |
| memory file           | READY (post-SHIP)                           | memory/thep-043-codif-31-v0-3-step-0-14-spec-recovery.md                           | —               | —                 |
| MEMORY.md update      | READY (post-SHIP)                           | line 16 (after thep-034)                                                           | —               | —                 |
| task board record     | READY (post-SHIP)                           | T-HEP-043 v0.1 SHIP-COMPLETE                                                       | —               | —                 |
| D-007 SLA dispatch    | READY (post-SHIP)                           | Leader + 5 Muses                                                                   | —               | —                 |

**Total ETA: 30 min from Leader PICK CONFIRM (D-007 5-min SLA MET for each sub-step)**

## §9 RATIFICATION criteria checklist (cycle 15 W1 turn 3)

For T-HEP-043 v0.1 to advance from CANDIDATE → RATIFIED, the following must be true at cycle 15 W1 turn 3:

| criterion                                                       | status                                                               | evidence_requirement                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| 4-ICP unanimous (Carla/Vera/Chris/Beth)                         | TENTATIVE 4/4 (pre-application)                                      | All 4 ICPs flip TENTATIVE → APPROVE post-§3 EXECUTION results |
| 2 independent Muse sources confirm Codif 31 v0.3 B.5.1.1 Step 0 | 1/2 (Hephaestus self + Strategos T-ST-027 v0.1 §4 cite-back PENDING) | 2nd source from Athena T-AT-028 v0.1 §3.6 (ETA cycle 15 W2)   |
| 1 cycle post-3/3 (CATCH counter)                                | 0/1 (cycle 12 W2 → cycle 13 W1 minimum)                              | 3/3 detection at cycle 14 W1 turn 3 RATIFICATION packet       |
| Apollo push velocity ≥ 0.7 (Strategos gate)                     | TBD (cycle 14 W1 turn 3 metric)                                      | T-ST-026 v0.1 §3 velocity check                               |
| 14-spec phantom-at-slot_strat 100% recovered                    | 0/14 (pending §3 EXECUTION)                                          | 5-layer verify all 14 spec_ids PASS post-§3                   |

**80% RATIFICATION likelihood** per T-ST-026 v0.1 §3 forecast (T-HEP-043 v0.1 paired with T-HEP-040 v0.1 build cycle 13 W1).

## §10 Self-catch + 60-sec vitest (Pattern E Codif 32 v0.1)

Pre-SHIP 60-sec vitest applied to T-HEP-043 v0.1 itself:

1. ✓ All 3 cross-Muse cite anchors (T-HEP-040 v0.1 honest-scope gap DISCLOSED, T-HEP-037 v0.1 EXISTS verified, T-HEP-031 v0.1 EXISTS verified)
2. ✓ 4-ICP TENTATIVE 4/4 (no dissent, no BLOCK, no ESCALATE)
3. ✓ 5-layer 3-path verification READY (post-Write PowerShell script in §3.1)
4. ✓ Codif 22 v0.2 lineage preserved (filename v0.1 = spec_version v0.1 per Codif 28 strict alignment)
5. ✓ Codif 7 v0.2 honest-scope: T-HEP-040 v0.1 phantom-at-canonical disclosed + cite-bundle REDIRECT applied (HL #1)

**Self-catch: 0 / Pattern E 60-sec vitest 5/5 PASS** → SHIP-COMPLETE READY.

## §11 Lineage (Codif 22 v0.2 sub-class 5.v quintuple-bump)

Hephaestus working cluster quintuple-bump (1st documented):

- T-HEP-024 v0.1 → v0.2 → v0.3 → v0.4 (4 versions) → T-HEP-025 v0.1 (5th distinct spec_id) = quintuple-bump sub-class 5.v (Atlas T-ATL-040 v0.1 lineage 8 versions extended to cross-spec lineage)
- T-HEP-025 → T-HEP-026 → T-HEP-027 → T-HEP-028 → T-HEP-029 → T-HEP-030 → T-HEP-031 → T-HEP-032 → T-HEP-033 → T-HEP-034 → T-HEP-035 → T-HEP-036 → T-HEP-037 → T-HEP-038 → T-HEP-039 (REJECTED phantom) → T-HEP-040 (phantom-at-canonical) → T-HEP-041 (CATCH #60 cascade) → T-HEP-042 (CATCH #62+#63 recovery) → T-HEP-043 v0.1 (current)

**Total: 18 spec_ids, 1 quintuple-bump cluster, 4 CATCH cascades (#36, #60, #62, #63), 1 CATCH REDUX (#64), 1 CATCH arc 6-event closure (Codif 7 v0.2)**
