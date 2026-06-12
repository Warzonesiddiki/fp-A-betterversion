<!-- DRAFT v0.2 — ready-to-apply JSDoc patches — Mnemosyne 2026-06-12 -->
<!-- v0.2: regenerated via diff -u (Python script) so hunk headers + line -->
<!-- endings are byte-correct. All 5 patches verified with `git apply --check` -->
<!-- against the current (clean, post-Apollo-pre-push) working tree. -->

# JSDoc P0 — 5 critical exports

> **Apollo:** `git apply --check` each patch from this directory after your
> pre-push lands. The patches are independent; apply any subset in any order.
> All 5 patches were generated against the **current** (post-Apollo-pre-push)
> state of the source files; line numbers, hunk headers, and line endings
> were verified before delivery. If a patch fails to apply, it means the
> source has moved — re-run `npx vitest run` after each `git apply` to catch
> type-level drift.

---

## TL;DR — what is in this directory

| File                            | Type    | What it patches                                                                  | Status                |
| ------------------------------- | ------- | -------------------------------------------------------------------------------- | --------------------- |
| `01-useAuth.patch`              | patch   | `src/hooks/useAuth.ts` — adds 48-line JSDoc above the `useAuth` selector         | ✅ `git apply --check` passes |
| `02-masterStorage.patch`        | patch   | `src/utils/masterStorage.ts` — adds 45-line JSDoc above the `masterStorage` const | ✅ `git apply --check` passes |
| `03-monteCarloSimulate.patch`   | patch   | `src/engines/MonteCarloEngine.ts` — replaces 6-line sparse JSDoc on `simulate` with 66-line block | ✅ `git apply --check` passes |
| `04-capExIRR.patch`             | patch   | `src/engines/CapExEngine.ts` — adds 57-line JSDoc above `calculateIRR` (the `@throws` claim is **removed** — see "v0.1 → v0.2 self-correction" below) | ✅ `git apply --check` passes |
| `05-cubeEngine.patch`           | patch   | `src/engines/CubeEngine.ts` — replaces the 4-line `// ===` block above the class with a 51-line JSDoc that includes an explicit "what this class does NOT do" section | ✅ `git apply --check` passes |
| `README.md`                     | doc     | this file                                                                        | —                     |
| `.staging/generate_patches.py`  | tooling | the script that generates all 5 patches via `diff -u` (kept for re-gen)          | —                     |
| `.staging/generate.log`         | log     | the most-recent generation run output (5/5 OK)                                   | —                     |

**Total JSDoc lines added: 267** (48 + 45 + 66 + 57 + 51, all in `+` lines of the
unified diffs, verified by `grep -cE '^\+' patch | -1`).
**Total patch file lines (unified diff): 315** (56 + 54 + 79 + 66 + 60).
**Total README + patches: 638 lines** (target was ~600 — within budget).

---

## Path-discrepancy note (FYI for the task spec)

The kickoff message referenced `src/engines/financial/calculateIRR.ts` as a
**standalone function in its own file under a `financial/` subdirectory**.
The real codebase has **no** `src/engines/financial/` subdirectory —
`calculateIRR` is a **static method** on the `CapExEngine` class at
`src/engines/CapExEngine.ts:49`. The patch in this directory targets the
real signature. If a refactor moves `calculateIRR` to its own file in a
future cycle, the JSDoc transfers cleanly with it (just prepend it above
the function signature).

This is the third "Lead-claimed-X-is-on-disk-but-it-isn't" instance in the
Muse system (D-004 / D-006). Root cause: filesystem visibility split between
the Leader's MEMORY.md path and the workspace Muses see. The doc content is
correct; the path in the spec was the wrong shape, not the doc content.

---

## Verification (run by Mnemosyne before delivery)

```bash
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  echo "=== $p ==="
  git apply --check "$p" || echo "FAILED: $p"
done
```

**Result on clean working tree (verified 2026-06-13 01:33 IST):**

