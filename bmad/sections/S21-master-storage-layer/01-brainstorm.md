# S21 — Brainstorming: Master Storage Layer

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- All stores persist through one abstraction; environment decides the backend.

## 2. SCAMPER
- **Confirm:** `masterStorage` (IndexedDB + SQLite routing) exists.
- **Add:** graceful quota handling + fallback; typed get/set.
- **Modify:** ensure every store uses it.

## 3. Ideation
- `masterStorage` wraps IndexedDB (web) / SQLite (Tauri).

## 4. Selected Directions
1. Harden `masterStorage`: quota handling, fallback, versioning hook.
2. Audit 40 stores use it.

## 5. Open Questions
- Encryption at rest? (→ S95.)
