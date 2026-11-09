# Mission Glossary

This is a supplemental glossary for the 2026-11-04–05 architecture mission's proposed target model. The authoritative repository and product-domain glossary is [`docs/agent/10_GLOSSARY.md`](../agent/10_GLOSSARY.md). This file does not redefine implementation facts or accepted owner decisions. If a term overlaps, the repository glossary and accepted decision log take precedence; entries here describe target requirements unless explicitly labelled otherwise.

| Canonical term | Definition | Status note |
| --- | --- | --- |
| Accounting identity | Assets minus liabilities minus equity for an entity and period, subject to the approved accounting model and exact configured precision. | Target invariant; current coverage must be measured. |
| Account polarity | Declared debit-normal or credit-normal behavior, plus the favorable direction used for variance presentation. | Target metadata; do not infer it from a display sign. |
| Allocation conservation | The sum of allocations equals the original pool, with deterministic handling of minor-unit remainders. | Target invariant; implementation and oracle tests must be audited. |
| Canonical financial contract | The normalized finance-data shape that file mappings and provider adapters must share after validation. | Proposed contract; schema is not yet established by this glossary. |
| Cell coordinate | The complete dimensional address of a model value, including the applicable scenario, version, entity, account or metric, time, currency, and configured dimensions. | Target query and lineage concept. |
| Copy-on-Write (CoW) scenario | A scenario branch that references a parent model and stores only changed values until materialization or merge. | Proposed architecture; performance and conflict behavior require an ADR. |
| Cumulative Translation Adjustment (CTA) | The translation difference associated with converting foreign operations into a reporting currency, recorded according to the approved accounting policy. | Target accounting concept; exact policy and implementation need validation. |
| DAG calculation engine | A directed acyclic dependency graph of formulas, with incremental recomputation of affected downstream nodes. | Proposed design; not a statement about current engines. |
| Deterministic calculation | A calculation whose result is stable for identical inputs, definitions, configuration, and clock/randomness context. | Target test and engine property. |
| Email-focused audit-export redaction | Masking email-pattern values in audit-export `userId`, `approvalUserId`, and direct metadata strings, distinct from general PII classification. | Current bounded `redactPII` helper; JSON/CSV exports and the audit page's CSV use it, but nested values, display, logs, and other sinks are not comprehensively covered. |
| Entity | A legal or management reporting unit in the model's organizational hierarchy. | Target dimension; the currently supported single-user deployment does not prove multi-entity authorization. |
| Flow | A time-series measure aggregated across a period by summing its constituent values when its definition permits. | Target `TimeAggregationMethod`. |
| General Ledger (GL) | A source accounting ledger of posted or exported journal-line facts, including account, period/date, debit/credit or signed amount, and available source dimensions. | Source semantics vary by provider and export shape. |
| General stored-data pseudonymization | The proposed per-scope keyed tokenization of persisted personal identifiers, with controlled mapping for any approved re-identification. | The current pseudonymization document remains a SPEC; a bounded source search found no general module. Optional LLM egress email substitution is a separate FNV-1a transformation, not evidence of this target. |
| Industry pack | A versioned configuration of mappings, dimensions, calendars, drivers, formulas, metrics, workflows, tests, and reporting defaults for a reviewed industry scope. | Target concept; not an industry certification. |
| Intercompany (IC) elimination | An explicit consolidation adjustment that removes matched intercompany balances or activity at the appropriate common parent. | Target accounting workflow; matching and policy need separate evidence. |
| Lineage hash | A stable reference derived from the exact inputs, formula definition, and relevant model context used to produce a value. | Target citation concept; canonical encoding remains to be designed. |
| Master Data Management (MDM) | Controlled definition and mapping of accounts, entities, dimensions, members, hierarchies, and effective dates across source systems. | Target module scope. |
| Operating security control | A security control connected to the product path and effective at its claimed runtime or deployment boundary. | Audit grading term; a policy, helper class, isolated test, or config fragment alone does not prove operation or certification. |
| Ratio or rate | A measure whose parent-period value is recalculated from its aggregated numerator and denominator rather than summed or averaged as a percentage. | Target `TimeAggregationMethod`. |
| Sparse hypercube | A multidimensional model representation that stores populated coordinates or blocks rather than allocating every possible dimensional combination. | Proposed architecture; storage format and limits require evidence and an ADR. |
| Standalone `AuditLogger` vs. vault audit-sink interface | The concrete `src/services/AuditLogger.ts` class is an isolated in-memory helper; `SecretsVault` imports a distinct type-only `AuditLogger` interface from `src/services/interfaces.ts`. | No adapter or runtime implementation connecting the two was found; neither name alone establishes a product audit authority. |
| SOX compliance system | A product that claims to provide SOX compliance authority or certification. | Explicitly disclaimed by owner DEC-102; the local audit chain is client evidence, not SOX authority. Not a target requirement unless the owner reverses DEC-102. |
| Stock end | A point-in-time measure aggregated to a larger period using the ending observation, not a sum of period-end balances. | Target `TimeAggregationMethod`. |
| Stock start | A point-in-time measure aggregated to a larger period using the beginning observation. | Target `TimeAggregationMethod`. |
| Time-weighted average | A stock measure aggregated using duration-aware weighting over the underlying observations. | Target `TimeAggregationMethod`; weighting inputs must be defined. |
| Transaction time | When a fact or change was recorded in the system, with actor and audit context where available. | Target bi-temporal lineage requirement. |
| User-held recovery code | A one-time secret held by the user that locally wraps a per-install device key for recovery; it is not third-party escrow, and backup metadata is not auto-installed on restore. | Current owner decision DEC-101 (`docs/discovery/decision-log.md:163`); the reviewed recovery boot gate, OS-keychain mirror, and migration prompt remain open. |
| Valid time | The business period or effective interval to which a fact or configuration applies. | Target bi-temporal lineage requirement. |
| Versioned mapping template | A saved, user-controlled source-to-canonical mapping with an explicit version that can be identified on every import batch using it. | Target intake requirement; current UI profiles and separate universal template code must be reconciled. |

## Naming rule

Use these canonical terms in new specifications. Where existing source code or a prior accepted decision uses a different name, document the mapping and retain compatibility until a reviewed migration is approved.
