# S54 — Architecture

**Date:** 2026-07-25

## 1. Context
Off-thread simulation.

## 2. Components
- `src/workers/monte-carlo.worker.ts`, hook.

## 3. Data Model
- Worker messages: `{type:'run'|'progress'|'result'|'cancel'}`.

## 4. Interfaces
- `postMessage(run)`, `onmessage(progress/result)`.

## 5. Integration
- Uses S53; UI in S52/S55.

## 6. Testing
- Worker computes + cancel test.
