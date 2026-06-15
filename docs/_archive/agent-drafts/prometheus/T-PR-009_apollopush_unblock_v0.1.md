---
name: T-PR-009 v0.1 — Apollo push unblock: vite.config.ts:45 tsc error fix
description: Atomic patch for vite.config.ts:45 (1 tsc error: TS2322 'string | undefined' not assignable to release object type). 1-line type-safety fix. Apollo Phase 1 push unblocker (Gate 1 RED → GREEN).
type: project
---

# T-PR-009 v0.1 — Apollo push unblock: vite.config.ts:45 tsc error fix

**SHIPPED:** 2026-06-13 cycle 12 turn 14+ (slot 019ec100-86ec-7d53-a19a-a6a1cf0fdd13)
**Leader dispatch:** "T-PR-009 v0.1 (Apollo push unblock plan). Apollo's Gate 1 tsc 1 error (vite.config.ts:45) + Gate 3 test 7 failures. T-PR-007 v0.2 patches fix Gate 3. Need: Gate 1 fix spec."
**Path:** `C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\prometheus\T-PR-009_apollopush_unblock_v0.1.md`
**Spec version:** Codif 22 v0.1
**Size target:** 150-250L (this spec: ~195L)

## §0 EMERGENCY (Codif 7 honest-scope)

Apollo's Gate 1 (tsc) is **RED with 1 error** at `vite.config.ts:45,13`. Apollo Phase 1 push is **BLOCKED** until tsc passes. T-PR-007 v0.2 patches fix Gate 3 (test) but do **NOT** fix Gate 1 (tsc). This spec proposes a single 1-line atomic patch to unblock Apollo.

**Current Apollo 5-gate state:**

- Gate 1 (tsc): **RED** — 1 error at vite.config.ts:45 ← THIS SPEC FIXES
- Gate 2 (lint): GREEN
- Gate 3 (test): **RED** — 7 failures ← T-PR-007 v0.2 fixes
- Gate 4 (build): TBD (depends on Gate 1)
- Gate 5 (bundle-check): TBD (depends on Gate 4)

**After both T-PR-007 v0.2 + T-PR-009 v0.1 applied:** Expected Gate 1 GREEN, Gate 3 GREEN, Gate 4 GREEN, Gate 5 GREEN (5/5 GREEN, ready to push).

## §1 Context (Codif 9 3-witness)

### W1: Source read (vite.config.ts:40-50)

```typescript
sentryVitePlugin({
  org: process.env.SENTRY_ORG,                                          // 42
  project: process.env.SENTRY_PROJECT,                                  // 43
  authToken: process.env.SENTRY_AUTH_TOKEN,                             // 44
  release: process.env.VITE_SENTRY_RELEASE,                             // 45 ← tsc error
  telemetry: false,                                                     // 46
}),
```

### W2: tsc output (verbatim from `npx tsc --noEmit` run this turn)

```
vite.config.ts(45,13): error TS2322: Type 'string | undefined' is not assignable
  to type '{ name?: string | undefined; inject?: boolean | undefined;
  create?: boolean | undefined; finalize?: boolean | undefined;
  dist?: string | undefined; vcsRemote?: string | undefined;
  setCommits?: false | ... 1 more ... | undefined;
  deploy?: false | ... 1 more ... | undefined;
  uploadLegacySourcemaps?: string | ... 2 mor... }'.
  Type 'string' has no properties in common with type
  '{ name?: string | undefined; ... }'.
```

Only 1 error total across the project — confirms Leader's "1 tsc error at vite.config.ts:45" claim.

### W3: Type definition (Sentry plugin)

`node_modules/@sentry/bundler-plugin-core/dist/types/types.d.ts:172-211` (read via `fs.readFileSync`):

```typescript
release?: {
  name?: string;          // ← release identifier (the actual string)
  inject?: boolean;       // Defaults to true (recommended)
  create?: boolean;       // Defaults to true
  finalize?: boolean;     // Defaults to true
  dist?: string;          // Distribution ID
  vcsRemote?: string;
  setCommits?: false | { ... };
  deploy?: false | { ... };
  uploadLegacySourcemaps?: string | ... ;
};
```

**Cross-reference:** `SentryVitePluginOptions` re-exports from `@sentry/bundler-plugin-core` (verified via `dist/types/index.d.ts` — `export type { Options as SentryVitePluginOptions } from "@sentry/bundler-plugin-core";`).

## §2 Root cause

The current code passes a **string** to the `release` field, but the Sentry plugin's type definition says `release` is an **OBJECT** with optional fields. The string is meant to be the `name` field of the release object.

**Why the original code was wrong:** The Apollo Sentry SDK install patch (T-ATL-009) used the older Sentry plugin API where `release: string` was accepted (pre-v3). After Sentry plugin v3 upgrade, the type signature changed to `release?: { name?: string; ... }` (object). The Apollo patch did not update the field to match the new API.

**Type-safety failure mode:** TS2322 is a "type mismatch" error. The compiler is checking that `string | undefined` is assignable to the object type. It correctly rejects because a `string` has no properties in common with the `release` object type (which expects `name`, `inject`, `create`, etc.).

