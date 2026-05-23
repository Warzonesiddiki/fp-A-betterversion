import { describe, it, expect } from 'vitest';
import { SensitivityEngine } from './SensitivityEngine';

describe('SensitivityEngine', () => {
  describe('tornado', () => {
    it('should generate tornado items for each variable', () => {
      const result = SensitivityEngine.tornado(
        [
          { name: 'Price', baseValue: 100, lowValue: 80, highValue: 120 },
          { name: 'Volume', baseValue: 1000, lowValue: 800, highValue: 1200 },
        ],
        (vars) => vars.Price * vars.Volume,
        { Price: 100, Volume: 1000 }
      );
      expect(result).toHaveLength(2);
    });

    it('should rank by swing descending', () => {
      const result = SensitivityEngine.tornado(
        [
          { name: 'Small', baseValue: 100, lowValue: 90, highValue: 110 },
          { name: 'Large', baseValue: 100, lowValue: 50, highValue: 150 },
        ],
        (vars) => vars.Small + vars.Large,
        { Small: 100, Large: 100 }
      );
      expect(result[0].name).toBe('Large');
    });

    it('should calculate swing correctly', () => {
      const result = SensitivityEngine.tornado(
        [{ name: 'X', baseValue: 10, lowValue: 5, highValue: 15 }],
        (vars) => vars.X * 2,
        { X: 10 }
      );
      expect(result[0].swing).toBe(20);
    });

    it('should handle single variable', () => {
      const result = SensitivityEngine.tornado(
        [{ name: 'A', baseValue: 100, lowValue: 50, highValue: 150 }],
        (vars) => vars.A,
        { A: 100 }
      );
      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
    });
  });
});
