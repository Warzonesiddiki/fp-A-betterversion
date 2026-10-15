# Product and Architecture Decision Log

Record decisions here so brainstorming does not silently become implementation policy.

On 2026-10-16 the owner delegated project decisions ("auto take best decision for the project"). The accepted choices below are conservative technical defaults, not claims of shipped functionality, real-export verification, legal approval or user research. Target decisions marked pending require implementation and evidence before release.

| ID | Date | Decision | Status | Rationale/evidence | Alternatives considered | Owner | Requirements/docs affected | Review trigger |
|---|---|---|---|---|---|---|---|---|
| DEC-001 | 2026-10-16 | First slice: mapped, single-currency GL journal CSV with account code, posting date and debit/credit columns. D365-specific adapter deferred until a real anonymized export is available; generic CSV must not be advertised as verified D365 support. | Accepted — technical scope; external schema unverified | Existing upload path and synthetic fixtures are executable; source-system/company/currency must remain explicitly unavailable when absent. | Guess a D365 schema; build every connector | Agent, delegated by owner | FR-001–FR-004 | Real export or legal-entity/currency requirements |
| DEC-002 | 2026-10-16 | First outcome: import → control-total reconciliation → trial balance/source drill-down → period close. Freeze expansion into new domain features until Gate 2 passes. First exception category: reconciliation differences, not AI-inferred errors. | Accepted | A trustworthy ledger spine is more valuable than more incomplete screens. Existing screens retained; no destructive pruning. Metric/sign/rounding contracts still require independent examples. | More forecasting screens; AI-first review | Agent, delegated by owner | FR-007–FR-009, roadmap | Gate 2 evidence and first real workflow |
| DEC-003 | 2026-10-16 | Local-first financial data; no automatic financial-data egress, telemetry or external AI by default. External connections require explicit user initiation and a documented destination/data boundary. | Accepted — target, enforcement pending | Sensitive financial data; current Sentry/PWA egress means offline compliance cannot yet be claimed. Do not silently enable a provider. | Cloud-first; automatic telemetry | Agent, delegated by owner | NFR-003, AI-001 | Deployment or provider change |
| DEC-004 | 2026-10-16 | First desktop target is local single-user, OS-protected workspace; no bundled Express sidecar or mandatory hosted login. Keep existing auth in place until a reviewed local-session design and tests replace it; no blanket RBAC bypass. | Accepted — target, implementation pending | Current desktop sign-in dependency is broken; adding a server increases attack surface and deployment burden. OS protection is not application encryption or team authorization. | Sidecar server; mandatory hosted backend | Agent, delegated by owner | NFR-003, R-008; AUD-010 | Team use, shared devices or hosted deployment |
| DEC-005 | 2026-10-16 | Target financial system of record: local relational SQLite with transactional imports and migrations. Existing persisted stores remain the current authority until a verified adapter, migration/rollback and backup-restore tests pass. No new dual-write path. | Accepted — target, migration blocked on native verification | Row-level provenance and transactional constraints fit financial data; native toolchain is currently unverified, so changing authority now risks data loss. | Keep blobs permanently; server database | Agent, delegated by owner | FR-001–FR-006, NFR-001 | Runnable native CI and migration rehearsal |
| DEC-006 | 2026-10-16 | `docs/discovery/` owns product decisions; `docs/audit/` owns findings; `docs/agent/` owns measured implementation guidance. Machine-read docs stay in place. Legacy plans are superseded, not automatically moved/deleted; archive only after reference checks. | Accepted | Stops competing roadmaps without breaking links, automation or historical evidence. | Bulk archive; keep competing plans authoritative | Agent, delegated by owner | AUD-014, agent index | New plan or automated documentation consumer |
| DEC-007 | 2026-10-16 | Any upstream row-parse rejection aborts the entire import file before financial state changes. Return source-row reasons; correct and retry. No successful partial batch for malformed rows. Existing duplicate-row policy remains explicit and separately reviewed. | Accepted — implemented on branch | A balanced remainder can still omit a complete journal; balance alone cannot prove completeness. Failed attempts must not consume the file hash. Durable rejected-attempt history is not yet implemented. | Silently skip malformed rows; opt-in partial import | Agent, delegated by owner | FR-002, UX-002, glStore import contract | Duplicate-policy review or approved exception workflow |
| DEC-008 | 2026-10-16 | Closed periods must block financial writes. Corrections require an explicit authorized reopen with an audit reason, not a warning-only override. Apply to all write surfaces, including import, edit, delete and undo. | Accepted — implementation pending | A close is not meaningful if another write path can bypass it. Requires one period identity/lock authority and comprehensive tests before claiming enforcement. | Warn only; hidden administrator bypass | Agent, delegated by owner | FR-005, period-close workflow | Period identity and reopen audit contract validated |


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
