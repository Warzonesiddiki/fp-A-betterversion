# Enterprise Buying Committee Map — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Source:** Owner direction E-001 + Phase 0 research.  
> **Purpose:** Map how FinPlan must earn approval across an enterprise finance purchase, without assuming one persona controls the outcome.

## Stakeholder map

| Stakeholder | Job / decision lens | Value required | Likely objection | Research proof needed |
|---|---|---|---|---|
| CFO / Group CFO | business outcome, decision quality, risk, board confidence | faster trusted decisions, lower planning/close risk, clear ROI | “another dashboard/tool; no measurable impact” | quantified workflow cost, materiality/evidence prototype test, WTP discussion |
| VP Finance / Finance Director | operating ownership, transformation delivery | connected cadence, adoption, implementation feasibility | “scope is too broad; change management will fail” | pilot plan, implementation timeline, role/task evidence |
| Controller / CAO | close, audit, policy, certification | reconciliation, lock, exception, audit reconstruction | “controls are not real; close semantics are immature” | close simulation, SoD/lock/evidence test, auditor feedback |
| FP&A leader / analyst | planning speed, model flexibility, forecast quality | keyboard-grade workflow, versions, lineage, safe imports | “Excel is faster; custom grid will slow us down” | task observation, paste/formula/conflict prototype, interoperability requirements |
| CIO / IT / Security | identity, data boundary, operations, vendor risk | hybrid deployment, SSO, tenant isolation, lifecycle controls | “local workspace/sync creates endpoint and support risk” | security questionnaire, threat model, offline/authority proof |
| Procurement / Legal | commercial risk, terms, vendor viability | predictable packaging, SLA, privacy, implementation accountability | “premium price lacks reference evidence” | pilot/LOI, support/SLA, DPIA/security/commercial material |
| Business owner / budget owner | scoped input and accountability | simple tasks, guidance, no finance-system complexity | “too complex for periodic contribution” | usability task completion and role-scoped prototype |

## Buying sequence hypothesis

```text
Operational pain / executive sponsor
→ workflow validation with controller + FP&A
→ IT/security architecture review
→ commercial / procurement review
→ paid pilot with defined outcome
→ enterprise rollout decision
```

This is a hypothesis. Some enterprises invert or repeat stages; research must record the actual process per account.

## Required role-specific proof pack

| Proof pack | Audience | Contents |
|---|---|---|
| Decision value | CFO / VP Finance | baseline/cost, decision workflow, materiality/evidence demo, outcome metrics |
| Close control | Controller / auditor | reconciliation, certifications, exceptions, SoD, lock, evidence export, lineage |
| Analyst productivity | FP&A | model workspace, formula/paste/version/conflict, Excel/data migration, performance |
| Security / architecture | IT/security | deployment, data flow, SSO/RBAC/RLS, encryption, audit, offline boundary, DR |
| Commercial | Procurement/legal | scope, implementation plan, pricing logic, SLA/support, privacy, exit/portability |

## Research interview decision questions

1. Who can champion, block, sign, and operate this purchase?
2. What evidence must each role see before the opportunity advances?
3. Which workflow creates the first credible internal business case?
4. What security/deployment requirement is a hard gate versus a negotiable preference?
5. What implementation failure would cause the organization to abandon the initiative?
6. What incumbent, internal build, or spreadsheet workaround is the true alternative?

## Design consequence

The product cannot optimize only for the CFO dashboard. The same underlying financial claim must be viewed differently, under the same policy and lineage, by executive, controller, analyst, security reviewer, and auditor.