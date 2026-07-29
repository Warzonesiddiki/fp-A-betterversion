# Role-Based Access Control (RBAC) Architecture

## Overview

FinPlan Pro enforces multi-layered RBAC across both client UI and server API endpoints.

## Layers

- **Global Roles**: Admin, FP&A Manager, Analyst, Department Head, Viewer.
- **Entity Scope**: Granular entity-level permissions via `user_entity_access` table (viewer, analyst, manager, admin per entity).
- **Enforcement**: Server middleware (`authMiddleware`, `requireRole`, `requireEntityAccess`, `requireEntityWriteAccess`) ensures zero reliance on client-side state manipulation.
