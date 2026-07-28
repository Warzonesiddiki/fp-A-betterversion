# v1.0 Session Status — 2026-07-27

Continuation session against the handover prompt. Summary of what was
verified, what was fixed, and what genuinely remains.

## Sandbox constraints (why P1/P2 were not executed)

Two priorities could not be run here, and neither is a code problem:

| Priority                     | Blocker                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| P1 Tauri desktop build       | No Rust toolchain (`cargo`/`rustc` absent) and no network to install one   |
| P2 Playwright E2E            | Browser download from `cdn.playwright.dev` fails (`ECONNRESET`); apt fonts unavailable |

Both need an environment with a Rust toolchain and outbound network. The
Playwright specs and `src-tauri/` were left untouched.

## Fixed this session

Running the previously-unexecuted benchmark suite (P3) surfaced defects that
also affect production. These were real bugs, not test noise.

### Export was broken end to end

`ExportEngine`, `ProfessionalExportEngine`, and `ExportTemplateEngine` all read
a `window.jsPDF` global that nothing in the app ever assigned, so **all 43 PDF
export call sites threw** `"jsPDF not loaded"`. `exportToExcel` had the same
problem with `window.XLSX`. Separately, all three engines call
`doc.autoTable(...)`, but `jspdf-autotable` was never a dependency.

- Added `src/utils/pdfRuntime.ts` — dynamically imports the bundled jsPDF and
  applies the autoTable plugin, memoized and de-duplicated. A host-injected
  `window.jsPDF` still wins, so existing test doubles keep working.
- Installed `jspdf-autotable`.
- `exportToExcel` now delegates to the working ExcelJS implementation.
- The PDF entry points became async; the 70 fire-and-forget call sites now
  attach `.catch(reportExportFailure)` (`src/utils/exportErrorHandler.ts`)
  so a failed export is logged rather than becoming an unhandled rejection.
- jsPDF stays in the lazy `pdf-vendor` chunk (179KB gzip, unchanged).

### Large saves silently failed

`masterStorage.encryptStorageValue` used
`btoa(String.fromCharCode(...combined))`, which spreads every ciphertext byte
as a function argument and throws `RangeError: Maximum call stack size
exceeded` past roughly 100KB. A 10K-row GL import is ~5.6MB, so **any
realistically sized store failed to persist**. Now chunk-encoded, with a
regression test at `src/utils/__tests__/masterStorageEncoding.test.ts`.

### AI classification race

`AIEngine.init()` had no in-flight guard. `detectAnomalies` classifies a batch
with `Promise.all`, so every entry in the first batch called `init()` before
any had assigned `classifier` — each starting its own model load, and the
racing loads failing with `"All devices failed to initialize classifier"`.
Added an `initPromise` guard. The bench went from a 6s failure to 2.79ms.

### sql.js WASM fetched cross-origin

`sqlJsStorage` loaded its WASM from `https://sql.js.org/dist/`, which our own
CSP (`default-src 'self'`) blocks and which defeats the offline/desktop story.
Now resolved from the bundled dependency and emitted same-origin
(`dist/assets/sql-wasm-*.wasm`).

### isTauri crashed outside the main thread

`isTauri()` dereferenced `window` unguarded, throwing `ReferenceError` in Web
Workers and Node contexts instead of reporting "not Tauri".

## Priority 4 — Security

- **CSP hash was stale.** `script-src` whitelisted a sha256 that did not match
  the inline theme bootstrap, so the bootstrap was **blocked in production**.
  Corrected to the real hash, dropped the unused Google Fonts origins, and
  added `scripts/csp-hash-check.js` so the hash cannot drift again silently.
  Verified against both `index.html` and the build output.
- **`npm audit`: 25 → 6.** The 6 remaining have no non-breaking fix:
  `sharp` / `onnxruntime-node` / `adm-zip` come via
  `@huggingface/transformers`, and `react-router` has no patched release in
  the 7.x line (the advisory is RSC-mode CSRF; this app does not use RSC).
  A blanket `brace-expansion@5` override was tried and reverted — it breaks
  minimatch v3's CommonJS import and takes ESLint down with it.
- **NIM key confirmed absent from the bundle.** The existing PROD guard in
  `src/services/nim.ts` is sound; scanned `dist/` to be sure.
- `style-src 'unsafe-inline'` is **still present** — see below.

## Not done, and why

### `noUnusedLocals` / `noUnusedParameters`

Enabling both yields **449 errors** (427 `TS6133`, 18 `TS6196`, 4 `TS6192`)
across roughly 200 files. Auto-stripping unused symbols at that scale risks
deleting something load-bearing (side-effecting imports, intentionally-unused
API parameters) and cannot be safely reviewed in one pass. It should be a
dedicated PR, ideally directory by directory. The flags remain `false`.

### `style-src 'unsafe-inline'`

Removing it needs nonces, which needs a server or a build-time transform to
inject a per-response nonce. This app is served statically, and a `<meta>` CSP
cannot carry a per-request nonce — so this needs the hosting story decided
first. The `script-src` side is now hash-based and nonce-free, which is the
higher-value half.

### Full `npm test`

The full suite (895 files) exceeds this sandbox's per-command time budget. I
ran **1,360 tests across every file touched** (plus the whole `src/utils`,
`src/hooks`, `src/workers`, and export/AI engines) — all green. Two
pre-existing failures in `SafeMathParser.test.ts` and `MultiBookEngine.test.ts`
were confirmed present on `main` before my changes and are untouched.

## Priority 5 — Docs

Archived the 145 codif process artifacts to `docs/_archive/codif/` — the path
`eslint.config.js` already ignores — via `git mv`, so `git log --follow` still
works. Added `docs/_archive/README.md` pointing at the maintained set.

## Gate status

| Gate                          | Result                                   |
| ----------------------------- | ---------------------------------------- |
| `npx tsc --noEmit`            | 0 errors                                 |
| `npm run lint`                | 0 errors, 12 warnings (all pre-existing) |
| `npm run build`               | passes, ~4s                              |
| `node scripts/bundle-check.js`| passes (main chunk within limit)         |
| `node scripts/csp-hash-check.js` | passes (source + dist)                |
| `npm run test:bench`          | **13/13 files, 59/59 tests** (was 3 failing) |

## Suggested next steps

1. Run P1/P2 on a machine with Rust + network — these are the last unverified
   areas and the Tauri shell has never been built end to end.
2. Land `noUnusedLocals` incrementally, one directory per PR.
3. Decide the hosting model, then remove `style-src 'unsafe-inline'` with
   nonces.
4. Consider pinning `@huggingface/transformers` behind a lazy boundary or
   dropping it if the sharp/onnxruntime advisories matter for your threat
   model — it is the source of 5 of the 6 remaining vulnerabilities.
