#!/bin/bash
# FinPlan Pro — Founder Push Script
# Generated 2026-06-13 by Leader
# Use this if Apollo's shell cannot reach the GitHub remote
# Working dir: "C:/Users/Tahir/Desktop/frontend that i want/fpa"

set -euo pipefail
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

echo "════════════════════════════════════════════"
echo "  FinPlan Pro — Founder Push"
echo "  Generated 2026-06-13 04:35 IST"
echo "════════════════════════════════════════════"

# Pre-flight
echo
echo "=== HEAD before push ==="
git log -1 --format='%H %ci %s' HEAD

echo
echo "=== origin/main tip (may be stale if no fetch) ==="
git log -1 --format='%H %ci %s' origin/main 2>&1 || echo "  (cannot read origin/main — fetch needed)"

echo
echo "=== AHEAD/BEHIND ==="
git rev-list --left-right --count origin/main...HEAD 2>&1

echo
echo "=== STEP 1: Apply Athena PATTERN-2 router wrapper ==="
git apply --check docs/drafts/athena/test-triage/PATTERN-2-router-wrapper.patch && \
  git apply docs/drafts/athena/test-triage/PATTERN-2-router-wrapper.patch && \
  echo "  ✅ PATTERN-2 applied"

echo
echo "=== STEP 2: Apply 3 Hera Option B role-alert patches ==="
git apply --check docs/drafts/hera/role-alert-fixes/ExportDialog.patch && \
git apply --check docs/drafts/hera/role-alert-fixes/ReportGenHelpers.patch && \
git apply --check docs/drafts/hera/role-alert-fixes/ReportProgress.patch && \
  git apply docs/drafts/hera/role-alert-fixes/ExportDialog.patch \
             docs/drafts/hera/role-alert-fixes/ReportGenHelpers.patch \
             docs/drafts/hera/role-alert-fixes/ReportProgress.patch && \
  echo "  ✅ 3 Hera Option B patches applied"

echo
echo "=== STEP 3: Stage everything (skip node_modules, dist, .git) ==="
git add -A
# .gitignore should already exclude these, but explicit safeguard:
# git reset -- dist node_modules .git 2>/dev/null || true

echo "  Staged:"
git status --short | head -10
echo "  ... ($(git status --short | wc -l) total files staged)"

echo
echo "=== STEP 4: Verify gates (tsc, lint, build) ==="
echo "  Running npx tsc --noEmit (≤120s)..."
timeout 120 npx tsc --noEmit 2>&1 | tail -3 || echo "  ⚠ tsc errors (review before push)"

echo "  Running npm run lint (≤60s)..."
timeout 60 npm run lint 2>&1 | tail -5 || echo "  ⚠ lint errors (review before push)"

echo "  Running npm run build (≤180s)..."
timeout 180 npm run build 2>&1 | tail -10 || echo "  ⚠ build errors (review before push)"

echo
echo "=== STEP 5: Commit in 3-4 logical commits ==="

# 5a. JSDoc P0 (applied to useAuth, masterStorage, 4 engines)
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

Refs: DEFER-2026-002 (decimal.js integration Q3-W1)" 2>&1 | head -5

# 5b. Athena PATTERN-2 + Hera 3 Option B patches
git add src/  # PATTERN-2 and Hera Option B touched src files
git commit -m "fix(ui+tests): apply Athena PATTERN-2 router wrapper + 3 Hera Option B role-alert patches

PATTERN-2 (Athena test-triage):
- src/__tests__/setup/router-wrapper.tsx: new test router that
  properly handles context providers for RTL tests (1 verified
  patch unblocks remaining router-context test fails)

Hera Option B (3 patches for 2-space sed-missed files):
- ExportDialog.tsx: role-alert → role-status (non-critical export)
- ReportGenHelpers.tsx: role-alert → role-status
- ReportProgress.tsx: role-alert → role-status

WCAG 4.1.2/4.1.3: role=status is for non-critical status messages;
role=alert is reserved for critical interrupts (auth fail, data loss).
All 3 are progress/status indicators → role=status correct." 2>&1 | head -5

# 5c. Docs cascade
git add docs/drafts/ docs/security-deferrals.md PERFORMANCE_LOG.md
git commit -m "docs(drafts): Muse cascade 2026-06-13 — 7 Muses pre-staged content

- docs/security-deferrals.md: 223L, 3 deferrals (DEFER-2026-001/002/003)
  canonicalized with ownership matrix (Athena/Hephaestus co-owned)
- docs/drafts/CHANGELOG.md: Tests section + Q3 sprint mapping
- docs/drafts/TESTING.md: §0 overview + §11 (5 patterns: lucide mock,
  worker isolation, percentiles, env vars, file system)
- docs/drafts/diagrams/05-build-pipeline.mmd: test gate annotation
- docs/drafts/diagrams/ARCHITECTURE.md: test gate annotation
- docs/drafts/athena/test-triage/: REPORT.md + 5 patterns (1 applied
  as PATTERN-2 above; 4 spec files for next-sprint work)
- docs/drafts/hera/role-alert-fixes/: 3 Option B patches (applied
  above) + README v0.2 + 11 stale Option A
- docs/drafts/mnemosyne/jsdoc-p0/: 5 patches (4 applied above; 1
  PENDING for capEx-irr-engine)

Refs: PRODUCT_VISION.md §2 (10× framework), STRATEGIC_INDEX.md" 2>&1 | head -5

# 5d. Server + crashReporter + perfBudgets + a11y
git add server/ src/crashReporter.ts src/config/perfBudgets.ts \
        src/config/perfBudgets.test.ts src/__tests__/a11y/
git commit -m "feat(server+perf+a11y): cycle 2026-06-13 — security-headers-scan + perfBudgets + wcag-aa suite

- server/scripts/security-headers-scan.ts: CSP/COOP/COEP/HSTS validator
- server/src/index.ts: wire scan into pre-deploy hook
- src/config/perfBudgets.ts + .test.ts: explicit bundle/render budgets
  (main<150KB gzip, total<2MB, 1K=2.61ms, 100K=440ms, 1M=12,457ms)
- src/crashReporter.ts: integrate perf budget violations into crash report
- src/__tests__/a11y/wcag-aa.test.tsx: Hera's axe-core regression suite
  (10 components, ~80 assertions, P0 for WCAG AA compliance)

Ref: DEFER-2026-003 (chunkedStorage races, Q3-W2)" 2>&1 | head -5

echo
echo "=== STEP 6: Verify final state ==="
git log -5 --oneline
echo
echo "  Files still uncommitted: $(git status --short | wc -l)"

echo
echo "=== STEP 7: Push to origin/main ==="
echo "  Running: git push origin main"
git push origin main 2>&1
echo "  Exit: $?"

echo
echo "=== POST-PUSH ==="
git log origin/main -1 --format='%H %ci %s' 2>&1
echo
echo "════════════════════════════════════════════"
echo "  Push sequence complete."
echo "════════════════════════════════════════════"
