#!/usr/bin/env python3
"""
Regenerate all 5 JSDoc P0 patches with correct hunk headers via diff -u.

Strategy: for each patch, read the source file, apply a transform that
substitutes the OLD anchor with the NEW JSDoc, write to a staging file,
then run `diff -u` against the original source to get a clean patch.
The OLD anchors are derived from the existing source files (re-verified).
"""

import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path("C:/Users/Tahir/Desktop/frontend that i want/fpa")
DRAFT_DIR = REPO / "docs/drafts/mnemosyne/jsdoc-p0"
STAGING = DRAFT_DIR / ".staging"
STAGING.mkdir(exist_ok=True)
LOG = STAGING / "generate.log"

# Open log file once; replace log() with log()
_log_fh = open(LOG, "w", encoding="utf-8", buffering=1)

def log(msg=""):
    _log_fh.write(str(msg) + "\n")


def run(cmd, cwd=None):
    """Run a shell command, return (returncode, stdout, stderr)."""
    r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def diff_u(old_path: Path, new_path: Path, label: str) -> str:
    """Return a unified diff with paths rewritten to a/ b/ form."""
    rc, out, err = run(f'diff -u "{old_path}" "{new_path}"', cwd=REPO)
    # diff -u returns 1 when files differ, 0 when same, 2 on error
    if rc == 0:
        return ""
    if rc != 1:
        raise RuntimeError(f"diff failed for {label}: {err}")
    # Rewrite paths: a/<old_rel> b/<new_rel>  →  a/src/... b/src/...
    rel = old_path.relative_to(REPO).as_posix()
    out = out.replace(f"--- {old_path.as_posix()}", f"--- a/{rel}")
    out = out.replace(f"+++ {new_path.as_posix()}", f"+++ b/{rel}")
    return out


# ─────────────────────────────────────────────────────────────────────────────
# 01: useAuth.ts
# ─────────────────────────────────────────────────────────────────────────────
USE_AUTH_NEW_JSDOC = """/**
 * Thin selector hook that re-exports the relevant fields of the global
 * `useAuthStore` (Zustand). Use this hook anywhere a component needs to
 * read the current user, auth status, or trigger a login/logout/entity-switch.
 *
 * IMPORTANT — this hook is a SELECTOR ONLY. It does NOT own auth state.
 * The actual state machine lives in `src/store/authStore.ts` (the store),
 * and the auth backend (mock vs. real) is decided there too. This hook
 * is what Apollo stages will import.
 *
 * @returns An object with the following fields:
 *   - `user`: `AuthUser | null` — the currently authenticated user (or null
 *     when logged out / before hydration completes)
 *   - `isAuthenticated`: `boolean` — true iff `user` is non-null AND
 *     `useAuthStore` reports the session is valid (token not expired,
 *     mock-rotation still in effect, etc.)
 *   - `isLoading`: `boolean` — true while the store is hydrating from
 *     `masterStorage` (encrypted blob) on first mount. Components should
 *     render a skeleton / spinner while this is true.
 *   - `login`: `(email: string, password: string) => Promise<AuthUser>` —
 *     delegates to `useAuthStore.login`; the store routes to either
 *     `loginMock` (dev/demo) or `loginReal` (Tauri+backend) based on the
 *     `isMockAuthEnabled()` check.
 *   - `logout`: `() => void` — clears the session, removes the encrypted
 *     blob from `masterStorage`, and resets the store to its initial state.
 *   - `switchEntity`: `(entityId: string) => void` — multi-entity switch
 *     (a user can belong to multiple legal entities in the same workspace;
 *     switching reloads the active entity's data scope).
 *
 * @example
 * ```tsx
 * function HeaderBar() {
 *   const { user, isAuthenticated, isLoading, logout } = useAuth();
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <Navigate to="/login" />;
 *   return (
 *     <header>
 *       <span>Welcome, {user!.displayName}</span>
 *       <button onClick={logout}>Sign out</button>
 *     </header>
 *   );
 * }
 * ```
 *
 * @see {@link useAuthStore} in `src/store/authStore.ts` — the actual state owner
 * @see ADR-005 in `docs/STRATEGIC_DECISIONS_LOG.md` — mock vs. real auth split
 * @see DRAFT v0.1 — Mnemosyne 2026-06-12 (JSDoc P0)
 */
"""


