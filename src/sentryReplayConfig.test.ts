/**
 * F-0022 — Sentry Session Replay must never ship unmasked financial data.
 *
 * These tests assert the privacy contract itself and, critically, that the
 * contract cannot be weakened by configuration: the audited defect was that
 * masking depended on an environment variable that no code ever read, while
 * replay captured 100% of error sessions.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildSentryReplayOptions,
  FINANCIAL_MASK_SELECTORS,
  BLOCKED_SELECTORS,
  MASKED_ATTRIBUTES,
} from './sentryReplayConfig';

describe('F-0022 Sentry replay privacy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('masks all text, inputs and media', () => {
    const options = buildSentryReplayOptions();
    expect(options.maskAllText).toBe(true);
    expect(options.maskAllInputs).toBe(true);
    expect(options.blockAllMedia).toBe(true);
  });

  it('never captures network request or response bodies', () => {
    const options = buildSentryReplayOptions();
    expect(options.networkCaptureBodies).toBe(false);
    expect(options.networkDetailAllowUrls).toEqual([]);
  });

  it('masks the financial surfaces explicitly as defence in depth', () => {
    const options = buildSentryReplayOptions();
    for (const selector of ['[data-financial]', '.ag-cell', '.budget-grid', '.trial-balance']) {
      expect(options.mask).toContain(selector);
    }
    expect(FINANCIAL_MASK_SELECTORS.length).toBeGreaterThan(0);
  });

  it('blocks canvas and chart surfaces that render figures', () => {
    const options = buildSentryReplayOptions();
    expect(options.block).toEqual(BLOCKED_SELECTORS);
    expect(options.block).toContain('canvas');
  });

  it('masks attributes that can carry values or PII', () => {
    const options = buildSentryReplayOptions();
    expect(options.maskAttributes).toEqual(MASKED_ATTRIBUTES);
    for (const attribute of ['title', 'placeholder', 'aria-label', 'value']) {
      expect(options.maskAttributes).toContain(attribute);
    }
  });

  it('only unmasks elements that explicitly opt in', () => {
    expect(buildSentryReplayOptions().unmask).toEqual(['[data-sentry-unmask]']);
  });

  describe('masking cannot be disabled by configuration', () => {
    const disablingEnv = [
      ['SENTRY_REPLAY_MASK_ALL_TEXT', 'false'],
      ['VITE_SENTRY_REPLAY_MASK_ALL_TEXT', 'false'],
      ['VITE_SENTRY_REPLAY_MASK_ALL_INPUTS', '0'],
      ['VITE_SENTRY_REPLAY_BLOCK_ALL_MEDIA', 'no'],
    ] as const;

    for (const [name, value] of disablingEnv) {
      it(`ignores ${name}=${value}`, () => {
        vi.stubEnv(name, value);
        const options = buildSentryReplayOptions();
        expect(options.maskAllText).toBe(true);
        expect(options.maskAllInputs).toBe(true);
        expect(options.blockAllMedia).toBe(true);
      });
    }

    it('returns an equal configuration on every call', () => {
      expect(buildSentryReplayOptions()).toEqual(buildSentryReplayOptions());
    });

    it('cannot be weakened by mutating a previously returned config', () => {
      // The SDK requires mutable arrays. If those arrays were the shared module
      // constants, any caller could empty the mask list and silently disable
      // masking process-wide.
      const first = buildSentryReplayOptions();
      first.mask.length = 0;
      first.block.length = 0;
      first.maskAttributes.length = 0;
      first.maskAllText = false;

      const second = buildSentryReplayOptions();
      expect(second.maskAllText).toBe(true);
      expect(second.mask).toEqual([...FINANCIAL_MASK_SELECTORS]);
      expect(second.block).toEqual([...BLOCKED_SELECTORS]);
      expect(second.maskAttributes).toEqual([...MASKED_ATTRIBUTES]);
    });
  });

  describe('wiring', () => {
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main.tsx'), 'utf8');

    it('passes the privacy options to replayIntegration in main.tsx', () => {
      // A correct config object that is never handed to the SDK would protect
      // nothing, so the call site is asserted directly.
      expect(mainSource).toMatch(/replayIntegration\(\s*buildSentryReplayOptions\(\)\s*\)/);
    });

    it('never calls replayIntegration with no arguments', () => {
      expect(mainSource).not.toMatch(/replayIntegration\(\s*\)/);
    });
  });

  describe('documentation matches implementation', () => {
    it('does not advertise a masking env var that code ignores', () => {
      const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8');
      const advertisesToggle = /^\s*(VITE_)?SENTRY_REPLAY_MASK_ALL_TEXT\s*=/m.test(envExample);
      expect(
        advertisesToggle,
        '.env.example must not document SENTRY_REPLAY_MASK_ALL_TEXT: masking is unconditional ' +
          'and no code reads that variable, so documenting it implies a control that does not exist.'
      ).toBe(false);
    });
  });
});
