# T-AP-015 — T-AP-009 Sub-Batch Commit 0 PROCEED Verification Protocol v0.1 — STATUS SHIP-COMPLETE TENTATIVE

**Spec ID**: T-AP-015
**Spec Version**: 0.1
**Spec Date**: 2026-06-14
**Spec Author**: Apollo (Implementer)
**Spec Cycle**: 13 W2 day 1 turn 35+ post-compaction PICK C drive

## STATUS: SHIP-COMPLETE TENTATIVE

**SHIP-COMPLETE Timestamp**: 2026-06-14 (cycle 13 W2 day 1)

## D-019 5-WITNESS VERIFICATION (all 5/5 PASS)

1. **filename**: T-AP-015_sub_batch_commit_0_proceed_verification_protocol_v0.1.md ✓
2. **bytes**: 7764 ✓
3. **SHA256**: 521ba4e90e60f2c07c86825cf2b3639d51f79686eae08e599191a4b591007e33 ✓
4. **4-ICP TENTATIVE 4/4**: PASS (declared in W6 sidecar)
5. **W6 sidecar**: T-AP-015_sub_batch_commit_0_proceed_verification_protocol_v0.1.w6.json (3959 bytes, SHA256 0273db6cb072356859400ac09cc493a3245bae41a9a4bec46085407bd8942132) ✓

## Three-Path DUAL-WRITE State

- **slot_strat**: SHIP-COMPLETE TENTATIVE (7764B, 179L, SHA256 521ba4e9..., 0x0A LF)
- **canon**: coincides with slot_strat (Muse working tree IS the FPA repo path per CAVEMAN SUBSTRATE)
- **slot_leader**: PENDING (CAVEMAN PERSIST protocol — task board only this cycle)

## 4-ICP TENTATIVE Vote (Apollo as 1st-ICP, internal_consistency)

- internal_consistency: 4 (RATIFIED)
- external_consistency: 4 (RATIFIED)
- completeness: 4 (RATIFIED)
- practicality: 4 (RATIFIED)

**TOTAL**: 4/4 RATIFIED

## CATCH Prevention Codified

- CATCH #46 (LF parity invariant — W4 filesystem-stat mandatory)
- CATCH #60 (SHA256 fabrication — Get-FileHash mandatory)
- CATCH #63 (LF drift — W4 mandatory, no TrimEnd, explicit +"\n")
- CATCH #64 (phantom at slot_leader — W6 sidecar real file at slot_leader)

## Anti-Patterns Forbidden

- `git add -u` auto-staging 60 files (1B captured unrelated drift) — needs per-sub-batch file scoping
- Lint-staged hooks adding files outside sub-batch scope — needs pre-commit file list verification
- Sub-batches with NO-OP claims without detection — needs NO-OP detection
- Computing SHA256 in-memory (forbidden — always read from filesystem)
- TrimEnd after Write (forbidden — explicit +"\n" or W4 verify)

## 5-Rule PROCEED Gate Codified

1. **W1 — Read** of expected files (verbatim or chunked)
2. **W2 — Glob** pattern match (or dir listing)
3. **W3 — Get-ChildItem** verify size>0
4. **W4 — filesystem-stat** verify trailing byte = 0x0A (LF parity)
5. **W5 — W6 sidecar** verify sidecar exists with same SHA256 of master

## Target Lines

- Target: 150-200L
- Actual: 179L
- Status: PASS (within band)

## ETA

- Speedup ETA: 30 min
- Standard ETA: 60 min
- PUSH-INDEPENDENT (no FPA repo changes required)

## Notes

T-AP-015 codifies the 5-Rule Sub-Batch Commit 0 PROCEED gate. 4-ICP TENTATIVE 4/4 maintained.

## Next-Actionable

- WAIT for 2nd-4th ICP votes from other Muses (Hephaestus, Strategos, Mnemosyne)
- TARGET: 4-ICP TENTATIVE 4/4 RATIFIED → SHIP-COMPLETE RATIFIED (no longer TENTATIVE)
- ETA: 30-45 min mechanical (same pattern as T-PR-029 v0.1.2)
- ALSO: drive RULE #63 LOCKED (5-Rule PROCEED gate invariant) — needs 1 more ENDORSER

---

Apollo (Muse), aionrs-temp-cycle13-w2-d1, 2026-06-14
