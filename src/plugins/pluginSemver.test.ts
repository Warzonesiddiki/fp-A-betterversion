/**
 * pluginSemver tests — Wave-7E marketplace-integrity (TDD red-first).
 * Covers the dependency-free semver-range subset used by the engine gate.
 */
import { describe, it, expect } from 'vitest';
import { semverSatisfies, compareTriples } from './pluginSemver';

describe('pluginSemver.semverSatisfies', () => {
  it('exact versions', () => {
    expect(semverSatisfies('1.2.3', '1.2.3')).toBe(true);
    expect(semverSatisfies('1.2.4', '1.2.3')).toBe(false);
    expect(semverSatisfies('1.2.3', '=1.2.3')).toBe(true);
  });

  it('caret ranges use standard leftmost-non-zero semantics', () => {
    expect(semverSatisfies('1.0.0', '^1.0.0')).toBe(true);
    expect(semverSatisfies('1.9.9', '^1.0.0')).toBe(true);
    expect(semverSatisfies('2.0.0', '^1.0.0')).toBe(false);
    expect(semverSatisfies('0.2.5', '^0.2.3')).toBe(true);
    expect(semverSatisfies('0.3.0', '^0.2.3')).toBe(false);
    expect(semverSatisfies('0.0.3', '^0.0.3')).toBe(true);
    expect(semverSatisfies('0.0.4', '^0.0.3')).toBe(false);
    expect(semverSatisfies('1.5.0', '^1')).toBe(true);
    expect(semverSatisfies('2.0.0', '^1')).toBe(false);
  });

  it('tilde ranges allow patch-level drift only', () => {
    expect(semverSatisfies('1.0.0', '~1.0.0')).toBe(true);
    expect(semverSatisfies('1.0.9', '~1.0.0')).toBe(true);
    expect(semverSatisfies('1.1.0', '~1.0.0')).toBe(false);
    expect(semverSatisfies('1.9.0', '~1')).toBe(true);
    expect(semverSatisfies('2.0.0', '~1')).toBe(false);
  });

  it('x-ranges and wildcards', () => {
    expect(semverSatisfies('1.9.0', '1.x')).toBe(true);
    expect(semverSatisfies('2.0.0', '1.x')).toBe(false);
    expect(semverSatisfies('1.2.9', '1.2.x')).toBe(true);
    expect(semverSatisfies('1.3.0', '1.2.x')).toBe(false);
    expect(semverSatisfies('0.0.1', '*')).toBe(true);
    expect(semverSatisfies('99.99.99', 'x')).toBe(true);
    // empty range = no constraint
    expect(semverSatisfies('1.0.0', '')).toBe(true);
    expect(semverSatisfies('1.0.0', '   ')).toBe(true);
  });

  it('comparators', () => {
    expect(semverSatisfies('1.2.5', '>=1.2.0')).toBe(true);
    expect(semverSatisfies('1.1.9', '>=1.2.0')).toBe(false);
    expect(semverSatisfies('1.2.0', '>1.2.0')).toBe(false);
    expect(semverSatisfies('1.2.1', '>1.2.0')).toBe(true);
    expect(semverSatisfies('1.2.9', '<=1.2')).toBe(true);
    expect(semverSatisfies('1.3.0', '<=1.2')).toBe(false);
    expect(semverSatisfies('1.1.9', '<1.2')).toBe(true);
    expect(semverSatisfies('1.2.0', '<1.2')).toBe(false);
  });

  it('AND groups (space-joined comparators)', () => {
    expect(semverSatisfies('1.2.5', '>=1.2.0 <1.3.0')).toBe(true);
    expect(semverSatisfies('1.3.0', '>=1.2.0 <1.3.0')).toBe(false);
    expect(semverSatisfies('1.1.0', '>=1.2.0 <1.3.0')).toBe(false);
  });

  it('OR groups (||)', () => {
    expect(semverSatisfies('1.5.0', '^1.0.0 || ^2.0.0')).toBe(true);
    expect(semverSatisfies('2.5.0', '^1.0.0 || ^2.0.0')).toBe(true);
    expect(semverSatisfies('3.0.0', '^1.0.0 || ^2.0.0')).toBe(false);
  });

  it('hyphen ranges treat a partial upper bound as exclusive', () => {
    expect(semverSatisfies('1.2.3', '1.2.3 - 2.3.4')).toBe(true);
    expect(semverSatisfies('2.3.4', '1.2.3 - 2.3.4')).toBe(true);
    expect(semverSatisfies('2.3.5', '1.2.3 - 2.3.4')).toBe(false);
    expect(semverSatisfies('2.3.9', '1.2.3 - 2.3')).toBe(true);
    expect(semverSatisfies('2.4.0', '1.2.3 - 2.3')).toBe(false);
    expect(semverSatisfies('1.2.3', '1.2.3 - 2')).toBe(true);
    expect(semverSatisfies('3.0.0', '1.2.3 - 2')).toBe(false);
  });

  it('tolerates leading v and strips prerelease/build metadata (documented limitation)', () => {
    expect(semverSatisfies('v1.2.3', '1.2.3')).toBe(true);
    expect(semverSatisfies('1.2.3-beta.1', '^1.0.0')).toBe(true);
  });

  it('fails closed on unparseable input', () => {
    expect(semverSatisfies('not-a-version', '^1.0.0')).toBe(false);
    expect(semverSatisfies('1.0.0', 'not-a-range!!')).toBe(false);
    expect(semverSatisfies('1.0.0', '>=')).toBe(false);
  });
});

describe('pluginSemver.compareTriples', () => {
  it('orders triples numerically', () => {
    expect(compareTriples([1, 0, 0], [1, 0, 0])).toBe(0);
    expect(compareTriples([1, 2, 0], [1, 10, 0])).toBeLessThan(0);
    expect(compareTriples([2, 0, 0], [1, 99, 99])).toBeGreaterThan(0);
  });
});
