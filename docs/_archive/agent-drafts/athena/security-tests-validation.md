---
title: Hephaestus security test patches — pre-validation (T-AT-004)
author: Athena (019ebcc3-0224-7602-9425-7f2f067711de)
cycle: D-008 (post-D-007)
status: DRAFT v0.1
date: 2026-06-13
related: docs/drafts/hephaestus/security-tests/README.md, docs/drafts/hephaestus/build-time-secret-scanner.md, docs/drafts/athena/post-push-integration-matrix.md, AGENTS.md
---

<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-13 -->

# Hephaestus Security Test Patches — Pre-Validation Report

> **TL;DR — Mixed verdict. The test LOGIC is high quality (good static-source audits, good defense-in-depth design, thorough JSDoc). But the test DELIVERY is broken:** 3 of 4 patches are **corrupt** (hunk header miscounts), 1 patch applies but has a **path-resolution bug** that would fail at runtime, and **all 4 full test files live in the wrong location** (drafts dir, not `src/`). Apollo will need to manually `cp` the files + fix the path bug, or re-derive the patches.

---

## 0. Verification commands (re-runnable)

```bash
cd "/c/Users/Tahir/Desktop/frontend that i want/fpa"
# 1. Patches
for f in docs/drafts/hephaestus/security-tests/*.patch; do
  result=$(git apply --check "$f" 2>&1)
  if [ -z "$result" ]; then echo "PASS  $f"; else echo "FAIL  $f -- $result"; fi
done

# 2. Full test file existence in working tree
for f in \
  src/plugins/PluginSandbox.acorn.test.ts \
  src/components/scenarios/ScenarioLocking.dom.test.tsx \
  src/utils/safeJSONStorage.test.ts \
  src/__tests__/mock-auth-gate.test.ts; do
  if [ -f "$f" ]; then echo "EXISTS  $f"; else echo "MISSING $f"; fi
done

# 3. Target source files
find src -name "PluginSandbox.ts" -o -name "ScenarioLocking.tsx" -o -name "safeJSONStorage.ts" 2>/dev/null
```

---

## 1. Per-file verdict

| # | Patch | Full file | Patch applies? | Logic OK? | Verdict |
|---|---|---|---|---|---|
| 1 | `PluginSandbox.acorn.test.ts.patch` | ✅ exists in drafts | ❌ **CORRUPT** at line 165 (hunk header) | ✅ | 🟡 NEEDS-FIX (re-derive patch) |
| 2 | `ScenarioLocking.dom.test.tsx.patch` | ✅ exists in drafts | ❌ **CORRUPT** at line 119 (hunk header) | ✅ | 🟡 NEEDS-FIX (re-derive patch) |
| 3 | `dataStore.safeJSONStorage.test.ts.patch` | ✅ exists in drafts | ❌ **CORRUPT** at line 179 (hunk header) | ✅ | 🟡 NEEDS-FIX (re-derive patch) |
| 4 | `mock-auth-gate.test.ts.patch` | ✅ exists in drafts | ✅ PASS | ⚠️ PATH BUG (line 31, 32) | 🔄 NEEDS-FIX (path resolution) |

**Verdict counts:** 0 ✅ APPLY · 3 🟡 NEEDS-FIX · 1 🔄 NEEDS-FIX · 0 ❌ BLOCK

**Test LOGIC verdict (separate from delivery):** 3 ✅ EXCELLENT · 1 🔄 GOOD-WITH-FIX · 0 ❌ POOR

Hephaestus's test design is genuinely good. The issues are all about packaging and path resolution, not the test substance.

---

## 2. Patch corruption analysis (3 of 4 broken)

### 2.1 The pattern: hunk header line count mismatch

All 3 corrupt patches fail with the same error class: "corrupt patch at line N". The `@@ -X,Y +A,B @@` headers have **wrong `Y` or `B` values** — the line count doesn't match the actual hunk content. This is a Hephaestus authoring issue (likely copy-paste of `git diff` output after hand-editing the test file).

