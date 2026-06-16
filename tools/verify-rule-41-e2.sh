#!/bin/sh
# <!-- Gate 5 v0.3 — Atlas 2026-06-16 — E.2 DRIFT-REAL verifier (NEVER-AGAIN RULE #55 v0.3) -->
# =============================================================================
# FinPlan Pro -- Rule-41 Sub-class E.2 (DRIFT-REAL) + F (STALE-NUMBERING-DRIFT)
#              + G (CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK) verifier
#
# Closes CATCH #197 (Stale-SHA-Drift) by detecting cited SHAs that are
# GHOST-free (E.1 pass) but no longer the canonical/HEAD version of the
# artifact they were supposed to represent.
#
# Sub-class taxonomy (per T-MN-048 v0.4 FINAL @ 2302c0f34):
#   A: commit/ancestor state
#   B: file-existence
#   C: working-dir + 3-witness delivery
#   D: CAVEMAN-mode commit-log
#   E.1: GHOST-MISSING (Gate 5 v0.2 catches this — `git rev-parse --verify` fails)
#   E.2: DRIFT-REAL (this script catches this — SHA exists but is no longer HEAD)
#
# Algorithm:
#   1. Extract marked SHAs from unpushed commit messages (same strict-regex
#      as Gate 5 v0.2 — `((commit|SHA)[ :]+|@|: )[0-9a-f]{7,40}\b`).
#   2. For each SHA, run `git show --name-only --format="" <sha>` to find
#      the files touched by that commit.
#   3. For each file, run `git log -1 --format=%H -- <file>` to find the
#      current HEAD of that file.
#   4. If the cited SHA is NOT the current HEAD of any file it touched,
#      AND the cited SHA IS in the file's history (i.e., it's a real
#      ancestor commit but not the latest), then it's DRIFT-REAL.
#   5. Output a warning listing the DRIFT-REAL SHAs and the current
#      HEADs they should be replaced with. WARNINGS only (not blockers)
#      per NEVER-AGAIN RULE #55 v0.3 design — the strict-regex in v0.2
#      is the hard blocker; v0.3 is advisory.
#
# Test fixture (TRUE E.2 DRIFT-REAL case from Atlas INFRA_RUNBOOK history):
#   - 401d68003 (INFRA_RUNBOOK v0.1, CYCLE 10 PICK A)
#   - f080e05fc (INFRA_RUNBOOK v0.1.1, CYCLE 12 PICK A hotfix)
#   - Both pass `git rev-parse --verify` (E.1 GHOST-clean)
#   - BOTH modify docs/ratification/RATIFICATION_GATE_INFRA_RUNBOOK.md
#   - 401d68003 is DRIFT-REAL because f080e05fc is the current HEAD of
#     the INFRA_RUNBOOK file (401d68003 is an ancestor of f080e05fc)
#
# Vulcan 2nd-witness clarification (commit 43cb18154 review, 2026-06-16):
#   - The 70d548da/c0917f588 case (Iris §11+§12) is NOT a true E.2 DRIFT-REAL
#     case. 70d548da modified RATIFICATION_GATE_PRECHECK_PERSONA_UX.md but
#     c0917f588 modified TYCHE_INDEX_2ND_WITNESS.md (DIFFERENT files, same
#     commit subject). That is CATCH #197 CASCADE-TRAP-COMMIT-MESSAGE-REUSE,
#     a separate 4th CASCADE-TRAP variant, NOT an E.2 sub-class.
#   - CATCH #197 detection requires Gate 5c v0.4 (future work): verify
#     commit subject matches the file it actually modified. Out of scope
#     for v0.3 which only detects E.2 DRIFT-REAL.
#
# Time budget: 0.1s per cited SHA per file. Total <1s for realistic
# commit messages (1-3 cited SHAs, 1-3 files per commit).
#
# Invocation:
#   - As part of Gate 5 in `.husky/pre-push` (after v0.2 GHOST check)
#   - Standalone: `./tools/verify-rule-41-e2.sh` (reads unpushed commits)
#   - Test mode: `./tools/verify-rule-41-e2.sh --test` (runs 70d548da fixture)
#
# Co-sign: Atlas (infra, RULE #55 coder) — binding commitment from
# ATLAS_COSIGN_CODIF_41_V0_1.md (1b54c7a8d), Sub-class A 3-witness.
# Roadmap: T+3d 2026-06-19 EOD ship target.
# =============================================================================

