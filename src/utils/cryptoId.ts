// =============================================================================
// CRYPTO-SAFE IDENTIFIERS
// -----------------------------------------------------------------------------
// Zero-compromise rule: identifiers with security or audit meaning (request
// ids, audit entry ids, retention records, hash salts, recovery tokens) MUST
// come from a cryptographically secure source. `Math.random()` is predictable
// and is banned for those paths.
//
// `randomId` prefers `crypto.randomUUID()` (Node ≥19, all modern browsers),
// falls back to `crypto.getRandomValues` hex, and throws rather than degrade
// to a non-CSPRNG source — a security-relevant id generated without a CSPRNG
// is worse than no id at all.
// =============================================================================

function assertCrypto(c: Crypto | undefined): asserts c is Crypto {
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error(
      'randomId: no Web Crypto API available — refusing to generate an identifier from a non-CSPRNG source.'
    );
  }
}

/** Hex string of `byteLen` CSPRNG bytes (uppercase). */
function randomHexBytes(byteLen: number): string {
  const c = globalThis.crypto;
  assertCrypto(c);
  const bytes = new Uint8Array(byteLen);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a crypto-safe identifier, optionally `prefix`-qualified
 * (e.g. `randomId('audit')` → `audit-3f2a…`). All generated ids are unique
 * per call within the practical lifetime of the app.
 */
export function randomId(prefix = ''): string {
  const c = globalThis.crypto;
  assertCrypto(c);
  if (typeof c.randomUUID === 'function') {
    return prefix ? `${prefix}-${c.randomUUID()}` : c.randomUUID();
  }
  // Older runtimes without randomUUID: 16 CSPRNG bytes formatted as a UUID v4.
  const hex = randomHexBytes(16);
  return prefix
    ? `${prefix}-${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
    : `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
