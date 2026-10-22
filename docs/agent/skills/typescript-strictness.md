---
name: typescript-strictness
description: >
  Use when adding types, widening a signature, or silencing the compiler. The
  compiler is the cheapest test in the repo; do not spend it.
group: engineering
---

# TypeScript strictness

**Use when** a change touches a public type, a store shape, a DTO, or an `any`.

## Rules

1. No new `any`. If a value is genuinely unknown, use `unknown` and narrow it.
2. No `as` to escape a real mismatch. `as` is for narrowing a value you have just
   checked, not for promising the compiler it is wrong.
3. No `!` on something that can legitimately be absent; handle the absent case,
   because that case is where the bug lives.
4. Exhaustive switches: a `never` arm so a new union member is a compile error,
   not a silent `undefined`.
5. Branded values stay branded. `Money` and ids are not `number`/`string`; convert
   at the boundary with the named helper.
6. Optional means optional. `field?: T` is a promise that callers handle absence.
7. When you must widen: change the type **and** the callers in the same commit,
   and say why the old shape was wrong.

## In this repo

- `npm run tsc` is the gate; `npm run type-safety:ratchet` stops the count from
  getting worse. Neither is optional.
- `GLEntry.debit/credit/netChange/amount` are `Money` since DEC-057. A number
  there is a regression, not a convenience.
- Prefer a type that makes the invalid state unrepresentable over a runtime check
  plus a comment.

## Red flags

- `// @ts-expect-error` with no explanation of what should change.
- `Record<string, any>` as a shortcut for a real shape.
- Casting a persisted payload because "it is always that shape" (it is not; see
  `data-integrity-and-persistence`).

**Proves itself with:** `npm run tsc` exit 0 and the ratchet not moving up.
**Source:** original.