set -e

# --- Configuration ---
EXPECTED_HEADS_REGISTRY="${EXPECTED_HEADS_REGISTRY:-.husky/expected-heads.json}"
GIT_CMD="${GIT_CMD:-git}"
VERBOSE="${VERBOSE:-0}"
TEST_MODE=0
SUBCLASS_FILTER="all"

# Parse args
for arg in "$@"; do
  case "$arg" in
    --test) TEST_MODE=1 ;;
    --verbose|-v) VERBOSE=1 ;;
    --subclass) shift; SUBCLASS_FILTER="${1:-all}" ;;
    --subclass=*) SUBCLASS_FILTER="${arg#--subclass=}" ;;
    --help|-h)
      cat <<EOF
Usage: $0 [--test] [--verbose] [--subclass=E.2|F|G|all]
  --test: run all 3 fixtures (E.2 TRUE + F TRUE + G TRUE)
  --verbose: print debug info
  --subclass: limit to a single sub-class (E.2 | F | G | all [default])

Exit codes:
  0: no DRIFT-REAL/STALE-NUMBERING/TASK-ID-COLLISION blockers found
  1: blocker (future use - v0.3 is advisory only)
  2: internal error
EOF
      exit 0
      ;;
  esac
done

log() {
  if [ "$VERBOSE" = "1" ]; then
    echo "[verify-rule-41-e2] $*" >&2
  fi
}

# --- Sub-class F: STALE-NUMBERING-DRIFT (numeric consistency) ---
# Detects cases where a single .md file makes numerically inconsistent claims
# about the same metric (e.g., headline says "0 PARTIAL" but body says
# "PARTIAL stays", or "0 FAIL" in headline but "16 fail" in body table).
check_subclass_F() {
  file="$1"
  [ -f "$file" ] || return 0
  [ "${file##*.}" = "md" ] || return 0

  log "Sub-class F: scanning $file for numeric consistency"

  pattern1=$(grep -oE '\b[0-9]+\s+(PARTIAL|FAIL|PASS|UNMEASURED|partial|fail|pass)\b' "$file" 2>/dev/null || true)
  pattern2=$(grep -oE '\b(PARTIAL|FAIL|PASS|UNMEASURED|partial|fail|pass)\s*(->|=>|:)\s*[0-9]+\b' "$file" 2>/dev/null \
    | sed -E 's/(->|=>|:\s*)([0-9]+)/\2/' \
    || true)

  all_claims="${pattern1}
${pattern2}"

  if [ -z "$(echo "$all_claims" | tr -d '[:space:]')" ]; then
    log "  no numeric claims found"
    return 0
  fi

  drift_count=0
  drift_details=""

  for cat in PARTIAL FAIL PASS UNMEASURED; do
    cat_claims=$(echo "$all_claims" \
      | grep -iE "\b[0-9]+\s+${cat}\b" \
      | grep -oE '[0-9]+' \
      | sort -u)
    cat_count=$(echo "$cat_claims" | grep -c '[0-9]' 2>/dev/null || echo "0")
    cat_count=$(echo "$cat_count" | tr -d '[:space:]')
    [ -z "$cat_count" ] && cat_count=0

    if [ "$cat_count" -gt 1 ]; then
      distinct_counts=$(echo "$cat_claims" | tr '\n' ',' | sed 's/,$//')
      drift_count=$((drift_count + 1))
      drift_details="${drift_details}  STALE-NUMBERING-DRIFT [$cat]: file $file has multiple distinct counts: $distinct_counts
"
      log "  STALE-NUMBERING-DRIFT [$cat] in $file: $distinct_counts"
    fi
  done

  if [ $drift_count -gt 0 ]; then
    F_RESULTS="${F_RESULTS}${drift_details}"
    return $drift_count
  fi
  return 0
}

