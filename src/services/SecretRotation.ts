// SecretRotation — Secret lifecycle manager with grace period overlap
// FinPlan Pro v1.0.0 — Phase 7 PATCH 12 (Hephaestus, 2026-06-16)
//
// SECURITY RATIONALE:
//   Centralizes the lifecycle of short-lived secrets (JWT signing keys, HMAC
//   secrets, API keys, session keys, encryption keys, CSRF keys) so callers
//   never reach into a raw key store. Rotation produces a new secret id but
//   keeps the old material valid for a grace period, so any in-flight token
//   continues to verify after rotation. Revocation immediately invalidates.
//
// THREAT MODEL ADDRESSED:
//   - CWE-798 (Hardcoded credentials): no fallbacks; secrets are generated
//     via crypto.getRandomValues, never assigned at module top-level.
//   - CWE-321 (Reusable cryptographic key): every rotation produces a new
//     random secret; old secret is quarantined, not reused.
//   - CWE-200 (Information exposure): getSecretMetadata() returns only id,
//     type, status, timestamps, fingerprint — never the secret material.
//   - CWE-613 (Insufficient session expiration): every secret has a TTL
//     and an explicit revocation path independent of expiry.
//   - CWE-778 (Insufficient logging): every create/rotate/verify/revoke
//     emits a SecretRotationAuditEvent the host can persist.
//
// DEPENDENCIES:
//   - Web Crypto API (crypto.subtle for fingerprint, crypto.getRandomValues
//     for material).

export const SECRET_ROTATION_CONSTANTS = {
  SCHEMA_VERSION: 1,
  /** Minimum acceptable secret material size in bytes. */
  MIN_SECRET_BYTES: 16,
  /** Default generated secret material size. */
  DEFAULT_SECRET_BYTES: 32,
  /** Maximum secret material size accepted from callers. */
  MAX_SECRET_BYTES: 64,
  /** Default grace period (1 hour) — old secret remains valid for this long
   *  after a successful rotation, allowing in-flight tokens to verify. */
  DEFAULT_GRACE_PERIOD_SECONDS: 3600,
  /** Hard cap on grace period (7 days). */
  MAX_GRACE_PERIOD_SECONDS: 7 * 24 * 60 * 60,
  /** Default secret TTL (24 hours). */
  DEFAULT_TTL_SECONDS: 24 * 60 * 60,
  /** Hard cap on TTL (90 days). */
  MAX_TTL_SECONDS: 90 * 24 * 60 * 60,
  /** Secret id prefix for type safety. */
  SECRET_ID_PREFIX: 'sec_',
  /** Reason codes for audit events. */
  REASON_ROTATE_SCHEDULED: 'scheduled',
  REASON_ROTATE_COMPROMISED: 'compromised',
  REASON_ROTATE_OPERATOR: 'operator-requested',
  REASON_ROVOKE_COMPROMISED: 'compromised',
  REASON_REVOKE_OPERATOR: 'operator-requested',
  REASON_EXPIRED: 'expired',
} as const;

export type SecretType =
  | 'jwt'
  | 'hmac'
  | 'api-key'
  | 'session'
  | 'encryption'
  | 'csrf';

export type SecretStatus = 'active' | 'rotating' | 'revoked' | 'expired';

export interface SecretMetadata {
  /** Unique identifier. Format: sec_<base36 8 char nanoid>. */
  id: string;
  /** Type of secret. */
  type: SecretType;
  /** Current status. */
  status: SecretStatus;
  /** Epoch millis when the secret was created. */
  createdAt: number;
  /** Epoch millis when the secret was last rotated (0 if never). */
  rotatedAt: number;
  /** Epoch millis when the secret will be considered expired. */
  expiresAt: number;
  /** Epoch millis when the grace period ends (0 if not rotating). */
  graceEndsAt: number;
  /** SHA-256 fingerprint of the material (hex). Never the material itself. */
  fingerprint: string;
  /** Free-form label (e.g. "auth.jwt.primary"). */
  label: string;
  /** Optional user id this secret is scoped to. */
  ownerId: string | null;
}

export interface SecretRecord extends SecretMetadata {
  /** Raw material. Held only in memory, never logged. */
  material: Uint8Array;
  /** Optional previous material during rotation grace. */
  previousMaterial: Uint8Array | null;
  /** Optional previous fingerprint during rotation grace. */
  previousFingerprint: string | null;
  /** Rotation history (most recent first, max 5). */
  history: Array<{ id: string; rotatedAt: number; reason: string }>;
}

