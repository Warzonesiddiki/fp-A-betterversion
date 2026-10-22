---
name: financial-domain-modeling
description: >
  Use when modelling accounting or FP&A behaviour: entries, close, consolidation,
  intercompany, FX, drivers, variance. Get the accounting right before the screen.
group: finance
---

# Financial domain modelling

**Use when** the change touches how finance actually works, not only how it looks.

## Check before coding

1. **Debits equal credits** — every posted journal balances; a view that implies
   otherwise must say why (single-sided analysis, memo lines).
2. **Sign convention** — one convention per surface, stated. Revenue negative or
   positive is a choice; mixing them is a bug.
3. **Period and entity scope** — every number answers "which entity, which
   period, which version". Undated totals are not totals.
4. **Intercompany** — an IC pair must eliminate symmetrically, or be reported as
   an unmatched pair. Silent one-sided elimination is a data-loss bug.
5. **FX** — rate, rate date, and translation versus transaction difference are
   separate facts. A converted number with no rate is a guess.
6. **Drivers** — a forecast row names its assumption and the input it multiplies.
   A hardcoded growth rate is a finding.
7. **Variance** — actual vs plan needs both bases and the sign story; a variance
   percentage of a zero base is not a number, it is a statement.

## In this repo

- Engines under `src/engines/` own these rules; pages should not re-implement
  them. If a page computes a ratio the engine also computes, one of them is wrong.
- `npm run financial:oracles` runs the statement oracles; treat them as the
  accounting contract.
- Terminology lives in `docs/agent/10_GLOSSARY.md`; use the project's words.

## Red flags

- A new "adjusted" figure with no adjustment record.
- Trial balance that ties only after a manual plug.
- Close status inferred from a timestamp instead of a recorded event.

**Source:** original, from the project's domain rules and DEC-030/DEC-039.
