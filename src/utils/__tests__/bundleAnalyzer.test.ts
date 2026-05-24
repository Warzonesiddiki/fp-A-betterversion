import { describe, it, expect } from 'vitest';
import { getBundleSize, logBundleSize } from '../bundleAnalyzer';

describe('bundleAnalyzer', () => {
  it('getBundleSize returns info with empty chunks', () => {
    const result = getBundleSize();
    expect(result).toHaveProperty('chunks');
    expect(result).toHaveProperty('totalSize');
    expect(result).toHaveProperty('gzippedSize');
  });

  it('logBundleSize does not throw', () => {
    expect(() => logBundleSize()).not.toThrow();
  });
});