export interface CreateSecretOptions {
  type: SecretType;
  label: string;
  /** Bytes; defaults to DEFAULT_SECRET_BYTES. */
  bytes?: number;
  /** TTL in seconds; defaults to DEFAULT_TTL_SECONDS. */
  ttlSeconds?: number;
  /** Optional explicit material. Must be >= MIN_SECRET_BYTES. */
  material?: Uint8Array;
  /** Optional owning user id. */
  ownerId?: string | null;
}

export interface RotateSecretOptions {
  /** New material byte length. Defaults to current bytes. */
  bytes?: number;
  /** Grace period in seconds. Defaults to DEFAULT_GRACE_PERIOD_SECONDS. */
  gracePeriodSeconds?: number;
  /** Reason for the audit log. Defaults to operator-requested. */
  reason?: string;
  /** Optional new material (otherwise generated). */
  newMaterial?: Uint8Array;
}

export interface RotateSecretResult {
  /** The new active secret id. */
  newSecretId: string;
  /** The old secret id (now in 'rotating' status, still verifiable). */
  oldSecretId: string;
  /** Epoch millis when the grace period ends. */
  graceEndsAt: number;
  /** Epoch millis when the new secret expires. */
  newExpiresAt: number;
}

export interface VerifySecretResult {
  valid: boolean;
  /** Status of the secret at time of verification. */
  status: SecretStatus;
  /** id verified (may be the old id during rotation). */
  id: string;
}

export type SecretRotationAuditEvent =
  | {
      type: 'secret.created';
      secretId: string;
      secretType: SecretType;
      label: string;
      fingerprint: string;
      ownerId: string | null;
      expiresAt: number;
      actor: string;
      at: number;
    }
  | {
      type: 'secret.rotated';
      oldSecretId: string;
      newSecretId: string;
      secretType: SecretType;
      label: string;
      reason: string;
      graceEndsAt: number;
      actor: string;
      at: number;
    }
  | {
      type: 'secret.verified';
      secretId: string;
      valid: boolean;
      status: SecretStatus;
      actor: string;
      at: number;
    }
  | {
      type: 'secret.revoked';
      secretId: string;
      reason: string;
      actor: string;
      at: number;
    }
  | {
      type: 'secret.expired';
      secretId: string;
      at: number;
    }
  | {
      type: 'secret.grace.cleanup';
      secretId: string;
      at: number;
    };

export interface SecretRotationConfig {
  /** Default grace period in seconds. */
  defaultGracePeriodSeconds?: number;
  /** Default TTL in seconds. */
  defaultTtlSeconds?: number;
  /** Optional audit callback. */
  onAudit?: (event: SecretRotationAuditEvent) => void | Promise<void>;
  /** Actor id used in audit events when none provided. */
  defaultActor?: string;
}

export class SecretRotationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'SecretRotationError';
  }
}

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Constant-time string comparison (length-checked). */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Constant-time Uint8Array comparison. */
function constantTimeBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

