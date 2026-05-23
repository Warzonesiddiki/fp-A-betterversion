---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, engine, compliance, audit, sox]
status: current
---

# Compliance & Audit Engines

## ComplianceEngine (169 lines)

**File:** `src/engines/ComplianceEngine.ts`

Integrates with [[auth-rbac]] for role-based access validation and SOX segregation of duties checks.

### API

| Method | Purpose |
|--------|---------|
| `checkSegregationOfDuties(userId, roles)` | Detect conflicting role pairs (approver+requester, admin+auditor, creator+approver) |
| `generateComplianceReport(userId, roles, dataAccess, workflows)` | Full compliance score (0-100) with checks |
| `validateAccess(userId, resourceType, action, userRole)` | RBAC access validation |
| `checkDataRetention(dataDate, retentionDays)` | Data retention policy check |
| `getRetentionPolicy(resourceType)` | Default retention days per resource type |

### Compliance Categories

- **SOX** — segregation of duties, audit trail
- **ACCESS** — role-based access control
- **DATA** — retention policies, data classification
- **WORKFLOW** — approval chains, authorization

### Conflicting Role Pairs

- `approver` + `requester` = FAIL
- `admin` + `auditor` = FAIL
- `creator` + `approver` = FAIL

## AuditEngine (176 lines)

**File:** `src/engines/AuditEngine.ts`

### API

| Method | Purpose |
|--------|---------|
| `log(params)` | Create audit entry with userId, action, resource, old/new values, severity |
| `query(filters)` | Search by date range, userId, resourceType, severity, limit |
| `exportCSV(filters)` | Export audit trail as CSV string |
| `clear()` | Clear all entries (testing only) |
| `getStats()` | Count by severity (info/warning/critical) |

### Severity Levels

- **INFO** — routine operations
- **WARNING** — suspicious but allowed
- **CRITICAL** — policy violations

### Integration Points

- Wired to `AuditTrailPage` for UI display
- Used by `ComplianceEngine` for audit trail checks
- Used by store actions for mutation logging
- [[plugin-system]] can extend with custom compliance rules
