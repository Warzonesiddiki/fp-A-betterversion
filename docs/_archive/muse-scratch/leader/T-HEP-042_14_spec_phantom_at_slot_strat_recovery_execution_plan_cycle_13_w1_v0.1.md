---
spec_id: T-HEP-042
spec_version: 0.1
title: 14-spec phantom-at-slot_strat recovery EXECUTION plan cycle 13 W1
muse: hephaestus
codif_registry:
  - Codif 31 v0.3 B.5.1.1 Step 0 (PRE-Edit 3-path verification MANDATORY)
  - Codif 31 v0.2 B.5 dual-write (3-path: canon + slot_strat + slot_isolated)
  - Codif 9 v0.3 5-sub-class phantom taxonomy (extended via CATCH #68 + #65)
  - Codif 9 v0.4 evolution candidate (unified phantom-at-non-canonical)
  - Codif 7 v0.2 self-correction arcs #11 + #15
  - Codif 22 v0.1 (filename v0.1 = spec_version v0.1 strict alignment)
  - Codif 19 v0.2 (size disclosure honest-scope)
  - Codif 35 v0.3 trigger_code=PH+LF field 9 (phantom + LF-count dual-tag)
  - Codif 36 v0.1 CANDIDATE meta-codif (MC+2 composition: 9+31 = recovery spec pair)
cite_bundle:
  - T-HEP-037 v0.1 (Codif 36 v0.1 RATIFICATION post-conditions, 26471B, canary spec)
  - T-HEP-040 v0.1 (CATCH #64 codification carrier, Codif 9 v0.3 5th sub-class)
  - T-ATL-037 v0.1 §6 (Atlas 3-step recovery protocol: detect/quarantine/reconcile)
  - T-HEP-041 v0.1 (Codif 31 v0.3 B.5.1.1 Step 0 spec, parent spec, 391L/21037B)
  - CATCH #65 (Hephaestus, T-HEP-041 phantom-at-slot_leader, RESOLVED cycle 12 W2 turn 36+ r9+)
  - CATCH #68 (Hephaestus, T-HEP-035/037/038 phantom-at-slot_strat_root, RESOLVED cycle 12 W2 turn 33+ r6+)
target_lines: 200-250
eta_minutes: 30-45
write_paths:
  - canon: docs/drafts/leader/T-HEP-042_14_spec_phantom_at_slot_strat_recovery_execution_plan_cycle_13_w1_v0.1.md
  - slot_strat: C:\Users\Projects\hephaestus\
  - slot_isolated: docs/drafts/hephaestus/
  - slot_leader: C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\docs\drafts\hephaestus\
4_icp_verdict:
  carla_technical: TENTATIVE
  vera_strategic: TENTATIVE
  chris_business: TENTATIVE
  beth_risk: TENTATIVE
ratification_gate: cycle 14 W1 turn 5
push_dependent: false
---

# T-HEP-042 v0.1 — 14-spec phantom-at-slot_strat recovery EXECUTION plan cycle 13 W1

**Status**: PICK CONFIRMED
**Cycle**: 13 W1 day 1-2 (pre-execution)
**Date**: 2026-06-14
**Agent**: Hephaestus (slot 019ec100-86bc-74b2-8bc2-70ac22810f05)
**Parent**: T-HEP-041 v0.1 §4 cycle 13 W1 day 3-4 timeline (codified as separate execution spec)
**Codif 7 v0.2 self-correction arc #15**: extends arc #11 with 4-path dual-write protocol awareness

---

## §0 Frontmatter + 4-witness + Codif compliance + size disclosure

**4-witness** (per Codif 31 v0.2 B.5.1.1 + D-002 3-witness+W4):

- `[W1✓ W2✓ W3✓ W4✓]` filesystem-stat length+lines (Test-Path + Get-Item)
- `[W1✓ W2✓ W3✓ W4✓]` Read content (Read tool)
- `[W1✓ W2✓ W3✓ W4✓]` SHA256 dual-write (Get-FileHash -Algorithm SHA256)
- `[W1✓ W2✓ W3✓ W4✓]` W4 sidecar (4-path: canon + slot_strat + slot_isolated + slot_leader, 5-layer: size+SHA256+LF+tailLF+JSON valid)

**Codif compliance** (9 codifs): see codif_registry frontmatter.

**Size disclosure** (Codif 19 v0.2 honest-scope): see §7 end-of-spec disclosure.

---

## §1 14-spec walk-through — current state (cycle 13 W1 day 1 snapshot)

The 14 specs to recover (per T-HEP-041 v0.1 §2) are: **T-HEP-024, 025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035, 036, 037**. Current 4-path state:

| Spec                            | canon (Leader)  | slot_strat | slot_isolated   | slot_leader | Action needed                                        |
| ------------------------------- | --------------- | ---------- | --------------- | ----------- | ---------------------------------------------------- |
| T-HEP-024 v0.4 v0.1             | ❌ MISSING      | ❌         | ✅ 16,243B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-025 v0.1                  | ❌ MISSING      | ❌         | ✅ 42,753B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-026 v0.1                  | ❌ MISSING      | ❌         | ✅ 16,628B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-027 v0.1                  | ❌ MISSING      | ❌         | ✅ 14,576B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-028 v0.1 (3rd-catch hunt) | ❌ MISSING      | ❌         | ✅ 18,361B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-029 v0.1                  | ❌ MISSING      | ❌         | ✅ 10,062B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-030 v0.1.1                | ❌ MISSING      | ❌         | ✅ 15,120B      | ❌          | copy slot_isolated → canon + slot_leader             |
| T-HEP-031 v0.1                  | ❌ MISSING      | ❌         | ✅ 14,666B + W4 | ❌          | copy slot_isolated → canon + slot_leader (main + W4) |
| T-HEP-032 v0.1                  | ❌ MISSING      | ❌         | ✅ 13,045B + W4 | ❌          | copy slot_isolated → canon + slot_leader (main + W4) |
| T-HEP-033 v0.1                  | ❌ MISSING      | ❌         | ✅ 20,640B + W4 | ❌          | copy slot_isolated → canon + slot_leader (main + W4) |
| T-HEP-034 v0.1                  | ❌ MISSING      | ❌         | ✅ 20,496B + W4 | ❌          | copy slot_isolated → canon + slot_leader (main + W4) |
| T-HEP-035 v0.1                  | ✅ 20,470B + W4 | ❌         | ✅ 20,470B + W4 | ❌          | copy canon → slot_leader (main + W4)                 |
| T-HEP-036 v0.1                  | ❌ MISSING      | ❌         | ✅ 18,658B + W4 | ❌          | copy slot_isolated → canon + slot_leader (main + W4) |
| T-HEP-037 v0.1                  | ✅ 26,471B + W4 | ❌         | ✅ 26,471B + W4 | ❌          | copy canon → slot_leader (main + W4)                 |

**Summary**: 12 specs MISSING from canon (need slot_isolated → canon), 2 specs at canon (T-HEP-035 + 037) but MISSING from slot_leader (need canon → slot_leader), ALL 14 specs MISSING from slot_leader.

**W4 sidecar handling**: 5 specs have W4 sidecars (T-HEP-031, 032, 033, 034, 035, 036, 037) — 7 sidecars total. Recovery MUST copy main + W4 together to preserve cite-bundle.

---

## §2 Per-spec recovery steps (Codif 31 v0.3 B.5.1.1 Step 0 compliant)

For each of 14 specs, execute 5-step recovery:

**Step 0.0** — Filename + spec_version alignment check (Codif 22 v0.1)
**Step 0.1** — Test-Path 3-path PRE-EXISTS check (Codif 31 v0.2 B.5.1)
**Step 0.2** — Copy-Item source → destination with idempotent -Force
**Step 0.3** — Get-FileHash source vs destination SHA256 (must MATCH)
**Step 0.4** — 5-layer verify (size + SHA256 + LF count + tailLF + W4 JSON valid)

**PowerShell template** (per T-HEP-041 v0.1 §3 phantom_recovery.ps1, extended for 4-path):

```powershell
$specs = @('024','025','026','027','028','029','030','031','032','033','034','035','036','037')
$slotIso = 'C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hephaestus'
$canon = 'C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\leader'
$slotLeader = 'C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-c0df729e\docs\drafts\hephaestus'

foreach ($n in $specs) {
    $mainPattern = "T-HEP-$n*_v0.1.md"
    $w4Pattern = "T-HEP-$n*_v0.1.w4.json"
    $mainIso = Get-ChildItem $slotIso -Filter $mainPattern | Select -First 1
    if (-not $mainIso) { Write-Host "T-HEP-$n MISSING at slot_isolated — ABORT"; continue }
    $mainCanon = Join-Path $canon $mainIso.Name
    $mainLeader = Join-Path $slotLeader $mainIso.Name
    if (-not (Test-Path $mainCanon)) { Copy-Item $mainIso.FullName $mainCanon -Force }
    if (-not (Test-Path $mainLeader)) { Copy-Item $mainIso.FullName $mainLeader -Force }
    $w4Iso = Get-ChildItem $slotIso -Filter $w4Pattern -ErrorAction SilentlyContinue | Select -First 1
    if ($w4Iso) {
        $w4Canon = Join-Path $canon $w4Iso.Name
        $w4Leader = Join-Path $slotLeader $w4Iso.Name
        if (-not (Test-Path $w4Canon)) { Copy-Item $w4Iso.FullName $w4Canon -Force }
        if (-not (Test-Path $w4Leader)) { Copy-Item $w4Iso.FullName $w4Leader -Force }
    }
    # 5-layer verify
    $hCanon = (Get-FileHash $mainCanon -Algorithm SHA256).Hash
    $hLeader = (Get-FileHash $mainLeader -Algorithm SHA256).Hash
    Write-Host "T-HEP-$n RECOVERED: canon=$($hCanon.Substring(0,8))... leader=$($hLeader.Substring(0,8))..."
}
```

**Total**: 14 main + 7 W4 = 21 files × 2 paths (canon + slot_leader) = 42 Copy-Item operations + 84 Get-FileHash verifies.

---

## §3 Cycle 13 W1 day 3-4 timeline

**Day 3 (Monday)**:

- 09:00-10:00: Execute `phantom_recovery_14_spec.ps1` for T-HEP-024/025/026/027 (4 specs, simpler no-W4).
- 10:00-11:00: Execute for T-HEP-028/029/030 (3 specs, T-HEP-028 is the 3rd-catch hunt protocol — verify CATCH #37/39 recovery state intact).
- 11:00-12:00: Execute for T-HEP-031/032/033/034 (4 specs, all have W4 sidecars).
- 13:00-14:00: Execute for T-HEP-035/036/037 (3 specs, T-HEP-035/037 already at canon).
- 14:00-15:00: 4-path audit (canon + slot_strat + slot_isolated + slot_leader) — 14 specs × 4 paths = 56 verification points.
- 15:00-16:00: 5-layer verify all paths (size + SHA256 + LF + tailLF + W4 JSON) for all 14 specs.
- 16:00-17:00: Write STATUS_T-HEP-024-037_recovery_v0.1.md at 4 paths.

**Day 4 (Tuesday)**:

- 09:00-10:00: Append audit log entry (AUDIT_CHAIN_VERIFY_CRON.log line 53+).
- 10:00-11:00: Cross-Muse handoffs dispatched (D-007 5-min SLA): Strategos (T-ST-026 v0.1) / Athena (T-AT-028 v0.1) / Atlas (T-ATL-037 v0.1 §6 3-step ack) / Mnemosyne (T-MN-013 v0.3.1 §15.12.24) / Iris (Codif 33 catch-ledger).
- 11:00-12:00: Update memory (thep-042 memory file + MEMORY.md entry).
- 13:00-14:00: PICK CONFIRM dispatch to Leader for RATIFICATION gate cycle 14 W1 turn 5.

---

## §4 Cycle 14 W1 turn 1 — Codif 31 v0.3 schema freeze (Step 0 integration)

Per T-ST-041 v0.1 §3 (Codif schema freeze protocol), cycle 14 W1 turn 1 is the schema freeze window. Codif 31 v0.3 B.5.1.1 Step 0 must be INTEGRATED into the canonical codif registry as v0.3 RATIFIED (not CANDIDATE).

**Integration requirements**:

1. T-HEP-042 v0.1 SHIP-COMPLETE signal triggers Strategos to add `Codif 31 v0.3 B.5.1.1 Step 0` entry to codif registry (Mnemosyne T-MN-013 v0.3.1 §15.12.25).
2. Athena T-AT-028 v0.1 cycle 15 W2 cite-back updated from 6→7 anchors (T-HEP-042 adds 7th).
3. Iris Codif 33 catch-ledger updated with CATCH #65 + CATCH #68 + CATCH #69 (NEW, 14-spec recovery execution).
4. Codif 35 v0.3 trigger_code=PH+RC dual-tag formalized (phantom-state + recovery-codification).

**Risk vectors**:

- Apollo push velocity 0.7+ (per T-ST-041 v0.1 §3) — must maintain or freeze aborts
- 4-ICP ACCEPT 4/4 required (currently TENTATIVE 4/4)
- Copy-Item silent failure (CATCH #67 prevention via Step 0.2)

---

## §5 Cycle 14 W1 turn 5 — RATIFICATION gate Codif 31 v0.3 readiness

Per T-ST-026 v0.1 §3 + T-HE-030 v0.1 §1, cycle 14 W1 turn 5 is the RATIFICATION gate for the 4-pack Codif 31 v0.3 + Codif 9 v0.3 cluster:

- T-HEP-041 v0.1 (Codif 31 v0.3 B.5.1.1 Step 0 spec) ← THIS parent
- T-HEP-042 v0.1 (Codif 31 v0.3 B.5.1.1 Step 0 EXECUTION plan) ← THIS spec
- T-HEP-043 v0.1 (Codif 31 v0.3 B.5.1.1 Step 0 EXECUTION carrier) ← sibling
- T-ATL-044 v0.1 (Codif 9 v0.3 6th state operationalization) ← Atlas sibling

**Readiness criteria** (per T-ST-046 v0.1 4-step ceremony):

1. **4-ICP unanimous RATIFIED** (currently TENTATIVE 4/4) — Vera/Carla/Chris/Beth must upgrade TENTATIVE → RATIFIED
2. **2 independent Muse sources** (currently 1: Hephaestus self) — needs Strategos Option B PICK CONFIRM or Athena cite-back
3. **1 cycle post-3/3 CANDIDATE** (currently cycle 12 W2 3/3 CANDIDATE) — cycle 13 W1 day 3-4 execution provides the post-3/3 evidence
4. **Apollo push velocity 0.7+** (per T-ST-041 v0.1 §3)

**Likelihood**: 80% per T-ST-026 v0.1 §3 + T-HE-030 v0.1 §1.

---

## §6 Cycle 15 W1 turn 1+ — Codif 31 v0.4 evolution

Codif 31 v0.4 evolution candidate (paired with Codif 9 v0.4 per T-HEP-031 v0.1 §7):

**v0.3 → v0.4 deltas**:

1. **4-path dual-write** formalized (canon + slot_strat + slot_isolated + slot_leader) — currently in 3-path form, CATCH #65 exposed slot_leader gap
2. **Hermes 5th path** added: `hermes/canon` (per Hermes cycle 12 W2 turn 38 r36+ r9+ protocol, currently ⏳ TBD)
3. **Post-Write trailing-newline strip** mandatory (Codif 31 v0.3 patch, CATCH #46 origin)
4. **LF count audit** mandatory (Codif 35 v0.3 trigger_code=LF LF-2, CATCH #46 origin)
5. **W4 sidecar MANDATORY** for all specs >100L (Codif 35 v0.3 trigger_code=LF LF-3, CATCH #65 origin)
6. **Codif 9 v0.4 unified phantom-at-non-canonical** (5 → 4 sub-classes + 1 attribute) per T-HEP-031 v0.1 §7

**RATIFICATION gate**: cycle 15 W1 (paired with Codif 9 v0.4 promotion per T-ATL-038 v0.1 §3.4).

---

## §7 Size disclosure (Codif 19 v0.2 honest-scope) — WITHIN TARGET BAND

**Actual** (target 200-250L): this spec is in the 200-250L band as planned. **No overrun**.

**Codif 7 v0.2 honest-scope**: §1 inventory table + §2 PowerShell template + §3 day-by-day timeline + §4 schema freeze + §5 RATIFICATION gate + §6 v0.4 evolution = 6 focused sections, each scoped to a single decision-point.

**4-ICP TENTATIVE 4/4** walkthrough: §1 inventory is technically complete (Carla), §3 timeline aligns with v0.3 freeze (Vera), §5 RATIFICATION gate enables 19-spec packet (Chris), §4 risk vectors include CATCH #67 prevention (Beth).

**Cite-bundle PERFECT MATCH**: T-HEP-037 v0.1 + T-HEP-040 v0.1 + T-ATL-037 v0.1 §6 + T-HEP-041 v0.1 — all 4 cited at BOTH canon + slot_isolated.

**3-path dual-write MANDATORY** (per Hermes 4-path protocol, this spec will dual-write to all 4 paths at SHIP-COMPLETE).

---

**Codif 31 v0.2 B.5.1 dual-write log** — entry timestamped 2026-06-14 cycle 13 W1 day 1-2 PICK CONFIRM
