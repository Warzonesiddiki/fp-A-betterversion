import { describe, expect, it } from 'vitest';

import { redactMessages, redactPromptText } from './llmEgress';

// Blueprint W0.9 requirement 2 — deterministic redactor verified against a
// fixture table. Every row is an exact known answer (no snapshots).
interface Fixture {
  readonly name: string;
  readonly input: string;
  readonly expected: string;
  readonly count: number;
}

const FIXTURES: readonly Fixture[] = [
  {
    name: 'clean financial prose is untouched',
    input: 'Revenue grew 15% in FY2026 to 450000 units.',
    expected: 'Revenue grew 15% in FY2026 to 450000 units.',
    count: 0,
  },
  {
    name: 'OpenAI-style secret (sk-)',
    input: 'key sk-proj-abc123def456ghijkl end',
    expected: 'key [REDACTED:SECRET] end',
    count: 1,
  },
  {
    name: 'GitHub PAT shape (ghp_)',
    input: 'token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456 ok',
    expected: 'token [REDACTED:SECRET] ok',
    count: 1,
  },
  {
    name: 'AWS access key id shape (AKIA)',
    input: 'aws AKIAIOSFODNN7EXAMPLE done',
    expected: 'aws [REDACTED:SECRET] done',
    count: 1,
  },
  {
    name: 'German-style IBAN sequence',
    input: 'pay DE89370400440532013000 now',
    expected: 'pay [REDACTED:IBAN] now',
    count: 1,
  },
  {
    name: 'UK-style IBAN sequence',
    input: 'GB82WEST12345698765432',
    expected: '[REDACTED:IBAN]',
    count: 1,
  },
  {
    name: 'GL account references with separators',
    input: 'acct GL-40201 and GL:4020100',
    expected: 'acct [REDACTED:GL_ACCOUNT] and [REDACTED:GL_ACCOUNT]',
    count: 2,
  },
  {
    name: 'thousands-grouped money amount',
    input: 'total 1,234,567 USD',
    expected: 'total [REDACTED:MONEY] USD',
    count: 1,
  },
  {
    name: 'bare digit run >= 7 (money/id)',
    input: 'ref 12345678 x',
    expected: 'ref [REDACTED:DIGITS] x',
    count: 1,
  },
  {
    name: 'short digit runs and years survive',
    input: '2026 budget 450000 vs plan 12345',
    expected: '2026 budget 450000 vs plan 12345',
    count: 0,
  },
  {
    name: 'email flattened by default',
    input: 'mail alice.smith+fin@corp.example thanks',
    expected: 'mail [REDACTED:EMAIL] thanks',
    count: 1,
  },
  {
    name: 'email local part with long digit run leaks nothing',
    input: 'bill1234567@corp.example',
    expected: '[REDACTED:EMAIL]',
    count: 1,
  },
  {
    name: 'combined fixture counts every category exactly once',
    input:
      'GL-40001 total 8,765,432 mail bob@corp.example key sk-abcdef1234567890abcd run 99999999',
    expected:
      '[REDACTED:GL_ACCOUNT] total [REDACTED:MONEY] mail [REDACTED:EMAIL] key [REDACTED:SECRET] run [REDACTED:DIGITS]',
    count: 5,
  },
  {
    name: 'lowercase compact IBAN sequence',
    input: 'wire de89370400440532013000 via sepa',
    expected: 'wire [REDACTED:IBAN] via sepa',
    count: 1,
  },
  {
    name: 'lowercase space-grouped IBAN sequence',
    input: 'de89 3700 4404 4053 2013 00 settled',
    expected: '[REDACTED:IBAN] settled',
    count: 1,
  },
  {
    name: 'marked uppercase space-grouped IBAN',
    input: 'IBAN: GB82 WEST 1234 5698 7654 32 confirmed',
    expected: 'IBAN: [REDACTED:IBAN] confirmed',
    count: 1,
  },
  {
    name: 'dotted GL account reference',
    input: 'acct GL.40201 cleared',
    expected: 'acct [REDACTED:GL_ACCOUNT] cleared',
    count: 1,
  },
  {
    name: 'segmented dash account code (no prefix, >=7 digits)',
    input: 'code 4020-100 approved',
    expected: 'code [REDACTED:GL_ACCOUNT] approved',
    count: 1,
  },
  {
    name: 'segmented dot account code (no prefix, >=7 digits)',
    input: 'code 4020.100 approved',
    expected: 'code [REDACTED:GL_ACCOUNT] approved',
    count: 1,
  },
  {
    name: 'EU-format currency amount (dot-grouped, comma decimals)',
    input: 'cost €1.234.567,00 total',
    expected: 'cost [REDACTED:MONEY] total',
    count: 1,
  },
  {
    name: 'GBP currency amount with comma grouping',
    input: 'budget £5,000 fee',
    expected: 'budget [REDACTED:MONEY] fee',
    count: 1,
  },
  {
    name: 'USD decimal amount keeps trailing sentence period',
    input: 'cost $1,234.56.',
    expected: 'cost [REDACTED:MONEY].',
    count: 1,
  },
  {
    name: 'small dotted/dashed tokens survive (below digit-sum guard)',
    input: 'versions 1.2.3 and 2026.1 ok',
    expected: 'versions 1.2.3 and 2026.1 ok',
    count: 0,
  },
  {
    name: 'segmented dot groups >=7 digits fail closed (documented tradeoff)',
    input: 'snapshot 2026.08.15 stored',
    expected: 'snapshot [REDACTED:GL_ACCOUNT] stored',
    count: 1,
  },
];

