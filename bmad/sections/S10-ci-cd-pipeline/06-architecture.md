# S10 — Architecture

**Date:** 2026-07-25

## 1. Context
Pipeline orchestration.

## 2. Components
- `.github/workflows/ci.yml`, (tauri job).

## 3. Data Model
- N/A.

## 4. Interfaces
- GitHub Actions → runners.

## 5. Integration
- Calls S08/S09/S93/S07/S11 gates.

## 6. Testing
- Pipeline runs green on a known-good commit.
