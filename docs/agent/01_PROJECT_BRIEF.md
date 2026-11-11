# 01 — Project brief

**Approved phased product/engineering plan:** [`../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](../discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md) (DEC-105, 2026-11-10); unresolved owner choices remain open. Product north-star: [`../VISION.md`](../VISION.md); accepted decisions remain in [`../discovery/decision-log.md`](../discovery/decision-log.md).

## The product, honestly

**Ambition (owner-stated):** an all-in-one FP&A workspace that becomes the
owner's trusted one-stop solution.

**The workflow that exists today (owner-stated, Known):** every month the
owner exports a General Ledger dump from Microsoft Dynamics 365, performs
FP&A work on it, and highlights abnormalities and potentially incorrect
entries by hand.

**First supported product slice (current code evidence plus the 2026-11-10 approved direction):** D365 remains the first real-source proof; DEC-104 establishes the user's universal-template direction. The upload UI now calls the universal import engine at commit, while saved mapping-profile persistence and template version/lineage convergence remain incomplete.

```text
D365 GL export or a user-mapped CSV/XLSX finance export
  → import, mapping, provenance, row reasons and control totals
    [implemented against synthetic shapes; real owner sample/totals pending]
  → period/entity/currency scope and trial-balance/statement views
    [code paths exist; missing fields remain unavailable, not zero]
  → exception review: versioned rules, findings/evidence, human disposition
    [routed at /data/exceptions; owner rule-cycle validation pending]
  → correction follow-through
    [routed at /data/corrections; human lifecycle exists; real team cycle pending]
  → day/month/year comparison with source-entry drill-through
    [routed at /data/comparison; “not in file” is not zero; owner review pending]
  → board outputs
    [board-pack Excel ties to screen in a test; PDF/PPT output surfaces need
     their own tie-out evidence]
```

**Import-path status (updated 2026-11-10):** `GLUploadPage` creates a transient
user template from its active mappings and calls `universalImportParse` at
commit. The engine delegates mapped rows to `parseGLRows`; the preview also
uses `parseGLRows`, preserving one row-parser for preview and commit.
D365-shaped custom mappings retain D365 date/summary-row behavior. Saved
header-signature profiles now migrate legacy entries to v1 and preserve
immutable local revisions. Each imported batch retains the mapping snapshot;
saved profile id/version is attached only when the mapping used exactly matches
that revision, and saved id/version is copied to entry provenance. The UI still
does not use the engine's standalone auto-detect workflow. Clone/edit/replace,
unknown-column treatment, built-in selection and shared-template behavior
remain open; this is not yet a complete universal template lifecycle or live
source validation. Capability evidence still needs generator reconciliation.

These are code paths, not a claim of owner-accepted completion. The full product
contains broader FP&A capabilities; their maturity is governed by the route and
capability evidence, not by file presence. Follow the accepted owner scope and
roadmap, preserve breadth (DEC-006), and do not label a workflow supported until
its evidence and external validation requirements are met.

## Who uses it

- **Primary:** the owner, an FP&A practitioner doing month-end review.
  Single user, single company, one currency as far as we know (Q7/Q10 in
  `docs/discovery/current-workflow.md` are unanswered).
- **Secondary (future, undecided):** reviewers/approvers; see DEC-004.

## Non-goals for v1 (until the owner says otherwise)

- No cloud sync, no multi-tenant login, no real-time collaboration.
- No ERP write-back; the GL is read-only input.
- No consolidation / FX translation in the first spine.
- No AI that computes or posts numbers. AI may draft commentary only from
  approved, verified facts (AI-001) and is deferred.
- No API connector for every ERP in the first slice. The universal mapped CSV/XLSX path is the accepted coverage foundation; provider APIs are prioritized later and must use the same canonical import contract. Existing broader FP&A modules remain in scope, but route/capability grade—not file presence—determines what can be called supported.

## What is true right now (updated 2026-11-04; connector audit dated 2026-11-02)

| Area | Truth | Where measured |
| --- | --- | --- |
| Build & gates | Fresh `tsc`, lint, format, production build, docs/link gates and server tests pass on 2026-11-04. The fresh full frontend sharded rerun timed out after 1,800 s at shard 7/8 and was terminated without a summary; status is inconclusive. The earlier **17,937 passed, 1 skipped; 8/8 shards** result is historical (2026-11-02), not a fresh 2026-11-04 pass. | 2026-11-04 validation log in `docs/_agent/PROGRESS_LOG.md`; historical suite details in the 2026-11-02 vision recheck |
| CI on `main` | Not freshly verified here; last recorded GitHub Actions queries were blocked by HTTP 403, so CI is neither claimed green nor red. | `gh run list` history in `docs/TASKBOARD.md` |
| Import | CSV/XLSX through `GLUploadPage` → `parseGLRows` → `glStore.importGLData`, with UI mapping, separate saved header-signature profiles, validation, provenance, controls, and synthetic D365 fixtures. The distinct universal template/engine code has governance tests but is not the UI's parsing path. Real owner export/control totals remain unvalidated. | `glStore.provenance.test.ts`; `GLUploadPage.d365.integration.test.tsx`; `glUploadStore`; `universalImportEngine.governance.test.ts`; DEC-104 |
| D365 export validation | DEC-015 says all documented shapes are in scope; the owner’s real anonymized sample and matching control totals are still required before any shape is called verified. | `docs/discovery/decision-log.md`; `docs/TASKBOARD.md` O1 |
| Persistence | Whole Zustand stores use the local storage abstraction; the 35-table relational schema is not written by the client. | `src/utils/masterStorage.ts`, `08_DATA_MODEL.md` |
| Server | Express/SQLite with JWT/RBAC exists; the GL commit client is unconfigured by default and the server is not bundled with the desktop app. | `02_ARCHITECTURE.md` |
| Auth offline | Production refuses mock auth. First online enrollment/login requires the server; an enrolled desktop can restore its cached profile offline for up to 30 days. The current binding is device-profile based, not verified OS-user binding; do not claim complete offline/no-egress compliance. | DEC-004/014; `src/store/authStore.ts`; `src/App.tsx` |
| Money | `money:ast` detects 0 unsafe operations; adoption 30.16 % baseline (floor: 320 modules). The 2026-11-02 command scanned 1,063 financial modules and found 320 using the primitive (30.1 %, rounded display). | `money:adoption` + `money:ast`; `scripts/money-adoption-baseline.json` |
| Determinism | 344 wall-clock/random sites across 79 calculation-path files, ratcheted per file. | `determinism:ratchet` |
| Engines | 180 engine modules; 98 have runtime consumers and 82 are orphaned by the measured reachability convention. | `verify-readme-stats.mjs --list` |
| Exceptions | `/data/exceptions` runs ordinary and aggregate exception rules; findings remain review candidates until a human disposition. Real-data rule acceptance is open. | `ExceptionQueuePage.test.tsx`; FR-008; DEC-016 |
| Corrections | `/data/corrections` provides the human correction-request lifecycle and event history; a real accounts-team cycle is not validated. | `CorrectionsPage.test.tsx`; FR-010; DEC-035 |
| Comparison | `/data/comparison` supports day/month/year, absent-period “not in file” treatment, and entry drill-through; owner-cycle validation remains open. | `ComparisonPage.test.tsx`; FR-011; DEC-016/017 |
| Integrations | `/settings/integrations` → catalog → `integrationStore` → connector → `glStore` is a code-level import path. It paginates, reports incomplete coverage, and shows imported/skipped results. Provider tests are mocked, not live. | `integrationStore.test.ts`; connector and settings-page focused suites |
| Dynamics connector | Targets Dataverse CRM entities, has no GL transaction feed, and is not a Dynamics 365 F&O or Business Central GL connector. | `src/services/api-integration/DynamicsConnector.ts`; catalog capability tests |
| Dependency advisories | Historical 2026-11-02 root audit: 15 (13 moderate, 2 high). Latest recorded 2026-11-04 root audit: 13 (11 moderate, 2 high); server audit: 2 high, 0 critical. No fixes applied. | `npm audit --omit=dev`; `(cd server && npm audit --omit=dev)`; raw output summarized in `docs/_agent/PROGRESS_LOG.md` |

## Owner inputs that remain open

DEC-001's technical first slice, DEC-002's all-surfaces dependency order,
and DEC-006's documentation authority were decided; DEC-015/016/017 record
that the owner wants all D365 GL shapes and all comparison/exception surfaces.
DEC-104 resolves the universal user-template direction. The remaining D365
owner evidence request is anonymized sample(s) and matching source controls per
shape—this is not an unresolved architecture decision. O2/O3/O4/O9 have later
resolution records; O5/O6/O7/O8 retain conservative open defaults. See the
current [`../discovery/decision-log.md`](../discovery/decision-log.md) and
[`../TASKBOARD.md`](../TASKBOARD.md); do not resolve owner questions implicitly
in code.

## Success looks like

The code already exercises the synthetic import, exception-review,
correction-request, and day/month/year comparison paths. The product-level
success condition is not yet met: the owner must reconcile a real D365 export's
control totals, and the owner/accounts team must validate the same supported
cycle through findings, correction follow-through, comparison, and board output.
Until those external checks occur, report the implementation as code/test
coverage—not owner-accepted workflow completion.
