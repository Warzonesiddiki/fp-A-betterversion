# FinPlan Pro — Agent Handbook (entry point)

> **Read this file first, every session.** It is the single authoritative
> instruction set for any human or AI agent working in this repository.
> `CLAUDE.md` and `GEMINI.md` only point here. If anything else in the repo
> contradicts this file or `docs/agent/`, this file wins — and the
> contradiction is a bug to be fixed, not a choice to be made.

Last verified against the tree: **2026-10-15**, branch
`arena/48b4e481-fp-a-betterversion`. Every number below is produced by a
script named next to it; do not update a number by hand.

---

## 1. What this project is (in one minute)

- **Product:** a desktop FP&A workspace (React 19 + TypeScript strict + Vite 8
  - Tailwind 4 + Zustand/Immer, Tauri 2 shell). Package name `finplan-pro`.
- **Owner's real workflow (the thing we must serve first):** each month the
  owner exports a General Ledger dump from **Microsoft Dynamics 365**, does
  FP&A work on it, and highlights abnormalities and potentially wrong entries.
- **Current truth:** the codebase is very wide (206 routes, 46 stores, ~200
  engines) and shallow where it matters. Imports gained idempotency,
  provenance and control totals on 2026-10-15; there is still **no D365
  export contract, no exception catalogue, no answer key, no disposition
  workflow, no relational store of record, and the desktop build cannot sign
  in offline.** Details: `docs/agent/09_KNOWN_GAPS.md`.
- **Plan of record:** `docs/discovery/` (requirements register, risk
  register, decision log, gated roadmap) + `docs/audit/` (the measured
  audit). Everything else under `docs/`, the root `*_PROMPT*.md`, `PLAN.md`,
  `MASTER_ROADMAP.md`, `_bmad/`, `agents/`, `plan/`, `prompt/` is **historical**
  and must not be treated as instructions (see `docs/agent/00_INDEX.md`).

## 2. Non-negotiable rules (the short list)

Full rationale and examples: `docs/agent/04_ENGINEERING_RULES.md`.

1. **Measured, or not stated.** No claim in any document, commit message,
   PR, or chat summary without the command that produced it. "Tests pass"
   means you ran them in this tree and can paste the tally.
2. **Nothing is done without evidence.** Done = code + tests that fail
   without the change + gates green + docs updated in the same commit.
   Stubs, mocks, TODOs and "wired later" are not done and must say so.
3. **Money goes through one primitive.** `src/utils/money.ts`
   (decimal.js). Never add float arithmetic on amounts. `npm run money:ast`
   must stay at 0 unsafe ops; `npm run money:adoption` must not fall.
4. **Deterministic.** Time comes from `src/utils/clock.ts` (`now()`,
   `nowISO()`, `nowMs()`, `todayISO()`), never `new Date()` / `Date.now()` in engines, stores,
   services, utils. Randomness is injected and seeded.
   `npm run determinism:ratchet` must not rise for any file.
5. **Nothing silently discarded.** Every rejected import row has a row
   number, a code and a reason; every batch has a content hash, a batch id
   and control totals; every entry has provenance. (`importGLData` contract.)
6. **Missing ≠ zero.** Never render a KPI from absent inputs as 0 or a
   default. Say "not in file" / "unavailable" and why.
7. **A potential exception is never an error.** Flags are review candidates
   with a rule id and evidence; only a human disposition makes them wrong.
8. **No new surface before the spine works.** No new routes, pages,
   engines, stores, sector packs or connectors until Gate 2 of
   `docs/discovery/roadmap.md` is green. Wire or delete; do not add.
9. **No egress by default.** No network calls, telemetry, or AI provider
   calls unless behind an explicit allow-listed, user-initiated path. The
   existing Sentry/PWA/LLM paths are gated by `VITE_*` flags that default off.
10. **Do not weaken a gate to pass it.** No skipping tests, lowering bars,
    editing baselines upward, adding `eslint-disable`, `as any`, or
    `@ts-expect-error` to make something green. Fix the cause or stop and
    report.
11. **One source of truth per fact.** If a number/rule lives in two places,
    delete one or make a script assert equality.
12. **Owner decisions are not yours.** DEC-001…DEC-006 in
    `docs/discovery/decision-log.md` are open. Implement around them, never
    through them. If blocked, say exactly which decision blocks you.

## 3. Session protocol

```text
START   read AGENTS.md → docs/agent/00_INDEX.md → docs/agent/09_KNOWN_GAPS.md
        git status; git log --oneline -5; npm ci --ignore-scripts (if node_modules missing)
        npm run tsc && npm run lint        (≈ 45 s + 2 min; must be clean before you touch anything)
WORK    one item per commit; tests first or alongside; run the narrowest relevant
        test files after each change; run every ratchet you could have moved
END     npm run check (or the subset you can justify) → paste tallies →
        update docs in the same commit → handover per docs/agent/HANDOVER_TEMPLATE.md
```

