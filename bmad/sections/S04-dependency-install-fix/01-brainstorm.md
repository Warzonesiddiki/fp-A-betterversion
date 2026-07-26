# S04 — Brainstorming: Dependency Install Fix

**Date:** 2026-07-25
**Method:** First Principles · SCAMPER · Ideation Map

## 1. First Principles
- A "zero-compromise" repo must install cleanly from scratch (`npm ci` works). Today it **fails** on `onnxruntime-node`.

## 2. SCAMPER
- **Eliminate:** `@huggingface/transformers` (pulls `onnxruntime-node` native binary from nuget.org → ECONNRESET in sandbox). AI copilot can use a lighter path.
- **Substitute:** use a lazy, optional AI integration (dynamic import, optionalDependency) so install never blocks on a native binary.
- **Modify:** add `.npmrc` with `omit=optional` or `fetch-timeout` + `prefer-offline` for CI caching.

## 3. Ideation
- Option A: remove transformers entirely; AI features call a Tauri-side/HTTP endpoint only when configured.
- Option B: keep transformers but `optionalDependencies` + guard import; `npm ci` skips native download when absent.
- Option C: pin onnxruntime-node to a version with working binary CDN.

## 4. Selected Directions
1. **Adopt Option A+B:** move AI/transformers to optional, lazy-loaded, with graceful fallback; ensure base `npm ci` succeeds offline of nuget.
2. Add `.npmrc` hardening.

## 5. Open Questions
- Which features truly need on-device transformers? (NLQ chat, copilot). Keep them but optional.
