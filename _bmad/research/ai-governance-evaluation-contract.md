# AI Governance & Evaluation Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Make AI useful to finance without allowing it to become untraceable financial authority.

## Policy

AI may retrieve permitted context, explain, summarize, draft, classify, forecast-assist, and propose actions. AI may not post journals, alter official data, certify, lock, publish, approve, or change access without an explicit human command and the normal authoritative workflow.

## Required controls

| Area | Contract |
|---|---|
| Consent/policy | tenant-level enablement, approved provider/model list, data classes permitted, retention/residency rules |
| Retrieval | server-side entitlement filter before retrieval; least data; no cross-tenant/vector leakage |
| Citations | every factual answer/narrative links to permitted source, metric/snapshot/context/version; unsupported claim is labelled hypothesis |
| Tools/actions | allowlisted typed commands; preview impact/context; explicit human confirmation; server policy/workflow still applies |
| Prompt/data safety | injection-resistant context boundaries, input/output filtering, secret/PII minimization, no general log of prompt/financial payload |
| Audit | actor, policy, model/provider/version, retrieval references, prompt classification/hash policy, response/action/citation and review outcome |
| Evaluation | curated finance tasks, citation precision, numerical consistency, permission-leak tests, harmful-action tests, human usefulness rating |
| Monitoring | quality/drift/cost/latency/refusal/citation failure and feedback telemetry |

## UX rules

AI content is visibly “AI-generated draft” until approved. The interface exposes source citations, financial context, confidence only when formally defined, limitations, feedback, and a safe alternative when the assistant cannot answer. It never presents generated narrative as certified close/report content.

## Release gate

A use case ships only after it passes task-specific evaluation, adversarial permission/prompt tests, finance-owner review, provider/privacy review, and rollback/kill-switch test. Autonomous finance actions are explicitly out of scope.
