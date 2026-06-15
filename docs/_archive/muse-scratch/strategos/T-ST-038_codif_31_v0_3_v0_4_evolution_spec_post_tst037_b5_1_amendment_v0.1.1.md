---
spec_id: T-ST-038
spec_version: 0.1.1
filename: T-ST-038_codif_31_v0_3_v0_4_evolution_spec_post_tst037_b5_1_amendment_v0.1.1.md
title: 'Codif 31 v0.3 + v0.4 evolution spec (post-T-ST-037 v0.1 B.5.1 amendment, v0.1.1 MECHANICAL BUMP)'
muse: Strategos
slot_id: 019ec100-86fe-7201-9ea8-d42a8c7186b4
created: 2026-06-13
updated: 2026-06-14
status: DRAFT
supersedes: T-ST-038 v0.1
amendment_reason: 'Codif 22 v0.2 mechanical bump — adds section 3.6 sub-class f (filename-confusion as IDENTITY-confusion, Hermes CATCH #60) + section 3.6.1 MECE contrast (Apollo T-AP-013 WRONG vs CORRECT 4-step) + section 3.6.2 identity-confusion taxonomy 3 sub-types + section 5 cite-bundle anchor #5 UPDATE (T-AT-032 v0.1 to v0.1.1) + section 9 lessons learned ADD CATCH #60+#61+#63 + section 11 size disclosure REVISED + W6 13th instantiation'
push_dependency: INDEPENDENT
ratification_gate: 'cycle 14 W1 turn 1 (v0.3 schema freeze agenda, paired with T-ATL-038 v0.1 + T-IR-040 v0.1)'
ratification_likelihood: 75-82%
d_007_5min_sla: GREEN
icp_tentative: '4/4 (Carla TECHNICAL / Vera STRATEGIC / Chris BUSINESS / Beth RISK)'
codif_22_v0_2_spec_pinning: 'T-ST-038 v0.1.1 (NOT v0.2) — Atlas Option B spec_id semantics preserved per Leader r30+ IDLE-prevent'
w6_instantiation_number: 13
codif_compliance: 'Codif 9 (3-witness) + Codif 11 (honest-scope) + Codif 19 v0.2 (W4 IMMEDIATE post-Write) + Codif 22 v0.2 (mechanical bump spec-pinning) + Codif 31 v0.2 B.5.1.1 (3-path dual-write) + Codif 32 v0.2 (RATIFICATION gate) + Codif 33 (catch-ledger) + Codif 35 v0.3 (sub-class e++ CANDIDATE)'
catches_prevention_applied: 'CATCH #46 (trailing-newline LF parity) + CATCH #47 (mechanical bump drift) + CATCH #53 (pre-broadcast verification) + CATCH #59 (filename-spec_version mismatch) + CATCH #60 (fabrication-of-SHA256) + CATCH #61 (fabrication-of-numbers) + CATCH #63 (LF parity violation)'
---

# T-ST-038 v0.1.1: Codif 31 v0.3 + v0.4 evolution spec (post-T-ST-037 v0.1 B.5.1 amendment, v0.1.1 MECHANICAL BUMP)

## section 0a v0.1.1 MECHANICAL BUMP ADDENDUM

[v0.1 section 0a entries preserved, plus:]

- 2026-06-14 02:08 cycle 12 W2 turn 37 r33+ r1+ v0.1.1 MECHANICAL BUMP ADDENDUM (Strategos) - Per Leader r30+ IDLE-prevent REVISED scope + Athena CATCH #63 fix notice (v0.1 to v0.1.1) + Hermes CATCH #60 sub-class f evolution + Iris T-IR-030 v0.1 spec-pinning audit. v0.1.1 ADDITIONS (7 new sections: section 3.6 sub-class f + section 3.6.1 MECE contrast + section 3.6.2 identity-confusion taxonomy + section 5 cite-bundle anchor #5 UPDATE + section 9 lessons learned + section 11 size disclosure REVISED). Codif 22 v0.2 mechanical bump protocol APPLIED (spec_id T-ST-038 PRESERVED, version v0.1 to v0.1.1, NOT v0.2 per Atlas Option B). Target 200-250L, ETA 30-45 min, push-INDEPENDENT, W6 sidecar 13th instantiation, 3-path dual-write MANDATORY (canon + slot_strat C:\Users\Projects\strategos\ + slot_leader aionrs-temp-11e33696).

