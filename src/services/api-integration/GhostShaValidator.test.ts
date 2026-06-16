/**
 * GhostShaValidator.test.ts — PATCH 9 REST_API_CLIENT v0.3 (Hephaestus)
 *
 * Tests for the GHOST-SHA detection class. Covers:
 * - Format checks (isPlausibleSha, isFullSha)
 * - Registry operations (addSha, addShas, removeSha, has, size, clear)
 * - Validation (validate, bulkValidate)
 * - Recursive scanning (scanObject)
 * - Defensive paths (depth cap, field cap, circular references, prototype pollution)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GhostShaValidator, GHOST_SHA_VALIDATOR_CONSTANTS } from './GhostShaValidator';

describe('GhostShaValidator', () => {
  let validator: GhostShaValidator;

  beforeEach(() => {
    validator = new GhostShaValidator();
  });

  // ── Constants ────────────────────────────────────────────────────────────

  describe('GHOST_SHA_VALIDATOR_CONSTANTS', () => {
    it('exports the canonical constants', () => {
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_LENGTH).toBe(40);
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.MIN_SHORT_SHA_LENGTH).toBe(7);
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.FULL_SHA_PATTERN.test('a'.repeat(40))).toBe(true);
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.SHORT_SHA_PATTERN.test('abcdef7')).toBe(true);
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.SHORT_SHA_PATTERN.test('abc')).toBe(false);
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.ANY_PLAUSIBLE_SHA_PATTERN.test('ABC1234')).toBe(true);
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.DEFAULT_SHA_FIELD_NAMES).toContain('commit_sha');
      expect(GHOST_SHA_VALIDATOR_CONSTANTS.DEFAULT_SHA_FIELD_NAMES).toContain('git_sha');
    });
  });

  // ── 9.1 Format checks ───────────────────────────────────────────────────

  describe('isPlausibleSha', () => {
    it('accepts a 40-char full SHA', () => {
      expect(validator.isPlausibleSha('a'.repeat(40))).toBe(true);
    });

    it('accepts a 7-char short SHA', () => {
      expect(validator.isPlausibleSha('abc1234')).toBe(true);
    });

    it('accepts a 12-char abbreviated SHA', () => {
      expect(validator.isPlausibleSha('abc123456789')).toBe(true);
    });

    it('rejects a 6-char string (too short)', () => {
      expect(validator.isPlausibleSha('abc123')).toBe(false);
    });

    it('rejects a 41-char string (too long)', () => {
      expect(validator.isPlausibleSha('a'.repeat(41))).toBe(false);
    });

    it('rejects non-hex characters', () => {
      expect(validator.isPlausibleSha('xyz1234')).toBe(false);
      expect(validator.isPlausibleSha('abc123g')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validator.isPlausibleSha('')).toBe(false);
    });

    it('rejects non-strings', () => {
      expect(validator.isPlausibleSha(null)).toBe(false);
      expect(validator.isPlausibleSha(undefined)).toBe(false);
      expect(validator.isPlausibleSha(1234567)).toBe(false);
      expect(validator.isPlausibleSha({})).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(validator.isPlausibleSha('ABC1234')).toBe(true);
      expect(validator.isPlausibleSha('AbCdEfAABBCCDD')).toBe(true);
    });
  });

  describe('isFullSha', () => {
    it('accepts a 40-char full SHA', () => {
      expect(validator.isFullSha('a'.repeat(40))).toBe(true);
    });

    it('rejects a 7-char short SHA', () => {
      expect(validator.isFullSha('abc1234')).toBe(false);
    });

    it('rejects a 41-char string', () => {
      expect(validator.isFullSha('a'.repeat(41))).toBe(false);
    });

    it('rejects non-hex characters', () => {
      expect(validator.isFullSha('g'.repeat(40))).toBe(false);
    });
  });

  // ── 9.2 Registry operations ─────────────────────────────────────────────

  describe('addSha / removeSha / has / size / clear', () => {
    it('starts empty', () => {
      expect(validator.size()).toBe(0);
    });

    it('adds a single SHA', () => {
      validator.addSha('a'.repeat(40));
      expect(validator.size()).toBe(1);
      expect(validator.has('a'.repeat(7))).toBe(true);
    });

    it('adds a short-form SHA', () => {
      validator.addSha('abc1234');
      expect(validator.size()).toBe(1);
      expect(validator.has('abc1234')).toBe(true);
    });

    it('is case-insensitive on lookup', () => {
      validator.addSha('ABC1234');
      expect(validator.has('abc1234')).toBe(true);
      expect(validator.has('ABC1234')).toBe(true);
    });

    it('trims whitespace', () => {
      validator.addSha('  abc1234  ');
      expect(validator.has('abc1234')).toBe(true);
    });

    it('throws on non-plausible SHA in addSha', () => {
      expect(() => validator.addSha('xyz')).toThrow(/not a plausible SHA/);
      expect(() => validator.addSha('')).toThrow(/not a plausible SHA/);
      expect(() => validator.addSha('not-a-sha')).toThrow(/not a plausible SHA/);
    });

    it('addShas bulk-adds valid SHAs and warns on invalid', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const added = validator.addShas(['a'.repeat(40), 'abc1234', 'zzzzzzz', 'b'.repeat(40)]);
      expect(added).toBe(3);
      expect(validator.size()).toBe(3);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('addShas does not double-count duplicates', () => {
      const added = validator.addShas(['abc1234', 'abc1234', 'abc1234']);
      expect(added).toBe(1);
      expect(validator.size()).toBe(1);
    });

    it('removeSha returns true when present, false when not', () => {
      validator.addSha('abc1234');
      expect(validator.removeSha('abc1234')).toBe(true);
      expect(validator.removeSha('abc1234')).toBe(false);
      expect(validator.removeSha('xyz5678')).toBe(false);
    });

    it('removeSha returns false for non-plausible input', () => {
      expect(validator.removeSha('xyz')).toBe(false);
      expect(validator.removeSha('')).toBe(false);
    });

    it('clear empties the registry', () => {
      validator.addShas(['abc1234', 'def5678']);
      expect(validator.size()).toBe(2);
      validator.clear();
      expect(validator.size()).toBe(0);
    });

    it('accepts initial SHAs via constructor', () => {
      const v = new GhostShaValidator(['abc1234', 'def5678']);
      expect(v.size()).toBe(2);
      expect(v.has('abc1234')).toBe(true);
    });
  });

  // ── 9.3 Validation ───────────────────────────────────────────────────────

  describe('validate', () => {
    beforeEach(() => {
      validator.addShas(['a'.repeat(40), 'b'.repeat(40), 'abc1234']);
    });

    it('classifies a known full SHA as "exists"', () => {
      const result = validator.validate('a'.repeat(40));
      expect(result.classification).toBe('exists');
      expect(result.fullForm).toBe('a'.repeat(40));
      expect(result.shortForm).toBe('a'.repeat(7));
      expect(result.invalidReason).toBeNull();
    });

    it('classifies a known short-form SHA as "exists"', () => {
      const result = validator.validate('abc1234');
      expect(result.classification).toBe('exists');
      expect(result.shortForm).toBe('abc1234');
      expect(result.fullForm).toBeNull();
    });

    it('classifies a plausible but unknown SHA as "unknown" (potential GHOST-SHA)', () => {
      const result = validator.validate('f000000');
      expect(result.classification).toBe('unknown');
      expect(result.shortForm).toBe('f000000');
      expect(result.invalidReason).toBeNull();
    });

    it('classifies a too-short string as "invalid"', () => {
      const result = validator.validate('abc');
      expect(result.classification).toBe('invalid');
      expect(result.shortForm).toBeNull();
      expect(result.invalidReason).toMatch(/too short/);
    });

    it('classifies a too-long string as "invalid"', () => {
      const result = validator.validate('a'.repeat(41));
      expect(result.classification).toBe('invalid');
      expect(result.invalidReason).toMatch(/too long/);
    });

    it('classifies non-hex string as "invalid"', () => {
      const result = validator.validate('zzzzzzz');
      expect(result.classification).toBe('invalid');
      expect(result.invalidReason).toBe('non-hex characters');
    });

    it('classifies empty string as "invalid"', () => {
      const result = validator.validate('');
      expect(result.classification).toBe('invalid');
      expect(result.invalidReason).toBe('empty string');
    });

    it('classifies whitespace-only string as "invalid"', () => {
      const result = validator.validate('   ');
      expect(result.classification).toBe('invalid');
      expect(result.invalidReason).toBe('empty string');
    });

    it('preserves the original input in the result', () => {
      const result = validator.validate('  abc1234  ');
      expect(result.input).toBe('  abc1234  ');
      expect(result.shortForm).toBe('abc1234');
    });
  });

  describe('bulkValidate', () => {
    beforeEach(() => {
      validator.addShas(['a'.repeat(40), 'abc1234']);
    });

    it('classifies a batch into valid/invalid/unknown', () => {
      const result = validator.bulkValidate([
        'a'.repeat(40), // exists
        'abc1234', // exists (short form)
        'f000000', // unknown (plausible but not in set)
        'abc', // invalid (too short)
        'zzzzzzz', // invalid (non-hex)
      ]);
      expect(result.valid).toEqual(['a'.repeat(40), 'abc1234']);
      expect(result.unknown).toEqual(['f000000']);
      expect(result.invalid).toEqual(['abc', 'zzzzzzz']);
      expect(result.hasGhostSha).toBe(true);
    });

    it('returns hasGhostSha=false when all valid', () => {
      const result = validator.bulkValidate(['a'.repeat(40), 'abc1234']);
      expect(result.hasGhostSha).toBe(false);
    });

    it('handles empty array', () => {
      const result = validator.bulkValidate([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.unknown).toEqual([]);
      expect(result.hasGhostSha).toBe(false);
    });
  });

  // ── 9.4 Recursive scanning ───────────────────────────────────────────────

  describe('scanObject', () => {
    beforeEach(() => {
      validator.addShas(['a'.repeat(40), 'abc1234']);
    });

    it('extracts SHAs from flat object with default field names', () => {
      const data = {
        commit_sha: 'a'.repeat(40),
        git_sha: 'f000000',
        sha: 'abc1234',
        other_field: 'not-a-sha',
      };
      const result = validator.scanObject(data);
      expect(result.scanned).toBe(3);
      expect(result.valid.length).toBe(2);
      expect(result.unknown.length).toBe(1);
      expect(result.invalid.length).toBe(0);
      expect(result.hasGhostSha).toBe(true);
    });

    it('walks nested objects', () => {
      const data = {
        build: {
          commit_sha: 'f000000',
        },
        deploy: {
          artifact: {
            git_sha: 'a'.repeat(40),
          },
        },
      };
      const result = validator.scanObject(data);
      expect(result.scanned).toBe(2);
      expect(result.valid.length).toBe(1);
      expect(result.unknown.length).toBe(1);
    });

    it('walks arrays', () => {
      const data = {
        commits: [
          { commit_sha: 'a'.repeat(40) },
          { commit_sha: 'f000000' },
          { commit_sha: 'abc1234' },
        ],
      };
      const result = validator.scanObject(data);
      expect(result.scanned).toBe(3);
      expect(result.valid.length).toBe(2);
      expect(result.unknown.length).toBe(1);
    });

    it('skips null and undefined values', () => {
      const data = {
        commit_sha: null,
        git_sha: undefined,
        sha: 'a'.repeat(40),
      };
      const result = validator.scanObject(data);
      expect(result.scanned).toBe(1);
    });

    it('flags non-string SHA field values as invalid', () => {
      const data = {
        commit_sha: 12345, // not a string
        sha: true,
      };
      const result = validator.scanObject(data);
      expect(result.invalid.length).toBe(2);
      expect(result.invalid[0].invalidReason).toMatch(/not a string/);
    });

    it('respects custom field names', () => {
      const data = {
        custom_field: 'a'.repeat(40),
        commit_sha: 'a'.repeat(40),
      };
      const result = validator.scanObject(data, { fieldNames: ['custom_field'] });
      expect(result.scanned).toBe(1);
    });

    it('is case-insensitive on field names', () => {
      const data = {
        COMMIT_SHA: 'a'.repeat(40),
        Git_Sha: 'abc1234',
      };
      const result = validator.scanObject(data);
      expect(result.scanned).toBe(2);
    });

    it('returns hasGhostSha=false when no suspicious SHAs', () => {
      const data = {
        commit_sha: 'a'.repeat(40),
        git_sha: 'abc1234',
      };
      const result = validator.scanObject(data);
      expect(result.hasGhostSha).toBe(false);
    });

    it('handles null root', () => {
      const result = validator.scanObject(null);
      expect(result.scanned).toBe(0);
      expect(result.hasGhostSha).toBe(false);
    });

    it('handles primitive root', () => {
      const result = validator.scanObject('just-a-string');
      expect(result.scanned).toBe(0);
    });

    it('defends against depth cap', () => {
      let nested: Record<string, unknown> = { commit_sha: 'a'.repeat(40) };
      for (let i = 0; i < 50; i++) {
        nested = { child: nested };
      }
      const result = validator.scanObject(nested, { maxDepth: 5 });
      // With maxDepth=5, the deeply nested SHA should not be reached
      expect(result.scanned).toBe(0);
    });

    it('defends against field cap with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const data: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        data[`sha_${i}`] = 'a'.repeat(40);
      }
      // Use default field list which only matches 'sha' (not 'sha_0', 'sha_1', etc.)
      // but since 'sha' is in the list, the matching 'sha' field below is scanned
      const result = validator.scanObject({ ...data, sha: 'a'.repeat(40) }, { maxFields: 1 });
      // Should stop scanning after maxFields fields
      expect(result.scanned).toBeLessThanOrEqual(1);
      warnSpy.mockRestore();
    });

    it('sets scannedAt timestamp', () => {
      const before = Date.now();
      const result = validator.scanObject({ commit_sha: 'a'.repeat(40) });
      const after = Date.now();
      expect(result.scannedAt).toBeGreaterThanOrEqual(before);
      expect(result.scannedAt).toBeLessThanOrEqual(after);
    });

    it('defends against prototype pollution (uses Object.keys)', () => {
      const data = Object.create(null);
      data.commit_sha = 'a'.repeat(40);
      const result = validator.scanObject(data);
      expect(result.scanned).toBe(1);
      expect(result.valid.length).toBe(1);
    });
  });

  // ── Integration scenarios ───────────────────────────────────────────────

  describe('integration: 5th-ICP verdict verification', () => {
    it('flags the Tyche P0 GHOST-SHA cluster from Strategos INDEX v0.6', () => {
      // Per Leader's message: d984569a, 1f353d08, f6c58374, 8b340664, 917630df
      // These are claimed in INDEX v0.6 but Tyche P0 flagged them as GHOST-SHA
      // (the validator should not be pre-loaded with these as "known")
      const result = validator.bulkValidate([
        'd984569a',
        '1f353d08',
        'f6c58374',
        '8b340664',
        '917630df',
      ]);
      expect(result.unknown.length).toBe(5);
      expect(result.hasGhostSha).toBe(true);
    });

    it('accepts SHAs loaded from git log (simulated)', () => {
      // Simulate loading from `git log --format=%H`
      const gitLogShas = [
        'a'.repeat(40),
        'b'.repeat(40),
        'c'.repeat(40),
        '1f353d08abcdef1234567890abcdef1234567890',
      ];
      validator.addShas(gitLogShas);
      // Now `1f353d08` is known
      const result = validator.validate('1f353d08');
      expect(result.classification).toBe('exists');
    });
  });
});
