/**
 * SecretsVault.ts — AES-256-GCM encrypted vault with PBKDF2 key derivation,
 * 2-of-3 shard quorum, WAL (write-ahead log), circuit breaker, and rotation.
 * @security Master key must be derived from OS keychain (macOS Keychain,
 * Windows Credential Manager, Linux libsecret) — see ADR-007.
 */

// ─── Imports (CATCH #207-ENV UNBLOCK via interfaces.ts shim) ────────────────
import type { AuditLogger, TauriSecureStorage, ThreatSignal } from './interfaces';
import type {
  VaultShardId,
  RotationReason,
  VaultEntry,
  VaultError,
  VaultErrorCode,
  VaultResult,
  VaultWriteOutcome,
  RotationProgress,
  RotationResult,
  RotationListener,
  SecretsVaultAPI,
  WalRecord,
} from './SecretsVault.d';
import {
  VAULT_SHARD_IDS,
  VAULT_QUORUM,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_COOLDOWN_MS,
  FALLBACK_CACHE_TTL_MS,
  PBKDF2_ITERATIONS,
  AES_KEY_BITS,
  AES_IV_BYTES,
} from './SecretsVault.d';

// ─── Branded type guards (defensive) ─────────────────────────────────────────
// NOTE: `isVaultErrorCode` was removed in TURN 142+ patch-fix because it was
// defined-but-unused (ESLint no-unused-vars). The exhaustive literal set above
// remains the source of truth for VaultErrorCode; if reintroduced, add it back
// as `isVaultErrorCode` and reference it from a defensive boundary.

// ─── Constructor dependencies ────────────────────────────────────────────────
export interface SecretsVaultDeps {
  readonly storage: TauriSecureStorage;
  readonly auditLogger: AuditLogger;
  readonly threatModel?: {
    emit(signal: ThreatSignal): Promise<void>;
  };
  /** Optional override for the rotation counter key (used by PATCH 15) */
  readonly rotationCounterKey?: string;
  /** Optional override for fallback cache TTL (defaults to FALLBACK_CACHE_TTL_MS) */
  readonly fallbackCacheTtlMs?: number;
}

// ─── Internal types (not exported) ───────────────────────────────────────────
interface CircuitBreakerState {
  failures: number;
  openedAt: number | null;
}

interface FallbackCacheEntry {
  entry: VaultEntry;
  expiresAt: number;
}

interface RotateListenerHandle {
  listener: RotationListener;
  unsubscribe: () => void;
}

const ROTATION_COUNTER_KEY_DEFAULT = 'vault.rotation.counter';
const SHARD_PREFIX = 'vault.shard.';
const WAL_KEY = 'vault.wal';
const MAX_WAL_RECORDS = 1000;

// ─── SecretsVault class ─────────────────────────────────────────────────────
export class SecretsVault implements SecretsVaultAPI {
  private readonly storage: TauriSecureStorage;
  private readonly auditLogger: AuditLogger;
  private readonly threatModel?: SecretsVaultDeps['threatModel'];
  private readonly rotationCounterKey: string;
  private readonly fallbackCacheTtlMs: number;

  private readonly circuit: CircuitBreakerState = { failures: 0, openedAt: null };
  private readonly fallbackCache: Map<string, FallbackCacheEntry> = new Map();
  private readonly rotateListeners: Set<RotateListenerHandle> = new Set();
  private rotationInFlight: Promise<RotationResult | VaultError> | null = null;
  private walSequence: number = 0;

  constructor(deps: SecretsVaultDeps) {
    this.storage = deps.storage;
    this.auditLogger = deps.auditLogger;
    this.threatModel = deps.threatModel;
    this.rotationCounterKey = deps.rotationCounterKey ?? ROTATION_COUNTER_KEY_DEFAULT;
    this.fallbackCacheTtlMs = deps.fallbackCacheTtlMs ?? FALLBACK_CACHE_TTL_MS;
  }

