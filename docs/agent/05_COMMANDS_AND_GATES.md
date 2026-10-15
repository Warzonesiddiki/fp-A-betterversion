# 05 — Commands and gates

All scripts are invoked as `node node_modules/<tool>/…` in `package.json`
so they work without global installs. Times are from a 2 vCPU / 3.8 GB
sandbox; a laptop is faster.

## Setup

```bash
npm ci --ignore-scripts             # root (837 packages); --ignore-scripts skips husky install
cd server && npm ci --ignore-scripts && cd ..
# If you want the git hooks: npx husky   (pre-commit = eslint/tsc/prettier on staged + secret scan)
```

No Rust toolchain → `npm run tauri:*` will not work in the sandbox.

## Inner loop

| Command                             | What                                | Notes                                                                                         |
| ----------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run tsc`                       | `tsc --noEmit` whole project        | ~45 s; **do not** use `npx tsc` without node_modules — npx fetches an unrelated `tsc` package |
| `npm run lint`                      | `eslint src --max-warnings 0`       | ~2 min; warnings fail                                                                         |
| `npm run lint:fix`                  | same with `--fix`                   | mutates files                                                                                 |
| `npm run format` / `format:check`   | Prettier `src/**/*.{ts,tsx,css,md}` | docs outside `src/` are not formatted by this                                                 |
| `npx vitest run <paths>`            | targeted tests                      | add `NODE_OPTIONS=--max-old-space-size=3000` for > 200 files                                  |
| `npx vitest run <file> -t "<name>"` | one test                            | —                                                                                             |
| `npm run dev`                       | Vite :5173 (strictPort)             | renders `null` outside Tauri — use for proxy/debug only                                       |

## Full test runs

| Command                                             | What                                                                     | Memory / time                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `npm run test:sharded`                              | `scripts/test-sharded.mjs` (defaults: 8 shards, 2 workers, 2800 MB heap) | in a 3.8 GB sandbox use `--workers=1 --heap=2200`; ~30 min; prints per-shard PASS/FAIL; honest exit code |
| `node scripts/test-sharded.mjs --shards=8 --only=3` | one shard                                                                | ~4 min                                                                                                   |
| `npm test`                                          | single vitest process                                                    | needs 8 GB heap                                                                                          |
| `cd server && npm test`                             | server suite (32 files / 323 tests)                                      | ~1 min                                                                                                   |
| `npm run test:e2e`                                  | Playwright, Chromium, auto-starts dev server                             | **shims Tauri**; not evidence for the desktop shell                                                      |
| `npm run test:a11y`                                 | the `*.a11y.test.tsx` subset                                             | —                                                                                                        |
| `npm run test:bench`                                | benchmarks (`vitest.bench.config.ts`)                                    | not part of `check`                                                                                      |
| `npm run financial:oracles`                         | `src/engines/__tests__/financialStatementOracles.test.ts`                | the statement oracle set                                                                                 |

Measured on 2026-10-15 after fixes: **8/8 shards green, 1,318 frontend test
files; server 32/32.** Re-measure; do not quote stale tallies.

## Truth and ratchet gates

| Command                                                                      | Measures                                                                                                                                                  | Baseline / how to move it                                                                                        |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run docs:verify`                                                        | README headline numbers vs tree (`verify-readme-stats.mjs`), persistence map vs `persist()` keys and authority registry, schema equality on shared tables | fix the README from the script's output; `--list` shows reachable/orphan engines                                 |
| `npm run engines:verify`                                                     | `src/engines/manifest.generated.*` matches the tree                                                                                                       | `npm run engines:manifest` regenerates                                                                           |
| `npm run money:ast` (`:list`)                                                | AST scan for unsafe arithmetic on money-named values                                                                                                      | `scripts/money-ast-baseline.json`; must stay 0; suppress only with `@money-ast-allow Reason:` for non-money math |
| `npm run money:adoption`                                                     | % of financial modules importing `@/utils/money` (28.89 %)                                                                                                | `scripts/money-adoption-baseline.json`; must not fall                                                            |
| `npm run determinism:ratchet` (`--list`, `--update`)                         | `new Date()` / `Date.now()` / `Math.random()` per file in engines/store/services/utils                                                                    | `scripts/determinism-baseline.json` (638 sites / 160 files); `--update` only after lowering                      |
| `npm run type-safety:ratchet`                                                | `as any` / `as unknown as` / ts-ignore in financial paths                                                                                                 | `scripts/type-safety-baseline.json` (116)                                                                        |
| `npm run escape:ledger`                                                      | `eslint-disable` inventory                                                                                                                                | ledger must not grow                                                                                             |
| `npm run fabrication:audit` (`node scripts/fabrication-detector.mjs --list`) | hard-coded figures presented as data                                                                                                                      | `scripts/fabrication-baseline.json`; scanner is scope-limited — a clean result is not proof                      |
| `npm run mock-data:audit`                                                    | pages rendering `MOCK_*` constants                                                                                                                        | —                                                                                                                |
| `npm run routemap:check`                                                     | `docs/product/ROUTE_MAP.md` current                                                                                                                       | `node scripts/generate-route-map.js` regenerates                                                                 |
| `npm run capability:inventory`                                               | regenerates `docs/CAPABILITY_TRUTH_MATRIX.md` (static evidence per route)                                                                                 | regenerate after wiring anything                                                                                 |
| `npm run architecture:guardrails`                                            | money in engines, layer imports                                                                                                                           | not in `check`; run when touching imports                                                                        |
| `npm run export:verify`                                                      | CSV formula-injection guard and export fidelity checks                                                                                                    | —                                                                                                                |
| `npm run license:check`                                                      | production dependency licences (rejects GPL/AGPL/SSPL/BUSL/unlicensed)                                                                                    | run when touching deps                                                                                           |
| `npm run audit:prod`                                                         | `npm audit --omit=dev --audit-level=high`                                                                                                                 | 0 at root and server as of `aa1812e`                                                                             |
| `npm run bundle-check`                                                       | after `vite build`: main ≤ 150 KB gzip, total JS ≤ 2048 KB gzip, lazy vendors ≤ 300 KB each                                                               | warns at 90 %                                                                                                    |
| `npm run repo:hygiene`                                                       | stray files at root etc.                                                                                                                                  | —                                                                                                                |
| `npm run release:dry-run`, `compliance:evidence`, `sbom`                     | release artefacts                                                                                                                                         | not needed for feature work                                                                                      |

