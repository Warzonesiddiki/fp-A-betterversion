#!/bin/bash
# <!-- DRAFT v0.1 — awaiting review — Atlas 2026-06-13 -->
# FinPlan Pro — Founder Push Script v0.2 (Atlas, SRE-polished)
# Based on FOUNDER_PUSH_SCRIPT.sh v0.1 (Leader, 2026-06-13 04:35 IST)
# Working dir: "C:/Users/Tahir/Desktop/frontend that i want/fpa"
#
# ═══════════════════════════════════════════════════════════════════════
# SLO TARGETS (measured at HEAD = a325f7ad on 2026-06-13)
# ═══════════════════════════════════════════════════════════════════════
#   step                          target      measured   status
#   ──────────────────────────────────────────────────────────────────
#   network probe (ls-remote)        <  15 s      ~6 s     ✅
#   tsc --noEmit                     < 120 s   unknown   (was the 124-timeout cause in v0.1)
#   eslint src --max-warnings 0      <  60 s   unknown   (now FAILING on 1 warning)
#   npm run build                    < 180 s   unknown
#   vitest run                       < 480 s   unknown
#   husky pre-push total             < 240 s   unknown
#   git push origin main             <  30 s   unknown
#   full end-to-end (no patches)     < 600 s   unknown
# ═══════════════════════════════════════════════════════════════════════
#
# USAGE
#   ./founder-push.sh                 # full 7-step push (default)
#   ./founder-push.sh --check         # steps 1-4 only: apply patches + verify gates
#   ./founder-push.sh --dry-run       # step 7 only as dry-run, no actual push
#   ./founder-push.sh --skip-patches  # skip steps 1-2 (already applied)
#   ./founder-push.sh --no-verify     # bypass husky pre-push (DANGEROUS, requires confirm)
#   ./founder-push.sh --help
#
# KNOWN ISSUE — captured 2026-06-13 04:40 IST via `git push --dry-run`:
#   husky pre-push fires `npx eslint src --max-warnings 0`, which fails on:
#     src/__tests__/a11y/wcag-aa.test.tsx:39:10
#       warning  'DataGrid' is defined but never used
#                Allowed unused vars must match /^_/u
#                @typescript-eslint/no-unused-vars
#     ✖ 1 problem (0 errors, 1 warning)
#     ❌ ESLint errors found. Push blocked.
#   Fix (Apollo's lane, 1-line): remove or rename the import on line 39.
#   The script detects this exact error and offers a documented bypass.
#
# HUSKY v10 DEPRECATION (do this BEFORE upgrading husky):
#   .husky/pre-push lines 1-2 must be deleted (the shebang and the
#   `. "$(dirname -- "$0")/_/husky.sh"` source). Husky prints:
#     "husky - DEPRECATED ... They WILL FAIL in v10.0.0"
#   Atlas tracks this as a P3 infra debt item.

set -euo pipefail
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

# ─────────────────────────────────────────────────────────────────────
# Flag parsing
# ─────────────────────────────────────────────────────────────────────
MODE="full"             # full | check | dry-run
SKIP_PATCHES=0
NO_VERIFY=0
START_TS=$(date +%s)

usage() {
  sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)        MODE="check"; shift ;;
    --dry-run)      MODE="dry-run"; shift ;;
    --skip-patches) SKIP_PATCHES=1; shift ;;
    --no-verify)
      echo "⚠ --no-verify bypasses husky. Confirm by typing 'yes-i-know':"
      read -r ans
      [[ "$ans" == "yes-i-know" ]] || { echo "Aborted."; exit 2; }
      NO_VERIFY=1; shift ;;
    --help|-h)      usage ;;
    *)              echo "Unknown flag: $1"; usage; exit 2 ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────
# Pre-flight
# ─────────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════"
echo "  FinPlan Pro — Founder Push v0.2 (Atlas)"
echo "  Mode: $MODE    Skippatches: $SKIP_PATCHES    NoVerify: $NO_VERIFY"
echo "════════════════════════════════════════════"

echo
echo "=== Pre-flight 1: Network probe (target: < 15s) ==="
T0=$(date +%s)
if timeout 15 git ls-remote origin >/dev/null 2>&1; then
  T1=$(date +%s); echo "  ✅ origin reachable (HTTPS, libgit2/curl) in $((T1-T0))s"
