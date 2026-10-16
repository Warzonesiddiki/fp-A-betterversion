---
id: MEMORY/PRODUCT/ROADMAP.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# PRODUCT/ROADMAP

**Current: Phase 0 / Wave W0.1.1** — money safety + de-fabrication.

Each session does BOTH the next money-AST module AND the next fabrication file.

## Phase 0 exit gate (all must hold)

- AST money safety **≥90%** (now 80.05%)
- No IEEE-754 money persisted
- PERSISTENCE_MAP drift-checked with `glStore` authoritative (W0.8)
- Schema equality gate (Tauri vs server)
- `tenant_id` / `environment_id` + per-table leak test
- Runtime three-statement gate blocking writes
- Error registry · ≤40 routes + ⌘K · LLM chokepoint redaction
- Clean tsc / eslint / suite
- **SHI ≥78 · UVI ≥52 · DEI ≥60**

## Sequencing note

W0.8 (persistence authority) is sequenced **before** W0.2.

Longer-range waves live in `MASTER_ROADMAP.md` (waves 1–14; 1–6 done, 7 in progress) and
`.agent/BLUEPRINT.md` §18.
