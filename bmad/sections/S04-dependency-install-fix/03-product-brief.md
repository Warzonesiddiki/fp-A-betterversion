# S04 — Product Brief

**Date:** 2026-07-25

## 1. Vision
`npm ci` succeeds in a clean environment — the foundation of trust and CI.

## 2. Target Users
- Every developer/agent; CI runners.

## 3. Problem & Value
- Problem: fresh install fails → nobody can build/test reliably.
- Value: reproducible installs → all later testing/CI works.

## 4. Success Metrics
- `npm ci` (and `npm install --legacy-peer-deps`) succeeds with no network to nuget.org.

## 5. Scope Guardrails
- In: fix install; optionalize AI native dep; `.npmrc`.
- Out: rewriting AI features (→ keep, make optional/lazy).