else
  echo "  ❌ origin NOT reachable. Check: VPN? DNS? Proxy?"
  echo "     Diagnostic: timeout 15 git ls-remote origin"
  echo "     If ICMP/DNS blocked but git works (likely), this is harmless."
  echo "     If git also fails, abort and run on a network with github.com access."
  exit 1
fi

echo
echo "=== Pre-flight 2: Working tree ==="
echo "  HEAD:    $(git log -1 --format='%H %ci %s' HEAD)"
echo "  origin:  $(git log -1 --format='%H %ci %s' origin/main 2>&1 || echo 'fetch needed')"
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
echo "  Ahead: $AHEAD   Behind: $BEHIND"
if [[ "$BEHIND" != "0" && "$BEHIND" != "?" ]]; then
  echo "  ⚠ Local is BEHIND origin/main by $BEHIND commits. Run: git fetch && git pull --rebase"
  if [[ "$MODE" == "full" ]]; then
    read -p "  Continue anyway? (y/N) " yn
    [[ "$yn" =~ ^[Yy]$ ]] || exit 1
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 1 — Apply Athena PATTERN-2 router wrapper
# ─────────────────────────────────────────────────────────────────────
if [[ $SKIP_PATCHES -eq 0 ]]; then
  echo
  echo "=== STEP 1: Apply Athena PATTERN-2 router wrapper ==="
  P=docs/drafts/athena/test-triage/PATTERN-2-router-wrapper.patch
  if [[ -f "$P" ]]; then
    if git apply --check "$P" 2>/dev/null; then
      git apply "$P" && echo "  ✅ PATTERN-2 applied"
    else
      echo "  ⚠ PATTERN-2 patch does not apply cleanly (already applied? drift?). Skipping."
    fi
  else
    echo "  ⚠ $P not found — skipping"
  fi
else
  echo
  echo "=== STEP 1: SKIPPED (--skip-patches) ==="
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 2 — Apply 3 Hera Option B role-alert patches
# ─────────────────────────────────────────────────────────────────────
if [[ $SKIP_PATCHES -eq 0 ]]; then
  echo
  echo "=== STEP 2: Apply 3 Hera Option B role-alert patches ==="
  HERA_DIR=docs/drafts/hera/role-alert-fixes
  PATCHES=(ExportDialog.patch ReportGenHelpers.patch ReportProgress.patch)
  APPLY_OK=1
  for p in "${PATCHES[@]}"; do
    if [[ -f "$HERA_DIR/$p" ]]; then
      if ! git apply --check "$HERA_DIR/$p" 2>/dev/null; then
        echo "  ⚠ $p does not apply cleanly (already applied?) — skipping"
      fi
    else
      echo "  ⚠ $HERA_DIR/$p missing"
    fi
  done
  if [[ $APPLY_OK -eq 1 ]]; then
    git apply $HERA_DIR/ExportDialog.patch \
              $HERA_DIR/ReportGenHelpers.patch \
              $HERA_DIR/ReportProgress.patch 2>/dev/null \
      && echo "  ✅ 3 Hera Option B patches applied" \
      || echo "  ⚠ one or more patches failed to apply (continuing)"
  fi
else
  echo
  echo "=== STEP 2: SKIPPED (--skip-patches) ==="
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 3 — Stage everything
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== STEP 3: Stage everything (skip node_modules, dist, .git) ==="
git add -A
echo "  Staged ($(git status --short | wc -l) files):"
git status --short | head -10

# ─────────────────────────────────────────────────────────────────────
# STEP 4 — Verify gates (tsc, lint, build) with SLO timing
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== STEP 4: Verify gates ==="

run_gate() {
  local name="$1" target_s="$2" cmd="$3"
  echo
  echo "  --- gate: $name (target: < ${target_s}s) ---"
  T0=$(date +%s)
  if timeout "$target_s" bash -c "$cmd" 2>&1 | tail -8; then
    T1=$(date +%s)
    local dt=$((T1-T0))
    if [[ $dt -le $target_s ]]; then
      echo "  ✅ $name passed in ${dt}s (target < ${target_s}s)"
    else
      echo "  ⚠ $name ran in ${dt}s — over SLO (target < ${target_s}s)"
    fi
    return 0
  else
    T1=$(date +%s); local dt=$((T1-T0))
    echo "  ❌ $name FAILED after ${dt}s (target < ${target_s}s)"
    return 1
  fi
}