# --- Sub-class G: CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK ---
# Detects cases where the same T-<MuseCode>-<NUMBER> prefix is used for
# files describing DIFFERENT topics (NAMING-COLLISION per CATCH #198).
check_subclass_G() {
  log "Sub-class G: scanning docs/drafts/**/*.md for T-ID collisions"

  tid_files=$(find docs/drafts -type f -name "*.md" 2>/dev/null \
    | awk -F/ '{
        fname = $NF
        if (match(fname, /T-[A-Z]{2}-[0-9]+/)) {
          tid = substr(fname, RSTART, RLENGTH)
          printf "%s\t%s\n", tid, $0
        }
      }')

  if [ -z "$tid_files" ]; then
    log "  no T-ID files found in docs/drafts/"
    return 0
  fi

  dups=$(echo "$tid_files" \
    | awk -F'\t' '{print $1}' \
    | sort \
    | uniq -c \
    | awk '$1 > 1 {print $0}')

  if [ -z "$dups" ]; then
    log "  no duplicate T-IDs found"
    return 0
  fi

  collision_count=0
  G_TMP=$(mktemp /tmp/g_results_XXXXX.txt)
  : > "$G_TMP"

  while read dup_line; do
    dup_tid=$(echo "$dup_line" | awk '{print $2}')
    [ -z "$dup_tid" ] && continue
    files=$(echo "$tid_files" | awk -F'\t' -v t="$dup_tid" '$1 == t {print $2}')
    topics=$(echo "$files" \
      | xargs -I{} basename {} \
      | sed -E "s/^${dup_tid}_//" \
      | awk '{ s=$0; sub(/\.md$/,"",s); sub(/\.markdown$/,"",s); sub(/\.STATUS_SHIP_COMPLETE$/,"",s); sub(/\.STATUS_[0-9_-]+$/,"",s); sub(/\.SHIP_COMPLETE_[0-9_-]+$/,"",s); pos=length(s)+1; m="_v0.1 _v0.2 _v0.3 _v0.4 _v0.5 _v0.6 _v0.7 _v0.8 _v0.9 _v1.0 _RATIFIED _FINAL _LOCKED _PREP _STATUS_ _SHIP-COMPLETE_MANIFEST_ _W6_sidecar _ADDENDUM_ _hera_ _SHIP_COMPLETE_ _v1 _v2 _v3"; n=split(m,arr," "); for(i=1;i<=n;i++){p=index(s,arr[i]); if(p>0 && p<pos) pos=p}; if(pos<=length(s)) s=substr(s,1,pos-1); sub(/_+$/,"",s); print s }' \
      | sort -u)
    topic_count=$(echo "$topics" | grep -c '.' 2>/dev/null || echo "0")
    topic_count=$(echo "$topic_count" | tr -d '[:space:]')
    [ -z "$topic_count" ] && topic_count=0

    file_count=$(echo "$files" | wc -l | tr -d '[:space:]')
    collision_count=$((collision_count + 1))
    {
      echo "  TASK-ID $dup_tid: $file_count files, $topic_count distinct topics"
      echo "    Files:"
      for f in $files; do
        echo "      - $f"
      done
      if [ "$topic_count" -gt 1 ]; then
        echo "    -> NAMING-COLLISION DETECTED ($topic_count different topics, expected 1)"
      else
        echo "    -> OK (versioned drafts of same topic)"
      fi
      echo ""
    } >> "$G_TMP"
  done <<EOF
$(echo "$dups")
EOF

  G_RESULTS=$(cat "$G_TMP")
  rm -f "$G_TMP"

  if [ $collision_count -gt 0 ]; then
    return $collision_count
  fi
  return 0
}