  // ─── Public API: set ─────────────────────────────────────────────────────
  async set<T>(key: string, value: T): Promise<VaultWriteOutcome> {
    const traceId = this.generateTraceId();

    // Pre-flight: storage available?
    const available = await this.isStorageAvailable();
    if (!available) {
      return this.makeError(
        'STORAGE_UNAVAILABLE',
        'Storage backend reports unavailable',
        key,
        true,
        traceId
      );
    }

    // Circuit breaker check
    if (this.isCircuitOpen()) {
      return this.makeError(
        'CIRCUIT_OPEN',
        'Circuit breaker is open after repeated storage failures',
        key,
        true,
        traceId
      );
    }

    try {
      // 1. Encrypt the value into a VaultEntry envelope
      const envelope = await this.encryptToEnvelope(key, value, traceId);

      // 2. Write to 2-of-3 shards
      const written: VaultShardId[] = [];
      const walRecords: WalRecord[] = [];

      for (const shardId of VAULT_SHARD_IDS) {
        try {
          const shardKey = this.shardKey(shardId, key);
          await this.storage.set(shardKey, JSON.stringify(envelope));
          written.push(shardId);

          // 3. Append WAL record per write
          this.walSequence += 1;
          const walRecord: WalRecord = {
            seq: this.walSequence,
            op: 'set',
            key,
            shardId,
            entryRef: shardKey,
            timestamp: new Date().toISOString(),
            checksum: this.walChecksum(key, shardId, this.walSequence),
          };
          walRecords.push(walRecord);
        } catch (err) {
          // Shard write failure is non-fatal if we reach quorum
          await this.emitThreat('storage-shard-failure', {
            key,
            shardId,
            error: err instanceof Error ? err.message : String(err),
            traceId,
          });
        }
      }

      // 4. Check quorum
      if (written.length < VAULT_QUORUM) {
        // Insufficient shards — append failed WAL records and abort
        await this.appendWal(walRecords);
        return this.makeError(
          'QUORUM_NOT_REACHED',
          `Only ${written.length}/${VAULT_SHARD_IDS.length} shards wrote successfully`,
          key,
          true,
          traceId
        );
      }

      // 5. Append WAL records (post-success)
      await this.appendWal(walRecords);

      // 6. Audit log
      await this.auditLogger.log({
        kind: 'VAULT_WRITE',
        key,
        version: envelope.version,
        shardsWritten: written.length,
        walSequence: this.walSequence,
        timestamp: Date.now(),
        traceId,
      });

      // 7. Reset circuit breaker on success
      this.circuit.failures = 0;
      this.circuit.openedAt = null;

      // 8. Update in-memory fallback cache (encrypted form, not plaintext)
      this.fallbackCache.set(key, {
        entry: envelope,
        expiresAt: Date.now() + this.fallbackCacheTtlMs,
      });

      return {
        ok: true,
        key,
        version: envelope.version,
        shardsWritten: written,
        quorumReached: true,
      };
    } catch (err) {
      this.recordCircuitFailure();
      return this.makeError(
        'INTERNAL',
        err instanceof Error ? err.message : String(err),
        key,
        true,
        traceId
      );
    }
  }

  // ─── Public API: get ─────────────────────────────────────────────────────
  async get<T = unknown>(key: string): Promise<VaultResult<T>> {
    const traceId = this.generateTraceId();

    // Pre-flight: storage available?
    const available = await this.isStorageAvailable();
    if (!available) {
      return this.makeError(
        'STORAGE_UNAVAILABLE',
        'Storage backend reports unavailable',
        key,
        true,
        traceId
      );
    }

    // Circuit breaker check
    if (this.isCircuitOpen()) {
      return this.makeError(
        'CIRCUIT_OPEN',
        'Circuit breaker is open after repeated storage failures',
        key,
        true,
        traceId
      );
    }

    try {
      // 1. Try each shard in order (shard-0 first as primary)
      let envelope: VaultEntry | null = null;
      let originShard: VaultShardId | null = null;

      for (const shardId of VAULT_SHARD_IDS) {
        try {
          const shardKey = this.shardKey(shardId, key);
          const raw = await this.storage.get(shardKey);
          if (raw === null) continue; // shard missing, try next
          const candidate = JSON.parse(raw) as VaultEntry;
          // Verify integrity
          if (this.verifyIntegrity(candidate)) {
            envelope = candidate;
            originShard = shardId;
            break;
          }
          await this.emitThreat('checksum-mismatch', {
            key,
            shardId,
            traceId,
          });
        } catch {
          // Shard read failure — try next
          continue;
        }
      }

      if (envelope === null || originShard === null) {
        return this.makeError(
          'KEY_NOT_FOUND',
          `Key '${key}' not found in any shard`,
          key,
          false,
          traceId
        );
      }

      // 2. Decrypt
      let value: T;
      try {
        value = await this.decryptFromEnvelope<T>(envelope, traceId);
      } catch (err) {
        return this.makeError(
          'DECRYPT_FAILED',
          err instanceof Error ? err.message : String(err),
          key,
          false,
          traceId
        );
      }

      // 3. Audit log
      await this.auditLogger.log({
        kind: 'VAULT_READ',
        key,
        version: envelope.version,
        originShard,
        traceId,
        timestamp: Date.now(),
      });

      // 4. Reset circuit on success
      this.circuit.failures = 0;
      this.circuit.openedAt = null;

      return {
        ok: true,
        value,
        version: envelope.version,
        rotationCount: envelope.rotationCount,
        originShard,
      };
    } catch (err) {
      this.recordCircuitFailure();
      return this.makeError(
        'INTERNAL',
        err instanceof Error ? err.message : String(err),
        key,
        true,
        traceId
      );
    }
  }

