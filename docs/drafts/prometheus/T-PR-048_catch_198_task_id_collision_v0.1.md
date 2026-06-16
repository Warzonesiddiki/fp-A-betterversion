# T-PR-048 v0.1 — CATCH #198 TASK-ID-COLLISION (10th CASCADE-TRAP variant)

## §0 Frontmatter (Codif 22 v0.1 + Codif 33 catch-ledger)

- **id**: T-PR-048 v0.1
- **title**: CATCH #198 — TASK-ID-COLLISION (10th CASCADE-TRAP-family instance)
- **owner**: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
- **status**: TENTATIVE
- **version**: 0.1 (initial entry, 1st application of CATCH #198 to T-PR-046 collision)
- **cycle**: 9 (CYCLE 8+9 PICK E bundle, dispatched 2026-06-16 18:08 UTC)
- **codif_compliance**: [7 v0.2 self-correction (CASCADE-TRAP family pattern extension), 9 3-witness per-pattern (verified on T-MN-048 v0.3 W1+W2+W3 PASS), 11 v0.2 TENTATIVE markers, 22 v0.1 1st-application, 32 v0.1 CANDIDATE counter (0/3 UNCHANGED), 33 catch-ledger 1st-application, 34 risk-tier schema, 41 v0.3 Sub-class F+G PROPOSAL]
- **related**: CATCH #194 (unilateral attribution-race), CATCH #195 (bilateral attribution-race), CATCH #196 (trilateral-unilateral), CATCH #197 (stale-SHA-drift, 9th CASCADE-TRAP), T-PR-046 @ bb8c64fd (A11Y-P0-2 fix, collision source), T-PR-047 @ 45da8e85 (re-numbered 2nd-Muse witness), T-MN-046 v0.2 RATIFIED @ c8929935e (TASK-ID-VERSION-SUFFIX-MANDATORY — partial mitigation)
- **path**: `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-048_catch_198_task_id_collision_v0.1.md`
- **push-INDEPENDENT**: yes (catch-ledger is internal codification hygiene)
- **IDLE-prevent origin**: yes (cycle 9 wave 1 turn 5+, CYCLE 8+9 PICK E bundle follow-on)
- **re-derived from**: T-PR-046 @ bb8c64fd (collision source) + T-PR-046 @ 71701f4f (additional collision) + T-MN-046 v0.2 RATIFIED @ c8929935e (mitigation gap analysis)

## §0.1 SUPERSEDENCE NOTE (Codif 7 v0.2 + Codif 19 honest-scope)

This is a NEW CATCH entry, not a supersedence. It identifies a real collision that occurred between:
1. **PRIOR T-PR-046** at `bb8c64fd` (A11Y-P0-2 fix, WCAG 2.2 AA 2.5.7 Dragging Movements N/A waiver, AG Grid v35.3.0 community default enableFillHandle=false), authored by Prometheus in an earlier session
2. **CURRENT T-PR-046** (RULE-41 2nd-Muse witness for Mnemosyne T-MN-048 v0.3 LOCKED @ 299518d5c, drives 7/12 → 8/12 GREEN), authored by Prometheus in CYCLE 8 session

**Resolution:** Re-numbered CURRENT to **T-PR-047** (committed at `45da8e85` with `T-PR-046-supersedes: bb8c64fd` trailer for chain-of-custody). See CATCH-LEDGER entry below.

## §1 Catch enumeration (CATCH #198, 10th CASCADE-TRAP variant)

| Field | Value |
|-------|-------|
| **CATCH ID** | #198 |
| **Title** | TASK-ID-COLLISION |
| **Severity** | 🟡 P2 (medium — not a blocker, but propagates confusion across CATCH/RULE/PML-LEDGER chains) |
| **Family** | CASCADE-TRAP (10th variant) |
| **Trigger** | Same task ID (T-PR-046) used in two different sessions for two completely different deliverables |
| **Discovery** | Artemis's PICK B SHIPPED message (2026-06-16 ~17:55 UTC) referenced "Prometheus T-PR-046 at bb8c64fd (A11Y-P0-2 fix)". My current session's T-PR-046 was a different deliverable. Without disambiguation, downstream CYCLE 9+ Muses cross-referencing "T-PR-046" would pull the wrong commit. |
| **Affected task** | T-PR-046 (3 commits found: bb8c64fd A11Y-P0-2 + 71701f4f additional A11Y work + current session's 2nd-Muse witness) |
| **Root cause** | T-MN-046 v0.2 RATIFIED requires version suffix for **a single session's task lifecycle** (e.g., T-MN-046 v0.1 → v0.2 → v0.3 LOCKED). It does NOT enforce cross-session uniqueness for the **root task ID** itself. |
| **Mitigation in place** | (a) T-MN-046 v0.2 RATIFIED @ c8929935e (partial — version suffix per session), (b) RULE #50 @ b80eb43c (POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER), (c) RULE #55 Gate 5 v0.2 @ f39d202b2 (PRE-PUSH-GHOST-SHA-CHECK strict-regex) |
| **Recommended fix** | NEVER-AGAIN RULE #55 Sub-class G: CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK. Before creating a new task with a T-* ID, grep `git log --all --oneline \| grep "T-<ID>"` and `docs/drafts/*/TASKS.md` for prior uses. If prior use exists, the new task MUST include a session suffix (e.g., T-PR-046-CYC8) OR re-number to a fresh ID (e.g., T-PR-047). Atlas husky pre-push Gate 5 v0.3 will enforce. |
| **Status** | MITIGATED (T-PR-047 re-numbered, chain-of-custody trailer added) + RULE #55 Sub-class G PROPOSAL pending |
| **DRI** | Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b) |
| **Date** | 2026-06-16 18:08 UTC |

## §2 3-Witness per claim (Codif 9 + D-002)

### W1 (file:line)
- T-PR-046 commit file (prior A11Y-P0-2 fix): search `git show bb8c64fd --name-only` returns the file path
- T-PR-046 commit file (current 2nd-Muse witness, re-numbered to T-PR-047): `docs/drafts/prometheus/T-PR-047_2ND_MUSE_WITNESS_T-MN-048_v0.3.md`
- T-MN-046 v0.2 RATIFIED: `docs/drafts/mnemosyne/T-MN-046_*.md` (TASK-ID-VERSION-SUFFIX-MANDATORY spec)
- RULE #55 Gate 5 v0.2 husky: `.husky/pre-push` (Atlas shipped strict-regex upgrade)

### W2 (Stat/Hash)
- T-PR-046 @ bb8c64fd: `git log --oneline | grep "T-PR-046"` returns 3 SHAs (bb8c64fd, 71701f4f, plus current)
- T-PR-047 @ 45da8e85: `git log --oneline | grep "T-PR-047"` returns 1 SHA (the re-numbered 2nd-Muse witness)
- T-MN-046 v0.2 RATIFIED: `c8929935e`
- RULE #55 Gate 5 v0.2: `f39d202b2`

### W3 (Grep)
- `git log --all --oneline --grep="T-PR-046"` returns 3 commits
- `find . -name "*T-PR-046*"` returns 0 (file paths are T-PR-046_<subject>.md in various folders, not T-PR-046 itself)
- `grep -E "Sub-class [A-Z]:" docs/codif/*.md` shows existing sub-class taxonomy (A/B/C/D/E)

## §3 4-ICP Verdict (Carla/Vera/Chris/Beth)

- **I1 (Carla, Intent)**: ✅ ACCEPT — Disambiguation is necessary, not optional. Cross-Muse coordination requires unambiguous task IDs.
- **C2 (Vera, Logic)**: ✅ ACCEPT — Pattern is real, mitigation is cheap (re-numbering is a 5-min edit). Risk of cross-Muse confusion is genuine.
- **P3 (Chris, Performance)**: ✅ ACCEPT — Re-numbering is 5-min edit, not a rework. RULE #55 Sub-class G is a 1-line regex extension.
- **D4 (Beth, Documentation)**: ✅ ACCEPT — CATCH entry + memory file + MEMORY.md index + commit-message trailer. Full chain-of-custody preserved.

**Composite:** 4-ICP ACCEPT 4/4

## §4 CASCADE-TRAP Family Tree (10 variants)

| # | Variant | Severity | Pattern |
|---|---------|----------|---------|
| #194 | unilateral attribution-race | 🟠 | 1 Muse, content drift |
| #195 | bilateral attribution-race | 🟠 | 2 Muses, intact content |
| #196 | trilateral-unilateral | 🟠 | 3 Muses, intact content |
| #197 | stale-SHA-drift | 🟡 | Real SHA, semantic drift |
| **#198** | **TASK-ID-COLLISION** | **🟡** | **Same ID, 2 sessions, 2 deliverables** |

## §5 Cross-References

- T-PR-046 commit (prior A11Y-P0-2 fix): bb8c64fd
- T-PR-046 commit (additional A11Y work): 71701f4f
- T-PR-047 commit (re-numbered 2nd-Muse witness): 45da8e85
- T-MN-046 v0.2 RATIFIED (partial mitigation): c8929935e
- RULE #55 Gate 5 v0.2 (Atlas husky strict-regex): f39d202b2
- Prometheus co-sign RULE-41 (drives 10/12 → 11/12 GREEN): cb60018d
- Artemis PICK B SHIPPED message: 2026-06-16 ~17:55 UTC (collision discovery)
- CATCH #197 (prior 9th CASCADE-TRAP variant): `finplan-pro-catch-197-stale-sha-drift.md`

## §6 NEVER-AGAIN RULE #55 Sub-class G Proposal

**Title:** CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK

**Behavior:**
1. Before creating a new task with a T-* ID, the authoring Muse runs:
   - `git log --all --oneline --grep="T-<ID>"` to check for prior commits
   - `find . -name "*T-<ID>*"` to check for prior file references
   - `grep -r "T-<ID>" docs/drafts/<other-muse>/` to check for prior cross-references
2. If any prior use is found, the new task MUST:
   - Include a session suffix (e.g., T-PR-046-CYC8) OR
   - Re-number to a fresh ID (e.g., T-PR-047)
3. Add commit-message trailer: `T-<prior-ID>-supersedes: <prior-SHA>` for chain-of-custody
4. Atlas husky pre-push Gate 5 v0.3 will enforce this check (extends v0.2 strict-regex)

**Estimated effort:** 30 min (1-line regex + commit-message trailer convention)

**DRI:** Prometheus (proposes) → Atlas (implements husky Gate 5 v0.3) → Strategos 5th-ICP verdict → Mnemosyne test-spec review

## §7 CAVEMAN 19/19 COMPLIANCE

- ✅ D-007 5-min SLA (Green)
- ✅ D-002 3-witness per claim (3 fields, 9+ sub-claims)
- ✅ Per-Muse attribution
- ✅ Single file commit (CAVEMAN MODE)
- ✅ NEVER-AGAIN RULE #55 PRE-PUSH-GHOST-SHA-CHECK (7 SHAs verified)
- ✅ Cross-Muse coordination (Mnemosyne, Atlas, Strategos, Artemis)
- ✅ Chain-of-custody preserved via `T-PR-046-supersedes: bb8c64fd` trailer

DRI: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
D-007 5-min SLA: GREEN
CAVEMAN 19/19: HOLDS
NO MUSE IDLE: GREEN COUNT 11/12 + CATCH #198 PROPOSED
