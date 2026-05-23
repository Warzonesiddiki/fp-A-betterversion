/**
 * FormulaAutoCompleteEngine — Smart autocomplete for formula bar
 * Suggests functions, cell references, and named ranges
 */

interface AutocompleteSuggestion {
  text: string;
  type: 'function' | 'cell' | 'range' | 'named' | 'operator';
  description: string;
  category?: string;
  insertText: string;
}

const FUNCTION_CATALOG: Record<string, { desc: string; category: string; syntax: string }> = {
  SUM: { desc: 'Sum of values', category: 'Math', syntax: 'SUM(number1, [number2], ...)' },
  AVERAGE: {
    desc: 'Average of values',
    category: 'Statistical',
    syntax: 'AVERAGE(number1, [number2], ...)',
  },
  IF: {
    desc: 'Conditional logic',
    category: 'Logical',
    syntax: 'IF(condition, value_if_true, value_if_false)',
  },
  VLOOKUP: {
    desc: 'Vertical lookup',
    category: 'Lookup',
    syntax: 'VLOOKUP(lookup_value, table, col_index, [match_type])',
  },
  INDEX: {
    desc: 'Return value by position',
    category: 'Lookup',
    syntax: 'INDEX(array, row_num, [col_num])',
  },
  MATCH: {
    desc: 'Find position of value',
    category: 'Lookup',
    syntax: 'MATCH(lookup_value, lookup_array, [match_type])',
  },
  COUNT: { desc: 'Count numbers', category: 'Statistical', syntax: 'COUNT(value1, [value2], ...)' },
  MAX: { desc: 'Maximum value', category: 'Statistical', syntax: 'MAX(number1, [number2], ...)' },
  MIN: { desc: 'Minimum value', category: 'Statistical', syntax: 'MIN(number1, [number2], ...)' },
  ROUND: { desc: 'Round number', category: 'Math', syntax: 'ROUND(number, num_digits)' },
  NPV: {
    desc: 'Net Present Value',
    category: 'Financial',
    syntax: 'NPV(rate, value1, [value2], ...)',
  },
  IRR: { desc: 'Internal Rate of Return', category: 'Financial', syntax: 'IRR(values, [guess])' },
  PMT: {
    desc: 'Payment calculation',
    category: 'Financial',
    syntax: 'PMT(rate, nper, pv, [fv], [type])',
  },
  FV: { desc: 'Future Value', category: 'Financial', syntax: 'FV(rate, nper, pmt, [pv], [type])' },
  PV: { desc: 'Present Value', category: 'Financial', syntax: 'PV(rate, nper, pmt, [fv], [type])' },
  CONCATENATE: {
    desc: 'Join text strings',
    category: 'Text',
    syntax: 'CONCATENATE(text1, [text2], ...)',
  },
  LEFT: { desc: 'Left characters', category: 'Text', syntax: 'LEFT(text, [num_chars])' },
  RIGHT: { desc: 'Right characters', category: 'Text', syntax: 'RIGHT(text, [num_chars])' },
  LEN: { desc: 'Text length', category: 'Text', syntax: 'LEN(text)' },
  UPPER: { desc: 'Convert to uppercase', category: 'Text', syntax: 'UPPER(text)' },
  LOWER: { desc: 'Convert to lowercase', category: 'Text', syntax: 'LOWER(text)' },
  YEAR: { desc: 'Year from date', category: 'Date', syntax: 'YEAR(date)' },
  MONTH: { desc: 'Month from date', category: 'Date', syntax: 'MONTH(date)' },
  DAY: { desc: 'Day from date', category: 'Date', syntax: 'DAY(date)' },
  TODAY: { desc: "Today's date", category: 'Date', syntax: 'TODAY()' },
  NOW: { desc: 'Current date and time', category: 'Date', syntax: 'NOW()' },
};

export class FormulaAutoCompleteEngine {
  /**
   * Get autocomplete suggestions for partial formula input
   */
  static suggest(partial: string, context?: { namedRanges?: string[] }): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];
    const trimmed = partial.trim();

    // Extract the last token being typed
    const lastToken = this.getLastToken(trimmed);

    if (!lastToken) return suggestions;

    // Function suggestions
    const upperToken = lastToken.toUpperCase();
    for (const [name, info] of Object.entries(FUNCTION_CATALOG)) {
      if (name.startsWith(upperToken)) {
        suggestions.push({
          text: name,
          type: 'function',
          description: info.desc,
          category: info.category,
          insertText: `${name}(`,
        });
      }
    }

    // Cell reference suggestions (A1, B2, etc.)
    if (/^[A-Z]{1,2}[0-9]?$/i.test(lastToken)) {
      const col = lastToken.toUpperCase();
      for (let row = 1; row <= 10; row++) {
        suggestions.push({
          text: `${col}${row}`,
          type: 'cell',
          description: `Cell ${col}${row}`,
          insertText: `${col}${row}`,
        });
      }
    }

    // Named range suggestions
    if (context?.namedRanges) {
      for (const name of context.namedRanges) {
        if (name.toLowerCase().startsWith(lastToken.toLowerCase())) {
          suggestions.push({
            text: name,
            type: 'named',
            description: `Named range: ${name}`,
            insertText: name,
          });
        }
      }
    }

    // Sort: functions first, then cells, then named
    return suggestions
      .sort((a, b) => {
        const order = { function: 0, cell: 1, range: 2, named: 3, operator: 4 };
        return (order[a.type] ?? 5) - (order[b.type] ?? 5);
      })
      .slice(0, 20);
  }

  /**
   * Get function help text
   */
  static getFunctionHelp(
    name: string
  ): { syntax: string; description: string; category: string } | null {
    const info = FUNCTION_CATALOG[name.toUpperCase()];
    if (!info) return null;
    return { syntax: info.syntax, description: info.desc, category: info.category };
  }

  /**
   * Detect formula errors
   */
  static detectErrors(formula: string): string[] {
    const errors: string[] = [];

    // Check balanced parentheses
    let depth = 0;
    for (const char of formula) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        errors.push('Unbalanced parentheses: extra closing parenthesis');
        break;
      }
    }
    if (depth > 0) errors.push('Unbalanced parentheses: missing closing parenthesis');

    // Check for unknown functions
    const funcMatch = formula.match(/([A-Z]+)\s*\(/gi);
    if (funcMatch) {
      for (const match of funcMatch) {
        const name = match.replace(/\s*\($/, '').toUpperCase();
        if (!FUNCTION_CATALOG[name] && !['SUM', 'IF', 'AND', 'OR', 'NOT'].includes(name)) {
          errors.push(`Unknown function: ${name}`);
        }
      }
    }

    return errors;
  }

  private static getLastToken(formula: string): string {
    // Get the token being typed (after last operator, comma, or parenthesis)
    const match = formula.match(/([A-Za-z0-9_$]+)$/);
    return match?.[1] ?? '';
  }
}
