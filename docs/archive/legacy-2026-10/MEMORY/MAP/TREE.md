---
id: MEMORY/MAP/TREE.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# MAP/TREE — verified top level (listed from disk 2026-08-18)

```
src/                    VERIFIED  2321 ts/tsx files (1239 *.test.ts*)
src/App.tsx             VERIFIED  router, 213 <Route occurrences
src/main.tsx            VERIFIED  entry
src/engines/            VERIFIED  193 non-test modules
src/pages/              VERIFIED  203 non-test page components
src/store/              VERIFIED  44 non-test stores, 41 call persist()
src/components/         VERIFIED  (also: hooks/ utils/ types/ services/ domain/ api/ sdk/ workers/ wasm/)
src/utils/money.ts      VERIFIED  the only money-safe primitive
src/utils/decimalUtils.ts VERIFIED  EXISTS BUT IS NOT MONEY-SAFE (see ANTI)
server/                 VERIFIED  Express API; own lockfile
server/src/routes/      VERIFIED  audit auth budgets commands entities export
                                  forecasts gl periods reports scenarios
server/src/db/          VERIFIED  (also: services/ middleware/ config/ types/)
src-tauri/              VERIFIED  Rust desktop shell (NOT buildable here: no cargo)
src-tauri/migrations/   VERIFIED  001_initial_schema.sql, 002_cube_schema.sql
scripts/                VERIFIED  detectors, ratchets, gates, generators
scripts/money-ast-detector.mjs      VERIFIED  (+ money-ast-baseline.json)
scripts/fabrication-detector.mjs    VERIFIED  (+ fabrication-baseline.json)
.agent/                 VERIFIED  BLUEPRINT.md, blueprint-parts/, PROJECT_JOURNAL.md,
                                  HANDOVER.md, state.json
.husky/                 VERIFIED  pre-commit, pre-push, post-commit
ci-patches/             VERIFIED  workflow changes awaiting human `git apply`
docs/                   VERIFIED  large; architecture/, security/, design/ among others
e2e/ tests/ tools/ reports/ security/ plan/ prompt/ skills/ agents/ _bmad/  VERIFIED
MEMORY/                 VERIFIED  this brain
public/                 VERIFIED
```

Not present / do not reference: `apps/`, `packages/`, a monorepo workspace root,
`prisma/`, `drizzle/`. The repo is a single root package plus `server/`.
