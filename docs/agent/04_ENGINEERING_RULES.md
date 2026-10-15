# 04 — Engineering rules (with the reason and the gate)

Every rule names the gate that enforces it. If a rule has no gate yet,
adding one is a valid, welcome unit of work.

## A. Truth and evidence

| Rule                                                                                                 | Why                                                               | Gate                                  |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| Numbers in docs come from scripts; name the script next to the number                                | README claimed 14,835/100 % green while 14 tests failed for weeks | `npm run docs:verify`                 |
| Never write "done", "complete", "shipped", "100 %" without a command + tally in the same message     | the predecessor repos died of claimed-done drift                  | review; `fabrication:audit` (partial) |
| A stub, mock-only path, TODO, or "wire later" is reported as **not done** and listed in the handover | —                                                                 | review                                |
| Native (Rust/Tauri) changes are reported `NATIVE-UNVERIFIED` from the sandbox                        | no Rust toolchain here                                            | review                                |

## B. Money (see 03 for the domain side)

| Rule                                                                                                                             | Gate                                        |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Import `@/utils/money`; no `+ - * /` on anything named/typed as an amount outside it                                             | `money:ast` (baseline 0; an increase fails) |
| New or touched financial module ships a `*.money.test.ts` with exact expected values that a float implementation would fail      | review; `money:adoption` must not fall      |
| `@money-ast-allow Reason: …` file-level suppressions require a real reason (ratios, indices, pixel geometry) — never for amounts | review                                      |

## C. Determinism

| Rule                                                                                                                     | Gate                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `now()` / `todayISO()` from `src/utils/clock.ts`; no `new Date()` / `Date.now()` in `src/{engines,store,services,utils}` | `determinism:ratchet` (per-file; `--update` refuses regressions) |
| No `Math.random()` in those paths; seeded generators injected via parameters                                             | same                                                             |
| Ids derive from content (hash) or from the injected clock, never from both the clock _and_ a random suffix               | review; provenance tests                                         |
| Iteration order over `Map`/`Set`/object keys that affects output must be made explicit (`sort`)                          | review                                                           |

## D. Scope discipline

| Rule                                                                                                                | Gate                                |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| No new route, page, engine, store, sector pack or connector until Gate 2 is green                                   | review; `engines:verify` (manifest) |
| Touching an orphan engine means wiring it to a caller with a test or leaving it alone — never "improving" dead code | `verify-readme-stats.mjs --list`    |
| New dependency only with a removed dependency and a licence check                                                   | `license:check`, review             |

## E. Types and escapes

| Rule                                                                                             | Gate                  |
| ------------------------------------------------------------------------------------------------ | --------------------- |
| `as any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` must not increase in financial paths | `type-safety:ratchet` |
| `eslint-disable` comments must not increase; each one names the rule and a reason                | `escape:ledger`       |
| `strict` TypeScript stays on; no `skipLibCheck` games                                            | `tsc`                 |

## F. Tests (see 06)

| Rule                                                                                                                                             | Gate                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Tests are colocated: `X.test.ts(x)` next to `X.ts(x)`; deep behavioural tests `X.deep.test.tsx`; a11y `X.a11y.test.tsx`; money `X.money.test.ts` | vitest include globs                         |
| Use the global mocks in `src/test/setup.ts`; never re-mock `lucide-react` per file                                                               | review (a partial mock broke the suite once) |
| Pin time with `setClock`; restore in `afterEach`                                                                                                 | review                                       |
| A test that asserts a count of rendered elements must assert _which_ elements                                                                    | review                                       |
| No `it.skip`, `describe.skip`, `test.todo` left behind; no `--passWithNoTests`                                                                   | review                                       |

## G. UI

| Rule                                                                                                                             | Gate                                                   |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Every data screen implements the five states: loading, empty, error, partial/stale, success                                      | review (UX brief, `docs/discovery/ui-ux-discovery.md`) |
| Colour never the only signal; favourable/unfavourable also by sign/label/icon                                                    | `test:a11y` (partial)                                  |
| Migrated UI primitives use semantic tokens (`var(--…)`), no raw Tailwind palette and no `dark:`                                  | ESLint `no-restricted-syntax` on six primitives        |
| Currency via `useCurrencyFormatter()`; no local `formatCurrency`                                                                 | ESLint                                                 |
| Tables: `<caption>` (sr-only ok), `scope="col"`, numeric cells `tabular-nums` right-aligned                                      | a11y tests                                             |
| Interactive elements reachable by keyboard with visible focus                                                                    | a11y tests                                             |
| Never fabricate sample data into a production path; sample/demo data lives behind an explicit "load demo" action and is labelled | `mock-data:audit`, `fabrication:audit`                 |

## H. Persistence and state

| Rule                                                                                                                                     | Gate              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Stores use the required middleware order; `storage: masterStorage`; `partialize` to the persisted subset                                 | review            |
| Every persisted key is in `docs/architecture/PERSISTENCE_MAP.md` with a class (financial-truth, derived-cache, user-preference, session) | `persistence:map` |
| One store is authoritative per fact (`src/domain/persistenceAuthority.ts`)                                                               | `persistence:map` |
| Shape changes bump `version` and ship a `migrate` with a test                                                                            | review            |
| No `localStorage` / `sessionStorage` direct use for financial data                                                                       | review            |

## I. Security and egress

| Rule                                                                                                                                         | Gate                   |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| No network call outside `src/sdk` (REST) and the flagged Sentry/LLM paths; new egress needs an allow-list entry and a user-initiated trigger | review                 |
| No secrets in the tree; the pre-commit hook scans added lines                                                                                | `.husky/pre-commit`    |
| Encrypted-at-rest via `masterStorage`; never log amounts or PII at `info`                                                                    | review                 |
| Mock auth is refused in production builds — do not remove that guard                                                                         | `authStore` boot check |

## J. Generated files

| File                               | Generator                       | Rule                                                      |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `src/engines/manifest.generated.*` | `npm run engines:manifest`      | never hand-edit; `engines:verify` checks                  |
| `docs/product/ROUTE_MAP.md`        | `scripts/generate-route-map.js` | never hand-edit; `routemap:check`; excluded from Prettier |
| `docs/CAPABILITY_TRUTH_MATRIX.md`  | `npm run capability:inventory`  | regenerate, do not edit                                   |
| `scripts/*-baseline.json`          | each ratchet's `--update`       | only downward (or equal) changes                          |

## K. Git

| Rule                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------- |
| One logical change per commit; subject `type(scope): what` with a body that names the gates run and their tallies                |
| Never rewrite pushed history on the session branch                                                                               |
| Never touch `.github/workflows/**` from an agent; write a patch into `ci-patches/` with apply instructions                       |
| Do not commit `node_modules`, `dist`, `coverage`, `*.log`, lockfile backups, or generated reports except the ones listed in J    |
| Keep the branch pushable: run the pre-commit gates manually when hooks are not installed (`npm ci --ignore-scripts` skips husky) |

## L. Forbidden acts (absolute)

1. Inventing a contract (column names, error codes, API shapes) not in the
   plan of record or confirmed by the owner.
2. Presenting a stub, mock, or sample-data path as working.
3. Weakening or skipping a test, bar, ratchet, or baseline to get green.
4. Float arithmetic on money.
5. Hand-editing generated files or baselines upward.
6. Adding telemetry, analytics, or any network call by default.
7. Claiming a test run you did not perform in this tree.
8. Changing the spec/doc to match a code defect instead of fixing the code.
9. Starting new surface while a prior gate is red.
10. Resolving an owner decision (DEC-xxx) implicitly in code.
