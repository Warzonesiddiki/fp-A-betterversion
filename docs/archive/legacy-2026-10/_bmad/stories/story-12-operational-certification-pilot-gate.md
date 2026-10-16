# Story 12: Operational Certification and Pilot Gate

> **File history:** legacy DRAFT story; research-contextualized 2026-08-11 (BMAD v5.0 + solo-dev evidence re-baseline). Maps to P-track **P-07** (pilot operations/security certification).

## Status: BLOCKED — pending R-04 pilot/segment selection (T-09), Tier-2 beta evidence (T-07), and the F-05 browser-beta + hosting decisions (T-06). Research-contextualized, NOT approved for implementation.

## Size: L | Risk: HIGH

## Why This Story Exists

Fulfils PRD E8 and the Release 1 definition. It certifies the supported public-beta journey before any customer-facing claim: SLOs, backup/restore, tenant isolation, accessibility, performance, and an evidence pack for the release gate. A check that cannot run is UNVERIFIED — this story is where the Capability Truth Matrix gets its honest evidence rows.

## Research Context

- The operations-reliability contract defines SLO/alerting/runbook/support-bundle expectations and RPO/RTO evidence (`../research/operations-reliability-contract.md`); the identity/security contract defines tenant-isolation verification.
- Solo-dev re-baseline: the pilot is the first public-beta segment selected by R-04 (not an enterprise customer); deployment/residency (A-08/A-09) and browser-support level (A-12) remain UNVALIDATED — certification must be labeled against the ACTUAL environment (e.g., hosted beta with local data labels), never against an assumed enterprise deployment.
- CI is currently blocked by the GitHub account billing block (E-005); release pipeline checks stay defined but their evidence can only be recorded when jobs run (T-14/T-15).

## Dependencies

- Requires: Stories 04–11 DONE; hosting/domain decision (T-06); CI billing resolution (T-14).
- Files to inspect/modify: CI workflows/scripts, deployment/monitoring/runbooks, E2E/performance/security test suites, capability matrix.

## Acceptance Criteria

- [ ] SLO dashboards, redacted tracing/logging, alert/runbook and support bundle cover API/import/close/report/sync paths.
- [ ] Backup/restore drill meets RPO/RTO and has retained evidence.
- [ ] Full critical-journey E2E, accessibility, performance/load, dependency/security and tenant-isolation checks pass in the release environment.
- [ ] Capability matrix marks only evidence-supported pilot journeys Enterprise-ready; unsupported routes remain correctly labeled.

## Technical Guidance

A check that cannot run is UNVERIFIED — record it as such. The build/release pipeline must block production on mandatory evidence. Document known limits and rollback.

## Out of Scope

- Claiming enterprise certification (A-01/A-13 UNVALIDATED); browser/PWA support claims (A-12 UNVALIDATED); committing to deployment/residency targets without evidence; AI autonomy.

## Definition of Done

- [ ] Pilot readiness review, QA certification, G6/G7 approval completed.
- [ ] Executive release gate has an evidence pack and a go/no-go decision.
- [ ] Capability Truth Matrix rows updated only with real evidence; project context updated.
