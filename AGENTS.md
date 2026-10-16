# FinPlan Pro — Agent Handbook (entry point)

> **Read this file first, every session.** It is the single authoritative
> instruction set for any human or AI agent working in this repository.
> `CLAUDE.md` and `GEMINI.md` only point here.
>
> The documentation map is [`docs/README.md`](docs/README.md). The product goal
> is [`docs/VISION.md`](docs/VISION.md). If another document contradicts this
> file or `docs/agent/`, this file wins — and the contradiction is a bug to be
> fixed, not a choice to be made.

Last verified against the tree: **2026-10-16**. Every number below is produced
by a script named next to it; do not update a number by hand.

---

## 1. What this project is (in one minute)

- **Product:** an all-in-one FP&A workspace — a one-stop tool that carries a
  finance team from raw General Ledger data to reviewed, board-ready output.
  Desktop-first (Tauri 2 shell): React 19 + TypeScript strict + Vite 8 +
  Tailwind 4 + Zustand/Immer. Package name `finplan-pro`.
- **Owner's real workflow (the thing we must serve first):** each month the
  owner exports a General Ledger dump from **Microsoft Dynamics 365**, does
  FP&A work on it, and highlights abnormalities and potentially wrong entries.
- **Plan of record:** [`docs/VISION.md`](docs/VISION.md) (product goal and
  module map) + [`docs/discovery/`](docs/discovery/) (requirements register,
  risk register, decision log, gated roadmap) + [`docs/audit/`](docs/audit/)
  (the measured audit). Everything under
  [`docs/archive/`](docs/archive/) is **provenance, not instructions**.
- **Current truth:** the codebase is wide (182 engines, 48 stores) and shallow
  where it matters. The GL ingestion spine (exact-string staging, promotion,
  consolidation, board-pack export) is built and tested; there is still **no
  D365 export contract, no exception catalogue, no answer key, no disposition
  workflow, and the desktop build cannot sign in offline.** Details:
  [`docs/agent/09_KNOWN_GAPS.md`](docs/agent/09_KNOWN_GAPS.md).

## 2. Non-negotiable rules (the short list)

Full rationale and examples:
[`docs/agent/04_ENGINEERING_RULES.md`](docs/agent/04_ENGINEERING_RULES.md).

1. **Measured, or not stated.** No claim in any document, commit message, PR,
   or chat summary without the command that produced it. "Tests pass" means you
   ran them in this tree and can paste the tally.
2. **Nothing is done without evidence.** Done = code + a test that fails
   without the change + gates green + docs updated in the same commit. Stubs,
   mocks, TODOs and "wired later" are not done and must say so.
3. **Money goes through one primitive.** `src/utils/money.ts` (decimal.js).
   Never add float arithmetic on amounts. `npm run money:ast` must stay at 0
   unsafe ops; `npm run money:adoption` must not fall.
4. **Deterministic.** Time comes from `src/utils/clock.ts` (`now()`,
   `nowISO()`, `nowMs()`, `todayISO()`), never `new Date()` / `Date.now()` in
   engines, stores, services, utils. Randomness is injected and seeded.
   `npm run determinism:ratchet` must not rise for any file.
5. **Nothing silently discarded.** Every rejected import row has a row number,
   a code and a reason; every batch has a content hash, a batch id and control
   totals; every entry has provenance.
6. **Missing ≠ zero.** Never render a KPI from absent inputs as 0 or a default.
   Say "not in file" / "unavailable" and why.
7. **A potential exception is never an error.** Flags are review candidates
   with a rule id and evidence; only a human disposition makes them wrong.
8. **No new surface before the spine works.** No new routes, pages, engines,
   stores, sector packs or connectors until Gate 2 of
   [`docs/discovery/roadmap.md`](docs/discovery/roadmap.md) is green. Wire or
   delete; do not add.
9. **No egress by default.** No network calls, telemetry, or AI provider calls
   unless behind an explicit allow-listed, user-initiated path.
10. **Do not weaken a gate to pass it.** No skipping tests, lowering bars,
    editing baselines upward, adding `eslint-disable`, `as any`, or
    `@ts-expect-error` to make something green.
11. **One source of truth per fact.** If a number/rule lives in two places,
    delete one or make a script assert equality.
12. **Owner decisions are not yours.** Open decisions in
    [`docs/discovery/decision-log.md`](docs/discovery/decision-log.md) are the
    owner's. Implement around them, never through them. If blocked, say exactly
    which decision blocks you.

## 3. Session protocol

```text
START   read AGENTS.md → docs/README.md → docs/agent/09_KNOWN_GAPS.md
        git status; git log --oneline -5; npm ci --ignore-scripts (if node_modules missing)
        npm run tsc && npm run lint        (must be clean before you touch anything)
WORK    one item per commit; tests first or alongside; run the narrowest relevant
        test files after each change; run every ratchet you could have moved
END     npm run check (or the subset you can justify) → paste tallies →
        update docs in the same commit → handover per
        docs/agent/HANDOVER_TEMPLATE.md
```

