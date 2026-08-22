import { Decimal } from 'decimal.js';
import { db } from '../db/connection.js';

/**
 * W0.3 — Runtime three-statement integrity gate (Constitution 5.2, §18.2 0.3.1).
 *
 * Promotes the TS1–TS3 oracles from test-time assertions to RUNTIME gates on
 * server write paths. Properties:
 *
 *   - NON-DISABLEABLE: there is deliberately NO env flag, config knob, or
 *     feature toggle anywhere in this module. The only way past a violation
 *     is to fix the books.
 *   - BLOCKING: write paths MUST call `evaluateThreeStatements` /
 *     `assertEntityLedgerIntegrity` inside their write transaction so a
 *     violating write rolls back.
 *   - STRUCTURED ERRORS: every violation names the broken identity, its
 *     stable FP-code (error registry W0.4), and the exact delta.
 *
 * Checks:
 *   TS3 (FP-0300) Assets = Liabilities + Equity
 *   TS2 (FP-0301) Cash-flow ending cash ties to balance-sheet cash
 *   TS1 (FP-0302) Net income flows into retained earnings
 */

/** Cent-level tolerance — same policy as the trial-balance `balanced` flag. */
export const GATE_TOLERANCE = new Decimal('0.01');

const cent = (v: number | string | Decimal): Decimal =>
  new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

// ---------------------------------------------------------------------------
// Pure statement-level checks (unit-testable without any database)
// ---------------------------------------------------------------------------

export interface BalanceSheetSnapshot {
  assets: number;
  liabilities: number;
  equity: number;
}

export interface RetainedEarningsSnapshot {
  netIncome: number;
  openingRetainedEarnings: number;
  closingRetainedEarnings: number;
  /** Dividends/distributions declared during the period (reduce RE). */
  dividends: number;
}

export interface CashTieSnapshot {
  cashFlowEndingCash: number;
  balanceSheetCash: number;
}

/** Inputs for a full three-statement evaluation. All sections optional. */
export interface ThreeStatementInput {
  balanceSheet?: BalanceSheetSnapshot;
  retainedEarnings?: RetainedEarningsSnapshot;
  cashTie?: CashTieSnapshot;
}

export type GateCheckId = 'TS1' | 'TS2' | 'TS3';

export interface GateViolation {
  readonly check: GateCheckId;
  readonly errorCode: 'FP-0300' | 'FP-0301' | 'FP-0302' | 'FP-0303';
  readonly httpStatus: 422;
  /** Human-readable name of the broken accounting identity. */
  readonly identity: string;
  /** Signed residual of the identity in currency units (cent-rounded). */
  readonly delta: number;
  readonly details: Record<string, unknown>;
}

export type GateResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly violations: readonly GateViolation[] };

/** TS3 — Assets = Liabilities + Equity. */
export function checkAssetsEqualsLiabilitiesPlusEquity(
  snap: BalanceSheetSnapshot
): GateViolation | null {
  const assets = cent(snap.assets);
  const right = cent(snap.liabilities).plus(cent(snap.equity));
  const delta = assets.minus(right);
  if (delta.abs().lt(GATE_TOLERANCE)) return null;
  return {
    check: 'TS3',
    errorCode: 'FP-0300',
    httpStatus: 422,
    identity: 'Assets = Liabilities + Equity',
    delta: delta.toNumber(),
    details: { assets: snap.assets, liabilities: snap.liabilities, equity: snap.equity },
  };
}

/** TS1 — closing RE = opening RE + net income − dividends. */
export function checkNetIncomeToRetainedEarnings(
  snap: RetainedEarningsSnapshot
): GateViolation | null {
  const expected = cent(snap.openingRetainedEarnings)
    .plus(cent(snap.netIncome))
    .minus(cent(snap.dividends));
  const delta = cent(snap.closingRetainedEarnings).minus(expected);
  if (delta.abs().lt(GATE_TOLERANCE)) return null;
  return {
    check: 'TS1',
    errorCode: 'FP-0302',
    httpStatus: 422,
    identity: 'Net income -> retained earnings',
    delta: delta.toNumber(),
    details: {
      netIncome: snap.netIncome,
      openingRetainedEarnings: snap.openingRetainedEarnings,
      closingRetainedEarnings: snap.closingRetainedEarnings,
      dividends: snap.dividends,
    },
  };
}

