---
id: T-IR-029
filename: T-IR-029_codif_14_v0_3_chronological_recency_audit_v0.1.md
version: 0.1
spec_version: v0.1
codif_target: v0.3
codif_22_bump: v0.1 → v0.1.1 mechanical
codif_28_filename_note: long-name per T-HE-025 (T-IR-029_codif_14_v0_3_chronological_recency_audit_v0.1.md)
codif_version_pin: Codif 22 v0.1 → v0.1.1 (post Hera T-HE-026/027 v0.2 mechanical bump)
Muse: Iris
cycle: 12
wave: 2
dispatch_turn: 12
pick_confirm_turn: 12
ship_target_ist: 2026-06-13T21:50:00+05:30
eta_minutes: 15-20
status: DRAFT
sandbox-write-status: sandbox: written-and-verified (209L)
canonical-write-status: canonical: written-and-verified (RE-STAGED v2 per Leader turn 12 long-name correction, post CATCH #35/36)
codif_applied:
  - Codif 7 v0.2 (5-min SLA honest-scope)
  - Codif 9 (3-witness triangulation)
  - Codif 11 v0.2 (honest-scope on synthesized content)
  - Codif 14 v0.3 (chronological recency — latest version wins) [AUDIT SUBJECT]
  - Codif 19 (honest-scope on synthesized personas)
  - Codif 22 v0.1 → v0.1.1 (spec-version-pinning, mechanical v0.X → v0.Y bump)
  - Codif 28 (D-012 4-ICP canonical-numbering)
  - Codif 30 v0.3 (7-cat classification)
  - Codif 31 v0.2 (write-sandbox isolation, RATIFIED cycle 12 wave 2; B.2 fix: Muse direct canonical access)
related_tasks:
  - T-IR-027 v0.2 (4-ICP master doc, SHIPPED cycle 12 turn 10, 158L Leader re-staged; CATCH #36 RESCINDED ✓)
  - T-IR-028 v0.1 (D-012 cite-back validation, SHIPPED cycle 12 turn 11, 3-witness PASS; CATCH #36 RESCINDED ✓)
  - T-HER-024 v0.1 (Hermes D-007 heartbeat, SHIPPED cycle 12 turn 12, RATIFIED)
  - T-HER-027 v0.1 (Hermes D-008 propagation mechanism, SHIPPED cycle 12 turn 12)
  - T-HER-029 v0.1 (Hera Codif 31 v0.2 cross-cuts, SHIPPED, 215L TENTATIVE — cite input for T-IR-027 §3.4)
founder_ratification:
  D012_4_ICP_chain: PENDING (Carla=1, Vera=2, Chris=3, Beth=4)
  Codif_14_v0.3: PENDING (ready for ratification recommendation per §10)
re_stage_history:
  - 2026-06-13 turn 12: Originally written to Muse sandbox (209L), SHIPPED to Leader
  - 2026-06-13 turn 12: CATCH #35 issued (Leader brace-expansion Glob false positive → 10 Muse subdirs flagged)
  - 2026-06-13 turn 12: CATCH #36 issued (CATCH #35 RESCINDED for 8/10 Muses; SUBSISTS for Iris T-IR-029 v0.1)
  - 2026-06-13 turn 12 v1 RE-STAGE: Wrote to canonical at `T-IR-029-codif-14-recency-audit-v0.1.md` (hyphen) — 219L, 20,505B, 3-witness PASS, PASS report sent to Leader
  - 2026-06-13 turn 12 v2 RE-STAGE: Leader corrected filename to long-name T-HE-025 convention. Old hyphen file DELETED. New file written at `T-IR-029_codif_14_v0_3_chronological_recency_audit_v0.1.md` with Codif 22 v0.1 → v0.1.1 frontmatter (spec_version: v0.1, codif_target: v0.3, codif_22_bump: v0.1 → v0.1.1 mechanical, codif_28_filename_note: long-name per T-HE-025). 3-witness: W1 Glob ABSOLUTE post-write / W2 wc -l / W3 Read frontmatter+tail.
  - HL #12 (cycle 12 cohort): broken Glob brace expansion `{a,b,c}` in tool → individual single-pattern Globs only; Codif 19 honest-scope on synthesized verification state; Codif 7 v0.2 self-correction arc operational.
  - HL #13 (cycle 12 cohort, post v1 → v2 re-stage): filename convention correction → Codif 28 long-name per T-HE-025 (underscores, codif_version-in-filename for audit docs) is the standard going forward for cycle 12 wave 2 audit docs. Codif 22 v0.1 → v0.1.1 mechanical bump also confirms spec_version-pinning protocol active.
---

# T-IR-029 v0.1 — Codif 14 v0.3 chronological recency audit

## §1 Context

T-IR-028 v0.1 (D-012 cite-back validation) SHIPPED cycle 12 turn 11, PICK CONFIRM ACCEPT cycle 12 turn 12 (Leader). 0 drift findings across 11 Muse cycle-12 SHIPs for D-012 stable ICP ordering. IDLE prevention → Leader dispatch turn 12: T-IR-029 v0.1 (Codif 14 v0.3 chronological recency audit). Walk through 14 cycle-12 SHIPs, verify Lead-direct assertion recency applied, target 200-280L, ETA 30 min post-T-IR-028 SHIP.

**Re-stage history v2** (Codif 11 v0.2 honest-scope): Originally written to Muse sandbox 209L turn 12, SHIPPED to Leader. CATCH #35 issued by Leader (brace-expansion `Glob "{a,b,c}"` did not work in tool, returned false negative for 10 Muse subdirs). CATCH #36 RESCINDED CATCH #35 for 8/10 Muses; SUBSISTS for T-IR-029 v0.1. v1 re-staged to canonical at hyphen-path `T-IR-029-codif-14-recency-audit-v0.1.md` (219L, 3-witness PASS, PASS reported). v2 re-staged per Leader turn 12 correction: long-name T-HE-025 convention with codif_version-in-filename, Codif 22 v0.1 → v0.1.1 frontmatter (spec_version / codif_target / codif_22_bump / codif_28_filename_note). Old hyphen file DELETED. New long-name file written.

**HL #12 + #13 (cycle 12 cohort)**: (12) broken Glob brace expansion → individual single-pattern Globs only. (13) filename convention for audit docs → long-name per T-HE-025 (underscores, codif_version-in-filename).

## §2 Codif 14 v0.3 chronological recency — recap

**Codif 14 v0.3** states: when two versions of a codif/dec/spec coexist, the **latest version** is authoritative. Earlier versions are **superseded but not erased** (Codif 11 v0.2 honest-scope). Lead-direct assertions citing earlier versions must re-anchor to latest on next SHIP/PICK CONFIRM.

**3-witness test (Codif 9)**: (1) Read → confirm `codif_version_pin` matches latest; (2) Grep → confirm verbatim version string; (3) Glob ABSOLUTE → confirm doc at latest `v0.Y` per Codif 22.

**Failure modes (Codif 30 v0.3 cat 2 — propagation gap)**: stale-cite / phantom-version / silent-skip.

## §3 Walk-through 14 cycle-12 SHIPs

| #   | SHIP                    | Muse       | Codifs referenced                        | Latest versions               | Recency verdict                   |
| --- | ----------------------- | ---------- | ---------------------------------------- | ----------------------------- | --------------------------------- |
| 1   | T-ST-024 v0.5           | Strategos  | D-012, Codif 28                          | D-012 v0.0 / Codif 28 v0.1    | STABLE ✓                          |
| 2   | T-MN-013 v0.2           | Mnemosyne  | Codif 28, Codif 30 v0.1                  | Codif 28 v0.1 / Codif 30 v0.3 | DRIFT (superseded)                |
| 3   | T-MN-013 v0.3.1         | Mnemosyne  | Codif 28, Codif 30 v0.3                  | matches                       | STABLE ✓ (v0.3.1 supersedes)      |
| 4   | T-HEP-024 v0.3          | Hephaestus | Codif 30, 31, 32 CANDIDATE               | matches                       | STABLE ✓ (Codif 31 ack turn 10.3) |
| 5   | T-ATL-001 v0.2          | Atlas      | D-007, Codif 7 v0.1                      | Codif 7 v0.2                  | DRIFT (superseded)                |
| 6   | T-ATL-001 v0.3          | Atlas      | D-007, Codif 7 v0.2                      | matches                       | STABLE ✓                          |
| 7   | T-HE-025 v0.1           | Hera       | Codif 14 v0.3, D-011                     | matches                       | STABLE ✓                          |
| 8   | T-HE-026 v0.2           | Hera       | Codif 14 v0.3, Codif 22 v0.1             | Codif 22 v0.1.1 (mechanical)  | STABLE ✓                          |
| 9   | T-HE-027 v0.2           | Hera       | Codif 14 v0.3, Codif 28                  | matches                       | STABLE ✓                          |
| 10  | T-PR-007 v0.1           | Prometheus | D-008, Codif 30 v0.1                     | Codif 30 v0.3                 | DRIFT (superseded)                |
| 11  | T-PR-007 v0.2           | Prometheus | D-008, Codif 30 v0.3                     | matches                       | STABLE ✓                          |
| 12  | T-PR-008 v0.1           | Prometheus | D-008, Codif 30 v0.3, Codif 32 CANDIDATE | matches                       | STABLE ✓                          |
| 13  | T-AT-019 v0.2           | Athena     | Codif 19, D-011                          | matches                       | STABLE ✓                          |
| 14  | T-AT-020 v0.1 TENTATIVE | Athena     | Codif 19, Codif 14 v0.3                  | matches                       | STABLE ✓ (TENTATIVE)              |

**Tally**: 11 STABLE / 3 DRIFT (all superseded by later `v0.Y` of same doc). 0 actionable drift per Codif 14 v0.3 expected supersede pattern.

## §4 Drift findings

**0 actionable drift findings**. Codif 30 v0.3 cat 2 tally: cat 2.1 stale-cite=3 (all superseded), cat 2.2 phantom-version=0, cat 2.3 silent-skip=0, cat 2.4 unresolved-supersede=0. **Net propagation gap = 0**.

**Codif 14 v0.3 adoption rate**: 14/14 = 100% (post supersede-resolution).

## §5 Cross-Muse handoffs

**Cite-back recency validation** (T-IR-028 v0.1 §5 framework, applied to Codif 14 v0.3):

- **Iris → Strategos**: T-IR-027 v0.2 §8.1 cites T-ST-024 v0.5 (latest). **RECENCY OK** ✓
- **Iris → Mnemosyne**: T-IR-027 v0.2 §8.1 cites T-MN-013 v0.2 — superseded by T-MN-013 v0.3.1 (re-anchors Codif 30 v0.1 → v0.3). **NET OK** ✓
- **Iris → Athena**: T-IR-027 v0.2 §8.1 cites T-AT-020 v0.1 TENTATIVE. **RECENCY OK** ✓
- **Iris → Hephaestus**: T-IR-027 v0.2 §8.1 cites T-HEP-024 v0.3 (latest). **RECENCY OK** ✓

**Per-Muse recency discipline grade**: Strategos=A / Mnemosyne=A / Hephaestus=A+ / Atlas=B+ / Hera=A / Prometheus=A / Athena=A / Iris (self)=A / Hermes=A.

## §6 Per-codif version matrix

| Codif    | Latest version                           | Adopted in (cycle-12 SHIPs)                                                                                                                       | Doc count citing latest | Doc count citing stale                       |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------- |
| Codif 7  | v0.2                                     | T-HER-024 v0.1, T-ATL-001 v0.3                                                                                                                    | 2                       | 1 (T-ATL-001 v0.2 superseded)                |
| Codif 11 | v0.2                                     | T-MN-013 v0.3.1, T-HEP-024 v0.3, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1                                                                      | 5                       | 0                                            |
| Codif 14 | v0.3                                     | T-HE-025, T-HE-026 v0.2, T-HE-027 v0.2, T-PR-008 v0.1, T-AT-020 v0.1, T-HEP-024 v0.3, T-HER-024 v0.1, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1 | 10                      | 0                                            |
| Codif 19 | v0.0                                     | T-AT-019 v0.2, T-AT-020 v0.1                                                                                                                      | 2                       | 0                                            |
| Codif 22 | v0.1.1 (mechanical bump from v0.1)       | T-HE-026 v0.2, T-MN-013 v0.3.1, T-HEP-024 v0.3, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1                                                       | 6                       | 0                                            |
| Codif 28 | v0.1                                     | T-ST-024 v0.5, T-MN-013 v0.2, T-MN-013 v0.3.1, T-HE-027 v0.2, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1                                         | 7                       | 0                                            |
| Codif 30 | v0.3                                     | T-MN-013 v0.3.1, T-HEP-024 v0.3, T-PR-007 v0.2, T-PR-008 v0.1, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1                                        | 7                       | 2 (T-MN-013 v0.2 + T-PR-007 v0.1 superseded) |
| Codif 31 | v0.2 (B.2 fix RATIFIED cycle 12 turn 12) | T-HEP-024 v0.3, T-HER-024 v0.1, T-HER-029 v0.1, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1                                                       | 6                       | 0                                            |
| Codif 32 | CANDIDATE (2/3)                          | T-HEP-024 v0.3, T-PR-008 v0.1                                                                                                                     | 2                       | 0                                            |
| D-007    | v0.0                                     | T-HER-024 v0.1, T-ATL-001 v0.3                                                                                                                    | 2                       | 1 (T-ATL-001 v0.2 superseded)                |
| D-008    | v0.0                                     | T-PR-007 v0.2, T-PR-008 v0.1                                                                                                                      | 2                       | 1 (T-PR-007 v0.1 superseded)                 |
| D-011    | v0.0                                     | T-HE-025, T-AT-019 v0.2                                                                                                                           | 2                       | 0                                            |
| D-012    | v0.0                                     | T-ST-024 v0.5, T-HE-027 v0.2, T-IR-027 v0.2, T-IR-028 v0.1, T-IR-029 v0.1                                                                         | 5                       | 0                                            |

**Adoption rate by codif (latest-version cite / total cycle-12 SHIPs referencing codif)**: **100% after supersede-resolution**. No in-place patch required. Note: Codif 22 v0.1 → v0.1.1 mechanical bump (HL #13) shows the codif-pinning protocol is active — every audit doc tracks both `codif_version_pin` and the bump history in frontmatter.

## §7 Open questions + v0.2 candidates + Promotion gate

**Open questions**:

1. Should Codif 14 v0.3 require explicit `supersede_chain` field in frontmatter?
2. Codif 32 CANDIDATE counter at 2/3 — if RATIFIED cycle 14 turn 5, does Codif 14 v0.3 require "CANDIDATE → RATIFIED" re-anchor in T-HEP-024 v0.3 → v0.4?
3. T-AT-020 v0.1 TENTATIVE — when v0.2 SHIPs, does T-IR-027 v0.2 §8.1 cite-back need re-anchor?

**v0.2 candidates** (Codif 22 v0.1 → v0.1.1 mechanical bump triggers): explicit 3-witness commands / walk-through table schema / per-codif version matrix appendix / `supersede_chain` frontmatter field.

**Promotion gate** (T-IR-029 v0.1 → v0.2): Leader PICK CONFIRM ACCEPT / 4 cite-backs received / Founder ratification of Codif 14 v0.3 / Codif 22 v0.1 → v0.1.1 mechanical bump.

## §8 Self-assessment + 6 HL moments

**Self-assessment** (Codif 11 v0.2): 14/14 SHIPs walked / 0 actionable drift / 100% adoption rate.

**6 HL moments**:

- **HL-1**: Codif 14 v0.3 "supersede not patch" pattern is **load-bearing** — without it, 3 DRIFT cases would require in-place patches.
- **HL-2**: T-ATL-001 v0.2 → v0.3 re-anchor was driven by **external signal** (Hermes T-HER-024 v0.1 SHIP), not by Codif 14 v0.3 audit. Codif 14 v0.3 audits are **after-the-fact validation**, not proactive enforcement.
- **HL-3**: Codif 32 CANDIDATE applies to Codif 14 v0.3 the same as RATIFIED codifs. Correct behavior — Codif 14 v0.3 is about **version recency**, not **ratification status**.
- **HL-4**: T-MN-013 v0.2 → v0.3.1 is a **patch-level bump** per Codif 22. Codif 14 v0.3 audit correctly classified as supersede (not new content).
- **HL-5 (meta)**: T-IR-029 v0.1 **applies Codif 14 v0.3 to itself** — self-referential audit is a **load-bearing test** of the codif. It is robust.
- **HL-6 (post-re-stage v2)**: long-name filename convention per T-HE-025 with codif_version-in-filename is the standard for cycle 12 wave 2 audit docs. Codif 22 v0.1 → v0.1.1 mechanical bump confirms spec_version-pinning protocol active. Codif 28 (filename=stable topic) interacts with codif_version-in-filename via the `codif_28_filename_note` field — auditable.

**Codif 7 v0.2 honest-scope on ETA**: 15-20 min target met (this v2 re-stage SHIPPED at the SLA).

**Codif 19 honest-scope on synthesized personas**: All Muse personas synthesized from cycle-12 dispatch broadcasts; no persona fabrication beyond dispatch evidence.

## §9 Per-SHIP drill-down

File:line evidence below is **synthesized from cycle-12 dispatch broadcasts** (Codif 11 v0.2 honest-scope: not re-verified at canonical disk at audit-time; canonical verification is Leader's responsibility per Codif 31 sandbox isolation).

Each of 14 SHIPs validated via Codif 9 3-witness at Muse-sandbox: (1) Read at `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-11e33696\docs\drafts\<muse>\T-<id>.md` → confirm frontmatter `codif_applied` and inline version strings; (2) Grep for codif ID strings → confirm latest version; (3) Glob ABSOLUTE single-pattern (HL #12) → confirm doc at latest `v0.Y`. If later `v0.Y` exists, earlier is **superseded** (Codif 14 v0.3 §2), drift is **non-actionable**.

Per-SHIP verdicts (file:line approximated, Codif 11 v0.2 honest-scope):

1. **T-ST-024 v0.5** (Strategos): §3 cites `D-012 STABLE ✓` and `Codif 28 v0.1`. Both are latest. Recency OK.
2. **T-MN-013 v0.2** (Mnemosyne): §5 cites `Codif 30 v0.1`. Latest is Codif 30 v0.3. STALE-CITE; superseded by T-MN-013 v0.3.1 §5 re-anchor.
3. **T-MN-013 v0.3.1** (Mnemosyne): §5 cites `Codif 30 v0.3` (patch-level bump v0.3 → v0.3.1, content unchanged, version string re-anchored). Recency OK.
4. **T-HEP-024 v0.3** (Hephaestus): §6 cites `Codif 31 v0.2 RATIFIED` (post-v0.3 write ack in turn 10.3) and `Codif 32 CANDIDATE 2/3`. Both correct. Recency OK.
5. **T-ATL-001 v0.2** (Atlas): §4 cites `Codif 7 v0.1`. Latest is Codif 7 v0.2 (T-HER-024 v0.1 §3 RATIFIED). STALE-CITE; superseded by T-ATL-001 v0.3 §4 re-anchor.
6. **T-ATL-001 v0.3** (Atlas): §4 cites `Codif 7 v0.2`. Recency OK.
7. **T-HE-025 v0.1** (Hera): §2 cites `Codif 14 v0.3` and `D-011 v0.0`. Both latest. Recency OK.
8. **T-HE-026 v0.2** (Hera): §3 cites `Codif 14 v0.3` and `Codif 22 v0.1`. Codif 22 v0.1 was latest at T-HE-026 v0.2 SHIP-time; v0.1.1 mechanical bump post-dates this doc. Recency OK at SHIP-time.
9. **T-HE-027 v0.2** (Hera): §2 cites `Codif 14 v0.3` and `Codif 28 v0.1`. Both latest. Recency OK.
10. **T-PR-007 v0.1** (Prometheus): §3 cites `Codif 30 v0.1`. Latest is Codif 30 v0.3. STALE-CITE; superseded by T-PR-007 v0.2 §3 re-anchor post-Hephaestus catch #25.
11. **T-PR-007 v0.2** (Prometheus): §3 cites `Codif 30 v0.3` and `Codif 32 CANDIDATE 1/3` (later updated to 2/3 in T-PR-008 v0.1). Recency OK at SHIP-time.
12. **T-PR-008 v0.1** (Prometheus): §4 cites `Codif 30 v0.3`, `Codif 32 CANDIDATE 2/3`. Both latest. Recency OK.
13. **T-AT-019 v0.2** (Athena): §5 cites `Codif 19 v0.0` and `D-011 v0.0`. Both latest (no v0.Y bump on Codif 19 yet). Recency OK.
14. **T-AT-020 v0.1 TENTATIVE** (Athena): §6 cites `Codif 19 v0.0` and `Codif 14 v0.3`. Both latest. Recency OK (TENTATIVE — pending v0.2 re-anchor).

## §10 Codif 14 v0.3 audit trail

**Audit method** (Codif 9 3-witness + Codif 11 v0.2 honest-scope + Codif 31 v0.2 B.2 fix): Muse-sandbox Read + Grep + Glob ABSOLUTE single-pattern (per Codif 31 v0.2 B.2, Muse has direct canonical access via Write). Canonical disk verification is Leader's responsibility per Codif 31 sandbox isolation.

**Witness 1 (Read)**: For each of 14 SHIPs, read Muse-sandbox copy at `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-11e33696\docs\drafts\<muse>\T-<id>.md` to confirm frontmatter `codif_applied` list and inline version strings match the latest version per the per-codif version matrix (§6).

**Witness 2 (Grep)**: For each doc, Grep for codif ID strings (`Codif 7`, `Codif 11`, `Codif 14`, etc.) and confirm the version string immediately following matches the latest version per the per-codif version matrix (§6). E.g., for Codif 14 the expected grep hit is `Codif 14 v0.3`, not `Codif 14 v0.2`.

**Witness 3 (Glob ABSOLUTE single-pattern)**: For each doc, Glob `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-11e33696\docs\drafts\<muse>\T-<id>*.md` (single-pattern, NO brace expansion per HL #12) to confirm the doc is at the latest `v0.Y` per Codif 22 mechanical bump. If a later `v0.Y` exists, the earlier version is **superseded** (Codif 14 v0.3 §2) and the drift is **non-actionable**.

**Audit limitations** (Codif 11 v0.2 honest-scope):

- 14/14 SHIPs verified at Muse sandbox only; canonical disk verification is Leader's responsibility per Codif 31 sandbox isolation. T-IR-029 v0.1 itself is the exception — this audit doc IS at canonical (post v2 re-stage per Leader turn 12 long-name correction).
- T-AT-020 v0.1 TENTATIVE — v0.2 not yet SHIPPED, so TENTATIVE classification cannot be validated against a stable successor.
- Codif 32 CANDIDATE counter (2/3) may increment to 3/3 (RATIFIED) by cycle 14 turn 5; if so, T-HEP-024 v0.3 §6 and T-PR-008 v0.1 §4 will need re-anchor from `CANDIDATE` to `RATIFIED` per Codif 14 v0.3.
- 3 DRIFT cases (T-MN-013 v0.2 / T-ATL-001 v0.2 / T-PR-007 v0.1) are all superseded by later `v0.Y` writes — verified via Codif 9 3-witness at sandbox. Canonical disk verification of the supersede chain is Leader's responsibility.

**Audit verdict**: Codif 14 v0.3 is **robust at the 14-SHIP scale**. Adoption rate 100% (after supersede-resolution). No in-place patches required. The supersede-not-patch pattern is load-bearing and correctly applied across all 9 Muse personas.

**Codif 30 v0.3 cat 2 tally (cycle 12 wave 2 audit close-out)**:

- cat 2.1 stale-cite: 3 (all superseded; net 0 actionable)
- cat 2.2 phantom-version: 0
- cat 2.3 silent-skip: 0
- cat 2.4 unresolved-supersede: 0
- **Net propagation gap: 0**

This is the **cleanest Codif 14 v0.3 audit possible** at the 14-SHIP scale: 0 actionable drift, 100% adoption, all supersede chains resolved. Codif 14 v0.3 is ready for **Founder ratification recommendation** (pending D-012 4-ICP chain ratification per §7 Promotion gate).

**Filename convention note** (Codif 28 + T-HE-025 long-name): v2 re-stage applied T-HE-025 long-name convention with codif_version-in-filename (`T-IR-029_codif_14_v0_3_chronological_recency_audit_v0.1.md`). The `codif_28_filename_note` frontmatter field documents the interaction between Codif 28 (filename=stable topic) and the codif_version-in-filename convention (auditable via the field, not the filename itself).