Branch rules: work only on the session branch, commit and push there, never
create or switch branches. CI workflows under `.github/workflows/**` cannot be
modified from an agent session (GitHub App lacks the `workflows` permission) —
deliver CI changes as patches in `ci-patches/` for a human.

## 4. Commands you will actually use

| Command                                       | Purpose                                          |
| --------------------------------------------- | ------------------------------------------------ |
| `npm ci --ignore-scripts`                     | install from lockfile (root); also `cd server`   |
| `npm run tsc`                                 | type check                                       |
| `npm run lint`                                | ESLint, zero warnings                            |
| `npm run format:check` / `format`             | Prettier on `src/**`                             |
| `npx vitest run <file-or-dir>`                | targeted tests (preferred inner loop)            |
| `npm run test:sharded`                        | full suite in 8 shards (use on < 8 GB RAM)       |
| `npm run test`                                | full suite in one process (needs 8 GB heap)      |
| `cd server && npm test`                       | server suite                                     |
| `npm run docs:verify`                         | README numbers, persistence map, schema homes    |
| `npm run docs:links`                          | every live doc link resolves                     |
| `npm run money:ast` / `money:adoption`        | money ratchets                                   |
| `npm run determinism:ratchet`                 | wall-clock/random ratchet (`--list`, `--update`) |
| `npm run engines:verify`                      | engine manifest current                          |
| `node scripts/verify-readme-stats.mjs --list` | reachable vs orphan engines                      |
| `npm run check`                               | the whole gate, honest exit code                 |

Every other script is documented in
[`docs/agent/05_COMMANDS_AND_GATES.md`](docs/agent/05_COMMANDS_AND_GATES.md).

## 5. Where things live

```text
src/main.tsx → src/App.tsx          all routes (<Route>, React.lazy)
src/pages/        route pages by domain          src/store/      Zustand stores (persist+immer)
src/engines/      pure calculation modules       src/services/   import, export, connectors, api sdk
src/components/ui UI primitives (barrel index)   src/utils/      money.ts, clock.ts, sha256.ts, storage
src/types/index.ts domain types (GLEntry etc.)   src/test/setup.ts global test mocks
src-tauri/        Rust shell + SQLite migrations (client never writes them)
server/           Express + SQLite API (JWT/RBAC) — no frontend caller, not bundled
scripts/          every gate and generator      docs/agent/     this handbook
docs/VISION.md    product goal + module map      docs/discovery/ plan of record
docs/audit/       measured audit                docs/archive/   retired docs (not instructions)
```

Architecture and dependency direction:
[`docs/agent/02_ARCHITECTURE.md`](docs/agent/02_ARCHITECTURE.md). Domain rules:
[`docs/agent/03_DOMAIN_RULES.md`](docs/agent/03_DOMAIN_RULES.md). Data model and
persistence truth: [`docs/agent/08_DATA_MODEL.md`](docs/agent/08_DATA_MODEL.md).
Testing: [`docs/agent/06_TESTING.md`](docs/agent/06_TESTING.md). Definition of
done and handover:
[`docs/agent/07_WORKFLOW_AND_DOD.md`](docs/agent/07_WORKFLOW_AND_DOD.md).

## 6. Things that will bite you (learned the hard way)

- `node_modules` is not snapshotted: if `npx tsc` "isn't the tsc you're looking
  for", run `npm ci --ignore-scripts`.
- `npm audit fix --omit=dev` prunes dev deps; always follow with `npm install`.
- Prettier 3 ships `prettier.cjs`, not `prettier.js`.
- `lucide-react` is mocked globally in `src/test/setup.ts` with an enumerated
  icon list. Never hand-mock it per test file; add new icons to the global mock.
- Tests that depend on "today" rot. Pin with `setClock()` from
  `src/utils/clock.ts` and make fixtures relative to the pinned instant.
- The store enforces **double-entry balance per journal batch** in
  `validateEntries`. Unbalanced fixtures fail import with `FP-0002`-style
  messages — balance your test journals.
- Entry ids derive from the batch id, not the millisecond clock; two batches in
  the same instant must never share ids.
- `docs:verify` fails if README numbers drift from the tree. Update the README
  from the script output, not from memory.
- Documents under `docs/archive/` are records; never cite one as a rule.

## 7. If you are unsure

Stop and ask the owner with a concrete question that names the decision (e.g.
"DEC-005: blob store or relational SQLite?"). Do not pick for them and do not
leave it implicit in code. Record the answer in
[`docs/discovery/decision-log.md`](docs/discovery/decision-log.md) before
building on it.
