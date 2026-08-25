# Materiality & Decision Policy Model — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Origin:** Executive Workspace brainstorm · **Owner roles:** CFO policy owner, Controller policy owner, FP&A policy owner  
> **Purpose:** Define when a financial signal is a material decision case rather than another dashboard metric.

## 1. First principle

A variance is not inherently important because it is large. It is material when its **amount, rate, trend, forecast impact, cash/control risk, and decision consequence** exceed a policy configured for the organization and context.

The system must show _why_ an item is ranked, never only that it is red or high priority.

## 2. Policy objects

| Object             | Owner              | Versioned fields                                                         | Why it exists                                                    |
| ------------------ | ------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Materiality Policy | CFO / VP Finance   | scope, metric class, thresholds, effective dates, escalation rules       | turns organization-specific judgment into governed configuration |
| Threshold Rule     | FP&A / Controller  | absolute amount, percentage, trend, forecast/cash impact, exclusions     | determines signal qualification                                  |
| Severity Rule      | CFO                | critical/high/medium logic, response SLA, required approver              | prevents every variance becoming urgent                          |
| Action Policy      | FP&A / Controller  | task required, owner-selection method, due date, approval/exception path | defines accountable response                                     |
| Evidence Policy    | Controller / Audit | source, calculation, context, audit, attachment requirements             | makes a decision independently reconstructible                   |
| Suppression Rule   | CFO                | known/planned events, approved exceptions, expiry/review date            | reduces noise without hiding risk                                |

Policies are tenant scoped, effective dated, versioned, approval-controlled, and auditable. A published decision retains the policy version used to rank it.

## 3. Signal qualification model

A signal may qualify through one or more rule types. It is not a client-side score; the authoritative service evaluates the policy using frozen context.

| Rule type            | Example                                                   | Required explanation                                 |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Absolute variance    | Expense is $250k above approved monthly plan              | amount, baseline, currency, period, rounding         |
| Relative variance    | Gross margin is 4pp below plan                            | actual, baseline, delta, denominator, sign semantics |
| Trend break          | Three-month deterioration exceeds configured slope        | range, trend method, historical values               |
| Forecast impact      | Forecast EBITDA misses plan by 8%                         | forecast/model version, period, key drivers          |
| Cash/liquidity       | Forecast cash falls below minimum covenant buffer         | cash forecast version, covenant/policy source        |
| Control / close risk | Reconciliation exceeds tolerance or certification overdue | control, tolerance, owner, due date, evidence gap    |
| Concentration        | One entity/customer/cost centre drives configured share   | dimension, contribution, total, scope                |

## 4. Severity and action matrix

| Severity      | Qualification                                                       | Default response                            | SLA hypothesis        | Required evidence                                   |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------- | --------------------- | --------------------------------------------------- |
| Critical      | Material financial/cash/control risk; policy breach; close blocker  | task + escalation + approval/exception path | 1 business day        | source, calculation, policy, owner, response, audit |
| High          | Material plan/forecast variance with executive decision consequence | task + variance explanation + decision      | 3 business days       | source, driver, comparison, owner, action           |
| Medium        | Significant operating variance requiring monitoring                 | analyst review or task at owner discretion  | next operating review | baseline, trend, rationale                          |
| Informational | below threshold or explained/approved event                         | visible in analysis, no automatic task      | none                  | context and suppression reason if used              |

**[ASSUMPTION]** SLA values are placeholders; the organization must configure/approve them. No default threshold or SLA may be marketed as universally correct.

## 5. Decision-case lifecycle

```text
Detected → Qualified → Triaged → Assigned → Investigating
   → Decision proposed → Approved / Exception approved → Monitored → Closed
                                      ↘ Reopened when new evidence or threshold breach occurs
```

| State             | Actor allowed       | Mandatory record                                       | Exit condition                     |
| ----------------- | ------------------- | ------------------------------------------------------ | ---------------------------------- |
| Detected          | system              | source query, context, policy version, evaluation time | policy evaluation complete         |
| Qualified         | system/FP&A         | qualification reasons and severity                     | not suppressed / not duplicate     |
| Triaged           | FP&A/controller     | validate/reject/suppress rationale                     | owner and response path selected   |
| Assigned          | policy/user         | owner, due date, task/workflow link                    | owner accepts or escalation starts |
| Investigating     | owner/team          | evidence, notes, driver analysis                       | proposed decision or exception     |
| Decision proposed | owner/approver      | action, forecast/plan impact, alternatives             | policy approver review             |
| Approved          | authorized approver | decision, approver, time, policy/SoD result            | implementation/monitoring begins   |
| Closed            | owner/controller    | outcome, evidence, learning, final status              | required evidence complete         |

## 6. Mandatory evidence drawer

Every material decision case must expose, subject to entitlement:

1. **Context:** organization/entity scope, fiscal period, version/scenario, reporting currency, freshness.
2. **Comparison:** actual/plan/forecast/prior amounts, variance calculation, rounding, favorable/unfavorable semantics.
3. **Drivers:** ranked contributor dimensions and drill-through path.
4. **Lineage:** data source/import batch, mapping version, calculation/model version, FX rate/type where relevant.
5. **Control:** materiality policy/version, severity rule, lifecycle state, required approvals, exception/suppression.
6. **People:** detector, assignee, contributors, approver, timestamps, comment/attachment history.
7. **Audit:** immutable event references and exportable evidence package.

## 7. UI contract

### Decision Workspace row

`[Severity] [Metric + scope] [actual vs baseline] [driver] [policy reason] [owner/due] [state] [open evidence]`

- Never rely on red/green alone.
- A severity label includes textual reason: “High — EBITDA forecast miss 8.1%, above 5% policy threshold.”
- Suppressed items remain discoverable with suppression owner/reason/expiry.
- Users can filter but cannot change policy or conceal a critical item without authority and audit evidence.

### Analyst / controller actions

- **Assign** captures accountable owner and deadline.
- **Request explanation** creates a scoped task with required evidence prompts.
- **Create scenario** retains base version and decision-case link.
- **Suppress** requires policy permission, rationale, expiry, and review date.
- **Certify / exception** follows close/workflow policy; it cannot be a generic button.

## 8. Architecture and security implications

- `MaterialityPolicy`, `ThresholdRule`, `DecisionCase`, `DecisionCaseEvidence`, and `Suppression` are authoritative domain entities, not client state.
- Policy evaluation command/query requires tenant/entity context, metric definition/version, fiscal context, and idempotency/deduplication rules.
- Decision case, policy edit, assignment, suppression, approval, and close emit audit/outbox events.
- Row-level authorization applies to the case and every evidence item.
- A policy change cannot alter historic ranking; new evaluation uses new version.

## 9. Validation questions

1. Which dimensions/metrics are genuinely material by role and vertical?
2. Is the default queue reviewed daily, weekly, or by close stage?
3. Who may suppress/approve, and how is segregation of duties handled?
4. What response time is realistic without creating workflow fatigue?
5. Do users prefer a score, explicit rule reasons, or both?
6. How should compound/correlated drivers be explained without false causation?

## 10. Acceptance evidence before implementation

- At least three controller/CFO participants validate the lifecycle and evidence drawer against a real recent variance.
- Target organization policy owner approves sample thresholds and suppression rules.
- Usability participants can explain why an item is ranked and what action is expected without facilitation.
- Security/architecture review approves server-side policy, audit, entitlement, and immutable version requirements.
