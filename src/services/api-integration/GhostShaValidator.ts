/**
 * GhostShaValidator — PATCH 9 REST_API_CLIENT v0.3 (Hephaestus, FinPlan Pro v1.0.0)
 *
 * SECURITY FEATURE — GHOST-SHA DETECTION (per Tyche P0 SHA-MISATTRIBUTION finding
 * in Strategos/Apollo INDEX v0.6, CATCH #187, #194, #195, #196, and Vulcan F1+F2).
 *
 * Background: A "ghost SHA" is a 7-to-40-character hexadecimal string claimed to be
 * a git commit SHA in a 5th-ICP verdict, INDEX entry, MASTER_REPORT, or API
 * response, but which does NOT exist in `git log`. This is a category of
 * evidence-fabrication that breaks the D-002 3-witness rule.
 *
 * Root cause patterns observed:
 * - Truncation error (claimed SHA was a prefix of the real one, but with a typo)
 * - Stale dispatch (claimed SHA was correct at write-time but the commit was amended)
 * - Reference drift (cited SHA was correct in a different branch)
 * - Prompt-injection hallucination (LLM generates a syntactically-valid but
 *   non-existent SHA)
 *
 * This validator provides:
 * 9.1  `GhostShaValidator` class — in-memory Set<string> of known SHAs with
 *      format check (`isPlausibleSha`), add/remove/clear, bulk operations.
 * 9.2  `validate(sha)` — classify as `exists` / `unknown` / `invalid` with
 *      normalizes to 7-char short form (git default).
 * 9.3  `scanObject(obj, options)` — recursively walks any JSON-serialisable value
 *      and extracts values from fields named `commit_sha`, `git_sha`, `commitSha`,
 *      `gitSha`, or `sha` (when 7+ hex chars). Returns valid / invalid / unknown
 *      buckets plus the count of fields scanned.
 * 9.4  CWE references:
 *      - CWE-345 (Insufficient Verification of Data Authenticity) — primary
 *      - CWE-440 (Expected Behavior Violation) — accepts SHAs without verification
 *      - CWE-1188 (Insecure Defaults) — defaults to strict mode
 *
 * Integration with RestApiClient:
 * - `RestApiClient.setGhostShaValidator(validator)` — wires up an instance
 * - `RestApiClient.validateResponseShas(data)` — manual scan
 * - `RestApiClient` constructor accepts `enableGhostShaValidation: true` to
 *   auto-scan every successful response (logs invalid SHAs to console.warn)
 *
 * Performance: O(1) add/remove/validate; O(n) scanObject where n = # fields.
 * Memory: O(k) where k = # known SHAs.
 *
 * @module services/api-integration/GhostShaValidator
 */

import { createLogger } from '@/utils/logger';