describe('llmEgress redactor — fixture table', () => {
  it.each(FIXTURES.map((fixture) => [fixture.name, fixture] as const))('%s', (_name, fixture) => {
    const result = redactPromptText(fixture.input);
    expect(result.text).toBe(fixture.expected);
    expect(result.redactions).toBe(fixture.count);
    // The category breakdown must sum to the reported total.
    const categorySum = Object.values(result.byCategory).reduce((sum, n) => sum + n, 0);
    expect(categorySum).toBe(fixture.count);
  });

  it('reports per-category counts for the combined fixture', () => {
    const result = redactPromptText(
      'GL-40001 total 8,765,432 mail bob@corp.example key sk-abcdef1234567890abcd run 99999999'
    );
    expect(result.byCategory).toEqual({
      email: 1,
      secret: 1,
      iban: 0,
      'gl-account': 1,
      'money-grouped': 1,
      digits: 1,
    });
  });
});

describe('llmEgress redactor — pseudonymization mode', () => {
  it('replaces emails with a deterministic pseudonym', () => {
    const first = redactPromptText('alice.smith+fin@corp.example', { pseudonymizeEmails: true });
    const second = redactPromptText('alice.smith+fin@corp.example', { pseudonymizeEmails: true });
    expect(first.text).toMatch(
      /^user-[0-9a-f]{2}x[0-9a-f]{2}x[0-9a-f]{2}x[0-9a-f]{2}@redacted\.invalid$/
    );
    expect(first.text).toBe(second.text);
  });

  it('produces different pseudonyms for different addresses', () => {
    const a = redactPromptText('alice@example.org', { pseudonymizeEmails: true }).text;
    const b = redactPromptText('robert@example.org', { pseudonymizeEmails: true }).text;
    expect(a).not.toBe(b);
  });

  it('pseudonyms can never be corrupted by the long-digit pass', () => {
    for (let i = 0; i < 500; i++) {
      const email = `user${i}@corp.example`;
      const out = redactPromptText(email, { pseudonymizeEmails: true }).text;
      expect(out.startsWith('user-')).toBe(true);
      expect(out.endsWith('@redacted.invalid')).toBe(true);
      // No 7+ consecutive digits anywhere in the pseudonym output.
      expect(/\d{7,}/.test(out)).toBe(false);
    }
  });
});

describe('llmEgress redactor — message arrays', () => {
  it('redacts each message and reports the summed count without mutating input', () => {
    const original = [
      { role: 'system' as const, content: 'You are a FP&A assistant.' },
      {
        role: 'user' as const,
        content: 'account GL-40201 moved 12,345,678 to ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
      },
    ];
    const snapshot = JSON.stringify(original);

    const { messages, redactions } = redactMessages(original);

    expect(messages[0]!.content).toBe('You are a FP&A assistant.');
    expect(messages[1]!.content).toBe(
      'account [REDACTED:GL_ACCOUNT] moved [REDACTED:MONEY] to [REDACTED:SECRET]'
    );
    expect(redactions).toBe(3);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it('is deterministic across repeated invocations', () => {
    const input = 'pay DE89370400440532013000 from acct GL-40201';
    expect(redactPromptText(input)).toEqual(redactPromptText(input));
  });
});

describe('llmEgress redactor — overlapping-category precedence (R16)', () => {
  it('email-local digits are consumed by the email pass, not the digit pass', () => {
    const result = redactPromptText('contact invoice-1234567@corp.example today');
    expect(result.text).toBe('contact [REDACTED:EMAIL] today');
    expect(result.byCategory.email).toBe(1);
    expect(result.byCategory.digits).toBe(0);
    expect(result.redactions).toBe(1);
  });

  it('compact IBANs win over the bare digit-run pass', () => {
    const result = redactPromptText('acct DE89370400440532013000 closed');
    expect(result.text).toBe('acct [REDACTED:IBAN] closed');
    expect(result.byCategory.iban).toBe(1);
    expect(result.byCategory.digits).toBe(0);
  });

  it('currency-symbol amounts win over segmented-code matching', () => {
    const result = redactPromptText('paid €1.234.567,00 today');
    expect(result.text).toBe('paid [REDACTED:MONEY] today');
    expect(result.byCategory['money-grouped']).toBe(1);
    expect(result.byCategory['gl-account']).toBe(0);
  });
});

describe('llmEgress redactor — performance sanity (R16)', () => {
  it('redacts a 50k-char prompt in under 1s with exact counts', () => {
    // Per snippet: 1 gl-account (GL-40201) + 1 email (a@b.io) + 1 digit run.
    const snippet = 'acct GL-40201 mail a@b.io pay 12345678 ';
    const reps = Math.ceil(50000 / snippet.length);
    const input = snippet.repeat(reps);
    expect(input.length).toBeGreaterThanOrEqual(50000);

    const started = performance.now();
    const result = redactPromptText(input);
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(1000);
    expect(result.redactions).toBe(reps * 3);
    expect(result.byCategory).toEqual({
      email: reps,
      secret: 0,
      iban: 0,
      'gl-account': reps,
      'money-grouped': 0,
      digits: reps,
    });
    expect(result.text.includes('[REDACTED:EMAIL]')).toBe(true);
    expect(/\d{7,}/.test(result.text)).toBe(false);
  });
});
