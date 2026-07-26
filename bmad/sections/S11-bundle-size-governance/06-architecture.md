# S11 — Architecture

**Date:** 2026-07-25

## 1. Context
Size governance.

## 2. Components
- `scripts/bundle-check.js`, CI step, `App.tsx` lazy audit.

## 3. Data Model
- N/A.

## 4. Interfaces
- bundle-check → exit code.

## 5. Integration
- Called by S10 CI after build.

## 6. Testing
- Artificial oversize → bundle-check fails (negative test).