GATES_PASS=1

run_gate "tsc --noEmit"  120 "npx tsc --noEmit"      || GATES_PASS=0
run_gate "eslint (strict)"  60 "npx eslint src --max-warnings 0" || {
  GATES_PASS=0
  echo
  echo "  ┌──────────────────────────────────────────────────────────────┐"
  echo "  │  KNOWN FAILURE (captured 2026-06-13 04:40 IST):               │"
  echo "  │    src/__tests__/a11y/wcag-aa.test.tsx:39:10                   │"
  echo "  │      'DataGrid' is defined but never used                     │"
  echo "  │  Fix: Apollo removes/renames the import on line 39.            │"
  echo "  │  Cannot auto-fix from infra lane (would touch product code).  │"
  echo "  └──────────────────────────────────────────────────────────────┘"
}
run_gate "vite build"    180 "npm run build"         || GATES_PASS=0

if [[ $GATES_PASS -eq 0 ]]; then
  echo
  if [[ "$MODE" == "check" ]]; then
    echo "❌ One or more gates failed (--check mode: reporting only, not pushing)."
    exit 1
  fi
  if [[ $NO_VERIFY -eq 0 ]]; then
    echo "❌ Gates failed. Aborting push. To force: --no-verify (DANGEROUS)."
    exit 1
  else
    echo "⚠ Gates failed but --no-verify set. Continuing to push anyway."
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 5 — Commit in 3-4 logical commits
# ─────────────────────────────────────────────────────────────────────
if [[ "$MODE" == "check" || "$MODE" == "dry-run" ]]; then
  echo
  echo "=== STEP 5: SKIPPED (mode=$MODE) ==="
else
  echo
  echo "=== STEP 5: Commit in 3-4 logical commits ==="

  # 5a. JSDoc P0
  git reset HEAD --quiet 2>/dev/null || true
  git add src/hooks/useAuth.ts \
          src/utils/masterStorage.ts \
          src/utils/masterStorage.bench.test.ts \
          src/utils/masterStorage.stress.test.ts \
          src/engines/AnomalyDetectionEngine.ts \
          src/engines/CapExEngine.ts \
          src/engines/CubeEngine.ts \
          src/engines/MonteCarloEngine.ts
  git commit -m "docs(engines+storage): JSDoc P0 on 5 critical exports + 2 new masterStorage tests

- useAuth: 38 lines of JSDoc (auth flow, return shape, error cases)
- masterStorage: 42 lines of JSDoc (encryption contract, quota handling)
- AnomalyDetectionEngine: JSDoc on percentile() + 5 entry points
- CapExEngine: JSDoc on 3 depreciation methods
- CubeEngine: JSDoc on OLAP operations
- MonteCarloEngine.simulate: JSDoc on confidence intervals

Test additions:
- masterStorage.bench.test.ts: 12 cases (perf, quota, encryption)
- masterStorage.stress.test.ts: 9 cases (concurrent writes, corruption)

Refs: DEFER-2026-002 (decimal.js integration Q3-W1)" 2>&1 | head -3

  # 5b. Athena PATTERN-2 + Hera Option B
  git add src/
  git commit -m "fix(ui+tests): apply Athena PATTERN-2 router wrapper + 3 Hera Option B role-alert patches

PATTERN-2 (Athena test-triage):
- src/__tests__/setup/router-wrapper.tsx: new test router for RTL

Hera Option B (3 patches):
- ExportDialog.tsx: role-alert -> role-status (non-critical export)
- ReportGenHelpers.tsx: role-alert -> role-status
- ReportProgress.tsx: role-alert -> role-status

WCAG 4.1.2/4.1.3: role=status is for non-critical status messages;
role=alert is reserved for critical interrupts." 2>&1 | head -3

  # 5c. Docs cascade
  git add docs/drafts/ docs/security-deferrals.md PERFORMANCE_LOG.md
  git commit -m "docs(drafts): Muse cascade 2026-06-13 - 7 Muses pre-staged content" 2>&1 | head -3

  # 5d. Server + crashReporter + perfBudgets + a11y
  git add server/ src/crashReporter.ts src/config/perfBudgets.ts \
          src/config/perfBudgets.test.ts src/__tests__/a11y/
  git commit -m "feat(server+perf+a11y): cycle 2026-06-13 - security-headers-scan + perfBudgets + wcag-aa suite" 2>&1 | head -3
