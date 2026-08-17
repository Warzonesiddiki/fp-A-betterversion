# SECTION 13 — WORKFLOW & COLLABORATION ENGINE

## 13.1 Why this is a P0 concern, not a nicety

Finance work is not individual work. A budget is proposed, challenged, revised, approved,
and locked by different people with different authority. A close is a choreographed
sequence with owners and dependencies. A forecast is negotiated. If the software does not
model this, the work leaks back into email and spreadsheets — which is exactly the
displacement OmniPlan exists to end (K28).

Two of the fourteen P0 gaps live here: **F-WORKFLOW-008** (declarative state machines) and
**F-COLLAB-002** (money-safe concurrent editing).

## 13.2 Declarative workflow engine — F-WORKFLOW-008 (P0)

Workflows are **data, not code** (Part XXV). A workflow definition is a JSON state machine
stored in `workflow_definitions`, versioned, and validated on save.

```jsonc
{
  "code": "budget_approval",
  "version": 3,
  "initial": "draft",
  "states": {
    "draft": {
      "on": { "SUBMIT": { "target": "in_review", "guard": "isOwner && passesValidation" } },
    },
    "in_review": {
      "on": {
        "APPROVE": { "target": "approved", "guard": "hasRole('approver') && notSubmitter" },
        "REJECT": { "target": "draft", "guard": "hasRole('approver')", "requiresReason": true },
      },
      "sla": { "hours": 48, "onBreach": "escalate" },
    },
    "approved": { "on": { "LOCK": { "target": "locked", "guard": "hasRole('controller')" } } },
    "locked": { "final": true, "immutable": true },
  },
}
```

**Engine contract:**

```
WF1  Transitions execute server-side only. A client-declared state change is ignored.
WF2  Every guard is evaluated against server-held identity and policy, never client claims.
WF3  Every transition writes to workflow_transitions AND audit_log with actor, reason,
     timestamp, correlation id. No silent transitions.
WF4  `notSubmitter` is a first-class guard primitive — maker-checker is built in, not bolted on.
WF5  Reaching a state marked `immutable` locks the subject at the database level.
WF6  SLA breaches raise events (escalation, notification, dashboard signal).
WF7  A definition version is pinned to each instance. Changing the definition never
     retroactively alters in-flight instances.
WF8  Definitions are validated for reachability and deadlock before activation.
```

## 13.3 Maker-checker — F-CTRL-001 (P0)

Applies to: journal entries, budget submission and approval, forecast publication, period
close and reopen, metric certification, scenario locking, FX rate publication, role
grants, integration mapping changes, and data deletion requests.

Rules: the actor who creates cannot approve; approval requires an explicit reason for
anything reversing or overriding; approval authority is scoped by entity, amount
threshold, and account class; delegation is time-boxed and audited; and the entire
maker-checker matrix is server-enforced (Section 10.4 SoD).

## 13.4 Approval routing

Routing supports: sequential chains, parallel approvals with quorum (e.g. 2 of 3), amount
thresholds that add approvers, entity-hierarchy-derived approvers (approve up the org
tree), conditional branches, delegation during absence, and escalation on SLA breach.
Routing rules are configuration, not code.

## 13.5 Collaboration model — F-COLLAB-002 (P0)

**The governing rule (K27): collaboration must never corrupt numbers.**

OmniPlan deliberately does **not** use CRDT/OT free-for-all merging on financial cells.
Two analysts silently merging conflicting values into one cell is a correctness failure
dressed up as a feature.

```
CL1  Presence: users see who is viewing and editing, in real time. Always on.
CL2  Cell-level soft locks: editing a cell acquires a short-lived lease. A second
     editor sees "Priya is editing" and is blocked from a blind overwrite.
CL3  Optimistic concurrency: every write carries the version it read. A stale
     version is REJECTED with OMNI-CONFLICT-xxxx — never last-write-wins.
CL4  Conflicts are TYPED and surfaced: the UI shows both values, both authors,
     both timestamps, and requires an explicit human resolution.
CL5  Non-financial content (comments, narrative text, descriptions) MAY use
     collaborative text merging. Money never does.
CL6  Offline edits queue locally as DRAFT, are replayed as idempotent commands on
     reconnect, and any rejected command surfaces for resolution. Nothing is
     silently dropped and nothing is silently applied.
CL7  Bulk paste into a region acquires leases for the whole region atomically or
     fails cleanly — partial application of a paste is banned.
```

## 13.6 Comments, threads, and annotations

Comments attach to any addressable object: a cell, a row, a report, a scenario, a variance,
a metric definition, a workflow instance. Threads support @mentions (which notify),
resolution state, attachments, and are included in exports where relevant. A comment on a
cell is visible on hover in the grid alongside the audit trail — the number and the
conversation about the number live together.

## 13.7 Close orchestration (Part XXXIV)

The period close is a first-class workflow: a task list with owners, dependencies, due
offsets from period end, evidence attachment per task, blocking vs non-blocking
classification, real-time status, and a burndown view. The seven-step technical close
protocol (Section 6.7) is the terminal task of that workflow. Recurring close tasks are
templated per entity and rolled forward automatically each period.

## 13.8 Notifications (Part XLIII)

Channels: in-app, email, and webhook (Slack/Teams via webhook, not bespoke integrations).
Every notification is generated from a typed event, is deduplicated, respects per-user
digest preferences (immediate / hourly / daily), and is never the only record of something
important — the audit log is. Notification failures never block the underlying transaction.

## 13.9 Auditor role — F-WORKFLOW-007 (P0)

A dedicated read-only role with: full read of facts, lineage, audit log, workflow history,
and evidence artefacts; **no** write capability anywhere; scoped by entity and period;
time-boxed access grants; and its own access log. An auditor's session cannot be
distinguished from a normal read at the data layer — meaning the auditor sees exactly what
the system holds, not a curated view. Every auditor read is itself logged.