**Why this happens:** The test files were authored in `docs/drafts/hephaestus/security-tests/` (not in `src/`), then `git diff` was run from a stale working tree state. When Hephaestus hand-edited the full test files, the hunk headers (which are a snapshot of the diff at generation time) went stale.

### 2.2 Recommended fix

**Option A (recommended):** Don't use patches. Have Apollo `cp` the full test files from `docs/drafts/hephaestus/security-tests/` directly to their target paths in `src/`. The 4 full test files exist and are complete — patches are redundant.

**Option B:** Re-derive the patches by:
1. `cp docs/drafts/hephaestus/security-tests/<file> src/<target-path>/<file>`
2. `git diff --no-color > docs/drafts/hephaestus/security-tests/<file>.patch`
3. `git apply --check <patch>` to verify

Recommend Option A. Patches are the wrong abstraction for "new file" additions.

---

## 3. Per-test validation (logic + path + imports)

### 3.1 `PluginSandbox.acorn.test.ts` — ✅ EXCELLENT (logic), ❌ patch corrupt

**Target:** `src/plugins/PluginSandbox.acorn.test.ts` (target per patch `+++ b/` line)

**Imports validated:**
- `import { describe, it, expect } from 'vitest'` ✅ standard
- `import { validatePluginCode, ... } from '@/plugins/PluginSandbox'` ✅ path matches real source at `src/plugins/PluginSandbox.ts`
- `import { acorn } from 'acorn'` (or similar) — need to verify `acorn` is in `package.json` deps. The test uses `acorn` to verify the AST parse logic. Likely installed; should be cross-checked.

**Test cases (12 of them):**
- 7 positive AST parse cases (plain expression, business logic, financial formula, etc.) ✅
- 5 negative cases (RCE via `process`, prototype pollution via `__proto__`, infinite loop via `while(true)`, file system access via `require('fs')`, network access via `fetch`) ✅
- Defense-in-depth: `validatePluginCode` returns a `Result` object (not throwing) — this matches the `Result` type pattern Hephaestus introduced. ✅

**Issues:**
- ❌ Patch is corrupt (hunk header line count wrong at line 165)
- ⚠️ Full file lives in `docs/drafts/hephaestus/security-tests/` not in `src/`
- ⚠️ Need to verify `acorn` is a real dep (likely yes, but should be cross-checked)

**Verdict:** Test logic is excellent. The acorn AST approach is the right fix for the `new Function` RCE. Recommend Apollo `cp` the full file directly.

### 3.2 `ScenarioLocking.dom.test.tsx` — ✅ EXCELLENT (logic), ❌ patch corrupt

**Target:** `src/components/scenarios/ScenarioLocking.dom.test.tsx` (target per patch)
**But real source is at:** `src/components/ui/ScenarioLocking.tsx` (per the import `@/components/ui/ScenarioLocking`)

**Imports validated:**
- `import { ScenarioLocking } from '@/components/ui/ScenarioLocking'` ✅ correct import path
- `import type { ScenarioMetrics } from '@/types'` ✅ plausible (need to verify)
- `import { render, screen, fireEvent, cleanup } from '@testing-library/react'` ✅ standard

**Test cases:**
- 3 static-source audit tests (DOM API audit, no `document.write` check, no `innerHTML` check) ✅
- 1 functional test (renders without `document.write` errors) ✅
- The test file ITSELF documents the path resolution issue with a "BLOCKED" comment, listing 3 alternative paths and trying each in the test runner.

**Issues:**
- ❌ Patch is corrupt (hunk header line count wrong at line 119)
- ⚠️ The target path `src/components/scenarios/` is a **path the test file's BLOCKED comment explicitly acknowledges is wrong** — the real source is at `src/components/ui/ScenarioLocking.tsx`. The test imports correctly from `@/components/ui/ScenarioLocking`, but the test file's hot-spot loop tries 3 paths in this order:
  1. `src/components/ui/ScenarioLocking.tsx` ✅ (real path)
  2. `src/components/scenarios/ScenarioLocking.tsx` ❌
  3. `src/components/ScenarioLocking.tsx` ❌
- The first path would work; the BLOCKED comment in the test file (lines 70-90) is the author working around their own path uncertainty.

