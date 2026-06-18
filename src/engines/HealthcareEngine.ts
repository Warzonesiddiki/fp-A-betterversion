/**
 * @fileoverview Healthcare sector metrics from GL entries (AR days, denial rate, payor mix)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category healthcare
 * @sector 8 (Healthcare)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 15th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type { GLEntry } from '@/types';

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
    const grossCharges = entries
      .filter((e) => e.accountCode.startsWith('40'))
      .reduce((acc, e) => acc + e.amount, 0);

    const contractuals = Math.abs(
      entries.filter((e) => e.accountCode.startsWith('41')).reduce((acc, e) => acc + e.amount, 0)
    );

    const badDebt = entries
      .filter((e) => e.accountCode.startsWith('42'))
      .reduce((acc, e) => acc + e.amount, 0);

    const netRevenue = grossCharges - contractuals;

    const cashCollected = entries
      .filter((e) => e.accountCode.startsWith('11'))
      .reduce((acc, e) => acc + e.amount, 0);

    const arBalance = entries
      .filter((e) => e.accountCode.startsWith('12'))
      .reduce((acc, e) => acc + e.amount, 0);

    const collectionRate = netRevenue > 0 ? (cashCollected / netRevenue) * 100 : 0;

    // Days in A/R = (A/R Balance / Net Revenue) * Days in period
    // Simple 365 day assumption for daily revenue
    const dailyRevenue = netRevenue / 30; // Assuming monthly view for now
    const daysInAR = dailyRevenue > 0 ? arBalance / dailyRevenue : 0;

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
        const value = entries
          .filter((e) => e.accountCode.startsWith('40') && e.accountCode.endsWith(p.id))
          .reduce((acc, e) => acc + e.amount, 0);

        return {
          name: p.name,
          value,
          color: p.color,
        };
      })
      .filter((p) => p.value > 0);
  }
}