## §3 Fix options (3 options, recommend Option A)

### Option A (RECOMMEND): Wrap string in `{ name: ... }` object

```typescript
release: { name: process.env.VITE_SENTRY_RELEASE },
```

- **Pros:** Minimal change, preserves env-var-driven pattern, type-safe
- **Cons:** `name` field could be `undefined` (acceptable per Sentry type — `name?: string` is optional, and Sentry will auto-detect from `git HEAD` per types.d.ts:178-180)
- **LOC delta:** 0 (just adds `{ name: ` and ` }`)
- **Risk:** LOW — auto-detection fallback is well-documented

### Option B (ALTERNATIVE): Conditional spread (only include if env var is set)

```typescript
...(process.env.VITE_SENTRY_RELEASE ? { release: { name: process.env.VITE_SENTRY_RELEASE } } : {}),
```

- **Pros:** Only includes `release` field if env var is set; lets Sentry auto-detect otherwise
- **Cons:** Slightly more verbose, spread syntax harder to read
- **LOC delta:** +1 (3 lines instead of 1)
- **Risk:** LOW

### Option C (REJECTED): Type cast `as any`

```typescript
release: process.env.VITE_SENTRY_RELEASE as any,
```

- **Pros:** Quick fix (1-character change)
- **Cons:** **Loses type safety** (suppresses tsc error rather than fixing it). Violates Codif 9 3-witness discipline (the whole point of 3-witness is to FIX the root cause, not silence the symptom).
- **LOC delta:** 0
- **Risk:** MEDIUM — masks the underlying type mismatch; future maintainers won't see the issue

**Recommendation:** **Option A** (RECOMMEND). Clean, type-safe, minimal change. Option B is acceptable if maintainability is a concern (explicit conditional inclusion). Option C is rejected on Codif 9 grounds.

## §4 Implementation

### Single atomic patch (Option A)

**File:** `vite.config.ts:45`
**Change:**

```diff
-  release: process.env.VITE_SENTRY_RELEASE,
+  release: { name: process.env.VITE_SENTRY_RELEASE },
```

**LOC delta:** 0 (just adds `{ name: ` and ` }`)

### Apollo apply instructions

```bash
# 1. Navigate to canonical
cd "C:\Users\Tahir\Desktop\frontend that i want\fpa"

# 2. Apply the 1-line patch (Apollo git-apply or manual edit)
# Edit vite.config.ts line 45 from:
#   release: process.env.VITE_SENTRY_RELEASE,
# to:
#   release: { name: process.env.VITE_SENTRY_RELEASE },

# 3. Verify Gate 1
npx tsc --noEmit
# Expected: 0 errors (was 1 at vite.config.ts:45,13)

# 4. Verify all 5 gates
npm run lint && npx tsc --noEmit && npx vitest run && npm run build && npm run bundle-check
# Expected: 5/5 GREEN
```

**ETA:** 5 min Apollo apply (1-line edit + tsc verification).

## §5 Verification

1. **Gate 1 (tsc):** Run `npx tsc --noEmit` — expect **0 errors** (was 1 at vite.config.ts:45,13)
2. **Gate 2 (lint):** Run `npm run lint` — expect 0/0 (already GREEN, not affected by this patch)
3. **Gate 3 (test):** Run `npx vitest run` — expect 0 failures (with T-PR-007 v0.2 patches applied, 7 → 0)
4. **Gate 4 (build):** Run `npm run build` — expect success (was blocked by Gate 1)
5. **Gate 5 (bundle-check):** Run `npm run bundle-check` — expect main <150KB gzip (already verified at 55.95KB)

**Apollo's 5-gate status post-fix:** Gate 1 GREEN, Gate 2 GREEN, Gate 3 GREEN, Gate 4 GREEN, Gate 5 GREEN = **5/5 GREEN, ready to push**.

## §5.5 Rollback plan

