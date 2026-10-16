# D-03a · Consolidation + FX Depth Audit (read-only walkthrough)

**Author:** Forge (depth engineer) · **Date:** 2026-08-23 · **Autonomy:** A4 analysis, zero code edits
**Source plan:** `_bmad/project-completion-plan.md` §2 D-03 ("ownership tree, IC eliminations, FX rates, translation")
**Method:** static reading only. No tests executed, no builds run. Every claim carries a `file:line`
witness taken this session via Read or PowerShell Select-String (D-009). Effort tags are ESTIMATES.
No `_bmad` docs other than this file were touched; no `src/`, no tests modified.

---

## END-TO-END VERDICT: **N**

A finance user **cannot** perform a real multi-entity consolidation with FX translation in the
product today. The calculation core is strong and heavily tested, but it is unreachable from the UI:
the one page that calls it discards its output and renders a hard-coded table instead; the persisted
FX rate book the user can edit feeds nothing; entity records cannot be created anywhere; the worker
implementation is orphaned and semantically stale.

---

## 1. Pipeline map (static)

### 1.1 Calculation engines (`src/engines/`)

| Component                           | Lines | Role                                                                                                                | Production callers                                                                |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ConsolidationEngine.ts`            | 1,297 | Full ASC-810/805/830 consolidation: effective ownership, translation, IC elimination, NCI, goodwill, VIE, worksheet | **Only** `ConsolidationDashboard.tsx:188` (result discarded) + generated manifest |
| `FXEngine.ts`                       | 509   | Rate registry + ASC-830 translation helpers; throws on missing rates                                                | ConsolidationEngine internals; **`setRate` has zero non-test callers**            |
| `IntercompanyMatchingEngine.ts`     | 528   | IC transaction ingestion/matching/netting/elimination proposals                                                     | Read-only from ICEliminationPage; **ingestion APIs have zero non-test callers**   |
| `MultiCurrencyEngine.ts`            | —     | Multi-currency reporting math                                                                                       | **Zero non-test consumers** (manifest barrel only)                                |
| `ConsolidationAdjustmentsEngine.ts` | 174   | Manual adjustment journal (eliminations/goodwill/NCI/reclass), static in-memory array                               | **Zero production consumers**                                                     |

Key engine facts witnessed:

- **15-step flow** `consolidate()` at `ConsolidationEngine.ts:253-463`: validate → effective
  ownership (:322) → translate (:325) → aggregate → eliminate IC (:344) → NCI details (:347) →
  goodwill (:355) → VIE (:358) → adjustments → totals → balance check → worksheet.
- **Cent-exact balance by default** (F-0009): `balanceToleranceCents ?? 0` at `:264`; imbalance
  computed via canonical cents at `:395-400`; failures never return a "balanced zero" result
  (F-0003 comment `:447-449`; empty-input failure result `:272-278`).
- **Effective ownership** is BFS with multiplication down the tree and a cycle guard
  (`:492-529`; doc example A→B→C = 40% at `:490`).
- **Translation** `translateForeignSubsidiaries` `:831-921`: assets/liabilities ← spot,
  P&L ← average, equity ← historical (`:876-894`). Missing rate ⇒ `MissingFXRateError`
  (`:895-903`; class defined in `FXEngine.ts:36`, name set `:48`) — F-0001/F-0003 fixed here;
  caught inside `consolidate()` and surfaced as a blocking `fx-translation` failure
  (`:450-461`), not a crash.
- **Reporting currency is hard-coded USD**: foreign filter `e.currency !== 'USD'` (`:832`),
  skip-if-USD (`:853`), rate keys `X:USD:{spot|average|historical}` (`:858-860`).
  There is no parameter to choose a group currency.
- **Parent identified by array position**: `translatedEntities[0]` is the parent (`:334`).
- **IC auto-detection convention**: any account code starting with `'9'` is treated as
  intercompany (`:587-590`); auto netting pairs entities by min(|bal|) (`:602-637`).
  Manual `icPairs` also supported (`:576-585`).
- **NCI** per ASC 810 net-income method incl. dividend deduction (`:647-713`); dividends are
  detected heuristically: account code starts with `'3'` AND name contains `"dividend"` (`:684-693`).
- **Goodwill** per ASC 805 simplified (`:727-770`): requires caller-supplied
  `acquisitionCost` + `bookValueAtAcquisition` (`:734`); fair-value adjustments stubbed to 0
  (`:740`); accumulated amortization stubbed to 0 with an explicit 10-year-simplification note
  vs ASC 350 (`:750-753`).
- **VIE** primary-beneficiary investment elimination (`:775-819`) — matches "investment"-named
  asset accounts by substring (`:794-799`).

### 1.2 FX rate handling

- `FXEngine.getRate` implements **latest-on-or-before** date policy (`FXEngine.ts:136-158`);
  `setRate` `:218`; `translateForConsolidation` `:251`; `getAverageRate` `:290`;
  `clearRates` `:386`; ASC-830 report generator `generateASC830Report` `:463`.
- Known semantic weaknesses (read from source):
  - `historical` rate type resolves through the same latest-rate registry rather than an
    acquisition-date rate store (engine consumes plain `{rateType}` entries at
    `ConsolidationEngine.ts:858-860`; `FXEngine.translateForConsolidation` uses
    latest-on-or-before for all types).
  - `generateASC830Report` assumes fiscal year = calendar year:
    closing rate requested at `` `${period}-12-31` `` (`FXEngine.ts:482`).
  - Average rate is an unweighted mean over calendar-year rates (period prefix slice),
    not day- or transaction-weighted (`getAverageRate` `:290`).

### 1.3 Worker (`src/workers/consolidation.worker.ts`, 421 lines) — ORPHANED + STALE

Registered as a pool (`worker-pool.ts:342-346`) and exported as `runConsolidation`
(`workers/index.ts:122-126`), but **zero non-test callers exist in `src/`**. Its semantics predate
the main-engine fixes:

- Missing rate falls back to **rate = 1 silently**: `closingRate?.rate ?? 1` /
  `averageRate?.rate ?? 1` / historical variants at `consolidation.worker.ts:87,91,94,97`.
- No rates at all ⇒ entity **silently skipped** from translation (`:64,:78` region).
- Empty input returns `isBalanced: true` with zeros (`:320`) — the exact F-0003 anti-pattern.
- Balance tolerance hard-coded `0.01` (`:368`) vs the engine's explicit cent-exact default.
- NCI uses direct ownership % only (no effective hierarchy), no dividend deduction
  (`calculateMinorityInterest` `:186-219`).

This is a two-sources-of-truth time bomb: wiring `runConsolidation` up later would reintroduce
the silent-misstatement class bugs that `ConsolidationEngine.ts` explicitly fixed (its guard
comments cite F-0001/F-0003 at `:824-830`).

### 1.4 Stores

- **entityStore** — persisted + RBAC-gated actions (`addEntity/updateEntity/deleteEntity`).
  Witnessed read-only consumers: `OwnershipTreePage`, ReportBookBuilder, CommandPalette.
  **Mutation actions have zero UI callers** (Select-String sweep over `src/**` minus tests).
- **fxRateStore** — persisted key `'fx-rate-store'` (`src/store/fxRateStore.ts:37`), registered in
  `domain/persistenceAuthority.ts:198-199`. RBAC gating on add/update (`:22-32`) but
  **`deleteRate` is NOT gated** (`:34`). Selector `findRate` does exact pair match only — no
  date-effectivity (`:50-51`). Duplicate pair rejected outright (`FXRatesPage.tsx:69-70`), so a
  dated rate history cannot even be entered.
- **glStore** — GL entries DO carry `entityId` (`glStore.ts:97,:179`) plus `period` — the entity
  dimension exists in the data layer; pages just don't use it for consolidation.

### 1.5 Routes / pages (`src/App.tsx`)

| Route                                   | Page                   | What it actually does                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/consolidation` (:512)                 | ConsolidationDashboard | Entity CRUD in **local component state** (`useState` `:27`; save handler `:127-131`); runs real engine into `_consolidatedData` useMemo (`:135-189`, call at `:188` with NO icPairs/fxRates args) — variable is **unused**, output never rendered; renders a **hard-coded mock P&L**: `$100,000` revenue cells `:344`, literal `-$0` eliminations `:347`, `$40,000` net income `:368`; period selector is a dead control `onChange={() => {}}` `:306-316` |
| `/consolidation/detail` (:448)          | ConsolidationPage      | Sums GL entries per account code from glStore; ignores `entityId`, ownership, IC, FX entirely — a single-entity trial-balance sum wearing a consolidation name                                                                                                                                                                                                                                                                                            |
| `/consolidation/ic-eliminations` (:513) | ICEliminationPage      | Reads IntercompanyMatchingEngine module state; permanent empty state because **no importer exists** (`addTransactions` etc. have zero non-test callers); page copy says "once consolidation data with IC legs is imported" — that importer was never built                                                                                                                                                                                                |
| `/consolidation/ownership` (:514)       | OwnershipTreePage      | Reads real persisted store, but hard-codes `ownershipPct: 100` (`:106`) while rendering a "% Ownership" badge (`:76-80`); in-file comment claims pct "is not rendered by this page" (`:96-97`) — false, drift inside the same file; its "Manage Entities" link points back to the dashboard whose entities live in local state → two disjoint entity worlds                                                                                               |
| `/currency/fx-rates` (:520)             | FXRatesPage            | The ONE honest, functional piece: CRUD against persisted fxRateStore, honest empty state, disclosure banner where seeded data was removed (`:15-20`); but duplicate-pair validation blocks history (`:69-70`)                                                                                                                                                                                                                                             |
| `/currency/translation` (:521)          | TranslationResultPage  | **Hard-coded RATES table** (`:21-66`) — fabricated market data presented unlabeled; **silent ×1 fallback** for unknown pairs (`:87`); ignores fxRateStore completely; "Gain/Loss" column subtracts amounts across different currencies (translated-in-target minus original-in-source) — financially meaningless; inline styles `:194,:250`                                                                                                               |
| `/currency/hedging` (:522)              | HedgeManagementPage    | `INITIAL_HEDGES: HedgePosition[] = []` (`:25`) + local state; nothing persists                                                                                                                                                                                                                                                                                                                                                                            |
| `/treasury/fx-exposure` (:543)          | FXExposurePage         | `mockExposures` labeled "demo defaults" in code comment only (`:31-32`) then rendered/exported as if real rows                                                                                                                                                                                                                                                                                                                                            |

### 1.6 THE FOUR RATE BOOKS (headline finding)

There are four disconnected FX rate stores; none bridges to another:

1. **fxRateStore** (persisted, user-editable via `/currency/fx-rates`) → consumed by NO
   computational engine. Non-test consumers: FXRatesPage + three orphan components
   (FXRateManager, FXPositionGrid, MultiCurrencyReporting — themselves imported nowhere).
2. **FXEngine static in-memory Map** (`FXEngine.rates`; `clearRates` wipes it `:386`) → the book
   ConsolidationEngine actually translates against → **populated by nobody in production**
   (zero non-test `setRate` callers).
3. **TranslationResultPage hard-coded RATES** (`:21-66`) → page-local fabrication.
4. **services/mockData/exchangeRates.ts** (`mockExchangeRates`, `getExchangeRate`,
   `convertCurrency`) → demo data with **documented silent 1.0 fallback**
   (`exchangeRates.test.ts:31-35` proves fallback-to-1 behavior) → zero production consumers.

Consequence: whatever rates the user diligently enters on `/currency/fx-rates` have **no effect**
on any consolidation or translation number anywhere in the app.

### 1.7 Dead/orphaned surface related to this domain

`consolidation.worker.ts` + `runConsolidation` · `ConsolidationAdjustmentsEngine` ·
`MultiCurrencyEngine` · `IntercompanyMatchingEngine` ingestion APIs · components
`ConsolidationWorksheet.tsx`, `ConsolidationTree.tsx` (both under `src/components/consolidation/`,
zero non-test importers) · `FXRateManager`, `FXPositionGrid`, `MultiCurrencyReporting`
(under `src/components/currency/`, zero non-test importers despite having tests).

### 1.8 Test coverage (context, not run)

Extensive engine suites exist and were merely located, not executed:
`ConsolidationEngine.test.ts` (50,683 bytes), `.integration.test.ts` (37KB), `.money.test.ts`,
`.recursive.test.ts`, `.bench.test.ts`; `FXEngine.test.ts` + `.money.test.ts`;
`IntercompanyMatchingEngine(.ext).test.ts`; `MultiCurrencyEngine(.money).test.ts`;
`ConsolidationAdjustmentsEngine(.money).test.ts`; plus UI tests for FXRatesPage/a11y.
The engines are well-tested; **the wiring layer is the untested/unbuilt part.**

---

## 2. Paper walkthrough — plausible multi-entity sample

Sample group (period 2026-06, reporting currency USD):

```
ParentCo (USD)
 ├─ 100% EU-Sales (EUR)   acquisition cost 500k, book value at acq 420k
 └─ EU-Sales owns 60% Asia-Ops (JPY)
IC: ParentCo sells to EU-Sales 50k (account 9001 both sides)
Asia-Ops pays a dividend named "Dividend paid" (account 3800)
```

Walking it through `ConsolidationEngine.consolidate(entities, ownerships)` exactly as the
dashboard calls it (`ConsolidationDashboard.tsx:188` — note: **no icPairs, no fxRates passed**):

1. **Root selection** — parent = `entities[0]` (`ConsolidationEngine.ts:334`). Correct only if the
   caller orders ParentCo first; nothing enforces or documents this in the UI.
2. **Effective ownership** (`:492-529`) — EU-Sales 100%; Asia-Ops = 100%×60% = **60%** ✓ (BFS
   multiply, cycle-guarded). Math is right.
3. **Translation** (`:831-921`) — `isForeign && currency!=='USD'` filter (`:832`) needs EUR and JPY
   entries with `spot`+`average`+`historical` keys. With `fxRates=[]` (the dashboard's call), the
   first check fires: **MissingFXRateError** → caught at `:447-461` → result becomes
   `status:'failed'`, stage `fx-translation`. The engine behaves honestly…
4. **…and the failure is thrown away.** `_consolidatedData` (`:135`) is never referenced by the
   JSX; the page then renders the hard-coded table (`:340-375`) showing `$100,000` revenue per
   entity and a fabricated consolidated column computed by `entities.length * 100000` (`:349`).
   **The user sees confident fake numbers while the real engine reported failure.** This is worse
   than a crash.
5. **Had rates been supplied** (hypothetically): assets/liab @ EUR spot, P&L @ average, equity @
   historical (`:876-894`); every account category maps cleanly thanks to `getAccountCategory`
   (`:231`). Equity translated at _latest_ historical entry, not acquisition-date — acceptable
   simplification, must be disclosed.
6. **Eliminations** — manual pairs need `icPairs` input (no UI produces it). Auto-detection scans
   accounts starting `'9'` (`:587-590`): our 9001 legs would net out via min(|bal|) matching
   (`:602-637`) ✓, provided the finance user knows the undocumented "IC accounts start with 9"
   convention and codes BOTH sides with the same account.
7. **Goodwill** (`:727-770`) — skipped silently unless the caller supplies `acquisitionCost` +
   `bookValueAtAcquisition` on the OwnershipStructure (`:734`). The dashboard's ownership builder
   (`:179-186`) sets neither field ⇒ goodwill can never appear from the UI. Also note it uses
   DIRECT `ownershipPct`, not effective %, for the buy fraction (`:742-747`) — for stepped
   acquisitions this understates goodwill (ESTIMATE of impact; needs test confirmation).
8. **NCI** (`:647-713`) — Asia-Ops: minority 40% × (netIncome − dividends) ✓ method-correct, but
   dividends are found only if accountCode starts `'3'` AND name contains `"dividend"` (`:684-693`)
   — brittle, undocumented heuristic.
9. **Balance check** — cent-exact default (`:264,:395-400`); a genuine imbalance yields
   `isBalanced:false` + `imbalanceAmount`, correctly aggregated into errors via
   `consolidateOrThrow` semantics (`:470-486`).
10. **Output** — a full transparent `worksheet` object (`buildWorksheet` `:408-424`, interface
    `:114`). In the product it dies in an unused variable. The dedicated worksheet/tree UI
    components that could render it are orphans (§1.7).

**Where the finance user hits gaps (walkthrough summary):**

| Step                   | Gap                                                                       |
| ---------------------- | ------------------------------------------------------------------------- |
| Create entities        | Impossible — store mutations have no UI; dashboard entities are ephemeral |
| Enter acquisition data | No fields anywhere → goodwill unreachable                                 |
| Define IC pairs        | No UI; must rely on secret `'9'` prefix convention                        |
| Supply FX rates        | No bridge from the rate page they CAN use to the engine that NEEDS them   |
| See results            | Output discarded; hard-coded table shown instead                          |
| Pick period            | Dead control (`onChange={() => {}}`)                                      |

---

## 3. Gap classification

### BLOCKER (wrong numbers or broken flows)

- **BLK-1 · Engine output discarded / feature effectively absent.** Real consolidation runs but its
  result is dropped; visible table is hard-coded fabrication
  (`ConsolidationDashboard.tsx:135,:188,:340-375`). User believes they consolidated when nothing did.
- **BLK-2 · Four disconnected rate books.** User-editable persisted rates feed nothing; engine rates
  unpopulatable; a third book fabricates rates on-screen; a fourth dead mock silently falls back
  to 1.0 (§1.6 with witnesses).
- **BLK-3 · No entity management path + misleading ownership badges.** `entityStore` mutations
  uncalled by any UI; dashboard state is ephemeral; OwnershipTreePage renders hard-coded
  `ownershipPct:100` badges while claiming otherwise in comments
  (`OwnershipTreePage.tsx:106,:76-80,:96-97`).
- **BLK-4 · TranslationResultPage misstatements.** Unlabeled fabricated market rates (`:21-66`),
  silent ×1 identity translation for missing pairs (`:87`), cross-currency gain/loss arithmetic —
  violates repo rule "no fabricated financials presented as real" and basic unit discipline.
- **BLK-5 · Worker divergence time bomb.** `runConsolidation` exposed but stale: silent `?? 1`
  fallbacks (`consolidation.worker.ts:87,91,94,97`), skip-if-no-rates, `isBalanced:true` on empty
  (`:320`). Any future wiring reintroduces fixed bug classes (F-0001/F-0003).

### FRICTION (possible but painful/misleading)

- **FRC-1 · Invisible conventions:** IC = accounts starting `'9'` (`ConsolidationEngine.ts:587-590`);
  parent = first array element (`:334`); dividends = code `'3'*` + name substring (`:684-693`).
- **FRC-2 · ICEliminationPage permanent empty state** — no importer ever built for
  IntercompanyMatchingEngine; weak match threshold (either amount OR account alone matches).
- **FRC-3 · USD hard-coded as sole reporting currency** (`:832,:853,:858-860`) despite a CurrencyInput
  primitive existing in the design system.
- **FRC-4 · Rate history impossible:** fxRateStore rejects duplicate pairs outright
  (`FXRatesPage.tsx:69-70`); `findRate` has no date dimension (`fxRateStore.ts:50-51`).
- **FRC-5 · Rate-type semantics simplified:** historical ≠ acquisition-date; averages unweighted
  calendar-year means; ASC-830 report assumes Dec-31 close (`FXEngine.ts:482`).
- **FRC-6 · Treasury/FX side pages are shells:** hedges in volatile local state starting empty
  (`HedgeManagementPage.tsx:25`); exposures are comment-labeled mocks rendered as data
  (`FXExposurePage.tsx:31-32`).

### POLISH

- **POL-1 · RBAC inconsistency:** `deleteRate` ungated while add/update are gated
  (`fxRateStore.ts:22-34`).
- **POL-2 · Goodwill stubs documented in-code** (FV adjustments 0 `:740`, amortization 0 + 10-year
  simplification note `:750-753`) — fine internally, must be labeled whenever surfaced.
- **POL-3 · Naming drift:** `/consolidation/detail` is a GL sum, not consolidation
  (`ConsolidationPage.tsx`); rename or wire.
- **POL-4 · Orphan graveyard:** 5 domain components + 2 engines + 1 worker with tests but no
  wiring — delete-or-wire decision needed (deletion is semi-destructive → Lead sign-off).
- **POL-5 · Dead controls & style nits:** dashboard period selector `onChange={() => {}}`
  (`:306-316`); TranslationResultPage inline styles (`:194,:250`) vs Tailwind-only rule.

---

## 4. Top 5 gaps by user impact (ranked)

1. **BLK-1** — Consolidation results never displayed; fabricated table shown instead (trust + correctness).
2. **BLK-2** — Rates entered by users do nothing; translations fail or would use phantom books (correctness).
3. **BLK-3** — Entities/ownership cannot actually be managed; tree shows fake 100% everywhere (disclosure).
4. **BLK-4** — Dedicated translation screen presents invented rates and meaningless gains (honesty violation, E-09 class).
5. **BLK-5** — Orphaned worker encodes already-fixed bugs; future wiring silently corrupts numbers (latent risk).

## 5. Remediation direction (HYPOTHESES, for planning only — not authorized work)

Single bridge, ordered: (a) wire fxRateStore → FXEngine at app init (one adapter closes BLK-2);
(b) persist dashboard entities into entityStore + render real `_consolidatedData` incl. failure
list (BLK-1, part of BLK-3); (c) quarantine or upgrade consolidation.worker before anyone wires
it (BLK-5); (d) replace TranslationResultPage rates with fxRateStore reads + honest empty state
(BLK-4); (e) then FRC items. Effort guesses: (a) S, (b) M, (c) S-M, (d) S — ALL ESTIMATES.

---

_Witness method note: counts/sizes above measured this session via Read tool and PowerShell
Select-String sweeps over `src/\*\*/_.{ts,tsx}`excluding`_.test._`/`_.bench._` where stated.
No test suite was executed (task constraint). Numbers like "zero callers" reflect those sweeps.\*
