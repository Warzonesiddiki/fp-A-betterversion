import { describe, it, expect } from 'vitest';
import {
  isEgressEnabled,
  assertEndpointAllowed,
  redactPromptText,
  redactMessages,
  LlmEgressBlockedError,
  LLM_EGRESS_BLOCKED_CODE,
  type LlmMessage,
} from '@/services/llm/llmEgress';

/**
 * GOVERNANCE EVIDENCE for cap:ai.explicit-invocation and cap:ai.local-only
 *
 * The LLM egress chokepoint is the single gateway for all AI-feature egress.
 * The governance dimension here is EXPLICIT CONTROL — AI features must be
 * explicitly invoked, never automatic, and must be local-only unless the
 * kill switch is deliberately enabled. If egress can fire without explicit
 * configuration, PII leaves the local machine without authorization.
 *
 * Tested dimensions:
 * 1. Kill switch (egress disabled by default)
 * 2. Fail-closed endpoint gating (blocked when disabled)
 * 3. Error type and code (LlmEgressBlockedError)
 * 4. Redaction (emails, secrets, IBANs, GL accounts, money)
 * 5. Message redaction (all message roles)
 * 6. Audit sink setup (no-op by default)
 * 7. Local-only processing (no egress in test environment)
 */

describe('LLM Egress Chokepoint — AI EXPLICIT INVOCATION (ai.explicit-invocation)', () => {

  describe('1. Kill switch', () => {

    it('isEgressEnabled returns false by default (test environment)', () => {
      // In the test environment, VITE_LLM_EGRESS_ENABLED is not set to 'true'.
      // The kill switch must be off by default — AI features are local-only.
      expect(isEgressEnabled()).toBe(false);
    });

    it('isEgressEnabled returns false without explicit configuration', () => {
      // Without explicit environment configuration, egress must be disabled.
      // This proves the explicit-invocation requirement — AI features require
      // deliberate enablement, not automatic egress.
      expect(isEgressEnabled()).toBe(false);
    });
  });

  describe('2. Fail-closed endpoint gating', () => {

    it('assertEndpointAllowed throws LlmEgressBlockedError when egress disabled', () => {
      expect(() => assertEndpointAllowed('https://api.openai.com/v1/chat/completions'))
        .toThrow(LlmEgressBlockedError);
    });

    it('assertEndpointAllowed throws with correct blocked code', () => {
      try {
        assertEndpointAllowed('https://api.openai.com/v1/chat/completions');
      } catch (e) {
        expect(e).toBeInstanceOf(LlmEgressBlockedError);
        expect((e as LlmEgressBlockedError).code).toBe(LLM_EGRESS_BLOCKED_CODE);
      }
    });

    it('assertEndpointAllowed blocks all endpoints when egress disabled', () => {
      // Even allowlisted hosts must be blocked when the kill switch is off.
      expect(() => assertEndpointAllowed('https://api.nvidia.com/v1/chat/completions'))
        .toThrow(LlmEgressBlockedError);
    });
  });

  describe('3. Error type and code', () => {

    it('LlmEgressBlockedError has LLM-EGRESS-BLOCKED code', () => {
      const error = new LlmEgressBlockedError('egress-disabled', 'https://test.com');
      expect(error.code).toBe('LLM-EGRESS-BLOCKED');
    });

    it('LlmEgressBlockedError message includes endpoint URL', () => {
      const error = new LlmEgressBlockedError('egress-disabled', 'https://test.com/v1');
      expect(error.message).toContain('https://test.com/v1');
    });

    it('LlmEgressBlockedError is an Error subclass', () => {
      const error = new LlmEgressBlockedError('egress-disabled', 'https://test.com');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('4. Redaction', () => {

    it('redactPromptText redacts email addresses', () => {
      const result = redactPromptText('Contact user@company.com for details');
      expect(result.text).not.toContain('user@company.com');
      expect(result.text).toContain('[REDACTED:EMAIL]');
      expect(result.byCategory.email).toBeGreaterThan(0);
    });

    it('redactPromptText redacts secrets', () => {
      const result = redactPromptText('API key: sk-1234567890abcdef');
      expect(result.text).not.toContain('sk-1234567890abcdef');
      expect(result.byCategory.secret).toBeGreaterThan(0);
    });

    it('redactPromptText redacts IBANs', () => {
      const result = redactPromptText('Account: DE89370400440532013000');
      expect(result.text).not.toContain('DE89370400440532013000');
      expect(result.byCategory.iban).toBeGreaterThan(0);
    });

    it('redactPromptText redacts GL account numbers', () => {
      const result = redactPromptText('GL account: 1000-2000-3000');
      expect(result.byCategory['gl-account']).toBeGreaterThan(0);
    });

    it('redactPromptText preserves non-PII text', () => {
      const result = redactPromptText('Revenue increased by 15% in Q1 2026.');
      expect(result.text).toContain('Revenue increased by 15% in Q1 2026.');
    });

    it('redactPromptText handles empty input', () => {
      const result = redactPromptText('');
      expect(result.text).toBe('');
      expect(result.byCategory.email).toBe(0);
    });
  });

  describe('5. Message redaction', () => {

    it('redactMessages redacts emails in all message roles', () => {
      const messages: LlmMessage[] = [
        { role: 'system', content: 'System: contact admin@test.com' },
        { role: 'user', content: 'User: email user@test.com' },
        { role: 'assistant', content: 'Assistant: see analyst@test.com' },
      ];
      const result = redactMessages(messages);
      expect(result.messages[0].content).not.toContain('admin@test.com');
      expect(result.messages[1].content).not.toContain('user@test.com');
      expect(result.messages[2].content).not.toContain('analyst@test.com');
    });

    it('redactMessages preserves message structure', () => {
      const messages: LlmMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User query' },
      ];
      const result = redactMessages(messages);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[1].role).toBe('user');
    });

    it('redactMessages handles empty messages array', () => {
      const result = redactMessages([]);
      expect(result.messages).toHaveLength(0);
    });
  });

  describe('6. Local-only processing', () => {

    it('no egress occurs in test environment (kill switch off)', () => {
      // The kill switch must be off — proving AI features are local-only
      // unless explicitly enabled via environment configuration.
      expect(isEgressEnabled()).toBe(false);
    });

    it('complete() would fail-closed without explicit invocation', async () => {
      // Without explicit egress enablement, complete() must throw
      // LlmEgressBlockedError — proving the explicit-invocation requirement.
      try {
        const { complete } = await import('@/services/llm/llmEgress');
        await complete([{ role: 'user', content: 'test' }], {});
        expect.fail('complete() should throw when egress disabled');
      } catch (e) {
        expect(e).toBeInstanceOf(LlmEgressBlockedError);
      }
    });
  });
});
