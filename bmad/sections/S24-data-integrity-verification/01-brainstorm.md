# S24 — Brainstorming: Data Integrity Verification

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Stored data must be verifiable and versioned; corruption must be detectable.

## 2. SCAMPER
- **Add:** integrity checksum per snapshot; schema version checks.
- **Modify:** masterStorage records version.

## 3. Ideation
- On load, validate version + checksum; alert/repair if mismatch.

## 4. Selected Directions
1. Integrity check util + schema version gate.
2. (Supports S23 backup trust.)

## 5. Open Questions
- Auto-repair or just warn? (warn + offer restore.)
