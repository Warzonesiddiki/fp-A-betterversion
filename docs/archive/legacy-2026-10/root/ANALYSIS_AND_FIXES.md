# FinPlan Pro — Project Analysis, Fixes & Improvement Plan

_Generated 2026-07-30 by an automated analysis pass against commit `083b394`._

---

## TL;DR

**The codebase is in far better shape than its own status documents claim.**
Every quality gate passes clean. The actual "broken" parts were not in the
application code at all — they were in **CI, the test runner config, and stale
documentation**:

1. **CI was red on every run** — the unit-test job timed out at 15 min while the
   suite needs ~17 min.
2. **An 80 GiB heap** (`--max-old-space-size=81920`) that the project's _own_
   audits flagged as a red flag and that is no longer needed.
3. **A Vitest 4 config regression** — `test.poolOptions` was removed in v4, so
   the intended 4-worker concurrency was silently being ignored.

All three are fixed in this pass. Details below, plus a prioritized list of
remaining improvements.

---

## 1. Diagnosis: every gate passes (verified, not claimed)

Run from a clean install (`rm -rf node_modules && npm ci`):

| Gate                | Command                               | Result                                               |
| ------------------- | ------------------------------------- | ---------------------------------------------------- |
| Install             | `npm ci --no-audit --no-fund`         | ✅ 1006 packages, 19 s, hermetic                     |
| Type check          | `tsc --noEmit`                        | ✅ 0 errors                                          |
| Lint (strict)       | `eslint src --max-warnings 0`         | ✅ 0 errors, 0 warnings                              |
| Production build    | `npm run build` (tsc + eslint + vite) | ✅ succeeds, PWA generated                           |
| Frontend unit tests | `npm test`                            | ✅ **905 files / 904 passed / 1 skipped / 0 failed** |
| Server type check   | `server: tsc --noEmit`                | ✅ 0 errors                                          |
| Server tests        | `server: npm test`                    | ✅ 38 passed                                         |
| Repo hygiene        | `npm run repo:hygiene`                | ✅ passes                                            |
| Doc truth check     | `npm run docs:verify`                 | ✅ passes                                            |
| Money ratchet       | `npm run money:adoption`              | ✅ ratchet holds (21 modules)                        |

