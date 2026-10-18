import { toDecimal } from '@/utils/money';

/**
 * AI-001 — the verified-facts gate (Phase 13).
 *
 * Rule: every number in AI-produced text must resolve to an approved
 * figure, or the output is rejected. AI surfaces in this app are
 * local and deterministic today (formula assistant, NLQ summaries),
 * but the gate is the chokepoint any future narrative — local or
 * remote — must pass before it reaches a reader. It is deliberately
 * strict and boring:
 *
 *  - Numeric tokens are extracted with their markers: currency
 *    ($1,234.56), scaled suffixes (1.2M, 850K, 2B), percents (12.5%),
 *    and plain numbers (1,234 / 42.5).
 *  - A token is SUPPORTED when it matches an approved fact of the
 *    same kind within display tolerance (half a cent for money, 0.05
 *    for percents — i.e. the figure as it would honestly be rounded
 *    for display). Scaled forms match the unscaled fact (1.2M
 *    supports $1,200,000 within suffix rounding).
 *  - Bare 4-digit years (1900–2199) are not figures and are ignored;
 *    a year attached to currency or % markers is not ignored.
 *  - Anything else numeric is UNSUPPORTED and rejects the text. The
 *    caller must withhold or regenerate the output — never publish
 *    it with the unsupported figures edited out silently.
 *
 * Facts come from verified derivations (statement builders, query
 * results), never from the narrative itself.
 */

export type FactKind = 'money' | 'percent' | 'count' | 'ratio';

export interface VerifiedFact {
  label: string;
  value: number;
  kind: FactKind;
}

export interface UnsupportedNumber {
  raw: string;
  value: number;
}

export interface GateVerdict {
  accepted: boolean;
  unsupported: UnsupportedNumber[];
  /** Labels of facts that at least one token resolved to. */
  citedFactLabels: string[];
}

interface Token {
  raw: string;
  value: number;
  kind: FactKind;
}

const TOKEN_RE = /(\$|€|£)?\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s?([KMB])?(%)?/g;

function extractTokens(text: string): Token[] {
  const tokens: Token[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const [, currency, digits, suffix, percent] = m;
    if (!digits) continue;
    const base = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(base)) continue;
    // Bare years are dates, not figures.
    if (!currency && !suffix && !percent && /^\d{4}$/.test(digits)) {
      const year = Number(digits);
      if (year >= 1900 && year <= 2199) continue;
    }
    const multiplier = suffix === 'K' ? 1e3 : suffix === 'M' ? 1e6 : suffix === 'B' ? 1e9 : 1;
    const value = base * multiplier;
    const kind: FactKind = percent ? 'percent' : currency || suffix ? 'money' : 'count';
    tokens.push({ raw: m[0].trim(), value, kind });
  }
  return tokens;
}

function matches(token: Token, fact: VerifiedFact): boolean {
  // Percent tokens only resolve to percent facts; currency/scaled
  // tokens only to money; plain tokens to money, count or ratio.
  if (token.kind === 'percent' && fact.kind !== 'percent') return false;
  if (token.kind === 'money' && fact.kind !== 'money') return false;
  if (token.kind === 'count' && fact.kind === 'percent') return false;

  const diff = toDecimal(token.value).minus(toDecimal(fact.value)).abs();
  // Display tolerance: money to the cent (scaled suffixes round to
  // their last shown digit, e.g. 1.2M means ±50,000), percents to
  // 0.05, counts/ratios exact to 0.5 of the last unit shown — use a
  // generous-but-bounded relative window for suffix tokens only.
  if (token.raw.match(/[KMB]$/)) {
    const unit = token.raw.endsWith('B') ? 1e9 : token.raw.endsWith('M') ? 1e6 : 1e3;
    const shown = toDecimal(token.value).dividedBy(unit);
    const decimals = (shown.toString().split('.')[1] ?? '').length;
    const halfStep = toDecimal(unit).dividedBy(toDecimal(10).pow(decimals)).dividedBy(2);
    return diff.lessThanOrEqualTo(halfStep);
  }
  const tolerance = fact.kind === 'percent' ? 0.05 : fact.kind === 'money' ? 0.01 : 0.5;
  return diff.lessThanOrEqualTo(toDecimal(tolerance));
}

export function verifyNarrative(text: string, facts: readonly VerifiedFact[]): GateVerdict {
  const tokens = extractTokens(text);
  const unsupported: UnsupportedNumber[] = [];
  const cited = new Set<string>();
  for (const token of tokens) {
    const fact = facts.find((f) => matches(token, f));
    if (fact) cited.add(fact.label);
    else unsupported.push({ raw: token.raw, value: token.value });
  }
  return {
    accepted: unsupported.length === 0,
    unsupported,
    citedFactLabels: [...cited],
  };
}
