import { describe, it, expect } from 'vitest';
import { FormulaFunctionRegistry } from './FormulaFunctionRegistry';

describe('FormulaFunctionRegistry', () => {
  // =========================================================================
  // REGISTRY API
  // =========================================================================

  describe('registry API', () => {
    it('should have all functions registered after initialize', () => {
      expect(FormulaFunctionRegistry.has('EBITDA')).toBe(true);
      expect(FormulaFunctionRegistry.has('NPV')).toBe(true);
      expect(FormulaFunctionRegistry.has('ALLOCATE')).toBe(true);
      expect(FormulaFunctionRegistry.has('SUM')).toBe(true);
      expect(FormulaFunctionRegistry.has('IFS')).toBe(true);
    });

    it('should list all registered functions', () => {
      const list = FormulaFunctionRegistry.list();
      expect(list.length).toBeGreaterThanOrEqual(50);
      expect(list).toContain('EBITDA');
      expect(list).toContain('NPV');
      expect(list).toContain('CAGR');
    });

    it('should list functions by category', () => {
      const financial = FormulaFunctionRegistry.listByCategory('financial');
      expect(financial).toContain('EBITDA');
      expect(financial).toContain('NPV');
      expect(financial).toContain('IRR');
    });

    it('should get function by name', () => {
      const fn = FormulaFunctionRegistry.get('EBITDA');
      expect(fn).toBeDefined();
      expect(fn!.name).toBe('EBITDA');
      expect(fn!.category).toBe('financial');
    });

    it('should return undefined for unknown function', () => {
      expect(FormulaFunctionRegistry.get('UNKNOWN')).toBeUndefined();
    });

    it('should call function by name', () => {
      const result = FormulaFunctionRegistry.call('EBITDA', 1000, 400, 300);
      expect(result).toBe(300);
    });

    it('should throw for unknown function call', () => {
      expect(() => FormulaFunctionRegistry.call('UNKNOWN', 1)).toThrow('Unknown function');
    });

    it('should throw for insufficient arguments', () => {
      expect(() => FormulaFunctionRegistry.call('EBITDA', 1000, 400)).toThrow(
        'requires at least 3'
      );
    });

    it('should be case insensitive', () => {
      expect(FormulaFunctionRegistry.has('ebitda')).toBe(true);
      expect(FormulaFunctionRegistry.has('Ebitda')).toBe(true);
    });
  });

  // =========================================================================
  // FINANCIAL FUNCTIONS
  // =========================================================================

  describe('financial functions', () => {
    it('EBITDA: revenue - cogs - opex', () => {
      expect(FormulaFunctionRegistry.EBITDA(1000, 400, 300)).toBe(300);
      expect(FormulaFunctionRegistry.EBITDA(5000, 2000, 1500)).toBe(1500);
    });

    it('EBIT: ebitda - depreciation', () => {
      expect(FormulaFunctionRegistry.EBIT(300, 50)).toBe(250);
      expect(FormulaFunctionRegistry.EBIT(1000, 200)).toBe(800);
    });

    it('NOPAT: ebit * (1 - taxRate)', () => {
      expect(FormulaFunctionRegistry.NOPAT(100, 0.25)).toBe(75);
      expect(FormulaFunctionRegistry.NOPAT(200, 0.3)).toBeCloseTo(140);
    });

    it('FCFF: nopat + depreciation - capex - deltaWC', () => {
      expect(FormulaFunctionRegistry.FCFF(100, 50, 30, 10)).toBe(110);
      expect(FormulaFunctionRegistry.FCFF(200, 80, 100, 20)).toBe(160);
    });

    it('FCFE: fcff + netBorrowing', () => {
      expect(FormulaFunctionRegistry.FCFE(110, 20)).toBe(130);
      expect(FormulaFunctionRegistry.FCFE(100, -30)).toBe(70);
    });

    it('WACC: weighted average cost of capital', () => {
      // 60% equity at 10%, 40% debt at 6%, 25% tax
      const wacc = FormulaFunctionRegistry.WACC(0.6, 0.1, 0.4, 0.06, 0.25);
      expect(wacc).toBeCloseTo(0.078); // 0.06 + 0.018
    });

    it('NPV: net present value', () => {
      // Standard NPV: cashflow[0] at time 0, cashflow[1] at time 1, etc.
      const npv = FormulaFunctionRegistry.NPV(0.1, [-1000, 300, 420, 680] as any);
      expect(npv).toBeCloseTo(130.73);
    });

    it('NPV: single cashflow at time 1', () => {
      expect(FormulaFunctionRegistry.NPV(0.05, [0, 1050] as any)).toBeCloseTo(1000);
    });

    it('IRR: internal rate of return', () => {
      const irr = FormulaFunctionRegistry.IRR([-1000, 300, 420, 680] as any);
      expect(irr).toBeCloseTo(0.1634, 2);
    });

    it('IRR: simple two-period', () => {
      const irr = FormulaFunctionRegistry.IRR([-100, 110] as any);
      expect(irr).toBeCloseTo(0.1);
    });

    it('PV: present value', () => {
      const pv = FormulaFunctionRegistry.PV(0.05, 10, 100, 0);
      expect(pv).toBeCloseTo(-772.17);
    });

    it('PV: zero rate', () => {
      expect(FormulaFunctionRegistry.PV(0, 5, 100, 0)).toBe(-500);
    });

    it('FV: future value', () => {
      const fv = FormulaFunctionRegistry.FV(0.05, 10, -100, 0);
      expect(fv).toBeCloseTo(1257.79);
    });

    it('FV: zero rate', () => {
      expect(FormulaFunctionRegistry.FV(0, 5, -100, 0)).toBe(500);
    });

    it('PMT: payment per period', () => {
      const pmt = FormulaFunctionRegistry.PMT(0.05 / 12, 360, 200000);
      expect(pmt).toBeCloseTo(-1073.64);
    });

    it('PMT: zero rate', () => {
      expect(FormulaFunctionRegistry.PMT(0, 12, 12000)).toBe(-1000);
    });

    it('CAGR: compound annual growth rate', () => {
      expect(FormulaFunctionRegistry.CAGR(100, 200, 5)).toBeCloseTo(0.1487, 2);
      expect(FormulaFunctionRegistry.CAGR(1000, 2000, 10)).toBeCloseTo(0.0718, 2);
    });

    it('CAGR: zero begin value', () => {
      expect(FormulaFunctionRegistry.CAGR(0, 100, 5)).toBe(0);
    });

    it('PAYBACK: payback period', () => {
      expect(FormulaFunctionRegistry.PAYBACK([-100, 30, 40, 50, 20])).toBe(3);
      expect(FormulaFunctionRegistry.PAYBACK([-100, 10, 20, 30, 40, 50])).toBe(4);
    });

    it('PAYBACK: never pays back', () => {
      expect(FormulaFunctionRegistry.PAYBACK([-100, 10, 10])).toBe(-1);
    });

    it('DPO: days payable outstanding', () => {
      expect(FormulaFunctionRegistry.DPO(1000, 200, 365)).toBeCloseTo(73);
    });

    it('DSI: days sales of inventory', () => {
      expect(FormulaFunctionRegistry.DSI(500, 2000, 365)).toBeCloseTo(91.25);
    });

    it('DSO: days sales outstanding', () => {
      expect(FormulaFunctionRegistry.DSO(5000, 800, 365)).toBeCloseTo(58.4);
    });
  });

  // =========================================================================
  // GROWTH & TIME SERIES FUNCTIONS
  // =========================================================================

  describe('growth & time series functions', () => {
    it('GROWTH_RATE: (current - previous) / |previous|', () => {
      expect(FormulaFunctionRegistry.GROWTH_RATE(120, 100)).toBeCloseTo(0.2);
      expect(FormulaFunctionRegistry.GROWTH_RATE(80, 100)).toBeCloseTo(-0.2);
    });

    it('GROWTH_RATE: zero previous', () => {
      expect(FormulaFunctionRegistry.GROWTH_RATE(100, 0)).toBe(0);
    });

    it('YOY: year-over-year growth', () => {
      expect(FormulaFunctionRegistry.YOY(110, 100)).toBeCloseTo(0.1);
    });

    it('MOM: month-over-month growth', () => {
      expect(FormulaFunctionRegistry.MOM(55, 50)).toBeCloseTo(0.1);
    });

    it('YTD: year-to-date sum', () => {
      const months = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
      expect(FormulaFunctionRegistry.YTD(months, 2)).toBe(60); // Jan+Feb+Mar
      expect(FormulaFunctionRegistry.YTD(months, 5)).toBe(210); // Jan-Jun
    });

    it('QTD: quarter-to-date sum', () => {
      const months = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
      expect(FormulaFunctionRegistry.QTD(months, 0)).toBe(60); // Q1: Jan+Feb+Mar
      expect(FormulaFunctionRegistry.QTD(months, 1)).toBe(150); // Q2: Apr+May+Jun
    });

    it('ROLLING: rolling average', () => {
      const result = FormulaFunctionRegistry.ROLLING([10, 20, 30, 40, 50], 3);
      expect(result).toEqual([20, 30, 40]);
    });

    it('ROLLING: window larger than data', () => {
      expect(FormulaFunctionRegistry.ROLLING([10, 20], 3)).toEqual([]);
    });

    it('TREND: linear trend', () => {
      const result = FormulaFunctionRegistry.TREND([10, 20, 30, 40, 50]);
      expect(result).toEqual([10, 20, 30, 40, 50]);
    });

    it('MOVING_AVERAGE: same as ROLLING', () => {
      const result = FormulaFunctionRegistry.MOVING_AVERAGE([10, 20, 30, 40], 2);
      expect(result).toEqual([15, 25, 35]);
    });

    it('WEIGHTED_AVERAGE', () => {
      expect(
        FormulaFunctionRegistry.WEIGHTED_AVERAGE([10, 20, 30] as any, [1, 2, 3] as any)
      ).toBeCloseTo(23.33);
    });

    it('WEIGHTED_AVERAGE: mismatched lengths', () => {
      expect(() => FormulaFunctionRegistry.WEIGHTED_AVERAGE([1, 2] as any, [1] as any)).toThrow(
        'must match'
      );
    });

    it('PERCENTILE', () => {
      expect(FormulaFunctionRegistry.PERCENTILE([10, 20, 30, 40, 50] as any, 50)).toBe(30);
      expect(FormulaFunctionRegistry.PERCENTILE([10, 20, 30, 40, 50], 0)).toBe(10);
      expect(FormulaFunctionRegistry.PERCENTILE([10, 20, 30, 40, 50], 100)).toBe(50);
    });
  });

  // =========================================================================
  // ALLOCATION FUNCTIONS
  // =========================================================================

  describe('allocation functions', () => {
    it('ALLOCATE: distribute by weights', () => {
      expect(FormulaFunctionRegistry.ALLOCATE(1000, [1, 2, 3])).toEqual([
        1000 / 6,
        2000 / 6,
        3000 / 6,
      ]);
    });

    it('ALLOCATE: zero weights', () => {
      expect(FormulaFunctionRegistry.ALLOCATE(1000, [0, 0])).toEqual([0, 0]);
    });

    it('SPREAD: even distribution', () => {
      expect(FormulaFunctionRegistry.SPREAD(1200, 4)).toEqual([300, 300, 300, 300]);
    });

    it('SPREAD: zero periods', () => {
      expect(FormulaFunctionRegistry.SPREAD(1000, 0)).toEqual([]);
    });

    it('DISTRIBUTE: by distribution array', () => {
      const result = FormulaFunctionRegistry.DISTRIBUTE(1000, [10, 20, 30, 40]);
      expect(result[0]).toBeCloseTo(100);
      expect(result[3]).toBeCloseTo(400);
    });

    it('SPLIT: by ratios', () => {
      const result = FormulaFunctionRegistry.SPLIT(1000, [2, 3, 5]);
      expect(result).toEqual([200, 300, 500]);
    });

    it('PRO_RATA: proportional allocation', () => {
      expect(FormulaFunctionRegistry.PRO_RATA(1000, 30, 100)).toBe(300);
      expect(FormulaFunctionRegistry.PRO_RATA(1000, 0, 100)).toBe(0);
    });

    it('PRO_RATA: zero total basis', () => {
      expect(FormulaFunctionRegistry.PRO_RATA(1000, 30, 0)).toBe(0);
    });
  });

  // =========================================================================
  // CURRENCY & CONSOLIDATION FUNCTIONS
  // =========================================================================

  describe('currency & consolidation functions', () => {
    it('CONVERT_CURRENCY: amount * rate', () => {
      expect(FormulaFunctionRegistry.CONVERT_CURRENCY(1000, 1.2)).toBe(1200);
      expect(FormulaFunctionRegistry.CONVERT_CURRENCY(500, 0.85)).toBe(425);
    });

    it('TRANSLATE: amount * rate', () => {
      expect(FormulaFunctionRegistry.TRANSLATE(1000, 1.1)).toBe(1100);
    });

    it('ELIMINATE: reduce by percentage', () => {
      expect(FormulaFunctionRegistry.ELIMINATE(1000, 0.8)).toBeCloseTo(200);
      expect(FormulaFunctionRegistry.ELIMINATE(1000, 1)).toBe(0);
    });

    it('FX_GAIN_LOSS: gain from rate change', () => {
      expect(FormulaFunctionRegistry.FX_GAIN_LOSS(1000, 1.0, 1.2)).toBeCloseTo(200);
      expect(FormulaFunctionRegistry.FX_GAIN_LOSS(1000, 1.2, 1.0)).toBeCloseTo(-200);
    });

    it('HYPERINFLATION_ADJUST: adjust by index ratio', () => {
      expect(FormulaFunctionRegistry.HYPERINFLATION_ADJUST(1000, 150, 100)).toBe(1500);
      expect(FormulaFunctionRegistry.HYPERINFLATION_ADJUST(1000, 100, 100)).toBe(1000);
    });

    it('HYPERINFLATION_ADJUST: zero base index', () => {
      expect(FormulaFunctionRegistry.HYPERINFLATION_ADJUST(1000, 150, 0)).toBe(0);
    });
  });

  // =========================================================================
  // STATISTICAL FUNCTIONS
  // =========================================================================

  describe('statistical functions', () => {
    it('SUM', () => {
      expect(FormulaFunctionRegistry.SUM([1, 2, 3, 4, 5])).toBe(15);
      expect(FormulaFunctionRegistry.SUM([])).toBe(0);
    });

    it('COUNT', () => {
      expect(FormulaFunctionRegistry.COUNT([1, 2, 3])).toBe(3);
      expect(FormulaFunctionRegistry.COUNT([])).toBe(0);
    });

    it('AVERAGE', () => {
      expect(FormulaFunctionRegistry.AVERAGE([10, 20, 30] as any)).toBe(20);
      expect(FormulaFunctionRegistry.AVERAGE([])).toBe(0);
    });

    it('MEDIAN: odd count', () => {
      expect(FormulaFunctionRegistry.MEDIAN([3, 1, 2])).toBe(2);
    });

    it('MEDIAN: even count', () => {
      expect(FormulaFunctionRegistry.MEDIAN([1, 2, 3, 4])).toBe(2.5);
    });

    it('STDEV: sample standard deviation', () => {
      // Sample stdev (n-1 denominator) of [2,4,4,4,5,5,7,9] = 2.138
      expect(FormulaFunctionRegistry.STDEV([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
    });

    it('STDEV: single value', () => {
      expect(FormulaFunctionRegistry.STDEV([5])).toBe(0);
    });

    it('VARIANCE: sample variance', () => {
      // Sample variance (n-1 denominator) of [2,4,4,4,5,5,7,9] = 4.571
      const variance = FormulaFunctionRegistry.VARIANCE([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(variance).toBeCloseTo(4.571, 2);
    });

    it('CORREL: perfect positive', () => {
      expect(FormulaFunctionRegistry.CORREL([1, 2, 3], [10, 20, 30])).toBeCloseTo(1);
    });

    it('CORREL: perfect negative', () => {
      expect(FormulaFunctionRegistry.CORREL([1, 2, 3], [30, 20, 10])).toBeCloseTo(-1);
    });

    it('MIN', () => {
      expect(FormulaFunctionRegistry.MIN([5, 3, 8, 1, 9])).toBe(1);
    });

    it('MAX', () => {
      expect(FormulaFunctionRegistry.MAX([5, 3, 8, 1, 9])).toBe(9);
    });

    it('ABS', () => {
      expect(FormulaFunctionRegistry.ABS(-5)).toBe(5);
      expect(FormulaFunctionRegistry.ABS(5)).toBe(5);
      expect(FormulaFunctionRegistry.ABS(0)).toBe(0);
    });
  });

  // =========================================================================
  // LOGICAL FUNCTIONS
  // =========================================================================

  describe('logical functions', () => {
    it('IFS: condition true', () => {
      expect(FormulaFunctionRegistry.IFS(1, 100, 200)).toBe(100);
    });

    it('IFS: condition false', () => {
      expect(FormulaFunctionRegistry.IFS(0, 100, 200)).toBe(200);
    });

    it('CHOOSE: valid index', () => {
      expect(FormulaFunctionRegistry.CHOOSE(0, 10, 20, 30)).toBe(10);
      expect(FormulaFunctionRegistry.CHOOSE(2, 10, 20, 30)).toBe(30);
    });

    it('CHOOSE: out of range', () => {
      expect(FormulaFunctionRegistry.CHOOSE(5, 10, 20)).toBe(0);
      expect(FormulaFunctionRegistry.CHOOSE(-1, 10, 20)).toBe(0);
    });

    it('BETWEEN: inside range', () => {
      expect(FormulaFunctionRegistry.BETWEEN(5, 1, 10)).toBe(1);
    });

    it('BETWEEN: outside range', () => {
      expect(FormulaFunctionRegistry.BETWEEN(15, 1, 10)).toBe(0);
    });

    it('BETWEEN: on boundary', () => {
      expect(FormulaFunctionRegistry.BETWEEN(1, 1, 10)).toBe(1);
      expect(FormulaFunctionRegistry.BETWEEN(10, 1, 10)).toBe(1);
    });

    it('CLAMP: within range', () => {
      expect(FormulaFunctionRegistry.CLAMP(5, 1, 10)).toBe(5);
    });

    it('CLAMP: below min', () => {
      expect(FormulaFunctionRegistry.CLAMP(-5, 1, 10)).toBe(1);
    });

    it('CLAMP: above max', () => {
      expect(FormulaFunctionRegistry.CLAMP(15, 1, 10)).toBe(10);
    });

    it('COALESCE: first non-zero', () => {
      expect(FormulaFunctionRegistry.COALESCE(0, 0, 5, 10)).toBe(5);
    });

    it('COALESCE: all zero', () => {
      expect(FormulaFunctionRegistry.COALESCE(0, 0, 0)).toBe(0);
    });
  });
});
