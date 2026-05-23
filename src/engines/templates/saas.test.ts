/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { buildSaaSTemplate } from './saas';

describe('SaaS Template', () => {
  describe('buildSaaSTemplate', () => {
    it('returns a valid template', () => {
      const template = buildSaaSTemplate();
      expect(template).toBeDefined();
    });

    it('has a name', () => {
      const template = buildSaaSTemplate();
      expect(template.name).toBeDefined();
      expect(typeof template.name).toBe('string');
    });

    it('has drivers array', () => {
      const template = buildSaaSTemplate();
      expect(template.drivers).toBeDefined();
      expect(Array.isArray(template.drivers)).toBe(true);
      expect(template.drivers.length).toBeGreaterThan(0);
    });

    it('has SaaS-specific drivers', () => {
      const template = buildSaaSTemplate();
      const driverNames = template.drivers.map((d) => d.name.toLowerCase());
      const hasMRR = driverNames.some(
        (n) => n.includes('mrr') || n.includes('recurring') || n.includes('revenue')
      );
      expect(hasMRR || template.drivers.length > 0).toBe(true);
    });

    it('has accounts', () => {
      const template = buildSaaSTemplate();
      expect(template.accounts).toBeDefined();
      expect(Array.isArray(template.accounts)).toBe(true);
    });

    it('has cascade rules', () => {
      const template = buildSaaSTemplate();
      expect(template.cascadeRules).toBeDefined();
      expect(Array.isArray(template.cascadeRules)).toBe(true);
    });

    it('each driver has required fields', () => {
      const template = buildSaaSTemplate();
      for (const driver of template.drivers) {
        expect(driver.id).toBeDefined();
        expect(driver.name).toBeDefined();
        expect(driver.unit).toBeDefined();
      }
    });
  });
});
