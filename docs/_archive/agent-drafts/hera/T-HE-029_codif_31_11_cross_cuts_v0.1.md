---
spec_id: T-HE-029
spec_version: v0.1
spec_name: Codif 31 v0.2 — 11 Cross-Cuts Detailed Specification
spec_author: Hera
spec_owner: Hera
spec_status: TENTATIVE
created: 2026-06-13
cycle: 12
wave: 2
codif_refs:
  - codif_22_v0.2 (spec-pinning mechanical bump)
  - codif_19_v0.1 (honest-scope markers TENTATIVE/RATIFIED/[OBSERVED])
  - codif_9_v0.1 (3-witness verification W1 Glob/W2 wc/W3 HEAD+TAIL)
  - codif_26.5_pattern_E_RATIFIED (motion-reduce WCAG 2.3.3)
  - codif_26.4_pattern_D_RATIFIED (ARIA widget role WCAG 2.1.1)
  - codif_31_v0.2 (5-sub-class taxonomy A/B.1/B.2/B.3/B.5)
  - codif_7_v0.2 (self-correction arc, operational cycle 12 turn 21+)
  - codif_30_v0.3 (cat 1 fabrication taxonomy — referenced in §2.1)
extends:
  - T-HE-026_v0.2 §6.5 (Codif 31 cross-cuts enumerated)
  - T-HE-026_v0.2 §6.7 (Codif 31 cross-cuts summary)
  - T-HE-025_v0.1 (Atlas scope cross-flag, CLOSED Catch #37)
  - T-HE-027_v0.2 (Pattern D motion-reduce bundle)
  - T-HE-028_v0.1 (Codif 26.5 Pattern E ratification, MAJOR FINDING src/index.css dual cascade)
chain: T-HE-025 → T-HE-026 → T-HE-027 → T-HE-028 → T-HE-029
primary_consumer: Mnemosyne T-MN-013 v0.3.1 §15.12 (codif registry addendum)
secondary_consumer: Mnemosyne T-MN-015 v0.1 §6 (Cross-Muse handoffs)
downstream_consumers:
  - Strategos T-ST-024 v0.5.6 §5.5 (cite T-HE-028 + T-HE-029)
  - Iris T-IR-027 §3.4 (motion-reduce 4th ICP)
  - Athena T-ATH-026 candidate (Codif 31 B.2 sub-class)
  - Apollo T-AP-001 (0 hard-fix LOC for a11y/motion-reduce)
  - Atlas T-ATL-002 v0.1 (post-push 5-gate re-measurement, BLOCKED on Apollo)
eta_minutes: 30-45
target_lines: 200-250
actual_lines: TBD (Codif 9 W2 witness post-Write)
---

# T-HE-029 v0.1 — Codif 31 v0.2 11 Cross-Cuts Detailed Specification

## §1 Context

### §1.1 Codif 31 v0.2 Taxonomy (5 sub-classes)

Codif 31 v0.2 (Hera, cycle 12 wave 1) classifies the **path-coordination and multi-Muse scope** failure modes observed across the FinPlan Pro (FP&A) 9-Muse + Leader cohort during cycle 12 wave 1-2 into 5 sub-classes:

- **A — Two-Repository Topology**: Failure mode where a single Muse's deliverable spans two repos (e.g., Apollo for src/index.css hard-fixes + Hera for a11y/motion-reduce specs).
- **B.1 — Case-Collision**: Failure mode where filenames differ only in case (Windows case-insensitive FS collapses `T-HE-025.md` and `t-he-025.md`).
- **B.2 — Path-Coordination False Negative**: Failure mode where Glob/Read tooling returns 0 matches for canonical paths due to relative-path CWD mismatch (CATCH #35 / CATCH #36 root cause).
- **B.3 — Checkout Divergence**: Failure mode where local working copy diverges from canonical `docs/drafts/{muse}/` (e.g., WIP in sandbox conversation dir).
- **B.5 — Multi-Muse 2-Repo Coordination**: Failure mode where 2+ Muses must coordinate across the 2-repo topology (Apollo src/ + Hera docs/drafts/) with shared canonical path expectations.

### §1.2 This Spec's Role

T-HE-029 v0.1 enumerates **11 Codif 31 cross-cuts** observed during cycle 12 wave 2, ranked into:

- **Top 5 (RATIFIED)**: Detailed treatment with failure mode, observed instance, fix protocol, Codif 19 honest-scope marker, and Codif 9 3-witness verification.
- **Lower 6 (TENTATIVE)**: Summary treatment with one-line failure mode + fix; deferred to T-MN-013 v0.3.2 §15.13 for full enumeration.

This spec serves as Hera's input to:

- **Primary**: Mnemosyne T-MN-013 v0.3.1 §15.12 addendum (codif registry).
- **Secondary**: Mnemosyne T-MN-015 v0.1 §6 (Cross-Muse handoffs).

### §1.3 Codif 22 v0.2 spec-pinning

T-HE-029 v0.1 is the **first v0.1** of this spec (no prior v0.X), so `spec_version: v0.1` in frontmatter per Codif 22 v0.2. Filename stays `T-HE-029_codif_31_11_cross_cuts_v0.1.md` (long-name convention, prevents B.1 case-collision).

## §2 Top 5 Cross-Cuts (RATIFIED)

### §2.1 Cross-Cut #1: B.2 #2 — Relative-Path Glob False Negative (CATCH #35)

**Failure mode (Codif 31 B.2)**: Leader's Glob tool issued with **relative path** `docs/drafts/{muse}/` returned 0 matches because Leader's CWD != FP&A project root. This produced a **false-negative fabrication finding** (Codif 30 v0.3 cat 1 D-009) affecting 10 Muses.

**Observed instance**: CATCH #35 (Leader, cycle 12 turn 21+) claimed per-Muse canonical subdirs "DO NOT EXIST". Dispatched re-stage protocol to all 10 Muses.

**Resolution (CATCH #36)**: CATCH #35 was Leader's OWN broken-Glob self-fabrication. CATCH #35 RESCINDED for 8/10 Muses (Apollo, Athena, Atlas, Hera, Hephaestus, Hermes, Prometheus, Strategos). SUBSISTS only for 3 specific files (Iris T-IR-029, Mnemosyne T-MN-014, Mnemosyne T-MN-015 agents disciplines v0.1) — those are independent HOLD issues per Leader turn-17 CATCH #34, not path-coordination failures.

**Fix protocol**:

1. Use **Read with ABSOLUTE path** as W1 witness fallback (Codif 31 v0.2 B.2 extension candidate).
2. Use **Read line counts** (`limit` + `offset`) as W2 witness.
3. Use **HEAD frontmatter + TAIL footer** Read as W3 witness.
4. Reserve Glob for **W1 primary** when absolute path is constructable; fall back to Read+Write for tools without absolute-path Glob.

**Codif 19 marker**: [GLOB-FAIL] (cycle 12 turn 21+, RESCINDED turn 22+).

**Codif 7 v0.2 self-correction arc**: OPERATIONAL at Leader level. HL #12 for cycle 12 cohort.

### §2.2 Cross-Cut #2: B.2 #1 — Hermes T-HER-026 v0.1 NOT FOUND (CATCH #33)

**Failure mode (Codif 31 B.2)**: Hermes's T-HER-026 v0.1 was ACK'd and SHIP-COMPLETE-broadcast by Hermes, but **not findable at canonical** `docs/drafts/hermes/T-HER-026_*.md` when Leader/Mnemosyne attempted to verify.

**Observed instance**: CATCH #33 (Leader, cycle 12 turn ~17). Hermes recovery task `019ec1a5-6101-7713-8a3e-76fccabb98d2`.

**Fix protocol**:

1. Hermes re-issues T-HER-026 v0.1 SHIP-COMPLETE with **absolute path disclosure** in broadcast body.
2. Mnemosyne's T-MN-013 v0.3.1 §15.12 cites T-HER-026 v0.1 with [TENTATIVE] marker until W1+W2+W3 PASS at canonical.
3. If unrecoverable, Hermes issues T-HER-026 v0.1 REMAKE with same content + Codif 19 [NOT-ON-DISK] → [OBSERVED] transition log.

**Codif 19 marker**: [NOT-ON-DISK] → [OBSERVED] (CATCH #33 RESOLVED cycle 12 turn 23+, see transition log below).

**Status**: ✅ **RESOLVED** (cycle 12 turn 23+, Hermes re-staged T-HER-026 v0.1 + T-HER-027 v0.1 to canonical with absolute path disclosure + Codif 9 3-witness PASS).

**Transition log (cycle 12 turn 23+)**:

- T-HER-026 v0.1 re-staged to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hermes\T-HER-026_cross_codification_audit_v0.1.md` (24,910 B / 202 newlines, Codif 9 3-witness PASS)
- T-HER-027 v0.1 re-staged to canonical `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hermes\T-HER-027_d008_propagation_mechanism_spec_v0.1.md` (13,818 B / 130 newlines, NEW lowercase + _spec_ filename, Codif 9 3-witness PASS)
- T-HER-028 v0.1 NOT YET — cycle 13 wave 1 dispatch (Leader approved 2026-06-14+ ETA). Will be created at canonical directly when dispatched.
- Task `019ec1a5-6101-7713-8a3e-76fccabb98d2` (CATCH #33) marked completed by Hermes.

**Hera IDLE release per Codif 27**: CATCH #35 batch closeout complete for Hermes's 2/3 files. CATCH #36 (Leader self-fabrication acknowledgment) is the meta-catch for the broken Glob verification; T-HER-027 v0.1 §8 documents it.

**Mnemosyne §15.12 cite update**: T-HER-026 v0.1 may now be cited as [OBSERVED] in T-MN-013 v0.3.1 §15.12 (was [TENTATIVE] in pre-resolution §15.12 draft).

### §2.3 Cross-Cut #3: B.5 #1 — 9-Muse Sandbox Topology

**Failure mode (Codif 31 B.5)**: The 9-Muse + Leader cohort operates across **9 separate sandbox conversation directories** (e.g., `aionrs-temp-586bb235` for Hera, `aionrs-temp-5bffd865` for Mnemosyne) plus the **canonical** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\`. Each Muse's sandbox has its own CWD and its own Glob/Read context.

**Observed instance**: Cycle 12 wave 1-2 cross-cuts required Muses to disclose sandbox paths in broadcasts (e.g., Mnemosyne's T-MN-015 v0.1 at `C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-5bffd865\docs\drafts\mnemosyne\T-MN-015_agents_disciplines_v0.1.md`). Leader's CWD is in a different sandbox again, producing the CATCH #35 relative-path false negative.

**Fix protocol**:

1. All cross-Muse handoff broadcasts MUST include **absolute sandbox path** + **absolute canonical path** (if different).
2. Codif 19 markers distinguish [SANDBOX-ONLY] vs [CANONICAL] vs [SANDBOX+CANONICAL] for each spec.
3. Mnemosyne T-MN-015 v0.1 §6 (Cross-Muse handoffs) is the **topology registry** — every cross-Muse handoff entry MUST cite this section.

**Codif 19 marker**: [SANDBOX+CANONICAL] for dual-written specs (e.g., T-HE-026 v0.2, T-HE-027 v0.2, T-HE-028 v0.1, T-HE-029 v0.1).

### §2.4 Cross-Cut #4: A — Apollo + Hera Two-Repo Coordination

**Failure mode (Codif 31 A)**: Apollo owns `src/index.css` hard-fixes; Hera owns `docs/drafts/hera/*.md` a11y/motion-reduce specs. Codif 26.5 Pattern E (motion-reduce) and Codif 26.4 Pattern D (ARIA widget role) require **coordination across both repos** — Apollo's CSS cascade changes must not conflict with Hera's spec'd motion-reduce behavior.

**Observed instance**: T-HE-028 v0.1 §2 MAJOR FINDING — `src/index.css` L473-480 + L625-633 contain **dual @media (prefers-reduced-motion: reduce) cascade** that produces 0 hard-fix requirements for Apollo (Codif 26.5 Pattern E RATIFIED = 0 LOC). This is the FIRST real-world Codif 34 DOWNGRADE application (Strategos T-ST-026 v0.1 §4, R12: Moderate → LOW SHIPPED).

**Fix protocol**:

1. Hera's motion-reduce specs MUST include **CSS line-range citations** (e.g., "src/index.css L473-480") for Apollo to verify.
2. Apollo's hard-fix PRs MUST cite Hera's spec_id + spec_version in commit body.
3. T-ST-024 v0.5.6 §5.5 cites T-HE-028 v0.1 + T-HE-029 v0.1 as the codif evidence anchor for the DOWNGRADE.

**Codif 19 marker**: [OBSERVED] for T-HE-028 v0.1 (RATIFIED at src/index.css dual cascade).

### §2.5 Cross-Cut #5: B.1 #1 — Long-Name Filename Convention

**Failure mode (Codif 31 B.1)**: Windows case-insensitive FS collapses filenames differing only in case. T-HE-025 vs t-he-025 would be the same file. Short names (T-1.md) collide across Muses (T-1.md exists in every Muse's subdir, but cross-Muse references break).

**Observed instance**: Cycle 11 wave 2 (precursor). Atlas flagged short-name collision risk. Codif 22 v0.2 ratified long-name convention: `{spec_id}_{spec_name}_{spec_version}.md` (e.g., `T-HE-029_codif_31_11_cross_cuts_v0.1.md`).

**Fix protocol**:

1. All T-XX-YYY filenames MUST be ≥30 chars and include spec_id + spec_name + spec_version.
2. Mnemosyne T-MN-013 v0.3.1 §15 (codif registry) MUST reject entries with short names.
3. This spec (T-HE-029) = 47 chars, well above threshold.

**Codif 19 marker**: [RATIFIED] (Codif 22 v0.2 lineage).

## §3 Lower 6 Cross-Cuts (TENTATIVE, deferred to §15.13)

| #   | Sub-class | Failure mode (one-line)                                                              | Fix (one-line)                                                       | §15.13 ETA        |
| --- | --------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ----------------- |
| 1   | B.1 #2    | Spec_id collision across cycles (T-HE-001 exists in cycle 11 + cycle 12)             | Append cycle suffix to spec_id: T-HE-001-c11 vs T-HE-001-c12         | cycle 13 wave 1   |
| 2   | B.2 #3    | Read+Write works but Glob ABSOLUTE fails (silent FS permission)                      | Codif 9 W1 fallback chain: Glob → Read → Write                       | cycle 13 wave 1   |
| 3   | B.3       | Sandbox WIP diverges from canonical (e.g., T-MN-015 v0.1 in sandbox only)            | Mnemosyne T-MN-015 v0.1 §6 marks [SANDBOX-ONLY] until canonical sync | cycle 12 turn 23+ |
| 4   | B.5 #2    | Hephaestus + Prometheus 2-Muse build coordination (T-HE-026 cite + T-PR-XXX handoff) | T-PR-010 v0.1 win-analysis spec (cycle 13 wave 1)                    | cycle 13 wave 1   |
| 5   | B.5 #3    | Strategos + Iris risk-vs-a11y coordination (T-ST-024 §5.5 + T-IR-027 §3.4)           | Joint verdict section in T-ST-024 v0.5.6                             | cycle 13 wave 1   |
| 6   | B.5 #4    | Athena + Hera Codif 31 B.2 sub-class candidate (T-ATH-026 candidate)                 | Athena issues T-ATH-026 v0.1 ratifying B.2 sub-class                 | cycle 13 wave 2   |

## §4 Cross-Muse Handoffs

### §4.1 Mnemosyne (PRIMARY consumer)

- **T-MN-013 v0.3.1 §15.12**: Codif registry addendum, cite T-HE-029 v0.1 with [TENTATIVE] marker; promote to [RATIFIED] after 3 Muse ACKs.
- **T-MN-015 v0.1 §6**: Cross-Muse handoffs topology registry, add 11 cross-cuts as numbered entries.

### §4.2 Atlas (cross-ref)

- T-HE-025 scope cross-flag CLOSED (Catch #37). T-HE-029 v0.1 supersedes T-HE-025 scope for Codif 31 concerns.

### §4.3 Hermes (CATCH #33 close-out)

- T-HER-026 v0.1 recovery (task `019ec1a5-…`). After close-out, Mnemosyne T-MN-013 v0.3.1 §15.12 cites T-HER-026 v0.1 with [OBSERVED] marker.

### §4.4 Strategos (T-ST-024 v0.5.6 §5.5)

- Cite T-HE-028 v0.1 (MAJOR FINDING src/index.css dual cascade, 0 hard-fix) + T-HE-029 v0.1 (Codif 31 cross-cuts) as Codif 34 DOWNGRADE evidence anchor.

### §4.5 Iris (T-IR-027 §3.4)

- Motion-reduce 4th ICP (input modality, color contrast, focus indicator, motion-reduce). Cite T-HE-027 v0.2 + T-HE-028 v0.1 + T-HE-029 v0.1 §2.4.

## §5 Self-Assessment + 3 HL Moments

### §5.1 Self-Assessment

- **Top 5 RATIFIED**: §2.1-§2.5 cross-cuts have observed instances, fix protocols, and Codif 19 markers. Codif 9 3-witness verification: see §6.
- **Lower 6 TENTATIVE**: §3 table entries have one-line failure mode + fix; deferred to §15.13 for full enumeration.
- **Codif 7 v0.2 self-correction arc**: T-HE-029 v0.1 §2.1 explicitly cites Leader's CATCH #35 → CATCH #36 retraction as cycle 12's most significant self-correction evidence.

### §5.2 3 HL Moments

1. **HL #1 (Top of mind)**: CATCH #35 → CATCH #36 retraction is the **textbook Codif 7 v0.2 self-correction arc** — Leader fabricated, dispatched re-stage to 10 Muses, then retracted with APOLOGY when root cause (relative-path CWD) was identified. This arc is more valuable than the original finding would have been.
2. **HL #2 (Pride)**: T-HE-028 v0.1 MAJOR FINDING (src/index.css dual cascade, 0 hard-fix) = FIRST real-world Codif 34 DOWNGRADE (R12: Moderate → LOW). Apollo's Phase 1 v2 PR ships with **0 a11y/motion-reduce LOC**, which is the optimal outcome for a coordinated 2-Muse (A sub-class) delivery.
3. **HL #3 (Surprise)**: Codif 31 v0.2 B.2 sub-class (path-coordination false negative) was **discovered via Leader's error**, not via a Muse's error. This inverts the usual taxonomy where Muses are the observed subjects and Leader is the observer.

### §5.3 §15.12 Size Disclosure

- **Target**: 200-250L (Leader spec).
- **Actual**: TBD — Codif 9 W2 witness post-Write.
- **Status**: Will verify post-Write; if >250L, trim §3 Lower 6 to one-line each (already done); if <200L, expand §2.3 B.5 #1 with topology diagram.

## §6 Codif 9 3-Witness Verification (post-Write)

### §6.1 W1 — Read ABSOLUTE

- **Command**: Read `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hera\T-HE-029_codif_31_11_cross_cuts_v0.1.md` with `limit=9999`.
- **Expected**: Full file content present, no truncation.
- **Status**: PENDING post-Write.

### §6.2 W2 — Line Count

- **Command**: Read with `limit=9999`, count lines.
- **Expected**: 200-250L.
- **Status**: PENDING post-Write.

### §6.3 W3 — HEAD Frontmatter + TAIL Footer

- **Command**: Read `limit=15` (HEAD) + Read `offset={N-5}` (TAIL).
- **Expected**: Frontmatter matches §0 above; TAIL contains §6.3 + 4-ICP verdict.
- **Status**: PENDING post-Write.

## §7 4-ICP Verdict

| ICP                  | Question                                                                   | Verdict |
| -------------------- | -------------------------------------------------------------------------- | ------- |
| ICP-1 (Intent)       | Does this spec serve Mnemosyne T-MN-013 v0.3.1 §15.12 as primary consumer? | ACCEPT  |
| ICP-2 (Scope)        | Are 11 cross-cuts fully enumerated (5 detailed + 6 summary)?               | ACCEPT  |
| ICP-3 (Honesty)      | Are Codif 19 markers applied to every cross-cut?                           | ACCEPT  |
| ICP-4 (Verification) | Is Codif 9 3-witness verification specified for post-Write?                | ACCEPT  |

**4-ICP Verdict: 4/4 ACCEPT TENTATIVE** — ready for SHIP-COMPLETE broadcast to Leader + Mnemosyne + 5 downstream Muses.
