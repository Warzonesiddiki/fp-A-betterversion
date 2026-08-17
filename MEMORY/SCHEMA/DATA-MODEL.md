---
id: MEMORY/SCHEMA/DATA-MODEL.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: medium
---

# SCHEMA/DATA-MODEL

## Desktop (Tauri) SQLite — `src-tauri/migrations/`

`001_initial_schema.sql` + `002_cube_schema.sql` create **35** tables (names verified by grep):

```
entities departments accounts gl_entries budgets budget_line_items audit_trail
kv_store scenarios scenario_line_items forecasts forecast_periods
forecast_line_items reports report_templates notifications
collaboration_comments collaboration_tasks documents esg_data custom_fields
custom_field_values currency_rates fiscal_periods workflows workflow_steps
user_preferences recent_activity stores cube_cells cube_dimensions cube_cubes
cube_history cube_snapshots cube_snapshot_diffs
```

## Server — `server/src/db/`

`schema.ts` composes DDL helpers (`createAuthTables`, `createPeriodCloseStateTable`,
`ensureCanonicalAuditTrail`, `ensureServerColumns`, `createAuditTables`, `ensureEntityAccessTable`)
and also runs the Tauri migrations directory (`MIGRATIONS_DIR` resolves to
`src-tauri/migrations`). The historical "9 server DDL tables vs 35 Tauri tables" fork is tracked in
`PRODUCT/GAPS.md`; exact current server-only table list is **UNVERIFIED** this session.

## Tenancy

- [MEASURE 2026-08-18] `grep -ric tenant server/src/db/*.ts` → **0 hits in every file**.
  There is no `tenant_id` / `environment_id` column anywhere in the server DB layer.
  This blocks Phase 0 exit (INV-010).

## Client-side persistence (de-facto system of record today)

- 44 Zustand stores in `src/store/`, **41** of which call `persist(` (localStorage).
  Financial truth (GL entries, budgets, scenarios, sector data) lives there.
