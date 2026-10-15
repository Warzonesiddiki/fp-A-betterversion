/**
 * W6-P0-10: locale-aware financial amount parser for the GL import path.
 *
 * Bare parseFloat silently truncates comma-formatted amounts ("1,234.56"
 * becomes 1). This parser implements a separator heuristic instead:
 *
 *  - Both "," and "." present → the rightmost symbol is the decimal
 *    separator and the other is thousands grouping.
 *  - Only one symbol present → it is a decimal separator when followed by
 *    exactly 1-2 digits at the end of the string; otherwise it is thousands
 *    grouping.
 *  - Currency symbols ($ € £ ¥ ₹ ¤) and spaces (incl. NBSP variants) are
 *    stripped; a leading +/- sign, trailing minus or surrounding parentheses carry the sign,
 *    so "(500)" parses to -500.
 *  - Thousands grouping is only accepted when every group after the first is
 *    exactly 3 digits ("12,34,567" ok, "1,2345" rejected).
 *
 * The number compatibility wrapper returns NaN for anything unparseable so callers can reject the row instead
 * of silently storing a wrong value.
 */
const CURRENCY_AND_SPACE = /[\s\u00A0\u2007\u202F$€£¥₹¤]/g;
const ONLY_DIGITS_AND_SEPARATORS = /^[0-9.,]+$/;
const HAS_A_DIGIT = /\d/;

function stripThousandsGroups(intPart: string, sep: string): string | null {
  const groups = intPart.split(sep);
  // US/EU grouping repeats exact 3-digit groups; Indian grouping uses 2-digit
  // middle groups with a final 3-digit group. Both satisfy: every group after
  // the first has 2-3 digits and the LAST group is exactly 3 digits.
  for (let i = 1; i < groups.length; i++) {
    if (!/^\d{2,3}$/.test(groups[i]!)) return null;
  }
  if (groups.length > 1 && !/^\d{3}$/.test(groups[groups.length - 1]!)) return null;
  return groups.join('');
}

/** Exact decimal lexeme for ingestion; null means invalid. No Number conversion. */
export function parseFinancialAmountExact(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s.length === 0) return null;

  // Strip currency symbols and spaces (incl. NBSP variants) first so signs
  // wrapped inside them — "$(1,234.50)" — still read correctly.
  s = s.replace(CURRENCY_AND_SPACE, '');
  if (s.length === 0) return null;

  let negative = false;
  const paren = /^\((.*)\)$/.exec(s);
  if (paren) {
    negative = true;
    s = paren[1]!.trim();
  } else if (/^[+-]/.test(s)) {
    negative = s.startsWith('-');
    s = s.slice(1).trim();
  } else if (/\d-$/.test(s)) {
    negative = true;
    s = s.slice(0, -1);
  }

  if (s.length === 0 || !ONLY_DIGITS_AND_SEPARATORS.test(s) || !HAS_A_DIGIT.test(s)) {
    return null;
  }

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let decimalSep = '';
  if (lastComma >= 0 && lastDot >= 0) {
    decimalSep = lastComma > lastDot ? ',' : '.';
    // The chosen decimal separator may occur only once.
    if (s.split(decimalSep).length - 1 !== 1) return null;
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const occursOnce = s.split(sep).length - 1 === 1;
    if (occursOnce && new RegExp(`${sep === '.' ? '\\.' : sep}\\d{1,2}$`).test(s)) {
      decimalSep = sep;
    }
  }

  let normalized: string;
  if (decimalSep !== '') {
    const thousandsSep = decimalSep === '.' ? ',' : '.';
    const [intPart, ...rest] = s.split(decimalSep);
    if (intPart === undefined || rest.length > 1) return null;
    const strippedInt =
      intPart.includes(thousandsSep) || intPart === ''
        ? stripThousandsGroups(intPart, thousandsSep)
        : intPart;
    if (strippedInt === null || strippedInt.length === 0) return null;
    normalized = `${strippedInt}.${rest[0] ?? ''}`;
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const stripped = stripThousandsGroups(s, sep);
    if (stripped === null) return null;
    normalized = stripped;
  } else {
    normalized = s;
  }

  if (!/^\d+(\.\d*)?$/.test(normalized)) return null;
  return negative ? `-${normalized}` : normalized;
}

/** Compatibility boundary for existing number-valued callers. */
export function parseFinancialAmount(raw: string): number {
  const exact = parseFinancialAmountExact(raw);
  if (exact === null) return Number.NaN;
  const value = Number(exact);
  return Number.isFinite(value) ? (value === 0 ? 0 : value) : Number.NaN;
}