function generateSecretId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < bytes.length; i++) {
    id += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${SECRET_ROTATION_CONSTANTS.SECRET_ID_PREFIX}${id}`;
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

export class SecretRotation {
  private static instance: SecretRotation | null = null;

  private readonly secrets: Map<string, SecretRecord> = new Map();
  private readonly defaultGracePeriodSeconds: number;
  private readonly defaultTtlSeconds: number;
  private readonly onAudit:
    | ((e: SecretRotationAuditEvent) => void | Promise<void>)
    | null;
  private readonly defaultActor: string;

  private constructor(config: SecretRotationConfig = {}) {
    this.defaultGracePeriodSeconds =
      config.defaultGracePeriodSeconds ??
      SECRET_ROTATION_CONSTANTS.DEFAULT_GRACE_PERIOD_SECONDS;
    this.defaultTtlSeconds =
      config.defaultTtlSeconds ?? SECRET_ROTATION_CONSTANTS.DEFAULT_TTL_SECONDS;
    this.onAudit = config.onAudit ?? null;
    this.defaultActor = config.defaultActor ?? 'system';
  }

  static getInstance(config?: SecretRotationConfig): SecretRotation {
    if (!SecretRotation.instance) {
      SecretRotation.instance = new SecretRotation(config);
    }
    return SecretRotation.instance;
  }

  /** Test seam. */
  static resetInstance(): void {
    if (SecretRotation.instance) {
      SecretRotation.instance.secrets.clear();
    }
    SecretRotation.instance = null;
  }

  /**
   * Create a new active secret.
   * Returns the new secret id. The secret material is held only in memory.
   */
  async createSecret(
    options: CreateSecretOptions,
    actor?: string
  ): Promise<string> {
    if (!options || typeof options !== 'object') {
      throw new SecretRotationError('options required', 'INVALID_OPTIONS');
    }
    if (typeof options.label !== 'string' || options.label.length === 0) {
      throw new SecretRotationError('label must be non-empty', 'INVALID_LABEL');
    }
    if (
      options.type !== 'jwt' &&
      options.type !== 'hmac' &&
      options.type !== 'api-key' &&
      options.type !== 'session' &&
      options.type !== 'encryption' &&
      options.type !== 'csrf'
    ) {
      throw new SecretRotationError(
        `unknown secret type: ${options.type}`,
        'INVALID_TYPE'
      );
    }
    let material: Uint8Array;
    if (options.material) {
      if (
        !(options.material instanceof Uint8Array) ||
        options.material.byteLength < SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES ||
        options.material.byteLength > SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES
      ) {
        throw new SecretRotationError(
          `material must be ${SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES}-${SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES} bytes`,
          'INVALID_MATERIAL'
        );
      }
      material = new Uint8Array(options.material);
    } else {
      const bytes =
        options.bytes ?? SECRET_ROTATION_CONSTANTS.DEFAULT_SECRET_BYTES;
      if (
        bytes < SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES ||
        bytes > SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES
      ) {
        throw new SecretRotationError(
          `bytes must be ${SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES}-${SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES}`,
          'INVALID_BYTES'
        );
      }
      material = randomBytes(bytes);
    }

    const ttl =
      options.ttlSeconds ?? this.defaultTtlSeconds;
    if (
      ttl < 1 ||
      ttl > SECRET_ROTATION_CONSTANTS.MAX_TTL_SECONDS
    ) {
      throw new SecretRotationError(
        `ttlSeconds must be 1..${SECRET_ROTATION_CONSTANTS.MAX_TTL_SECONDS}`,
        'INVALID_TTL'
      );
    }

    const id = generateSecretId();
    const now = Date.now();
    const expiresAt = now + ttl * 1000;
    const fingerprint = await sha256Hex(material);

    const record: SecretRecord = {
      id,
      type: options.type,
      status: 'active',
      createdAt: now,
      rotatedAt: 0,
      expiresAt,
      graceEndsAt: 0,
      fingerprint,
      label: options.label,
      ownerId: options.ownerId ?? null,
      material,
      previousMaterial: null,
      previousFingerprint: null,
      history: [],
    };

    this.secrets.set(id, record);
    await this.recordAudit({
      type: 'secret.created',
      secretId: id,
      secretType: options.type,
      label: options.label,
      fingerprint,
      ownerId: options.ownerId ?? null,
      expiresAt,
      actor: actor ?? this.defaultActor,
      at: now,
    });
    return id;
  }

  /**
   * Rotate an existing active/rotating secret.
   * Produces a new id, moves the old record into 'rotating' status, and
   * returns identifiers for both. The old material remains valid for
   * verification until the grace period elapses.
   */
  async rotateSecret(
    secretId: string,
    options: RotateSecretOptions = {},
    actor?: string
  ): Promise<RotateSecretResult> {
    const existing = this.secrets.get(secretId);
    if (!existing) {
      throw new SecretRotationError(
        `unknown secret id: ${secretId}`,
        'UNKNOWN_SECRET'
      );
    }
    if (existing.status === 'revoked') {
      throw new SecretRotationError(
        `cannot rotate revoked secret: ${secretId}`,
        'ALREADY_REVOKED'
      );
    }
    if (existing.status === 'expired') {
      throw new SecretRotationError(
        `cannot rotate expired secret: ${secretId}`,
        'ALREADY_EXPIRED'
      );
    }
    const grace =
      options.gracePeriodSeconds ?? this.defaultGracePeriodSeconds;
    if (
      grace < 0 ||
      grace > SECRET_ROTATION_CONSTANTS.MAX_GRACE_PERIOD_SECONDS
    ) {
      throw new SecretRotationError(
        `gracePeriodSeconds must be 0..${SECRET_ROTATION_CONSTANTS.MAX_GRACE_PERIOD_SECONDS}`,
        'INVALID_GRACE'
      );
    }

    const now = Date.now();
    const ttl = Math.max(
      1,
      Math.round((existing.expiresAt - existing.createdAt) / 1000)
    );
    const newBytes =
      options.bytes ??
      (options.newMaterial ? options.newMaterial.byteLength : existing.material.byteLength);
    if (
      newBytes < SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES ||
      newBytes > SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES
    ) {
      throw new SecretRotationError(
        `bytes must be ${SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES}-${SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES}`,
        'INVALID_BYTES'
      );
    }
    const newMaterial = options.newMaterial
      ? new Uint8Array(options.newMaterial)
      : randomBytes(newBytes);
    if (
      !(newMaterial instanceof Uint8Array) ||
      newMaterial.byteLength !== newBytes
    ) {
      throw new SecretRotationError('newMaterial size mismatch', 'INVALID_BYTES');
    }

    const newId = generateSecretId();
    const newFingerprint = await sha256Hex(newMaterial);
    const newExpiresAt = now + ttl * 1000;
    // grace=0: set graceEndsAt to `now` so cleanupExpiredGrace expires it on
    // the very next pass (and verifySecret() already rejects it inline).
    // grace>0: grace window ends at now + grace*1000.
    const graceEndsAt = grace > 0 ? now + grace * 1000 : now;

    const newRecord: SecretRecord = {
      id: newId,
      type: existing.type,
      status: 'active',
      createdAt: now,
      rotatedAt: 0,
      expiresAt: newExpiresAt,
      graceEndsAt: 0,
      fingerprint: newFingerprint,
      label: existing.label,
      ownerId: existing.ownerId,
      material: newMaterial,
      previousMaterial: null,
      previousFingerprint: null,
      history: [],
    };

    // Move the old record into rotating state, preserving previousMaterial
    // for grace-window verifications.
    const oldRecord: SecretRecord = {
      ...existing,
      status: 'rotating',
      rotatedAt: now,
      graceEndsAt,
      previousMaterial: new Uint8Array(existing.material),
      previousFingerprint: existing.fingerprint,
      history: [
        { id: newId, rotatedAt: now, reason: options.reason ?? 'operator-requested' },
        ...existing.history,
      ].slice(0, 5),
    };
    // Zero the old record's primary material — only previousMaterial is
    // consulted during grace. We do this BEFORE swapping Map keys.
    existing.material.fill(0);
    // Replace the map entry keyed by old id, and add the new id.
    this.secrets.delete(secretId);
    this.secrets.set(secretId, oldRecord);
    this.secrets.set(newId, newRecord);

    await this.recordAudit({
      type: 'secret.rotated',
      oldSecretId: secretId,
      newSecretId: newId,
      secretType: existing.type,
      label: existing.label,
      reason: options.reason ?? 'operator-requested',
      graceEndsAt,
      actor: actor ?? this.defaultActor,
      at: now,
    });

    return {
      newSecretId: newId,
      oldSecretId: secretId,
      graceEndsAt,
      newExpiresAt,
    };
  }

  /**
   * Verify a candidate material against a stored secret.
   * If the secret is in 'rotating' state and the candidate matches the
   * previous material within the grace window, verification succeeds.
   */
  async verifySecret(
    secretId: string,
    candidate: Uint8Array
  ): Promise<VerifySecretResult> {
    if (typeof secretId !== 'string' || secretId.length === 0) {
      throw new SecretRotationError('secretId required', 'INVALID_ID');
    }
    if (!(candidate instanceof Uint8Array)) {
      throw new SecretRotationError('candidate must be Uint8Array', 'INVALID_CANDIDATE');
    }
    const record = this.secrets.get(secretId);
    if (!record) {
      return { valid: false, status: 'revoked', id: secretId };
    }
    const now = Date.now();
    if (record.status === 'revoked') {
      return { valid: false, status: 'revoked', id: secretId };
    }
    if (record.status === 'expired' || now > record.expiresAt) {
      if (record.status !== 'expired') {
        record.status = 'expired';
        await this.recordAudit({
          type: 'secret.expired',
          secretId,
          at: now,
        });
      }
      return { valid: false, status: 'expired', id: secretId };
    }
    if (record.status === 'rotating') {
      if (record.graceEndsAt > 0 && now >= record.graceEndsAt) {
        // Grace window has elapsed (or was 0). Treat as expired and clean up.
        record.status = 'expired';
        if (record.previousMaterial) {
          record.previousMaterial.fill(0);
        }
        record.graceEndsAt = 0;
        await this.recordAudit({
          type: 'secret.grace.cleanup',
          secretId,
          at: now,
        });
        return { valid: false, status: 'expired', id: secretId };
      }
      // Try previous material (primary material was zeroed on rotation).
      if (record.previousMaterial && constantTimeBytesEqual(candidate, record.previousMaterial)) {
        await this.recordAudit({
          type: 'secret.verified',
          secretId,
          valid: true,
          status: 'rotating',
          actor: this.defaultActor,
          at: now,
        });
        return { valid: true, status: 'rotating', id: secretId };
      }
      await this.recordAudit({
        type: 'secret.verified',
        secretId,
        valid: false,
        status: 'rotating',
        actor: this.defaultActor,
        at: now,
      });
      return { valid: false, status: 'rotating', id: secretId };
    }
    // status === 'active'
    const ok = constantTimeBytesEqual(candidate, record.material);
    await this.recordAudit({
      type: 'secret.verified',
      secretId,
      valid: ok,
      status: 'active',
      actor: this.defaultActor,
      at: now,
    });
    return { valid: ok, status: 'active', id: secretId };
  }

  /**
   * Immediately revoke a secret. Verification will fail for any material
   * after this point, regardless of grace window.
   */
  async revokeSecret(
    secretId: string,
    reason?: string,
    actor?: string
  ): Promise<void> {
    const record = this.secrets.get(secretId);
    if (!record) {
      throw new SecretRotationError(
        `unknown secret id: ${secretId}`,
        'UNKNOWN_SECRET'
      );
    }
    if (record.status === 'revoked') {
      return; // idempotent
    }
    record.status = 'revoked';
    record.graceEndsAt = 0;
    if (record.material) {
      record.material.fill(0);
    }
    if (record.previousMaterial) {
      record.previousMaterial.fill(0);
    }
    const now = Date.now();
    await this.recordAudit({
      type: 'secret.revoked',
      secretId,
      reason: reason ?? 'operator-requested',
      actor: actor ?? this.defaultActor,
      at: now,
    });
  }

  /** Read metadata only — never returns the material. */
  getSecretMetadata(secretId: string): SecretMetadata | null {
    const r = this.secrets.get(secretId);
    if (!r) {
      return null;
    }
    return {
      id: r.id,
      type: r.type,
      status: r.status,
      createdAt: r.createdAt,
      rotatedAt: r.rotatedAt,
      expiresAt: r.expiresAt,
      graceEndsAt: r.graceEndsAt,
      fingerprint: r.fingerprint,
      label: r.label,
      ownerId: r.ownerId,
    };
  }

  /** List all known secret metadata (never the material). */
  listSecrets(): SecretMetadata[] {
    return Array.from(this.secrets.values()).map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      createdAt: r.createdAt,
      rotatedAt: r.rotatedAt,
      expiresAt: r.expiresAt,
      graceEndsAt: r.graceEndsAt,
      fingerprint: r.fingerprint,
      label: r.label,
      ownerId: r.ownerId,
    }));
  }

  /**
   * Walk rotating secrets and either keep them (if grace still active) or
   * move them to expired and zero their previousMaterial.
   * Returns the number of secrets that were cleaned up this pass.
   *
   * A rotating record is eligible for cleanup when its graceEndsAt is set
   * AND the current time is at or past that deadline, OR when grace=0 was
   * requested at rotation time (in which case graceEndsAt is set to `now`,
   * i.e. the rotation timestamp itself, so the next cleanup pass expires it).
   */
  async cleanupExpiredGrace(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const record of this.secrets.values()) {
      if (record.status !== 'rotating') {
        continue;
      }
      // graceEndsAt === rotatedAt means grace=0 was requested; expire now.
      // graceEndsAt > 0 && now >= graceEndsAt means grace window elapsed.
      // graceEndsAt === 0 should not happen for rotating records.
      if (record.graceEndsAt > 0 && now >= record.graceEndsAt) {
        record.status = 'expired';
        record.graceEndsAt = 0;
        if (record.previousMaterial) {
          record.previousMaterial.fill(0);
        }
        cleaned++;
        await this.recordAudit({
          type: 'secret.grace.cleanup',
          secretId: record.id,
          at: now,
        });
      }
    }
    return cleaned;
  }

  /** Test seam. Wipes all state. */
  clear(): void {
    for (const r of this.secrets.values()) {
      if (r.material) r.material.fill(0);
      if (r.previousMaterial) r.previousMaterial.fill(0);
    }
    this.secrets.clear();
  }

  private async recordAudit(event: SecretRotationAuditEvent): Promise<void> {
    if (!this.onAudit) {
      return;
    }
    try {
      await this.onAudit(event);
    } catch {
      // Audit failures must not crash the host. Callers may observe the
      // missing event and re-derive if needed; we intentionally swallow
      // to keep secret lifecycle operations reliable.
    }
  }
}
