/**
 * AI Copilot Engine — Formula writing assistance and suggestions
 *
 * Enhanced: 30+ formula patterns, context-aware explanations, richer alternatives.
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
  private static formulaPatterns: Record<
    string,
    { formula: string; description: string; category: string }
  > = {
    // ─── Aggregation ──────────────────────────────────────────────────────
    sum: { formula: 'SUM({range})', description: 'Sum of values in range', category: 'aggregate' },
    average: {
      formula: 'AVERAGE({range})',
      description: 'Average of values',
      category: 'aggregate',
    },
    median: {
      formula: 'MEDIAN({range})',
      description: 'Middle value of sorted range',
      category: 'aggregate',
    },
    count: {
      formula: 'COUNTA({range})',
      description: 'Count of non-empty cells',
      category: 'aggregate',
    },
    countif: {
      formula: 'COUNTIF({range}, {criteria})',
      description: 'Count cells matching criteria',
      category: 'aggregate',
    },
    sumif: {
      formula: 'SUMIF({range}, {criteria}, {sum_range})',
      description: 'Conditional sum',
      category: 'aggregate',
    },
    max: { formula: 'MAX({range})', description: 'Largest value in range', category: 'aggregate' },
    min: { formula: 'MIN({range})', description: 'Smallest value in range', category: 'aggregate' },

    // ─── Financial ────────────────────────────────────────────────────────
    growth: {
      formula: '({current} - {prior}) / {prior}',
      description: 'Growth rate calculation',
      category: 'financial',
    },
    margin: {
      formula: '({revenue} - {cost}) / {revenue}',
      description: 'Margin percentage',
      category: 'financial',
    },
    'gross margin': {
      formula: '({revenue} - {cogs}) / {revenue}',
      description: 'Gross margin percentage',
      category: 'financial',
    },
    'net margin': {
      formula: '({revenue} - {expenses}) / {revenue}',
      description: 'Net margin percentage',
      category: 'financial',
    },
    variance: {
      formula: '{actual} - {budget}',
      description: 'Variance (actual minus budget)',
      category: 'financial',
    },
    'variance pct': {
      formula: '({actual} - {budget}) / {budget}',
      description: 'Variance percentage',
      category: 'financial',
    },
    cagr: {
      formula: '(POWER({end}/{start}, 1/{years}) - 1)',
      description: 'Compound annual growth rate',
      category: 'financial',
    },
    npv: {
      formula: 'NPV({rate}, {cashflows})',
      description: 'Net present value',
      category: 'financial',
    },
    irr: {
      formula: 'IRR({cashflows})',
      description: 'Internal rate of return',
      category: 'financial',
    },
    'compound annual growth rate': {
      formula: '(POWER({end}/{start}, 1/{years}) - 1)',
      description: 'Compound annual growth rate',
      category: 'financial',
    },
    'net present value': {
      formula: 'NPV({rate}, {cashflows})',
      description: 'Net present value',
      category: 'financial',
    },
    'internal rate of return': {
      formula: 'IRR({cashflows})',
      description: 'Internal rate of return',
      category: 'financial',
    },
    pmt: {
      formula: 'PMT({rate}, {nper}, {pv})',
      description: 'Payment calculation',
      category: 'financial',
    },
    pv: {
      formula: 'PV({rate}, {nper}, {pmt})',
      description: 'Present value of future payments',
      category: 'financial',
    },
    fv: {
      formula: 'FV({rate}, {nper}, {pmt})',
      description: 'Future value of an investment',
      category: 'financial',
    },
    wacc: {
      formula:
        '({equity_weight} * {cost_of_equity}) + ({debt_weight} * {cost_of_debt} * (1 - {tax_rate}))',
      description: 'Weighted average cost of capital',
      category: 'financial',
    },

    // ─── Time ─────────────────────────────────────────────────────────────
    ytd: { formula: 'SUM({start}:{current})', description: 'Year-to-date sum', category: 'time' },
    'year over year': {
      formula: '({current_period} - {prior_period}) / {prior_period}',
      description: 'Year-over-year change',
      category: 'time',
    },
    qoq: {
      formula: '({current_quarter} - {prior_quarter}) / {prior_quarter}',
      description: 'Quarter-over-quarter change',
      category: 'time',
    },
    'moving average': {
      formula: 'AVERAGE(OFFSET({cell}, -{periods}+1, 0, {periods}, 1))',
      description: 'Moving average',
      category: 'time',
    },
    'trailing average': {
      formula: 'AVERAGE(OFFSET({cell}, -{periods}+1, 0, {periods}, 1))',
      description: 'Trailing average over N periods',
      category: 'time',
    },

    // ─── Lookup ───────────────────────────────────────────────────────────
    vlookup: {
      formula: 'VLOOKUP({lookup_value}, {table}, {col_index}, FALSE)',
      description: 'Vertical lookup',
      category: 'lookup',
    },
    xlookup: {
      formula: 'XLOOKUP({lookup_value}, {lookup_array}, {return_array})',
      description: 'Flexible lookup (replaces VLOOKUP)',
      category: 'lookup',
    },

    // ─── Depreciation ─────────────────────────────────────────────────────
    depreciation: {
      formula: '{cost} / {useful_life}',
      description: 'Straight-line depreciation',
      category: 'depreciation',
    },
    'double declining': {
      formula: '{book_value} * (2 / {useful_life})',
      description: 'Double declining balance depreciation',
      category: 'depreciation',
    },

    // ─── Workforce ────────────────────────────────────────────────────────
    'headcount cost': {
      formula: '{headcount} * {avg_salary} * (1 + {benefit_rate})',
      description: 'Total headcount cost',
      category: 'workforce',
    },
    'fully loaded cost': {
      formula: '{salary} * (1 + {benefit_rate} + {overhead_rate})',
      description: 'Fully loaded employee cost',
      category: 'workforce',
    },

    // ─── SaaS ─────────────────────────────────────────────────────────────
    arr: { formula: '{mrr} * 12', description: 'Annual recurring revenue', category: 'saas' },
    'annual recurring revenue': {
      formula: '{mrr} * 12',
      description: 'Annual recurring revenue',
      category: 'saas',
    },
    ltv: {
      formula: '{avg_revenue_per_account} / {churn_rate}',
      description: 'Customer lifetime value',
      category: 'saas',
    },
    'customer lifetime value': {
      formula: '{avg_revenue_per_account} / {churn_rate}',
      description: 'Customer lifetime value',
      category: 'saas',
    },
    cac: {
      formula: '{total_sales_marketing} / {new_customers}',
      description: 'Customer acquisition cost',
      category: 'saas',
    },
    'customer acquisition cost': {
      formula: '{total_sales_marketing} / {new_customers}',
      description: 'Customer acquisition cost',
      category: 'saas',
    },
    'ltv/cac': {
      formula:
        '({avg_revenue_per_account} / {churn_rate}) / ({total_sales_marketing} / {new_customers})',
      description: 'LTV to CAC ratio',
      category: 'saas',
    },
    'ltv to cac ratio': {
      formula:
        '({avg_revenue_per_account} / {churn_rate}) / ({total_sales_marketing} / {new_customers})',
      description: 'LTV to CAC ratio',
      category: 'saas',
    },
    'weighted average cost of capital': {
      formula:
        '({equity_weight} * {cost_of_equity}) + ({debt_weight} * {cost_of_debt} * (1 - {tax_rate}))',
      description: 'Weighted average cost of capital',
      category: 'financial',
    },
    'fully loaded employee cost': {
      formula: '{salary} * (1 + {benefit_rate} + {overhead_rate})',
      description: 'Fully loaded employee cost',
      category: 'workforce',
    },
  };

  static suggestFormula(description: string): FormulaSuggestion {
    const lower = description.toLowerCase();
    // Sort by key length descending so longer/more-specific patterns match first
    const sorted = Object.entries(this.formulaPatterns).sort(([a], [b]) => b.length - a.length);
    for (const [key, pattern] of sorted) {
      if (lower.includes(key)) {
        return {
          formula: pattern.formula,
          description: pattern.description,
          confidence: 0.85,
          alternatives: this.getAlternatives(key, pattern.category),
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

    // ─── Function-based explanations ──────────────────────────────────────
    if (upper.startsWith('SUM(')) return 'Adds all values in the specified range';
    if (upper.startsWith('SUMIF('))
      return 'Adds values that meet a single criteria (e.g., SUMIF(A:A, ">100"))';
    if (upper.startsWith('SUMIFS(')) return 'Adds values that meet multiple criteria across ranges';
    if (upper.startsWith('SUMPRODUCT('))
      return 'Multiplies corresponding values in ranges and returns the sum of products';
    if (upper.startsWith('AVERAGE(')) return 'Calculates the arithmetic mean of the values';
    if (upper.startsWith('AVERAGEIF(')) return 'Averages values that meet a single criteria';
    if (upper.startsWith('MEDIAN(')) return 'Returns the middle value of a sorted dataset';
    if (upper.startsWith('MODE(')) return 'Returns the most frequently occurring value';
    if (upper.startsWith('COUNT(')) return 'Counts cells containing numbers';
    if (upper.startsWith('COUNTA(')) return 'Counts non-empty cells (numbers, text, errors)';
    if (upper.startsWith('COUNTIF('))
      return 'Counts cells matching a criteria (e.g., COUNTIF(A:A, "Done"))';
    if (upper.startsWith('IF('))
      return 'Returns one value if condition is true, another if false (e.g., IF(A1>10, "High", "Low"))';
    if (upper.startsWith('IFS('))
      return 'Tests multiple conditions in sequence, returns first match';
    if (upper.startsWith('SWITCH('))
      return 'Compares an expression against a list of values and returns matching result';
    if (upper.startsWith('NPV('))
      return 'Calculates net present value of future cash flows discounted at a rate';
    if (upper.startsWith('IRR('))
      return 'Finds the internal rate of return for a series of periodic cash flows';
    if (upper.startsWith('XIRR('))
      return 'IRR for irregularly spaced cash flows (uses specific dates)';
    if (upper.startsWith('PMT('))
      return 'Calculates payment for a loan based on constant payments and interest rate';
    if (upper.startsWith('PV(')) return 'Returns the present value of a series of future payments';
    if (upper.startsWith('FV('))
      return 'Returns the future value of an investment based on periodic payments';
    if (upper.startsWith('VLOOKUP('))
      return 'Looks up a value in the first column of a table and returns a value in the same row';
    if (upper.startsWith('XLOOKUP('))
      return 'Flexible lookup that can search vertically or horizontally, with exact/approximate match';
    if (upper.startsWith('HLOOKUP('))
      return 'Like VLOOKUP but searches the top row instead of the first column';
    if (upper.startsWith('INDEX('))
      return 'Returns the value at a specific row/column intersection in a range';
    if (upper.startsWith('MATCH(')) return 'Returns the relative position of a value in a range';
    if (upper.startsWith('OFFSET('))
      return 'Returns a reference offset from a starting cell by rows and columns';
    if (upper.startsWith('POWER(')) return 'Raises a number to a specified exponent';
    if (upper.startsWith('ROUND('))
      return 'Rounds a number to a specified number of decimal places';
    if (upper.startsWith('ABS(')) return 'Returns the absolute (positive) value of a number';
    if (upper.startsWith('MIN(')) return 'Returns the smallest value in a range';
    if (upper.startsWith('MAX(')) return 'Returns the largest value in a range';

    // ─── Operator-based explanations ──────────────────────────────────────
    if (upper.includes(' - ') && upper.includes(' / '))
      return 'Calculates a percentage change or margin (difference divided by base)';
    if (upper.includes(' - ')) return 'Subtraction: calculates the difference between two values';
    if (upper.includes(' / ') && upper.includes(' * '))
      return 'Combined ratio calculation (division and multiplication)';
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
    if (formula.includes('=') && !formula.startsWith('=')) {
      errors.push({
        position: formula.indexOf('='),
        message: 'Equals sign in middle of formula (use == for comparison)',
        severity: 'warning',
      });
    }
    return errors;
  }

  static suggestAlternative(formula: string): string[] {
    const alternatives: string[] = [];
    if (formula.includes('SUM')) alternatives.push(formula.replace('SUM', 'AVERAGE'));
    if (formula.includes('IF') && !formula.includes('IFS'))
      alternatives.push(formula.replace('IF', 'IFS'));
    if (formula.includes('VLOOKUP')) alternatives.push(formula.replace('VLOOKUP', 'XLOOKUP'));
    return alternatives;
  }

  private static getAlternatives(key: string, _category: string): string[] {
    const map: Record<string, string[]> = {
      // Aggregate
      sum: ['SUMPRODUCT', 'SUMIF', 'SUBTOTAL', 'AGGREGATE'],
      average: ['MEDIAN', 'MODE', 'AVERAGEIF', 'AVERAGEIFS'],
      median: ['AVERAGE', 'PERCENTILE', 'QUARTILE'],
      count: ['COUNTIF', 'COUNTIFS', 'SUMPRODUCT'],
      countif: ['COUNTIFS', 'SUMPRODUCT', 'FILTER'],
      sumif: ['SUMIFS', 'SUMPRODUCT', 'FILTER'],
      max: ['LARGE', 'MAXIFS', 'AGGREGATE'],
      min: ['SMALL', 'MINIFS', 'AGGREGATE'],

      // Financial
      growth: ['CAGR', 'LOGEST', 'GROWTH', 'XIRR'],
      margin: ['GROSS MARGIN', 'NET MARGIN', 'CONTRIBUTION MARGIN'],
      'gross margin': ['MARGIN', 'CONTRIBUTION MARGIN', 'MARKUP'],
      'net margin': ['MARGIN', 'EBITDA MARGIN', 'OPERATING MARGIN'],
      variance: ['STDEV', 'VAR.P', 'DEVIATION'],
      'variance pct': ['COEFFICIENT OF VARIATION', 'RELATIVE ERROR'],
      cagr: ['GROWTH', 'LOGEST', 'GEOMEAN'],
      npv: ['XNPV', 'PV', 'NPV with risk adjustment'],
      irr: ['XIRR', 'MIRR', 'MODIFIED IRR'],
      pmt: ['PPMT', 'IPMT', 'CUMIPMT'],
      pv: ['PV with growth', 'NPV', 'DCF'],
      fv: ['FV with growth', 'FVSCHEDULE', 'FUTURE VALUE'],
      wacc: ['COST OF EQUITY', 'COST OF DEBT', 'CAPITAL STRUCTURE'],

      // Time
      ytd: ['MTD', 'QTD', 'ROLLING 12M'],
      'year over year': ['MONTH OVER MONTH', 'QUARTER OVER QUARTER', 'TRAILING 12M'],
      qoq: ['YOY', 'MOM', 'SEQUENTIAL'],
      'moving average': ['EXPONENTIAL SMOOTHING', 'WEIGHTED AVERAGE', 'CUMULATIVE AVERAGE'],
      'trailing average': ['MOVING AVERAGE', 'EXPONENTIAL MOVING AVERAGE', 'WMA'],

      // Lookup
      vlookup: ['XLOOKUP', 'INDEX/MATCH', 'INDIRECT'],
      xlookup: ['INDEX/MATCH', 'VLOOKUP', 'LOOKUP'],

      // Depreciation
      depreciation: ['DOUBLE DECLINING', 'SUM OF YEARS', 'UNITS OF PRODUCTION'],
      'double declining': ['MACRS', 'SUM OF YEARS', ' straight-line'],

      // Workforce
      'headcount cost': ['FULLY LOADED COST', 'TOTAL COMPENSATION', 'BURN RATE'],
      'fully loaded cost': ['HEADCOUNT COST', 'TOTAL COST', 'OPEX IMPACT'],

      // SaaS
      arr: ['MRR', 'ARR GROWTH', 'NET REVENUE RETENTION'],
      ltv: ['CLTV', 'CUSTOMER LIFETIME VALUE', 'LTV WITH CHURN'],
      cac: ['PAYBACK PERIOD', 'CAC RATIO', 'SALES EFFICIENCY'],
      'ltv/cac': ['PAYBACK PERIOD', 'UNIT ECONOMICS', 'RULE OF 40'],
    };
    return map[key] ?? [];
  }
}