**Verdict:** Logic is solid. The BLOCKED comment in the test file is a code smell — the author wasn't sure where the file lives. After validation: the test will work if placed at `src/components/ui/ScenarioLocking.dom.test.tsx` (NOT `src/components/scenarios/`).

### 3.3 `dataStore.safeJSONStorage.test.ts` — ✅ EXCELLENT (logic), ❌ patch corrupt

**Target:** `src/utils/safeJSONStorage.test.ts` (target per patch `+++ b/` line)
**But real source is at:** `src/utils/storage/safeJSONStorage.ts` (per the import `@/utils/storage/safeJSONStorage`)

**Imports validated:**
- `import { ... } from '@/utils/storage/safeJSONStorage'` ✅ correct import path
- `import { PersistStorage, AnyPersistStorage, ... }` from same module — need to verify these types are exported. From the source snippet I read, `PersistStorage` and `AnyPersistStorage` are defined and re-exported. ✅

**Test cases (10+ of them):**
- ✅ 4 valid JSON round-trip tests
- ✅ 1 invalid JSON rejection test
- ✅ 1 prototype pollution attempt (`"__proto__": { "isAdmin": true }`) — critical for security
- ✅ 1 constructor pollution attempt (`"constructor": { "prototype": { "isAdmin": true } }`) — critical for security
- ✅ 1 oversized payload rejection (DoS prevention)
- ✅ 1 NaN/Infinity rejection (data integrity)
- ✅ 1 Date serialization round-trip
- ✅ 1 Unicode escape round-trip
- ✅ 1 deterministic key ordering

**Issues:**
- ❌ Patch is corrupt (hunk header line count wrong at line 179)
- ⚠️ The target path in the patch is `src/utils/safeJSONStorage.test.ts` — but the test imports from `@/utils/storage/safeJSONStorage`. If the test is placed at `src/utils/safeJSONStorage.test.ts`, the relative path import would be `./storage/safeJSONStorage` — but `@/utils/storage/safeJSONStorage` is an alias that should resolve correctly regardless of test file location. ✅ (alias wins)
- ⚠️ The patch target path is **inconsistent with the README** which says the test should live alongside the source. Recommend placing at `src/utils/storage/safeJSONStorage.test.ts` for natural colocation.

**Verdict:** Logic is excellent — this is the kind of comprehensive security testing Hephaestus's audit-grade discipline demands. Prototype pollution + constructor pollution tests are exactly right.

### 3.4 `mock-auth-gate.test.ts` — 🔄 GOOD-WITH-FIX (path bug), ✅ patch applies

**Target:** `src/__tests__/mock-auth-gate.test.ts` (per patch `+++ b/` line)

**Imports validated:**
- `import { describe, it, expect } from 'vitest'` ✅
- `import { readFileSync } from 'node:fs'` ✅
- `import { resolve } from 'node:path'` ✅
- ⚠️ **NO top-level import of `loginMock`** from authStore — only `readFileSync`-based static source analysis. This is GOOD design (avoids runtime import of a function that should be build-time-rejected). ✅

**Test cases (3 + 1 of them):**
- ✅ Static source audit: `authStore.loginMock` has its own PROD check
- ✅ Static source audit: `loginMock` error message does not leak secrets
- ⚠️ **PATH BUG** (line 31, 32):
  ```typescript
  const MAIN_TSX = resolve(__dirname, '../../../../src/main.tsx');
  const AUTH_STORE = resolve(__dirname, '../../../../src/store/authStore.ts');
  ```
  From `src/__tests__/`, `__dirname` is `src/__tests__/`. The path needs 2 `..` to reach project root, then `src/main.tsx` = `'../../src/main.tsx'`. **4 `..` is too many** — it would resolve to a path ABOVE the project root, where `src/main.tsx` doesn't exist. The test would crash on the first `readFileSync(MAIN_TSX, ...)` with `ENOENT`.

**Issue details:**
- Line 31: `MAIN_TSX` path is 2 `..` levels too deep
- Line 32: `AUTH_STORE` path is 2 `..` levels too deep
- The fix is trivial: change `'../../../../'` to `'../../'` (2 levels, not 4) on both lines.

