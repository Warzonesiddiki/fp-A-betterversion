# E-01-R · SafeMathParser Discriminated-Union Registry Refactor Proposal

> **Status:** DESIGN ONLY — zero code edits (concurrent-session protection: Quinn's E-02/E-09 vitest evidence must stay clean).
> **Author:** Amelia (Developer). Follow-on to E-01 inventory (task 01a02f60).
> **Subject:** `src/engines/SafeMathParser.ts` — 40 escape casts inventoried in E-01, all `as unknown as`, forcing non-numeric results through `type FuncImpl = (args: number[]) => number` (**SafeMathParser.ts:70**) stored in flat `FUNCTIONS: Record<string, FuncImpl>` (**:72**).
> **Honesty:** §8 applies — every count below is **[MEASURED]** (Select-String witnesses this session; Grep MCP was unreliable and was not trusted) or **[ESTIMATE]**.

---

## 1. Problem statement (evidence-widened)

E-01 recorded 40 casts. This design pass widens the finding: the registry lies about **three result shapes**, not two:

| Shape                  | Functions (samples)                                                                                                         | Cast sites [MEASURED]                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| string                 | CONCAT, UPPER, LOWER, LEFT, RIGHT, MID, TRIM, SUBSTITUTE, REPT, CHAR/UNICHAR, TEXT, DOLLAR/FIXED, BAHTTEXT, JIS, ENCODEURL… | lines 1018–1103, 1697–1743 ≈ 25–27 casts |
| number[] (range/array) | SORT, FILTER, UNIQUE, FLATTEN, NORMALIZE…                                                                                   | lines 1304–1439 ≈ 13–15 casts            |
| genuine number         | all financial fns (NPV, IRR, PMT, ratios…) — decimal-backed, **130** `new Decimal\|Decimal.` sites [MEASURED]               | 0 casts                                  |

**Runtime leak today [MEASURED]:** the evaluator returns `func(args)` un-coerced (**:2490**) and `parser.parse()` flows straight out of `safeEvaluate()` (**:2650**) into `ParseResult.value` typed `number` (**:2547-ish interface**) — so `=CONCAT('a','b')` yields the _runtime string_ `'ab'` inside a field TS calls `number`. Arithmetic contexts throw inside Decimal construction instead (observed pattern; covered by existing suite). The type system currently cannot stop a text formula from reaching a "numeric" consumer.

## 2. Recommended type shape

Keep every numeric function body **byte-identical** (zero edits across the ~260 decimal-backed fns / 130 Decimal sites). Split by _declared kind_, tag at lookup:

```ts
type NumericFn = (args: number[]) => number; // unchanged — today's FuncImpl
type TextFn = (args: number[]) => string;
type RangeFn = (args: number[]) => number[];

const NUMERIC_FUNCTIONS: Record<string, NumericFn> = {
  /* moved nothing — stays */
};
const TEXT_FUNCTIONS: Record<string, TextFn> = {
  /* moved out of FUNCTIONS, casts deleted */
};
const RANGE_FUNCTIONS: Record<string, RangeFn> = {
  /* moved out of FUNCTIONS, casts deleted */
};

type FuncEntry =
  | { kind: 'numeric'; fn: NumericFn }
  | { kind: 'text'; fn: TextFn }
  | { kind: 'range'; fn: RangeFn };

function lookupFunction(name: string): FuncEntry | undefined {
  /* 3-way merge */
}
```

Evaluator: the primary-expression path (**:2483–2491**) switches on `entry.kind` and returns an internal `EvalResult = number | string | number[]`. Arithmetic/comparison node evaluators stay typed `(node) => number` — a non-number operand becomes an explicit evaluation error (see §4), not an implicit lie. `FUNCTIONS` remains as a deprecated alias only if needed during transition (it is not — see consumer map).

Why not a fully tagged value type (`{kind:'number', value:number}` from every fn)? It would force editing all ~260 numeric bodies — mass-refactor territory, banned here. The three-registry split achieves the same compile-time guarantees with zero numeric-body churn.

## 3. Call-site impact map [ALL MEASURED]

Runtime value consumers — exactly **2**, both strictly numeric, both inside `src/engines/`:

| Consumer                 | Witness                                                            | Usage                                                                            | Money-discipline                                                                            |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DriverCascadeEngine.ts` | :610 `evaluateSimpleFormula`, :619 `safeMathParser.evaluate(expr)` | cascade math on driver deltas                                                    | routes through decimal helpers `@/utils/money` (:8, :319, :335 comments; money-typed cells) |
| `ValidationEngine.ts`    | :600 `evaluateSimpleFormula(…): boolean`, :619 `.evaluate(expr)`   | truthiness of comparison rules (=, <>) backing balance/range/growth/cross checks | `addMoney/moneyEquals/toDecimal/roundMoney` imports (:8, :212–213)                          |

Structural references (no value flow): `engineManifest.generated.ts:340` dynamic-import registration ✓ lazy-safe; `engines/index.ts:221` barrel re-export — barrel itself has **zero non-test importers** [MEASURED in E-01].

Red herring ruled out: `CustomFieldEngine.ts:25` declares its own private recursive-descent `class SafeMathParser` (arithmetic-only, independent implementation) — name collision, **not** a consumer.

Test battery available: `SafeMathParser.test.ts` (40 refs), `SafeMathParser.branch.test.ts` (9), `SafeMathParser.oracle.test.ts` (3), `utils/fabricationDetector.test.ts` (1) — 53 refs [MEASURED].

**No pages/, components/, stores/, hooks/ consume SafeMathParser directly.** Blast radius = one directory.

## 4. Money discipline & compile-time enforcement

- **Public numeric contract unchanged:** `evaluate(expression): number` and `ParseResult.value: number` keep their signatures. Financial consumers (the 2 above) get compile-time-guaranteed numbers without touching their code.
- **Text/range results become unreachable through the numeric API:** after the dispatch rewrite, a root expression evaluating to text/range returns an explicit error result (`{ value: NaN, error: 'Expression produced text where a number is required' }`) instead of today's mis-typed runtime string. This is the refactor's **one deliberate behavior change** — flagged for test updates (any test asserting leaked-string behavior must migrate to the new API).
- **New explicit opt-in API** for text/range formulas: `safeEvaluateFormula(expr): ParseResult<FormulaResult>` where `FormulaResult = number \| string \| number[]` (or separate `evaluateText(): string`). Display-layer callers opt in explicitly; nothing silent.
- **Arithmetic guard:** binary-op evaluators remain `=> number`; non-numeric operands raise evaluation errors at that node — mirroring today's Decimal-throw behavior but with a precise message and a type-system-visible boundary.
- Decimal discipline: untouched by construction (§2) — 130 Decimal sites stay; `@/utils/money` flows in consumers stay.

## 5. Migration strategy (ordering + verification battery + rollback)

Each step is an independently revertable unit; run the full battery after each step; STOP on any red.

| Step | Change                                                                                                                                                                                                                                                                                              | Ratchet delta [ESTIMATE] | Battery (per step)                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Add types (`NumericFn/TextFn/RangeFn/FuncEntry`) + empty TEXT*/RANGE* registries + `lookupFunction`. No moves yet.                                                                                                                                                                                  | 0                        | tsc 0 errors; ratchet 98/0-any unchanged                                                                                           |
| 2    | Move ~25–27 text fns out of `FUNCTIONS` → `TEXT_FUNCTIONS`; delete their `as unknown as number` casts. Registry lookup still numeric-only (text fns not yet dispatched).                                                                                                                            | −25…−27                  | tsc; ratchet (expect ≈71–73 financial-scope); vitest `SafeMathParser*.test.ts` + `DriverCascadeEngine` + `ValidationEngine` suites |
| 3    | Same for ~13–15 range fns → `RANGE_FUNCTIONS`.                                                                                                                                                                                                                                                      | −13…−15                  | same battery (expect ≈58–60)                                                                                                       |
| 4    | Dispatch rewrite in evaluator (:2483–2491) returning internal `EvalResult`; arithmetic nodes error on non-numeric operands **preserving current throw semantics**; add `safeEvaluateFormula()` opt-in API. Public `evaluate()` still errors on text roots only where it already effectively failed. | 0                        | full battery incl. `.oracle.test.ts` (coercion-semantics oracle) — highest-risk step, do alone                                     |
| 5    | Flip text-root-through-`evaluate()` to hard typed error; update affected test expectations.                                                                                                                                                                                                         | 0                        | full battery + fabricationDetector + any consumer suites; then `npm run build` + bundle-check (chunk-size sanity)                  |

Rollback shape: single-step `git revert` of the offending commit; steps 1–3 are pure code motion (public behavior impossible to change while `FUNCTIONS` retains only numeric entries and lookup ignores siblings until step 4 wires them).

Projected ratchet end-state [ESTIMATE]: financial-scope escapes 98 → **≈58–60** (−38…−40, i.e., SafeMathParser 40 → ~0–2 residual); repo-wide non-test ≈142 → **≈102–107**. All labeled estimates until measured.

## 6. Effort / risk breakdown (validating the original L estimate)

| Work item                               | Size   | Risk                                                            |
| --------------------------------------- | ------ | --------------------------------------------------------------- |
| Steps 1–3 (registry split, pure motion) | S/M    | Low — mechanical, compiler-checked                              |
| Step 4 (dispatch + EvalResult plumbing) | M      | Medium — touches core evaluator; oracle suite is the safety net |
| Step 5 (behavior flip + test updates)   | S      | Medium — deliberate behavior change, small surface              |
| Consumer migration                      | **~0** | None — both consumers numeric-only, signatures unchanged        |

Revised estimate: **L → M for mechanics, retain L-sized calendar buffer for the verification battery** (oracle/branch suites exist precisely because coercion edge cases bite). Original L validated as "L minus"; schedule as M+buffer.

### Second-tier items (brief treatment)

| Site (E-01 counts)              | Pattern                                          | Proposed treatment                                                                                                |
| ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| ProfessionalExportEngine.ts — 9 | jsPDF lazy-load instance typing                  | One adapter interface (`PdfDocLike`) + single cast at the acquisition boundary; 9 → ≤2 casts. Effort S, risk S.   |
| MonteCarloEngine.ts — 4         | generic → `Record<string, unknown>` unknown-hops | Constrain generics (`T extends object`) where provable to drop the hop; else document-in-place. Effort S, risk S. |
| ExportEngine.ts — 4             | same + jsPDF interop                             | Same treatment; combine audit with ProfessionalExportEngine pass. Effort S, risk S.                               |

Combined second-tier upside [ESTIMATE]: −12…−17 financial-scope escapes → potential end-state ≈45–48 vs today's 98.

## 7. Verification gaps (honesty)

- Exact per-line cast partition (25–27 text / 13–15 range) is a line-range-derived approximation; exact split confirmed at implementation time.
- Today's exact failure mode of `=CONCAT()+1` (Decimal-throw vs NaN propagation) inferred from code paths (:2265 area, :2490, :2650) — confirm against `.oracle.test.ts` expectations during step 4 planning.
- `ValidationEngine` colocated test file assumed to exist (not verified this session); battery list to be finalized at kickoff.