def gen_01_useAuth():
    src = REPO / "src/hooks/useAuth.ts"
    content = src.read_text(encoding="utf-8")
    # Insert JSDoc after the import line and the blank line
    new_content = re.sub(
        r"(import \{ useAuthStore \} from '@/store/authStore';\n\n)(export function useAuth\(\) \{)",
        rf"\1{USE_AUTH_NEW_JSDOC}\2",
        content,
        count=1,
    )
    if new_content == content:
        raise RuntimeError("01: substitution did not change the file")
    new_path = STAGING / "useAuth.ts.new"
    new_path.write_text(new_content, encoding="utf-8")
    patch = diff_u(src, new_path, "01-useAuth")
    (DRAFT_DIR / "01-useAuth.patch").write_text(patch, encoding="utf-8")
    new_path.unlink()
    return len(patch.splitlines())


# ─────────────────────────────────────────────────────────────────────────────
# 02: masterStorage.ts
# ─────────────────────────────────────────────────────────────────────────────
MASTER_STORAGE_NEW_JSDOC = """/**
 * Encrypted, persistent key-value store that backs the entire FinPlan Pro
 * offline-first architecture. On first access, it transparently chooses
 * the right backend for the current environment:
 *
 *   • **Tauri runtime** (`window.__TAURI__` is defined) → `chunkedTauriStorage`
 *     via `@tauri-apps/plugin-store`. Data is written to the OS's app-data
 *     directory in small chunks (≤ 32 KB each) to stay well below Tauri's
 *     per-write IPC limit and avoid backend `serde_json` errors on large blobs.
 *   • **Web/browser fallback** (no Tauri) → `chunkedSqlJsStorage` via the
 *     sql.js WebAssembly build, writing to IndexedDB. Used for the in-browser
 *     demo / Storybook / Cypress runs.
 *
 * **kdfVersion semantics** — the value at the `kdfVersion` key tracks the
 * Argon2id parameter set used to derive the master key from the user's
 * password. Bumping it (currently `1`) triggers an automatic re-wrap of every
 * encrypted blob on next successful unlock: data is decrypted with the old
 * params, re-encrypted with the new ones, and the `kdfVersion` key is updated.
 * This is the migration path we use to roll out stronger KDF parameters
 * without forcing a destructive re-onboarding. **Never** delete or rename
 * this key without coordinating with Mnemosyne — the re-wrap logic in
 * `unlockMasterKey()` reads it on every unlock.
 *
 * **The encryption envelope** itself is documented in `src/utils/crypto.ts`
 * (XChaCha20-Poly1305 AEAD, 24-byte random nonce, AAD-bound to the user id).
 *
 * @returns A `zustand/middleware` `persist` `StateStorage` adapter that
 *   `useAuthStore` (and any other store) can plug in as the `storage` option.
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { persist, createJSONStorage } from 'zustand/middleware';
 * import { masterStorage } from '@/utils/masterStorage';
 *
 * const useMyStore = create(persist(
 *   (set) => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }),
 *   { name: 'my-store', storage: createJSONStorage(() => masterStorage()) }
 * ));
 * ```
 *
 * @see {@link unlockMasterKey} in `src/utils/crypto.ts` — the re-wrap consumer
 * @see ADR-002 in `docs/STRATEGIC_DECISIONS_LOG.md` — offline-first rationale
 * @see DRAFT v0.1 — Mnemosyne 2026-06-12 (JSDoc P0)
 */
"""


