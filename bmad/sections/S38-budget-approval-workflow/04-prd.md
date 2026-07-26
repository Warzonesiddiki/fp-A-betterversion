# S38 — PRD

**Date:** 2026-07-25

## 1. Overview
Budget approval + locking.

## 2. FRs
- FR-1: Submit → status InReview.
- FR-2: Approve → status Approved + auto-lock (blocks S37 edits).
- FR-3: Reject → status Draft + mandatory reason.
- FR-4: Admin manual lock/unlock.
- FR-5: All transitions audited (→ S83).

## 3. Acceptance
- Approved budget locked; reject blocked without reason; audit entries present.

## 4. Out of Scope
- RBAC nuance (→ S87).

## 5. Dependencies
- S34, S35, S83, S87.
