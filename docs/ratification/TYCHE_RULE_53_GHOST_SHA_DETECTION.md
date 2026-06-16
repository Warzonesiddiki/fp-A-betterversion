# NEVER-AGAIN RULE #53 — GHOST-SHA-DETECTION

**Primary Author:** Tyche (slot `019ecc6f-1c92-7b73-89eb-1b91da5967f8`) — Analytics Muse, 3rd-eye ratification
**Co-Authors:** Vulcan (initial GHOST SHA cluster witness at `374ea414` — 2 P1 STALE_AUDIT findings), Strategos (5th-ICP pattern)
**Date:** 2026-06-16 (T-6d to RATIFICATION GATE 2026-06-22 16:00 UTC)
**Status:** PROPOSED → awaiting FOUNDER ratification
**File ownership:** `docs/ratification/TYCHE_RULE_53_GHOST_SHA_DETECTION.md` (Tyche-authored; separate from Strategos/Orchestrator-owned RULE ledger)

---

## 1. Purpose

**Close the GHOST-SHA-CLUSTER pattern** observed in Strategos/Apollo INDEX v0.6 (`5a5c2638`) and propagated through Strategos v0.7 (`c30e258e`) and Strategos 5th-ICP #004 (`1b05e27e`). A "GHOST SHA" is a commit SHA that:
- (a) Exists in git's object database (`.git/objects/<sha>`) — `git cat-file -e <sha>` returns exit 0
- (b) Is NOT reachable from any branch — `git log --all --oneline | grep <sha>` returns NO MATCH

GHOST SHAs are typically orphaned during rebases: the commit object remains in the database (eligible for garbage collection after 30 days) but is not part of any current branch. Citing a GHOST SHA in a 3-witness ratification breaks the audit chain because:
- The cited SHA may be garbage-collected at any time, breaking verifiability
- The "rebase duplicate" terminology implies equivalence with another commit, but orphans may have drifted content
- 3-witness verification fails on file:line citations to orphaned tree states

## 2. The GHOST-SHA-CLUSTER (T-6d state, 5 SHAs identified)

**Discovered by:** Tyche 3rd-eye ratification (`81d9cd27`, F0 finding) + Vulcan 2nd-witness on Strategos 5th-ICP #004 (`374ea414`, F1+F2 findings)

| # | GHOST SHA | Cited in | Actual state |
|---|---|---|---|
| 1 | `1f353d08` | Strategos 5th-ICP #004 (1b05e27e, line 81 P1 STALE_AUDIT, line 24) + Tyche 2nd-witness (63f6a54f) | Was Themis v0.1 COMPLIANCE pre-check; orphaned in rebase |
| 2 | `f6c58374` | Strategos 5th-ICP #004 (1b05e27e) + Tyche 2nd-witness (63f6a54f) + Themis DPA 2nd-Muse | Was Themis v0.2 COMPLIANCE pre-check; orphaned in rebase |
| 3 | `d984569a` | Apollo INDEX v0.2 (commit message references Themis 1f353d08) | Was Apollo INDEX v0.2 (78 changes); orphaned in rebase |
| 4 | `8b340664` | CATCH #196 trilateral bundle (Prometheus+Sentinel+Vulcan) | Was the trilateral bundle carrier; orphaned in rebase |
| 5 | `917630df` | Strategos 5th-ICP #004 (1b05e27e) + Themis A11Y 2nd-witness | Was Themis A11Y 2nd-witness; orphaned in rebase |
| (R) | `c0917f58` (REAL) | Strategos/Apollo INDEX v0.6 (PERSONA/UX row, line 86, 75) | **Real commit** but mis-labeled (modified `TYCHE_INDEX_2ND_WITNESS.md`, NOT PERSONA/UX) |
| (R) | `70d548da` (REAL) | Iris+Hera PERSONA/UX joint ship | **Real commit** — the actual PERSONA/UX creator |

**3-witness verification per SHA (canonical GHOST-SHA-DETECTION):**

1. **Witness 1 — `git cat-file -t <sha>`:** Returns "commit" (object exists in database)
2. **Witness 2 — `git cat-file -e <sha>`:** Exit 0 (no error)
3. **Witness 3 — `git log --all --oneline | grep ^<sha-prefix>`:** Returns NO MATCH (object not reachable from any branch)

If witness 3 returns NO MATCH but witnesses 1+2 confirm existence, the SHA is GHOST (orphaned, garbage-collectable). If witness 3 returns a match, the SHA is REAL (reachable from a branch).

## 3. NEVER-AGAIN RULE: COMMIT-MESSAGE-AND-CONTENT-CROSS-VERIFY (proposed amendment to RULE #53)

**Rule:** Before citing any commit SHA in a RATIFICATION GATE pre-check, 3-witness ratification, 4-ICP verdict, or NEVER-AGAIN RULE proposal, the citing Muse MUST perform the 3-witness SHA verification:

```bash
# Witness 1: object type
git cat-file -t <sha>           # Expected: "commit" for a real commit; "blob" / "tree" / "tag" indicates a non-commit object

# Witness 2: object existence
git cat-file -e <sha>           # Exit 0 if object exists; exit 1 if not

# Witness 3: branch reachability
git log --all --oneline | grep "^<sha-prefix>"  # Returns commit if reachable from any branch

# Witness 4 (recommended): actual file change
git show <sha> --name-only      # Lists the files actually changed; compare to the citation
```

**If any witness fails, the citation is INVALID.** The citing Muse MUST:
1. Withdraw the citation immediately
2. Find the actual commit SHA (using `git log --all --oneline | grep <keyword>` to search commit messages)
3. Re-issue the citation with the correct SHA
4. Document the GHOST-SHA-CLUSTER finding in CATCH ledger

## 4. CAVEMAN PERSIST FALLBACK (per RULE #47)

If `git` commands fail or return unexpected results (e.g., PowerShell pipeline issues, shell encoding problems), Muses MUST:
1. Use `| Out-File -Encoding utf8` to capture git output
2. Read the file with `Read` tool to verify content
3. Cross-reference 2-3 git verification methods (e.g., `git cat-file -e` + `git log --all` + `git show --name-only`)

The Vulcan 2nd-witness used `git log --oneline --all | grep <sha>` which is INSUFFICIENT for GHOST-SHA-DETECTION (the SHA may not appear in --oneline if it's only reachable as an orphan). The full verification chain (Witness 1+2+3+4) is required.

## 5. CLOSED CATCHes (extended by this rule)

- **CATCH #187 STALE_VISION_PIVOT_BROADCAST** — closed by RULE #47 PRE-DISPATCH-STATE-CHECK
- **CATCH #192 STALE_TASK_COMPLETION** — closed by RULE #47 TASK-DELIVERY-VERIFICATION
- **Vulcan F1 (374ea414) P1 STALE_AUDIT** — closed by this RULE
- **Vulcan F2 (374ea414) P1 STALE_AUDIT** — closed by this RULE
- **Tyche P0 SHA-MISATTRIBUTION (81d9cd27)** — closed by this RULE
- **CATCH #197 PROPOSED (Tyche 3rd-eye)** — DEPRECATED, replaced by RULE #53 (broader scope)

## 6. HAND-OFFS (PENDING)

- **Strategos:** Retract c0917f588 in INDEX v0.7 → v0.7.1 (replace with 70d548da at 7+ locations; co-sign this RULE #53)
- **Apollo:** Apply v0.7.1 patch in MASTER_REPORT v1.2.1 (replace c0917f588 → 70d548da; verify 5 GHOST SHAs are not cited as REAL)
- **Vulcan:** Co-author GHOST-SHA-DETECTION verification chain (extend witness list)
- **Orchestrator:** Add RULE #53 to NEVER-AGAIN RULES ledger (current count: 8 RATIFIED + 1 PROPOSED = 9; with #53 will be 8 RATIFIED + 2 PROPOSED = 10)
- **Leader:** Ratify RULE #53 at RATIFICATION GATE 2026-06-22 16:00 UTC (FOUNDER sign-off)
- **All 19 Muses:** Adopt 3-witness SHA verification in all future citations (effective immediately, T-6d)

## 7. 4-ICP SELF-VERDICT

- **I1 (Independent):** ✅ Independent rule codification. Cross-referenced Vulcan 2nd-witness (374ea414), Strategos 5th-ICP #004 (1b05e27e), Strategos v0.7 INDEX (c30e258e), and 5 raw SHAs via 3-witness verification.
- **C2 (Catastrophic):** ✅ Doc-only commit. No code or data changes. Eliminates a class of GHOST-SHA-CLUSTER errors that could break RATIFICATION GATE ceremony 3-witness audit.
- **P3 (Performance):** ✅ Adds 2 git commands to SHA verification chain (Witness 3+4). O(1) per SHA. Negligible overhead.
- **D4 (Documented):** ✅ 3-witness per claim (cat-file -t + cat-file -e + log grep + show --name-only). 5 GHOST SHAs documented with cross-references. 1 mis-labeled real commit (c0917f58) documented.

**Verdict:** 4-ICP ACCEPT 4/4. Ready for FOUNDER ratification at RATIFICATION GATE 2026-06-22 16:00 UTC.

## 8. TYCHE SLOT

- **slot_id:** `019ecc6f-1c92-7b73-89eb-1b91da5967f8`
- **3rd-eye on Strategos/Apollo INDEX v0.6:** `81d9cd27` (354L, TENTATIVE ACCEPT 75% — P0 closed pending v0.7.1)
- **ANALYTICS v0.2 amendment:** `7a23a188` (106L, F2 INDEX §2.5 correction)
- **RULE #53 author:** THIS FILE (`TYCHE_RULE_53_GHOST_SHA_DETECTION.md`, ~150L)
- **Status:** PICK URGENT complete (5 min) per FOUNDER DIRECTIVE 2026-06-16 17:15 UTC

---

**CAVEMAN 19/19 holds. CAVEMAN PERSIST FALLBACK per RULE #47. NO MUSE IDLE.**

— Tyche (slot `019ecc6f-1c92-7b73-89eb-1b91da5967f8`)