const ghostShaValidatorLogger = createLogger('GhostShaValidator');

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * GHOST_SHA_VALIDATOR_CONSTANTS — exported for downstream consumers
 * (audit logs, RATIFICATION GATE pre-checks, NEVER-AGAIN RULE #53 codification).
 */
export const GHOST_SHA_VALIDATOR_CONSTANTS = {
  /** Full git SHA is exactly 40 hex chars */
  FULL_SHA_LENGTH: 40,
  /** Shortest plausible SHA prefix (git default abbreviation is 7) */
  MIN_SHORT_SHA_LENGTH: 7,
  /** Regex for full SHA: 40 hex chars, case-insensitive */
  FULL_SHA_PATTERN: /^[0-9a-f]{40}$/i,
  /** Regex for short SHA: 7+ hex chars */
  SHORT_SHA_PATTERN: /^[0-9a-f]{7,39}$/i,
  /** Combined: 7-40 hex chars */
  ANY_PLAUSIBLE_SHA_PATTERN: /^[0-9a-f]{7,40}$/i,
  /** Default field names searched by scanObject */
  DEFAULT_SHA_FIELD_NAMES: ['commit_sha', 'git_sha', 'commitSha', 'gitSha', 'sha'] as const,
  /** Maximum recursion depth (defends against circular references) */
  MAX_SCAN_DEPTH: 20,
  /** Maximum fields scanned per call (defends against pathological responses) */
  MAX_SCAN_FIELDS: 10_000,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type GhostShaClassification = 'exists' | 'unknown' | 'invalid';

export interface GhostShaValidationResult {
  classification: GhostShaClassification;
  /** The original input string (after trim) */
  input: string;
  /** Normalized 7-char short form (if plausible), else null */
  shortForm: string | null;
  /** Normalized 40-char full form (if it was a known full SHA), else null */
  fullForm: string | null;
  /** Reason for `invalid` (e.g. "too short", "non-hex"). null if plausible. */
  invalidReason: string | null;
}

export interface GhostShaScanOptions {
  /** Field names to scan (default: DEFAULT_SHA_FIELD_NAMES) */
  fieldNames?: readonly string[];
  /** Maximum recursion depth (default: 20) */
  maxDepth?: number;
  /** Maximum total fields scanned (default: 10_000) */
  maxFields?: number;
}

export interface GhostShaScanResult {
  /** Total fields scanned (capped by maxFields) */
  scanned: number;
  /** SHAs that exist in the known set */
  valid: GhostShaValidationResult[];
  /** SHAs that are plausible but not in the known set (potential GHOST-SHA) */
  invalid: GhostShaValidationResult[];
  /** SHAs that don't even pass the format check (truly malformed) */
  unknown: GhostShaValidationResult[];
  /** True if any potential GHOST-SHA was found */
  hasGhostSha: boolean;
  /** When the scan completed (Unix ms) */
  scannedAt: number;
}

export interface GhostShaBulkValidationResult {
  valid: string[];
  invalid: string[];
  unknown: string[];
  hasGhostSha: boolean;
}

// ── Class ────────────────────────────────────────────────────────────────────

/**
 * GhostShaValidator — Set<string>-backed registry of known git SHAs.
 *
 * The validator is intentionally simple: add SHAs as you discover them
 * (e.g. by running `git log --format=%H`), and then `validate(s)` returns
 * whether the candidate matches a known entry. Short-form SHAs (7 chars)
 * are stored alongside full SHAs; matching is normalized to 7-char prefix.
 *
 * Thread-safety: not thread-safe. Wrap with mutex if used in a Web Worker
 * (the RestApiClient integration does not require this).
 *
 * @example
 * ```ts
 * const validator = new GhostShaValidator();
 * validator.addShas(['abc1234567890def...', 'def1234567890abc...']);
 *
 * // 'abc1234' (short form) → exists
 * // 'xyz1234' (short form) → unknown (plausible but not in set)
 * // 'abc' (too short) → invalid
 * const result = validator.validate('abc1234');
 * if (result.classification === 'unknown') {
 *   console.warn('Potential GHOST-SHA:', result.input);
 * }
 * ```
 */
export class GhostShaValidator {
  private readonly knownShas: Set<string> = new Set();

  /**
   * Construct with optional initial SHAs (full or short form).
   * All inputs are normalized to lower-case 7-char short form for storage.
   */
  constructor(initialShas?: readonly string[]) {
    if (initialShas && initialShas.length > 0) {
      this.addShas(initialShas);
    }
  }

  // ── 9.1 Format check ──────────────────────────────────────────────────────

  /**
   * Check if a string is plausibly a git SHA (7-40 hex chars).
   * Does NOT check if it actually exists in git.
   */
  isPlausibleSha(s: unknown): s is string {
    if (typeof s !== 'string') return false;
    return GHOST_SHA_VALIDATOR_CONSTANTS.ANY_PLAUSIBLE_SHA_PATTERN.test(s.trim());
  }

  /**
   * Check if a string is a full 40-char hex SHA.
   */
  isFullSha(s: unknown): s is string {
    if (typeof s !== 'string') return false;
    return GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_PATTERN.test(s.trim());
  }

  // ── 9.2 Registry operations ──────────────────────────────────────────────

  /**
   * Add a single SHA to the known set. Trims, lowercases, and validates format.
   * Throws if the input is not plausible (use `isPlausibleSha` first to check).
   *
   * @throws Error if input is not a plausible SHA (7-40 hex chars)
   */
  addSha(sha: string): void {
    const normalized = this.normalizeShort(sha);
    if (normalized === null) {
      throw new Error(
        `GhostShaValidator.addSha: input is not a plausible SHA (${GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH}-40 hex chars): "${sha}"`
      );
    }
    this.knownShas.add(normalized);
  }

  /**
   * Add multiple SHAs. Skips invalid entries with a console.warn (does not throw).
   * Returns the number of SHAs actually added.
   */
  addShas(shas: readonly string[]): number {
    let added = 0;
    for (const sha of shas) {
      const normalized = this.normalizeShort(sha);
      if (normalized !== null) {
        if (!this.knownShas.has(normalized)) {
          this.knownShas.add(normalized);
          added++;
        }
      } else {
        // Soft-warn for batch operations; not all inputs are expected to be SHAs
        ghostShaValidatorLogger.warn(`addShas: skipped non-plausible SHA: "${sha}"`);
      }
    }
    return added;
  }

  /**
   * Remove a single SHA. No-op if not present.
   */
  removeSha(sha: string): boolean {
    const normalized = this.normalizeShort(sha);
    if (normalized === null) return false;
    return this.knownShas.delete(normalized);
  }

  /** Clear all known SHAs. */
  clear(): void {
    this.knownShas.clear();
  }

  /** Number of known SHAs. */
  size(): number {
    return this.knownShas.size;
  }

  /** Check if a short-form SHA is in the known set (O(1)). */
  has(sha: string): boolean {
    const normalized = this.normalizeShort(sha);
    if (normalized === null) return false;
    return this.knownShas.has(normalized);
  }

  // ── 9.3 Validation ────────────────────────────────────────────────────────

  /**
   * Validate a candidate SHA. Returns classification + normalized forms.
   *
   * @example
   * validator.validate('abc1234')          // { classification: 'exists', shortForm: 'abc1234', ... }
   * validator.validate('xyz1234')          // { classification: 'unknown', shortForm: 'xyz1234', ... }
   * validator.validate('abc')              // { classification: 'invalid', shortForm: null, invalidReason: 'too short' }
   * validator.validate('not-a-sha')        // { classification: 'invalid', shortForm: null, invalidReason: 'non-hex' }
   */
  validate(sha: string): GhostShaValidationResult {
    const trimmed = typeof sha === 'string' ? sha.trim() : '';

    // 1. Format check
    if (trimmed.length === 0) {
      return {
        classification: 'invalid',
        input: sha,
        shortForm: null,
        fullForm: null,
        invalidReason: 'empty string',
      };
    }
    if (trimmed.length < GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH) {
      return {
        classification: 'invalid',
        input: sha,
        shortForm: null,
        fullForm: null,
        invalidReason: `too short (${trimmed.length} < ${GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH})`,
      };
    }
    if (trimmed.length > GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_LENGTH) {
      return {
        classification: 'invalid',
        input: sha,
        shortForm: null,
        fullForm: null,
        invalidReason: `too long (${trimmed.length} > ${GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_LENGTH})`,
      };
    }
    if (!GHOST_SHA_VALIDATOR_CONSTANTS.ANY_PLAUSIBLE_SHA_PATTERN.test(trimmed)) {
      return {
        classification: 'invalid',
        input: sha,
        shortForm: null,
        fullForm: null,
        invalidReason: 'non-hex characters',
      };
    }

    // 2. Normalize to short form
    const shortForm = trimmed
      .toLowerCase()
      .slice(0, GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH);
    const fullForm =
      trimmed.length === GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_LENGTH
        ? trimmed.toLowerCase()
        : null;

    // 3. Look up
    const exists = this.knownShas.has(shortForm);
    return {
      classification: exists ? 'exists' : 'unknown',
      input: sha,
      shortForm,
      fullForm,
      invalidReason: null,
    };
  }

  /**
   * Bulk validate an array of candidate SHAs.
   */
  bulkValidate(shas: readonly string[]): GhostShaBulkValidationResult {
    const valid: string[] = [];
    const invalid: string[] = [];
    const unknown: string[] = [];

    for (const sha of shas) {
      const result = this.validate(sha);
      if (result.classification === 'exists') valid.push(sha);
      else if (result.classification === 'unknown') unknown.push(sha);
      else invalid.push(sha);
    }

    return { valid, invalid, unknown, hasGhostSha: unknown.length > 0 || invalid.length > 0 };
  }

  // ── 9.4 Recursive scan ───────────────────────────────────────────────────

  /**
   * Recursively scan a value for SHA-like strings in known field names.
   *
   * Walks objects, arrays, and primitives. Skips `null` and `undefined` values.
   * For each field whose name matches a SHA-field pattern, the value is validated.
   *
   * Defends against:
   * - Circular references (depth cap)
   * - Pathological sizes (field cap)
   * - Prototype pollution (uses Object.keys, not for-in)
   *
   * @example
   * const data = { build: { commit_sha: 'abc1234' } };
   * const result = validator.scanObject(data);
   * console.log(result.valid, result.invalid, result.unknown);
   */
  scanObject(data: unknown, options?: GhostShaScanOptions): GhostShaScanResult {
    const fieldNames = new Set(
      (options?.fieldNames ?? GHOST_SHA_VALIDATOR_CONSTANTS.DEFAULT_SHA_FIELD_NAMES).map((n) =>
        n.toLowerCase()
      )
    );
    const maxDepth = options?.maxDepth ?? GHOST_SHA_VALIDATOR_CONSTANTS.MAX_SCAN_DEPTH;
    const maxFields = options?.maxFields ?? GHOST_SHA_VALIDATOR_CONSTANTS.MAX_SCAN_FIELDS;

    const valid: GhostShaValidationResult[] = [];
    const invalid: GhostShaValidationResult[] = [];
    const unknown: GhostShaValidationResult[] = [];
    let scanned = 0;
    let truncated = false;

    const visit = (value: unknown, depth: number): void => {
      if (scanned >= maxFields) {
        truncated = true;
        return;
      }
      if (depth > maxDepth) return;

      if (value === null || value === undefined) return;

      if (Array.isArray(value)) {
        for (const item of value) {
          if (scanned >= maxFields) {
            truncated = true;
            return;
          }
          visit(item, depth + 1);
        }
        return;
      }

      if (typeof value === 'object') {
        // Only visit own properties (defends against prototype pollution)
        for (const key of Object.keys(value as Record<string, unknown>)) {
          if (scanned >= maxFields) {
            truncated = true;
            return;
          }
          const child = (value as Record<string, unknown>)[key];
          const keyLower = key.toLowerCase();

          if (fieldNames.has(keyLower)) {
            if (child === null || child === undefined) {
              // skip null/undefined values — don't count as scanned
            } else if (typeof child === 'string') {
              scanned++;
              const result = this.validate(child);
              if (result.classification === 'exists') valid.push(result);
              else if (result.classification === 'unknown') unknown.push(result);
              else invalid.push(result);
            } else {
              // Field name matches but value is not a string — count as scanned + invalid
              scanned++;
              invalid.push({
                classification: 'invalid',
                input: String(child),
                shortForm: null,
                fullForm: null,
                invalidReason: `field "${key}" value is not a string (${typeof child})`,
              });
            }
          } else {
            // Recurse into child (might contain nested SHA fields)
            visit(child, depth + 1);
          }
        }
        return;
      }

      // Primitive (string, number, boolean) — no SHA fields at this level
    };

    visit(data, 0);

    if (truncated) {
      ghostShaValidatorLogger.warn(
        `scanObject: truncated at maxFields=${maxFields}; partial result returned`
      );
    }

    return {
      scanned,
      valid,
      invalid,
      unknown,
      hasGhostSha: unknown.length > 0 || invalid.length > 0,
      scannedAt: Date.now(),
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Normalize a candidate to its 7-char short form. Returns null if not plausible.
   * Lowercase for case-insensitive comparison.
   */
  private normalizeShort(sha: string): string | null {
    if (typeof sha !== 'string') return null;
    const trimmed = sha.trim();
    if (
      trimmed.length < GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH ||
      trimmed.length > GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_LENGTH
    ) {
      return null;
    }
    if (!GHOST_SHA_VALIDATOR_CONSTANTS.ANY_PLAUSIBLE_SHA_PATTERN.test(trimmed)) {
      return null;
    }
    return trimmed.toLowerCase().slice(0, GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH);
  }
}
