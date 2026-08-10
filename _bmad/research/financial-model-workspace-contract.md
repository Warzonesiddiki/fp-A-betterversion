# Financial Model Workspace Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Define the analyst-grade modeling experience and authoritative behavior required before migrating budget/forecast grids.  
> **Depends on:** financial-metric-lineage-model.md · materiality-decision-policy-model.md

## 1. Product promise

The Financial Model Workspace gives analysts spreadsheet-speed interaction without spreadsheet ambiguity. It must preserve the reason a value exists, who changed it, whether it is authoritative, and what downstream plans/reports/decisions it affects.

It is not an attempt to clone every Excel feature. Every interaction must either accelerate a governed finance job or remain out of scope.

## 2. Workspace anatomy

```text
[Global Context: scope | period | version | scenario | currency | freshness]
[Model header: name | lifecycle | owner | base version | validation | submit/publish]
[View bar: dimensions | filters | hierarchy | saved view | comparison]
[Formula bar: cell/name | displayed/exact value | formula | validation | dependency state]
[Virtualized financial grid: hierarchy rows × grouped fiscal periods]
[Selection status: aggregate | edit mode | local queue | recalculation]
[Inspector: Overview | Formula | Dependencies | Evidence | Comments | Audit | Tasks]
```

## 3. Cell contract

A cell is a versioned financial input or calculation, not a naked number.

| Attribute | Requirement |
|---|---|
| Coordinate | stable model/dimension/period reference, not screen row index |
| Value | exact decimal plus display/rounding policy |
| Origin | manual, formula, driver, imported, allocation, AI draft, adjustment |
| Formula | raw expression, parsed representation, formula-engine version, dependency references |
| Lifecycle | draft, submitted, approved, locked, superseded, conflict, invalid |
| Permission | view/edit/comment/approve determined server-side from context and policy |
| Revision | authoritative revision; base revision required for mutation |
| Evidence | actor, reason, source, audit event, decision/task links |
| Validation | error/warning/info state, rule, affected range, resolution |

## 4. Interaction rules

### Required analyst interactions

| Interaction | Required behavior | Prohibited behavior |
|---|---|---|
| Navigate | arrows, Tab/Shift+Tab, Enter/F2, name box, jump-to-error; announces selection | keyboard trap or mouse-only operation |
| Edit | type formula/value; show parse/validation before commit; preserve exact value | implicit rounding, silent coercion, hidden formula replacement |
| Paste / fill | preview range, number of changed/invalid/locked cells; explicit confirm when policy requires | partial silent paste or overwrite locked/published data |
| Undo / redo | command-based, scoped to actor/session/draft; explain unavailable undo | undoing another user’s approved/published state |
| Filter / hierarchy | saved views, expand/collapse, freeze panes, grouped periods | losing global context silently |
| Formula inspection | formula, dependencies, precedent/dependent navigation, circular-reference state | “black box” calculated cells |
| Comment | scoped cell/range thread, mentions, resolution, attachment policy | comments detached from model/version/context |
| Drill-through | source/metric/evidence permitted by entitlement | disclosure of restricted facts through aggregate cell |
| Submit / approve / lock | show impacts, policy, approver, warnings, required rationale | client-only lifecycle changes |

## 5. Formula and dependency safety

- Formula grammar/version is explicit and stored with parsed form; formula text alone is not the authoritative semantic record.
- Dependencies are a directed graph with cycle detection before calculation/publish.
- Circular references are blocked by default. If a future approved iterative model exists, it must define convergence, max iterations, tolerance, owner, and audit evidence.
- Calculation errors include code, explanation, affected references, and recovery path. Never replace error with zero.
- Formula/driver/model engine version is retained with calculation run/snapshot lineage.
- Formula suggestions from AI remain draft content and require user review/validation; AI cannot silently write a model.

## 6. Version, scenario, and lifecycle contract

```text
Draft → Submitted → In Review → Approved → Locked → Superseded / Archived
```

| Event | Required behavior |
|---|---|
| Create version | select base, scope, calendar, owner, purpose, assumptions; record lineage |
| Branch scenario | explicit base version, overrides, reason, owner; does not mutate base |
| Submit | validate model, unresolved errors, policy requirements, affected scope, reviewer route |
| Approve | SoD/policy check, approval evidence, freezes approved input set |
| Lock | server rejects UI/API/import/offline edits; adjustment path is distinct and traceable |
| Supersede | preserve access to prior published/certified versions and report links |

No latest-state display may silently substitute a different version than the one used by a decision or report snapshot.

## 7. Collaboration and conflict

### Presence is not authority

Presence/cursor indicators are optional later capability. They never replace revision/concurrency/policy control.

### Conflict outcomes

| Situation | Outcome |
|---|---|
| Same draft cell edited from two sessions | server detects base-revision conflict; UI shows both values/formulas/actors/times and requires resolution |
| Separate non-overlapping cells edited | commands may merge if policy permits |
| Comment updates | thread merge with immutable message/event history |
| Cell becomes locked while offline | queued command rejected with lock reason and recovery path |
| Published/approved input changed | rejected; create permitted adjustment/new version instead |
| Imported actual replaces source | new import/version lineage, never silent mutation of published result |

## 8. Offline queue contract

Each queued mutation includes command ID, model/cell identity, base revision, encrypted payload reference, actor/device session, created time, retry state, and context. UI displays queued count, age, failures, and statement: **“Queued changes are not official until accepted by the Control Plane.”**

- Commands are idempotent.
- Retry does not change actor, policy context, or base revision.
- A rejected/conflicted command remains visible until resolved/discarded with audit event.
- Offline mode cannot submit, approve, lock, certify, or publish official state.

## 9. Performance and accessibility contract

| Requirement | Target / behavior |
|---|---|
| Initial usable grid state | p95 ≤3 sec at approved reference workload |
| Scrolling | virtualized; no loss of selection/focus/context |
| Recalculation | progress and stale/pending state; never present in-progress result as final |
| Keyboard | full core grid path; visible focus; selection announced appropriately |
| Screen reader | row/column/cell label, formula/value/state/error/locked status accessible on selection |
| Contrast / status | WCAG 2.2 AA; text/icon/pattern supplement color |
| Motion | no motion required for meaning; reduced-motion honored |
| Responsive | complex editing desktop-first; smaller breakpoints offer review/approval or explicit limited-mode policy |

## 10. Security and audit contract

- Server evaluates tenant/entity/dimension/lifecycle permission before every command and every drill-through.
- Every mutation includes actor, correlation ID, base revision, before/after secure diff reference, reason where policy requires, time, and audit event.
- Bulk operations record total requested, accepted, rejected, invalid, locked, and conflict counts plus per-cell evidence references.
- Formula text, comments, attachments, and dimensions are classified and redacted based on entitlement.
- No browser/desktop store is an official source of truth.

## 11. Acceptance evidence before implementation

1. Observe at least five analysts change a forecast/driver from source to submission; validate this contract against their real behavior.
2. Compare paste/formula/undo/error/approval tasks with their current spreadsheet workflow; record friction and non-negotiables.
3. Test a conflict and offline recovery prototype with analysts/controllers.
4. Validate lock/adjustment/SoD behavior with controller/audit stakeholders.
5. Meet performance, keyboard, screen-reader, currency, formula, lineage, and authorization test requirements on reference data.

## 12. Explicit non-goals

- Full Excel macro/VBA compatibility.
- Unbounded arbitrary spreadsheet features with no finance/control use case.
- Last-write-wins for official financial facts.
- Autonomous AI edits/publishing.
- Claiming mobile parity for complex modeling.
