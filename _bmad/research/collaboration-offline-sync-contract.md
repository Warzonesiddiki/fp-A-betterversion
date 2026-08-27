# Collaboration & Offline Sync Contract — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Preserve local productivity without creating ambiguous or unauthorized financial state.

## Authority rule

Local workspace state is encrypted draft/cache. The Control Plane is authoritative for official operations. Presence/cursors are convenience features, not concurrency or approval control.

## Command contract

Each local mutation carries command ID, actor/device session, base revision, model/object identity, context, encrypted payload reference, timestamp, retry state, and idempotency semantics. Server response is accepted/completed/conflict/rejected.

## Conflict policy

| Object                          | Resolution                                                    |
| ------------------------------- | ------------------------------------------------------------- |
| Comment/thread                  | merge messages with immutable event history                   |
| Independent draft fields/cells  | merge only if policy and revisions permit                     |
| Same financial cell             | explicit resolution UI with both values/formulas/actors/times |
| Published/approved/locked state | reject; adjustment/new version path only                      |
| Master data                     | authoritative review; never silent last-write-wins            |

## Collaboration rules

- Presence and cell locks are authenticated, tenant/scope filtered, expiring, and recoverable.
- A temporary editing lock informs peers but does not bypass revision checks.
- Offline UI states exact queue count, age, failure, conflict and “not official” status.
- Replay after reconnect preserves original command identity and is re-authorized against current policy/lifecycle.
- Events are resumable, ordered per aggregate where needed, idempotent, and redacted by entitlement.

## Validation

Network interruption, concurrent edit, stale revision, lock change, permission revocation, duplicate replay, published-state edit, and reconnect ordering are E2E and failure-injection cases. Local-first value must be validated with target IT/users before it drives commercial claims.
