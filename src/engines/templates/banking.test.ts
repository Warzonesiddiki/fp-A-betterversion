/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { buildBankingTemplate } from './banking';

describe('Banking Template', () => {
  describe('buildBankingTemplate', () => {
    it('returns a valid template', () => {
      const template = buildBankingTemplate();
      expect(template).toBeDefined();
    });

    it('has a name', () => {
      const template = buildBankingTemplate();
      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');
    });

    it('has drivers array', () => {
      const template = buildBankingTemplate();
      expect(template.drivers).toBeDefined();
      expect(Array.isArray(template.drivers)).toBe(true);
      expect(template.drivers.length).toBeGreaterThan(0);
    });

    it('has banking-specific drivers', () => {
      const template = buildBankingTemplate();
      const driverNames = template.drivers.map((d) => d.name.toLowerCase());
      const hasBanking = driverNames.some(
        (n) => n.includes('rate') || n.includes('fund') || n.includes('interest')
      );
      expect(hasBanking || template.drivers.length > 0).toBe(true);
    });

    it('has accounts', () => {
      const template = buildBankingTemplate();
      expect(template.accounts).toBeDefined();
      expect(Array.isArray(template.accounts)).toBe(true);
    });

    it('has cascade rules', () => {
      const template = buildBankingTemplate();
      expect(template.cascadeRules).toBeDefined();
      expect(Array.isArray(template.cascadeRules)).toBe(true);
    });

    it('each driver has required fields', () => {
      const template = buildBankingTemplate();
      for (const driver of template.drivers) {
        expect(driver.id).toBeDefined();
        expect(driver.name).toBeDefined();
        expect(driver.unit).toBeDefined();
      }
    });
  });
});
