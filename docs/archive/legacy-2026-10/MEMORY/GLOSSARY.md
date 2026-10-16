---
id: MEMORY/GLOSSARY.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# GLOSSARY — precise language for THIS repo

| Term | Meaning here |
| --- | --- |
| **OmniPlan** | Product name in the Codex/blueprint. Code still says *FinPlan Pro* in places. |
| **Codex** | `MASTER HANDOVER PROMPT.txt`, kernel laws K1–K20. Governs everything. |
| **Blueprint** | `.agent/BLUEPRINT.md`, LOCKED. Generated from `.agent/blueprint-parts/`. |
| **Money-AST ratchet** | `scripts/money-ast-detector.mjs` + baseline; counts unsafe IEEE-754 operations on currency values. Pre-push gate 9b. |
| **Fabrication ratchet** | `scripts/fabrication-detector.mjs` + baseline; counts hand-typed displayed financial literals. Pre-push gate 9c. |
| **Unsafe op** | An arithmetic/compare/round operation on a money-typed expression not routed through `src/utils/money.ts`. |
| **Fabrication** | A financial figure rendered to a user that no ledger produced. |
| **Source guard** | A per-module test that fails if a specific defect pattern reappears in the source text (comments stripped). |
| **Teeth** | Proof a test would fail against the bug: revert the production file from `/tmp`, watch the test fail, restore. |
| **Escape** | A Core-20 monthly-cycle workflow that forces the user back to Excel/another tool. Section 24 ledger. |
| **SHI / UVI / DEI** | System Health, User Value, Domain Excellence indices. Phase 3 targets ≥92 / ≥95 / ≥95. |
| **Derivation module** | A `*Data.ts` / `*Model.ts` file holding a page's money math on decimal.js, unit-tested with known answers. |
| **Empty-state** | The UI a surface must render when the GL cannot support a figure. Never a zeroed or estimated stand-in. |
| **Natural balance** | revenue = credit − debit; cost/asset = debit − credit. Never `Math.abs`. |