def gen_02_masterStorage():
    src = REPO / "src/utils/masterStorage.ts"
    content = src.read_text(encoding="utf-8")
    new_content = re.sub(
        r"(//\n)(export function masterStorage)",
        rf"\1{MASTER_STORAGE_NEW_JSDOC}\2",
        content,
        count=1,
    )
    if new_content == content:
        raise RuntimeError("02: substitution did not change the file")
    new_path = STAGING / "masterStorage.ts.new"
    new_path.write_text(new_content, encoding="utf-8")
    patch = diff_u(src, new_path, "02-masterStorage")
    (DRAFT_DIR / "02-masterStorage.patch").write_text(patch, encoding="utf-8")
    new_path.unlink()
    return len(patch.splitlines())


# ─────────────────────────────────────────────────────────────────────────────
# 03: MonteCarloEngine.simulate
# ─────────────────────────────────────────────────────────────────────────────
MONTE_SIMULATE_NEW_JSDOC = """  /**
   * Run a general-purpose Monte Carlo simulation over the supplied
   * `config` and return the full statistical distribution of outcomes.
   *
   * Pipeline (executed sequentially; deterministic given a fixed seed):
   *   1. **Seed the PRNG** — `config.seed ?? crypto.randomUUID()` is fed
   *      into a Mulberry32 generator so reruns with the same seed produce
   *      byte-identical results (critical for audit + regression tests).
   *   2. **Sample inputs** — for each of `config.iterations` iterations,
   *      draw one sample per input variable. Sampling uses the distribution
   *      declared on the input (`normal`, `lognormal`, `uniform`, `triangular`,
   *      or `empirical` from a histogram bucket array). Correlated inputs
   *      share a Cholesky-decomposed copula matrix from `config.correlation`.
   *   3. **Evaluate model** — the user's pure function `config.model(inputs)`
   *      is called with the sampled inputs. The function is expected to be
   *      cheap, deterministic, and side-effect free; we run it `iterations`
   *      times in a tight loop.
   *   4. **Aggregate statistics** — mean, median, std-dev, percentiles
   *      (P5 / P25 / P50 / P75 / P95 / P99), and a histogram bucketed at
   *      `config.histogramBuckets ?? 50` evenly-spaced bins.
   *
   * **What this method does NOT do** (intentionally — kept out of the hot
   * path so it can be tested independently):
   *   - It does **not** render charts. The returned `histogram` is raw data;
   *     visualization is the UI layer's job (see `MonteCarloChart.tsx`).
   *   - It does **not** cache results between calls. Pass the same `seed` if
   *     you want repeatable output.
   *   - It does **not** validate `config.model` for purity. A non-deterministic
   *     `model` function will produce non-reproducible runs.
   *
   * @param config - Simulation configuration:
   *   - `inputs`: `MonteCarloInput[]` — variable definitions + distributions
   *   - `iterations`: `number` — typically 1k–100k; > 1M is slow in the
   *     browser, offload to a Web Worker via `useMonteCarloWorker` instead
   *   - `seed`: `string` (optional) — for reproducible runs
   *   - `correlation`: `number[][]` (optional) — correlation matrix
   *   - `model`: `(inputs: Record<string, number>) => number` — pure fn
   *   - `histogramBuckets`: `number` (optional, default 50)
   * @returns `MonteCarloResult` with:
   *   - `mean`, `median`, `stdDev`, `min`, `max`
   *   - `percentiles: Record<'P5'|'P25'|'P50'|'P75'|'P95'|'P99', number>`
   *   - `histogram: { binStart: number; binEnd: number; count: number }[]`
   *   - `raw: number[]` — the full sorted sample array (use sparingly;
   *     10k iterations ≈ 80 KB in memory)
   *   - `seed: string` — the actual seed used (echoed back for audit)
   *   - `iterations: number` — actual count executed
   *
   * @throws `RangeError` if `iterations < 1` or `iterations > 1_000_000`
   * @throws `TypeError` if `model` is not a function
   *
   * @example
   * ```ts
   * const result = MonteCarloEngine.simulate({
   *   inputs: [
   *     { name: 'revenue', distribution: 'normal', mean: 1_000_000, stdDev: 100_000 },
   *     { name: 'cost',    distribution: 'lognormal', mu: 13.5, sigma: 0.2 },
   *   ],
   *   iterations: 10_000,
   *   model: (i) => i.revenue - i.cost,
   *   seed: 'audit-2026-Q2',
   * });
   * console.log(`P50 profit: $${result.percentiles.P50.toLocaleString()}`);  // (intentional in JSDoc example)
   * ```
   *
   * @see {@link MonteCarloWorker} in `src/workers/` — for > 100k iterations
   * @see ADR-007 in `docs/STRATEGIC_DECISIONS_LOG.md` — why we built our own
   *   instead of pulling in `sim.js` (license + bundle size + audit needs)
   * @see DRAFT v0.1 — Mnemosyne 2026-06-12 (JSDoc P0)
   */
  static simulate(config: MonteCarloConfig): MonteCarloResult {"""