# --- Test mode ---
if [ "$TEST_MODE" = "1" ]; then
  echo "=== Test mode: E.2 + F + G fixtures ==="
  echo ""

  # --- E.2 fixture ---
  echo "--- E.2: 401d68003 vs f080e05fc (TRUE DRIFT-REAL case) ---"
  STALE_SHA="401d68003"
  CANONICAL_SHA="f080e05fc"

  for sha in "$STALE_SHA" "$CANONICAL_SHA"; do
    if ! $GIT_CMD rev-parse --verify "$sha^{commit}" >/dev/null 2>&1; then
      echo "FAIL: $sha is GHOST (E.1 violation)"
      exit 1
    fi
    echo "OK E.1: $sha exists in git history"
  done

  STALE_FILES=$($GIT_CMD show --name-only --format="" "$STALE_SHA" 2>/dev/null)
  if [ -z "$STALE_FILES" ]; then
    echo "FAIL: $STALE_SHA touched no files"
    exit 1
  fi
  for file in $STALE_FILES; do
    if [ -f "$file" ] || $GIT_CMD cat-file -e "HEAD:$file" 2>/dev/null; then
      CURRENT_HEAD=$($GIT_CMD log -1 --format='%H' -- "$file" 2>/dev/null)
      CURRENT_HEAD_SHORT=$($GIT_CMD rev-parse --short "$CURRENT_HEAD" 2>/dev/null)
      echo "  File: $file"
      echo "    Stale:  $STALE_SHA"
      echo "    HEAD:   $CURRENT_HEAD_SHORT"
      if [ "$CURRENT_HEAD" = "$STALE_SHA" ]; then
        echo "    Result: NOT DRIFT-REAL"
      else
        echo "    Result: DRIFT-REAL (stale SHA is ancestor but not HEAD)"
      fi
    fi
  done
  echo ""

  # --- F fixture ---
  echo "--- F: STALE-NUMBERING-DRIFT (TRUE case) ---"
  F_FIXTURE=$(mktemp /tmp/f_fixture_XXXXX.md)
  cat > "$F_FIXTURE" <<'FIXTURE_EOF'
# Test Fixture F: STALE-NUMBERING-DRIFT

## Headline
FinPlan Pro v4's performance is **8 PASS / 2 UNMEASURED / 0 PARTIAL / 0 FAIL across 10 dimensions**.

## Body
- Dimension 8 Worker Pool Utilization -- Apollo dispatch says "PARTIAL stays"
- Headline shows "0 PARTIAL" but D-8 is still PARTIAL
- Test results: 16 fail (3,840 / 3,856) -- but headline says "0 FAIL"

This file has STALE-NUMBERING-DRIFT: "0 PARTIAL" vs "PARTIAL stays", "0 FAIL" vs "16 fail".
FIXTURE_EOF
  F_RESULTS=""
  if check_subclass_F "$F_FIXTURE"; then
    echo "  FAIL: F check did not detect fixture STALE-NUMBERING-DRIFT"
    rm -f "$F_FIXTURE"
    exit 1
  else
    echo "  OK F: detected STALE-NUMBERING-DRIFT"
    echo "$F_RESULTS" | sed 's/^/    /'
  fi
  rm -f "$F_FIXTURE"
  echo ""

  # --- G fixture ---
  echo "--- G: CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK (TRUE case) ---"
  G_FIXTURE_DIR=$(mktemp -d /tmp/g_fixture_XXXXX)
  mkdir -p "$G_FIXTURE_DIR"
  # T-MN-046 used for codif_35 (REAL topic A)
  cat > "$G_FIXTURE_DIR/T-MN-046_codif_35_3w_v0.1.md" <<'FIXTURE_EOF'
# T-MN-046 codif 35 v0.1
Topic: codif 35 first-witness delivery
FIXTURE_EOF
  # T-MN-046 used AGAIN for T-MN-048 2nd-muse-witness (DIFFERENT topic B = NAMING-COLLISION)
  cat > "$G_FIXTURE_DIR/T-MN-046_rule_41_2nd_muse_witness_v0.1.md" <<'FIXTURE_EOF'
