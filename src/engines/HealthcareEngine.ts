/**
 * @fileoverview Healthcare sector metrics from GL entries (AR days, denial rate, payor mix)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category healthcare
 * @sector 8 (Healthcare)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 15th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03): All patient-revenue amounts (gross charges,
 * contractual adjustments, bad debt, net revenue, cash collected, A/R, payor
 * mix) now flow through the canonical money primitive (src/utils/money.ts,
 * decimal.js, ROUND_HALF_UP). Amounts round to cents; rates round to 10
 * places. No raw + - * / on currency values remains.
 */
import type { GLEntry } from '@/types';
import { divideMoney, multiplyMoney, roundTo, subtractMoney, sumMoney } from '../utils/money';

const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export interface PatientRevenueStats {
  grossCharges: number;
  contractuals: number;
  netRevenue: number;
  cashCollected: number;
  badDebt: number;
  denialRate: number;
  daysInAR: number;
  collectionRate: number;
}

export interface PayerMix {
  name: string;
  value: number;
  color: string;
}

export class HealthcareEngine {
  /**
   * Calculates Patient Revenue metrics from GL entries
   * Assumption:
   * - 40xx: Gross Patient Service Revenue (Charges)
   * - 41xx: Contractual Adjustments (Contra-revenue)
   * - 42xx: Bad Debt Expense
   * - 11xx: Cash (Collections)
   * - 12xx: Accounts Receivable (Patient A/R)
   */
  static calculatePatientRevenue(entries: GLEntry[]): PatientRevenueStats {
    const grossChargesDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('40')).map((e) => e.amount)
    );
    const grossCharges = roundTo(grossChargesDec, CURRENCY_PLACES);

    const contractualsDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('41')).map((e) => e.amount)
    ).abs();
    const contractuals = roundTo(contractualsDec, CURRENCY_PLACES);

    const badDebtDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('42')).map((e) => e.amount)
    );
    const badDebt = roundTo(badDebtDec, CURRENCY_PLACES);

    const netRevenueDec = subtractMoney(grossChargesDec, contractualsDec);
    const netRevenue = roundTo(netRevenueDec, CURRENCY_PLACES);

    const cashCollectedDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('11')).map((e) => e.amount)
    );
    const cashCollected = roundTo(cashCollectedDec, CURRENCY_PLACES);

    const arBalanceDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('12')).map((e) => e.amount)
    );

    const collectionRate = netRevenueDec.greaterThan(0)
      ? roundTo(multiplyMoney(divideMoney(cashCollectedDec, netRevenueDec), 100), RATIO_PLACES)
      : 0;

    // Days in A/R = (A/R Balance / Net Revenue) * Days in period
    // Simple 30 day assumption for monthly revenue
    const dailyRevenueDec = divideMoney(netRevenueDec, 30);
    const daysInAR = dailyRevenueDec.greaterThan(0)
      ? roundTo(divideMoney(arBalanceDec, dailyRevenueDec), CURRENCY_PLACES)
      : 0;

    return {
      grossCharges,
      contractuals,
      netRevenue,
      cashCollected,
      badDebt,
      denialRate: 4.2, // Mocked for now, needs transaction-level detail
      daysInAR,
      collectionRate,
    };
  }

  static getPayerMix(entries: GLEntry[]): PayerMix[] {
    const payers = [
      { id: '01', name: 'Medicare', color: '#3b82f6' },
      { id: '02', name: 'Commercial', color: '#10b981' },
      { id: '03', name: 'Medicaid', color: '#f59e0b' },
      { id: '04', name: 'Self-Pay', color: '#ef4444' },
      { id: '05', name: 'Other', color: '#6366f1' },
    ];

    return payers
      .map((p) => {
        const value = roundTo(
          sumMoney(
            entries
              .filter((e) => e.accountCode.startsWith('40') && e.accountCode.endsWith(p.id))
              .map((e) => e.amount)
          ),
          CURRENCY_PLACES
        );

        return {
          name: p.name,
          value,
          color: p.color,
        };
      })
      .filter((p) => p.value > 0);
  }
}
