import { describe, it, expect } from 'vitest';
import { verifyNarrative, type VerifiedFact } from './verifiedFactsGate';

/**
 * AI-001 corpus: narratives may only state figures that resolve to
 * approved facts. Supported forms (exact, rounded-for-display,
 * scaled suffix, percent) pass; invented figures reject the text.
 */

const FACTS: VerifiedFact[] = [
  { label: 'Revenue', value: 1200000, kind: 'money' },
  { label: 'COGS', value: 700000, kind: 'money' },
  { label: 'Gross margin %', value: 41.67, kind: 'percent' },
  { label: 'Headcount', value: 23, kind: 'count' },
];

describe('verifyNarrative', () => {
  it('accepts text whose every number resolves to a fact', () => {
    const v = verifyNarrative(
      'Revenue was $1,200,000 against COGS of $700,000, a gross margin of 41.7% across 23 staff.',
      FACTS
    );
    expect(v.accepted).toBe(true);
    expect(v.unsupported).toEqual([]);
    expect(v.citedFactLabels).toContain('Revenue');
  });

  it('accepts scaled suffix forms of money facts', () => {
    expect(verifyNarrative('Revenue reached $1.2M.', FACTS).accepted).toBe(true);
    expect(verifyNarrative('COGS was $700K.', FACTS).accepted).toBe(true);
  });

  it('rejects invented figures and names them', () => {
    const v = verifyNarrative('SaaS bookings drove revenue of $4.2M, up 12% year on year.', FACTS);
    expect(v.accepted).toBe(false);
    expect(v.unsupported.map((u) => u.raw)).toEqual(['$4.2M', '12%']);
  });

  it('rejects a subtly wrong figure (rounding beyond display tolerance)', () => {
    const v = verifyNarrative('Revenue was $1,200,500.', FACTS);
    expect(v.accepted).toBe(false);
    expect(v.unsupported[0]?.raw).toBe('$1,200,500');
  });

  it('does not mistake years for figures', () => {
    expect(verifyNarrative('In 2026 revenue was $1.2M.', FACTS).accepted).toBe(true);
  });

  it('text with no numbers is accepted (nothing to verify)', () => {
    expect(verifyNarrative('Revenue grew strongly.', FACTS).accepted).toBe(true);
  });
});
