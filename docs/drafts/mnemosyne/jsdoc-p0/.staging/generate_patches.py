#!/usr/bin/env python3
"""Regenerate v0.2 JSDoc P0 patches - handles sources that already have v0.1 JSDoc.

Key insight: the source files now contain the v0.1 JSDoc (33 unpushed commits
shipped them). So the patch must REMOVE the v0.1 JSDoc and INSERT the v0.2
JSDoc. The diff is `delete v0.1 block + add v0.2 block`.

The previous script (v0.2 attempt 1) used a re.sub that assumed the v0.1
JSDoc was NOT present, so the substitution was a no-op and the diff
returned empty. This version explicitly matches the v0.1 JSDoc and replaces
it.
"""

import re
import subprocess
import sys
from pathlib import Path

REPO = Path("C:/Users/Tahir/Desktop/frontend that i want/fpa")
DRAFT_DIR = REPO / "docs/drafts/mnemosyne/jsdoc-p0"
STAGING = DRAFT_DIR / ".staging"
STAGING.mkdir(exist_ok=True)
LOG = STAGING / "generate.log"

# On Windows `diff` is at C:\Program Files\Git\usr\bin\diff.exe (from
# Git for Windows) but it's NOT on the PATH for our shell. Find it
# dynamically so the script works on this and similar systems.
DIFF_BIN = None
for cand in [
    r"C:\Program Files\Git\usr\bin\diff.exe",
    r"C:\Program Files\Git\mingw64\bin\diff.exe",
    r"C:\Program Files (x86)\Git\usr\bin\diff.exe",
    r"C:\msys64\usr\bin\diff.exe",
    "/usr/bin/diff",
    "/bin/diff",
    "diff",
]:
    from shutil import which
    w = which(cand) if not cand.startswith(("C:", "/")) else (cand if Path(cand).exists() else None)
    if w:
        DIFF_BIN = w
        break

if DIFF_BIN is None:
    raise SystemExit("FATAL: cannot find a `diff` executable on this system")

_log_fh = open(LOG, "w", encoding="utf-8", buffering=1)


def log(msg=""):
    _log_fh.write(str(msg) + "\n")


def run(cmd, cwd=None):
    r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr


def diff_u(old_path: Path, new_path: Path) -> str:
    rc, out, err = run(f'"{DIFF_BIN}" -u "{old_path}" "{new_path}"', cwd=REPO)
    if rc == 0:
        return ""
    if rc != 1:
        raise RuntimeError(f"diff failed (rc={rc}): {err}\n--- OUT ---\n{out}")
    rel = old_path.relative_to(REPO).as_posix()
    old_q = f'"{old_path}"'.replace("\\", "\\\\")
    new_q = f'"{new_path}"'.replace("\\", "\\\\")
    out = out.replace(old_q, f"a/{rel}")
    out = out.replace(new_q, f"b/{rel}")
    return out


def write_patch(path: Path, content: str):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(content)


