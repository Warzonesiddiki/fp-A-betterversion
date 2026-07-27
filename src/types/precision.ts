/**
 * Precision Math Types — Financial-Grade Integer Arithmetic
 *
 * Eliminates native JS floating-point drift by storing all currency amounts
 * as integer cents (or fractional base-units). All arithmetic uses BigInt
 * internally; display formatting converts back to decimal strings.
 *
 * DESIGN DECISION: We use a FIXED_SCALE approach (multiply by 10^DECIMAL_PLACES
 * before storage, divide on display). This is simpler and faster than a full
 * decimal.js library for our FP&A use case where we control all entry points.
 *
 * @see ADR-004 (decimal-js financial precision)
 */

/** Number of decimal places for internal storage. 4 = stores as 1/10000ths. */
export const FINANCIAL_SCALE = 4;

/** Multiplier to convert decimal → integer storage. 10^4 = 10000. */
export const SCALE_FACTOR = 10 ** FINANCIAL_SCALE;

/**
 * A precise financial amount stored as an integer (cents × 10^(SCALE-2)).
 * Example: $1,234.5678 is stored as 12345678n (BigInt) or 12345678 (number).
 */
export type PreciseAmount = bigint;

/**
 * Currency code following ISO 4217.
 */
export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

/**
 * A financial value pair: amount + currency, always stored at full precision.
 */
export interface PreciseFinancialValue {
  /** Amount in integer base-units (cents × 10^(SCALE-2)) */
  readonly amount: PreciseAmount;
  /** ISO 4217 currency code */
  readonly currency: CurrencyCode;
  /** Scale factor used for this value (default: FINANCIAL_SCALE) */
  readonly scale: number;
}

/**
 * Result of a precise arithmetic operation.
 * Carries both the value and an audit trail of the operation.
 */
export interface PrecisionResult {
  /** The computed amount in integer base-units */
  readonly value: PreciseAmount;
  /** Whether the operation caused rounding */
  readonly rounded: boolean;
  /** Original value before rounding (if rounded=true) */
  readonly originalValue?: PreciseAmount;
  /** Human-readable description of rounding applied */
  readonly roundingNote?: string;
}

/**
 * FX rate stored as a precise ratio (numerator/denominator integers).
 * Avoids floating-point drift in currency translation.
 */
export interface PreciseFXRate {
  /** Source currency */
  readonly from: CurrencyCode;
  /** Target currency */
  readonly to: CurrencyCode;
  /** Rate numerator (rate = numerator / denominator) */
  readonly numerator: PreciseAmount;
  /** Rate denominator */
  readonly denominator: PreciseAmount;
  /** Effective date */
  readonly effectiveDate: string;
  /** Rate source (e.g., 'ECB', 'Reuters', 'manual') */
  readonly source: string;
}

/**
 * Consolidation elimination entry with precise amounts.
 */
export interface PreciseEliminationEntry {
  readonly id: string;
  readonly entityId: string;
  readonly counterpartyId: string;
  readonly accountCode: string;
  readonly debitAmount: PreciseAmount;
  readonly creditAmount: PreciseAmount;
  readonly currency: CurrencyCode;
  readonly description: string;
}