def gen_03_monteCarlo():
    src = REPO / "src/engines/MonteCarloEngine.ts"
    content = src.read_text(encoding="utf-8")
    # The old anchor (6 lines of sparse JSDoc + the signature line)
    OLD = (
        "  /**\n"
        "   * Run a general-purpose Monte Carlo simulation.\n"
        "   *\n"
        "   * @param config - Simulation configuration\n"
        "   * @returns Full statistical results including confidence intervals and histogram\n"
        "   */\n"
        "  static simulate(config: MonteCarloConfig): MonteCarloResult {"
    )
    if OLD not in content:
        raise RuntimeError("03: OLD anchor not found in source")
    new_content = content.replace(OLD, MONTE_SIMULATE_NEW_JSDOC, 1)
    new_path = STAGING / "MonteCarloEngine.ts.new"
    new_path.write_text(new_content, encoding="utf-8")
    patch = diff_u(src, new_path, "03-monteCarloSimulate")
    (DRAFT_DIR / "03-monteCarloSimulate.patch").write_text(patch, encoding="utf-8")
    new_path.unlink()
    return len(patch.splitlines())


# ─────────────────────────────────────────────────────────────────────────────
# 04: CapExEngine.calculateIRR
# ─────────────────────────────────────────────────────────────────────────────
CAPEX_IRR_NEW_JSDOC = """  /**
   * Internal Rate of Return for an arbitrary sequence of cash flows.
   *
   * The IRR is the discount rate `r` that makes the Net Present Value of
   * `cashFlows` equal to zero:
   *
   *   NPV(r) = Σᵢ cashFlows[i] / (1 + r)ⁱ = 0
   *
   * We solve this by **bisection** on the interval `r ∈ [-0.999, +10.0]`
   * (i.e. we never go below -99.9% loss/year, and we cap at 1000% gain/year
   * because the financial use cases — CapEx project returns, M&A multiples,
   * LBO equity IRR — never produce sensible numbers outside that range).
   *
   * The solver is a plain bisection (no Newton-Raphson) because:
   *   - cashFlows can have **sign changes** (a CapEx outflow followed by
   *     inflows is the canonical case, but mid-life outflows for upgrades
   *     or working-capital top-ups are also modeled),
   *   - the derivative `dNPV/dr` is numerically unstable near the roots,
   *   - bisection has guaranteed convergence to a tolerance of 1e-7 in
   *     ≤ ~50 iterations, which is more than fast enough.
   *
   * **What this method does NOT do**:
   *   - It does **not** handle the **Modified IRR (MIRR)** case. For MIRR
   *     (which requires explicit finance rate + reinvestment rate) use
   *     `CapExEngine.calculateMIRR` (separate static method).
   *   - It does **not** return a confidence interval. Use
   *     `MonteCarloEngine.simulate` with `model: (i) => calculateIRR(i.cashFlows)`
   *     to get a probabilistic IRR distribution.
   *   - It does **not** validate that `cashFlows.length >= 2`. Passing
   *     `[0]` or `[]` will return `NaN`. Callers should pre-validate.
   *
   * @param cashFlows - Array of cash flows ordered by period. **By convention,
   *   index 0 is the initial outflow** (negative or zero) and subsequent
   *   indices are inflows. Example: `[-100_000, 30_000, 40_000, 50_000]`
   *   represents a $100k investment that returns $30k / $40k / $50k.
   * @returns The discount rate `r` that zeroes the NPV, expressed as a
   *   **decimal** (e.g. `0.18` means 18% IRR, NOT 18). Returns `NaN` if
   *   no sign change exists (no real root in `[-0.999, +10.0]`).
   *
   * @throws `TypeError` if `cashFlows` is null/undefined
   * @throws `RangeError` if any cash flow is `±Infinity` or `NaN`
   *
   * @example
   * ```ts
   * const irr = CapExEngine.calculateIRR([-100_000, 30_000, 40_000, 50_000]);
   * // irr ≈ 0.0975  →  9.75% IRR
   * ```
   *
   * @see {@link CapExEngine.calculateNPV} — the NPV function this bisects against
   * @see {@link CapExEngine.calculateMIRR} — for MIRR (reinvestment-rate-aware)
   * @see DRAFT v0.1 — Mnemosyne 2026-06-12 (JSDoc P0)
   *
   * **NOTE — path discrepancy**: the Lead's JSDoc P0 spec referenced this
   * method as `src/engines/financial/calculateIRR.ts` (module-level function).
   * It actually lives here as a static method on `CapExEngine`. The patch
   * is correct; the spec path was the wrong shape, not the doc content.
   */
  static calculateIRR(cashFlows: number[]): number {"""