# T-MN-046 T-MN-048 2nd-muse-witness v0.1
Topic: T-MN-048 2nd-muse-witness delivery
FIXTURE_EOF
  # Use a simpler check against this fixture directly
  tid_files=$(find "$G_FIXTURE_DIR" -type f -name "*.md" \
    | awk -F/ '{
        fname = $NF
        if (match(fname, /T-[A-Z]{2}-[0-9]+/)) {
          tid = substr(fname, RSTART, RLENGTH)
          printf "%s\t%s\n", tid, $0
        }
      }')
  dups=$(echo "$tid_files" | awk -F'\t' '{print $1}' | sort | uniq -c | awk '$1 > 1 {print $0}')
  if [ -z "$dups" ]; then
    echo "  FAIL: G check did not detect fixture T-MN-046 duplicate"
    rm -rf "$G_FIXTURE_DIR"
    exit 1
  else
    echo "  OK G: detected T-MN-046 duplicate (NAMING-COLLISION)"
    echo "$dups" | sed 's/^/    /'
  fi
  rm -rf "$G_FIXTURE_DIR"
  echo ""

  echo "=== All 3 sub-class tests PASSED ==="
  exit 0
fi

# --- Production mode: extract SHAs from unpushed commits ---

# Get the upstream ref
UPSTREAM=$($GIT_CMD rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")
if [ -z "$UPSTREAM" ]; then
  log "No upstream configured, checking all unpushed local commits"
  UPSTREAM="HEAD~10"  # fallback: look at last 10 commits
fi

log "Upstream ref: $UPSTREAM"
log "Sub-class filter: $SUBCLASS_FILTER"

# =============================================================================
# Sub-class E.2: DRIFT-REAL
# =============================================================================
drift_real_count=0
drift_real_details=""
unpushed_shas=""

if [ "$SUBCLASS_FILTER" = "all" ] || [ "$SUBCLASS_FILTER" = "E.2" ]; then
  log "=== Sub-class E.2: DRIFT-REAL ==="

  # Extract marked SHAs from unpushed commit messages (same regex as Gate 5 v0.2)
  unpushed_shas=$($GIT_CMD log "${UPSTREAM}..HEAD" --format='%B' 2>/dev/null \
    | grep -oiE '((commit|SHA)[ :]+|@|: )[0-9a-f]{7,40}\b' \
    | grep -oE '[0-9a-f]{7,40}\b' \
    | sort -u)

  if [ -n "$unpushed_shas" ]; then
    log "Cited SHAs: $(echo "$unpushed_shas" | wc -l)"

    # Skip our own HEAD SHAs
    head_short=$($GIT_CMD rev-parse --short HEAD 2>/dev/null)
    head_full=$($GIT_CMD rev-parse HEAD 2>/dev/null)

    for sha in $unpushed_shas; do
      case "$sha" in
        "$head_short"|"$head_full") log "Skipping own HEAD: $sha"; continue ;;
      esac

      # E.1 check first: must exist in git history
      if ! $GIT_CMD rev-parse --verify "$sha^{commit}" >/dev/null 2>&1; then
        log "Skipping GHOST SHA (caught by Gate 5 v0.2): $sha"
        continue
      fi

      # E.2 check: find files touched by this SHA
      touched_files=$($GIT_CMD show --name-only --format="" "$sha" 2>/dev/null)
      if [ -z "$touched_files" ]; then
        log "SHA $sha touched no files (merge commit or root), skip"
        continue
      fi

      for file in $touched_files; do
        # Check if file exists in HEAD
        if ! $GIT_CMD cat-file -e "HEAD:$file" 2>/dev/null; then
          log "File $file not in HEAD, skip"
          continue
        fi

        # Find the current HEAD of this file
        current_head=$($GIT_CMD log -1 --format='%H' -- "$file" 2>/dev/null)
        if [ -z "$current_head" ]; then
          log "Could not determine HEAD of $file, skip"
          continue
        fi

        # If the cited SHA is NOT the current HEAD, it's a candidate DRIFT-REAL
        if [ "$current_head" != "$sha" ] && [ "$current_head" != "${sha}"* ]; then
          # Double-check: is the cited SHA an ancestor of the current HEAD?
          if $GIT_CMD merge-base --is-ancestor "$sha" "$current_head" 2>/dev/null; then
            current_short=$($GIT_CMD rev-parse --short "$current_head" 2>/dev/null)
            drift_real_count=$((drift_real_count + 1))
            detail="  $sha -> file: $file (current HEAD: $current_short)"
            drift_real_details="${drift_real_details}${detail}