/** TS2 — cash-flow ending cash must tie to balance-sheet cash. */
export function checkCashFlowTiesToBalanceSheetCash(snap: CashTieSnapshot): GateViolation | null {
  const delta = cent(snap.cashFlowEndingCash).minus(cent(snap.balanceSheetCash));
  if (delta.abs().lt(GATE_TOLERANCE)) return null;
  return {
    check: 'TS2',
    errorCode: 'FP-0301',
    httpStatus: 422,
    identity: 'Cash flow ending cash = balance sheet cash',
    delta: delta.toNumber(),
    details: {
      cashFlowEndingCash: snap.cashFlowEndingCash,
      balanceSheetCash: snap.balanceSheetCash,
    },
  };
}

/** Evaluate every provided section; collect ALL violations (never first-only). */
export function evaluateThreeStatements(input: ThreeStatementInput): GateResult {
  const violations: GateViolation[] = [];
  if (input.balanceSheet) {
    const v = checkAssetsEqualsLiabilitiesPlusEquity(input.balanceSheet);
    if (v) violations.push(v);
  }
  if (input.retainedEarnings) {
    const v = checkNetIncomeToRetainedEarnings(input.retainedEarnings);
    if (v) violations.push(v);
  }
  if (input.cashTie) {
    const v = checkCashFlowTiesToBalanceSheetCash(input.cashTie);
    if (v) violations.push(v);
  }
  return violations.length > 0 ? { ok: false, violations } : { ok: true };
}

// ---------------------------------------------------------------------------
// Blocking error type (thrown by assert helpers inside write transactions)
// ---------------------------------------------------------------------------

export class ThreeStatementGateError extends Error {
  readonly violations: readonly GateViolation[];

  constructor(violations: readonly GateViolation[]) {
    super(
      `Three-statement gate violation: ${violations
        .map((v) => `${v.identity} (delta ${v.delta}) [${v.errorCode}]`)
        .join('; ')}`
    );
    this.name = 'ThreeStatementGateError';
    this.violations = violations;
  }

  /** Structured HTTP payload per violation (stable error registry codes). */
  toPayload(): Array<Record<string, unknown>> {
    return this.violations.map((v) => ({
      error: {
        code: v.errorCode,
        message: `Three-statement gate blocked the write: ${v.identity} is violated by ${v.delta}`,
        identity: v.identity,
        check: v.check,
        delta: v.delta,
        details: v.details,
      },
    }));
  }
}

/** Throw (rolling back any surrounding better-sqlite3 transaction) on violation. */
export function assertThreeStatementsPass(input: ThreeStatementInput): void {
  const result = evaluateThreeStatements(input);
  if (!result.ok) throw new ThreeStatementGateError(result.violations);
}

// ---------------------------------------------------------------------------
// Ledger-derived runtime check used by GL write paths
// ---------------------------------------------------------------------------

/**
 * For an OPEN ledger the balance-sheet identity generalizes to
 *   Assets + Expenses = Liabilities + Equity + Revenue
 * i.e. Assets = Liabilities + Equity + NetIncome while P&L accounts remain
 * unclosed. Debit-normal magnitudes (assets incl. CapEx; expenses =
 * OpEx + COGS) sit on the left; credit-normal magnitudes on the right.
 * A single-sided posting breaks this identity exactly as it breaks
 * debits = credits.
 */
export interface EntityLedgerTotals {
  assets: number;
  liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
}

/**
 * One row per account type with the type's NET position in INTEGER CENTS
 * (W0.3-fix LOW): SQLite REAL accumulation of debit/credit sums drifts on
 * very large ledgers, so the SQL sums `ROUND(x*100)` cast to INTEGER and the
 * conversion back to currency happens exactly in Decimal space.
 */
interface TypeNetRow {
  type: string;
  net_cents: number;
}

/**
 * The CLOSED account-type vocabulary of the shared schema
 * (`src-tauri/migrations/001_initial_schema.sql`, mirrored by the W0.8.4
 * schema-equality gate):
 *
 *   ('Revenue', 'COGS', 'OpEx', 'CapEx', 'Asset', 'Liability', 'Equity')
 *
 * mapped onto the open-ledger identity by natural balance:
 *   debit-normal  -> Asset, CapEx, OpEx, COGS   (assets / expenses)
 *   credit-normal -> Liability, Equity, Revenue
 *
 * Every enum value lands on exactly one side. A type OUTSIDE the enum is
 * never silently dropped from the identity — that silent-drop is the
 * session-026 Severity-0 class — aggregation fails closed instead (FP-0303).
 */

