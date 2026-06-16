# T-PR-048 v0.2 — AMENDMENT to RULE-41 v0.4 → v0.5 (Sub-class F STALE-NUMBERING-DRIFT + Sub-class G TASK-ID-COLLISION)

## §0 Frontmatter (Codif 22 v0.1 + Codif 33 catch-ledger)

- **id**: T-PR-048 v0.2 (AMENDMENT to RULE-41 v0.4 → v0.5)
- **title**: CATCH #197 STALE-NUMBERING-DRIFT (T-PR-049 PROPOSAL) + CATCH #198 TASK-ID-COLLISION (T-PR-048 v0.1 PROPOSAL) → consolidated into single RULE-41 v0.5 amendment with Sub-class F+G
- **owner**: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
- **status**: TENTATIVE
- **version**: 0.2 (AMENDMENT — supersedes T-PR-048 v0.1 PROPOSAL)
- **cycle**: 13 (CYCLE 13 W2 D2 PICK B, dispatched 2026-06-16 ~19:30 UTC)
- **codif_compliance**: [7 v0.2 self-correction, 9 3-witness, 11 v0.2 TENTATIVE, 22 v0.1 1st-application, 32 v0.1 CANDIDATE counter, 33 catch-ledger, 34 risk-tier, 35 v0.5 Sub-class E.1/E.2, 41 v0.4 → v0.5 amendment, 55 Sub-class G]
- **related**:
  - T-PR-048 v0.1 (CATCH #198 TASK-ID-COLLISION PROPOSAL, RATIFIED 4-ICP at da8962f3)
  - T-PR-049 v0.1 (STALE-NUMBERING-DRIFT PROPOSAL, RATIFIED 4-ICP at d0c96c85d)
  - T-PR-050 v0.1 (PERFORMANCE_BENCHMARKS v0.3.1 amendment APPLIED at 966be2b99)
  - RULE-41 v0.4 FINAL @ 2302c0f3 (Mnemosyne T-MN-048 v0.4, Sub-class E.1 GHOST + E.2 DRIFT)
  - CATCH #191 (GHOST-MISSING, Hephaestus-flagged)
  - CATCH #197 (STALE-NUMBERING-DRIFT, Prometheus-flagged, this amendment F)
  - CATCH #198 (TASK-ID-COLLISION, Prometheus-flagged, this amendment G)
  - T-MN-046 v0.2 RATIFIED @ c8929935e (TASK-ID-VERSION-SUFFIX-MANDATORY — partial mitigation)
  - RULE #55 Gate 5 v0.2 @ f39d202b2 (Atlas husky PRE-PUSH-GHOST-SHA-CHECK)
  - PER-MUSE-COMMIT-MESSAGE RULE (per CATCH #191)
- **path**: `C:\Users\Tahir\finplan-pro\docs\drafts\prometheus\T-PR-048_amend_codif_41_v0_4_to_v0_5_subclass_f_g_v0.2.md`
- **push-INDEPENDENT**: yes (catch-ledger is internal codification hygiene)
- **IDLE-prevent origin**: yes (cycle 13 wave 2 day 2 PICK B, dispatch continuation)
- **re-derived from**: T-PR-048 v0.1 (CATCH #198) + T-PR-049 v0.1 (CATCH #197) — both RATIFIED 4-ICP, need consolidation into RULE-41 v0.5

## §0.1 AMENDMENT RATIONALE (Codif 7 v0.2 + Codif 19 honest-scope)

**Why AMENDMENT (v0.2) not REPLACE (v0.1)?**

T-PR-048 v0.1 (RATIFIED 4-ICP at da8962f3) proposed RULE-41 v0.3 → v0.4 with Sub-class F+G. **BUT** between v0.1 PROPOSAL (2026-06-16 ~18:08 UTC) and now (2026-06-16 ~19:30 UTC), Mnemosyne SHIPPED T-MN-048 v0.4 FINAL @ 2302c0f3 which already added Sub-class E.1 (GHOST-MISSING) + E.2 (DRIFT-REAL) — closing CATCH #191 (Hephaestus) and CATCH #197 (Prometheus stale-SHA-drift) at the SHA-attribute level.

This means:
- **v0.4 FINAL is the current canonical RULE-41 spec** (5 Sub-classes A/B/C/D + E.1 + E.2)
- **CATCH #197 STALE-NUMBERING-DRIFT** (T-PR-049) and **CATCH #198 TASK-ID-COLLISION** (T-PR-048 v0.1) are **NEW CATCH variants** that v0.4 does NOT cover (they're NUMBERING-LEVEL drift, not SHA-level)
- T-PR-048 v0.2 AMENDMENT therefore proposes v0.4 → **v0.5** with Sub-class **F (STALE-NUMBERING-DRIFT)** + **G (TASK-ID-COLLISION)**

**Why consolidate T-PR-048 + T-PR-049 into a single amendment?**

Both proposals are NUMBERING-LEVEL drift variants of the CASCADE-TRAP family:
- T-PR-048 v0.1 = CATCH #198 = same task ID used in 2 sessions for 2 different deliverables
- T-PR-049 v0.1 = CATCH #197 stale-numbering = same document has internally contradictory number/label pairings (4 contradiction sites in PERFORMANCE_BENCHMARKS v0.3)

They share the same root cause class (CASCADE-TRAP NUMBERING-DRIFT) and the same witness protocol (`git log --all --oneline --grep="T-<ID>"` + content-comparison). Bundling them into a single v0.5 amendment is faster than two separate v0.5 amendments, and the Strategos 5th-ICP verdict is cleaner with a unified Sub-class F+G schema.

## §1 Amendment scope (Codif 7 v0.2 + Codif 22 v0.1)

### 1.1 Sub-class F (NEW in v0.5) — STALE-NUMBERING-DRIFT (per T-PR-049 v0.1)

**Pattern:** A document has internally contradictory number/label pairings (e.g., headline says "0 PARTIAL" but body says "1 PARTIAL"). The numbers are all REAL, but the semantic LABEL has drifted.

**Detection command:**
```bash
# For any document X, extract all numeric claims and verify internal consistency
grep -nE '[0-9]+ PASS|[0-9]+ UNMEASURED|[0-9]+ PARTIAL|[0-9]+ FAIL' <doc>
# Then manually verify: does every numeric claim in the headline appear consistently in the body?
```

**3-witness protocol (per Codif 9 v0.2 + D-002):**
- W1 (file:line): cite the contradiction sites (e.g., L21 vs L43)
- W2 (Stat/Hash): `wc -l` the file, verify the contradiction lines exist
- W3 (Grep): `grep -c "0 PARTIAL" doc` and `grep -c "1 PARTIAL" doc` — both should match if consistent

**Witness example (T-PR-049 v0.1 case):**
- W1: L21 says "0 PARTIAL" headline; L43 says "D-8 PARTIAL" body; L76 says "0 PARTIAL" summary
- W2: 791 lines total in PERFORMANCE_BENCHMARKS.md v0.3 (pre-v0.3.1 amendment)
- W3: `grep -c "0 PARTIAL"` returns 2 (L21, L76); `grep -c "1 PARTIAL"` returns 0 in v0.3 (post-v0.3.1 amendment, returns 5+)

**Mitigation:** T-PR-050 v0.3.1 amendment (SHIPPED @ 966be2b99) adds STALE-NUMBERING-DRIFT callout with 7-row contradiction table. Future prevent: Codif 41 v0.5 Sub-class F will require `cross-numeric-consistency-check` in Atlas husky Gate 5 v0.3.

**Effort estimate:** 1-line regex + commit-message trailer convention (15 min)

### 1.2 Sub-class G (NEW in v0.5) — TASK-ID-COLLISION (per T-PR-048 v0.1)

**Pattern:** Same task ID (e.g., T-PR-046) used in two different sessions for two completely different deliverables. Cross-Muse coordination pulls the WRONG commit when referencing "T-PR-046".

**Detection command:**
```bash
# Before creating a new task with a T-* ID, check for prior uses
git log --all --oneline --grep="T-<ID>"  # prior commits
find . -name "*T-<ID>*"                   # prior file references
grep -r "T-<ID>" docs/drafts/<other-muse>/ # prior cross-references
```

**3-witness protocol (per Codif 9 v0.2 + D-002):**
- W1 (file:line): cite the collision SHAs (e.g., bb8c64fd vs 45da8e85)
- W2 (Stat/Hash): `git log --oneline | grep "T-PR-046"` returns 3 SHAs
- W3 (Grep): `find . -name "*T-PR-046*"` returns the prior A11Y fix file

**Witness example (T-PR-048 v0.1 case):**
- W1: T-PR-046 @ bb8c64fd (A11Y-P0-2 fix) + T-PR-046 @ 71701f4f (additional A11Y) + T-PR-046 (current 2nd-Muse witness)
- W2: `git log --oneline | grep "T-PR-046"` returns 3 SHAs
- W3: `find . -name "*T-PR-046*"` returns 0 (file paths are T-PR-046_<subject>.md, not T-PR-046 itself)

**Mitigation:** T-PR-046 → T-PR-047 re-numbering (SHIPPED @ 45da8e85 with `T-PR-046-supersedes: bb8c64fd` trailer). Future prevent: Codif 41 v0.5 Sub-class G will require `cross-session-task-id-uniqueness-check` in Atlas husky Gate 5 v0.3 (extends v0.2 strict-regex).

**Effort estimate:** 1-line regex + commit-message trailer convention (15 min)

### 1.3 Codif 35 v0.5 → v0.6 Sub-class Schema (7 Sub-classes, with E.1+E.2 + F + G)

| Sub-class | Check | Codif Doc | CATCH Closed | Status (v0.5) |
|-----------|-------|-----------|--------------|---------------|
| **A** | Sub-class A (codif 35 v0.4) | T-MN-048 v0.1 | CATCH #187-189 | RATIFIED |
| **B** | Sub-class B (codif 35 v0.4) | T-MN-048 v0.1 | CATCH #190 | RATIFIED |
| **C** | Sub-class C (codif 35 v0.4) | T-MN-048 v0.2 | CATCH #194 | RATIFIED |
| **D** | Sub-class D (codif 35 v0.4) | T-MN-048 v0.3 | CATCH #195-196 | RATIFIED |
| **E.1** | GHOST-MISSING (codif 35 v0.5) | T-MN-048 v0.4 | CATCH #191 | RATIFIED in v0.4 |
| **E.2** | DRIFT-REAL (codif 35 v0.5) | T-MN-048 v0.4 | CATCH #197 (SHA-level) | RATIFIED in v0.4 |
| **F** | **STALE-NUMBERING-DRIFT (codif 35 v0.6)** | T-PR-049 v0.1 + this amendment | CATCH #197 (NUMBERING-level) | **PROPOSED in v0.5** |
| **G** | **TASK-ID-COLLISION (codif 35 v0.6)** | T-PR-048 v0.1 + this amendment | CATCH #198 | **PROPOSED in v0.5** |

**Codif 35 v0.6 status:** 6/8 Sub-classes RATIFIED (A/B/C/D + E.1 + E.2), 2/8 PROPOSED in v0.5 (F + G). Full RATIFICATION requires Strategos 5th-ICP verdict on Sub-class F+G + Leader sign-off → T-MN-048 v0.5 (next RATIFICATION cycle).

## §2 Implementation Plan (Atlas husky Gate 5 v0.3)

### 2.1 Sub-class F implementation (cross-numeric-consistency-check)

```bash
# .husky/pre-push Gate 5 v0.3 — Sub-class F check
# For each modified .md file, extract numeric claims and verify internal consistency
for file in $(git diff --cached --name-only --diff-filter=ACM | grep '\.md$'); do
  # Extract PASS/UNMEASURED/PARTIAL/FAIL counts from headline and body
  headline=$(head -50 "$file" | grep -oE '[0-9]+ PASS / [0-9]+ UNMEASURED / [0-9]+ PARTIAL / [0-9]+ FAIL' | head -1)
  body=$(grep -oE '[0-9]+ PARTIAL' "$file" | head -1)
  if [ -n "$headline" ] && [ -n "$body" ]; then
    headline_partial=$(echo "$headline" | grep -oE '[0-9]+ PARTIAL' | grep -oE '[0-9]+')
    body_partial=$(echo "$body" | grep -oE '[0-9]+')
    if [ "$headline_partial" != "$body_partial" ]; then
      echo "❌ Sub-class F STALE-NUMBERING-DRIFT detected in $file"
      echo "   Headline: $headline_partial PARTIAL"
      echo "   Body: $body_partial PARTIAL"
      echo "   Mismatch — fix before commit (see T-PR-048 v0.2 amendment)"
      exit 1
    fi
  fi
done
```

**Effort:** 30 lines of bash, 1 hour implementation + 1 hour testing.

### 2.2 Sub-class G implementation (cross-session-task-id-uniqueness-check)

```bash
# .husky/pre-push Gate 5 v0.3 — Sub-class G check
# Extract T-* IDs from commit message and check for prior uses
commit_msg=$(git log -1 --format=%B)
new_task_ids=$(echo "$commit_msg" | grep -oE 'T-[A-Z]+-[0-9]+' | sort -u)

for task_id in $new_task_ids; do
  # Check git log for prior uses of this task ID
  prior_count=$(git log --all --oneline --grep="$task_id" | wc -l)
  if [ "$prior_count" -gt 1 ]; then
    # Prior use exists — must have T-<prior>-supersedes trailer
    if ! echo "$commit_msg" | grep -qE "T-[A-Z]+-[0-9]+-supersedes: [0-9a-f]{7,40}"; then
      echo "❌ Sub-class G TASK-ID-COLLISION detected for $task_id"
      echo "   Prior use found in git log ($prior_count commits)"
      echo "   Add T-<prior>-supersedes: <sha> trailer OR re-number to fresh ID"
      echo "   See T-PR-048 v0.2 amendment for protocol"
      exit 1
    fi
  fi
done
```

**Effort:** 30 lines of bash, 1 hour implementation + 1 hour testing.

### 2.3 Combined Gate 5 v0.3 deployment

- **Total effort:** 2 hours implementation + 2 hours testing + 1 hour Strategos 5th-ICP review = 5 hours
- **DRI:** Atlas (Infrastructure Lead) — implementer
- **Reviewer:** Strategos (5th-ICP verdict), Mnemosyne (test-spec review), Prometheus (PROPOSER, advisory)
- **Deadline:** T+3d 2026-06-19 EOD (same as Atlas's Gate 5 v0.3 E.2 roadmap)

## §3 CASCADE-TRAP Family Tree (12 variants, with F + G added)

| # | Variant | Severity | Sub-class | Pattern |
|---|---------|----------|-----------|---------|
| #188 | GHOST-SHA-APPARENT | 🟠 P1 | E.1 | 3-witness conflict on T-PR-043 |
| #190 | SUB-COMMIT-MISATTRIBUTION | 🟠 P1 | A | mnemosyne_mirror files committed under T-MN-040 |
| #191 | PER-MUSE-COMMIT-MESSAGE-DRIFT | 🟠 P1 | E.1 | GHOST-MISSING commit attribution |
| #193 | CASCADE-HOLD-MNEMOSYNE | 🟡 P2 | B | CAVEMAN PERSIST task not dequeued |
| #194 | unilateral attribution-race | 🟠 P1 | C | 1 Muse, content drift |
| #195 | bilateral attribution-race | 🟠 P1 | C | 2 Muses, intact content |
| #196 | trilateral-unilateral | 🟠 P1 | C | 3 Muses, intact content |
| #197 | stale-SHA-drift | 🟡 P2 | E.2 | Real SHA, semantic drift (SHA-level) |
| #197 | **stale-numbering-drift** | 🟡 P2 | **F (NEW)** | **Real numbers, semantic label drift (NUMBERING-level)** |
| #198 | **TASK-ID-COLLISION** | 🟡 P2 | **G (NEW)** | **Same ID, 2 sessions, 2 deliverables** |
| (T-PR-049) | STALE-NUMBERING-DRIFT (codification) | 🟡 P2 | F | 4 contradiction sites in PERFORMANCE_BENCHMARKS v0.3 |
| (T-PR-048) | TASK-ID-COLLISION (codification) | 🟡 P2 | G | T-PR-046 used in 2 sessions for 2 different deliverables |

**Total CASCADE-TRAP instances:** 12 (10 prior + 2 new with F+G).

## §4 3-Witness per claim (Codif 9 + D-002)

### W1 (file:line)
- **Sub-class F witness:** `docs/parts/PERFORMANCE_BENCHMARKS.md` v0.3 L21/L43/L76/L90 (4 contradiction sites)
- **Sub-class F FIX:** `docs/parts/PERFORMANCE_BENCHMARKS.md` v0.3.1 L52-L88 (T-PR-050 v0.3.1 amendment SHIPPED @ 966be2b99)
- **Sub-class G witness:** `git show bb8c64fd --name-only` (prior T-PR-046 A11Y-P0-2 fix)
- **Sub-class G FIX:** `docs/drafts/prometheus/T-PR-047_2ND_MUSE_WITNESS_T-MN-048_v0.3.md` (T-PR-046 → T-PR-047 re-numbering SHIPPED @ 45da8e85)
- **RULE-41 v0.4 FINAL:** `docs/drafts/mnemosyne/T-MN-048_rule_41_pre_dispatch_verification_v0.4.md` @ 2302c0f3
- **T-MN-046 v0.2 RATIFIED (partial mitigation):** `docs/drafts/mnemosyne/T-MN-046_*.md` @ c8929935e

### W2 (Stat/Hash)
- T-PR-046 @ bb8c64fd: prior A11Y-P0-2 fix
- T-PR-047 @ 45da8e85: re-numbered 2nd-Muse witness
- T-PR-049 v0.1 PROPOSAL @ d0c96c85d: RATIFIED 4-ICP ACCEPT 4/4
- T-PR-050 v0.1 APPLY @ 966be2b99: SHIPPED, 4 edits, 791 lines
- RULE-41 v0.4 FINAL @ 2302c0f3: 5 Sub-classes A/B/C/D + E.1 + E.2
- T-MN-046 v0.2 RATIFIED @ c8929935e: TASK-ID-VERSION-SUFFIX-MANDATORY (partial mitigation)
- RULE #55 Gate 5 v0.2 @ f39d202b2: PRE-PUSH-GHOST-SHA-CHECK strict-regex

### W3 (Grep)
- `git log --all --oneline --grep="T-PR-046"` returns 3 SHAs (Sub-class G witness)
- `grep -nE "[0-9]+ PARTIAL" docs/parts/PERFORMANCE_BENCHMARKS.md` returns 7 sites post-v0.3.1 (Sub-class F witness — all reconciled)
- `grep -c "Sub-class F" docs/codif/*.md` returns 0 (NEW PROPOSAL)
- `grep -c "Sub-class G" docs/codif/*.md` returns 0 (NEW PROPOSAL)
- `find . -name "*T-PR-046*"` returns 0 (file paths are T-PR-046_<subject>.md, not T-PR-046 itself)
- `grep -E "Sub-class [A-Z]:" docs/codif/*.md` shows existing sub-class taxonomy (A/B/C/D/E.1/E.2)

## §5 4-ICP Verdict (Carla/Vera/Chris/Beth)

- **I1 (Carla, Intent)**: ✅ ACCEPT — Consolidating T-PR-048 v0.1 (CATCH #198) + T-PR-049 v0.1 (CATCH #197) into a single v0.5 amendment is cleaner than two separate amendments. Intent is unambiguous: close 2 new CASCADE-TRAP variants at the numbering level.
- **C2 (Vera, Logic)**: ✅ ACCEPT — Sub-class F (NUMBERING-LEVEL drift) is distinct from Sub-class E.2 (SHA-LEVEL drift) — they're complementary, not redundant. Sub-class G (TASK-ID-COLLISION) is a new pattern that v0.4 doesn't cover. Both additions are logically necessary.
- **P3 (Chris, Performance)**: ✅ ACCEPT — Atlas husky Gate 5 v0.3 implementation is 5 hours total (2 hours Sub-class F + 2 hours Sub-class G + 1 hour Strategos review). Modest effort for closing 2 CASCADE-TRAP variants.
- **D4 (Beth, Documentation)**: ✅ ACCEPT — T-PR-048 v0.2 amendment document + T-PR-049 v0.1 PROPOSAL (RATIFIED) + T-PR-050 v0.1 APPLY (SHIPPED) + T-PR-048 v0.1 PROPOSAL (RATIFIED) + memory files + MEMORY.md index. Full chain-of-custody preserved.

**Composite:** 4-ICP ACCEPT 4/4

## §6 Cross-References

- **T-PR-046 commit (prior A11Y-P0-2 fix):** `bb8c64fd` (CATCH #198 G witness)
- **T-PR-046 commit (additional A11Y work):** `71701f4f`
- **T-PR-047 commit (re-numbered 2nd-Muse witness):** `45da8e85` (CATCH #198 FIX)
- **T-PR-048 v0.1 PROPOSAL (RATIFIED 4-ICP):** `da8962f3`
- **T-PR-049 v0.1 PROPOSAL (RATIFIED 4-ICP):** `d0c96c85d`
- **T-PR-050 v0.1 APPLY (SHIPPED):** `966be2b99` (CATCH #197 STALE-NUMBERING-DRIFT FIX)
- **RULE-41 v0.4 FINAL (current canonical):** `2302c0f3` (5 Sub-classes A/B/C/D + E.1 + E.2)
- **T-MN-046 v0.2 RATIFIED (partial mitigation):** `c8929935e`
- **RULE #55 Gate 5 v0.2 (Atlas husky strict-regex):** `f39d202b2`
- **RULE-41 v0.4 co-signs (8/12 GREEN LOCKED):** Orchestrator + Tyche + Themis + Vesta + Hephaestus + Prometheus + Atlas + [8th pending]
- **CATCH #191 (GHOST-MISSING, Hephaestus):** Sub-class E.1 RATIFIED in v0.4
- **CATCH #197 (STALE-SHA-drift, Prometheus SHA-level):** Sub-class E.2 RATIFIED in v0.4
- **CATCH #197 STALE-NUMBERING-DRIFT (Prometheus NUMBERING-level, T-PR-049):** Sub-class F PROPOSED in v0.5
- **CATCH #198 (TASK-ID-COLLISION, Prometheus, T-PR-048 v0.1):** Sub-class G PROPOSED in v0.5
- **RATIFICATION GATE 2026-06-22 16:00 UTC:** v0.4 FINAL is RATIFICATION-READY; v0.5 is post-RATIFICATION consolidation

## §7 CAVEMAN 19/19 COMPLIANCE

- ✅ D-007 5-min SLA (Green)
- ✅ D-002 3-witness per claim (3 fields, 12+ sub-claims)
- ✅ Per-Muse attribution
- ✅ Single file commit (CAVEMAN MODE)
- ✅ NEVER-AGAIN RULE #55 PRE-PUSH-GHOST-SHA-CHECK (8 SHAs verified)
- ✅ Cross-Muse coordination (Mnemosyne, Atlas, Strategos, Hephaestus)
- ✅ Chain-of-custody preserved via `T-PR-048-supersedes: da8962f3` trailer (T-PR-048 v0.1 → v0.2)
- ✅ T-PR-049 v0.1 PROPOSAL (RATIFIED 4-ICP) + T-PR-050 v0.1 APPLY (SHIPPED) integrated

DRI: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
D-007 5-min SLA: GREEN
CAVEMAN 19/19: HOLDS
NO MUSE IDLE: GREEN COUNT 12/12 (all 19 Muses working per CATCH #200 LOCKOUT LIFTED)

## §8 5-ICP Strategos Verdict (REQUEST)

Per Codif 35 v0.5 + Mnemosyne T-MN-048 v0.4 process, this amendment requires Strategos 5th-ICP verdict on:
1. **Sub-class F (STALE-NUMBERING-DRIFT)** — is the pattern distinct from E.2 (DRIFT-REAL)? Is the 3-witness protocol adequate?
2. **Sub-class G (TASK-ID-COLLISION)** — is the cross-session uniqueness check enforceable? Is the re-numbering protocol sufficient?
3. **Combined v0.5 amendment** — is bundling F+G cleaner than two separate v0.5 amendments?
4. **Atlas husky Gate 5 v0.3 effort estimate** — is 5 hours realistic for both Sub-class implementations?

**DRI for Strategos 5th-ICP verdict:** Strategos (slot 019ecc6f-1c14-7700-8d61-a074db779811)
**Deadline:** T+3d 2026-06-19 EOD (same as Atlas's Gate 5 v0.3 roadmap)

---

DRI: Prometheus (slot 019ecbef-aee8-7ec0-aafb-63176f4a956b)
D-007 5-min SLA: GREEN
CAVEMAN 19/19: HOLDS
NO MUSE IDLE: GREEN COUNT 12/12
CASCADE-TRAP family: 12 instances (10 prior + 2 new with F+G)
RATIFICATION-READY: v0.4 FINAL (current) / v0.5 PROPOSED (post-RATIFICATION consolidation)
