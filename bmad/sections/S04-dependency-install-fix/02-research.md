# S04 — Research

**Date:** 2026-07-25

## 1. Questions
- Why does `npm install` fail? What's the minimal fix?

## 2. Findings (verified in workspace)
- `npm install --legacy-peer-deps` fails:
  ```
  npm error path .../node_modules/onnxruntime-node
  npm error command failed: node ./script/install
  npm error ECONNRESET ... host: 'api.nuget.org'
  ```
- Root cause: `@huggingface/transformers@^4.2.0` depends on `onnxruntime-node`, whose postinstall downloads a native binary from `api.nuget.org`; the sandbox resets the TLS connection.
- The 2026-07-23 "Phase 0 complete" report only worked via `npm ci --ignore-scripts --prefer-offline` (skips the broken postinstall + needs warm cache). Not reproducible fresh.

## 3. Options
- Remove `@huggingface/transformers` from `dependencies` → base install no longer needs nuget. ✅ simplest, robust.
- Move it to `optionalDependencies` + dynamic `import()` guarded by a capability check. ✅ keeps AI feature, install stays clean.
- Pin `onnxruntime-node` to a CDN-working version. ⚠️ fragile.

## 4. Decision
- Remove from hard `dependencies`; relocate AI model usage to an optional, lazy module with fallback. Add `.npmrc` (`omit=optional` for reproducible base; CI caches).

## 5. Risks
- AI features (NLQChat, AICopilot) must degrade gracefully when the optional module is absent.
