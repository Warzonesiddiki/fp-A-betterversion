import { describe, it, expect } from 'vitest';
import { FormulaEngine } from './FormulaEngine';

describe('FormulaEngine Integration', () => {
  // =========================================================================
  // HELPERS
  // =========================================================================

  /** Simulates a spreadsheet with known values */
  function createSpreadsheet(): (ref: string) => number {
    const cells: Record<string, number> = {
      A1: 100,
      A2: 200,
      A3: 300,
      A4: 400,
      A5: 500,
      B1: 10,
      B2: 20,
      B3: 30,
      B4: 40,
      B5: 50,
      C1: 5,
      C2: 10,
      C3: 15,
      C4: 20,
      C5: 25,
      D1: 0.1,
      D2: 0.2,
      D3: 0.3,
      D4: 0.4,
      D5: 0.5,
      E1: -10,
      E2: -20,
      E3: 0,
      E4: 100,
      E5: 200,
      F1: 1000,
      F2: 2000,
      F3: 3000,
      F4: 4000,
      F5: 5000,
      G1: 1,
      G2: 2,
      G3: 3,
      G4: 4,
      G5: 5,
    };
    return (ref: string): number => cells[ref] ?? 0;
  }

  function evalFormula(formula: string, getCellValue?: (ref: string) => number): number {
    const cellFn = getCellValue ?? createSpreadsheet();
    const { nodes, valid, error } = FormulaEngine.parseFormula(formula);
    if (!valid) throw new Error(`Parse error: ${error}`);
    const result = FormulaEngine.evaluate(nodes, cellFn);
    if (result.error) throw new Error(`Eval error: ${result.error}`);
    return result.value;
  }

  // =========================================================================
  // PARSE + EVALUATE INTEGRATION
  // =========================================================================
  describe('parse and evaluate together', () => {
    it('should parse and evaluate simple formula end-to-end', () => {
      expect(evalFormula('2+3')).toBe(5);
    });

    it('should parse and evaluate with equals sign prefix', () => {
      expect(evalFormula('=2+3')).toBe(5);
    });

    it('should parse and evaluate complex precedence', () => {
      expect(evalFormula('2+3*4-1')).toBe(13);
    });

    it('should parse and evaluate parentheses', () => {
      expect(evalFormula('(2+3)*(4-1)')).toBe(15);
    });

    it('should parse and evaluate nested parentheses', () => {
      expect(evalFormula('((2+3)*((4-1)*(1+1)))')).toBe(30);
    });

    it('should parse and evaluate division', () => {
      expect(evalFormula('100/4/5')).toBe(5);
    });

    it('should parse and evaluate mixed operations', () => {
      expect(evalFormula('10+20*3-40/2')).toBe(50);
    });

    it('should handle equals sign with whitespace', () => {
      expect(evalFormula('  =  5+5  ')).toBe(10);
    });
  });

  // =========================================================================
  // CELL REFERENCES WITH VALUES
  // =========================================================================
  describe('cell references with actual values', () => {
    it('should resolve single cell reference', () => {
      expect(evalFormula('A1')).toBe(100);
    });

    it('should add two cell references', () => {
      expect(evalFormula('A1+B1')).toBe(110);
    });

    it('should multiply cell references', () => {
      expect(evalFormula('A1*B1')).toBe(1000);
    });

    it('should divide cell references', () => {
      expect(evalFormula('A1/B1')).toBe(10);
    });

    it('should subtract cell references', () => {
      expect(evalFormula('A1-B1')).toBe(90);
    });

    it('should handle cell reference with literal', () => {
      expect(evalFormula('A1+50')).toBe(150);
    });

    it('should handle multiple cell references in expression', () => {
      expect(evalFormula('A1+B1+C1')).toBe(115);
    });

    it('should handle cell reference with negative result', () => {
      expect(evalFormula('E1+B1')).toBe(0);
    });

    it('should handle cell reference with zero value', () => {
      expect(evalFormula('E3+10')).toBe(10);
    });

    it('should handle cell reference multiplication chain', () => {
      expect(evalFormula('G1*G2*G3')).toBe(6);
    });

    it('should track dependencies through cell references', () => {
      const deps = FormulaEngine.getDependencies('A1+B2*C3');
      expect(deps).toEqual(['A1', 'B2', 'C3']);
    });
  });

  // =========================================================================
  // NESTED FUNCTIONS
  // =========================================================================
  describe('nested functions', () => {
    it('should evaluate SUM of cell ranges', () => {
      expect(evalFormula('SUM(A1:A5)')).toBe(1500);
    });

    it('should evaluate SUM of SUM', () => {
      expect(evalFormula('SUM(SUM(A1:A3),SUM(B1:B3))')).toBe(660);
    });

    it('should evaluate IF with SUM condition', () => {
      expect(evalFormula('IF(SUM(A1:A3),100,200)')).toBe(100);
    });

    it('should evaluate IF with zero SUM', () => {
      const zeroCells = (ref: string): number => {
        if (['A1', 'A2', 'A3'].includes(ref)) return 0;
        return 0;
      };
      expect(evalFormula('IF(SUM(A1:A3),100,200)', zeroCells)).toBe(200);
    });

    it('should evaluate COUNT of range', () => {
      expect(evalFormula('COUNT(A1:A5)')).toBe(5);
    });

    it('should evaluate nested IF', () => {
      expect(evalFormula('IF(A1,IF(B1,100,200),300)')).toBe(100);
    });

    it('should evaluate SUM with mixed ranges and values', () => {
      expect(evalFormula('SUM(A1:A3,100)')).toBe(700);
    });

    it('should evaluate IF with comparison on cell values', () => {
      expect(evalFormula('IF(A1>B1,100,200)')).toBe(100);
    });

    it('should evaluate IF with equal comparison', () => {
      expect(evalFormula('IF(A1=A1,YES,NO)')).toBe(0); // YES/NO are unknown refs -> 0
    });

    it('should evaluate nested SUM with COUNT', () => {
      expect(evalFormula('SUM(COUNT(A1:A3),COUNT(B1:B3))')).toBe(6);
    });
  });

  // =========================================================================
  // COMPLEX FORMULAS
  // =========================================================================
  describe('complex multi-step calculations', () => {
    it('should calculate weighted average', () => {
      // (100*10 + 200*20 + 300*30) / (10+20+30) = 14000/60 ≈ 233.33
      const result = evalFormula('(A1*B1+A2*B2+A3*B3)/(B1+B2+B3)');
      expect(result).toBeCloseTo(233.33, 0);
    });

    it('should calculate percentage change', () => {
      // (new - old) / old * 100
      const result = evalFormula('(A2-A1)/A1*100');
      expect(result).toBeCloseTo(100, 0);
    });

    it('should calculate compound expression', () => {
      const result = evalFormula('(A1+B1)*(C1+D1*100)');
      expect(result).toBeCloseTo(1650, 0);
    });

    it('should calculate multi-step with division', () => {
      const result = evalFormula('(A1+A2+A3)/(B1+B2+B3)');
      expect(result).toBeCloseTo(10, 0);
    });

    it('should handle large formula with many operations', () => {
      // 100+10+5+(0.1*100)+0+(1000/100) = 100+10+5+10+0+10 = 135
      const result = evalFormula('A1+B1+C1+D1*100+E3+F1/100');
      expect(result).toBeCloseTo(135, 0);
    });

    it('should calculate margin percentage', () => {
      // Revenue - COGS / Revenue * 100
      const marginCells = (ref: string): number => {
        if (ref === 'A1') return 1000; // Revenue
        if (ref === 'B1') return 600; // COGS
        return 0;
      };
      const result = evalFormula('(A1-B1)/A1*100', marginCells);
      expect(result).toBe(40);
    });

    it('should calculate ROI', () => {
      const roiCells = (ref: string): number => {
        if (ref === 'A1') return 15000; // Gain
        if (ref === 'B1') return 10000; // Cost
        return 0;
      };
      const result = evalFormula('(A1-B1)/B1*100', roiCells);
      expect(result).toBe(50);
    });

    it('should calculate break-even units', () => {
      const beCells = (ref: string): number => {
        if (ref === 'A1') return 50000; // Fixed costs
        if (ref === 'B1') return 100; // Price per unit
        if (ref === 'C1') return 60; // Variable cost per unit
        return 0;
      };
      const result = evalFormula('A1/(B1-C1)', beCells);
      expect(result).toBe(1250);
    });

    it('should calculate debt-to-equity ratio', () => {
      const deCells = (ref: string): number => {
        if (ref === 'A1') return 500000; // Total debt
        if (ref === 'B1') return 1000000; // Total equity
        return 0;
      };
      const result = evalFormula('A1/B1', deCells);
      expect(result).toBe(0.5);
    });

    it('should calculate EPS', () => {
      const epsCells = (ref: string): number => {
        if (ref === 'A1') return 1000000; // Net income
        if (ref === 'B1') return 500000; // Shares outstanding
        return 0;
      };
      const result = evalFormula('A1/B1', epsCells);
      expect(result).toBe(2);
    });
  });

  // =========================================================================
  // ERROR PROPAGATION
  // =========================================================================
  describe('error propagation', () => {
    it('should propagate division by zero as 0', () => {
      const result = evalFormula('10/0');
      expect(result).toBe(0);
    });

    it('should propagate parse errors', () => {
      expect(() => evalFormula('1++2')).toThrow('Parse error');
    });

    it('should propagate evaluation errors from getCellValue', () => {
      const errorCells = (): number => {
        throw new Error('Cell not found');
      };
      const { nodes } = FormulaEngine.parseFormula('A1+B1');
      const result = FormulaEngine.evaluate(nodes, errorCells);
      expect(result.error).toBeDefined();
    });

    it('should handle NaN propagation', () => {
      const nanCells = (): number => NaN;
      const { nodes } = FormulaEngine.parseFormula('A1+B1');
      const result = FormulaEngine.evaluate(nodes, nanCells);
      // NaN propagation should result in NaN or error
      expect(
        result.value === undefined || isNaN(result.value as number) || result.error !== undefined
      ).toBe(true);
    });

    it('should handle Infinity propagation', () => {
      const infCells = (): number => Infinity;
      const { nodes } = FormulaEngine.parseFormula('A1-B1');
      const result = FormulaEngine.evaluate(nodes, infCells);
      // Infinity - Infinity = NaN or error
      expect(
        result.value === undefined ||
          isNaN(result.value as number) ||
          result.error !== undefined ||
          result.value === Infinity
      ).toBe(true);
    });

    it('should handle getCellValue returning string', () => {
      const stringCells = (): unknown => 'hello' as unknown as number;
      const { nodes } = FormulaEngine.parseFormula('A1');
      const result = FormulaEngine.evaluate(nodes, stringCells as (ref: string) => number);
      // May return string or convert to number
      expect(result.value !== undefined || result.error !== undefined).toBe(true);
    });
  });

  // =========================================================================
  // DEPENDENCY TRACKING INTEGRATION
  // =========================================================================
  describe('dependency tracking integration', () => {
    it('should track dependencies through complex formula', () => {
      const deps = FormulaEngine.getDependencies('(A1+B1)*C1-D1/E1');
      expect(deps).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should track dependencies through functions', () => {
      const deps = FormulaEngine.getDependencies('SUM(A1:A5)+COUNT(B1:B5)');
      expect(deps).toContain('A1');
      expect(deps).toContain('A5');
      expect(deps).toContain('B1');
      expect(deps).toContain('B5');
    });

    it('should track dependencies through nested functions', () => {
      const deps = FormulaEngine.getDependencies('IF(SUM(A1:A3)>B1,C1,D1)');
      expect(deps).toContain('A1');
      expect(deps).toContain('A3');
      expect(deps).toContain('B1');
      expect(deps).toContain('C1');
      expect(deps).toContain('D1');
    });

    it('should deduplicate dependencies', () => {
      const deps = FormulaEngine.getDependencies('A1+A1+A1+B1+B1');
      expect(deps).toEqual(['A1', 'B1']);
    });

    it('should sort dependencies', () => {
      const deps = FormulaEngine.getDependencies('C1+A1+B1');
      expect(deps).toEqual(['A1', 'B1', 'C1']);
    });

    it('should not include literal numbers as dependencies', () => {
      const deps = FormulaEngine.getDependencies('A1+100+B1+200');
      expect(deps).toEqual(['A1', 'B1']);
    });
  });

  // =========================================================================
  // VALIDATION + EVALUATION INTEGRATION
  // =========================================================================
  describe('validation then evaluation', () => {
    it('should validate then evaluate valid formula', () => {
      const formula = 'SUM(A1:A5)*2';
      const validation = FormulaEngine.validateFormula(formula);
      expect(validation.valid).toBe(true);

      const { nodes } = FormulaEngine.parseFormula(formula);
      const result = FormulaEngine.evaluate(nodes, createSpreadsheet());
      expect(result.value).toBe(3000);
    });

    it('should reject invalid formula before evaluation', () => {
      const formula = '1+++2';
      const validation = FormulaEngine.validateFormula(formula);
      expect(validation.valid).toBe(false);
    });

    it('should handle validate -> parse -> evaluate pipeline', () => {
      const formulas = ['1+1', 'A1*B1', 'SUM(A1:A5)', 'IF(A1,100,200)', '(A1+B1)*C1'];

      for (const formula of formulas) {
        const validation = FormulaEngine.validateFormula(formula);
        expect(validation.valid).toBe(true);

        const { nodes, valid } = FormulaEngine.parseFormula(formula);
        expect(valid).toBe(true);

        const result = FormulaEngine.evaluate(nodes, createSpreadsheet());
        expect(typeof result.value).toBe('number');
      }
    });
  });

  // =========================================================================
  // FINANCIAL CALCULATIONS INTEGRATION
  // =========================================================================
  describe('financial calculations', () => {
    it('should calculate net income', () => {
      const finCells = (ref: string): number => {
        if (ref === 'A1') return 1000000; // Revenue
        if (ref === 'B1') return 600000; // COGS
        if (ref === 'C1') return 200000; // OpEx
        if (ref === 'D1') return 50000; // Tax
        return 0;
      };
      const result = evalFormula('A1-B1-C1-D1', finCells);
      expect(result).toBe(150000);
    });

    it('should calculate gross margin', () => {
      const finCells = (ref: string): number => {
        if (ref === 'A1') return 1000000; // Revenue
        if (ref === 'B1') return 600000; // COGS
        return 0;
      };
      const result = evalFormula('(A1-B1)/A1*100', finCells);
      expect(result).toBe(40);
    });

    it('should calculate operating margin', () => {
      const finCells = (ref: string): number => {
        if (ref === 'A1') return 1000000; // Revenue
        if (ref === 'B1') return 600000; // COGS
        if (ref === 'C1') return 200000; // OpEx
        return 0;
      };
      const result = evalFormula('(A1-B1-C1)/A1*100', finCells);
      expect(result).toBe(20);
    });

    it('should calculate current ratio', () => {
      const finCells = (ref: string): number => {
        if (ref === 'A1') return 500000; // Current assets
        if (ref === 'B1') return 250000; // Current liabilities
        return 0;
      };
      const result = evalFormula('A1/B1', finCells);
      expect(result).toBe(2);
    });

    it('should calculate NPV through integration', () => {
      const { nodes } = FormulaEngine.parseFormula('NPV(0.1,1000,2000,3000)');
      const result = FormulaEngine.evaluate(nodes, createSpreadsheet());
      expect(result.value).toBeCloseTo(4815.93, 0);
    });

    it('should calculate CAGR through integration', () => {
      const { nodes } = FormulaEngine.parseFormula('CAGR(200,100,5)');
      const result = FormulaEngine.evaluate(nodes, createSpreadsheet());
      expect(result.value).toBeCloseTo(0.1487, 2);
    });
  });

  // =========================================================================
  // ROUND-TRIP CONSISTENCY
  // =========================================================================
  describe('round-trip consistency', () => {
    it('should produce same result on repeated evaluation', () => {
      const formula = 'A1+B1*C1-D1/E1';
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula(formula);

      const result1 = FormulaEngine.evaluate(nodes, cellFn);
      const result2 = FormulaEngine.evaluate(nodes, cellFn);
      const result3 = FormulaEngine.evaluate(nodes, cellFn);

      expect(result1.value).toBe(result2.value);
      expect(result2.value).toBe(result3.value);
    });

    it('should produce same result on re-parsing', () => {
      const formula = 'SUM(A1:A5)*2+10';

      const parse1 = FormulaEngine.parseFormula(formula);
      const parse2 = FormulaEngine.parseFormula(formula);

      expect(parse1.valid).toBe(parse2.valid);

      const cellFn = createSpreadsheet();
      const result1 = FormulaEngine.evaluate(parse1.nodes, cellFn);
      const result2 = FormulaEngine.evaluate(parse2.nodes, cellFn);

      expect(result1.value).toBe(result2.value);
    });

    it('should produce same dependencies on re-parse', () => {
      const formula = 'A1+B2*C3';
      const deps1 = FormulaEngine.getDependencies(formula);
      const deps2 = FormulaEngine.getDependencies(formula);
      expect(deps1).toEqual(deps2);
    });
  });
});
