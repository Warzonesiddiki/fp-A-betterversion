# FinPlan Pro — Agent Handbook (entry point)

> **Read this file first, every session.** It is the single authoritative
> instruction set for any human or AI agent working in this repository.
> `CLAUDE.md` and `GEMINI.md` only point here.
>
> The documentation map is [`docs/README.md`](docs/README.md). The product goal
> is [`docs/VISION.md`](docs/VISION.md). **The detailed proposed product and
> execution plan is
> [`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md)**;
> the high-level gates are in [`docs/discovery/roadmap.md`](docs/discovery/roadmap.md).
> [`docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md`](docs/PROJECT_AUDIT_AND_EXECUTION_PLAN.md)
> is a dated historical snapshot, not the live master plan. Accepted owner
> decisions live in `docs/discovery/decision-log.md`. If another document
> contradicts this file or `docs/agent/`, this file wins — and the contradiction
> is a bug to be fixed, not a choice to be made.

Handbook rules originated **2026-10-16**; product scope and execution guidance
were aligned to owner direction on **2026-11-04**. Current-state facts must be
rechecked in the linked evidence docs and commands; every measured number below
comes from a named script and must not be updated by hand.

---

## 1. What this project is (in one minute)

- **Product:** an all-in-one FP&A workspace — a one-stop tool that carries a
  finance team from raw General Ledger data to reviewed, board-ready output.
  Desktop-first (Tauri 2 shell): React 19 + TypeScript strict + Vite 8 +
  Tailwind 4 + Zustand/Immer. Package name `finplan-pro`.
- **Owner's first proven-source workflow:** each month the owner exports a
  General Ledger dump from **Microsoft Dynamics 365**, performs FP&A work on it,
  identifies entries for human review, guides the accounts team and compares
  daily/monthly/yearly results. **Broader owner direction (2026-11-04):** build
  toward one-stop FP&A, user-mapped data from any accounting/ERP source, and
  industry configurability. D365 is the first owner-specific proof; DEC-104
  already accepts the universal template direction. See the master plan for
  staged execution and unverified boundaries.
- **Product and execution authority:** [`docs/VISION.md`](docs/VISION.md) is the
  north-star; [`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md)
  is the detailed proposal under owner review; [`docs/discovery/requirements-register.md`](docs/discovery/requirements-register.md)
  owns acceptance/evidence, [`docs/discovery/decision-log.md`](docs/discovery/decision-log.md) owns accepted decisions, and
  [`docs/discovery/roadmap.md`](docs/discovery/roadmap.md) summarizes gates. Dated audits are evidence snapshots. Everything
  under [`docs/archive/`](docs/archive/) is **provenance, not instructions**.
- **Current truth:** the codebase is wide (180 engines, 48 stores) and shallow
  where it matters. The live GL upload path is `GLUploadPage` → `parseGLRows` →
  `glStore.importGLData`; a separate exact-string staging/promotion pipeline is
  built/tested but has no UI consumer or downstream reader. The universal
  template engine is also separate from the upload UI's persisted header-based
  mapping profiles. Synthetic tests are not real-owner D365 verification or an
  accounts-team acceptance run. **Native/offline sign-in and programme
  completion remain unverified.** See
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
8. **No unplanned surface expansion; execute the agreed vision in dependency
   order.** The user-mapped universal import path and its integration with the
   current upload flow are explicit foundation work under DEC-104; do not block
   them with the superseded Gate 2 wording. Add other API connectors and
   industry packs only in the dependency order of
   [`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md),
   with an owner-prioritized work item and one shared financial contract. Code
   or catalog presence never earns a support claim.
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
13. **Measure behaviour, not presence.** A ratchet counts what code _does_ (a
    call, a computed value), never what it merely _has_ (an import, a
    declaration, a name). A counter is earned by behaviour; a proxy metric is
    reported only alongside its behaviour-measured companion, never as the
    headline alone. (`MI-01`, `MI-06` — see
    [`docs/agent/11_ANTI_FABRICATION_AND_QUALITY.md`](docs/agent/11_ANTI_FABRICATION_AND_QUALITY.md).)
14. **No marker, stub, void, or placeholder to trip a gate.** `const
_xMarker = toDecimal(0)`, `void 0;`, `// Money adoption:` are forbidden,
    zero-tolerance. A gate that passes by construction is not a gate; every
    ratchet ships an anti-gaming check. (`MI-02`, `MI-03`, `MI-08` — see
    [`docs/agent/11_ANTI_FABRICATION_AND_QUALITY.md`](docs/agent/11_ANTI_FABRICATION_AND_QUALITY.md).)

## 3. Session protocol

```text
START   read AGENTS.md → docs/README.md → docs/agent/09_KNOWN_GAPS.md
        activate the standing skills: ponytail (full level) + consult the skill
        library (docs/agent/skills/README.md) and apply the row whose "use it
        when" matches the work — a skill raises rigour, never the claim
        git status; git log --oneline -5; npm ci --ignore-scripts (if node_modules missing)
        npm run tsc && npm run lint        (must be clean before you touch anything)
WORK    vision-alignment first for any new surface: name the owner job (J1–J4)
        and the pillar (DATA/CLOSE/PLAN/ANALYZE/MODEL/REPORT) before a line is
        written; then one item per commit; tests first or alongside; run the
        narrowest relevant test files after each change; run every ratchet you
        could have moved
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
| `npm run palette:ratchet`                     | raw-palette ratchet (`--list`, `--update`)       |
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
docs/VISION.md    product goal + module map      docs/discovery/ master plan + gates + decisions
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

## 8. Active docs-first architecture mission

The repository-wide architecture mission is tracked in [`docs/_agent/STATE.json`](docs/_agent/STATE.json), with its target scope in [`docs/_agent/MISSION_CONTRACT.md`](docs/_agent/MISSION_CONTRACT.md). Its partial Stage 1 evidence report is [`docs/03_CURRENT_STATUS_AND_AUDIT.md`](docs/03_CURRENT_STATUS_AND_AUDIT.md), and per-file review status is in [`docs/_agent/LIVE_DOCS_REVIEW.csv`](docs/_agent/LIVE_DOCS_REVIEW.csv); use `STATE.json` for the current gate/count snapshot instead of copying counts into this handbook. The audit and design work is documentation-first: do not make further application-source changes until the Stage 1–5 evidence is complete and `docs_gate_passed` is true. Existing source edits already present in the branch predate this bootstrap and are not evidence that the new gate has passed.
For A11Y scopes and waiver policies, dated sign-offs, green checklist marks, and a manual waiver record are not runtime/test evidence unless the current implementation, CI behavior, and accepted owner decision support them.

The user-provided fixed-precision, accounting-identity, cash-flow, retained-earnings, time-aggregation, polarity, currency-translation, elimination, allocation, bi-temporal lineage, and deterministic-AI rules are target requirements. They do not describe current implementation status. Preserve accepted owner decisions and mark each provider, industry, security, and calculation capability only to the exact evidence available. Use `[UNVERIFIED: reason]` for a dependency, credential, source shape, or external claim that has not been checked.

Parallelize independent inspections and validations. Do not run conflicting writes concurrently. Share concise action plans and evidence-backed findings; do not present unsupported implementation or research claims.
