#!/bin/sh
# <!-- Gate 5 v0.3 — Atlas 2026-06-16 — E.2 DRIFT-REAL verifier (NEVER-AGAIN RULE #55 v0.3) -->
# =============================================================================
# FinPlan Pro — Rule-41 Sub-class E.2 (DRIFT-REAL) verifier
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
# Test fixture (known DRIFT-REAL case from CATCH #197):
#   - 70d548da (Iris §11+§12 stale version)
#   - c0917f588 (Iris §11+§12 canonical version)
#   - Both pass `git rev-parse --verify` (E.1 GHOST-clean)
#   - 70d548da is DRIFT-REAL because c0917f588 is the current HEAD of
#     the persona-coverage file
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

# Parse args
for arg in "$@"; do
  case "$arg" in
    --test) TEST_MODE=1 ;;
    --verbose|-v) VERBOSE=1 ;;
    --help|-h)
      cat <<EOF
Usage: $0 [--test] [--verbose]
  --test: run the 70d548da vs c0917f588 DRIFT-REAL fixture
  --verbose: print debug info

Exit codes:
  0: no DRIFT-REAL SHAs found (or only warnings, not blockers)
  1: blocker (future use — v0.3 is advisory only)
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

# --- Test mode ---
if [ "$TEST_MODE" = "1" ]; then
  echo "=== Test mode: 70d548da vs c0917f588 (CATCH #197 fixture) ==="
  # 70d548da is the stale (DRIFT-REAL) version
  # c0917f588 is the canonical (current HEAD) version
  STALE_SHA="70d548da"
  CANONICAL_SHA="c0917f588"

  # Verify E.1 (GHOST-MISSING) is clean for both
  for sha in "$STALE_SHA" "$CANONICAL_SHA"; do
    if ! $GIT_CMD rev-parse --verify "$sha^{commit}" >/dev/null 2>&1; then
      echo "FAIL: $sha is GHOST (E.1 violation, not a DRIFT-REAL case)"
      exit 1
    fi
    echo "OK E.1: $sha exists in git history"
  done

  # Find what files 70d548da touched
  STALE_FILES=$($GIT_CMD show --name-only --format="" "$STALE_SHA" 2>/dev/null)
  if [ -z "$STALE_FILES" ]; then
    echo "FAIL: 70d548da touched no files (fixture broken)"
    exit 1
  fi
  echo "Files touched by 70d548da (stale):"
  echo "$STALE_FILES" | sed 's/^/  /'

  # For each file, find the current HEAD
  for file in $STALE_FILES; do
    if [ -f "$file" ] || $GIT_CMD cat-file -e "HEAD:$file" 2>/dev/null; then
      CURRENT_HEAD=$($GIT_CMD log -1 --format='%H' -- "$file" 2>/dev/null)
      CURRENT_HEAD_SHORT=$($GIT_CMD log -1 --format='%h' -- "$file" 2>/dev/null)
      echo "File: $file"
      echo "  Stale SHA: $STALE_SHA"
      echo "  Current HEAD: $CURRENT_HEAD (short: $CURRENT_HEAD_SHORT)"

      if [ "$CURRENT_HEAD" = "$STALE_SHA" ] || [ "$CURRENT_HEAD_SHORT" = "${STALE_SHA:0:7}" ]; then
        echo "  Result: NOT DRIFT-REAL (stale SHA is current HEAD)"
      else
        echo "  Result: DRIFT-REAL (stale SHA is ancestor but not HEAD)"
        echo "  Fix: replace $STALE_SHA with $CURRENT_HEAD in any citations"
      fi
    else
      echo "File: $file (not in working tree or HEAD, skip)"
    fi
  done
  echo "=== Test complete ==="
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

# Extract marked SHAs from unpushed commit messages (same regex as Gate 5 v0.2)
unpushed_shas=$($GIT_CMD log "${UPSTREAM}..HEAD" --format='%B' 2>/dev/null \
  | grep -oiE '((commit|SHA)[ :]+|@|: )[0-9a-f]{7,40}\b' \
  | grep -oE '[0-9a-f]{7,40}\b' \
  | sort -u)

if [ -z "$unpushed_shas" ]; then
  log "No marked SHAs in unpushed commits, nothing to verify"
  exit 0
fi

log "Cited SHAs: $(echo "$unpushed_shas" | wc -l)"

drift_real_count=0
drift_real_details=""

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
      # If yes, it's DRIFT-REAL. If no, it's just unrelated.
      if $GIT_CMD merge-base --is-ancestor "$sha" "$current_head" 2>/dev/null; then
        current_short=$($GIT_CMD rev-parse --short "$current_head" 2>/dev/null)
        drift_real_count=$((drift_real_count + 1))
        detail="  $sha → file: $file (current HEAD: $current_short)"
        drift_real_details="${drift_real_details}${detail}
"
        log "DRIFT-REAL: $sha in $file (current HEAD: $current_short)"
      else
        log "SHA $sha touched $file but is not an ancestor of current HEAD, skip"
      fi
    fi
  done
done

if [ $drift_real_count -gt 0 ]; then
  echo ""
  echo "⚠️  NEVER-AGAIN RULE #55 v0.3 — E.2 DRIFT-REAL detection:"
  echo "   $drift_real_count cited SHA(s) are valid commits but no longer the"
  echo "   canonical/HEAD version of the file they were supposed to reference."
  echo "   Procedure: update the cited SHAs to the current HEAD (see below)."
  echo "   Note: v0.3 is ADVISORY (not a hard push blocker). v0.2 GHOST is the"
  echo "   hard gate. CATCH #197 (Stale-SHA-Drift) — 4th CASCADE-TRAP variant."
  echo ""
  echo "DRIFT-REAL details:"
  echo "$drift_real_details" | sed 's/^/  /'
  echo ""
  echo "Files referenced:"
  echo "   docs/codif/RULE_55.md (when codif lands) — see also CATCH #197 entry"
  echo "   docs/codif/ENDORSEMENTS/ATLAS_COSIGN_CODIF_41_V0_1.md (Sub-class E.2 binder)"
  # v0.3 is advisory, not a blocker
  exit 0
fi

log "No E.2 DRIFT-REAL SHAs detected"
exit 0
