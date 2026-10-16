# Latest from the Lead

> **Lead-maintained pointer for fast polling.** Read this file first on a short poll; the
> append-only detail lives in `COMMS_LOG.md`, ownership in `STATUS_BOARD.md`, files in
> `CLAIMS.md`, decisions in `docs/discovery/decision-log.md`.
> **Last update:** 2026-10-16 17:07 UTC

## Gate state (measured, whole tree)

- **`npm run determinism:ratchet` now HOLDS** — baseline 344 sites across 79 files, nothing
  above baseline. Credit G-03/G-04 for clearing the exception files.
- **`npm run lint` still fails: 8 errors + 1 warning, in exactly four in-flight files** — each
  owned by an active seat: `src/engines/AnomalyExplainer.integration.ts`,
  `src/engines/ThreeStatementEngine.doubleEntryMissingZero.test.ts`,
  `src/services/export/boardPackTieOut.integration.test.ts`,
  `src/services/export/financialPackageExport.ts`. Seven are prettier-fixable — on your own file
  only, never repo-wide.
- `npm run tsc` clean across the whole tree, including all in-flight edits.

## Landed by the lead

| Unit | Evidence | Commit |
| --- | --- | --- |
| Store→screen interop test, `GLTrialBalancePage` | 2 files / 7 tests green | `8db89e75` |
| Store→screen interop test, `GLExplorerPage` | 2 files / 5 tests green | `4128c1d0` |
| DEC-013 D365 contract + DEC-014 offline auth published | docs:links clean | `86ec1992` |

Before these, `store/glStore` appeared in **0** test files: the screens were tested and the store
was tested, but never together. The third gap (`GLUploadPage`) is assigned to **G-10**.

## Decisions answered (no seat is blocked on them)

- **DEC-013 — D365 format.** Cited mapping contract in `docs/discovery/d365-export-contract.md`.
  "Verified D365 support" is still NOT claimed until a real anonymized export validates it.
- **DEC-014 — offline auth.** Cached local session bound to the OS user, existing auth retained as
  enrollment, expiry plus revoke-and-wipe, no PIN store, no bundled credential DB, no RBAC bypass.

## Team in flight (from the board)

F-01 — glStore server-hydrate amount guards (FR-006 residual). G-02 — D365 parser to the DEC-013
contract. G-03/G-04 — exception catalogue + disposition with tests. G-05 — board-pack tie-out.
G-06 — offline/storage audit + tests. G-08 — continuous gates. G-09 — double-entry/missing-not-zero.
G-10 — `GLUploadPage` interop test. G-11 — hub synchronisation.

## Read next

- `../SQUAD_BACKLOG.md` (priority) · `STATUS_BOARD.md` (who owns what) · `BLOCKERS.md` (open)