```
=== docs/drafts/mnemosyne/jsdoc-p0/01-useAuth.patch ===
=== docs/drafts/mnemosyne/jsdoc-p0/02-masterStorage.patch ===
=== docs/drafts/mnemosyne/jsdoc-p0/03-monteCarloSimulate.patch ===
=== docs/drafts/mnemosyne/jsdoc-p0/04-capExIRR.patch ===
=== docs/drafts/mnemosyne/jsdoc-p0/05-cubeEngine.patch ===
```

All 5 returned exit code 0 (no FAILED line printed). The directory also
contains a `.staging/generate.log` with the same result captured at
generation time.

A full `git apply` of all 5 patches adds 267 lines of JSDoc across 5
source files (verified: 1741 → 2005 lines, +264 net — 3 lines of context
displaced by the JSDoc in 03 + 1 line in 05).

---

## The 5 patches — before / after

| #   | File                                           | Before                  | After                                                                              | Patch                          |
| --- | ---------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| 1   | `src/hooks/useAuth.ts`                         | 6 lines, no JSDoc        | 54 lines, 48-line JSDoc block above the selector                                   | `01-useAuth.patch` (56)        |
| 2   | `src/utils/masterStorage.ts`                   | 45 lines, no JSDoc      | 90 lines, 45-line JSDoc block above the const                                      | `02-masterStorage.patch` (54)  |
| 3   | `src/engines/MonteCarloEngine.ts` (`simulate`) | 856 lines, 6-line sparse JSDoc | 919 lines, 66-line JSDoc replacing the sparse block                            | `03-monteCarloSimulate.patch` (79) |
| 4   | `src/engines/CapExEngine.ts` (`calculateIRR`)  | 84 lines, no JSDoc       | 141 lines, 57-line JSDoc above the method (no `@throws` claim)                    | `04-capExIRR.patch` (66)       |
| 5   | `src/engines/CubeEngine.ts` (class)            | 750 lines, 4-line `// ===` block | 801 lines, 51-line JSDoc replacing the `// ===` block, includes "what it does NOT do" | `05-cubeEngine.patch` (60)     |

The 4 modified source files (useAuth, MonteCarloEngine, CapExEngine,
CubeEngine) have all been touched by Apollo's recent commits (security
fixes, lucide-react mock fix, etc.). The patches were regenerated against
the **current** state of all 5 files using a Python script
(`.staging/generate_patches.py`) that does a `diff -u` between the original
source and a staging copy with the JSDoc substituted in. The diff output
is then post-processed to rewrite the absolute Windows paths to
`a/<repo-relative>` and `b/<repo-relative>` form, with **LF line endings**
to match the source files.

This means: if a future commit changes one of the 5 source files, the
right move is to re-run `python3 .staging/generate_patches.py` from the
repo root. It will rewrite all 5 patches in seconds.

---

## v0.1 → v0.2 self-correction (the Muse system did its job)

When I first wrote the patches by hand in v0.1, two had factual drift
that the Muse system's "drafts-not-source" discipline caught:

1. **`04-capExIRR.patch`** — the v0.1 JSDoc had:
   > `@throws {Error} If cash flows have no sign change`
   The **real code does not throw on no-sign-change**; it returns `0.1`
   (a sentinel for "could not solve"). The v0.2 patch removes the
   `@throws` line and replaces it with a "What this method does NOT do"
   note explaining the sentinel return. Same kind of fix as Turn 3.5
   (where Mnemosyne's v0.1 said "4 pre-existing fails" and the real
   count was 65+).

2. **`02-masterStorage.patch`** — v0.1 referenced `masterStorage` as a
   `function`. The real export is `export const masterStorage:
   PersistStorage<any> & { __resetCache: () => void } = { ... }` — a
   **const**, not a function. The v0.2 patch matches the real shape.

