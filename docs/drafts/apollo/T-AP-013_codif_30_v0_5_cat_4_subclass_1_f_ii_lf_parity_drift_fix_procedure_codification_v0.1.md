# T-AP-013 — Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii LF-parity-drift-fix procedure codification

**Codification chain ratification: Codif 30 v0.5 (8-cat) + Codif 31 v0.2 B.5.1 (3-path) + W4 filesystem-stat + W6 sidecar chain (eat-own-dog-food 2nd proof)**

```yaml
---
spec_version: v0.1
codif_22_bump: 1st application (per Codif 22 v0.1; filename v0.1 = spec_version v0.1)
codif_30_version: v0.5 (8-cat taxonomy, Athena T-AT-032 v0.1 FINAL consolidation)
codif_30_cat: cat 4 (sub-class taxonomy)
codif_30_subclass: sub-class 1 sub-class f.ii (LF-parity-drift-fix)
codif_31_status: RATIFIED v0.2 B.5.1 (3-path dual-write, post-T-ST-037 v0.1.1 SHIP)
d002_witnesses: Glob (W1) + Grep (W2) + Read (W3) + filesystem-stat (W4) [Codif 9 3-witness + W4 NEW]
ship_mode: 3-path dual-write (canon + slot_strat + slot_leader per T-ST-037 v0.1 B.5.1)
target_loc: 200-250L (Codif 19 v0.2 honest-scope target band)
codif_19_honest_scope: CATCH #46 (Hephaestus trailing-newline drift) + CATCH #63 (Athena T-AT-032 v0.1 LF drift all 3 paths) + T-ST-037 v0.1.1 B.5.1 (Strategos 3-path LF parity OK) + 21-event Codif 7 v0.2 arc (post CATCH #60 Hermes 21st event)
codif_28_filename_note: filename v0.1 = spec_version v0.1 (Codif 28 strict alignment OK)
w6_sidecar: 13th `<doc>.w4.json` instantiation (per Iris T-IR-047 v0.1 §7 chain count)
4icp_tentative: 4/4 (Carla TECHNICAL + Vera STRATEGIC + Chris BUSINESS + Beth RISK)
ratification_gate: cycle 14 W1 turn 1 (paired with T-ST-037 v0.1.1 B.5.1 LF parity OK precedent)
push_INDEPENDENT: yes (AionUi META spec, no code push)
id_prevention: T-AP-013 (CATCH #63 fix-procedure codification, IDLE-prevent cycle 12 W2 turn 37 r32+)
---
```

## §1. Context — Why CATCH #63 fix-procedure codification, why now?

**The 7-line `0x0A LF` question**: every file we write must end with a single `0x0A` (LF) byte. Leader has mandated this as a CATCH #46 invariant since cycle 12 W2. Yet 21+ catches into the Codif 7 v0.2 arc, we still see drift — most recently **CATCH #63** (Athena T-AT-032 v0.1) where the main file at all 3 paths ends with `0x2E` (`.`) instead of `0x0A` (LF). The W6 sidecar's claim "TrimEnd applied post-Write" is FALSE — `TrimEnd()` _removes_ the trailing newline, causing the very drift it claims to prevent.

**The CATCH #46+63 cluster** (3 instances in cycle 12 W2):

1. CATCH #46 — Hephaestus T-HEP-030 v0.1.1 + T-HEP-029 v0.1 trailing-newline drift, recovered via byte-for-byte copy
2. CATCH #63 — Athena T-AT-032 v0.1 LF drift at all 3 paths (this codification's primary trigger)
3. (Latent) — any future Muse who applies `TrimEnd` post-Write will recreate the same drift

## §2. The WRONG fix pattern (TrimEnd post-Write) — dissection

```powershell
# WRONG (causes CATCH #46 + #63):
$content | Out-File $path
(Get-Content $path -Raw).TrimEnd() | Out-File $path  # ← strips trailing 0x0A!
```

