/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { buildRealEstateTemplate } from './real-estate';

describe('Real Estate Template', () => {
  describe('buildRealEstateTemplate', () => {
    it('returns a valid template', () => {
      const template = buildRealEstateTemplate();
      expect(template).toBeDefined();
    });

    it('has a name', () => {
      const template = buildRealEstateTemplate();
      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');
    });

    it('has drivers array', () => {
      const template = buildRealEstateTemplate();
      expect(template.drivers).toBeDefined();
      expect(Array.isArray(template.drivers)).toBe(true);
      expect(template.drivers.length).toBeGreaterThan(0);
    });

    it('has accounts', () => {
      const template = buildRealEstateTemplate();
      expect(template.accounts).toBeDefined();
      expect(Array.isArray(template.accounts)).toBe(true);
    });

    it('each driver has required fields', () => {
      const template = buildRealEstateTemplate();
      for (const driver of template.drivers) {
        expect(driver.id).toBeDefined();
        expect(driver.name).toBeDefined();
        expect(driver.unit).toBeDefined();
      }
    });
  });
});
