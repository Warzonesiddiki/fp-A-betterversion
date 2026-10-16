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
4. Possible overlaps with existing ledger entries → `DUPLICATE_ROW`
   source-row rejections; the entire file aborts for review (DEC-009).
   Match normalized account/date/debit/credit, not placeholder `amount` or net
   alone. This is a conservative heuristic, not verified source-line identity;
   entity/currency-aware matching is still open. Equal-valued repeated rows
   within a new file are preserved, never silently deduplicated.
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

## Fiscal close identity and reopen safety (DEC-008; partial)

`periodCloseStore.checklists[periodId].fiscalScope` retains the supplied canonical
`startDate`, `endDate`, and `isAdjustingPeriod`. It is optional for legacy persisted
checklists. No start date is inferred from a deadline or `P01`-style ID. Initialization
prevalidates all ranges and IDs before mutation; changing an existing binding's
fiscal year, period number, deadline, date range, adjusting flag or entity requires
an explicit migration. IDs are still single-entity keys, not a multi-entity schema.
Compatible legacy bindings are backfilled from the supplied fiscal calendar while
preserving close entries, tasks and the audit chain. This additive field is included
in the existing persisted `checklists`; the storage version remains 1.

`resetPeriod` is now a compatibility no-op for open/unknown periods and throws for
closed periods, including for Admin. Reopening must use `transition`, which checks
reopen permissions, requires a non-blank reason, and appends the audit event/chain.
A generated local approval ID is correlation metadata, **not independent approval**.
The page validates bindings on mount and displays a recoverable calendar-conflict
error rather than overwriting an old year's period state.

**Local guards now implemented:** GL import, add/replace, account replacement,
undo/redo, clear/undo-import, server publish and server-to-local refresh consult
`glPeriodWriteGuard` against hydrated close state. Missing/ambiguous ranges and
conflicting posting metadata fail closed. Whole-store replacement/undo checks all
current/target rows conservatively, including unchanged closed rows.

**Still not guaranteed:** cross-process/server transaction isolation for requests
already in flight, raw `setState`/backup/native mutation paths and application-wide
financial immutability. In-flight server writes may complete; the local update is
stopped and requires reconciliation. `FiscalPeriod.isClosed` is not automatically
converted into a close-state-machine transition by initialization.

## Exact chunk staging (not ledger promotion)

`stageGLImport` coordinates tokenized async chunks through `runGLIngestionChunk`
and `gl-ingestion.worker.ts`, at most 2,000 source records per request. The next
chunk is not requested until the current result is persisted. Whole-file voucher
controls span chunk boundaries; per-chunk balance is not used to declare a file
ready. Main-thread coordination retains voucher totals and source-record indexes,
not a second accumulated raw/accepted-row array. Each returned chunk is still
materialized; COA/entity lists are copied with requests, and source-index metadata
is O(rows), not a constant-memory guarantee.

`glStagingRepository` writes versioned opaque JSON envelopes through the existing
encrypted masterStorage backend. Quarantine raw strings (including `$d:` prefixes)
are not subjected to money-tag decoding. Keys are `gl-ingestion-stage:v1:index`,
`gl-ingestion-stage:v1:<batchId>:manifest`, `...:chunk:<index>`, and
`...:lock` (cross-window lease locks). Ephemeral staging keys are intentionally
excluded from `BACKUP_STORE_KEYS` (`src/utils/backupRestore.ts`).

Manifest states: `staging`, `ready`, `blocked`, `failed`. **Ready means staged and
eligible for further checks, never posted.** Quarantine, schema failures, empty
files and any whole-file voucher imbalance prevent ready. Compute/read/write errors
propagate; a failed marker is attempted without masking the original error.
Readers can retrieve persisted chunks by batch ID (`readChunks`) or paginate
quarantined rows across chunks (`readStagingQuarantinePage`) without loading the
full batch into memory. `discoverStagingSessions` enumerates indexed staging
manifests (`ready`, `blocked`, `failed`, `staging`), `recoverStagingSessions`
cleans up unacknowledged orphan chunks and marks stale/unindexed `staging`
sessions `failed`, and `discardStagingBatch` removes a batch's chunks, manifest,
lock, and index entry while remaining safe when another batch holds an active
lease lock. Duplicate session IDs and active cross-window lease conflicts are
rejected without mutating existing batch evidence.

`glCsvTokenizer` (`tokenizeGLCsvStream` / `stageGLCsvImport`) streams RFC-4180 CSV
or explicit delimiter text/byte streams into bounded `GLStagingChunkSlice` batches
with exact 1-based physical line numbers (`rowNumbers`), preserving line offsets
across blank lines and multiline quoted fields and failing closed with
`CSVTokenizationError` on invalid UTF-8 (`TextDecoder(..., { fatal: true })`),
unclosed quotes, unescaped quotes, or ragged column counts.

`glXlsxTokenizer` (`tokenizeGLXlsxBytes` / `stageGLXlsxImport`) reads OOXML
worksheet XML directly from the `.xlsx` ZIP archive via `DecompressionStream('deflate-raw')`
instead of `ExcelJS.Workbook.xlsx.load`, preserving exact `<v>` decimal lexemes
(including >53-bit exact decimal strings) without IEEE-754 `parseFloat`/`Number`
coercion, converting Excel date serials to ISO `'YYYY-MM-DD'`, preserving physical
1-based Excel row numbers across blank rows, and failing closed with
`XLSXTokenizationError` on corrupt ZIP entries, missing sheets, duplicate headers,
ragged rows, or unevaluated formula cells (`<f>` without `<v>`).

`glStagingPromotion` (`promoteStagingBatch`, `listPromotedLedgerBatches`,
`readPromotedLedgerBatch`, `readPromotedLedgerEntries`) promotes a `'ready'`
staged batch into an exact-string ledger store (`gl-ledger-exact:v1:*`) under
cross-window lease locks without coercing `debit`/`credit` through `number`.
Before committing, it re-verifies every staged chunk (`schemaErrors`,
`quarantinedRows`, recomputed `controlTotals`, and whole-file voucher balance),
enforces SHA-256 `fileHash` and `batchId` idempotency against promoted history,
enforces `DEC-008` closed-period write guards (`getGLPeriodWriteIssues`) at
promotion time, transitions the staging manifest to `'promoted'` (`promotedAt`),
and rolls back any partial keys on write failure. `discardStagingBatch` refuses
to discard `'promoted'` batches.

Not yet delivered: UI upload-wizard wiring to the new staging/promotion APIs,
migration of legacy number-valued `glStore` consumers to `gl-ledger-exact:v1:*`,
and 250k-row browser/native scalability evidence (the browser backend still
snapshots SQLite into localStorage and may hit quota limits). Do not claim
production UI upload replacement until the upload wizard and downstream consumers
are wired to the exact-string promotion store.