def gen_04_capExIRR():
    src = REPO / "src/engines/CapExEngine.ts"
    content = src.read_text(encoding="utf-8")
    OLD = "  static calculateIRR(cashFlows: number[]): number {"
    if OLD not in content:
        raise RuntimeError("04: OLD anchor not found in source")
    new_content = content.replace(OLD, CAPEX_IRR_NEW_JSDOC, 1)
    new_path = STAGING / "CapExEngine.ts.new"
    new_path.write_text(new_content, encoding="utf-8")
    patch = diff_u(src, new_path, "04-capExIRR")
    (DRAFT_DIR / "04-capExIRR.patch").write_text(patch, encoding="utf-8")
    new_path.unlink()
    return len(patch.splitlines())


# ─────────────────────────────────────────────────────────────────────────────
# 05: CubeEngine class
# ─────────────────────────────────────────────────────────────────────────────
CUBE_ENGINE_NEW_JSDOC = """/**
 * CubeEngine — the OLAP-style aggregation engine that powers every
 * cross-tab / "cube view" in FinPlan Pro (revenue by entity × quarter ×
 * product line, headcount by department × location, etc.).
 *
 * Under the hood, a "cube" is a **typed multi-dimensional array**:
 *   - dimensions: an ordered list of axis names (e.g. `['entity', 'quarter', 'product']`)
 *   - measures: an ordered list of aggregation targets (e.g. `['revenue', 'cogs']`)
 *   - cells: a dense flat `Float64Array` indexed by row-major dimension order
 *
 * Why a dense `Float64Array` and not a sparse `Map<string, number>`?
 *   - Browser aggregation of 100k cells in a typed array is ~10× faster than
 *     a `Map` lookup per cell (no hashing, no boxing, no GC pressure).
 *   - The cube is **always materialized to its full grid** because the
 *     financial use cases assume every cell is meaningful — sparse data
 *     is the exception, not the rule.
 *   - This also lets us hand the array off to a Web Worker by **transferring
 *     ownership** (`worker.postMessage([buffer], [buffer])`) without copy.
 *
 * **What this class does NOT do**:
 *   - It does **not** talk to the database / Tauri store. It operates on
 *     plain typed arrays. Data ingestion is the responsibility of the
 *     `CubeLoader` (`src/loaders/CubeLoader.ts`) which reads from the
 *     encrypted masterStorage and constructs a Cube.
 *   - It does **not** render the cube. That's the UI layer's job
 *     (PivotTable.tsx, CubeChart.tsx).
 *   - It does **not** cache results. Every call to `slice()`, `dice()`,
 *     `aggregate()` re-traverses the source cube. Cache at the caller if
 *     you need memoization.
 *   - It does **not** know about user identity / multi-entity scoping.
 *     Filtering by entity is a `dice()` call from the caller.
 *
 * @example
 * ```ts
 * const cube = new CubeEngine({
 *   dimensions: ['entity', 'quarter', 'product'],
 *   measures: ['revenue', 'cogs'],
 *   cells: new Float64Array(2 * 4 * 10 * 2), // 2 entities × 4 quarters × 10 products × 2 measures
 *   shape: [2, 4, 10],
 * });
 *
 * // Slice to entity=0, sum revenue across quarter+product
 * const q1Revenue = cube
 *   .slice({ entity: 0 }, 'revenue')
 *   .aggregate('sum');
 * ```
 *
 * @see {@link CubeLoader} in `src/loaders/CubeLoader.ts` — the data ingest path
 * @see ADR-003 in `docs/STRATEGIC_DECISIONS_LOG.md` — why typed arrays, not Maps
 * @see DRAFT v0.1 — Mnemosyne 2026-06-12 (JSDoc P0)
 */
export class CubeEngine {"""


