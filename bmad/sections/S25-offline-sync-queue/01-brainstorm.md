# S25 — Brainstorming: Offline Sync Queue

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- Work offline; changes sync when connection returns (if cloud ever used).

## 2. SCAMPER
- **Add:** local change queue; replay on connect.
- **Modify:** only relevant if multi-device sync added later.

## 3. Ideation
- Queue mutations; flush on network; conflict = last-write-wins + log.

## 4. Selected Directions
1. Design offline queue abstraction (local-first; sync optional later).
2. (Low priority until cloud added.)

## 5. Open Questions
- Is cloud sync in scope? (Defer; local-first now.)