/** Pure aggregation over per-type net-cent rows (unit-testable). */
export function computeEntityLedgerTotals(rows: readonly TypeNetRow[]): EntityLedgerTotals {
  const byType = new Map<string, Decimal>();
  for (const row of rows) {
    // Integer cents -> currency is an exact division by 100 in Decimal.
    const net = new Decimal(row.net_cents ?? 0).div(100);
    byType.set(row.type, (byType.get(row.type) ?? new Decimal(0)).plus(net));
  }
  for (const type of byType.keys()) {
    if (
      type !== 'Asset' &&
      type !== 'CapEx' &&
      type !== 'OpEx' &&
      type !== 'COGS' &&
      type !== 'Liability' &&
      type !== 'Equity' &&
      type !== 'Revenue'
    ) {
      throw new ThreeStatementGateError([
        {
          check: 'TS3',
          errorCode: 'FP-0303',
          httpStatus: 422,
          identity: 'Account-type vocabulary is a closed set',
          delta: 0,
          details: {
            unmappedType: type,
            note: 'The chart of accounts carries a type outside Revenue/COGS/OpEx/CapEx/Asset/Liability/Equity; the three-statement gate refuses to guess its natural balance.',
          },
        },
      ]);
    }
  }
  // Normalize Decimal's signed zero so an absent/empty class reports exact +0.
  const sideOf = (names: readonly string[], sign: 1 | -1): number => {
    let total = new Decimal(0);
    for (const name of names) {
      const n = byType.get(name);
      if (n !== undefined) total = total.plus(n);
    }
    const v = total.times(sign).toNumber();
    return v === 0 ? 0 : v;
  };
  return {
    assets: sideOf(['Asset', 'CapEx'], 1),
    liabilities: sideOf(['Liability'], -1),
    equity: sideOf(['Equity'], -1),
    revenue: sideOf(['Revenue'], -1),
    expenses: sideOf(['OpEx', 'COGS'], 1),
  };
}

/**
 * Runtime TS3 gate over the live ledger for one tenant+entity. Called AFTER
 * the candidate rows are inserted INSIDE the write transaction, so a thrown
 * {@link ThreeStatementGateError} rolls the write back entirely.
 * Non-disableable by construction — there is no flag to consult.
 */
export function assertEntityLedgerIntegrity(tenantId: string, entityId: string): void {
  const rows = db
    .prepare(
      `SELECT a.type AS type,
              COALESCE(SUM(CAST(ROUND(COALESCE(ge.debit, 0) * 100) AS INTEGER)), 0)
                - COALESCE(SUM(CAST(ROUND(COALESCE(ge.credit, 0) * 100) AS INTEGER)), 0)
                AS net_cents
       FROM gl_entries ge
       JOIN accounts a ON a.id = ge.account_id
       WHERE ge.tenant_id = ? AND ge.entity_id = ? AND ge.deleted_at IS NULL
       GROUP BY a.type`
    )
    .all(tenantId, entityId) as TypeNetRow[];

  const totals = computeEntityLedgerTotals(rows);
  // Open-ledger identity while P&L accounts are unclosed:
  //   A + Exp = L + E + Rev  <=>  A = L + E + (Rev − Exp) = L + E + NI
  // Debit-normal magnitudes (assets, expenses) sit on the left; credit-normal
  // magnitudes (liabilities, equity, revenue) on the right. Writing the left
  // side as `A − Exp` instead would report delta = −2·Exp on every balanced
  // ledger that carries expense activity (W0.3-fix S0).
  const left = cent(totals.assets).plus(cent(totals.expenses));
  const right = cent(totals.liabilities).plus(cent(totals.equity)).plus(cent(totals.revenue));
  const delta = left.minus(right);
  if (delta.abs().lt(GATE_TOLERANCE)) return;

  throw new ThreeStatementGateError([
    {
      check: 'TS3',
      errorCode: 'FP-0300',
      httpStatus: 422,
      identity: 'Assets = Liabilities + Equity (+ net income while open)',
      delta: delta.toNumber(),
      // Payload hygiene (W0.3-fix INFO): tenant_id is caller-derivable and
      // must not be echoed into API error payloads.
      details: { entity_id: entityId, totals },
    },
  ]);
}