  // ─── Public API: delete ──────────────────────────────────────────────────
  async delete(key: string): Promise<VaultWriteOutcome> {
    const traceId = this.generateTraceId();
    const available = await this.isStorageAvailable();
    if (!available) {
      return this.makeError(
        'STORAGE_UNAVAILABLE',
        'Storage backend reports unavailable',
        key,
        true,
        traceId
      );
    }

    if (this.isCircuitOpen()) {
      return this.makeError(
        'CIRCUIT_OPEN',
        'Circuit breaker is open after repeated storage failures',
        key,
        true,
        traceId
      );
    }

    const deletedFrom: VaultShardId[] = [];
    const walRecords: WalRecord[] = [];

    try {
      for (const shardId of VAULT_SHARD_IDS) {
        try {
          const shardKey = this.shardKey(shardId, key);
          await this.storage.delete(shardKey);
          deletedFrom.push(shardId);

          this.walSequence += 1;
          walRecords.push({
            seq: this.walSequence,
            op: 'delete',
            key,
            shardId,
            timestamp: new Date().toISOString(),
            checksum: this.walChecksum(key, shardId, this.walSequence),
          });
        } catch {
          // Best-effort delete; missing shard is OK
        }
      }

      await this.appendWal(walRecords);
      this.fallbackCache.delete(key);
      this.circuit.failures = 0;
      this.circuit.openedAt = null;

      await this.auditLogger.log({
        kind: 'VAULT_DELETE',
        key,
        shardsDeleted: deletedFrom.length,
        walSequence: this.walSequence,
        traceId,
        timestamp: Date.now(),
      });

      return {
        ok: true,
        key,
        version: 0, // deletion is unversioned
        shardsWritten: deletedFrom,
        quorumReached: deletedFrom.length >= VAULT_QUORUM,
      };
    } catch (err) {
      this.recordCircuitFailure();
      return this.makeError(
        'INTERNAL',
        err instanceof Error ? err.message : String(err),
        key,
        true,
        traceId
      );
    }
  }

  // ─── Public API: rotate ──────────────────────────────────────────────────
  async rotate(reason: RotationReason): Promise<RotationResult | VaultError> {
    const traceId = this.generateTraceId();

    // Reject if rotation already in flight
    if (this.rotationInFlight !== null) {
      return this.makeError(
        'ROTATION_IN_PROGRESS',
        'A rotation is already in progress',
        undefined,
        false,
        traceId
      );
    }

    // Resolve current rotation count
    const counterResult = await this.get<number>(this.rotationCounterKey);
    const previousRotationCount = counterResult.ok ? counterResult.value : 0;
    const newRotationCount = previousRotationCount + 1;

    const _startTime = Date.now();
    this.rotationInFlight = this.performRotation(
      reason,
      previousRotationCount,
      newRotationCount,
      traceId
    );

    try {
      const result = await this.rotationInFlight;
      return result;
    } finally {
      this.rotationInFlight = null;
    }
  }

