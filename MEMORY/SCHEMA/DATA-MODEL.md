---
id: MEMORY/SCHEMA/DATA-MODEL.md
status: active
last_verified: 2026-08-22
verified_by: arena-agent/session-032
confidence: high
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
`MEMORY/PRODUCT/GAPS.md`; exact current server-only table list is **UNVERIFIED** this session.

## Tenancy

- [MEASURED 2026-08-22, session 032 / W0.2] Every tenant-data table now carries
  `tenant_id TEXT NOT NULL DEFAULT 'default'`; the governed model/fact surfaces
  (gl_entries, budgets*, scenarios*, forecasts*, reports, cube_cells/history/
  snapshots/diffs) also carry `environment_id TEXT NOT NULL DEFAULT 'dev'`.
  A `tenants` root table exists (seeded `default`). Registry + ratchet:
  `server/src/db/tenancy.ts` (TENANT_SCOPED_TABLES, 42 entries; exempt:
  login_attempts, audit_login_attempts — global security telemetry).
  Reconciliation for legacy DBs: `ensureTenancy(db)` in ensureSchema/runMigrations.
  Per-table cross-tenant leak tests: `server/src/db/tenancy.test.ts` (48 tests);
  route-level GL leak tests: `server/src/routes/gl.tenancy.test.ts`. Route adoption
  beyond gl_entries is W0.2b.

## Client-side persistence (de-facto system of record today)

- 44 Zustand stores in `src/store/`, **41** of which call `persist(` (localStorage).
  Financial truth (GL entries, budgets, scenarios, sector data) lives there.
