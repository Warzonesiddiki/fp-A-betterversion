# S25 — Architecture

**Date:** 2026-07-25

## 1. Context
Change tracking.

## 2. Components
- `src/utils/changeLog.ts`, store middleware hook.

## 3. Data Model
- `Change { ts, store, op, payload }`.

## 4. Interfaces
- `logChange(change)`, `replay(log)`.

## 5. Integration
- Hooks stores; feeds S83 audit.

## 6. Testing
- Log + replay equals state.