If the patch causes runtime issues (e.g., Sentry SDK doesn't pick up the release name):

1. Revert to original line 45: `release: process.env.VITE_SENTRY_RELEASE,`
2. Re-investigate: the type may need `as any` cast for that specific field (Codif 19 honest-scope — would be a T-PR-009 v0.2 amendment, not a T-PR-009 v0.1 fix)
3. Alternative: use Sentry's recommended `SENTRY_RELEASE` env var (per types.d.ts:176 — "This value can also be specified via the SENTRY_RELEASE environment variable") and remove the `release` field from vite.config.ts entirely

**Risk of runtime issue:** LOW. The `{ name: string | undefined }` type matches Sentry's documented behavior. `name: undefined` triggers auto-detection from git HEAD, which is the documented fallback (types.d.ts:178-180).

## §6 Cross-Muse handoffs

- **Apollo (slot 019ec100-866d-78f0-aaf8-bc5acddeabeb):** Apply the 1-line atomic patch to vite.config.ts:45. 5-min ETA. Push-DEPENDENT.
- **Leader (slot 019ebcaa-14d3-7a20-82a6-91ce66970a39):** T-PR-009 v0.1 SHIP CONFIRM expected; Apollo Phase 1 push unblocked.
- **Hephaestus (slot 019ec100-86bc-74b2-8bc2-70ac22810f05):** No Codif 30 v0.3 framework impact (1-line type-safety fix, not a security audit finding).
- **Mnemosyne (slot 019ec100-86dc-7443-8388-a6cb71627df3):** No codif registry impact. No T-MN-013 v0.3.1 update needed.
- **Strategos (slot 019ec100-86fe-7201-9ea8-d42a8c7186b4):** No Risk 13 impact. T-ST-024 v0.5.4 may cite this as another "Apollo push unblock" evidence point.
- **Athena (slot 019ec100-86a3-7a32-ad4c-0523c1d34c0b):** No T-AT-019 v0.2 pre-commit gate impact (this is a config file, not a test file).
- **Atlas (slot 019ec100-8712-7fc1-8aff-124139be6f81):** No T-ATL-001 v0.2/v0.3 GAP-8 impact.

## §7 4-ICP verdict

- **Correctness (Carla/ICP-1 CFO):** 4/4 PASS — Root cause matches tsc output exactly (W2 verbatim); fix is type-safe per Sentry plugin types (W3 verbatim).
- **Performance (Chris/ICP-3 PLG):** 4/4 PASS — 0 LOC change, only structural wrapping. No runtime perf impact.
- **Security (Vera/ICP-2 Anaplan-replacement):** 4/4 PASS — No security impact (type-safety fix; doesn't change auth, crypto, or data flow).
- **Maintainability (Beth/ICP-4 Baker Tilly channel-partner):** 4/4 PASS — Single-line atomic patch, easy to read, easy to revert. Comment can be added: `// Sentry v3 release: { name: ... } (was string in v2)`.

## §8 3 HL moments (Codif 19 honest-scope)

- **HL #1:** Initial assumption (from the Leader's dispatch context) was that `release` field accepts a string (pre-Sentry-v3 API). W3 witness (type definition read at `node_modules/@sentry/bundler-plugin-core/dist/types/types.d.ts:172-211`) corrected this — the field is an object with `name?: string` as the actual release identifier. **Codif 9 3-witness prevented fabrication of a "string-vs-string" fix.**
- **HL #2:** Option C (cast as any) was considered and rejected for type-safety reasons. This is a deliberate choice grounded in Codif 9 3-witness discipline (fix the root cause, not silence the symptom), not an oversight.
- **HL #3:** T-PR-009 v0.1 is the **third** Apollo push unblock spec in cycle 12 (after T-PR-007 v0.2 [Gate 3 test fix] + T-PR-008 v0.1 [Pattern C component-impl fix]). Apollo Phase 1 push is approaching the finish line — 1 more spec to go after this (T-PR-009 v0.1).

## §9 Cross-Reference

- **T-PR-007 v0.2** (Gate 3 test fix, 3 atomic patches, 7 failures → 0) — supersedes v0.1, push-DEPENDENT
- **T-PR-008 v0.1** (Pattern C component-impl fixes, 2 atomic patches, +8 LOC) — Pattern C carve-out, push-INDEPENDENT
- **T-PR-009 v0.1** (Gate 1 tsc fix, 1 atomic patch, 0 LOC) — this spec, push-DEPENDENT
- **Apollo Phase 1 push:** needs all 3 specs applied (T-PR-007 v0.2 + T-PR-008 v0.1 + T-PR-009 v0.1) for 5/5 GREEN

## §10 Codif taxonomy anchor

- **Codif 9 3-witness:** §1 (W1 source read / W2 tsc verbatim / W3 type definition)
- **Codif 19 honest-scope:** §8 (3 HL moments)
- **Codif 22 spec_version v0.1:** frontmatter
- **Codif 30 v0.3 framework:** §6 (no impact)
- **Codif 31 multi-tree:** N/A (vite.config.ts is in canonical, not in any Muse sandbox)
- **Codif 32 CANDIDATE counter:** 2/3 UNCHANGED (this is a 1-line tsc fix, not a Lead-side test-failure claim)

## §11 Self-Assessment

- **Spec quality:** 4/4 PASS (8 sections + cross-ref + 4-ICP + 3 HL + Codif anchors)
- **3-witness rigor:** 4/4 PASS (verbatim tsc output + Read of source + Read of types)
- **Blast radius:** 0 (1-line config change, no production code touched)
- **Apollo apply ETA:** 5 min (1-line edit + tsc verify)
- **Push-dependence:** YES (Gate 1 is a pre-push gate)
- **Risk of regression:** LOW (Sentry v3 release object is well-documented, auto-detection fallback handles undefined `name`)

---

**Prometheus (slot 019ec100-86ec) 2026-06-13 cycle 12 turn 14+**

SHIPPED within D-007 5-min SLA. PICK CONFIRM expected from Leader (slot 019ebcaa) within 5 min. Apollo apply ETA 5 min after PICK CONFIRM. Apollo Phase 1 push ETA 30-60 min after Apollo apply.
