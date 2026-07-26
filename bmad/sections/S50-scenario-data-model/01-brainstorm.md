# S50 — Brainstorming: Scenario Data Model

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- A scenario is a named variant of a base plan with overrides.

## 2. SCAMPER
- **Add:** base + variants; driver/account overrides; probability weight.
- **Modify:** built on S49 forecast.

## 3. Ideation
- `Scenario { base, overrides[], probability }`.

## 4. Selected Directions
1. Scenario model + store.
2. (Tasklist 2.2.2 partial.)

## 5. Open Questions
- Probability per scenario sums to 1? (validate.)