## The whole gate

```bash
npm run check
# = tsc → lint → format:check → docs:verify → engines:verify → money:ast
#   → determinism:ratchet → fabrication:audit → test:sharded
```

Exit code is honest (first failure stops). ~35 min in the sandbox. If you
cannot afford it, run every gate _you could have moved_ plus targeted tests,
and say so in the handover.

## CI (GitHub Actions)

Workflows: `ci.yml` (typecheck, lint, test matrix, test-merge, build, e2e,
server), `tsc.yml`, `lint.yml`, `test-unit.yml`, `build.yml`, `deploy.yml`,
`release.yml`, `sentry-self-test.yml`, `cascade-hold-check.yml`.

- **Agents cannot edit `.github/workflows/**`** (GitHub App lacks `workflows`
  permission). Put a unified diff in `ci-patches/NNNN-*.patch` with a header
  comment explaining what it does and how to verify, and list it in
  `ci-patches/README.md`. Until a human applies it and a green run is
  observed, the gate is `config_written_but_not_enforced`.
- Known: `main` CI has failed since 2026-08-20; the E2E job lacks
  `timeout-minutes` and has run for 6 h. Patch pending.
- Job logs cannot be downloaded from the sandbox; use `gh run view` for
  status and reproduce locally.

## Updating a baseline (the only allowed direction is down)

```bash
npm run determinism:ratchet        # shows "now N — k fewer. Run --update"
node scripts/determinism-ratchet.mjs --update   # refuses if any file got worse
git add scripts/determinism-baseline.json
```

Same pattern for `money-ast`, `money-adoption`, `type-safety`. Never edit
the JSON by hand. Mention the before/after numbers in the commit body.
