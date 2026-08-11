# FinPlan Atlas — Design System Contract

> **Status:** Foundation in progress (Story 02). No screen is Atlas-certified until it satisfies every applicable requirement below.

## Purpose

FinPlan Atlas prevents the product from degrading into a generic dashboard. It provides the shared vocabulary for financial context, evidence, lifecycle state, dense data work, and accessible decision making.

## Token hierarchy

| Layer | Examples | Rule |
|---|---|---|
| Primitive | base palette, font stack, spacing unit, radii | Defined only in `src/index.css`; not consumed directly by feature components. |
| Semantic | `--surface-*`, `--text-*`, `--border-*`, `--action-*`, `--focus-ring` | Shared components consume semantic tokens, not one-off hex values. |
| Financial | `--financial-draft`, `--financial-locked`, `--financial-certified`, `--financial-failed` | Must have a textual/icon equivalent. Colour alone never conveys state. |
| Component | `.fp-page`, `.fp-panel`, `.fp-page-header`, `.fp-financial-status` | Documented anatomy, state, keyboard, responsive, and test contract. |

## Core layout patterns

- **Page:** maximum-width decision work area with an optional full-bleed analytical grid mode.
- **Page header:** title, concise decision purpose, status/freshness, primary action, and secondary actions.
- **Context bar:** Scope → Time → Version → Currency → Freshness. Global controls do not mix with page-local filters.
- **Panel:** quiet surface with purpose-bearing heading; panels are not used merely to make every datum look important.

## Heading hierarchy

- Page title is `h1` (rendered by `PageHeader`).
- Top-level sections under the page title use `h2` (cards and chart panels on the canonical Dashboard).
- Nested panel/group titles use `h3` (`CardTitle`, `ChartWrapper` default).
- Do not skip levels. `ChartWrapper` accepts `headingLevel="h2"` when it is a top-level section under the page `h1`; the default remains `h3` for panels nested under section headings.

## Financial context contract (F-03)

The canonical context bar (`src/components/layout/FinancialContextBar.tsx`) renders, in fixed order:

1. **Scope** — entity selection (draft options until the server master-data contract is connected).
2. **Time** — fiscal period range (`YYYY-MM..YYYY-MM`).
3. **Version** — scenario/version with lifecycle.
4. **Currency** — reporting currency (ISO 4217).
5. **Freshness** — sync/queue state, plus the data-authority truth badge (`Draft — Local workspace data` for draft contexts).

Contract rules:

- Typed `FinancialContext` lives in `src/types/financialContext.ts`; state in `src/store/financialContextStore.ts`.
- URL serialization is deterministic (fixed parameter order) and excludes freshness (ephemeral runtime state). Saved views therefore never freeze a stale-freshness claim.
- Invalid URL values are ignored, never silently coerced.
- Context options are a presentation surface. Official views resolve scope/filtering server-side (F-04 command/query envelope); the context bar never authorizes data access client-side.
- **Inspector:** a resizable contextual pane that preserves selection and reveals evidence, formula, comments, audit, or workflow.

## Financial state contract

Use `FinancialStatusBadge` for shared lifecycle states. A state must provide:

1. readable label;
2. symbol/pattern in addition to colour;
3. accessible name explaining consequence;
4. next action where interaction is available; and
5. consistent semantics across planning, close, reporting, workflow, sync, and AI.

## Component certification checklist

A shared component may be used on a canonical screen only when it has:

- explicit purpose and variants;
- semantic-token-only styling for new states;
- keyboard and focus behavior;
- accessible name/role and non-colour state indication;
- loading, empty, error, disabled, and permission-denied behavior where relevant;
- desktop/compact/tablet/mobile specification;
- unit/interaction tests and a visual-regression baseline; and
- named technical and product owner.

## Typography and data rules

- Tabular figures are right aligned and use tabular numerals.
- Financial labels and row hierarchy are left aligned.
- Reports and grids declare currency, period, comparison basis, data freshness, and rounding policy near conclusions.
- Negative/favorable logic is metric-aware. Red/green never substitutes for signed values and explanatory labels.
- Motion is optional, ≤200ms by default, and disabled under `prefers-reduced-motion`.
