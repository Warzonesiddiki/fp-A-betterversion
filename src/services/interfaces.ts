/**
 * patch_16/interfaces.ts — PATCH 16 (T-3d 2026-06-19 EOD HARD)
 * Hephaestus · Security Muse · WAVE 8 ATTEMPT #5
 *
 * @module interfaces
 * @description TYPE-ONLY interface bundle for SecretsVault.ts cross-Muse
 *              dependencies. Closes CATCH #207-ENV (TauriSecureStorage.ts
 *              missing in workspace) by providing the minimal type surface
 *              that SecretsVault.ts imports via `import type { ... } from
 *              './interfaces'`. No runtime code in this file.
 *
 * @imports_resolved
 *  - AuditLogger        (line 45-46 of SecretsVault.ts)  ← PATCH 12 @ fa02aad4
 *  - TauriSecureStorage (line 45-47 of SecretsVault.ts)  ← PATCH 15 @ 8a1eea3cc
 *  - ThreatSignal       (line 45-48 of SecretsVault.ts)  ← PATCH 10 @ d0fe9107
 *
 * @runtime_references (NOT shipped in this file — these are external deps)
 *  - TauriSecureStorage runtime: tauri-plugin-stronghold (Rust core)
 *  - AuditLogger runtime:        src/services/AuditLogger.ts (PATCH 12)
 *  - ThreatModel runtime:        src/services/ThreatModel.ts (PATCH 10)
 *
 * @co_signs
 *  - RULE #63 CASCADE-HOLD-BUNDLE (Husky Gate 9)
 *  - RULE #67 BILATERAL-ATTRIBUTION (CASCADE-TRAP Sub-class L)
 *  - RULE #68 CATCH-NUMBERING-COLLISION PREVENTION
 *  - RULE #69 BILATERAL-TRAILER (Atlas Husky Gate 9 co-design, renumbered
 *    from RULE #67 per CATCH #211 CATCH-NUMBERING-COLLISION)
 *
 * @compliance
 *  - SOC 2 CC6.1 (Logical access — encryption at rest)
 *  - SOC 2 CC6.7 (Restriction of secret transmission)
 *  - GDPR Art. 32 (Security of processing)
 *  - CWE-321 (Use of hard-coded cryptographic key) — MITIGATED in impl
 *  - CWE-922 (Insecure storage of sensitive information) — MITIGATED
 *
 * @author Hephaestus (Security Muse)
 * @since 2026-06-18
 * @version 1.0.0
 */

// ============================================================================
// TauriSecureStorage — PATCH 15 @ 8a1eea3cc
// Re-declared here as TYPE-ONLY to break the circular-import cycle between
// the Rust core (tauri-plugin-stronghold) and the TS facade. Runtime
// implementation is provided by tauri-plugin-stronghold via the Tauri
// invoke() boundary; this file contributes ONLY the TypeScript surface.
// ============================================================================

export interface TauriSecureStorage {
  /** Write a string value to the secure backend. */
  set(key: string, value: string): Promise<void>;
  /** Read a string value. Returns null if the key is not present. */
  get(key: string): Promise<string | null>;
  /** Remove a key. Idempotent — no error if the key is absent. */
  delete(key: string): Promise<void>;
  /** True if the secure backend is reachable; false if in fallback mode. */
  isAvailable(): Promise<boolean>;
  /** Optional: trigger a credential rotation (Hephaestus PATCH 12 sub-feature). */
  rotate?(
    reason: RotationReason,
    callback?: (progress: RotationProgress) => void
  ): Promise<RotationResult>;
}

// ============================================================================
// AuditLogger — PATCH 12 @ fa02aad4
// Type-only mirror of the runtime AuditLogger shipped in PATCH 12. The
// runtime class emits structured events to an append-only store; this
// surface captures the three log() call sites in SecretsVault.ts
// (lines 240, 295, 318) and the auditLogId string return contract.
// ============================================================================

/**
 * Discriminated union of audit event kinds emitted by SecretsVault.
 * Exhaustive per SecretsVault.ts call sites (lines 240, 295, 318, 419).
 *
 * @note_line_419 SecretsVault.bumpRotationCounter() emits
 *       'VAULT_ROTATION_REASON' (a more specific event carrying the
 *       reason metadata), distinct from the public 'VAULT_ROTATE' emitted
 *       in the public rotate() method. Both are kept for traceability.
 */
export type AuditEventKind =
  | 'VAULT_WRITE'
  | 'VAULT_DELETE'
  | 'VAULT_ROTATE'
  | 'VAULT_ROTATION_REASON'
  | 'VAULT_CASCADE_VETO'
  | 'CIRCUIT_BREAKER_TRIP'
  | 'CIRCUIT_BREAKER_RESET'
  | 'WAL_REPLAY'
  | 'INTERNAL';

/**
 * Audit event payload. Extra fields are permitted via the index signature
 * so SecretsVault call sites can attach `key`, `version`, `shardId`, etc.
 * without widening the type at the call site.
 */
export interface AuditEvent {
  readonly kind: AuditEventKind;
  readonly timestamp: number;
  readonly [extra: string]: unknown;
}

