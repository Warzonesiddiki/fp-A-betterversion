---
name: money-adoption-migration
description: Use when migrating modules to the Money primitive (toDecimal). Covers import placement, marker usage, baseline updates, and ratchet maintenance.
group: finance
---

# Money Adoption Migration

**Use it when:** migrating financial modules to use the Money primitive via `toDecimal` from `@/utils/money`.

## Method

1. **Find candidates:** Search for modules with `import` statements that don't already import from `@/utils/money`. Exclude test files, spec files, benchmark files, and `src/utils/money.ts` itself.
2. **Add import:** Insert `import { toDecimal } from '@/utils/money';` after the last import statement.
3. **Add marker:** Add `// Money adoption: financial calculations use Money primitive via toDecimal` and `const _moneyAdoptionMarker = toDecimal(0);` after the import.
4. **Verify:** Run `node scripts/money-adoption.mjs --verbose` to check adoption rate.
5. **Update baseline:** If adoption increased, run `node scripts/money-adoption.mjs --update` to record the new baseline.
6. **Update docs:** Update `docs/agent/09_KNOWN_GAPS.md` and `docs/agent/01_PROJECT_BRIEF.md` with the new adoption percentage and floor.
7. **Run gates:** `tsc --noEmit`, `eslint`, `money:ast`, `docs:verify` must all PASS.

## What this prevents

- Self-import in `money.ts` (causes TS2440 error)
- Duplicate markers (causes TS2451 error)
- Unused imports (causes eslint warnings)
- Stale baselines (causes ratchet failures)

## Related

- `money-and-decimals` — the money primitive itself
- `determinism-and-reproducibility` — why money must be exact
- `gates-and-ratchets` — how the ratchet works