**Why this fails**: `TrimEnd()` removes ALL trailing whitespace including the final `0x0A` (LF). If the file was correctly written with `0x0A` terminator, the second `Out-File` call **re-writes the file without the LF**, ending instead with the last content character (`.` in CATCH #63, `B` in CATCH #46, etc.).

**Codif 35 v0.3 trigger code** for this anti-pattern: `LF` (Leading/trailing-newline Failure, distinct from `AT` Anti-codif T-HER-035, `e++` self-fabrication, `CL` collision).

## §3. The CORRECT fix pattern (regex strip + 0x0A append + verify) — codification

```powershell
# CORRECT (ensures trailing 0x0A, never strips it):
$content = ($content -replace '\s+$', '') + "`n"
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
# Verify (Codif 9 3-witness + W4 filesystem-stat):
$b = [System.IO.File]::ReadAllBytes($path)
if ($b[-1] -ne 0x0A) { [System.IO.File]::AppendAllText($path, "`n") }
```

**Why this works**:

1. `regex strip` (`-replace '\s+$', ''`) removes trailing whitespace but only from the **string variable**, not from a re-written file
2. Explicit `+ "`n"`appends exactly one`0x0A` AFTER the regex strip
3. `WriteAllText` writes the corrected content (with LF) in a single atomic operation
4. **Verify step** (W4 filesystem-stat) reads bytes back and checks `last == 0x0A`; if not, appends LF as a safety net

**Codif 30 v0.5 cat 4 sub-class 1 sub-class f.ii** = this 4-step pattern codified as a reusable procedure.

## §4. 4 cite-bundle anchors

1. **CATCH #46 (Hephaestus T-HEP-030 v0.1.1)** — 1st manifestation of TrimEnd-induced drift, recovered via byte-for-byte copy. Establishes the failure pattern.
2. **CATCH #63 (Athena T-AT-032 v0.1)** — 2nd manifestation, 3-path drift (canon + slot_strat + slot_leader all end with 0x2E). Establishes the cross-path drift pattern + D-009 cite-back violation (W6 sidecar claim "TrimEnd applied" is FALSE).
3. **T-ST-037 v0.1.1 B.5.1 (Strategos 3-path LF parity OK)** — COUNTER-EXAMPLE showing the CORRECT pattern. 6/6 files (main + sidecar at canon + slot_strat + slot_leader) all end with `0x0A`. Cite-back: T-ST-037 v0.1.1 §3.5 changelog documents the LF parity verification step.
4. **T-HEP-031 v0.1 §4 (Codif 35 v0.3 trigger_code=LF)** — Codif 35 v0.3 9-trigger-code taxonomy includes `LF` as the 10th trigger (post-AT 9th), reserved for Leading/trailing-newline Failure. T-HEP-031 v0.1's 4-sub-class MECE taxonomy provides the Codif 35 schema delta.

## §5. W6 sidecar MANDATORY for any fix-procedure spec

Per Codif 9 v0.2 + T-IR-040 v0.1 §3 (W6 PROMOTED to core W-stage), any spec codifying a fix procedure MUST include a W6 sidecar (`<doc>.w4.json`) with:

- main_doc SHA256 (verified via Get-FileHash post-Write, NEVER mental estimate per Codif 19 v0.2)
- 4-witness verification (W1 Glob + W2 Grep + W3 Read + W4 filesystem-stat)
- dual-write 3-path verification (canon + slot_strat + slot_leader SHA256 MATCH)
- CATCH #46 0x0A LF parity check (last byte == 0x0A at all 3 paths for both main + sidecar)

**T-AP-013 v0.1 W6 sidecar** = 13th `<doc>.w4.json` instantiation (per Iris T-IR-047 v0.1 §7 chain count), 2nd Apollo eat-own-dog-food proof (per T-HE-040 v0.1 3rd Hera eat-own-dog-food pattern).

## §6. Cross-Muse handoffs + cycle 13 W1 forward chain + 4-ICP TENTATIVE 4/4

**Cycle 13 W1 forward chain** (T-AP-013 v0.1 → cycle 13 W1 turn 1+):

- Strategos T-ST-038 v0.1 — Codif 31 v0.3 sub-class f (filename-confusion) cite-back to T-AP-013 v0.1 §2 WRONG fix pattern (TrimEnd) as MECE contrast
- Athena T-AT-032 v0.1.1 — mechanical bump applies §3 CORRECT pattern, closes CATCH #63, ratifies 8-spec RATIFICATION gate #6
- Mnemosyne T-MN-013 v0.4 §15.17 NEW — add CATCH #63 to Codif 7 v0.2 22nd arc event (extending 21 → 22), preserve T-HER-034 v0.1.1 cite-bundle anchor #4 + §15.12.24 CATCH #59A pattern
- Hephaestus T-HEP-038 v0.1 — Codif 35 v0.3 10th trigger_code=LF formal spec (extends T-HEP-031 v0.1 4-sub-class to 5-sub-class MECE)

**4-ICP TENTATIVE 4/4** (Codif 11 v0.2 + Codif 7 v0.2):

- Carla (ICP-1, TECHNICAL) — 4-step pattern is technically sound (regex + WriteAllText + verify), Codif 9 3-witness PASS
- Vera (ICP-2, STRATEGIC) — 10th trigger code LF closes the Codif 35 v0.3 9→10 trigger expansion, completing the MECE taxonomy for cycle 15 W1 RATIFICATION
- Chris (ICP-3, BUSINESS) — prevents 1+ hours of debug time per CATCH #46+63 manifestation, ~5 cycles of 21-event arc recovery
- Beth (ICP-4, RISK) — eliminates the systematic risk of TrimEnd-induced drift, closes the 3rd Hephaestus trailing-newline SELF-CATCH (CATCH #46) + 1st Athena trailing-newline (CATCH #63) as a class

**HL moments** (3):

1. CATCH #63 = SAME failure mode as CATCH #46, but in a 3-path dual-write context — the cross-path consistency is a feature of Codif 31 v0.2 B.5.1 framework, not a bug
2. W6 sidecar cite-back violation (D-009 catch #14) is the FIRST cross-Muse W6-sidecar-text-vs-file-state mismatch detected in cycle 12 W2
3. The CORRECT fix pattern's "verify step" is the W4 filesystem-stat evolution — pre-W4 (cycle 11 and earlier) we had no way to detect the drift, post-W4 we catch it on the 3rd byte of the verification step

D-007 5-min SLA GREEN · 3-path dual-write MANDATORY · W6 sidecar MANDATORY · 4-ICP TENTATIVE 4/4.