def gen(name: str, src: Path, old_block_regex: str, new_block: str, anchor_label: str):
    """Replace the v0.1 JSDoc block with the v0.2 block.

    old_block_regex: a Python regex with `re.DOTALL | re.MULTILINE` that
                     matches the ENTIRE v0.1 block (including the trailing
                     blank line), with one capture group.
    new_block:       the replacement (new JSDoc + trailing blank line).
    """
    content = src.read_text(encoding="utf-8")
    match = re.search(old_block_regex, content, flags=re.DOTALL)
    if not match:
        # try without v0.1 - maybe the source doesn't have it
        raise RuntimeError(f"{name}: v0.1 block not found at anchor {anchor_label}")
    new_content = content[:match.start()] + new_block + content[match.end():]
    new_path = STAGING / f"{src.name}.new"
    with open(new_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    patch = diff_u(src, new_path)
    new_path.unlink()
    if not patch:
        raise RuntimeError(f"{name}: diff was empty (no change?)")
    write_patch(DRAFT_DIR / f"{name}.patch", patch)
    return len(patch.splitlines())


# ── 01 useAuth.ts ────────────────────────────────────────────────────────────
USE_AUTH_V2 = '''/**
 * Thin selector hook that re-exports the relevant fields of the global
 * `useAuthStore` (Zustand). Use this hook anywhere a component needs to
 * read the current user, auth status, or trigger a login/logout/entity-switch.
 *
 * IMPORTANT - this hook is a SELECTOR ONLY. It does NOT own auth state.
 * The actual state machine lives in `src/store/authStore.ts` (the store),
 * and the auth backend (mock vs. real) is decided there too. This hook
 * is what Apollo stages will import.
 *
 * @returns An object with the following fields:
 *   - `user`: `AuthUser | null` - the currently authenticated user (or null
 *     when logged out / before hydration completes)
 *   - `isAuthenticated`: `boolean` - true iff `user` is non-null AND
 *     `useAuthStore` reports the session is valid (token not expired,
 *     mock-rotation still in effect, etc.)
 *   - `isLoading`: `boolean` - true while the store is hydrating from
 *     `masterStorage` (encrypted blob) on first mount. Components should
 *     render a skeleton / spinner while this is true.
 *   - `login`: `(email: string, password: string) => Promise<AuthUser>` -
 *     delegates to `useAuthStore.login`; the store routes to either
 *     `loginMock` (dev/demo) or `loginReal` (Tauri+backend) based on the
 *     `isMockAuthEnabled()` check.
 *   - `logout`: `() => void` - clears the session, removes the encrypted
 *     blob from `masterStorage`, and resets the store to its initial state.
 *   - `switchEntity`: `(entityId: string) => void` - multi-entity switch
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
 * @see {@link useAuthStore} in `src/store/authStore.ts` - the actual state owner
 * @see D-006 in `docs/STRATEGIC_DECISIONS_LOG.md` - security-deferral discipline
 *      (mock vs. real auth split lives in the authStore, not in this hook)
 * @see ADR-005 in `docs/drafts/adr/ADR-005-custom-masterstorage.md` - why
 *      session persistence is encrypted + kdfVersion-migrated, not raw
 *      localStorage
 * @see DRAFT v0.2 - Mnemosyne 2026-06-13 (JSDoc P0, post Athena T-AT-003)
 */
'''

USE_AUTH_V1_REGEX = (
    r"/\*\*\n"
    r" \* Thin selector hook for the auth store\.\n"
    r" \*\n"
    r" \* @returns [^\n]*\n"
    r" \*/\n"
)


def gen_01():
    # useAuth.ts may or may not have v0.1 JSDoc. Handle both.
    src = REPO / "src/hooks/useAuth.ts"
    content = src.read_text(encoding="utf-8")
    pat_v01 = (
        r"/\*\*\n"
        r" \* Thin selector hook for the auth store\.\n"
        r" \*\n"
        r" \* @returns [^\n]*\n"
        r" \*/\n\n"
    )
    m = re.search(pat_v01, content, flags=re.DOTALL)
    if m:
        # v0.1 exists - replace it
        new_content = content[:m.start()] + USE_AUTH_V2 + content[m.end():]
    else:
        # No v0.1 - prepend v0.2 to the export function
        if "export function useAuth() {" in content:
            idx = content.index("export function useAuth() {")
            new_content = content[:idx] + USE_AUTH_V2 + content[idx:]
        else:
            raise RuntimeError("01: useAuth() export anchor not found")
    new_path = STAGING / "useAuth.ts.new"
    with open(new_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    patch = diff_u(src, new_path)
    new_path.unlink()
    if not patch:
        raise RuntimeError("01: diff was empty")
    write_patch(DRAFT_DIR / "01-useAuth.patch", patch)
    return len(patch.splitlines())


# ── 02 masterStorage.ts ──────────────────────────────────────────────────────
MASTER_STORAGE_V2 = '''/**
 * Encrypted, persistent key-value store that backs the entire FinPlan Pro
 * offline-first architecture. On first access, it transparently chooses
 * the right backend for the current environment:
 *
 *   - **Tauri runtime** (`window.__TAURI__` is defined) -> `chunkedTauriStorage`
 *     via `@tauri-apps/plugin-store`. Data is written to the OS's app-data
 *     directory in small chunks (<= 32 KB each) to stay well below Tauri's
 *     per-write IPC limit and avoid backend `serde_json` errors on large blobs.
 *   - **Web/browser fallback** (no Tauri) -> `chunkedSqlJsStorage` via the
 *     sql.js WebAssembly build, writing to IndexedDB. Used for the in-browser
 *     demo / Storybook / Cypress runs.
 *
 * **kdfVersion semantics** - the value at the `kdfVersion` key tracks the
 * Argon2id parameter set used to derive the master key from the user's
 * password. Bumping it (currently `1`) triggers an automatic re-wrap of every
 * encrypted blob on next successful unlock: data is decrypted with the old
 * params, re-encrypted with the new ones, and the `kdfVersion` key is updated.
 * This is the migration path we use to roll out stronger KDF parameters
 * without forcing a destructive re-onboarding. **Never** delete or rename
 * this key without coordinating with Mnemosyne - the re-wrap logic in
 * `unlockMasterKey()` reads it on every unlock.
 *
 * **The encryption envelope** itself is documented in `src/utils/crypto.ts`
 * (XChaCha20-Poly1305 AEAD, 24-byte random nonce, AAD-bound to the user id).
 *
 * @returns A `zustand/middleware` `persist` `StateStorage` adapter
 *   (`PersistStorage<any> & { __resetCache: () => void }`) that `useAuthStore`
 *   and any other store can plug in directly as the `storage` option.
 *
 * @example
 * ```ts
 * import { create } from 'zustand';
 * import { persist } from 'zustand/middleware';
 * import { masterStorage } from '@/utils/masterStorage';
 *
 * const useMyStore = create(persist(
 *   (set) => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }),
 *   { name: 'my-store', storage: masterStorage }
 * ));
 * ```
 *
 * @see {@link unlockMasterKey} in `src/utils/crypto.ts` - the re-wrap consumer
 * @see ADR-002 in `docs/drafts/adr/ADR-002-zustand-pattern.md` - offline-first
 *      state-management rationale
 * @see ADR-005 in `docs/drafts/adr/ADR-005-custom-masterstorage.md` - why we
 *      built this wrapper instead of using zustand's `localStorage` adapter
 * @see DRAFT v0.2 - Mnemosyne 2026-06-13 (JSDoc P0, post Athena T-AT-003)
 */
'''


def gen_02():
    # masterStorage.ts may or may not have v0.1 JSDoc. Handle both.
    src = REPO / "src/utils/masterStorage.ts"
    content = src.read_text(encoding="utf-8")
    # Try to find a v0.1 JSDoc block immediately before `export const masterStorage`
    pat_v01 = (
        r"/\*\*\n"
        r" \*[^\n]*masterStorage[^\n]*\n"
        r"(?: \*[^\n]*\n)*?"
        r" \*/\n\n"
        r"export const masterStorage:"
    )
    m = re.search(pat_v01, content)
    if m:
        # Replace v0.1 block (incl. trailing blank line) with the v0.2 block.
        # The match.end() is at the start of `export const masterStorage:`;
        # we want to insert MASTER_STORAGE_V2 (which already ends with a
        # trailing blank line) before `export const masterStorage:`.
        # The match start is at the `/**` of v0.1. The match captures the
        # v0.1 block + blank line. We replace from match.start() to the
        # position of `export const masterStorage:` (which is match.end()
        # minus the length of "export const masterStorage:").
        idx_export = m.end() - len("export const masterStorage:")
        new_content = content[:m.start()] + MASTER_STORAGE_V2 + content[idx_export:]
    else:
        # No v0.1 - find the `export const masterStorage:` line and prepend
        # the v0.2 JSDoc to it.
        if "export const masterStorage:" in content:
            idx_export = content.index("export const masterStorage:")
            new_content = content[:idx_export] + MASTER_STORAGE_V2 + content[idx_export:]
        else:
            raise RuntimeError("02: export const masterStorage anchor not found")
    new_path = STAGING / "masterStorage.ts.new"
    with open(new_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    patch = diff_u(src, new_path)
    new_path.unlink()
    if not patch:
        raise RuntimeError("02: diff was empty")
    write_patch(DRAFT_DIR / "02-masterStorage.patch", patch)
    return len(patch.splitlines())


# ── 03 MonteCarloEngine.simulate ─────────────────────────────────────────────
MONTE_SIMULATE_V2 = '''  /**
   * Run a general-purpose Monte Carlo simulation over the supplied
   * `config` and return the full statistical distribution of outcomes.
   *
   * Pipeline (executed sequentially; deterministic given a fixed seed):
   *   1. **Seed the PRNG** - `config.seed` is fed into a Mulberry32
   *      generator. If `config.seed` is omitted, the fallback is
   *      `Math.floor(Math.random() * 0x7fffffff)` (NOT `crypto.randomUUID`).
   *      Reruns with the same seed produce byte-identical results, which is
   *      critical for audit + regression tests.
   *   2. **Validate inputs** - throws `Error` (not `RangeError` /
   *      `TypeError`) if any of: `config.model` is not a function,
   *      `config.assumptions` is not an array, `config.iterations` is
   *      outside `[1, 1_000_000]`, or `config.confidenceLevel` does not
   *      satisfy `0 < x < 1` (both bounds exclusive).
   *   3. **Sample inputs** - for each of `config.iterations` iterations,
   *      draw one sample per assumption. The `DistributionType` is one of
   *      exactly 7 enum values: `normal`, `uniform`, `triangular`,
   *      `lognormal`, `beta`, `exponential`, `poisson` (no `empirical`).
   *      Sampling uses the per-distribution inverse-CDF in
   *      `validateDistribution()` (a sibling static method).
   *   4. **Evaluate model** - the user's pure function `config.model(inputs)`
   *      is called with the sampled inputs. The function is expected to be
   *      cheap, deterministic, and side-effect free; we run it `iterations`
   *      times in a tight loop.
   *   5. **Aggregate statistics** - mean, median, std-dev, percentiles
   *      (P5 / P25 / P50 / P75 / P95 / P99), and a histogram bucketed at
   *      `config.histogramBuckets ?? 50` evenly-spaced bins. The confidence
   *      interval at `config.confidenceLevel` is the `(1 - cl) / 2` and
   *      `1 - (1 - cl) / 2` percentiles.
   *
   * **What this method does NOT do** (intentionally - kept out of the hot
   * path so it can be tested independently):
   *   - It does **not** correlate inputs. `config.correlation` does NOT
   *     exist. To model correlated inputs, build them separately via
   *     `MonteCarloEngine.generateCorrelatedSamples(distributions,
   *     correlationMatrix, iterations, seed?)` (a sibling static method
   *     that performs the Cholesky decomposition) and pass the
   *     pre-correlated samples into `config.model`.
   *   - It does **not** render charts. The returned `histogram` is raw data;
   *     visualization is the UI layer's job (see `MonteCarloChart.tsx`).
   *   - It does **not** cache results between calls. Pass the same `seed`
   *     if you want repeatable output.
   *
   * @param config - Simulation configuration:
   *   - `assumptions`: `MonteCarloAssumption[]` - variable definitions +
   *     distributions (NOT `inputs`).
   *   - `iterations`: `number` - 1..1_000_000 (validated).
   *   - `seed`: `number` (optional) - the integer seed for Mulberry32; if
   *     omitted, `Math.random()` is used and the run is non-reproducible.
   *   - `model`: `(inputs: Record<string, number>) => number` - required,
   *     must be a function. Pure, deterministic, side-effect free.
   *   - `confidenceLevel`: `number` - required, must satisfy
   *     `0 < x < 1` (exclusive). Drives the CI in the result.
   *   - `histogramBuckets`: `number` (optional, default 50) - bin count
   *     for the returned histogram.
   * @returns `MonteCarloResult` with the full statistical summary,
   *   percentiles at the requested confidence level, and the histogram.
   *
   * @throws `Error` (not `RangeError` / `TypeError`) on invalid config:
   *   - `'Model function is required and must be a function'`
   *   - `'Assumptions must be an array'`
   *   - `'Iterations must be between 1 and 1,000,000'`
   *   - `'confidenceLevel must be between 0 and 1 (exclusive)'`
   *   - `'Invalid distribution: ' + type` (unknown `DistributionType`)
   *
   * @example
   * ```ts
   * const result = MonteCarloEngine.simulate({
   *   assumptions: [
   *     { name: 'revenue', distribution: 'normal',    mean: 1_000_000, stdDev: 100_000 },
   *     { name: 'cost',    distribution: 'lognormal', mu: 13.5, sigma: 0.2 },
   *   ],
   *   iterations: 10_000,
   *   confidenceLevel: 0.95,
   *   model: (i) => i.revenue - i.cost,
   *   seed: 12345,
   * });
   * console.log('P50 profit: $' + result.percentiles.P50.toLocaleString());
   * ```
   *
   * @see {@link MonteCarloEngine.generateCorrelatedSamples} in this file -
   *   the Cholesky-based sibling for correlated inputs
   * @see {@link MonteCarloWorker} in `src/workers/monte-carlo.worker.ts` -
   *   for > 100k iterations (offload to a Web Worker)
   * @see D-007 in `docs/STRATEGIC_DECISIONS_LOG.md` - the 7-phase audit
   *   pattern that produced this engine
   * @see DRAFT v0.2 - Mnemosyne 2026-06-13 (JSDoc P0, post Athena T-AT-003;
   *   DEFERRED per Athena §3.8 - to be re-applied in a later cycle)
   */
  static simulate(config: MonteCarloConfig): MonteCarloResult {'''


def gen_03():
    src = REPO / "src/engines/MonteCarloEngine.ts"
    content = src.read_text(encoding="utf-8")
    # Find v0.1 JSDoc + the static simulate line, replace with v0.2
    pat = (
        r"  /\*\*\n"
        r"   \* Run a general-purpose Monte Carlo simulation\.\n"
        r"   \*\n"
        r"   \* @param config - Simulation configuration\n"
        r"   \* @returns Full statistical results including confidence intervals and histogram\n"
        r"   \*/\n"
        r"  static simulate\(config: MonteCarloConfig\): MonteCarloResult \{"
    )
    m = re.search(pat, content)
    if not m:
        raise RuntimeError("03: v0.1 JSDoc + simulate() not found")
    new_content = content[:m.start()] + MONTE_SIMULATE_V2 + content[m.end():]
    new_path = STAGING / "MonteCarloEngine.ts.new"
    with open(new_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    patch = diff_u(src, new_path)
    new_path.unlink()
    if not patch:
        raise RuntimeError("03: diff was empty")
    write_patch(DRAFT_DIR / "03-monteCarloSimulate.patch", patch)
    return len(patch.splitlines())


# ── 04 CapExEngine.calculateIRR ──────────────────────────────────────────────
CAPEX_IRR_V2 = '''  /**
   * Internal Rate of Return for an arbitrary sequence of cash flows.
   *
   * The IRR is the discount rate `r` that makes the Net Present Value of
   * `cashFlows` equal to zero:
   *
   *   NPV(r) = sum_i cashFlows[i] / (1 + r)^i = 0
   *
   * We solve this by **Newton-Raphson** (NOT bisection), starting from
   * `irr = 0.1` (10% seed), with `maxIterations = 1000` and
   * `precision = 0.00001`. The per-iteration update is
   *   `nextIrr = irr - NPV(irr) / NPV'(irr)`.
   *
   * Convergence: the loop exits early (returning `irr`) when either
   *   - `Math.abs(NPV(irr)) < precision` (NPV is effectively zero), or
   *   - `Math.abs(nextIrr - irr) < precision` (the rate is stable).
   *
   * Failure modes (the loop has NO sign-change check, NO `Infinity` /
   * `NaN` input validation):
   *   - `cashFlows.length < 2`: returns **`0`** (NOT `NaN`). The function
   *     silently treats single-element sequences as "no IRR to compute"
   *     rather than throwing - the caller is expected to pre-validate.
   *   - `NPV'(irr) === 0` (the derivative is flat at the current rate):
   *     returns **`NaN`** from the `0/0` division. The loop does not
   *     recover; the caller must guard against this.
   *   - `maxIterations` (1000) reached without convergence: returns the
   *     **`irr` from the last iteration**. The result may be far from the
   *     true root - caller is expected to check that
   *     `Math.abs(NPV(result))` is small.
   *   - `Infinity` / `NaN` entries in `cashFlows` propagate through
   *     `calculateNPV` to give `NaN` / `Infinity` results. There is NO
   *     guard.
   *
   * **What this method does NOT do**:
   *   - It does **not** handle the **Modified IRR (MIRR)** case. For MIRR
   *     (which requires explicit finance rate + reinvestment rate) use
   *     `CapExEngine.calculateMIRR` (separate static method).
   *   - It does **not** return a confidence interval. Use
   *     `MonteCarloEngine.simulate` with `model: (i) =>
   *     CapExEngine.calculateIRR(i.cashFlows)` to get a probabilistic IRR
   *     distribution.
   *
   * @param cashFlows - Array of cash flows ordered by period. **By
   *   convention, index 0 is the initial outflow** (negative or zero) and
   *   subsequent indices are inflows. Example: `[-100_000, 30_000, 40_000,
   *   50_000]` represents a $100k investment that returns $30k / $40k /
   *   $50k.
   * @returns The discount rate `r` that zeroes the NPV, expressed as a
   *   **decimal** (e.g. `0.18` means 18% IRR, NOT 18). Returns:
   *   - `0` when `cashFlows.length < 2`
   *   - `NaN` when `NPV'(irr)` is exactly 0
   *   - the last `irr` value when `maxIterations` is reached
   *
   * @example
   * ```ts
   * const irr = CapExEngine.calculateIRR([-100_000, 30_000, 40_000, 50_000]);
   * // irr ~= 0.0975  ->  9.75% IRR
   *
   * // Caller should verify the result is usable:
   * if (!Number.isFinite(irr) || irr <= -1) {
   *   throw new Error('IRR did not converge: ' + irr);
   * }
   * ```
   *
   * @see {@link CapExEngine.calculateNPV} - the NPV function Newton iterates against
   * @see {@link CapExEngine.calculateNPVDerivative} - the NPV' derivative
   * @see {@link CapExEngine.calculateMIRR} - for MIRR (reinvestment-rate-aware)
   * @see DRAFT v0.2 - Mnemosyne 2026-06-13 (JSDoc P0, post Athena T-AT-003;
   *   DEFERRED per Athena §4.6 - to be re-applied in a later cycle)
   */
  static calculateIRR(cashFlows: number[]): number {'''


def gen_04():
    # Patch 04 - check if v0.1 JSDoc exists; if not, just add the new JSDoc
    src = REPO / "src/engines/CapExEngine.ts"
    content = src.read_text(encoding="utf-8")
    # Anchor: `  static calculateIRR(cashFlows: number[]): number {`
    # v0.1 may or may not have a JSDoc; handle both
    pat_with_v01 = (
        r"  /\*\*\n"
        r"   \* Calculate the Internal Rate of Return[^\n]*\n"
        r"(?:   \*[^\n]*\n)*?"
        r"   \*/\n"
        r"  static calculateIRR\(cashFlows: number\[\]\): number \{"
    )
    m = re.search(pat_with_v01, content)
    if m:
        new_content = content[:m.start()] + CAPEX_IRR_V2 + content[m.end():]
    else:
        # No v0.1 - just prepend JSDoc
        pat_no_v01 = r"  static calculateIRR\(cashFlows: number\[\]\): number \{"
        m = re.search(pat_no_v01, content)
        if not m:
            raise RuntimeError("04: calculateIRR anchor not found")
        new_content = content[:m.start()] + CAPEX_IRR_V2 + content[m.end():]
    new_path = STAGING / "CapExEngine.ts.new"
    with open(new_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    patch = diff_u(src, new_path)
    new_path.unlink()
    if not patch:
        raise RuntimeError("04: diff was empty")
    write_patch(DRAFT_DIR / "04-capExIRR.patch", patch)
    return len(patch.splitlines())


# ── 05 CubeEngine class ──────────────────────────────────────────────────────
CUBE_ENGINE_V2 = '''/**
 * CubeEngine - the in-memory OLAP-style aggregation engine that powers every
 * cross-tab / "cube view" in FinPlan Pro (revenue by entity x quarter x
 * product line, headcount by department x location, etc.).
 *
 * **Storage model.** Each cell is stored in a `Map<string, CubeCell>` keyed
 * by `"cubeId:dim1:dim2:..."` (see `CubeEngine.ts:32-34`). The class
 * maintains secondary indexes for fast lookup:
 *   - `cellCubeIndex` - reverse index from `cellKey` to `cubeId`
 *   - `cubeCellIndex` - forward index from `cubeId` to `Set<cellKey>`
 *   - `memberChildrenIndex` - dimension-member hierarchy cache
 * (See `CubeEngine.ts:43-47`.)
 *
 * **Singleton instance.** This class is exported as both the class
 * (for typing / extension) and a pre-constructed singleton
 * `cubeEngine` (for direct use). Most callers should use the singleton.
 *
 * **Constructor.** No explicit constructor; the class uses class-field
 * initializers (the `cells` Map and the indexes). `new CubeEngine()` is
 * valid and gives you a fresh, empty engine.
 *
 * **Method surface** (the operations that exist on this class; this is the
 * exhaustive public API):
 *   - Dimensions: `registerDimension(dim)`, `getDimension(id)`,
 *     `listDimensions()`.
 *   - Members: `addMember(dimId, member)`, `getMember(dimId, memberId)`,
 *     `getMembers(dimId)`, `getLeafMembers(dimId)`,
 *     `getAncestors(dimId, memberId)`, `getDescendants(dimId, memberId)`.
 *   - Cubes: `registerCube(meta)`, `getCube(id)`, `listCubes()`.
 *   - Cells: `writeCell(key, cell)` (async, debounced), `readCell(key)`,
 *     `getCellValue(key)`, `deleteCell(key)`, `getCellHistory(key)`.
 *   - Queries: `query(q: CubeQuery)` - the canonical slice/dice/roll-up
 *     primitive. `slice()` and `dice()` do NOT exist as methods - use
 *     `query({ cubeId, coordinates, measures, filters })` instead.
 *   - Aggregation: `aggregate(cube, coords, measure, aggregation)` returns
 *     `number | null`. Supported aggregations: `sum`, `avg`, `min`, `max`,
 *     `count`.
 *   - Snapshots: `createSnapshot(cubeId)`, `restoreSnapshot(snapshotId)`,
 *     `listSnapshots(cubeId)`.
 *   - Stats: `getStats()` returns cell / dimension / cube counts.
 *
 * **What this class does NOT do**:
 *   - It does **not** talk to the database / Tauri store. It operates on
 *     in-memory Maps. Data ingestion is the responsibility of the
 *     `CubeLoader` (`src/loaders/CubeLoader.ts`) which reads from the
 *     encrypted masterStorage and constructs Cube records.
 *   - It does **not** render the cube. That's the UI layer's job
 *     (`PivotTable.tsx`, `CubeChart.tsx`).
 *   - It does **not** cache query results. Every call to `query()` /
 *     `aggregate()` re-traverses the source cells.
 *   - It does **not** know about user identity / multi-entity scoping.
 *     Filtering by entity is a `filters` clause in `query()`.
 *
 * @example
 * ```ts
 * import { cubeEngine } from '@/engines/CubeEngine';
 *
 * // Register a cube
 * cubeEngine.registerCube({
 *   id: 'revenue',
 *   dimensions: ['entity', 'quarter', 'product'],
 *   measures: ['revenue', 'cogs'],
 * });
 *
 * // Write a cell
 * await cubeEngine.writeCell('revenue:e1:q1:p7', {
 *   cubeId: 'revenue',
 *   coordinates: { entity: 'e1', quarter: 'q1', product: 'p7' },
 *   measures: { revenue: 100_000, cogs: 60_000 },
 *   timestamp: Date.now(),
 *   source: 'manual',
 * });
 *
 * // Query: aggregate revenue across all products for entity e1 in q1
 * const q1Revenue = cubeEngine.aggregate(
 *   cubeEngine.getCube('revenue')!,
 *   { entity: 'e1', quarter: 'q1' },
 *   'revenue',
 *   'sum',
 * );
 * ```
 *
 * @see {@link CubeLoader} in `src/loaders/CubeLoader.ts` - the data ingest path
 * @see ADR-003 in `docs/drafts/adr/ADR-003-olap-cube.md` - why in-memory cubes
 *      are the right data model for cross-tab FP&A workflows
 * @see DRAFT v0.2 - Mnemosyne 2026-06-13 (JSDoc P0, post Athena T-AT-003;
 *   DEFERRED per Athena §5.7 - to be re-applied in a later cycle, per the
 *   Option A rewrite-to-match-current-API recommendation)
 */
export class CubeEngine {'''


def gen_05():
    src = REPO / "src/engines/CubeEngine.ts"
    content = src.read_text(encoding="utf-8")
    # v0.1 might have a shorter JSDoc; look for any JSDoc right before `export class CubeEngine`
    pat = (
        r"/\*\*\n"
        r" \* CubeEngine[^\n]*\n"
        r"(?: \*[^\n]*\n)*?"
        r" \*/\n"
        r"export class CubeEngine \{"
    )
    m = re.search(pat, content, flags=re.MULTILINE)
    if not m:
        # No v0.1 - check if there's a `export class CubeEngine {` without JSDoc
        if "export class CubeEngine {" in content:
            anchor = "export class CubeEngine {"
            new_content = content.replace(anchor, CUBE_ENGINE_V2, 1)
        else:
            raise RuntimeError("05: CubeEngine class anchor not found")
    else:
        new_content = content[:m.start()] + CUBE_ENGINE_V2 + content[m.end():]
    new_path = STAGING / "CubeEngine.ts.new"
    with open(new_path, "w", encoding="utf-8", newline="") as f:
        f.write(new_content)
    patch = diff_u(src, new_path)
    new_path.unlink()
    if not patch:
        raise RuntimeError("05: diff was empty")
    write_patch(DRAFT_DIR / "05-cubeEngine.patch", patch)
    return len(patch.splitlines())


def main():
    funcs = [
        ("01-useAuth",            gen_01),
        ("02-masterStorage",      gen_02),
        ("03-monteCarloSimulate", gen_03),
        ("04-capExIRR",           gen_04),
        ("05-cubeEngine",         gen_05),
    ]
    log("=== PATCH GENERATION (v0.2) - handles v0.1 already applied ===")
    results = []
    for name, fn in funcs:
        try:
            lines = fn()
            log(f"  [OK]   {name:30s}  {lines:4d} lines")
            results.append((name, lines, "OK"))
        except Exception as e:
            log(f"  [FAIL] {name:30s}  {e}")
            results.append((name, 0, str(e)))
    log("=== SUMMARY ===")
    total = 0
    ok = 0
    for name, lines, status in results:
        log(f"  {name:30s}  {lines:4d} lines  {status}")
        total += lines
        if status == "OK":
            ok += 1
    log(f"  {'TOTAL':30s}  {total:4d} lines  ({ok}/5 OK)")
    _log_fh.close()
    return 0 if ok == 5 else 1


if __name__ == "__main__":
    sys.exit(main())
