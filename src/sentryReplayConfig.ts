/**
 * Sentry Session Replay privacy configuration (F-0022).
 *
 * FinPlan Pro renders general-ledger balances, payroll figures, budgets,
 * forecasts and counterparty names. A replay of an error session is a video of
 * that data leaving the user's machine.
 *
 * The audited configuration called `Sentry.replayIntegration()` with no options
 * at `replaysOnErrorSampleRate: 1.0`, and the `SENTRY_REPLAY_MASK_ALL_TEXT`
 * variable advertised in .env.example was read by nothing.
 *
 * Policy implemented here:
 *   - masking is UNCONDITIONAL — no environment variable can weaken it, because
 *     privacy of financial data must not depend on deployment configuration;
 *   - text, inputs and media are masked/blocked globally;
 *   - network request/response bodies are never captured;
 *   - the values are stated explicitly rather than inherited from SDK defaults,
 *     so a dependency upgrade that changes a default cannot silently start
 *     recording plaintext.
 *
 * Unmasking a specific element is a deliberate, reviewable act: add the
 * `data-sentry-unmask` attribute to that element. Nothing in the financial
 * surface should carry it.
 */

export interface SentryReplayPrivacyOptions {
  /** Replace all text nodes with redacted placeholders. */
  maskAllText: boolean;
  /** Replace the value of every input, textarea and select. */
  maskAllInputs: boolean;
  /** Block images, video, canvas and other embedded media. */
  blockAllMedia: boolean;
  /** Extra CSS selectors whose contents must always be masked. */
  mask: string[];
  /** Selectors removed from the recording entirely. */
  block: string[];
  /** Attribute values that must never be recorded. */
  maskAttributes: string[];
  /** Selectors that may render unmasked (opt-in only). */
  unmask: string[];
  /** Never record request or response bodies. */
  networkDetailAllowUrls: string[];
  networkCaptureBodies: boolean;
}

/**
 * Elements that must be masked even if a future change relaxes `maskAllText`.
 * Defence in depth: these are the surfaces that carry monetary values and PII.
 */
export const FINANCIAL_MASK_SELECTORS: readonly string[] = [
  '[data-financial]',
  '[data-money]',
  '.ag-cell',
  '.budget-grid',
  '.gl-entry',
  '.trial-balance',
  '[data-testid*="amount"]',
  '[data-testid*="balance"]',
  '[data-testid*="salary"]',
];

/** Media and embeds that could leak rendered figures. */
export const BLOCKED_SELECTORS: readonly string[] = ['canvas', 'svg.recharts-surface', 'iframe'];

/** Attributes that can carry values or identifiers into the replay payload. */
export const MASKED_ATTRIBUTES: readonly string[] = [
  'title',
  'alt',
  'placeholder',
  'aria-label',
  'aria-valuetext',
  'value',
  'data-value',
];

/**
 * Build the replay privacy options. Takes no arguments on purpose — there is no
 * supported way to produce a less-private configuration.
 */
export function buildSentryReplayOptions(): SentryReplayPrivacyOptions {
  return {
    maskAllText: true,
    maskAllInputs: true,
    blockAllMedia: true,
    // Fresh mutable copies: the Sentry SDK's ReplayConfiguration declares these
    // as mutable string[], and returning new arrays also prevents a caller from
    // mutating the shared constants and weakening masking for everyone else.
    mask: [...FINANCIAL_MASK_SELECTORS],
    block: [...BLOCKED_SELECTORS],
    maskAttributes: [...MASKED_ATTRIBUTES],
    unmask: ['[data-sentry-unmask]'],
    networkDetailAllowUrls: [],
    networkCaptureBodies: false,
  };
}
