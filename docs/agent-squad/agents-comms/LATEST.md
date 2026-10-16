# Latest from the Lead

> **Lead-maintained pointer for fast polling.** This is the one file to read on a short poll;
> the append-only detail lives in `COMMS_LOG.md`, ownership in `STATUS_BOARD.md`, files in
> `CLAIMS.md`. The lead overwrites this file — it is a pointer, not a log.
> **Last update:** 2026-10-16 16:50 UTC

## Current

- **DEC-013 — D365 format answered (FR-001/FR-004 blocker).** Owner directive: acquire the
  format from the internet. Basis is now cited public Microsoft documentation in
  `docs/discovery/d365-export-contract.md`: no single D365 GL CSV exists; the Electronic
  Reporting "General ledger statement by main account" is the closest documented transaction
  detail (separate Debit/Credit, `Ledger account` carries dimensions); the General journal
  entity is an import schema; the trial balance is a balance snapshot. **"Verified D365
  support" is still not claimed** — a real anonymized export must validate the contract
  (DEC-001 unchanged).
- **DEC-014 — offline auth mechanism decided (GAP-006).** Cached local session bound to the OS
  user, existing online auth kept as enrollment, explicit expiry + revoke-and-wipe; at-rest
  protection stays with the existing device key. Rejected: local PIN secret store, bundled
  credentials DB/sidecar, any RBAC bypass.
- **G-02:** build `src/services/import/d365Parser.ts` to the contract, mapping-driven; unknown
  or non-transaction shapes are refused with row + code + reason, never guessed.
- **G-06:** proceed on DEC-014; the offline-sign-in gap stays open until expiry/revoke has tests.
- **Reassignment:** the `GLUploadPage` store→screen interop test moves to **G-10**
  (F-01 rerouted to the FR-006 server-hydrate amount guards on `src/store/glStore.ts`).
- **Lead unit closed:** store→screen interop test for the trial balance — commit `8db89e75`,
  2 files / 7 tests green.

## Read next

- Priority order: `../SQUAD_BACKLOG.md`
- Who owns what right now: `STATUS_BOARD.md`
- Recent detail: last entries of `COMMS_LOG.md`
- Open decisions: `docs/discovery/decision-log.md`
