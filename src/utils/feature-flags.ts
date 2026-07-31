/**
 * Feature-flagged activation (Omega Protocol §8).
 *
 * Local-first rollout control. Because FinPlan has no server performing
 * percentage rollouts, a deterministic per-session hash decides whether a
 * flagged code path is active — the same session always lands in the same
 * bucket, so a user who receives a canary keeps it across reloads. Rollback is
 * a flag flip (no redeploy).
 *
 * Newly wired engines start at a small canary percentage and are promoted to
 * 100% once verified, or flipped back to 0% instantly if they misbehave.
 */

export interface FeatureFlag {
  /** Master switch; when false the path is inactive regardless of percentage. */
  readonly enabled: boolean;
  /** 0..100 — share of sessions for which an enabled flag is active. */
  readonly rolloutPercentage: number;
}

/**
 * Flag registry. Add entries here as engines are wired; consumers read via
 * {@link isFeatureActive} so no call site hardcodes a percentage.
 */
export const FEATURE_FLAGS = {
  'engine.consolidation.v2': { enabled: true, rolloutPercentage: 100 },
  'engine.monte-carlo.advanced': { enabled: true, rolloutPercentage: 10 }, // canary
  'engine.tax-optimizer': { enabled: false, rolloutPercentage: 0 }, // dark launch
  // BATCH-006: newly surfaced LoanAmortizationEngine. Local-first app → enabled
  // for everyone; the flag is an instant kill-switch. On a hosted SaaS the same
  // entry would start at rolloutPercentage: 10 and promote after verification.
  'treasury.loan-amortization': { enabled: true, rolloutPercentage: 100 },
} as const satisfies Record<string, FeatureFlag>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Deterministic 0..99 bucket for a session id (FNV-1a, no dependencies).
 * Same session -> same bucket, every time.
 */
export function sessionBucket(sessionId: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < sessionId.length; i++) {
    hash ^= sessionId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return Math.abs(hash) % 100;
}

/** True iff the flag is both enabled and this session falls in the rollout. */
export function isFeatureActive(key: FeatureFlagKey, sessionId: string): boolean {
  const flag = FEATURE_FLAGS[key];
  if (!flag.enabled) return false;
  return sessionBucket(sessionId) < flag.rolloutPercentage;
}