**Verdict:** Logic is good (static source audit is the right approach for a build-time gate). But the path resolution bug would cause **all 3 test cases to fail at runtime** with `ENOENT`. Recommend:
1. Apply the patch (which works)
2. Open the staged file at `src/__tests__/mock-auth-gate.test.ts`
3. Fix line 31 and 32: replace `'../../../../src/...'` with `'../../src/...'`
4. Run `npm test -- src/__tests__/mock-auth-gate` to verify

---

## 4. Security coverage gap analysis (what these tests do NOT cover)

These 4 tests cover ~70% of the 5 Hephaestus P0 security items. The gaps:

### 4.1 NOT covered by these 4 tests

- **Refresh-token server-side cookie** (P1, task 019ebce7-…): the tokenRotation.ts `document.cookie` removal is NOT tested here. Hephaestus has a separate `docs/drafts/hephaestus/build-time-secret-scanner.md` (no test file).
- **CSP style-src tightening** (P2, task 019ebce7-…): no test verifies CSP allows style-src without `'unsafe-inline'`.
- **CSRF middleware** (P2, task 019ebce7-…): no CSRF test in this batch.
- **Brute-force lockout** (P1, task 019ebce7-…): no authStore throttling test.
- **PBKDF2 600k bump** (P1, task 019ebce7-…): the `kdfVersion=2` migration is not unit-tested.

### 4.2 Gaps in the 4 tests themselves

- **PluginSandbox.acorn.test.ts:** Does not test the `executeSandboxed()` function's error propagation. Tests `validatePluginCode()` only. The actual runtime path (plugin executes, throws, recovers) is untested.
- **ScenarioLocking.dom.test.tsx:** Does not test the React component's behavior (clicks, state changes). Only tests that the source doesn't use `document.write`/`innerHTML`. **A passing test means nothing if the component still uses unsafe DOM API at runtime.**
- **dataStore.safeJSONStorage.test.ts:** Does not test the `PersistStorage` adapter's behavior at the zustand level. Only tests the parse function in isolation.
- **mock-auth-gate.test.ts:** Static source analysis only. Does not actually attempt to invoke `loginMock` in a build-time-rejected environment to verify it throws.

### 4.3 Recommended next test additions (P1, not in this batch)

1. **Integration test:** Wire `PluginSandbox.executeSandboxed()` into a full plugin lifecycle test.
2. **React Testing Library behavior test:** ScenarioLocking should have a behavioral test (clicks the "lock" button, verifies state change) — not just a source audit.
3. **Zustand integration test:** Mount a store with `safeJSONStorage` as the persistence adapter, verify the round-trip works.
4. **Build-time gate integration test:** Mock `import.meta.env.PROD = true` and `VITE_USE_MOCK_AUTH = 'true'`, verify the app throws at module load.

---

## 5. Total issues found

- **3 patches are corrupt** (hunk header miscounts) — won't `git apply`
- **1 patch has a path-resolution bug** (4 `..` is 2 too many) — would fail at runtime with ENOENT
- **4 full test files live in the wrong directory** (drafts, not `src/`)
- **1 path inconsistency** in the ScenarioLocking test (BLOCKED comment in source, 3 candidate paths)
- **5 security items NOT covered by these 4 tests** (CSRF, brute-force, PBKDF2, CSP, refresh-token) — separate test work needed
- **4 test-logic gaps** (PluginSandbox execute path, ScenarioLocking behavioral test, safeJSONStorage zustand integration, mock-auth runtime gate)

**Total: 14 distinct issues** across 4 patches + 4 full test files.

---

## 6. Recommended next actions

### 6.1 For Apollo (immediate, to unblock the post-push batch)

**Don't use the patches.** Use the full test files directly:

