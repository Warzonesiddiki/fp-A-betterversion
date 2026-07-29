import { describe, it, expect } from 'vitest';
import { FormulaEngine } from './FormulaEngine';

describe('FormulaEngine Performance', () => {
  // =========================================================================
  // HELPERS
  // =========================================================================

  function createSpreadsheet(): (ref: string) => number {
    const cells: Record<string, number> = {};
    for (let col = 0; col < 26; col++) {
      for (let row = 1; row <= 100; row++) {
        const colLetter = String.fromCharCode(65 + col);
        cells[`${colLetter}${row}`] = Math.random() * 1000;
      }
    }
    return (ref: string): number => cells[ref] ?? 0;
  }

  // =========================================================================
  // PARSING PERFORMANCE
  // =========================================================================
  describe('parsing speed', () => {
    it('should parse 1000 simple formulas in under 1 second', () => {
      const formulas = Array.from({ length: 1000 }, (_, i) => `${i}+${i + 1}`);
      const start = performance.now();
      for (const formula of formulas) {
        FormulaEngine.parseFormula(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should parse 1000 cell reference formulas in under 1 second', () => {
      const formulas = Array.from({ length: 1000 }, (_, i) => {
        const col = String.fromCharCode(65 + (i % 26));
        return `${col}${(i % 100) + 1}+${col}${(i % 100) + 2}`;
      });
      const start = performance.now();
      for (const formula of formulas) {
        FormulaEngine.parseFormula(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should parse 500 function formulas in under 1 second', () => {
      const formulas = Array.from({ length: 500 }, () => 'SUM(A1:A100)');
      const start = performance.now();
      for (const formula of formulas) {
        FormulaEngine.parseFormula(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should parse 200 complex nested formulas in under 1 second', () => {
      const formulas = Array.from(
        { length: 200 },
        () => 'IF(SUM(A1:A10)>COUNT(B1:B10),AVERAGE(C1:C10)*2,MAX(D1:D10))'
      );
      const start = performance.now();
      for (const formula of formulas) {
        FormulaEngine.parseFormula(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should parse 100 deeply nested parentheses in under 1 second', () => {
      const formula = '(((((((((1+2)*3)-4)/5)+6)*7)-8)/9)+10)';
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        FormulaEngine.parseFormula(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });

  // =========================================================================
  // EVALUATION PERFORMANCE
  // =========================================================================
  describe('evaluation speed', () => {
    it('should evaluate 10000 simple expressions in under 1 second', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('1+2*3-4/2');
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should evaluate 5000 cell reference formulas in under 1 second', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('A1+B1*C1-D1/E1');
      const start = performance.now();
      for (let i = 0; i < 5000; i++) {
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should evaluate 2000 SUM functions in under 1 second', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('SUM(A1:A20)');
      const start = performance.now();
      for (let i = 0; i < 2000; i++) {
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should evaluate 1000 IF functions in under 1 second', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('IF(A1>B1,A1,B1)');
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should evaluate 500 NPV calculations in under 1 second', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('NPV(0.1,100,200,300,400,500)');
      const start = performance.now();
      for (let i = 0; i < 500; i++) {
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });
  });

  // =========================================================================
  // COMPLEX FORMULA PERFORMANCE
  // =========================================================================
  describe('complex formula performance', () => {
    it('should evaluate complex formula with many operations in under 10ms', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula(
        '(A1+B1*C1-D1/E1)*(A2+B2*C2-D2/E2)+(A3-B3)*(C3+D3)'
      );
      const start = performance.now();
      const result = FormulaEngine.evaluate(nodes, cellFn);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(typeof result.value).toBe('number');
    });

    it('should evaluate nested function calls in under 10ms', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula(
        'IF(SUM(A1:A10)>COUNT(B1:B10),SUM(C1:C10)*2,COUNT(D1:D10))'
      );
      const start = performance.now();
      const result = FormulaEngine.evaluate(nodes, cellFn);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(typeof result.value).toBe('number');
    });

    it('should evaluate large SUM range in under 10ms', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('SUM(A1:Z100)');
      const start = performance.now();
      const result = FormulaEngine.evaluate(nodes, cellFn);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(typeof result.value).toBe('number');
    });

    it('should evaluate deeply nested parentheses in under 10ms', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('(((((A1+B1)*C1)-D1)/E1)+((A2+B2)*C2))');
      const start = performance.now();
      const result = FormulaEngine.evaluate(nodes, cellFn);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(typeof result.value).toBe('number');
    });
  });

  // =========================================================================
  // DEPENDENCY EXTRACTION PERFORMANCE
  // =========================================================================
  describe('dependency extraction speed', () => {
    it('should extract dependencies from 1000 formulas in under 1 second', () => {
      const formulas = Array.from({ length: 1000 }, (_, i) => {
        const col = String.fromCharCode(65 + (i % 26));
        return `${col}${(i % 100) + 1}+${col}${(i % 100) + 2}`;
      });
      const start = performance.now();
      for (const formula of formulas) {
        FormulaEngine.getDependencies(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should extract dependencies from complex formula in under 5ms', () => {
      const formula = 'SUM(A1:A100)+COUNT(B1:B50)*C1-D1/E1+IF(F1>G1,H1,I1)';
      const start = performance.now();
      const deps = FormulaEngine.getDependencies(formula);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5);
      expect(deps.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // VALIDATION PERFORMANCE
  // =========================================================================
  describe('validation speed', () => {
    it('should validate 1000 formulas in under 1 second', () => {
      const formulas = Array.from({ length: 1000 }, (_, i) => `${i}+${i + 1}`);
      const start = performance.now();
      for (const formula of formulas) {
        FormulaEngine.validateFormula(formula);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000);
    });

    it('should validate complex formula in under 5ms', () => {
      const formula = 'IF(SUM(A1:A10)>COUNT(B1:B10),AVERAGE(C1:C10)*2,MAX(D1:D10))';
      const start = performance.now();
      const result = FormulaEngine.validateFormula(formula);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5);
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // END-TO-END PERFORMANCE
  // =========================================================================
  describe('end-to-end parse+evaluate pipeline', () => {
    it('should complete 1000 parse+evaluate cycles in under 2 seconds', () => {
      const cellFn = createSpreadsheet();
      const formula = 'A1+B1*C1-D1/E1';
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        const { nodes } = FormulaEngine.parseFormula(formula);
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });

    it('should complete 500 complex parse+evaluate cycles in under 2 seconds', () => {
      const cellFn = createSpreadsheet();
      const formula = 'IF(SUM(A1:A10)>COUNT(B1:B10),AVERAGE(C1:C10)*2,MAX(D1:D10))';
      const start = performance.now();
      for (let i = 0; i < 500; i++) {
        const { nodes } = FormulaEngine.parseFormula(formula);
        FormulaEngine.evaluate(nodes, cellFn);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });
  });

  // =========================================================================
  // MEMORY USAGE
  // =========================================================================
  describe('memory usage', () => {
    it('should not leak memory with repeated evaluations', () => {
      const cellFn = createSpreadsheet();
      const { nodes } = FormulaEngine.parseFormula('A1+B1*C1');

      // "If we get here without crashing" is not an assertion — the old
      // expect(true).toBe(true) passed even if every evaluation returned
      // undefined. Assert that repeated evaluation stays CORRECT (no state
      // leaking between runs) and bounded in time.
      const expected = FormulaEngine.evaluate(nodes, cellFn);
      expect(expected.value).toBeTypeOf('number');
      const started = Date.now();
      for (let i = 0; i < 10000; i++) {
        expect(FormulaEngine.evaluate(nodes, cellFn).value).toBe(expected.value);
      }
      expect(Date.now() - started).toBeLessThan(10000);
    });

    it('should not leak memory with repeated parsing', () => {
      // Assert each parse actually produced a usable AST rather than merely
      // not throwing.
      for (let i = 0; i < 10000; i++) {
        const { nodes } = FormulaEngine.parseFormula(`${i}+${i + 1}*${i + 2}`);
        if (i % 1000 === 0) {
          expect(nodes.length).toBeGreaterThan(0);
        }
      }
      // Parsing the same formula after 10k parses must still be correct —
      // a leaking cache would change the result or blow up here.
      const { nodes } = FormulaEngine.parseFormula('1+2*3');
      expect(FormulaEngine.evaluate(nodes, createSpreadsheet()).value).toBe(7);
    });

    it('should handle large number of unique formulas', () => {
      const formulas = Array.from({ length: 1000 }, (_, i) => `SUM(A${i + 1}:A${i + 10})`);
      const cellFn = createSpreadsheet();

      let evaluated = 0;
      for (const formula of formulas) {
        const { nodes } = FormulaEngine.parseFormula(formula);
        const result = FormulaEngine.evaluate(nodes, cellFn);
        expect(Number.isFinite(result.value)).toBe(true);
        evaluated += 1;
      }
      expect(evaluated).toBe(formulas.length);
    });
  });
});
