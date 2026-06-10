import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCompact,
  formatPercent,
  formatNumber,
  formatVariance,
  parseFinancialInput,
  useFinancialFormatter,
} from './financialFormatting';

describe('formatCurrency', () => {
  it('should format positive values with parentheses default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/\$1,234\.56/);
  });

  it('should format negative values with parentheses', () => {
    const result = formatCurrency(-1234.56);
    expect(result).toBe('($1,234.56)');
  });

  it('should format negative values with minus sign', () => {
    const result = formatCurrency(-1234.56, { negativeStyle: 'minus' });
    expect(result).toBe('-$1,234.56');
  });

  it('should format negative values with color style (no parentheses)', () => {
    const result = formatCurrency(-1234.56, { negativeStyle: 'color' });
    expect(result).toBe('$1,234.56');
  });

  it('should return nullDisplay for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('should return nullDisplay for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('should return zeroDisplay for zero', () => {
    expect(formatCurrency(0)).toBe('—');
  });

  it('should use custom config', () => {
    const result = formatCurrency(100, {
      locale: 'de-DE',
      currency: 'EUR',
      zeroDisplay: '0',
    });
    expect(result).toMatch(/100/);
  });

  it('should handle very large numbers', () => {
    const result = formatCurrency(1_000_000_000);
    expect(result).toMatch(/1,000,000,000/);
  });
});

describe('formatCompact', () => {
  it('should format billions', () => {
    expect(formatCompact(1_500_000_000)).toBe('$1.5B');
  });

  it('should format millions', () => {
    expect(formatCompact(2_500_000)).toBe('$2.5M');
  });

  it('should format thousands', () => {
    expect(formatCompact(45_000)).toBe('$45K');
  });

  it('should format small numbers with formatCurrency', () => {
    const result = formatCompact(500);
    expect(result).toMatch(/500/);
  });

  it('should return dash for null', () => {
    expect(formatCompact(null)).toBe('—');
  });

  it('should return dash for zero', () => {
    expect(formatCompact(0)).toBe('—');
  });

  it('should handle negative values', () => {
    expect(formatCompact(-2_500_000)).toBe('-$2.5M');
  });
});

describe('formatPercent', () => {
  it('should format with default 1 decimal', () => {
    expect(formatPercent(15.678)).toBe('15.7%');
  });

  it('should format with custom decimals', () => {
    expect(formatPercent(15.678, 2)).toBe('15.68%');
  });

  it('should format zero percent', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('should format negative percent', () => {
    expect(formatPercent(-5.2)).toBe('-5.2%');
  });

  it('should return dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatNumber', () => {
  it('should format with default 0 decimals', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('should format with decimals', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
  });

  it('should return dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatVariance', () => {
  it('should calculate favorable variance', () => {
    const result = formatVariance(120, 100);
    expect(result.text).toMatch(/20/);
    expect(result.percentage).toBe('(+20.0%)');
    expect(result.className).toContain('fin-positive');
  });

  it('should calculate unfavorable variance', () => {
    const result = formatVariance(80, 100);
    // formatCurrency(-20, {negativeStyle:'minus'}) => "-$20.00"
    expect(result.text).toContain('20');
    expect(result.percentage).toBe('(-20.0%)');
    expect(result.className).toContain('fin-negative');
  });

  it('should handle zero budget', () => {
    const result = formatVariance(100, 0);
    // pct = budget !== 0 ? ... : 0 => 0 => "+0.0%"
    expect(result.percentage).toBe('(+0.0%)');
    expect(result.className).toBe('fin-neutral');
  });

  it('should handle equal values', () => {
    const result = formatVariance(100, 100);
    expect(result.percentage).toBe('(+0.0%)');
    expect(result.className).toBe('fin-neutral');
  });

  it('should handle small variances as neutral', () => {
    const result = formatVariance(100.001, 100);
    expect(result.className).toBe('fin-neutral');
  });
});

describe('parseFinancialInput', () => {
  it('should parse a plain number', () => {
    expect(parseFinancialInput('1234')).toBe(1234);
  });

  it('should parse a decimal', () => {
    expect(parseFinancialInput('1234.56')).toBe(1234.56);
  });

  it('should parse currency symbol', () => {
    expect(parseFinancialInput('$1,234')).toBe(1234);
  });

  it('should parse euro symbol', () => {
    expect(parseFinancialInput('€1,234')).toBe(1234);
  });

  it('should parse parentheses as negative', () => {
    expect(parseFinancialInput('(1234)')).toBe(-1234);
  });

  it('should parse compact K', () => {
    expect(parseFinancialInput('5K')).toBe(5000);
  });

  it('should parse compact M', () => {
    expect(parseFinancialInput('2.5M')).toBe(2_500_000);
  });

  it('should parse compact B', () => {
    expect(parseFinancialInput('1B')).toBe(1_000_000_000);
  });

  it('should parse compact K with parentheses', () => {
    expect(parseFinancialInput('(5K)')).toBe(-5000);
  });

  it('should parse percentage', () => {
    expect(parseFinancialInput('15%')).toBe(15);
  });

  it('should parse negative with minus', () => {
    expect(parseFinancialInput('-500')).toBe(-500);
  });

  it('should return null for empty string', () => {
    expect(parseFinancialInput('')).toBeNull();
  });

  it('should return null for whitespace only', () => {
    expect(parseFinancialInput('   ')).toBeNull();
  });

  it('should return null for dash', () => {
    expect(parseFinancialInput('—')).toBeNull();
  });

  it('should return null for non-numeric', () => {
    expect(parseFinancialInput('abc')).toBeNull();
  });

  it('should handle leading/trailing spaces', () => {
    expect(parseFinancialInput('  1234  ')).toBe(1234);
  });
});

describe('useFinancialFormatter', () => {
  it('should return formatter functions', () => {
    const fmt = useFinancialFormatter();
    expect(typeof fmt.currency).toBe('function');
    expect(typeof fmt.compact).toBe('function');
    expect(typeof fmt.percent).toBe('function');
    expect(typeof fmt.number).toBe('function');
    expect(typeof fmt.variance).toBe('function');
    expect(typeof fmt.parse).toBe('function');
  });

  it('currency formatter should work', () => {
    const fmt = useFinancialFormatter();
    expect(fmt.currency(100)).toMatch(/100/);
  });

  it('compact formatter should work', () => {
    const fmt = useFinancialFormatter();
    expect(fmt.compact(1_000_000)).toBe('$1.0M');
  });

  it('percent formatter should work', () => {
    const fmt = useFinancialFormatter();
    expect(fmt.percent(50)).toBe('50.0%');
  });

  it('number formatter should work', () => {
    const fmt = useFinancialFormatter();
    expect(fmt.number(1234)).toBe('1,234');
  });

  it('variance formatter should work', () => {
    const fmt = useFinancialFormatter();
    const v = fmt.variance(120, 100);
    expect(v.percentage).toBe('(+20.0%)');
  });

  it('parse should work', () => {
    const fmt = useFinancialFormatter();
    expect(fmt.parse('100')).toBe(100);
  });
});
