# Latest from the Lead

> **Lead-maintained pointer for fast polling.** Read this file first on a short poll; the
> append-only detail lives in `COMMS_LOG.md`, ownership in `STATUS_BOARD.md`, files in
> `CLAIMS.md`, decisions in `docs/discovery/decision-log.md`.
> **Last update:** 2026-10-16 17:12 UTC

## Newest

- **VERIFIED: F-01's FR-006 server-hydrate guard (`b8e50292`) — ACCEPT.** Independently checked
  the diff, re-ran their suite plus the two store↔screen interop suites (6 files / 60 tests
  green), and ran a throwaway adversarial probe (4/4, deleted) proving the guard refuses
  `Infinity`, non-numeric amounts and both-amounts-absent rows **without** over-rejecting a valid
  explicit zero row. The FR-006 server-hydrate residual is genuinely closed.
- **Squad work landed:** `b8e50292` + `7632f95b` (FR-006 residual closed with evidence).

## Gate state (measured)

- **`npm run determinism:ratchet` HOLDS** — 344 sites / 79 files, nothing above baseline.
- **`npm run tsc` clean** across the whole tree, including in-flight edits.
- **`npm run lint` red in in-flight files only** — each owner fixes its own; run `--fix` on your
  own claimed file, never repo-wide. Current offenders: `src/engines/AnomalyExplainer.integration.ts`,
  `src/engines/ThreeStatementEngine.doubleEntryMissingZero.test.ts`,
  `src/services/export/boardPackTieOut.integration.test.ts`,
  `src/services/export/financialPackageExport.ts`.

## Landed by the lead

| Unit | Evidence | Commit |
| --- | --- | --- |
| Store→screen interop test, `GLTrialBalancePage` | 2 files / 7 tests green | `8db89e75` |
| Store→screen interop test, `GLExplorerPage` | 2 files / 5 tests green | `4128c1d0` |
| DEC-013 D365 contract + DEC-014 offline auth | docs:links clean | `86ec1992` |

Before these, `store/glStore` appeared in **0** test files. The third gap (`GLUploadPage`) is
G-10's. The lead's next unit is the `GLJournalsPage` interop test.

## Decisions answered

- **DEC-013 — D365 format.** Cited mapping contract in `docs/discovery/d365-export-contract.md`.
  "Verified D365 support" is still NOT claimed until a real anonymized export validates it.
- **DEC-014 — offline auth.** Cached local session bound to the OS user, existing auth kept as
  enrollment, expiry plus revoke-and-wipe, no PIN store, no bundled credential DB, no RBAC bypass.

## Read next

- `../SQUAD_BACKLOG.md` (priority) · `STATUS_BOARD.md` (who owns what) · `BLOCKERS.md` (open)
