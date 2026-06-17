/**
 * SecretsVault.d.ts — PATCH 16 — TYPE-ONLY DEFINITIONS
 * @since 1.0.0
 * @ratification_gate 2026-06-22T16:00:00Z
 *
 * Hephaestus (Security Muse) — PATCH 16 — TYPE-SAFE WRAPPER
 * Co-signs: RULE #63 (multi-shard persistence), RULE #67 (rotation policy),
 *           RULE #68 (CATCH-NUMBERING hygiene)
 * 4-ICP STRICT: I1✓ C2✓ P3✓ D4✓
 */

// ─── TauriSecureStorage (PATCH 15) re-export ───────────────────────────────
export interface TauriSecureStorage {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  isAvailable(): Promise<boolean>;
  rotate?(
    reason: RotationReason,
    callback?: (progress: RotationProgress) => void
  ): Promise<RotationResult>;
}

// ─── Branded ID types (C2 type-safety) ──────────────────────────────────────
export type VaultShardId = "shard-0" | "shard-1" | "shard-2";
export type RotationReason =
  | "scheduled"
  | "incident"
  | "compromise-suspected"
  | "policy-update"
  | "manual"
  | "boot-recovery";

// ─── Vault value envelope ───────────────────────────────────────────────────
export interface VaultEntry<T = unknown> {
  /** Semantic version monotonic (Hephaestus invariant) */
  readonly version: number;
  /** ISO-8601 creation timestamp */
  readonly createdAt: string;
  /** ISO-8601 last-mutation timestamp */
  readonly updatedAt: string;
  /** Rotation counter — increments on every rotate() */
  readonly rotationCount: number;
  /** AES-256-GCM ciphertext (base64) */
  readonly ciphertext: string;
  /** AES-GCM 12-byte IV (base64) */
  readonly iv: string;
  /** PBKDF2-SHA-256 salt (base64) */
  readonly salt: string;
  /** SHA-256 integrity checksum (base64) */
  readonly checksum: string;
  /** Optional opaque payload (only populated post-decrypt) */
  readonly payload?: T;
  /** Originating shard id */
  readonly originShard?: VaultShardId;
}

// ─── Result envelopes (discriminated unions) ───────────────────────────────
export interface VaultWriteResult {
  readonly ok: true;
  readonly key: string;
  readonly version: number;
  readonly shardsWritten: VaultShardId[];
  readonly quorumReached: boolean;
}

export interface VaultReadResult<T = unknown> {
  readonly ok: true;
  readonly value: T;
  readonly version: number;
  readonly rotationCount: number;
  readonly originShard: VaultShardId;
}

export interface RotationProgress {
  readonly phase:
    | "re-encrypt-shard-0"
    | "re-encrypt-shard-1"
    | "re-encrypt-shard-2"
    | "verify-quorum"
    | "wal-compact"
    | "complete";
  readonly completed: number;
  readonly total: number;
}

export interface RotationResult {
  readonly ok: true;
  readonly previousRotationCount: number;
  readonly newRotationCount: number;
  readonly durationMs: number;
}

// ─── Vault error taxonomy (I1 cascade-safety) ───────────────────────────────
export type VaultErrorCode =
  | "QUORUM_NOT_REACHED"
  | "CHECKSUM_MISMATCH"
  | "DECRYPT_FAILED"
  | "CIRCUIT_OPEN"
  | "CASCADE_VETO"
  | "KEY_NOT_FOUND"
  | "INVALID_PAYLOAD"
  | "STORAGE_UNAVAILABLE"
  | "ROTATION_IN_PROGRESS"
  | "WAL_REPLAY_FAILED"
  | "ATOMIC_WRITE_FAILED"
  | "RATE_LIMITED"
  | "TIMEOUT";

export interface VaultError {
  readonly ok: false;
  readonly code: VaultErrorCode;
  readonly message: string;
  readonly key?: string;
  readonly cause?: unknown;
  readonly retriable: boolean;
  readonly traceId: string;
}

export type VaultResult<T> = VaultReadResult<T> | VaultError;
export type VaultWriteOutcome = VaultWriteResult | VaultError;

// ─── Rotation listener (P3 operational) ────────────────────────────────────
export type RotationListener = (
  progress: RotationProgress,
  result: RotationResult | VaultError
) => void;

// ─── Vault API surface (D4 user-impact minimal) ─────────────────────────────
export interface SecretsVaultAPI {
  set<T>(key: string, value: T): Promise<VaultWriteOutcome>;
  get<T = unknown>(key: string): Promise<VaultReadResult<T> | VaultError>;
  delete(key: string): Promise<VaultWriteOutcome>;
  rotate(reason: RotationReason): Promise<RotationResult | VaultError>;
  onRotationProgress(listener: RotationListener): () => void;
  recoverFromWal(): Promise<{ recovered: number; failed: number }>;
}

// ─── Internal — not exported ────────────────────────────────────────────────
export interface WalRecord {
  readonly seq: number;
  readonly op: "set" | "delete" | "rotate";
  readonly key?: string;
  readonly shardId?: VaultShardId;
  readonly entryRef?: string;
  readonly timestamp: string;
  readonly checksum: string;
}

// ─── Constants (visible for tests) ──────────────────────────────────────────
export const VAULT_SHARD_IDS: readonly VaultShardId[] = [
  "shard-0",
  "shard-1",
  "shard-2"
] as const;

export const VAULT_QUORUM: number = 2; // 2-of-3
export const CIRCUIT_BREAKER_THRESHOLD: number = 3;
export const CIRCUIT_BREAKER_COOLDOWN_MS: number = 30_000;
export const FALLBACK_CACHE_TTL_MS: number = 5 * 60 * 1000;
export const PBKDF2_ITERATIONS: number = 600_000;
export const AES_KEY_BITS: 256 = 256;
export const AES_IV_BYTES: 12 = 12;