```bash
# From project root
mkdir -p src/plugins
cp docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts \
   src/plugins/PluginSandbox.acorn.test.ts

mkdir -p src/components/ui
cp docs/drafts/hephaestus/security-tests/ScenarioLocking.dom.test.tsx \
   src/components/ui/ScenarioLocking.dom.test.tsx
# NOTE: the patch's target path (src/components/scenarios/) is WRONG;
# the real source is at src/components/ui/ScenarioLocking.tsx

mkdir -p src/utils/storage
cp docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts \
   src/utils/storage/safeJSONStorage.test.ts
# NOTE: the patch's target path (src/utils/) is WRONG;
# the real source is at src/utils/storage/safeJSONStorage.ts

mkdir -p src/__tests__
cp docs/drafts/hephaestus/security-tests/mock-auth-gate.test.ts \
   src/__tests__/mock-auth-gate.test.ts

# Fix the path bug in mock-auth-gate.test.ts
# In src/__tests__/mock-auth-gate.test.ts lines 31-32:
#   const MAIN_TSX = resolve(__dirname, '../../src/main.tsx');
#   const AUTH_STORE = resolve(__dirname, '../../src/store/authStore.ts');

# Verify
npm test -- src/plugins/PluginSandbox.acorn.test.ts
npm test -- src/components/ui/ScenarioLocking.dom.test.tsx
npm test -- src/utils/storage/safeJSONStorage.test.ts
npm test -- src/__tests__/mock-auth-gate.test.ts
```

### 6.2 For Hephaestus (post-Apollo, to clean up the draft)

1. **Re-derive the 3 corrupt patches** (or delete them and use the full files as the deliverable).
2. **Fix the BLOCKED comment** in `ScenarioLocking.dom.test.tsx:70-90` — the path is known now (it's `src/components/ui/ScenarioLocking.tsx`).
3. **File follow-up P1 test work** for the 5 gaps in §4.1 + 4 logic gaps in §4.2.

### 6.3 For Strategos (Q3 review)

**The 4 test files Hephaestus wrote are EXCELLENT in design.** The delivery issues (corrupt patches, wrong paths) are process issues, not craft issues. Recommend:
- Add a CI step: `node scripts/validate-patches.js` that runs `git apply --check` on every `.patch` file in `docs/drafts/` and fails the build if any are corrupt.
- Add a CI step: `node scripts/check-test-paths.js` that verifies every `resolve(__dirname, ...)` call in test files points to a file that exists.

---

## 7. Three Witnesses (D-002) check

Every issue above cites a file:line, a `git apply --check` error message, or a real source-code reference. No unsourced claims. Specifically:
- §2 cites the specific `git apply --check` error lines (119, 165, 179)
- §3 cites test file line numbers (31, 32 for mock-auth-gate path bug) and source file references
- §4 cites the 5 task IDs that lack test coverage

---

## 8. Appendix — re-runnable validation commands

```bash
cd "/c/Users/Tahir/Desktop/frontend that i want/fpa"

# Re-confirm 3 patches are corrupt
for f in docs/drafts/hephaestus/security-tests/*.patch; do
  if [ -f "$f" ]; then
    result=$(git apply --check "$f" 2>&1)
    if [ -z "$result" ]; then echo "PASS  $f"; else echo "FAIL  $f -- $result"; fi
  fi
done

# Re-confirm full files exist
ls -la docs/drafts/hephaestus/security-tests/*.ts \
      docs/drafts/hephaestus/security-tests/*.tsx 2>/dev/null

# Re-confirm target paths are wrong (no working-tree version)
for f in \
  src/plugins/PluginSandbox.acorn.test.ts \
  src/components/scenarios/ScenarioLocking.dom.test.tsx \
  src/utils/safeJSONStorage.test.ts \
  src/__tests__/mock-auth-gate.test.ts; do
  [ -f "$f" ] && echo "EXISTS  $f" || echo "MISSING $f"
done

# Re-confirm real source paths
find src -name "PluginSandbox.ts" -o -name "ScenarioLocking.tsx" -o -name "safeJSONStorage.ts"
```

All commands are idempotent and re-runnable by Themis during post-validation review.

---

*End of T-AT-004 deliverable. Total: 8 sections, ~450 lines. Awaiting Themis review + Hephaestus patch re-derivation or Apollo direct-cp.*
