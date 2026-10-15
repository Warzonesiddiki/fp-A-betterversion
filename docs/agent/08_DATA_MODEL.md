# 08 — Data model (as it exists)

Read this before touching anything that persists. Line numbers refer to
`src/types/index.ts` at tip `6777ce7`; verify with grep.

## Core types

| Type                                     | Where                         | Notes                                                                                                                                                                             |
| ---------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountType`                            | `src/types/index.ts:9`        | `'asset' \| 'liability' \| 'equity' \| 'revenue' \| 'expense'` — single enum, use it                                                                                              |
| `FiscalPeriod`                           | `:22`                         | `YYYY-MM` string periods throughout                                                                                                                                               |
| `GLAccount`                              | `:36`                         | code, name, type, hierarchy; chart helpers in `src/domain/chartOfAccounts.ts`                                                                                                     |
| `Budget`, `Forecast`, `Scenario`, `User` | `:78`, `:100`, `:157`, `:200` | —                                                                                                                                                                                 |
| `GLEntry`                                | `:712`                        | `debit`, `credit`, `netChange`, `amount` are **JS numbers** (inherited); treat as cents-exact decimals via `@/utils/money` when computing; `provenance?` optional for legacy rows |
| `GLEntryProvenance`                      | `:746`                        | `batchId`, `fileHash` (SHA-256 hex), `sourceFile`, `sourceRow` (1-based, header = 1)                                                                                              |
| `ImportRejection`                        | `:758`                        | `row`, `code: 'DUPLICATE_ROW' \| 'DUPLICATE_FILE' \| 'VALIDATION'`, `reason`                                                                                                      |
| `ImportScope`                            | `:768`                        | periods, dateRange, `entities`/`currencies` are `string[] \| 'unavailable'` (never guessed), `importedAt` from the clock                                                          |
| `ImportControlTotals`                    | `:782`                        | `rows`, `debit`, `credit`, `net` as **decimal strings**                                                                                                                           |
| `ImportResult`                           | `:818`                        | counts + status + optional `batchId/fileHash/rejections/controlTotals/scope` (optional only for history rows that predate provenance)                                             |
| `ImportSource`                           | `:838`                        | caller-supplied `fileHash`, `sourceRows`, pre-rejections                                                                                                                          |
| `ImportHistoryEntry`                     | `:851`                        | `ImportResult` + `id` + `timestamp`                                                                                                                                               |
| `GLState`                                | `:856`                        | the GL store contract                                                                                                                                                             |

72 exported types/interfaces live in that one file; domain-specific types
also live beside their stores/engines. There is no generated schema from
these types (K3 risk — see `09_KNOWN_GAPS.md`).

## Import pipeline invariants (implemented, tested)

`parseGLRows(rawRows, mappings)` (pure; `src/services/import/parseGLRows.ts`)
turns source rows into entries + `VALIDATION` rejections; then
`useGLStore.getState().importGLData(entries, filename, source?)`:

1. `fileHash` = caller's SHA-256 of bytes, else SHA-256 of canonical row
   content (`src/utils/sha256.ts`, `importProvenance.ts`).
2. `batchId` = deterministic from `fileHash` + clock instant; entry ids derive
   from `batchId` + row (no `Date.now()` collisions).
3. Same `fileHash` already in `importHistory` → whole file rejected
   `DUPLICATE_FILE`, nothing written.
4. Row-level duplicates within the file or against existing entries →
   `DUPLICATE_ROW` rejections; remaining rows still import (quarantine, not
   abort).
5. Upstream parse rejections abort the whole file (DEC-007), return source-row reasons
   and leave financial state/history untouched. Corrected retries are allowed.
   Failed-attempt history is not yet durable. Batch must balance (debits = credits, integer cents) — `validateEntries`
   (FP-0002). Unbalanced → `status: 'error'`, nothing written.
6. Commit is atomic: entries, history row, `lastImportEntryIds`,
   `entrySyncState` in one `set()`.
7. `controlTotals` are computed independently from the committed rows using
   money helpers; `scope` reports `'unavailable'` rather than defaults.
8. Audit trail receives one event with batch id and counts.

Contract tests: `src/store/glStore.provenance.test.ts`.

## Persistence

### Client

- Zustand `persist()` with `storage: masterStorage` (`src/utils/masterStorage.ts`).
  `masterStorage` picks an adapter: Tauri SQL plugin (`tauriSqlStorage`) in
  the desktop shell → sql.js → IndexedDB → chunked localStorage fallback.
- **Every store is a blob**: one row per persist key in a table `stores(id,
value)`. The 35-table schema in `src-tauri/migrations/001_initial_schema.sql`
  (29 tables) + `002_cube_schema.sql` (6) is created by the desktop shell but
  **the client never reads or writes those tables** except `stores`. Only the
  optional server uses them (below). Do not design client code against them
  as if they held data.
- 46 stores, 42 persisted. Persist keys are listed and classified in
  `docs/architecture/PERSISTENCE_MAP.md` (authority: `local-draft` /
  `server`, class: `financial-truth` / `derived-cache` / `user-preference` /
  `session`) and in code at `src/domain/persistenceAuthority.ts`.
  `npm run docs:verify` fails if the three disagree. Adding a persisted store
  means editing all three.
- `gl-store` is `financial-truth` / `local-draft`; the client is **not** the
  system of record by declaration, but there is no other one that runs
  without the server (DEC-002 open).
- Zustand `persist` `version` + `migrate` are the only migration mechanism
  for client data. Changing a persisted shape without a migrate function
  corrupts existing installs.

### Server (`server/`, Express + SQLite, optional)

- `server/src/db/migrate.ts` **applies `src-tauri/migrations/*.sql`** (the
  35-table schema) to its own SQLite file, then adds columns and extra tables
  in code (`auditSchema.ts`, `tenancy.ts`, `migrate.ts`): `users`,
  `refresh_tokens`, `login_attempts`, `user_entity_access`, `audit_log`,
  `audit_login_attempts`, `audit_permission_changes`, `audit_data_changes`,
  `period_close_audit`. So the relational tables _are_ used — by the server
  (`gl_entries` is read by `routes/gl.ts` and `gates/threeStatementGate.ts`),
  not by the client.
- `npm run docs:verify` → `schema-equality-check` compares the SQL files with
  the in-code DDL only on tables defined in both (today: `audit_trail`). It
  is not a client-model ↔ schema parity gate; nothing checks
  `src/types/index.ts` against either schema (K3 gap).

The client talks to the server via `src/sdk/FpaClient` /
`src/api/commandClient.ts` only when `VITE_API_URL` is set. Without it,
`setGlCommitClient` is never called and the GL store commits locally only.

## Identity and determinism rules

- Ids: imported rows derive from content + batch (`importProvenance.ts`);
  user-created objects may use a random id; never derive an id from
  `Date.now()` alone.
- All 42 persisted stores declare `version: 1` with an identity `migrate`;
  bump the version and write a real migration when a shape changes.
- Dates: ISO `YYYY-MM-DD`; periods `YYYY-MM`; instants ISO 8601 UTC from
  `now()`.
- Amounts in persisted stores are numbers today; new fields that carry money
  should be **decimal strings** (as `ImportControlTotals` does) — do not add
  new float money fields.

## Things not modelled (do not pretend they are)

Fiscal calendars other than calendar months, multi-currency translation,
consolidation eliminations, intercompany, account mapping versions, period
lock state as data (there is a `period-close-store`, but the GL store does
not consult it before writing), per-tenant separation on the client.
