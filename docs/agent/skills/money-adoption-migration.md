---
name: money-adoption-migration
description: Use when migrating modules to the Money primitive. Covers genuine migration (real arithmetic through money helpers), why markers are forbidden, baseline updates, and ratchet maintenance.
group: finance
---

# Money Adoption Migration

**Use it when:** migrating a financial module so its monetary arithmetic goes
through the canonical money primitive (`@/utils/money`).

## Method

1. **Find candidates:** financial modules that do currency-amount arithmetic
   with raw floats (`+`, `-`, `*`, `/`, `Math.round`, `.toFixed`) or that
   aggregate amounts with `reduce`. Exclude test/spec/bench files and
   `src/utils/money.ts` itself.
2. **Migrate the arithmetic:** route the real calculation through a money
   helper — `sumMoney`, `addMoney`, `subtractMoney`, `multiplyMoney`,
   `divideMoney`, `toDecimal`, `roundTo`, `asMoney`, `percentOf`, `variancePct`,
   `allocateMoney`, … — and keep the exact result in `Decimal`/`Money` until
   the display boundary, where `formatMoney` is used.
3. **Verify genuine use:** run `node scripts/money-adoption.mjs`. The ratchet
   counts a module as adopted only when it **calls** a money helper; an import
   alone does not count.
4. **Update baseline:** if genuine adoption increased, run
   `node scripts/money-adoption.mjs --update`. The baseline may only rise.
5. **Update docs:** keep `docs/agent/09_KNOWN_GAPS.md` and
   `docs/agent/01_PROJECT_BRIEF.md` at the measured floor so `docs:verify`
   agrees.
6. **Run gates:** `tsc --noEmit`, `eslint`, `money:ast`, `docs:verify` must
   all PASS.

## Markers are forbidden

A prior pass seeded `const _moneyAdoptionMarker = toDecimal(0)` — a no-op whose
only purpose was to trip the old import-based counter — across hundreds of
modules. That inflated reported adoption to 87.35 % while genuine adoption was
~30 %. The ratchet now fails outright if any `_…Marker = toDecimal(0)` (or the
`// Money adoption:` comment) reappears. **Never add a marker.** If a module
does not genuinely do money arithmetic, it does not belong on the primitive.

## What this prevents

- Self-import in `money.ts` (causes TS2440 error)
- Unused imports (causes eslint warnings)
- Fake adoption markers (ratchet failure + fabricated metric)
- Stale baselines (causes ratchet failures)

## Related

- `money-and-decimals` — the money primitive itself
- `determinism-and-reproducibility` — why money must be exact
- `gates-and-ratchets` — how the ratchet works
- `zero-compromise-verification` — no fake signals