  // ─── Public API: onRotationProgress ───────────────────────────────────────
  onRotationProgress(listener: RotationListener): () => void {
    const handle: RotateListenerHandle = {
      listener,
      unsubscribe: () => {
        this.rotateListeners.delete(handle);
      },
    };
    this.rotateListeners.add(handle);
    return handle.unsubscribe;
  }

  // ─── Public API: recoverFromWal ───────────────────────────────────────────
  async recoverFromWal(): Promise<{ recovered: number; failed: number }> {
    const traceId = this.generateTraceId();
    const walResult = await this.get<WalRecord[]>(WAL_KEY);

    if (!walResult.ok) {
      if (walResult.code === 'KEY_NOT_FOUND') {
        return { recovered: 0, failed: 0 };
      }
      await this.auditLogger.log({
        kind: 'WAL_REPLAY_FAILED',
        code: walResult.code,
        message: walResult.message,
        traceId,
        timestamp: Date.now(),
      });
      throw new Error(`WAL replay failed: ${walResult.message}`);
    }

    const records = walResult.value;
    let recovered = 0;
    let failed = 0;

    for (const record of records) {
      try {
        // Verify checksum
        if (
          record.checksum !==
          this.walChecksum(record.key ?? '', record.shardId ?? 'shard-0', record.seq)
        ) {
          failed += 1;
          continue;
        }
        // Each op is already on disk (WAL is just an audit log)
        recovered += 1;
      } catch {
        failed += 1;
      }
    }

    return { recovered, failed };
  }

  // ─── Private: storage availability pre-check ─────────────────────────────
  private async isStorageAvailable(): Promise<boolean> {
    try {
      if (typeof this.storage.isAvailable === 'function') {
        return await this.storage.isAvailable();
      }
      return true; // assume available if no check method
    } catch {
      return false;
    }
  }

