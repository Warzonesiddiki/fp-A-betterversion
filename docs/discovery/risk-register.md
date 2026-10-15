# Initial Risk and Controls Register

**Status:** Preliminary. Risks are hypotheses for audit, not findings about current code.

| ID | Risk | Initial rating | Why it matters | Proposed control / evidence to seek | Status |
|---|---|---:|---|---|---|
| R-001 | Wrong, incomplete, or mis-scoped GL export is analyzed | High | Period/entity/account omissions can make downstream results misleading | Define export contract; validation, row counts, control totals, and reconciliation; test malformed/missing columns | **Present (Verified)** — no export contract; schema validation partial; see AUD-008 |
| R-002 | Duplicate/repeated import changes totals | High | Re-export or retry can double-count entries | Stable file/import identity and documented duplicate policy; integration test repeated import | **Present (Verified)** — no file/batch identity; re-import appends |
| R-003 | Incorrect sign, period, currency, or rounding semantics | High | Financial statements and variances may be materially wrong | Document domain rules; independent expected-value fixtures; edge tests and reviewer sign-off | Potential |
| R-004 | “Abnormal” entry is presented as definitely wrong | High | False positives can cause inappropriate correction or loss of trust | Explain rule/evidence; label as review candidate; require human disposition | Potential |
| R-005 | Missing data is shown as zero or plausible fabricated KPI | High | User may make decisions on false completeness | Data-availability contracts and metric catalog with prerequisites; tests for missing denominators | **Present (Verified)** — `number` amounts, no availability contract; 87 unwired KPI engines |
| R-006 | Displayed result differs from underlying stored/source data | High | UI can create false confidence | End-to-end source-to-screen tests and independent database/source recalculation for selected outputs | **Present (Verified)** — no provenance; UI reads blob-persisted store state, not a queryable store of record |
| R-007 | Sensitive financial data leaks through logs, exports, or LLM provider | High; confirm threat model | Finance records may be confidential | Data-flow inventory, logging review, explicit egress policy, redaction and provider approval as applicable | **Partially present (Verified)** — Sentry + PWA egress exist; no LLM egress by default; no data-flow inventory |
| R-008 | Unauthorized user reads or changes finance data | Scope-dependent | Impact depends on single-user vs team deployment | Establish user/deployment model; least privilege and authorization tests before multi-user release | **Unresolved (Verified)** — server auth exists but unwired; desktop cannot log in offline (DEC-004) |
| R-009 | Audit/review decisions cannot be reconstructed | Medium/High; scope-dependent | Investigations and approvals need context and accountability | Define event history for imports, rule results, edits, dispositions, exports; retention policy | Unknown |
| R-010 | AI commentary introduces unsupported numbers or meaning | High if AI is used | Fluent text can hide unsupported assertions | Defer AI until verified facts; constrain to approved values; validate claims; fallback and human review | Potential |
| R-011 | UI overload or poor exception workflow limits adoption | Medium | A correct backend may still fail to support close work | Observe workflow; usability tests; prioritize exception investigation and recovery states | Potential |
| R-012 | Scope expansion delays reliable first release | High | “All-in-one” can become unbounded feature accumulation | Define first workflow, non-goals, stage gates, and evidence-based expansion decisions | **Realised (Verified)** — 242 routes, 182 engines, 18 sector dashboards before one import-to-review path is proven |
| R-013 | Product claims exceed tested capability | High | “Detects wrong entries” or “reconciled” may imply guarantees not supported | Controlled terminology, acceptance criteria, explicit limitations, release review | **Realised, remediated on branch (Verified)** — README claims were false; rewritten and guarded by `docs:verify` |

## Immediate control posture (proposed)

Until the audit confirms implementation and controls, treat real financial data, AI egress, multi-user access, and autonomous action as **not approved for production use**. Use synthetic or explicitly authorized data for development. This is a prudent interim assumption, not a finding that the application currently leaks data or is insecure.

## Risk acceptance

Any accepted residual High risk requires a named owner, rationale, scope, compensating control, review date, and explicit release decision. Never downgrade a risk merely to meet a roadmap date.
