---
id: MEMORY/QUALITY/BENCH.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# QUALITY/BENCH — measured numbers only

| Metric | Value | Method | Date |
| --- | --- | --- | --- |
| Money-AST safety | 80.87% (703 safe / 167 unsafe modules, 453 unsafe ops) | `node scripts/money-ast-detector.mjs` | 2026-08-18 (post-019) |
| Fabrication findings | 45 across 16 files | `node scripts/fabrication-detector.mjs` | 2026-08-18 (post-019) |
| `npm install` | ~21 s, 1006 packages, 0 vulnerabilities | install log | 2026-08-18 |
| `npx tsc --noEmit` | 0 errors, ~45 s | direct run | 2026-08-18 |
| Full frontend suite | ~15 min (last known), fits in a 3 GB sandbox | session 002 journal | 2026-08-17 |
| SHI / UVI / DEI | UNKNOWN — not re-measured; targets SHI ≥78 · UVI ≥52 · DEI ≥60 for Phase 0 exit | — | — |
| Bundle size | UNKNOWN (`npm run bundle-check` not run this session) | — | — |