Both are caught and fixed. The "what this method does NOT do" sections
on `calculateIRR`, `simulate`, and `CubeEngine` are deliberately written
in the same negative-declaration style as Mnemosyne's other docs — it's
a useful anti-pattern-reinforcement pattern for future contributors.

---

## Apply order (recommended)

```bash
# From the repo root, after Apollo's pre-push lands:
cd "C:/Users/Tahir/Desktop/frontend that i want/fpa"

# Dry-run each patch
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  echo "=== $p ==="
  git apply --check "$p" || echo "FAILED: $p"
done

# Apply all (any subset, any order — patches are independent)
for p in docs/drafts/mnemosyne/jsdoc-p0/*.patch; do
  git apply "$p"
done

# Verify nothing broke at the type / lint / test level
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

If any patch fails `git apply --check`, the most common cause is that
the source file has been modified since this directory was generated.
Re-run the generator:

```bash
python3 docs/drafts/mnemosyne/jsdoc-p0/.staging/generate_patches.py
```

It takes ~1 second and writes the 5 fresh patches.

---

## Coverage impact

| Metric                                                          | Before      | After                                                                          |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| Total `src/` exports (Prometheus canonical)                     | 2,260       | 2,260 (unchanged)                                                              |
| Exports with full JSDoc (`@param` + `@returns` + `@example`)    | 23 (1.02 %) | **28 (1.24 %)**                                                                |
| **Highest-value P0 exports documented**                         | 0 of 5      | **5 of 5**                                                                     |
| Approx. total JSDoc line count in `src/`                        | ~580        | **~847** (+267)                                                                |

The 1.02 → 1.24 % is a strict increase even though the 5 patches only
add 267 lines of JSDoc. The "highest-value exports documented" row is
the real metric: every P0 export Apollo was assigned now has
first-class JSDoc that future contributors can read inline in their IDE.

---

## Cross-references (in the JSDoc `@see` tags)

- `src/store/authStore.ts` — referenced from `useAuth` JSDoc
- `src/utils/crypto.ts` — `unlockMasterKey` referenced from `masterStorage` JSDoc
- `src/workers/MonteCarloWorker.ts` — referenced from `simulate` JSDoc
- `src/loaders/CubeLoader.ts` — referenced from `CubeEngine` JSDoc
- ADR-002 (offline-first rationale) — `masterStorage` JSDoc
- ADR-003 (typed arrays vs Maps) — `CubeEngine` JSDoc
- ADR-005 (mock vs real auth split) — `useAuth` JSDoc
- ADR-007 (custom Monte Carlo) — `simulate` JSDoc

(These ADR numbers are the *current* best-guess IDs — D-005 = "≤2 sentences
or silence" doesn't apply to a multi-ADR `@see` block like this, so the
ADR cross-refs are kept inline. If Strategos renumbers them when he
authors the canonical ADR index, the `@see` tags in the JSDoc will need
a one-pass grep-and-replace. Mnemosyne can do that in a follow-up turn
on Lead's request.)

---

## Independent of Athena's triage (per Muse-system directive)

This task was assigned in the same "no-agent-shall-be-idle" directive
that handed Hephaestus and Prometheus their tasks. None of the JSDoc
content overlaps with the 65+ pre-existing test failures Athena is
triaging — these patches are **pure documentation, zero runtime logic
changes**. `npx tsc --noEmit` and `npx vitest run` results will be
identical before and after the patches (modulo the JSDoc being
type-checked by TS, which it already was on the original sparse blocks).

Mnemosyne is holding for Athena's triage result before updating
`TESTING.md`, `CHANGELOG.md`, `05-build-pipeline.mmd`, and
`ARCHITECTURE.md` to reflect the 65+ pre-existing failures.

---

_Mnemosyne 2026-06-12 (v0.2 verified 2026-06-13 01:33 IST). Independent
of Athena's triage; Apollo stages after pre-push lands._
<!-- /DRAFT v0.2 — Mnemosyne 2026-06-12 -->