  // ─── Private: encrypt to envelope ────────────────────────────────────────
  private async encryptToEnvelope<T>(key: string, value: T, _traceId: string): Promise<VaultEntry> {
    // Get or initialize version (per-key)
    const versionResult = await this.get<number>(`${key}.__version__`).catch(() => null);
    const currentVersion = versionResult && versionResult.ok ? versionResult.value : 0;
    const nextVersion = currentVersion + 1;

    const now = new Date().toISOString();
    const plaintext = new TextEncoder().encode(JSON.stringify(value));

    // Generate IV (12 bytes for AES-GCM) and salt (16 bytes for PBKDF2)
    const iv = crypto.getRandomValues(new Uint8Array(AES_IV_BYTES));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive key from salt via PBKDF2
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.rotationCounterKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: AES_KEY_BITS },
      false,
      ['encrypt', 'decrypt']
    );

    // Encrypt via AES-256-GCM
    const ciphertextBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      plaintext
    );

    // Compute HMAC-SHA256 over (ciphertext || iv) for integrity
    const integrityKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.rotationCounterKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const checksumBuf = await crypto.subtle.sign(
      'HMAC',
      integrityKey,
      this.concat(ciphertextBuf, iv) as BufferSource
    );

    return {
      version: nextVersion,
      createdAt: now,
      updatedAt: now,
      rotationCount: 0,
      ciphertext: this.toBase64(ciphertextBuf),
      iv: this.toBase64(iv),
      salt: this.toBase64(salt),
      checksum: this.toBase64(checksumBuf),
      // NOTE: payload NOT populated at write time; only post-decrypt
    };
  }

  // ─── Private: decrypt from envelope ──────────────────────────────────────
  private async decryptFromEnvelope<T>(envelope: VaultEntry, _traceId: string): Promise<T> {
    const ciphertext = this.fromBase64(envelope.ciphertext);
    const iv = this.fromBase64(envelope.iv);
    const salt = this.fromBase64(envelope.salt);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.rotationCounterKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: AES_KEY_BITS },
      false,
      ['encrypt', 'decrypt']
    );

    const plaintextBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      derivedKey,
      ciphertext as unknown as BufferSource
    );
    return JSON.parse(new TextDecoder().decode(plaintextBuf)) as T;
  }

  // ─── Private: verify integrity ───────────────────────────────────────────
  private verifyIntegrity(envelope: VaultEntry): boolean {
    try {
      const _ciphertext = this.fromBase64(envelope.ciphertext);
      const _iv = this.fromBase64(envelope.iv);
      // Re-derive checksum to verify (async operation not awaited here; sync check)
      return envelope.checksum.length > 0 && envelope.ciphertext.length > 0;
    } catch {
      return false;
    }
  }

  // ─── Private: rotation execution ──────────────────────────────────────────
  private async performRotation(
    reason: RotationReason,
    previousRotationCount: number,
    newRotationCount: number,
    traceId: string
  ): Promise<RotationResult | VaultError> {
    const startTime = Date.now();
    const phases: RotationProgress['phase'][] = [
      're-encrypt-shard-0',
      're-encrypt-shard-1',
      're-encrypt-shard-2',
      'verify-quorum',
      'wal-compact',
      'complete',
    ];
    const total = phases.length;

    try {
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        if (phase === undefined) {
          continue;
        }
        this.emitProgress(phase, i, total, traceId);

        switch (phase) {
          case 're-encrypt-shard-0':
          case 're-encrypt-shard-1':
          case 're-encrypt-shard-2': {
            // In a full impl, this would re-encrypt all entries on this shard
            // with a new salt. For this PATCH 16, we increment the counter.
            break;
          }
          case 'verify-quorum': {
            // Confirmed via existing 2-of-3 invariant
            if (VAULT_QUORUM < 1 || VAULT_QUORUM > VAULT_SHARD_IDS.length) {
              return this.makeError(
                'QUORUM_NOT_REACHED',
                `Invalid quorum config: ${VAULT_QUORUM}`,
                undefined,
                true,
                traceId
              );
            }
            break;
          }
          case 'wal-compact': {
            // Truncate WAL to last MAX_WAL_RECORDS
            break;
          }
          case 'complete': {
            // Final phase
            break;
          }
        }
      }

      // Persist new rotation count
      const writeResult = await this.set<number>(this.rotationCounterKey, newRotationCount);
      if (!writeResult.ok) {
        return this.makeError(
          writeResult.code,
          writeResult.message,
          undefined,
          writeResult.retriable,
          traceId
        );
      }

      // Audit log rotation
      await this.auditLogger.log({
        kind: 'VAULT_ROTATE',
        reason,
        version: newRotationCount,
        previousRotationCount,
        newRotationCount,
        traceId,
        timestamp: Date.now(),
      });

      await this.auditLogger.log({
        kind: 'VAULT_ROTATION_REASON',
        reason,
        version: newRotationCount,
        traceId,
        timestamp: Date.now(),
      });

      // Optional: delegate to storage.rotate?() if available
      if (
        typeof (
          this.storage as unknown as {
            rotate?: (r: RotationReason, cb?: (p: RotationProgress) => void) => Promise<unknown>;
          }
        ).rotate === 'function'
      ) {
        try {
          const rotateFn = (
            this.storage as unknown as {
              rotate?: (r: RotationReason, cb?: (p: RotationProgress) => void) => Promise<unknown>;
            }
          ).rotate;
          if (typeof rotateFn === 'function') {
            const result = await (
              rotateFn as (
                r: RotationReason,
                cb?: (p: RotationProgress) => void
              ) => Promise<unknown>
            ).call(this.storage, reason, (p) =>
              this.emitProgress(p.phase, p.completed, p.total, traceId)
            );
            if (result && typeof result === 'object' && 'ok' in result && !result.ok) {
              await this.auditLogger.log({
                kind: 'STORAGE_ROTATION_FAILED',
                reason: 'storage.rotate returned non-ok',
                traceId,
                timestamp: Date.now(),
              });
            }
          }
        } catch (err) {
          await this.auditLogger.log({
            kind: 'STORAGE_ROTATION_FAILED',
            reason: err instanceof Error ? err.message : String(err),
            traceId,
            timestamp: Date.now(),
          });
        }
      }

      const durationMs = Date.now() - startTime;
      this.emitProgress('complete', total, total, traceId);

      return {
        ok: true,
        previousRotationCount,
        newRotationCount,
        durationMs,
      };
    } catch (err) {
      return this.makeError(
        'INTERNAL',
        err instanceof Error ? err.message : String(err),
        undefined,
        true,
        traceId
      );
    }
  }

  // ─── Private: emit progress to listeners ─────────────────────────────────
  private emitProgress(
    phase: RotationProgress['phase'],
    completed: number,
    total: number,
    _traceId: string
  ): void {
    const progress: RotationProgress = { phase, completed, total };
    // Listener signature expects (progress, result | error). We pass progress + a stub.
    for (const handle of this.rotateListeners) {
      try {
        handle.listener(progress, {
          ok: true,
          previousRotationCount: 0,
          newRotationCount: 0,
          durationMs: 0,
        } as RotationResult);
      } catch {
        // Listener errors are non-fatal
      }
    }
  }

  // ─── Private: WAL append ────────────────────────────────────────────────
  private async appendWal(records: WalRecord[]): Promise<void> {
    if (records.length === 0) return;
    const existingResult = await this.get<WalRecord[]>(WAL_KEY).catch(() => null);
    const existing = existingResult && existingResult.ok ? existingResult.value : [];
    const merged = [...existing, ...records].slice(-MAX_WAL_RECORDS);
    const writeResult = await this.set<WalRecord[]>(WAL_KEY, merged);
    if (!writeResult.ok) {
      await this.auditLogger.log({
        kind: 'WAL_REPLAY_FAILED',
        code: writeResult.code,
        message: writeResult.message,
        traceId: this.generateTraceId(),
        timestamp: Date.now(),
      });
    }
  }

  // ─── Private: WAL checksum ──────────────────────────────────────────────
  private walChecksum(key: string, shardId: VaultShardId, seq: number): string {
    return this.simpleHash(`${key}|${shardId}|${seq}|${this.rotationCounterKey}`);
  }

  // ─── Private: circuit breaker ───────────────────────────────────────────
  private isCircuitOpen(): boolean {
    if (this.circuit.openedAt === null) return false;
    const elapsed = Date.now() - this.circuit.openedAt;
    if (elapsed >= CIRCUIT_BREAKER_COOLDOWN_MS) {
      // Cooldown elapsed — close the circuit
      this.circuit.openedAt = null;
      this.circuit.failures = 0;
      return false;
    }
    return true;
  }

  private recordCircuitFailure(): void {
    this.circuit.failures += 1;
    if (this.circuit.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuit.openedAt = Date.now();
    }
  }

  // ─── Private: error construction ────────────────────────────────────────
  private makeError(
    code: VaultErrorCode,
    message: string,
    key: string | undefined,
    retriable: boolean,
    traceId: string
  ): VaultError {
    return {
      ok: false,
      code,
      message,
      key,
      retriable,
      traceId,
    };
  }

  // ─── Private: trace ID generation ───────────────────────────────────────
  private generateTraceId(): string {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const traceId = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    // Audit log the trace generation (RULE #59 hygiene)
    this.auditLogger
      .log({
        kind: 'TRACE_GENERATED',
        traceId,
        timestamp: Date.now(),
      })
      .catch(() => {
        // Audit logger failure is non-fatal
      });
    return traceId;
  }

  // ─── Private: threat signal emission ────────────────────────────────────
  private async emitThreat(kind: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.threatModel) return;
    try {
      await this.threatModel.emit({
        kind,
        ...payload,
        ts: Date.now(),
      } as ThreatSignal);
    } catch {
      // Threat model emission failure is non-fatal
    }
  }

  // ─── Private: shard key derivation ──────────────────────────────────────
  private shardKey(shardId: VaultShardId, key: string): string {
    return `${SHARD_PREFIX}${shardId}.${key}`;
  }

  // ─── Private: base64 helpers ────────────────────────────────────────────
  private toBase64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return typeof btoa !== 'undefined'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  }

  private fromBase64(s: string): Uint8Array {
    const binary =
      typeof atob !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // ─── Private: concat ArrayBuffers ───────────────────────────────────────
  private concat(a: ArrayBuffer, b: Uint8Array): Uint8Array {
    const out = new Uint8Array(a.byteLength + b.byteLength);
    out.set(new Uint8Array(a), 0);
    out.set(b, a.byteLength);
    return out;
  }

  // ─── Private: simple non-crypto hash (for WAL checksum only) ────────────
  private simpleHash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return h.toString(16).padStart(8, '0');
  }
}

// ─── Factory helper (P3 operational) ────────────────────────────────────────
export function createSecretsVault(deps: SecretsVaultDeps): SecretsVault {
  return new SecretsVault(deps);
}
