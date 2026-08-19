---
id: MEMORY/CONVENTIONS.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# CONVENTIONS — how THIS repo is written

- **Path alias** `@/` → `src/` (Vite + tsconfig). Use it in app code.
- **Money**: `import { sumMoney, divideMoney, subtractMoney, roundTo, toDecimal } from '@/utils/money'`.
  Return `Decimal` inside a derivation, convert with `.toDecimalPlaces(2).toNumber()` at the edge.
- **Derivation modules** live next to their page: `src/pages/<area>/<thing>Data.ts` or
  `<thing>Model.ts`, with a file header stating the correctness contract and what it refuses to
  invent (see `src/pages/credit/creditRiskData.ts` as the reference shape).
- **Nullability signals honesty**: a ratio that the GL cannot support is `null`, and the view
  renders `'—'` (`formatPercent(null) === '—'`), never `0` and never `'N/A'` with a fake number
  behind it.
- **Tests** sit beside the source: `Foo.tsx` + `Foo.test.tsx`; money-specific suites are
  `*.money.test.ts`. Prefer a real-engine DOM probe over `vi.mock` of the engine.
- **Stores** are Zustand + `persist`, one file per domain in `src/store/`.
- **Engines** are pure classes with static methods in `src/engines/`, JSDoc-tagged with a
  `@purity-tier` and iron-rule line; the manifest `engineManifest.generated.ts` is generated
  (`npm run engines:manifest`) — never hand-edit it.
- **Generated artifacts** (`engineManifest.generated.ts`, `PROGRESS_TRACKER.html`, baselines) are
  never a source of truth (K7).
- **Prettier** is enforced on staged files; always `npx prettier --write` generated JSON/MD.
- **Docs** live in `docs/`; agent-facing state lives in `.agent/`; this brain lives in `MEMORY/`.
