# Controlled Close & Reconciliation Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Specify the controlled close operating model required before presenting Close Cockpit functionality as enterprise-ready.  
> **Depends on:** financial-metric-lineage-model.md · materiality-decision-policy-model.md

## 1. Close principle

A period is not “closed” because a user clicks a button or a dashboard is green. It is closed only when required data, reconciliations, adjustments, certifications, consolidation validations, approvals, and report-readiness controls are complete or governed exceptions are explicitly approved.

## 2. Close-cycle contract

| Object         | Required fields                                                                  | Control rule                                                          |
| -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Close Cycle    | tenant, calendar/version, period/scope, owner, status, due dates, policy version | created from approved calendar/policy; no hidden status transitions   |
| Close Task     | control type, dependency, owner/backup, SLA, evidence requirements, state        | state derived from evidence/control result where possible             |
| Reconciliation | source/target definitions, scope, tolerance, difference, match status, owner     | cannot be marked complete without documented result/evidence          |
| Adjustment     | reason, origin, amount/currency, journal/input link, approver, reversal relation | adjustment is distinct traceable fact, not overwrite                  |
| Exception      | breached control, risk, rationale, compensating control, approver, expiry        | cannot permanently bypass a required control                          |
| Certification  | scope, attester role, evidence set, policy version, timestamp                    | attester must have required permission and no prohibited SoD conflict |
| Lock           | scoped period/entity/version, lock policy, actor/time                            | authoritative service rejects non-permitted mutation/replay           |
| Close Snapshot | frozen close/control/reconciliation/consolidation status                         | used by report publication and audit evidence                         |

## 3. Close-control domains

```text
1. Data completeness / import quality
2. Master-data and fiscal-period readiness
3. Account and balance reconciliations
4. Intercompany match/elimination exceptions
5. FX rate, translation, and remeasurement checks
6. Approved adjustments and journals
7. Consolidation run and validation
8. Management/reporting review
9. Certifications and lock
```

A tenant can configure controls, but no configuration may silently reduce an already-certified period’s historic evidence.

## 4. Close task state machine

```text
Not Ready → Ready → In Progress → Awaiting Evidence / Awaiting Approval
          → Complete
          → Blocked → Exception Requested → Exception Approved / Rejected
          → Overdue → Escalated
```

| State               | Meaning                                       | Required UI/evidence                         |
| ------------------- | --------------------------------------------- | -------------------------------------------- |
| Not Ready           | dependency/control prerequisite not satisfied | dependency and owner visible                 |
| Ready               | user can begin valid work                     | instructions/evidence requirement visible    |
| In Progress         | work started but not verified                 | owner, age, next action                      |
| Awaiting Evidence   | required proof missing                        | exact missing artifact/control listed        |
| Awaiting Approval   | action complete pending authorized review     | approver/SLA/escalation shown                |
| Complete            | required control/evidence validated           | completion source, actor/time, evidence link |
| Blocked             | cannot proceed due to failure/dependency      | blocker, impact, owner, recovery path        |
| Exception Requested | breach requires risk acceptance               | rationale/compensating control/expiry        |
| Exception Approved  | temporary governed bypass                     | approver, expiry, review path; not “green”   |
| Overdue/Escalated   | SLA breach                                    | escalation chain, notifications, impact      |

## 5. Reconciliation contract

### Required definition

A reconciliation must declare source, target, scope, period/as-of time, matching method, tolerance, currency/FX method, control owner, and resolution policy.

### Required outputs

| Output                         | Meaning                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| Source total / target total    | exact values plus display rounding/currency                            |
| Difference                     | exact and display delta with favorable semantics only where meaningful |
| Matched / unmatched population | count and amount, with authorized drill-through                        |
| Tolerance                      | policy/version and comparison result                                   |
| Freshness                      | source-run timestamp and status                                        |
| Evidence                       | mapping/import/calculation/adjustment references                       |
| Resolution                     | owner, rationale, action, approval/exception if needed                 |

Auto-match must preserve its matching rule/version and confidence is never a substitute for review policy. Unmatched items cannot disappear through UI filtering.

## 6. Intercompany and FX controls

### Intercompany

- Each transaction identifies counterparty/legal entity and relevant account/dimension policy.
- Matching keys, tolerances, and date/currency differences are explicit.
- Unmatched/imbalanced items create visible exceptions with owner and resolution path.
- Elimination run freezes source data, rule version, actor, time, output, and validation result.

### FX

- Rate source, rate type, effective date, translation/remeasurement method, and currency pair are versioned evidence.
- Missing/stale/out-of-policy rates block affected controls or require governed exception.
- Re-running FX/consolidation creates a new run; it never silently changes a certified result.

## 7. Certification, SoD, and locking

| Action                 | Required checks                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Certify reconciliation | attester has scope/role; evidence complete; no configured SoD conflict; policy version recorded                     |
| Approve exception      | authorized risk owner; rationale, compensating control and expiry supplied; cannot self-approve when policy forbids |
| Lock period            | all blocking controls complete/exception-approved; impact summary; lock scope explicit                              |
| Post-lock adjustment   | allowed adjustment policy, reason, approval, reversal/lineage, audit; may trigger reopen/re-certification by policy |
| Publish report         | close snapshot/report policy approved; report shows certification/as-of state                                       |

A lock is enforced by the authoritative service across UI, API, imports, integrations, workers, and offline queue replay.

## 8. Close Cockpit UI contract

```text
[Period / entity scope / close status / days to deadline]
[Blocking controls | overdue tasks | exceptions requiring action | certified controls]
[Control-domain checklist with derived states]
[Selected control: evidence | reconciliation | comments | task | audit | escalation]
[Close timeline / snapshot / reporting readiness]
```

- Percentage completion never substitutes for blockers.
- “Complete” and “Exception Approved” are visually/textually distinct.
- Controller can see exact evidence gap and responsible party without opening generic activity feeds.
- CFO view shows material close risk, deadline, and certification status; it does not expose restricted transaction data by default.

## 9. Close publication gate

A report/board pack may be labelled **Certified** only when its scope links to a qualifying close snapshot and report certification policy. Otherwise it is Draft, Preliminary, or Management Review according to explicit state; watermark/export labels must match.

## 10. Security, reliability, and audit requirements

- Every close transition, reconciliation result, exception, certification, lock, adjustment, run, and report gate creates immutable audit/outbox evidence.
- Control operations are idempotent and concurrency-safe; duplicates do not produce duplicate certification or locking.
- Close progress/query data is tenant/entity/classification scoped.
- Recovery after job failure or network interruption preserves task/control state and explains retry status.
- Evidence retention/legal hold follows approved policy; deletion does not make a certified close unreproducible.

## 11. Validation evidence before implementation

1. Observe three real or simulated customer month-end closes with controller participants.
2. Validate checklist domains, blockers, exceptions, SoD, and lock behavior against customer policies.
3. Test reconciliations with matched/unmatched, FX, intercompany, adjustment, stale-data, and tolerance boundary cases.
4. Conduct auditor task test: reconstruct a certified report amount/control without engineering help.
5. Run lock-bypass negative tests through API, import, worker, offline replay, and UI paths.

## 12. Explicit non-goals

- Claiming statutory/regulatory compliance without jurisdiction-specific legal/control validation.
- Automatically accepting unmatched reconciliation or unapproved exception.
- Treating a task completion checkbox as certification.
- Overwriting certified close values in place.
- Hiding unresolved close risk behind aggregate progress.