> **Key correction:** the `remediation-ledger.json` finding **N-0012** ("24
> failing tests across 14 files", status `in_progress`) was **stale**. Those 24
> failures are all gone. The ledger entry has been updated to `fixed_verified`
> with current evidence.

---

## 2. Fixes applied this pass (3 real defects)

### Fix A — CI test job was timing out on every run (`test-unit.yml`)

The suite takes ~11–18 min wall-clock locally (slower with `--coverage` on CI),
but the job had `timeout-minutes: 15`. It would fail on essentially every push.

- `timeout-minutes: 15` → **`30`** (safe margin).

### Fix B — Removed the unnecessary 80 GiB heap (`package.json`, CI, docs)

The npm test scripts used `--max-old-space-size=81920` (80 GiB). Two of the
project's own audit reports already called this out:

> "The 80 GiB heap is itself a red flag: it masks a memory-leak or teardown
> defect rather than fixing it." — `reports/ZERO_COMPROMISE_FORENSIC_AUDIT_2026-07-28.md`

The hang it was masking was the module-resolution deadlock **fixed in N-0001**.
A full-suite run now terminates reliably at **8 GiB** (`8192`), proven twice in
this pass with 0 failures. Reduced in all 5 scripts + the CI workflow + every
doc that mentioned it. (Historical audit reports under `reports/` were left
unchanged — they are records of past state.)

### Fix C — Vitest 4 `poolOptions` regression (`vite.config.ts`)

Vitest 4 removed `test.poolOptions`; the old block
(`poolOptions.threads.{maxThreads:4, minThreads:2}`) was being **silently
ignored**, emitting a DEPRECATED warning and meaning the intended 4-worker
concurrency never applied. Migrated to the v4 top-level form:

```ts
pool: 'threads',
maxWorkers: 4,   // minWorkers was dropped in v4
```

### Fix D — Documentation accuracy

- README referenced `npm run dev:watch`, which **does not exist** (and
  `npm run dev` is already Vite's HMR server). Removed the dead reference.
- README troubleshooting/npm-table "80GB heap" text corrected to 8GB.
- Updated `remediation-ledger.json` N-0012 to reflect the green suite.
- `AGENTS.md`, `CLAUDE.md`, `knowledge.md`, `docs/TESTING.md`, `.env.example`
  heap references corrected.

**Verification after fixes:** `npm run build` ✅, `npm run docs:verify` ✅,
full `npm test` ✅ (905/904/1/0). No canonical file contains `81920` anymore.

---

## 3. Suggested improvements (prioritized)

These are **not** done in this pass — they are opportunities, ordered by impact.

### High impact

1. **Finish the money-primitive migration (N-0009).** Only **21 of 355**
   financial modules use the canonical `decimal.js`-backed `money` primitive;
   **84 raw `toFixed(n)` sites remain**. This is the highest-value correctness
   risk for a finance product (cent-level rounding drift at scale). The CI
   ratchet already prevents regression — the work is to keep raising the floor.
2. **Key the audit chain (N-0010).** The tamper-evident log uses unkeyed
   SHA-256. It detects naive tampering but a determined insider could recompute
   it. Move to HMAC-SHA-256 (key outside mutable client state) or an append-only
   server sink. Currently the only `red` CEO-status item.
3. **Observability: make the axe/a11y job actually gate (N-0007).** It's wired
   but WCAG 2.2 AA is the design target, not verified-and-enforced. For
   enterprise/public-sector buyers this is often contractual.

### Medium impact

4. **Shrink the suppression surface (N-0015).** 563 `eslint-disable`, 471
   `as any`, 346 `as unknown as`, 8 unjustified skipped tests. Establish a CI
   ratchet (like the money one) and ratchet downward; start with critical paths
   (engines/stores).
5. **Clean up process-artifact pollution (N-0016).** ~424 Markdown files and
   non-product dirs (`_bmad/`, `agents/`, `prompt/`, `.codex/`, `plan/`,
   `plan and advice/`). The stray `plan/` and `plan and advice/` dirs even
   contain **duplicate, stale copies of `.env.example`** that still say 80 GiB.
   Archive or delete; move AI-agent prompts into `.github/` or a single `docs/`
   subtree.
6. **Dead env knob.** `SKIP_HEAP_OVERRIDE` is documented in `.env.example` but
   **no code reads it**. Either implement it or delete the line.
7. **Coverage floor.** Thresholds are 50% (statements/branches/functions/lines)
   and the README is honest about it. For financial software, aim to ratchet
   this upward as the money migration lands.

### Low impact / hygiene

8. **Root-file sprawl.** The repo root mixes product (`README`, `LICENSE`,
   `package.json`) with process artifacts (`AUDIT_LOG.md`, `AUDIT_REPORT_V3*.md`,
   `COMPLETION_TASKLIST_ZERO_COMPROMISE.md`, multiple `*_AGENT*.md`, status
   HTML). Move process docs into `docs/` or `.github/`.
9. **`engines:verify` / `architecture:guardrails`** exist and pass — keep them
   in the required CI checks so the 178-engine reachability guarantee can't
   silently regress.
10. **README "195 page modules / 190 engines"** counts are now measured by
    `docs:verify`, which is good. Consider also asserting the bundle budget
    (main ≤150 KB, total ≤2 MB gzip) in `docs:verify` so the headline claim is
    continuously verified, not just the counts.

---

## 4. What this pass did NOT touch (and why)

- **Application source (`src/`)** — intentionally untouched; it's green.
- **Historical audit reports (`reports/`)** — they are evidence records and were
  left verbatim.
- **The "NOT production-ready" status line in the README** — that is a
  deliberate, defensible claim driven by the open items in §3 (N-0009/0010/0015
  etc.). It should only be lifted when those gates are closed, not because the
  build is green.

---

## How to reproduce the verification

```bash
rm -rf node_modules && npm ci --no-audit --no-fund
npm run build                      # tsc + eslint --max-warnings 0 + vite build
npm test                           # full suite @ 8 GiB
(cd server && npm ci --no-audit --no-fund && npx tsc --noEmit && npm test)
npm run docs:verify
npm run repo:hygiene
npm run money:adoption
```
