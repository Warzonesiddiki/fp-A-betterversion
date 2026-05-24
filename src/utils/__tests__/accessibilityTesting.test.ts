import { describe, it, expect } from 'vitest';
import { AccessibilityTesting } from '../accessibilityTesting';

describe('AccessibilityTesting', () => {
  describe('checkContrast', () => {
    it('returns passes for high contrast', () => {
      const result = AccessibilityTesting.checkContrast('#000000', '#FFFFFF');
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThan(10);
      expect(result.level).toBe('AAA');
    });

    it('returns FAIL for low contrast', () => {
      const result = AccessibilityTesting.checkContrast('#AAAAAA', '#CCCCCC');
      expect(result.passes).toBe(false);
      expect(result.level).toBe('FAIL');
    });

    it('handles same color', () => {
      const result = AccessibilityTesting.checkContrast('#FF0000', '#FF0000');
      expect(result.passes).toBe(false);
      expect(result.ratio).toBe(1);
    });

    it('handles AA level contrast', () => {
      const result = AccessibilityTesting.checkContrast('#767676', '#FFFFFF');
      expect(result.passes).toBe(true);
      expect(['AA', 'AAA']).toContain(result.level);
    });
  });
});
