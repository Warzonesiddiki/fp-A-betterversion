/**
 * AI Copilot Engine — Formula writing assistance and suggestions
 */

export interface FormulaSuggestion {
  formula: string;
  description: string;
  confidence: number;
  alternatives: string[];
}

export interface FormulaError {
  position: number;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export class AICopilotEngine {
  private static formulaPatterns: Record<string, { formula: string; description: string }> = {
    sum: { formula: 'SUM({range})', description: 'Sum of values in range' },
    average: { formula: 'AVERAGE({range})', description: 'Average of values' },
    growth: { formula: '({current} - {prior}) / {prior}', description: 'Growth rate calculation' },
    margin: { formula: '({revenue} - {cost}) / {revenue}', description: 'Margin percentage' },
    variance: { formula: '{actual} - {budget}', description: 'Variance (actual minus budget)' },
    'variance pct': {
      formula: '({actual} - {budget}) / {budget}',
      description: 'Variance percentage',
    },
    'moving average': {
      formula: 'AVERAGE(OFFSET({cell}, -{periods}+1, 0, {periods}, 1))',
      description: 'Moving average',
    },
    ytd: { formula: 'SUM({start}:{current})', description: 'Year-to-date sum' },
    cagr: {
      formula: '(POWER({end}/{start}, 1/{years}) - 1)',
      description: 'Compound annual growth rate',
    },
    npv: { formula: 'NPV({rate}, {cashflows})', description: 'Net present value' },
    irr: { formula: 'IRR({cashflows})', description: 'Internal rate of return' },
    pmt: { formula: 'PMT({rate}, {nper}, {pv})', description: 'Payment calculation' },
    depreciation: { formula: '{cost} / {useful_life}', description: 'Straight-line depreciation' },
    'headcount cost': {
      formula: '{headcount} * {avg_salary} * (1 + {benefit_rate})',
      description: 'Total headcount cost',
    },
  };

  static suggestFormula(description: string): FormulaSuggestion {
    const lower = description.toLowerCase();
    for (const [key, pattern] of Object.entries(this.formulaPatterns)) {
      if (lower.includes(key)) {
        return {
          formula: pattern.formula,
          description: pattern.description,
          confidence: 0.85,
          alternatives: this.getAlternatives(key),
        };
      }
    }
    return {
      formula: '',
      description: 'No matching formula found',
      confidence: 0,
      alternatives: [],
    };
  }

  static explainFormula(formula: string): string {
    const upper = formula.toUpperCase().trim();
    if (upper.startsWith('SUM(')) return 'Adds all values in the specified range';
    if (upper.startsWith('AVERAGE(')) return 'Calculates the arithmetic mean of the values';
    if (upper.startsWith('IF(')) return 'Returns one value if condition is true, another if false';
    if (upper.startsWith('NPV(')) return 'Calculates net present value of future cash flows';
    if (upper.startsWith('IRR('))
      return 'Finds the internal rate of return for a series of cash flows';
    if (upper.startsWith('PMT('))
      return 'Calculates payment for a loan based on constant payments and interest rate';
    if (upper.startsWith('VLOOKUP('))
      return 'Looks up a value in the first column and returns a value in the same row';
    if (upper.includes(' - ')) return 'Subtraction: calculates the difference between two values';
    if (upper.includes(' / ')) return 'Division: calculates the ratio of two values';
    if (upper.includes(' * ')) return 'Multiplication: calculates the product of two values';
    return `Formula: ${formula}`;
  }

  static detectFormulaError(formula: string): FormulaError[] {
    const errors: FormulaError[] = [];
    let depth = 0;
    for (let i = 0; i < formula.length; i++) {
      if (formula[i] === '(') depth++;
      if (formula[i] === ')') depth--;
      if (depth < 0) {
        errors.push({ position: i, message: 'Unmatched closing parenthesis', severity: 'error' });
      }
    }
    if (depth > 0) {
      errors.push({
        position: formula.length - 1,
        message: 'Unmatched opening parenthesis',
        severity: 'error',
      });
    }
    if (formula.includes('//') || formula.includes('**')) {
      errors.push({ position: 0, message: 'Invalid operator sequence', severity: 'warning' });
    }
    return errors;
  }

  static suggestAlternative(formula: string): string[] {
    const alternatives: string[] = [];
    if (formula.includes('SUM')) alternatives.push(formula.replace('SUM', 'AVERAGE'));
    if (formula.includes('IF')) alternatives.push(formula.replace('IF', 'IFS'));
    if (formula.includes('VLOOKUP')) alternatives.push(formula.replace('VLOOKUP', 'XLOOKUP'));
    return alternatives;
  }

  private static getAlternatives(key: string): string[] {
    const map: Record<string, string[]> = {
      sum: ['SUMPRODUCT', 'SUMIF', 'SUBTOTAL'],
      average: ['MEDIAN', 'MODE', 'AVERAGEIF'],
      growth: ['CAGR', 'LOGEST', 'GROWTH'],
      variance: ['VAR.P', 'STDEV.P', 'PERCENTILE'],
    };
    return map[key] ?? [];
  }
}