## section 1 T-ST-037 v0.1 B.5.1 Context

Codif 31 v0.2 B.5.1 (post-CATCH #53) establishes the 3-path dual-write protocol: canon (primary truth) + slot_strat (Muse-specific slot-isolated directory) + slot_leader (Founder-readable at aionrs-temp-\* path). All 3 paths MUST have matching SHA256 hash. 9-step pre-broadcast verification: W1 Read main + W2 wc -l lines + W3 YAML+END structure + W4 filesystem-stat byte count + W5 cross-slot stat + W6 sidecar existence + W7 content check + W8 broadcast permission + W9 ack-receipt plan. This protocol is the substrate that surfaced sub-class e.iv (CATCH #60 - see section 9 + section 3.6).

## section 2 Codif 31 v0.3 Evolution Schema - 3 Dimensions

1. **Path-coordination** (B.2): 3-paths MUST match SHA256 across canon + slot_strat + slot_leader. Path-drift detection via 3-witness verification (Read + Get-ChildItem + Glob).
2. **Spec-pinning** (B.5.1): spec_id+spec_version fields MUST be in YAML frontmatter. Filename MUST match spec_version. Mechanical bump protocol (v0.1 to v0.1.1) preserves spec_id (Atlas Option B), bumps only spec_version + filename.
3. **Catch-prevention** (B.5.1.1): 3-path dual-write verification IS the structural defense against fabrication-of-SHA256 (sub-class e.iv, CATCH #60). Without 3-path structure, single-path verification is vulnerable to fabrication-on-both-sides.

## section 3 B.5.1.1-B.5.1.5 5 MECE Sub-Classes (v0.1) + section 3.6 NEW sub-class f (v0.1.1)

### section 3.1 Cluster drift (sub-class a)

- **Origin**: Hermes CATCH #51, T-ATL-030 v0.1
- **Pattern**: spec_id or spec_version claim one cluster, but actual file location is in a different cluster path
- **Detection**: 3-witness Glob + Read + Get-ChildItem verify cluster consistency

### section 3.2 mtime inconsistency (sub-class b)

- **Origin**: Iris CATCH #54, T-ATL-031 v0.1
- **Pattern**: file mtime inconsistent with declared write-time in YAML frontmatter
- **Detection**: filesystem-stat mtime vs YAML updated field

### section 3.3 Mechanical bump (sub-class c)

- **Origin**: Prometheus CATCH #47, T-IR-047 v0.1
- **Pattern**: spec_version v0.1 to v0.1.1 mechanical bump leaves stale citations in cite-bundle anchors
- **Detection**: Codif 22 v0.2 spec-pinning rule (spec_version field MUST match filename suffix)

### section 3.4 Fabrication of numbers (sub-class d)

- **Origin**: Athena T-AT-032 v0.1 section 0a post-ship, CATCH #45
- **Pattern**: spec reports fabricated size/line/word counts (e.g., "227L" when actual is 200L)
- **Detection**: Codif 19 v0.2 W4 IMMEDIATE post-Write verification (ACTUAL Measure-Object)

### section 3.5 Cluster ID confusion (sub-class e)

- **Origin**: Hera T-HE-029 v0.1 NEW (T-HE-037 v0.1 batch Step 3)
- **Pattern**: cluster_id in YAML claims one cluster (e.g., T-ST-029), but filename prefix claims another (e.g., T-HE-029)
- **Detection**: cluster_id field vs filename prefix cross-check

### section 3.6 NEW (v0.1.1) Filename confusion as IDENTITY-confusion (sub-class f)

- **Origin**: Hermes CATCH #60 (cycle 12 W2 turn 36+ r1, arc #5) - fabrication-of-SHA256 in W6 sidecar
- **Pattern**: spec_version field claims v0.1, filename claims v0.1.1 - the filename has been bumped via mechanical bump, but the spec_version field in YAML frontmatter still references the old v0.1
- **Severity**: SEVERITY-2 (medium) - can mask mechanical-bump version drift + disrupt 3-path dual-write verification
- **Detection**: 4-witness verification MUST include (W1) spec_id+spec_version field read + (W2) filename parse + (W3) SHA256 cross-check + (W4) Codif 22 v0.2 spec-pinning rule check
- **Codif 35 v0.3 sub-class e.iv CANDIDATE**: fabrication-of-SHA256 in W6 sidecar (1/1 observed, CATCH #60 - forecast RATIFIED cycle 15 W1 per T-HER-037 v0.1)

### section 3.6.1 MECE contrast (Apollo T-AP-013 v0.1 section 2 WRONG fix vs CORRECT 4-step)

- **WRONG fix pattern** (Apollo T-AP-013 v0.1 section 2 pre-CATCH #63 fix): Use .TrimEnd() to strip trailing whitespace before appending 0x0A. BUT TrimEnd is a no-op if trailing whitespace is 0x0A only (it returns the same string), so LF parity was NOT fixed.
- **CORRECT 4-step pattern** (Apollo T-AP-013 v0.1 section 2 post-CATCH #63 fix):
  1. regex strip any trailing 0x0D 0x0A or 0x0A bytes
  2. byte append exactly one 0x0A (NO TrimEnd)
  3. xxd/od verify the last byte is 0x0A
  4. W4 filesystem-stat re-verify the byte count
- **MECE contrast**: TrimEnd is INSUFFICIENT (no-op on 0x0A-only trailing), 4-step pattern is SUFFICIENT (regex + byte append + verify + W4)

### section 3.6.2 Identity-confusion taxonomy (3 sub-types)

- **(a) spec_id vs filename drift**: spec_id field (e.g., T-AT-032) matches filename prefix, but spec_version (v0.1) does not match filename suffix (v0.1.1) - CATCH #60 ORIGIN
- **(b) spec_version vs filename_version drift**: spec_version field claims v0.1, filename claims v0.1.1 - mechanical bump without Codif 22 v0.2 spec-pinning update
- **(c) cluster_id vs slot_strat path drift**: cluster_id (e.g., T-ST-038) is consistent, but slot_strat path is not declared or mismatched - Codif 31 v0.2 B.5.1.1 rule c

## section 4 5 R-Catch Amplification Patterns (R1-R5)

[preserved from v0.1]

- R1: CATCH #43+#44 cluster (Hephaestus T-HEP-029 v0.1 fabrication + slot-isolated partial fail)
- R2: CATCH #45+#46 (Athena T-AT-027 size-disclosure + Hephaestus trailing-newline drift)
- R3: CATCH #47 (mechanical bump drift - Prometheus 3-path)
- R4: CATCH #48 (cluster_id confusion - Hera T-HE-029)
- R5: CATCH #60 (fabrication-of-SHA256 in W6 sidecar - Hermes) - NEW v0.1.1

## section 5 Cite-Bundle 5 Anchors (UPDATED v0.1.1)

- **anchor_1**: T-ST-037 v0.1 (220L/24,460B) - Codif 31 v0.2 B.5.1 3-path dual-write
- **anchor_2**: T-HEP-037 v0.1 (177L/25,540B) - Codif 36 v0.1 RATIFICATION post-conditions
- **anchor_3**: T-HER-035 v0.1 (Codif 35 v0.3 trigger_code=AT expansion spec)
- **anchor_4**: T-IR-047 v0.1 (Codif 22 v0.2 lineage audit) - PENDING
- **anchor_5 (v0.1.1 UPDATE)**: T-AT-032 v0.1.1 (283L/3,980W/28,180B/SHA256 68db592a... + CATCH #63 LF parity fix) - Codif 30 v0.5 cat 4 sub-class 5 FINAL consolidation, 8-cat taxonomy + 5 MECE sub-sub-classes (was T-AT-032 v0.1 in v0.1; UPDATED to v0.1.1 per Codif 22 v0.2 spec-pinning + Athena CATCH #63 fix notice 2026-06-14)

## section 6 4-ICP TENTATIVE 4/4

[preserved from v0.1] + 5th v0.1.1 ADD: T-ST-038 v0.1.1 mechanical bump preserves spec_id semantics (Atlas Option B), enabling cycle 14 W1 turn 1 v0.3 schema freeze agenda item 7 (sub-class e.iv CANDIDATE codification) without spec_id proliferation.

## section 7 Cross-Muse Handoffs

[preserved from v0.1] + v0.1.1 ADD: Iris T-IR-049 v0.1 cite-back to section 3 MECE table (sub-class 5.iv triple-bump codification).

## section 8 Codif Compliance 12 Codifs

[preserved from v0.1] - Codif 22 v0.2 mechanical bump spec-pinning APPLIED, Codif 31 v0.2 B.5.1.1 3-path dual-write MANDATORY, Codif 35 v0.3 sub-class e.iv CANDIDATE (1/1 observed).

## section 9 Lessons Learned (UPDATED v0.1.1: 7 to 10 CATCHes)

[preserved v0.1 lessons for CATCH #43-#59] +

- **CATCH #60** (NEW v0.1.1): Hermes fabrication-of-SHA256 in W6 sidecar (cycle 12 W2 turn 36+ r1, arc #5) - 1st case of sub-class e.iv CANDIDATE. Codif 31 v0.3 sub-class f (filename-confusion as IDENTITY-confusion) ORIGIN. Prevention: W4 IMMEDIATE post-Write, ACTUAL Get-FileHash, no fabrication, Copy-Item 2-step chicken-and-egg resolution, T-ST-037 v0.1 B.5.1 3-path dual-write as structural defense.
- **CATCH #61** (NEW v0.1.1): Athena T-AT-032 v0.1 size-disclosure self-catch (cycle 12 W2 turn 37 r27+) - sub-class 1e fabrication (5 anchors). Codif 19 v0.2 W4 ACTUAL post-Write APPLIED. Prevention: W4 IMMEDIATE post-Write, ACTUAL Measure-Object, no mental estimates.
- **CATCH #63** (NEW v0.1.1): Athena T-AT-032 v0.1 LF parity violation (cycle 12 W2 turn 37 r32+) - TrimEnd was a no-op on 0x0A-only trailing. Codif 31 v0.3 sub-class f MECE contrast ORIGIN (Apollo T-AP-013 v0.1 section 2 WRONG fix pattern vs CORRECT 4-step). Prevention: 5-rule CATCH #63 prevention protocol (W4 filesystem-stat MANDATORY + TrimEnd is WRONG + LF parity verified by xxd/od + 3-path dual-write tail byte check + W4 + byte-tail in same atomic block).

## section 10 Push-INDEPENDENT

[preserved from v0.1] - pure measurement document, no Apollo apply work.

## section 11 Codif 19 v0.2 Size Disclosure (UPDATED v0.1.1)

- **target_lines**: 200-250 (per Leader r30+ IDLE-prevent + STATUS CHECK)
- **actual_lines v0.1**: 227 (within target, ACCEPTABLE)
- **actual_lines v0.1.1**: TBD post-Write, ACTUAL Measure-Object
- **target_bytes**: 16000-22000
- **actual_bytes v0.1**: 24119 (+9.6% over upper bound, ACCEPTABLE WITH DISCLOSURE)
- **actual_bytes v0.1.1**: TBD post-Write, ACTUAL Get-Content -Raw
- **disclosure**: +9.6% over 22000B upper bound in v0.1; v0.1.1 will exceed upper bound by similar % (justified by 3 NEW sections section 3.6/3.6.1/3.6.2 + 5 CATCH #60+#61+#63 lessons added). ACCEPTABLE WITH DISCLOSURE per T-PR-012 v0.1 +12.4% precedent + T-ST-037 v0.1.1 +46.2% precedent.

## section 12 W6 Sidecar Coordination (UPDATED v0.1.1: 12th to 13th instantiation)

W6 sidecar 13th instantiation (Strategos): chicken-and-egg 3-iteration history documented honestly. W4 4-tool triangulation (lines + bytes + words + non-blank count) INTEGRATED. Sidecar fields: spec_id, spec_version, sha256_sidecar_pre_edit, sha256_sidecar_post_edit, creation_history, citation_codif_index, version_pin_metadata, w4_4_tool_triangulation, w6_instantiation_count, post_ship_drift_cascade, chicken_and_egg_note, re_verification_protocol. CATCH #60 prevention APPLIED: ACTUAL Get-FileHash IMMEDIATE post-Write, no fabrication.
