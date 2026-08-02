/**
 * GAP-1 (F-0006) known-answer tests for LeaseEngine's money migration.
 *
 * These are ASC 842 / IFRS 16 figures — the right-of-use asset and lease
 * liability go straight onto the balance sheet, and this engine backs the lease
 * data-entry surface shipped under GAP-NEW-A. Every case is a FIXED input ->
 * EXACT expected decimal asserted with `toBe` (Object.is); the pre-migration
 * float literal is recorded inline where it differed.
 *
 * Two invariants get first-class coverage because they are what an auditor
 * actually checks:
 *   1. payment = interest + reduction on the REPORTED cents, every period.
 *   2. a fully amortized schedule closes at EXACTLY zero.
 */
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { LeaseEngine, type LeaseContract } from './LeaseEngine';

/** Exact cent addition — plain `a + b` on two cent values re-introduces the very
 *  float error under test (60.16 + 2440.39 === 2500.5499999999997). */
const addCents = (a: number, b: number) =>
  new Decimal(a).plus(new Decimal(b)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

const lease = (over: Partial<LeaseContract> = {}): LeaseContract => ({
  id: 'L-KA',
  assetDescription: 'Known-answer fixture',
  commencementDate: '2026-01-01',
  leaseTerm: 12,
  leasePayments: Array(12).fill(5000),
  discountRate: 0.05,
  ...over,
});

/** 36 monthly payments of 2500.55 at 6% — exercises cent-level inputs. */
const centLease = () =>
  lease({ leaseTerm: 36, leasePayments: Array(36).fill(2500.55), discountRate: 0.06 });

describe('LeaseEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('generateDisclosure', () => {
    it('sums total lease payments exactly (float gave 90019.80000000006)', () => {
      // 36 x 2500.55 = 90,019.80
      expect(LeaseEngine.generateDisclosure(centLease()).totalLeasePayments).toBe(90019.8);
    });

    it('reports the ROU asset and liability as the same cent-rounded PV', () => {
      const d = LeaseEngine.generateDisclosure(centLease());
      expect(d.rightOfUseAsset).toBe(82390.52);
      // ASC 842: at commencement the ROU asset equals the lease liability.
      expect(d.leaseLiability).toBe(d.rightOfUseAsset);
    });

    it('computes the PV of a whole-dollar schedule exactly', () => {
      expect(LeaseEngine.generateDisclosure(lease()).rightOfUseAsset).toBe(58440.85);
    });

    it('discounts nothing when the rate is zero', () => {
      const d = LeaseEngine.generateDisclosure(
        lease({ leaseTerm: 4, leasePayments: [0.1, 0.1, 0.1, 0.1], discountRate: 0 })
      );
      // Float: 0.1 x 4 === 0.4 only by luck; the sum path is what drifts.
      expect(d.rightOfUseAsset).toBe(0.4);
      expect(d.totalLeasePayments).toBe(0.4);
    });
  });

  describe('calculateLeaseLiability', () => {
    it('produces an exact opening balance, interest and reduction in month 1', () => {
      const [first] = LeaseEngine.calculateLeaseLiability(lease());
      expect(first!.openingBalance).toBe(58440.85);
      expect(first!.interest).toBe(238.1);
      expect(first!.reduction).toBe(4761.9);
      expect(first!.payment).toBe(5000);
    });

    it('holds payment = interest + reduction on the REPORTED cents in every period', () => {
      // The adversarial case: exact interest 238.095 and exact reduction
      // 4761.905 each round HALF-UP to 238.10 and 4761.91, which sum to 5000.01
      // against a 5000.00 payment. Reduction is derived as the balancing figure
      // so the identity cannot break.
      for (const l of [lease(), centLease()]) {
        for (const p of LeaseEngine.calculateLeaseLiability(l)) {
          expect(addCents(p.interest, p.reduction)).toBe(p.payment);
        }
      }
    });

    it('closes a fully amortized liability at exactly zero', () => {
      const sched = LeaseEngine.calculateLeaseLiability(lease());
      expect(sched).toHaveLength(12);
      expect(sched.at(-1)!.closingBalance).toBe(0);
    });

    it('never emits a negative closing balance', () => {
      for (const p of LeaseEngine.calculateLeaseLiability(centLease())) {
        expect(p.closingBalance).toBeGreaterThanOrEqual(0);
      }
    });

    it('carries each period opening balance from the prior closing balance', () => {
      const sched = LeaseEngine.calculateLeaseLiability(centLease());
      for (let i = 1; i < sched.length; i++) {
        // Rounded to cents on both sides, so this is an exact equality.
        expect(sched[i]!.openingBalance).toBe(sched[i - 1]!.closingBalance);
      }
    });

    it('rejects a negative discount rate loudly instead of producing a wrong schedule', () => {
      expect(() => LeaseEngine.calculateLeaseLiability(lease({ discountRate: -0.01 }))).toThrow(
        /discountRate must be a non-negative finite number/
      );
    });

    it('returns an empty schedule for a zero-length lease', () => {
      expect(LeaseEngine.calculateLeaseLiability(lease({ leaseTerm: 0 }))).toEqual([]);
      expect(LeaseEngine.calculateLeaseLiability(lease({ leasePayments: [] }))).toEqual([]);
    });
  });

  describe('calculateROUAsset', () => {
    it('depreciates straight-line to EXACTLY zero (float left -7.4e-11)', () => {
      // Straight-line depreciation of a PV that does not divide evenly left a
      // residue in floats, so a fully amortized ROU asset reported a non-zero
      // closing balance.
      const sched = LeaseEngine.calculateROUAsset(centLease());
      expect(sched).toHaveLength(36);
      expect(sched.at(-1)!.closingBalance).toBe(0);
    });

    it('uses a constant cent-rounded monthly depreciation', () => {
      const sched = LeaseEngine.calculateROUAsset(centLease());
      // PV 82,390.52 / 36 = 2,288.6255... -> 2,288.63
      expect(sched[0]!.depreciation).toBe(2288.63);
      expect(new Set(sched.map((s) => s.depreciation)).size).toBe(1);
    });

    it('opens at the present value of the payments', () => {
      expect(LeaseEngine.calculateROUAsset(centLease())[0]!.openingBalance).toBe(82390.52);
    });

    it('never emits a negative closing balance', () => {
      for (const p of LeaseEngine.calculateROUAsset(lease())) {
        expect(p.closingBalance).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('terminateLease', () => {
    it('computes gain/loss on termination exactly', () => {
      // Terminating at the final period leaves both balances at 0, so the
      // gain/loss is purely the termination fee.
      const result = LeaseEngine.terminateLease(lease(), 12, 1000.1);
      expect(result.remainingLiability).toBe(0);
      expect(result.rouAssetRemoval).toBe(0);
      expect(result.gainOrLoss).toBe(1000.1);
    });

    it('nets the fee against the derecognized balances without drift', () => {
      const result = LeaseEngine.terminateLease(centLease(), 18, 0.2);
      // gainOrLoss = remainingLiability + fee - rouAssetRemoval, on exact decimals
      const expected =
        Math.round((result.remainingLiability + 0.2 - result.rouAssetRemoval) * 100) / 100;
      expect(result.gainOrLoss).toBe(expected);
    });
  });

  describe('testImpairment', () => {
    it('reports an exact impairment loss at cent precision', () => {
      const asset = {
        period: 'Month 1',
        openingBalance: 1000.1,
        depreciation: 0,
        closingBalance: 1000.1,
      };
      // 1000.10 - 500.05 = 500.05 (float: 500.04999999999995)
      const result = LeaseEngine.testImpairment(asset, 500.05, 900);
      expect(result.impaired).toBe(true);
      expect(result.impairmentLoss).toBe(500.05);
    });

    it('reports no impairment when undiscounted cash flows recover the carrying amount', () => {
      const asset = {
        period: 'Month 1',
        openingBalance: 1000,
        depreciation: 0,
        closingBalance: 1000,
      };
      expect(LeaseEngine.testImpairment(asset, 100, 1200)).toEqual({
        impaired: false,
        impairmentLoss: 0,
      });
    });

    it('clamps a negative loss to zero when fair value exceeds the carrying amount', () => {
      const asset = {
        period: 'Month 1',
        openingBalance: 1000,
        depreciation: 0,
        closingBalance: 1000,
      };
      const result = LeaseEngine.testImpairment(asset, 1500, 900);
      expect(result.impairmentLoss).toBe(0);
      expect(result.impaired).toBe(false);
    });
  });

  describe('classifyLease (ASC 842 90% test)', () => {
    it('classifies as finance right AT the 90%-of-fair-value threshold', () => {
      // The boundary is evaluated on the engine's EXACT internal PV, not the
      // cent-rounded disclosure figure. Rounding the fair value UP by even one
      // cent lifts the threshold above the PV and flips the classification —
      // which is precisely why this comparison must not run on floats.
      const l = lease();
      const monthlyRate = new Decimal(1.05).pow(new Decimal(1).div(12)).minus(1);
      const onePlus = new Decimal(1).plus(monthlyRate);
      const pv = l.leasePayments.reduce(
        (acc: Decimal, p, i) => acc.plus(new Decimal(p).div(onePlus.pow(i + 1))),
        new Decimal(0)
      );
      // fairValue x 0.9 === pv exactly -> the >= test passes.
      const atThreshold = pv.div('0.9');
      expect(LeaseEngine.classifyLease(l, atThreshold.toNumber())).toBe('finance');

      // One cent of extra fair value puts the PV below 90% -> operating.
      const justAbove = atThreshold.plus('0.01');
      expect(LeaseEngine.classifyLease(l, justAbove.toNumber())).toBe('operating');
    });

    it('classifies as operating when PV falls below the 90% threshold', () => {
      const l = lease();
      const pv = LeaseEngine.generateDisclosure(l).rightOfUseAsset;
      expect(LeaseEngine.classifyLease(l, (pv / 0.9) * 1.5)).toBe('operating');
    });

    it('short-circuits to finance on transfer of ownership', () => {
      expect(LeaseEngine.classifyLease(lease({ transferOfOwnership: true }), 10_000_000)).toBe(
        'finance'
      );
    });
  });
});
