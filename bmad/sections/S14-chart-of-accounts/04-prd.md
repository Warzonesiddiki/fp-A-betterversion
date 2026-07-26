# S14 — PRD

**Date:** 2026-07-25

## 1. Overview
Chart of Accounts CRUD + CSV + safe deletion.

## 2. FRs
- FR-1: Add/Edit/Deactivate (soft delete) accounts.
- FR-2: Parent/child hierarchy display + validation.
- FR-3: Type, normal balance, category validation.
- FR-4: Import/Export CSV.
- FR-5: Soft-delete guard — block deactivate if account used in GL (via `useGLStore`).

## 3. Acceptance
- Deactivating a used account is blocked with reason; CSV round-trips.

## 4. Out of Scope
- Multi-entity CoA (→ S70).

## 5. Dependencies
- S12.
