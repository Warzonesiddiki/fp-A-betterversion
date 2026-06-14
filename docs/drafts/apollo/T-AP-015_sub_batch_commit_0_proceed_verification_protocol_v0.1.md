---
spec_id: T-AP-015
spec_version: 0.1
spec_status: DRAFT
spec_title: T-AP-009 Sub-Batch Commit 0 PROCEED Verification Protocol — Codified 3-Witness + W4 LF Parity Gate
spec_author: Apollo (Implementer)
spec_date: 2026-06-14
spec_cycle: 12 W2 turn 38 r33+ r4+ IDLE-prevent
cite_bundle:
  - T-AP-009 P0 reconciliation (1A-1C sub-batches)
  - T-AP-013 v0.1 (CATCH #63 LF-parity-drift-fix procedure)
  - T-AT-032 v0.1.1 (3-path framework ratification)
  - CATCH #46 (LF parity invariant)
  - CATCH #60 (SHA256 fabrication prevention)
  - CATCH #63 (JSX text-leak + LF drift)
  - CATCH #64 (phantom at slot_leader)
eow_eat_own_dog_food_proof_number: TBD (will be 17th W6 sidecar on commit)
4_icp_tentative: 4/4
target_lines: 150-200
eta_minutes: 30-40
push_independent: true
---

# T-AP-015 v0.1 — T-AP-009 Sub-Batch Commit 0 PROCEED Verification Protocol

## 1. Purpose

Codify the **Sub-Batch Commit 0 PROCEED verification protocol** — the 5-rule gate that determines whether a sub-batch of T-AP-009 (or any future P0 reconciliation batch) may advance to commit 0 (the actual FPA repo commit). This protocol was used implicitly in 1A + 1B execution; codifying it prevents future sub-batch commits from triggering CATCH #46, #60, #63, #64.

## 2. Background — Why This Protocol Exists

T-AP-009 P0 reconciliation has 10 items. Sub-batching them into 1A, 1B, 1C, etc. was necessary to prevent mega-commits (which CATCH #60 prevention guard rail explicitly forbids). Each sub-batch requires:

- **Pre-commit verification** (file:line + content + LF parity)
- **Commit creation** (with W6 sidecar)
- **Post-commit verification** (3-witness + W4)

The 1A-1B execution revealed gaps:

- `git add -u` auto-stages 60 files (1B captured unrelated drift) — needs per-sub-batch file scoping
- Lint-staged hooks may add files outside the sub-batch scope — needs pre-commit file list verification
- Some sub-batches (1C) are NO-OPs (claim doesn't exist in HEAD) — needs NO-OP detection

## 3. Protocol — 5-Rule Sub-Batch Commit 0 PROCEED Gate

### Rule 1: W1 Read (file:line content verification)

**Action**: Use `Read` tool to inspect the file at the specific line where the fix is being applied.

**Pass criteria**:

- File exists at expected path
- File content at the specific line matches the "before" state described in the sub-batch scope
- File size matches expected pre-fix size from sub-batch scope

**Fail action**: STOP. Do NOT commit. Sub-batch scope claim is wrong. Reconcile with file:line audit.

### Rule 2: W2 Glob (alternative enumeration)

**Action**: Use `Grep` or `Glob` to find all occurrences of the pattern being fixed.

**Pass criteria**:

- Count of occurrences matches sub-batch scope count
- If claim is "11 components" and Grep returns 2, scope is OVER-counted (reconcile)
- If claim is "1 file" and Grep returns 0, fix is already in HEAD (NO-OP)

**Fail action**: Reconcile count. Update sub-batch scope. Or declare NO-OP if 0.

### Rule 3: W3 Get-ChildItem (post-fix verification)

**Action**: Apply the fix via `Edit` tool. Then run `Get-ChildItem` on the file. Verify:

- File size increased by expected delta (typically +14-15B per role="alert" fix)
- File size in bytes matches post-fix expectation

**Pass criteria**:

- Post-fix size matches sub-batch scope prediction (±1B tolerance for LF edge cases)
- Pre-fix SHA256 ≠ Post-fix SHA256 (file actually changed)

**Fail action**: STOP. Edit did not apply. Re-apply.

### Rule 4: W4 Filesystem-stat (LF parity + trailing byte)

**Action**: Run `Get-FileHash -Algorithm SHA256` + `[System.IO.File]::ReadAllBytes(...)[-1]` to get trailing byte.

**Pass criteria**:

- Trailing byte = 0x0A (LF)
- SHA256 ≠ 0 (file is not empty)
- SHA256 captured for W6 sidecar

**Fail action**: STOP. File has CRLF or missing LF. Re-write with `+ "\n"`.

### Rule 5: W5 Commit Subject + File List (scope discipline)

**Action**: Stage ONLY the sub-batch-intended files via explicit `git add <file1> <file2> ...`. NEVER use `git add -u` or `git add -A` for sub-batches (those capture drift).

**Pass criteria**:

- `git diff --cached --name-only` returns EXACTLY the sub-batch-intended files
- Commit subject starts with `fix(...)` or `chore(...)` per conventional commits
- Commit message references W6 sidecar path

**Fail action**: `git reset HEAD <file>` to unstage unintended files. Re-verify with `git diff --cached --name-only`.

## 4. Sub-Batch NO-OP Detection

Some sub-batches may be NO-OPs (the issue described in the scope is already fixed in HEAD). To detect:

```
1. Run W1 Read on the file:line described in sub-batch scope
2. If file content matches the "after" state (not the "before" state), it's a NO-OP
3. Declare sub-batch as NO-OP in D-007 5-min SLA ACK
4. Skip commit creation
5. Update memory with NO-OP declaration
```

**Example from cycle 12 W2 turn 38 r33+ r4+**:

- 1C scope: "Heatmap.tsx:80 conditional useMemo"
- W1 Read: Heatmap.tsx L34-80 shows hooks at L35-64 BEFORE early returns at L67-79
- W1 finding: L80 is `}` (close of JSX block), not a conditional useMemo
- Conclusion: 1C is NO-OP (the issue was already fixed in a prior commit)

## 5. W6 Sidecar (Mandatory per Commit)

Every sub-batch commit MUST have a W6 sidecar at slot*leader:
`<convo>\docs\drafts\<author>\T-AP-009_sub-batch*<X>\_<description>.w6.json`

Sidecar must contain:

- spec_id, spec_title, spec_version, spec_status
- spec_size_bytes, spec_sha256, spec_trailing_byte
- eow_eat_own_dog_food_proof_number (incrementing)
- fpa_commit_sha_short, fpa_commit_sha_full, fpa_commit_subject
- files_fixed: [{path, line, pre/post_size, pre/post_sha, delta, trailing_byte, fix_pattern}]
- verification_witnesses: {W1_read, W2_glob, W3_get_childitem, W4_filesystem_stat}
- catch_prevention: {CATCH_46, CATCH_60, CATCH_63, ...}

## 6. Pre-Push Verification Checklist

Before `git push origin main`:

- [ ] All sub-batch commits in local HEAD have W6 sidecars
- [ ] `git log` shows clean linear history (no merge commits)
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm test` passes with 0 failures
- [ ] No untracked files in `docs/drafts/*` (MOVE to slot_strat paths)
- [ ] No uncommitted modifications

## 7. Anti-Patterns (FORBIDDEN in Sub-Batch Commits)

- **Using `git add -u` for sub-batches**: Captures unrelated drift (1B captured 58 extra files this way)
- **Committing without W6 sidecar**: CATCH #9 violation
- **Skipping W4 filesystem-stat**: CATCH #46 trigger (LF parity lost)
- **Fabricating SHA256**: CATCH #60 trigger (always read from FS)
- **Merging sub-batches into mega-commit**: CATCH #60 prevention guard rail violation

## 8. 4-ICP TENTATIVE 4/4

- **Internal Consistency**: 1.0 (5-rule protocol internally consistent with 3-witness + W4 framework)
- **External Consistency**: 1.0 (aligns with T-AP-013 v0.1 + T-AT-032 v0.1.1 + T-AP-009 P0 reconciliation)
- **Completeness**: 1.0 (covers pre-commit, commit, post-commit phases)
- **Practicality**: 0.95 (already used in 1A + 1B; codified retroactively)

## 9. CATCH Prevention Codified (5 total)

- **CATCH #46** (LF parity): W4 mandatory; trailing 0x0A verified pre-commit
- **CATCH #60** (SHA256 fabrication): All SHAs read from filesystem; W6 sidecar references real files
- **CATCH #63** (JSX text-leak + LF drift): W1 + W2 + W3 triple-verify; Grep post-fix 0 matches
- **CATCH #64** (phantom at slot_leader): W6 sidecar must be a real file at slot_leader; verified by Glob
- **CATCH #9** (W6 sidecar missing): W6 sidecar is MANDATORY per commit

## 10. CHANGELOG

- v0.1 (2026-06-14): DRAFT. Codified 5-rule Sub-Batch Commit 0 PROCEED Verification Protocol with NO-OP detection + W6 sidecar mandatory + pre-push checklist. Push-INDEPENDENT. 4-ICP TENTATIVE 4/4.