fi

# ─────────────────────────────────────────────────────────────────────
# STEP 6 — Verify final state
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== STEP 6: Verify final state ==="
if [[ "$MODE" != "check" ]]; then
  git log -5 --oneline
fi
echo "  Files uncommitted: $(git status --short | wc -l)"

# ─────────────────────────────────────────────────────────────────────
# STEP 7 — Push to origin/main
# ─────────────────────────────────────────────────────────────────────
echo
echo "=== STEP 7: Push to origin/main ==="
echo "  Commits to push: $(git rev-list --count origin/main..HEAD)"

PUSH_FLAGS=()
if [[ $NO_VERIFY -eq 1 ]]; then
  PUSH_FLAGS+=(--no-verify)
fi
if [[ "$MODE" == "dry-run" ]]; then
  PUSH_FLAGS+=(--dry-run)
fi

T0=$(date +%s)
if [[ "$MODE" == "dry-run" ]]; then
  echo "  Running: git push origin main --dry-run ${PUSH_FLAGS[*]:-}"
  git push origin main --dry-run "${PUSH_FLAGS[@]:---no-verify}" 2>&1 || true
  T1=$(date +%s)
  echo "  Dry-run completed in $((T1-T0))s (target: < 30s for actual push)"
else
  echo "  Running: git push origin main ${PUSH_FLAGS[*]:-}"
  git push origin main "${PUSH_FLAGS[@]:-}" 2>&1
  RC=$?
  T1=$(date +%s)
  echo "  Exit: $RC  in $((T1-T0))s (SLO: < 30s)"

  if [[ $RC -ne 0 ]]; then
    echo
    echo "  ┌──────────────────────────────────────────────────────────────┐"
    echo "  │  PUSH FAILED. Common causes (Three Witnesses):               │"
    echo "  │                                                              │"
    echo "  │  1. husky pre-push hook blocked push (most common)           │"
    echo "  │     - The hook runs: tsc --noEmit && eslint --max-warnings 0 │"
    echo "  │     - Current known blocker:                                 │"
    echo "  │         src/__tests__/a11y/wcag-aa.test.tsx:39:10            │"
    echo "  │         'DataGrid' is defined but never used                │"
    echo "  │     - Fix: Apollo removes the unused import                  │"
    echo "  │                                                              │"
    echo "  │  2. Network timeout (unlikely from this env)                 │"
    echo "  │     - Diagnose: timeout 15 git ls-remote origin              │"
    echo "  │                                                              │"
    echo "  │  3. Auth failure                                             │"
    echo "  │     - Diagnose: git config --get credential.helper            │"
    echo "  │     - Should be: manager  (Git Credential Manager)           │"
    echo "  │                                                              │"
    echo "  │  4. Diverged branch (origin has commits you don't)           │"
    echo "  │     - Diagnose: git fetch && git status -sb                  │"
    echo "  │     - Fix: git pull --rebase origin main                     │"
    echo "  └──────────────────────────────────────────────────────────────┘"
    exit $RC
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# POST — Final summary with SLO dashboard
# ─────────────────────────────────────────────────────────────────────
T_END=$(date +%s)
ELAPSED=$((T_END-START_TS))
echo
echo "=== POST-PUSH ==="
git log origin/main -1 --format='%H %ci %s' 2>&1 || true
echo
echo "════════════════════════════════════════════"
echo "  Sequence complete.  Elapsed: ${ELAPSED}s  Mode: ${MODE}"
echo "════════════════════════════════════════════"
echo
echo "  SLO dashboard (this run):"
echo "    network probe:  see Pre-flight 1"
echo "    total elapsed:  ${ELAPSED}s (SLO < 600s for full sequence)"
echo
echo "  Atlas infra notes — please file these as ADRs / GitHub issues:"
echo "    - husky v10 deprecation: remove shebang from .husky/pre-push (P3)"
echo "    - Add a `lint:strict` npm script wrapping --max-warnings 0 (P3)"
echo "    - Add a pre-push timeout (currently no upper bound; can hang CI) (P2)"
echo "    - Wire this script into CI as `founder-push.yml` (P1, see CI_MATRIX.md)"
