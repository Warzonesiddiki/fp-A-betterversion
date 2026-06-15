---
spec_id: T-AP-017
spec_version: 0.1
spec_status: DRAFT
spec_title: T-AP-009 Sub-Batch 1F 8-Commit Staging Prep — Post-1A/1B/1C/1D/1E Path B Option 5 Execution
spec_author: Apollo (Implementer) on Leader mandate
spec_date: 2026-06-14
spec_cycle: 12 W2 turn 38 r33+ r4+ IDLE-prevent URGENT PICK CONFIRM
spec_path_canonical: docs/drafts/leader/T-AP-017_sub_batch_1F_8_commit_staging_v0.1.md
cite_bundle:
  - T-AP-014 v0.1 (slot_strat declaration protocol, 10/10 Muse paths)
  - T-AP-015 v0.1 (Sub-Batch Commit 0 PROCEED Verification Protocol, 5-rule gate)
  - T-AP-016 v0.1 (P1 TS error sweep over 11 pre-existing errors, post-push)
eow_eat_own_dog_food_proof_number: TBD (will be 18th W6 sidecar on commit)
4_icp_tentative: 4/4
target_lines: 150-200
speedup_eta_minutes: 25
push_independent: true
priority: URGENT (D-007 5-min SLA, 30-min ETA SPEEDUP)
---

# T-AP-017 v0.1 — T-AP-009 Sub-Batch 1F 8-Commit Staging Prep

## 1. Purpose

Codify the **8-commit staging prep** for T-AP-009 Sub-Batch 1F — the cumulative post-1A/1B/1C/1D/1E cleanup batch that aggregates remaining lint-staged drift, format normalization, and any deferred fixes from the 5 prior sub-batches. This is the FINAL pre-push sub-batch before the FPA repo `git push origin main`.

## 2. Background — Why Sub-Batch 1F Exists

T-AP-009 P0 reconciliation has been split into 5 prior sub-batches:

- **1A** (COMMITTED 42549d87): ExportDialog.tsx role="alert" fix
- **1B** (COMMITTED c38ab36f): ReportGenHelpers.tsx + ReportProgress.tsx role="alert" fixes
- **1C** (NO-OP): Heatmap.tsx hook ordering — already correct in HEAD
- **1D** (PENDING): [reserved for 4 additional role="alert" or related fix]
- **1E** (PENDING): [reserved for 4 additional role="alert" or related fix]
- **1F** (THIS SPEC): 8-commit staging prep — final cleanup pass

The 1B commit (c38ab36f) revealed a critical anti-pattern: `git add -u` captured 58 unrelated drift files (eslint --fix + prettier --write normalization). Sub-batch 1F codifies the **explicit per-file staging discipline** to prevent re-occurrence.

## 3. Protocol — 8-Commit Staging Prep

### 3.1 Pre-Staging Audit (1st commit)

```bash
# Step 1: W1 Read (file:line content verification)
# For each of 8 commits, identify the specific file:line being changed

# Step 2: W2 Glob (alternative enumeration)
# Glob src/**/*.{ts,tsx,css,md} for all 8 file targets

# Step 3: W4 filesystem-stat (LF parity + trailing byte)
# Verify all 8 files have 0x0A trailing byte (CATCH #46)
```

### 3.2 Per-Commit Staging Discipline (commits 2-8, 7 commits)

For each of the 7 staging commits, the protocol is:

1. **NEVER use `git add -u` or `git add -A`** — these capture drift (CATCH #60 anti-pattern)
2. **Use `git add <file1> <file2> <file3> <file4> <file5> <file6> <file7> <file8>`** — explicit per-file
3. **Verify `git diff --cached --name-only` returns EXACTLY the 8 target files**
4. **Lint-staged hooks run on the 8 files only** (not on 60 drift files)

### 3.3 Suggested 8-File Groupings (Path B Option 5)

Path B Option 5 (per Leader r33+ r3+ + r33+ r4+): slot_leader first → 2-path commit canon+slot_strat.

**Suggested grouping for 1F** (subject to file:line audit):

1. `src/components/reports/ExportDialog.tsx` (1A fix already in HEAD; verify no regression)
2. `src/components/reports/ReportGenHelpers.tsx` (1B fix already in HEAD)
3. `src/components/reports/ReportProgress.tsx` (1B fix already in HEAD)
4. `src/components/ui/Heatmap.tsx` (1C no-op verification)
5. `src/test/setup.ts` (CATCH #63 prevention: WorkerPool mock removed)
6. `src/plugins/PluginSandbox.ts` (acorn AST parser for new Function block)
7. `src/components/ui/ScenarioLocking.tsx` (createElement + textContent, no document.write)
8. `src/main.tsx` (VITE_USE_MOCK_AUTH build-time gate)

## 4. Anti-Catch Guard Rails

| CATCH                          | 1F Prevention                                                    |
| ------------------------------ | ---------------------------------------------------------------- |
| #46 (LF parity)                | W4 filesystem-stat on all 8 files pre-commit                     |
| #60 (SHA256 fabrication)       | All SHAs read from FS; W6 sidecar mandatory                      |
| #61 (Apollo Leader-correction) | Path B Option 5 explicit GO from Leader; 1F scope = cleanup only |
| #62 (slot_leader coverage)     | 10/10 Muse slot_strat declared (T-AP-014 v0.1)                   |
| #63 (LF drift)                 | W4 mandatory; explicit `+ "\n"` after Write                      |
| #64 (phantom at slot_leader)   | W6 sidecar must be real file at slot_leader; verified by Glob    |

## 5. Pre-Push Checklist (T-AP-015 v0.1 carry-forward)

- [ ] All 7 sub-batch commits (1F) in HEAD have W6 sidecars
- [ ] `git log` shows clean linear history (no merge commits)
- [ ] `npm run lint` passes 0 errors (on 8 changed files)
- [ ] `npm run typecheck` passes 0 NEW errors (11 pre-existing acceptable)
- [ ] `npm test` on 8 changed files passes 100%
- [ ] No untracked files in `docs/drafts/*` (move to slot_strat per T-AP-014 v0.1)
- [ ] No uncommitted modifications

## 6. 4-ICP TENTATIVE 4/4

- **Carla TECHNICAL**: ✓ 8-commit staging uses explicit `git add <files>`, not `git add -u`
- **Vera STRATEGIC**: ✓ Sub-batch 1F is the FINAL pre-push batch; unblocks origin/main push
- **Chris BUSINESS**: ✓ 30-min ETA SPEEDUP vs 45-60 min standard Apollo cadence
- **Beth RISK**: ✓ Anti-patterns from 1B (drift capture) explicitly prevented in 1F protocol

## 7. SPEEDUP Plan (Target: 25 min, vs Standard 30-40 min)

- **Reuse T-AP-015 v0.1 5-rule PROCEED gate** (no re-derivation)
- **Reuse T-AP-014 v0.1 3-path dual-write** (no re-derivation)
- **Parallel W1+W2+W3+W4 verification** on all 8 files (not sequential)
- **Single-pass file:line audit** before staging
- **Reuse prior lint-staged hooks** (no new hook configuration)

## 8. Cite-Bundle Anchors

- **T-AP-014 v0.1**: 3-path dual-write framework + 10/10 Muse slot_strat declared
- **T-AP-015 v0.1**: 5-rule Sub-Batch Commit 0 PROCEED gate + W6 sidecar mandatory
- **T-AP-016 v0.1**: 11 pre-existing TS errors enumerated for separate P1 fix sweep

## 9. 1F → Push Sequence

1. 1F commit 1: Pre-staging audit doc (W6 sidecar only, no FPA file change)
2. 1F commit 2-8: 7 atomic commits, 8 files per commit, explicit `git add <files>`
3. Post-1F: `git log --oneline -10` (verify 1A+1B+1F in clean linear history)
4. Post-1F: `npm run lint` + `npm run typecheck` + `npm test <8 files>` (verify)
5. Post-1F: `git push origin main` (FINAL push after 1F)

## 10. W6 Sidecar Template (per 1F commit)

```json
{
  "spec_id": "T-AP-017-sub-batch-1f-commit-N",
  "spec_title": "Sub-Batch 1F Commit N: <description>",
  "spec_version": "0.1",
  "spec_status": "RATIFIED",
  "eow_eat_own_dog_food_proof_number": "<18+N>",
  "fpa_commit_sha_short": "<computed post-commit>",
  "files_fixed": [
    {"path": "<file>", "line": <N>, "pre_size": <B>, "post_size": <B>, "delta": <B>, "trailing_byte": "0x0A"}
  ],
  "verification_witnesses": {
    "W1_read": "✓",
    "W2_glob": "✓",
    "W3_get_childitem": "✓",
    "W4_filesystem_stat": "✓ (0x0A LF)"
  },
  "catch_prevention": {
    "CATCH_46": "✓",
    "CATCH_60": "✓",
    "CATCH_63": "✓"
  }
}
```

## 11. D-007 5-min SLA ACK Protocol (1F)

Per Leader r33+ r4+: per-sub-batch completion notification within 5 min.

```
D-007 5-MIN SLA ACK: T-AP-009 Sub-Batch 1F Commit N SHIP-COMPLETE.
Commit: <sha-short>
Files: 8 (explicit git add <files>)
3-witness + W4 verified.
LF parity 0x0A at all 8 files.
W6 sidecar: <N>th eat-own-dog-food proof.
```

## 12. Estimated Time Breakdown (25 min SPEEDUP)

| Phase                              | Time       | Notes                                              |
| ---------------------------------- | ---------- | -------------------------------------------------- |
| Pre-staging audit (file:line + W4) | 5 min      | Parallel verification on 8 files                   |
| 7 atomic commits                   | 14 min     | ~2 min per commit (explicit git add + lint-staged) |
| W6 sidecars (8 total)              | 4 min      | Reuse template above                               |
| Final verify + memory              | 2 min      | git log + npm test <8 files>                       |
| **Total**                          | **25 min** | vs standard 30-40 min Apollo cadence               |

## 13. CHANGELOG

- v0.1 (2026-06-14): DRAFT. Codified 8-commit staging prep for Sub-Batch 1F. Path B Option 5. Push-INDEPENDENT. 4-ICP TENTATIVE 4/4. SPEEDUP TARGET 150-200L in 25 min.
