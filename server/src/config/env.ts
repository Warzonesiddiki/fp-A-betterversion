import crypto from 'crypto';

/**
 * Validates and exports critical environment variables at startup.
 *
 * JWT_SECRET behaviour:
 *   - Production (NODE_ENV === 'production'): MUST be set or the process exits.
 *   - Development / Test: auto-generates a random 64-byte hex secret and warns.
 */

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

function resolveJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET;

  if (envSecret && envSecret.length > 0) {
    return envSecret;
  }

  if (IS_PRODUCTION) {
    console.error(
      '[config] FATAL: JWT_SECRET environment variable is not set. ' +
        'In production the server will not start without an explicit secret.'
    );
    process.exit(1);
  }

  // Development / test — auto-generate a per-launch random secret.
  const generated = crypto.randomBytes(64).toString('hex');
  console.warn(
    '[config] WARNING: JWT_SECRET is not set. ' +
      `Auto-generated a random secret for ${NODE_ENV} mode. ` +
      'This secret will change on every restart — do NOT use in production.'
  );
  return generated;
}

export const JWT_SECRET = resolveJwtSecret();

function resolveAuditSecret(): string {
  const envSecret = process.env.AUDIT_HMAC_SECRET;
  if (envSecret && envSecret.length > 0) {
    return envSecret;
  }
  const generated = crypto.randomBytes(64).toString('hex');
  return generated;
}

export const AUDIT_HMAC_SECRET = resolveAuditSecret();
export { NODE_ENV, IS_PRODUCTION };
