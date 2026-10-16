# 10 — Glossary (repo and domain terms an agent will meet)

This page is the authoritative glossary. The earlier long-form product glossary
was retired on 2026-10-16 (DEC-011) and is kept for provenance at
`docs/archive/legacy-2026-10/docs/GLOSSARY.md`.

## Repo / process terms

| Term                          | Meaning here                                                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gate** (Gate 0/1/2…)        | A milestone in `docs/discovery/roadmap.md`; a gate is closed only by evidence listed against it. Do not start the next gate's scope while the current one is open.                                    |
| **DEC-nnn**                   | An owner decision in `docs/discovery/decision-log.md`. `Proposed` = not decided; agents may not resolve it in code.                                                                                   |
| **FR-/NFR-/AI-**              | Requirement ids in `docs/discovery/requirements-register.md`. Cite them in commits.                                                                                                                   |
| **AUD-nnn**                   | Audit finding id (`docs/discovery/audit-progress-2026-10-15.md`).                                                                                                                                     |
| **R-nnn**                     | Risk register id.                                                                                                                                                                                     |
| **FP-nnnn**                   | Legacy finding/rule id used in code comments (e.g. FP-0002 = batch must balance).                                                                                                                     |
| **Ratchet**                   | A script with a JSON baseline that may only go down (`determinism`, `money-ast`, `type-safety`, `money-adoption`).                                                                                    |
| **Baseline**                  | The JSON file a ratchet compares against; moved only by `--update` after an improvement.                                                                                                              |
| **Escape ledger**             | Inventory of `eslint-disable` and type escapes; must not grow.                                                                                                                                        |
| **Truth matrix**              | `docs/CAPABILITY_TRUTH_MATRIX.md`, generated; marks each route `VERIFIED/UNVERIFIED` by static evidence.                                                                                              |
| **Reachable / orphan engine** | An engine module is reachable if a page, store, hook or worker imports it (transitively from `App.tsx`); otherwise orphan. 95/87 of 182.                                                              |
| **Persist key**               | The `name` passed to Zustand `persist()`; the blob id in storage.                                                                                                                                     |
| **Authority**                 | `local-draft` vs `server` — who is the system of record for a persist key (`persistenceAuthority.ts`).                                                                                                |
| **Class**                     | `financial-truth` / `derived-cache` / `user-preference` / `session` — what kind of data a persist key holds.                                                                                          |
| **masterStorage**             | The adapter chain used as Zustand storage (Tauri SQL → sql.js → IndexedDB → chunked localStorage).                                                                                                    |
| **Control plane**             | The optional Express server in `server/`; "the server".                                                                                                                                               |
| **SDK / command client**      | `src/sdk/FpaClient`, `src/api/commandClient.ts` — typed HTTP client to the server.                                                                                                                    |
| **Mock auth**                 | `VITE_USE_MOCK_AUTH=true` local session; tests/dev only.                                                                                                                                              |
| **Deep test**                 | `*.deep.test.tsx` — behaviour test with programmable store stubs.                                                                                                                                     |
| **Oracle**                    | A test with independently derived expected values (hand-computed or from a trusted source), e.g. the statement oracles.                                                                               |
| **Shard**                     | One of 8 vitest partitions in `test:sharded`.                                                                                                                                                         |
| **ci-patches**                | Unified diffs for `.github/workflows` that agents cannot apply; human applies.                                                                                                                        |
| **Handover**                  | End-of-session note in the `HANDOVER_TEMPLATE.md` format.                                                                                                                                             |
| **K1–K5**                     | The five failure modes diagnosed in the predecessor repos (scope explosion, incoherent sample data, contract divergence, unverifiable native code, claimed-done drift). Used as shorthand in reviews. |
| **NATIVE-UNVERIFIED**         | Label for anything in `src-tauri/` — cannot be compiled or tested in the sandbox.                                                                                                                     |

## Domain terms

| Term                          | Meaning                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GL**                        | General ledger — journal lines with account, period, debit/credit.                                                                                                                            |
| **TB / trial balance**        | Per-account debit/credit/net totals for a period; must sum to zero.                                                                                                                           |
| **Journal / batch**           | A set of lines that must balance (Σ debit = Σ credit). Our import batch = one file.                                                                                                           |
| **Period**                    | `YYYY-MM` calendar month (no other fiscal calendars modelled).                                                                                                                                |
| **Posting date**              | The date a line hits the ledger (`date` / `postDate`); drives period assignment.                                                                                                              |
| **Net change**                | debit − credit for a line (sign convention: debit positive).                                                                                                                                  |
| **Account type**              | `asset / liability / equity / revenue / expense` (`AccountType`). Natural balance: debit for asset/expense, credit for the rest.                                                              |
| **Chart of accounts (CoA)**   | The account list with hierarchy; helpers in `src/domain/chartOfAccounts.ts`.                                                                                                                  |
| **Mapping**                   | Source column → GL field assignment during import. Mappings are not versioned yet (gap).                                                                                                      |
| **Provenance**                | Which file/batch/row a ledger line came from.                                                                                                                                                 |
| **Idempotency**               | Re-importing the same file or row produces no new lines.                                                                                                                                      |
| **Quarantine / rejection**    | A source row not imported, kept with a reason code.                                                                                                                                           |
| **Control total**             | Independently computed Σ rows / Σ debit / Σ credit / net for a batch, used to tie out against the source.                                                                                     |
| **Tie-out**                   | Proving two artefacts agree (file vs import, UI vs export).                                                                                                                                   |
| **Period close / lock**       | Freezing a period against further postings. Store exists; not enforced on GL writes.                                                                                                          |
| **Variance**                  | Actual − budget (or − prior); % variance = variance / base; `variancePct` returns 0 for 0/0 and **throws** `InvalidMoneyError` for a non-zero actual on a zero base — callers must handle it. |
| **Allocation**                | Splitting an amount across targets so the parts sum exactly to the whole (`allocateMoney` handles remainders).                                                                                |
| **Exception / anomaly**       | A potential issue flagged for review — a question, never an "error" to the user.                                                                                                              |
| **Month-end**                 | The close cycle: import actuals → tie out → review exceptions → report. The product's intended spine.                                                                                         |
| **D365 F&O / BC / Dataverse** | Microsoft Dynamics 365 Finance & Operations / Business Central (ERPs with a GL) vs Dataverse (CRM data platform). Our connector targets Dataverse — not the GL.                               |
| **Single currency**           | v1 scope: no FX translation; `currencies` in scope is reported, not converted.                                                                                                                |
