---
name: no-invented-data
description: >
  Use whenever a number, rate, benchmark or label appears in the UI: it must come
  from data the user supplied or a recorded assumption, never from a literal.
group: finance
---

# No invented data

**Use when** writing a KPI, a table cell, a default rate, a sample figure, or a
seed dataset.

## Rules

1. Every displayed financial figure traces to user data or to a **named**
   assumption the user can see and edit.
2. A demo/mock generator is data, not decoration: it must produce values the
   engine accepts (exact minor units) and be labelled as sample data.
3. A statutory or market rate (tax, FX, inflation) is an input with a source and a
   date, not a constant baked into a page.
4. Missing stays missing. Do not fill a gap with 0 or with a plausible number.
5. An AI surface narrates numbers the app already computed; it never computes,
   estimates or rounds one (DEC-022, AI-001).

## In this repo

- `npm run fabrication:audit` flags hand-typed financial literals in displayed
  values and hardcoded statutory rates. It exists because the money-AST detector
  reads arithmetic and these literals contain none.
- `npm run mock-data:audit` checks sample generators against the domain types.
- A literal that must stay (e.g. a threshold) needs a comment saying where it
  came from and `fabrication:list` should be clean afterwards.

## Red flags

- `revenue: 12_400_000` in a component.
- A "typical" margin used to make a chart look plausible.
- A default FX rate in the conversion helper.

**Proves itself with:** `npm run fabrication:audit` and a traceable source for each default.
**Source:** original, from the fabrication detector's rationale.
