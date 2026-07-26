# S42 — PRD

**Date:** 2026-07-25

## 1. Overview
Budget-level permission scoping.

## 2. FRs
- FR-1: `can(user, 'edit'|'view', budget)` guard via S87.
- FR-2: Hide/edit-disable budgets outside user's scope.
- FR-3: Admin override.

## 3. Acceptance
- Unauthorized budget hidden/editable=false.

## 4. Out of Scope
- Role engine (→ S87).

## 5. Dependencies
- S34, S87.