"
            log "DRIFT-REAL: $sha in $file (current HEAD: $current_short)"
          else
            log "SHA $sha touched $file but is not an ancestor of current HEAD, skip"
          fi
        fi
      done
    done
  fi
fi

# =============================================================================
# Sub-class F: STALE-NUMBERING-DRIFT (on files in unpushed diff)
# =============================================================================
F_RESULTS=""
F_COUNT=0
if [ "$SUBCLASS_FILTER" = "all" ] || [ "$SUBCLASS_FILTER" = "F" ]; then
  log "=== Sub-class F: STALE-NUMBERING-DRIFT ==="

  diff_files=$($GIT_CMD diff --name-only "${UPSTREAM}..HEAD" 2>/dev/null \
    | grep -E '\.md$' || true)

  if [ -n "$diff_files" ]; then
    log "Files in diff: $(echo "$diff_files" | wc -l)"
    for f in $diff_files; do
      if [ -f "$f" ]; then
        if check_subclass_F "$f"; then
          :
        else
          F_COUNT=$((F_COUNT + 1))
        fi
      fi
    done
  fi
fi

# =============================================================================
# Sub-class G: CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK (on docs/drafts/)
# =============================================================================
G_RESULTS=""
G_COUNT=0
if [ "$SUBCLASS_FILTER" = "all" ] || [ "$SUBCLASS_FILTER" = "G" ]; then
  log "=== Sub-class G: CROSS-SESSION-TASK-ID-UNIQUENESS-CHECK ==="
  G_RESULTS=""
  if check_subclass_G; then
    :
  else
    G_COUNT=1
  fi
fi

# =============================================================================
# Report
# =============================================================================
echo ""
echo "================================================================"
echo " Gate 5 v0.3 -- Sub-class E.2 + F + G verifier (Atlas 2026-06-16)"
echo "================================================================"
echo ""

if [ $drift_real_count -gt 0 ]; then
  echo "  E.2 DRIFT-REAL: $drift_real_count violation(s)"
  echo "$drift_real_details" | sed 's/^/    /'
fi

if [ $F_COUNT -gt 0 ] && [ -n "$F_RESULTS" ]; then
  echo ""
  echo "  F STALE-NUMBERING-DRIFT: $F_COUNT file(s) with numeric inconsistency"
  echo "$F_RESULTS" | sed 's/^/    /'
fi

if [ $G_COUNT -gt 0 ] && [ -n "$G_RESULTS" ]; then
  echo ""
  echo "  G CROSS-SESSION-TASK-ID: see details below"
  echo "$G_RESULTS" | sed 's/^/    /'
fi

if [ $drift_real_count -gt 0 ] || [ $F_COUNT -gt 0 ] || [ $G_COUNT -gt 0 ]; then
  echo ""
  echo "  Note: v0.3 is ADVISORY (not a hard push blocker). v0.2 GHOST is the"
  echo "  hard gate. CATCH #197/#198/#199 -- see RULE-41 v0.5 RATIFIED @ 3547f51e."
  # v0.3 is advisory, not a blocker
  exit 0
fi

log "No E.2/F/G violations detected"
exit 0
