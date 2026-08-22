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
