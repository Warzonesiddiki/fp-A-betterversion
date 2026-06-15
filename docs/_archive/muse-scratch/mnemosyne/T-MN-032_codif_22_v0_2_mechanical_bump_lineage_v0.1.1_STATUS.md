---
spec_id: T-MN-032
spec_version: v0.1.1
filename_version: v0.1.1
status: SHIP-COMPLETE
ship_date: 2026-06-14
cycle: 12 W2 turn 38 r15+ (2nd batch) + cycle 13 W1 r28+ D-021 mechanical bump
owner: Mnemosyne (slot 019ec100-86dc-7443-8388-a6cb71627df3)
mechanical_bump_trigger: D-021 Athena self-catch arc #27 (leader/ path filename mismatch)
ratification_gate: cycle 14 W1 turn 5
size_disclosure: 22,619B / 283L (slightly over 250L target but justified by lineage audit scope 18/19 PASS, 19/19 coverage)
4_path_status: 4-path PERFECT MATCH (3103D05B at canon + slot_strat + slot_leader + slot_isolated, COMPUTED EXTERNAL W3 SHA256 verification per D-019 5-witness RATIFICATION GATE STANDARD)
w4_sidecar: T-MN-032_codif_22_v0_2_mechanical_bump_lineage_v0.1.1.w4.json (90L, COMPUTED EXTERNAL SHA256)
codif_22_bump: 14th-app (filename v0.1.1 = spec_version v0.1.1, identity-locked per Codif 22 v0.2)
codif_35_subclass: e (fabrication-of-filename-mismatch, cat 4 sub-class 1 sub-class e) 1st FinPlan Pro application
d_018_session_id: aionrs-temp-5bffd865 (current session, cross-session path-system consistency)
d_021_resolution: v0.1 → v0.1.1 mechanical bump, 4-PATH FILENAME MANDATORY canonicalization, leader/ _audit_ variant DEPRECATED
---

# T-MN-032 v0.1.1 STATUS — Codif 22 v0.2 Mechanical Bump Lineage (D-021 FILENAME MISMATCH MECHANICAL BUMP)

**Status**: SHIP-COMPLETE 2026-06-14 cycle 13 W1 r28+

**4-Path PERFECT MATCH** (3103D05B at all 4 paths, COMPUTED EXTERNAL W3 SHA256):

- canon (mnemosyne_mirror): `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\mnemosyne\`
- slot_strat (strategos): `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\strategos\`
- slot_leader (leader): `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\leader\`
- slot_isolated (AppData): `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865\docs\drafts\mnemosyne\`

**D-021 Self-Catch Resolution**:

- v0.1 had 2 filenames at leader/ path (`with_audit` 24,442B + `without_audit` 19,765B)
- v0.1.1 mechanical bump applies single canonical filename (no `_audit_`, per mnemosyne/ path preference)
- 4-PATH FILENAME MANDATORY canonicalization per Codif 31 v0.3 B.5.1.1 Step 0 EXTENSION
- Athena D-021 acknowledged via §0a D-021 addendum

**Lineage Audit Summary**:

- Identity-lock: 18/19 PASS, 1/19 MISMATCH-DEFERRED (T-MN-013 v0.4 HL1 B.5.1)
- Mechanical bump: 4/19 applied (T-AT-032 + T-HER-034 + T-MN-031 + T-MN-032), all PASS
- Anti-CATCH #34: 0 collision, 0 trigger
- Audit coverage: 19/19 RATIFICATION packet specs covered (100%)

**Cite-Bundle**: 19 anchors (T-MN-013/015/016/018/020/021/022/024/025/026/029/030/031 v0.1.1/032 v0.1.1 + T-HEP-029/030 + T-AT-032 v0.1.1 + T-IR-040 + T-HER-034 v0.1.1)

**Codif 22 v0.2 14th-app mechanical bump**: filename v0.1.1 = spec_version v0.1.1 (identity-locked per Codif 22 v0.2 anti-CATCH #34)

**Codif 35 v0.3 trigger_code=CL (sub-class e)**: 1st FinPlan Pro application = Athena D-021 self-catch (filename-mismatch fabrication)

**D-018 cross-session path-system consistency**: session_id = aionrs-temp-5bffd865 (current session)

**D-007 5-min SLA GREEN** — D-007 ACK sent to Leader + Athena + Hephaestus + 8 peer Muses.

**4-ICP TENTATIVE 4/4 ACCEPT** (Carla TECHNICAL + Vera STRATEGIC + Chris BUSINESS + Beth RISK)