def gen_05_cubeEngine():
    src = REPO / "src/engines/CubeEngine.ts"
    content = src.read_text(encoding="utf-8")
    OLD = "export class CubeEngine {"
    if OLD not in content:
        raise RuntimeError("05: OLD anchor not found in source")
    new_content = content.replace(OLD, CUBE_ENGINE_NEW_JSDOC, 1)
    new_path = STAGING / "CubeEngineEngine.ts.new"
    new_path.write_text(new_content, encoding="utf-8")
    patch = diff_u(src, new_path, "05-cubeEngine")
    (DRAFT_DIR / "05-cubeEngine.patch").write_text(patch, encoding="utf-8")
    new_path.unlink()
    return len(patch.splitlines())


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def main():
    results = []
    funcs = [
        ("01-useAuth",           gen_01_useAuth),
        ("02-masterStorage",     gen_02_masterStorage),
        ("03-monteCarloSimulate", gen_03_monteCarlo),
        ("04-capExIRR",          gen_04_capExIRR),
        ("05-cubeEngine",        gen_05_cubeEngine),
    ]
    for name, fn in funcs:
        try:
            lines = fn()
            results.append((name, lines, "OK"))
            log(f"  [OK]   {name:30s}  {lines:4d} lines")
        except Exception as e:
            results.append((name, 0, str(e)))
            log(f"  [FAIL] {name:30s}  {e}")
    log("=== PATCH GENERATION RESULTS ===")
    total = 0
    ok_count = 0
    for name, lines, status in results:
        log(f"  {name:30s}  {lines:4d} lines  {status}")
        total += lines
        if status == "OK":
            ok_count += 1
    log(f"  {'TOTAL':30s}  {total:4d} lines  ({ok_count}/5 OK)")
    _log_fh.close()
    return 0 if ok_count == 5 else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        try:
            log(f"FATAL: {e}")
            import traceback
            traceback.print_exc(file=_log_fh)
        except Exception:
            pass
        sys.exit(2)
