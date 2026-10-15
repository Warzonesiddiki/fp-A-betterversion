# Product and Architecture Decision Log

Record decisions here so brainstorming does not silently become implementation policy.

| ID | Date | Decision | Status | Rationale/evidence | Alternatives considered | Owner | Requirements/docs affected | Review trigger |
|---|---|---|---|---|---|---|---|---|
| DEC-001 | TBD | First supported Dynamics 365 export and data scope | Proposed | Must be based on actual export and workflow discovery | TBD | TBD | FR-001–FR-004 | Export format or workflow changes |
| DEC-002 | TBD | First FP&A view and exception-review use case | Proposed | Select the highest-value task that can be validated | TBD | TBD | FR-007–FR-009 | User research or calculation findings |
| DEC-003 | TBD | Data storage and external-service/AI policy | Proposed | Depends on sensitivity, deployment, and company policy. Evidence: Sentry and PWA update egress are present in the target today; the README previously claimed "fully offline". | Local-only; approved cloud; no AI | TBD | NFR-003, AI-001 | Deployment or provider changes |
| DEC-004 | TBD | Authentication and offline model for the desktop app | Proposed | Verified 2026-10-15: production desktop build cannot sign in without the Express server, which no client code calls and which is not bundled (AUD-010). Options: (a) local-only single user, no login, OS-level protection; (b) bundle/sidecar the server; (c) require a hosted server. | a / b / c | TBD | NFR-003, R-008; audit P0-3 | Multi-user or hosted deployment |
| DEC-005 | TBD | Store of record for financial data | Proposed | Verified: app persists JSON blobs of whole stores in a KV table; the 35-table relational schema is unused; three unreconciled schema homes (AUD-009). Provenance and idempotency (FR-002/003/005) need row-level tables. | Keep blob store; adopt relational SQLite via existing migrations; server DB | TBD | FR-001–FR-006, NFR-001 | Before Gate 2 slice starts |
| DEC-006 | TBD | Plan-of-record documents | Proposed | Verified: 464 Markdown files and 15+ competing plans (AUD-014). Proposal: `docs/discovery/` (this pack) + `docs/audit/` are authoritative; everything else moves to `docs/archive/` with a one-line index. | Keep all; archive all but pack | TBD | audit P0-4 | Any new plan document |

## Decision template

- **ID / Date:**
- **Decision and status:** Proposed / Accepted / Rejected / Deferred
- **Context / problem:**
- **Evidence:**
- **Options and trade-offs:**
- **Decision rationale:**
- **Owner / approver:**
- **Affected requirements, architecture, UX, and tickets:**
- **Risks / assumptions:**
- **Review trigger or date:**