Branch rules for Arena sessions: work only on the session branch, commit and
push there, never create or switch branches. CI workflows under
`.github/workflows/**` cannot be modified from an agent session (GitHub App
lacks the `workflows` permission) — deliver CI changes as patches in
`ci-patches/` for a human.

## 4. Commands you will actually use

| Command                                       | Purpose                                                                   | Typical time    |
| --------------------------------------------- | ------------------------------------------------------------------------- | --------------- |
| `npm ci --ignore-scripts`                     | install from lockfile (root); also `cd server && npm ci --ignore-scripts` | 1–2 min         |
| `npm run tsc`                                 | type check                                                                | ~45 s           |
| `npm run lint`                                | ESLint, zero warnings                                                     | ~2 min          |
| `npm run format:check` / `format`             | Prettier on `src/**`                                                      | seconds         |
| `npx vitest run <file-or-dir>`                | targeted tests (preferred inner loop)                                     | seconds–minutes |
| `npm run test:sharded`                        | full suite in 8 shards (use on < 8 GB RAM)                                | ~30 min         |
| `npm run test`                                | full suite in one process (needs 8 GB heap)                               | ~20 min         |
| `cd server && npm test`                       | server suite                                                              | ~1 min          |
| `npm run docs:verify`                         | README numbers, persistence map, schema homes                             | seconds         |
| `npm run money:ast` / `money:adoption`        | money ratchets                                                            | ~30 s           |
| `npm run determinism:ratchet`                 | wall-clock/random ratchet (`--list`, `--update`)                          | seconds         |
| `npm run engines:verify`                      | engine manifest current                                                   | seconds         |
| `node scripts/verify-readme-stats.mjs --list` | reachable vs orphan engines                                               | seconds         |
| `npm run check`                               | the whole gate, honest exit code                                          | ~35 min         |

Everything else in `package.json` is documented in
`docs/agent/05_COMMANDS_AND_GATES.md`.

## 5. Where things live

```text
src/main.tsx → src/App.tsx          all routes (206 <Route>, 182 React.lazy)
src/pages/        route pages by domain          src/store/      46 Zustand stores (persist+immer)
src/engines/      pure calculation modules       src/services/   import, export, connectors, api sdk
src/components/ui 122 primitives (barrel index)  src/utils/      money.ts, clock.ts, sha256.ts, storage
src/types/index.ts domain types (GLEntry etc.)   src/test/setup.ts global test mocks (lucide, sql.js)
src-tauri/        Rust shell + 35-table SQLite migrations (client never writes them)
server/           Express + SQLite API (JWT/RBAC) — no frontend caller, not bundled
scripts/          every gate and generator      docs/agent/     this handbook
docs/discovery/   plan of record                docs/audit/     measured audit 2026-10-15
```

Architecture detail and dependency direction: `docs/agent/02_ARCHITECTURE.md`.
Domain rules the code must enforce: `docs/agent/03_DOMAIN_RULES.md`.
Data model and persistence truth: `docs/agent/08_DATA_MODEL.md`.
Testing conventions: `docs/agent/06_TESTING.md`.
Definition of done, commit format, handover: `docs/agent/07_WORKFLOW_AND_DOD.md`.

## 6. Things that will bite you (learned the hard way)

- `node_modules` is not snapshotted in Arena sandboxes; if `npx tsc` suddenly
  "isn't the tsc you're looking for", run `npm ci --ignore-scripts`.
- `npm audit fix --omit=dev` prunes dev deps; always follow with `npm install`.
- Prettier 3 ships `prettier.cjs`, not `prettier.js`.
- `lucide-react` is mocked globally in `src/test/setup.ts` with an enumerated
  icon list. Never hand-mock it per test file; add new icons to the global mock.
- Tests that depend on "today" rot. Pin with `setClock()` from
  `src/utils/clock.ts` and make fixtures relative to the pinned instant.
- The store enforces **double-entry balance per journal batch** in
  `validateEntries`. Unbalanced fixtures fail import with
  `FP-0002`-style messages — balance your test journals.
- Entry ids derive from the batch id, not the millisecond clock; two batches
  in the same instant must never share ids (it broke `undoLastImport` once).
- `docs:verify` fails if README numbers drift from the tree. Update the
  README from the script output, not from memory.
- The uploaded planning docs contain curly quotes; exact-string patching
  with ASCII quotes silently misses.

## 7. If you are unsure

Stop and ask the owner with a concrete question that names the decision
(e.g. "DEC-005: blob store or relational SQLite?"). Do not pick for them and
do not leave it implicit in code. Record the answer in
`docs/discovery/decision-log.md` before building on it.