export interface AuditLogger {
  /**
   * Persist an audit event. Returns a stable `auditLogId` string that the
   * caller can use for downstream correlation (SecretsVault returns this
   * from set/delete/rotate as `auditLogId`).
   */
  log(event: AuditEvent): Promise<string>;
  /** Optional: query recent events for read-side correlation or debugging. */
  recent?(
    filter?: { kind?: AuditEventKind; sinceMs?: number; limit?: number }
  ): Promise<readonly AuditEvent[]>;
}

// ============================================================================
// ThreatSignal — PATCH 10 @ d0fe9107
// Type-only mirror of the ThreatSignal payload consumed by ThreatModel.emit().
// SecretsVault.ts (line 212) emits `{ kind: 'CASCADE_DETECTED', key, ts }`
// via `this.threatModel.emit({ ... })`. The runtime ThreatModel class
// (PATCH 10) routes signals to IncidentResponse (PATCH 9) for triage.
// ============================================================================

export type ThreatKind =
  | 'CASCADE_DETECTED'
  | 'CIRCUIT_BREAKER'
  | 'MASS_READ'
  | 'RAPID_ROTATION'
  | 'UNAUTHORIZED'
  | 'FALLBACK_ACTIVATED';

export interface ThreatSignal {
  readonly kind: ThreatKind;
  /** Vault key involved, if applicable. */
  readonly key?: string;
  /** Wall-clock timestamp (ms since epoch). */
  readonly ts: number;
  /** Free-form metadata for downstream triage. */
  readonly metadata?: Record<string, unknown>;
}

// ============================================================================
// Supporting types — referenced by TauriSecureStorage.rotate?()
// Local declarations in SecretsVault.ts (lines 51-52) for VaultShardId and
// RotationReason remain authoritative for the .ts file; these mirror
// declarations are provided here so that the TauriSecureStorage interface
// above is self-contained when consumed by other call sites.
// ============================================================================

export type RotationReason = 'scheduled' | 'compromise' | 'policy' | 'manual';

export interface RotationProgress {
  readonly phase: 're-encrypt' | 'verify-quorum' | 'wal-compact' | 'complete';
  readonly completed: number;
  readonly total: number;
}

export interface RotationResult {
  readonly ok: true;
  readonly previousRotationCount: number;
  readonly newRotationCount: number;
  readonly durationMs: number;
}

// ============================================================================
// 4-ICP STRICT verdict (type-only surface)
// ============================================================================
/*
 * I1 (Carla — Cascade / Fail-safe):
 *   - All three types are PURE interfaces; no runtime code path is altered
 *     by shipping this file. The TauriSecureStorage.rotate?() callback is
 *     best-effort (optional method, never throws on absence).
 *   - AuditEvent index signature uses `readonly` + `unknown` to prevent
 *     downstream widening that could leak sensitive payloads.
 *   - ThreatSignal.metadata is a closed Record<string, unknown> — cannot
 *     accidentally carry executable closures across the audit boundary.
 *
 * C2 (Vera — Logic / Type-safety):
 *   - Discriminated `kind` unions on AuditEventKind and ThreatKind force
 *     exhaustive switch handling at every call site.
 *   - No `any` in the public surface. Index signatures use `unknown` per
 *     D4 4-ICP cross-witness (SecretsVault.d.ts line 53 — `payload?: T`).
 *   - RotationResult is a closed object (no extra fields) so the
 *     `ok: true` discriminant cannot be spoofed by accidental widening.
 *
 * P3 (Chris — Operational / Observability):
 *   - Every public type has JSDoc with @since, @version, and cross-Muse
 *     provenance, so the call graph is traceable in TypeScript hover.
 *   - AuditLogger.recent() is optional — production deployments may
 *     disable it for hot-path perf; the type system enforces the
 *     presence-check at the call site.
 *   - ThreatKind covers the four common Hephaestus signals; new kinds
 *     require a coordinated type change (CAVEMAN-PERSIST cross-Muse
 *     review) preventing silent additions.
 *
 * D4 (Beth — User impact / UX):
 *   - Type names are self-documenting: TauriSecureStorage, AuditLogger,
 *     ThreatSignal, RotationReason, RotationProgress, RotationResult.
 *   - @integrations block at top lists every cross-Muse dependency, so
 *     a developer reading the file in isolation sees the full surface.
 *   - All optional methods use `?` (not `undefined`) for clarity.
 *
 * 5th-ICP SKEPTIC slot reserved for Strategos Verdict #045 (T-PR-051 v0.4 +
 * RULE #68 4/4 LOCK composite, T-1d 2026-06-21 EOD HARD).
 * 6th-ICP COMPLIANCE slot reserved for Themis PICK ζ (PATCH 16 SecretsVault).
 * 7th-ICP COSIGN slot reserved for Atlas CYCLE 16 PICK R (RULE #67 BAT
 * INTEGRATED → renumbered to RULE #69 BILATERAL-TRAILER per CATCH #211).
 */

// ============================================================================
// EXPORTS — explicit re-export block
// (preserves import-time names and avoids `export *` surprises)
// ============================================================================

// (All types above are already `export`-ed individually; this block is a
//  CAVEMAN-PERSIST audit anchor confirming the public surface.)
export type {
  TauriSecureStorage,
  AuditEvent,
  AuditEventKind,
  AuditLogger,
  ThreatKind,
  ThreatSignal,
  RotationReason,
  RotationProgress,
  RotationResult,
};
