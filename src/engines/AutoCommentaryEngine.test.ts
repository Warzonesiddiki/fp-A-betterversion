/**
 * @vitest-environment jsdom
 *
 * Known-answer tests for AutoCommentaryEngine. The previous suite only
 * asserted `typeof commentary === 'string'`, so float drift, a 0% variance
 * on a zero budget, and currency-formatting a growth rate all shipped.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { AutoCommentaryEngine } from './AutoCommentaryEngine';
import { setLlmEgressAuditSink, type LlmEgressAuditEvent } from '@/services/llm/llmEgress';

describe('AutoCommentaryEngine.generateVarianceCommentary', () => {
  it('states the exact above-budget variance on a known pair', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(
      120000,
      100000,
      'Revenue',
      'Q1 2026'
    );
    expect(commentary).toBe('Revenue for Q1 2026 was $120,000, above budget by $20,000 (20.0%).');
  });

  it('states the exact below-budget variance on a known pair', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(
      80000,
      100000,
      'Revenue',
      'Q1 2026'
    );
    expect(commentary).toBe('Revenue for Q1 2026 was $80,000, below budget by $20,000 (20.0%).');
  });

  it('does not invent a 0% variance when the budget is zero', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(
      50000,
      0,
      'Revenue',
      'Q1 2026'
    );
    expect(commentary).toContain('not defined because the budget is zero');
    expect(commentary).not.toMatch(/0\.0%/);
    expect(commentary).not.toMatch(/in line with budget/);
  });

  it('treats a sub-threshold variance as broadly in line', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(
      102000,
      100000,
      'Revenue',
      'Q1 2026'
    );
    expect(commentary).toContain('broadly in line with budget');
    expect(commentary).toContain('2.0%');
  });

  it('appends drivers and a prior-year comparison from posted figures', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(
      120000,
      100000,
      'Revenue',
      'Q1 2026',
      { priorYear: 90000, drivers: ['volume', 'price'] }
    );
    expect(commentary).toContain('Key drivers include volume and price.');
    expect(commentary).toContain(
      'Compared to prior year ($90,000), this represents an increase of $30,000 (33.3%).'
    );
  });

  it('never says favorable or unfavorable (account class is unknown)', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(
      120000,
      100000,
      'Expense',
      'Q1 2026'
    );
    expect(commentary).not.toMatch(/favorable|unfavorable/i);
  });

  it('keeps a repeating-cent variance exact', () => {
    const commentary = AutoCommentaryEngine.generateVarianceCommentary(0.3, 0.1, 'Fees', 'Q1 2026');
    // 0.2 / 0.1 = 200%. IEEE-754 0.3 - 0.1 is 0.19999999999999998.
    expect(commentary).toContain('200.0%');
    expect(commentary).not.toMatch(/199\.999/);
  });
});

describe('AutoCommentaryEngine.generateSectionNarrative', () => {
  it('sums posted line items with decimal money, not float reduce', () => {
    const narrative = AutoCommentaryEngine.generateSectionNarrative(
      'Revenue',
      [
        { name: 'Product', actual: 0.1, budget: 0.1 },
        { name: 'Service', actual: 0.2, budget: 0.2 },
      ],
      'Q1 2026'
    );
    expect(narrative).toContain('$0');
    expect(narrative).not.toMatch(/0\.30000000000000004/);
  });

  it('names notable variances as above/below budget, not favorable', () => {
    const narrative = AutoCommentaryEngine.generateSectionNarrative(
      'Revenue',
      [
        { name: 'Product Revenue', actual: 500000, budget: 450000 },
        { name: 'Service Revenue', actual: 200000, budget: 180000 },
      ],
      'Q1 2026'
    );
    expect(narrative).toContain('Product Revenue (above budget $50,000)');
    expect(narrative).not.toMatch(/favorable|unfavorable/i);
  });

  it('returns the empty-section sentence when there are no lines', () => {
    expect(AutoCommentaryEngine.generateSectionNarrative('Revenue', [], 'Q1 2026')).toBe(
      'No data available for Revenue in Q1 2026.'
    );
  });
});

describe('AutoCommentaryEngine.interpolate', () => {
  it('renders a dash rather than throwing when a money key is non-finite', () => {
    expect(
      AutoCommentaryEngine.interpolate('Budget [budget] actual [amount]', {
        budget: Number.NaN,
        amount: Number.POSITIVE_INFINITY,
      })
    ).toBe('Budget — actual —');
  });

  it('does not currency-format a growth rate or a period count', () => {
    const result = AutoCommentaryEngine.interpolate(
      'Revenue grew by [growth]% in [period] over [periods] periods',
      { growth: 15, period: 'Q1 2026', periods: 3 }
    );
    expect(result).toBe('Revenue grew by 15% in Q1 2026 over 3 periods');
    expect(result).not.toContain('$15');
  });

  it('currency-formats amount and budget only', () => {
    const result = AutoCommentaryEngine.interpolate(
      'Total [category] was [amount] against a budget of [budget].',
      { category: 'Revenue', amount: 120000, budget: 100000 }
    );
    expect(result).toBe('Total Revenue was $120,000 against a budget of $100,000.');
  });
});

describe('AutoCommentaryEngine.generateOutlook', () => {
  it('states the YTD-carried-forward identity rather than a forecast', () => {
    const outlook = AutoCommentaryEngine.generateOutlook('Revenue', 600000, 500000, 2000000, 2);
    expect(outlook).toContain('if the remaining budget is delivered in full');
    expect(outlook).toContain('not a forecast of remaining periods');
    expect(outlook).toContain('$100,000');
    expect(outlook).toContain('20.0%');
  });

  it('does not invent a full-year percentage when the FY budget is zero', () => {
    const outlook = AutoCommentaryEngine.generateOutlook('Revenue', 100, 0, 0, 1);
    expect(outlook).toContain('not defined');
    expect(outlook).not.toMatch(/0\.0%/);
  });
});

describe('AutoCommentaryEngine.getTemplates', () => {
  it('returns the named template set', () => {
    const templates = AutoCommentaryEngine.getTemplates();
    expect(templates.map((t) => t.id)).toContain('variance-positive');
    expect(templates.length).toBeGreaterThan(0);
  });
});

function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards', () => {
  const source = codeOnly(readFileSync('src/engines/AutoCommentaryEngine.ts', 'utf-8'));

  it('contains no raw money arithmetic', () => {
    expect(source).not.toMatch(/actual\s*-\s*budget/);
    expect(source).not.toMatch(/sum\s*\+\s*item\.(actual|budget)/);
    expect(source).not.toMatch(/Math\.abs\(/);
  });

  it('does not label variances favorable without an account class', () => {
    expect(source).not.toMatch(/['"]favorable['"]/);
    expect(source).not.toMatch(/['"]unfavorable['"]/);
  });
});

describe('AutoCommentaryEngine.generateSectionNarrativeEnhanced (W0.9 egress wiring)', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const ITEMS = [
    { name: 'Licenses', actual: 120000, budget: 100000 },
    { name: 'Support', actual: 80000, budget: 100000 },
  ];
  const SECTION = 'Revenue';
  const PERIOD = 'Q1 2026';

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    setLlmEgressAuditSink(null);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function enableEgress(): void {
    vi.stubEnv('VITE_LLM_EGRESS_ENABLED', 'true');
    vi.stubEnv('VITE_NIM_API_KEY_1', 'key-aaa');
  }

  it('uses the local path and never touches transport when egress is disabled', async () => {
    // VITE_LLM_EGRESS_ENABLED unset -> kill switch closed by default.
    const events: LlmEgressAuditEvent[] = [];
    setLlmEgressAuditSink({ append: (event) => events.push(event) });

    const result = await AutoCommentaryEngine.generateSectionNarrativeEnhanced(
      SECTION,
      ITEMS,
      PERIOD
    );

    expect(result.source).toBe('local');
    expect(result.text).toBe(AutoCommentaryEngine.generateSectionNarrative(SECTION, ITEMS, PERIOD));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(events).toHaveLength(0);
  });

  it('routes through the chokepoint when egress is enabled and the host is allowlisted', async () => {
    enableEgress();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'n1',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '  Polished narrative from the model.  ' },
              finish_reason: 'stop',
            },
          ],
          usage: {},
        }),
    });
    const events: LlmEgressAuditEvent[] = [];
    setLlmEgressAuditSink({ append: (event) => events.push(event) });

    const result = await AutoCommentaryEngine.generateSectionNarrativeEnhanced(
      SECTION,
      ITEMS,
      PERIOD
    );

    expect(result.source).toBe('llm');
    expect(result.text).toBe('Polished narrative from the model.');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('integrate.api.nvidia.com/v1/chat/completions');

    // Gating proof via the audit hook: exactly one audited attempt on the
    // default-allowed NVIDIA endpoint.
    expect(events).toHaveLength(1);
    expect(events[0]!.endpoint).toContain('integrate.api.nvidia.com');
    expect(typeof events[0]!.promptBytes).toBe('number');
    expect(events[0]!.promptBytes).toBeGreaterThan(0);
    expect(typeof events[0]!.redactions).toBe('number');

    // The prompt payload carries the derived facts.
    const body = JSON.parse(mockFetch.mock.calls[0]![1].body);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].content).toContain('"Revenue"');
    expect(body.messages[1].content).toContain('Licenses: actual=120,000');
  });

  it('falls back to the local text without throwing when the host is not allowed', async () => {
    vi.stubEnv('VITE_LLM_EGRESS_ENABLED', 'true');
    vi.stubEnv('VITE_NIM_API_KEY_1', 'key-aaa');
    // Deny nvidia by allowlisting only a different host.
    vi.stubEnv('VITE_LLM_EGRESS_ALLOWED_HOSTS', 'other-host.example.com');
    const events: LlmEgressAuditEvent[] = [];
    setLlmEgressAuditSink({ append: (event) => events.push(event) });

    const result = await AutoCommentaryEngine.generateSectionNarrativeEnhanced(
      SECTION,
      ITEMS,
      PERIOD
    );

    expect(result.source).toBe('local');
    expect(result.text).toBe(AutoCommentaryEngine.generateSectionNarrative(SECTION, ITEMS, PERIOD));
    expect(mockFetch).not.toHaveBeenCalled();
    // Gate rejections fire before the audit hook.
    expect(events).toHaveLength(0);
  });

  it('falls back to the local text when the model response is non-OK', async () => {
    enableEgress();
    mockFetch.mockResolvedValue({ ok: false, status: 503, text: () => Promise.resolve('down') });

    const result = await AutoCommentaryEngine.generateSectionNarrativeEnhanced(
      SECTION,
      ITEMS,
      PERIOD
    );

    expect(result.source).toBe('local');
    expect(result.text).toBe(AutoCommentaryEngine.generateSectionNarrative(SECTION, ITEMS, PERIOD));
  });

  it('falls back to the local text when the model returns empty content', async () => {
    enableEgress();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'empty',
          choices: [
            { index: 0, message: { role: 'assistant', content: '' }, finish_reason: 'stop' },
          ],
          usage: {},
        }),
    });

    const result = await AutoCommentaryEngine.generateSectionNarrativeEnhanced(
      SECTION,
      ITEMS,
      PERIOD
    );

    expect(result.source).toBe('local');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
