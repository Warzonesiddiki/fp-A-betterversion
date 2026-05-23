---
date: 2026-05-19
type: feature-doc
project: FinPlan Pro
tags: [finplan-pro, auth, rbac, security, jwt]
status: complete
---

# Auth & RBAC System

## Overview
authStore (333 lines) with 5 roles, JWT handling, brute force protection, and Zustand persist middleware.

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access (all CRUD, user management, settings, encryption) |
| **FP&A_Manager** | Budget/forecast/scenario CRUD + approve, reports, read-only GL/entity/users |
| **Analyst** | Budget/forecast/scenario CRUD, reports, read-only GL/entity |
| **Department_Head** | Budget create/read, read-only forecast/scenario/reports/GL/entity |
| **Viewer** | Read-only: budget, forecast, scenario, reports |

## Permission Matrix (24 permissions)
- `budget:create/read/update/delete/approve`
- `forecast:create/read/update/delete`
- `scenario:create/read/update/delete`
- `report:create/read/update/delete`
- `gl:create/read/update/delete`
- `entity:create/read/update/delete`
- `user:create/read/update/delete`
- `settings:create/read/update/delete`
- `audit:read`
- `encryption:create/read/update/delete`
- `export:create`

## Security Features
- **Brute force protection**: 5 failed attempts → 15-minute lockout
- **JWT generation**: Header + payload + mock signature (offline mode)
- **Token refresh**: `refreshAccessToken()` generates new access token
- **Partial persistence**: Only non-sensitive fields persisted (user, isAuthenticated, activeEntityId)
- **No passwords stored**: Offline mode accepts any password for mock users

## Helper Functions
- `hasPermission(user, permission)` — Check single permission
- `hasAnyPermission(user, permissions[])` — Check any of N permissions
- `hasAllPermissions(user, permissions[])` — Check all of N permissions
- `isRole(user, ...roles)` — Check role match
- `isManagerOrAbove(user)` — Admin or FP&A_Manager
- `canApprove(user)` — Admin or FP&A_Manager

## Mock Users (offline mode)
- `admin@finplan.com` — Admin role
- `analyst@finplan.com` — Analyst role
- `viewer@finplan.com` — Viewer role

## ProtectedRoute
Component-level route protection with role-based access control.

## Related
- [[compliance]] uses auth roles for SOX segregation of duties checks
- [[onboarding]] wizard assigns initial user role
- Audit log entries include userId for [[compliance]] tracking
