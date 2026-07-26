# S35 — PRD

**Date:** 2026-07-25

## 1. Overview
Budget list with workflow.

## 2. FRs
- FR-1: List budgets; create/duplicate/delete (with guard if locked/approved).
- FR-2: Status workflow: Draft→InReview→Approved→Locked (transitions guarded).
- FR-3: Filters (status, year, department) + search.
- FR-4: Submit/Approve/Reject actions with reason (→ S38).

## 3. Acceptance
- Locked budget cannot be edited/deleted; reject requires reason.

## 4. Out of Scope
- Grid editing (→ S37).

## 5. Dependencies
- S34, S38.
