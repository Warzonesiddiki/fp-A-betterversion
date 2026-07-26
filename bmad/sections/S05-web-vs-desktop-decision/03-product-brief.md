# S05 — Product Brief

**Date:** 2026-07-25

## 1. Vision
One FinPlan One app that runs in the browser and as a native desktop app — maximizing "never use another tool."

## 2. Target Users
- Finance teams (browser, zero-install) + power users (desktop, offline, native).

## 3. Problem & Value
- Problem: today the app is unusable in a browser despite README claiming web support.
- Value: real web+desktop reach; consistent UX.

## 4. Success Metrics
- App mounts in a browser (no alert/return null); desktop still works.

## 5. Scope Guardrails
- In: remove gate, feature-detect, graceful native degradation.
- Out: rebuilding Tauri shell (→ S97/S98).
