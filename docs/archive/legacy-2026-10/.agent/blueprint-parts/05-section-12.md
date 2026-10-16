# SECTION 12 — AI/ML MODULE SPECIFICATION

## 12.1 The governing constraint

> **AI never touches a number without a human's explicit acceptance, and never sees
> a raw monetary value it does not need.**

AI in OmniPlan is an _assistant to_ the financial engine, never a _substitute for_ it.
Every AI output is a **suggestion** with provenance, confidence, and an accept/reject
decision recorded in the audit log.

## 12.2 Capability tiers

**Tier 1 — Deterministic ML (no LLM).** Runs locally, fully explainable.
Forecasting (naive, linear, Holt-Winters, ARIMA, ensemble with backtest-selected
weights), anomaly detection (statistical: z-score, IQR, seasonal decomposition),
driver discovery (correlation and elasticity), Monte Carlo simulation.
_These are engines, tested with golden numbers, and are the default._

**Tier 2 — LLM-assisted narrative.** Variance commentary drafting, board-pack narrative,
natural-language query → structured query, formula explanation in plain English,
data-quality issue summarisation.
_Output is text about numbers, never numbers themselves._

**Tier 3 — LLM-assisted authoring (Phase 3, gated).** Formula generation from a
description, model scaffolding from a business description, mapping suggestions.
_Every output lands in a review diff that a human must accept._

## 12.3 Money-egress guardrail — F-AI-011 (P0, Severity-0 if violated)

```
AI1  No raw monetary value leaves the tenant boundary to a third-party LLM
     unless the tenant has explicitly opted in, per-feature, with an audit record.
AI2  Default mode is REDACTED: values are replaced with normalised indices,
     percentage changes, and ranked ordinals before egress.
AI3  A single chokepoint module performs every LLM call. Direct SDK calls from
     feature code are a build failure (architecture guardrail).
AI4  Every prompt and response is logged with a hash, token count, model id,
     latency, cost, and the redaction mode used.
AI5  Prompt-injection defence: retrieved content is fenced and never treated as
     instructions; tool use is allowlisted; outputs are schema-validated (Zod).
AI6  Model, version, and prompt template are pinned and versioned. A model change
     is a release event, and forecast outputs record the model version used.
AI7  Any AI-derived figure entering the fact table carries source='ai_forecast'
     and requires human acceptance before it can be certified or published.
AI8  Confidence is always shown. A forecast without an interval is not shipped.
AI9  Users can disable AI entirely, per tenant and per user. The product remains
     fully functional with AI off. AI is never load-bearing for correctness.
AI10 No customer data is used for third-party model training. Contractually and
     technically enforced (zero-retention endpoints only).
```

## 12.4 Forecasting specification

Methods run in an ensemble; selection is by rolling-origin backtest (MAPE/sMAPE/MASE) on
the tenant's own history, per series. Every forecast returns: point estimate, prediction
interval (80% and 95%), method chosen, backtest error, feature/driver contributions, and
data-sufficiency status. Series with < 12 observations are labelled `INSUFFICIENT_HISTORY`
and fall back to driver-based or manual planning — **the product never fabricates
confidence it does not have.**

## 12.5 Explainability contract

For every AI output: what data was used (lineage node ids), what method, what confidence,
what the top drivers were, and what would change the answer. An unexplainable output is
not shipped. "The model said so" is not an acceptable answer in a finance product.

---
