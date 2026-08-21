# Three-Statement Gate (W0.3)

Runtime integrity gate enforcing three-statement consistency on server write
paths. Promoted from test-time oracles per Constitution §18.2 item 0.3.1.

- Module: `server/src/gates/threeStatementGate.ts`
- Enforcement point: `server/src/routes/gl.ts` write transactions
- Error codes: `FP-0300` / `FP-0301` / `FP-0302` (`server/src/types/errorCodes.ts:126-144`)
- Tests: `server/src/gates/threeStatementGate.test.ts`

## 1. Identity model

| Check | Identity                                         | Code    | Pure function                                                         |
| ----- | ------------------------------------------------ | ------- | --------------------------------------------------------------------- |
| TS3   | Assets = Liabilities + Equity                    | FP-0300 | `checkAssetsEqualsLiabilitiesPlusEquity` (`threeStatementGate.ts:79`) |
| TS2   | Cash-flow ending cash = balance-sheet cash       | FP-0301 | `checkCashFlowTiesToBalanceSheetCash` (`threeStatementGate.ts:121`)   |
| TS1   | closing RE = opening RE + net income − dividends | FP-0302 | `checkNetIncomeToRetainedEarnings` (`threeStatementGate.ts:97`)       |

All comparisons use decimal.js cent-rounding with declared ROUND_HALF_UP and a
tolerance of 0.01 (`GATE_TOLERANCE`, `threeStatementGate.ts:26`) — same policy
as the trial-balance `balanced` flag in `gl.ts`.

### Open-ledger formulation

While a period is open, P&L balances sit outside equity, so the runtime check
over the live ledger generalizes TS3 to:

```
Assets − Expenses = Liabilities + Equity + Revenue
```

(equivalent to A = L + E + NI). A single-sided posting breaks this exactly as
it breaks debits = credits. The ledger aggregation maps account types to
identity sides in `computeEntityLedgerTotals` (`threeStatementGate.ts:215`);
the runtime query groups `gl_entries × accounts` by type for one tenant+entity
in `assertEntityLedgerIntegrity` (`threeStatementGate.ts:243`).

## 2. Where enforcement runs

Both GL entry write paths call `assertEntityLedgerIntegrity(tenantId,
entityId)` for every touched entity **inside** the write transaction, so a
violation rolls the candidate rows back:

- `POST /api/gl/entries`: insert + gate share one `db.transaction`
  (`gl.ts:241-264`).
- `POST /api/gl/entries/bulk`: gate runs after the batch inserts, inside the
  existing transaction (`gl.ts:349-353`) — an unbalanced batch is rolled back
  atomically.

The route catch translates `ThreeStatementGateError` into HTTP 422 with the
structured payload (`gl.ts:279-285`, `gl.ts:363-369`). Deletions are not yet
gated; deleting one leg of a posted pair can unbalance books (see §6).

## 3. Error contract

Codes are reserved in the stable error registry (W0.4): FP-0300 = "balance
sheet does not balance", FP-0301 = cash reconciliation, FP-0302 = net-income
link (`errorCodes.ts:126-144`, contract pinned by `errorCodes.test.ts:33,60`).

HTTP response shape on violation:

```json
{
  "error": "Three-statement gate violation",
  "code": "FP-0300",
  "violations": [
    {
      "error": {
        "code": "FP-0300",
        "message": "Three-statement gate blocked the write: ... violated by 100",
        "identity": "Assets = Liabilities + Equity (+ net income while open)",
        "check": "TS3",
        "delta": 100,
        "details": { "tenant_id": "...", "entity_id": "...", "totals": {} }
      }
    }
  ]
}
```

`identity` names the broken identity; `delta` is the signed residual
(currency units, cent-rounded); `details` carries the inputs that produced it.
`ThreeStatementGateError.toPayload()` produces this shape
(`threeStatementGate.ts:156-183`).

## 4. Non-disableable by construction

There is no env var, config knob, or feature flag anywhere in the module — no
conditional path exists to skip evaluation. This is enforced structurally by
`threeStatementGate.test.ts:262` ("is non-disableable"), which imports the
module and asserts no `disable*` / `skip*` / `bypass*` / `allow*` /
`enabled*` export exists. The only way past a violation is to fix the books.

## 5. Statement-level checks vs runtime wiring

`evaluateThreeStatements` (`threeStatementGate.ts:135`) aggregates all
provided sections and reports every violation, not first-only;
`assertThreeStatementsPass` throws for use inside transactions.

Known limitations:

- TS1 and TS2 exist as pure, tested checks but are NOT wired to any write
  path. The current schema has no retained-earnings or cash-flow-statement
  tables, so there is nothing to evaluate them against at runtime. Wiring is
  deferred until those sources land (see W0.8.6 design note).
- Runtime enforcement covers GL entry creates only (single + bulk), scoped to
  the written entity. Budget/forecast/scenario writes do not pass through the
  gate.
- Entry deletions are ungated; deleting one leg of a balanced pair will leave
  the ledger open-ledger-unbalanced until a correcting entry posts.
- The gate evaluates tenant+entity totals as-of-now, not per-period snapshots.

## 6. Writing tests against the gate

The API accepts single-sided entries only if they keep the ledger balanced —
which single-sided entries never do after seeding. Test probes must book
balanced Dr/Cr pairs:

```ts
// gl.tenancy.test.ts pattern (lines 48-57 seed an Equity counterpart;
// lines 66-96 post pairs):
entries: [
  { account_id: ASSET_ID, debit: amount, credit: 0 }, // Dr asset
  { account_id: EQUITY_ID, debit: 0, credit: amount }, // Cr equity
];
```

Seed requirements: an Asset-typed and an Equity-typed account plus the target
entity row (FK-enforced by real SQLite). See the equity seed at
`gl.tenancy.test.ts:52-57` and the pair helper comment at
`gl.tenancy.test.ts:66-69`. For deliberate-violation cases post a one-sided
entry and assert 422 / FP-0300 plus zero persisted rows
(`threeStatementGate.test.ts:171-189`); for atomicity, send an unbalanced
bulk batch and assert the prior state survived (`threeStatementGate.test.ts`
"BLOCKS an unbalanced bulk batch atomically").
