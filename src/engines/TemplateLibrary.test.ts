/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================================
// TEMPLATE LIBRARY TESTS — Tests matching actual TemplateLibrary API
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TemplateLibrary,
  type FPTemplate,
  type TemplateInstance,
  type TemplateCategory,
  type TemplateIndustry,
  type DriverDefinition,
  type AccountDefinition,
  type CascadeRuleDefinition,
} from './TemplateLibrary';

describe('TemplateLibrary', () => {
  let lib: TemplateLibrary;

  beforeEach(() => {
    lib = new TemplateLibrary();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  describe('Initialization', () => {
    it('should initialize with 8 built-in templates', () => {
      expect(lib.getBuiltInCount()).toBe(8);
    });

    it('should have zero custom templates on init', () => {
      expect(lib.getCustomCount()).toBe(0);
    });

    it('should list all templates including built-in', () => {
      const templates = lib.listTemplates();
      expect(templates).toHaveLength(8);
    });

    it('should have unique template IDs', () => {
      const templates = lib.listTemplates();
      const ids = templates.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ---------------------------------------------------------------------------
  // Template Listing
  // ---------------------------------------------------------------------------

  describe('Template Listing', () => {
    it('should list all 8 built-in templates', () => {
      const templates = lib.listTemplates();
      expect(templates).toHaveLength(8);
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('tpl-saas-metrics');
      expect(ids).toContain('tpl-manufacturing');
      expect(ids).toContain('tpl-retail');
      expect(ids).toContain('tpl-healthcare');
      expect(ids).toContain('tpl-banking');
      expect(ids).toContain('tpl-real-estate');
      expect(ids).toContain('tpl-energy');
      expect(ids).toContain('tpl-insurance');
    });

    it('should return template count', () => {
      expect(lib.getTemplateCount()).toBe(8);
    });

    it('should get all unique categories', () => {
      const categories = lib.getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('revenue');
    });

    it('should get all unique industries', () => {
      const industries = lib.getAllIndustries();
      expect(industries).toContain('SaaS');
      expect(industries).toContain('Manufacturing');
      expect(industries).toContain('Retail');
      expect(industries).toContain('Healthcare');
      expect(industries).toContain('Banking');
      expect(industries).toContain('Real Estate');
      expect(industries).toContain('Energy');
      expect(industries).toContain('Insurance');
    });
  });

  // ---------------------------------------------------------------------------
  // Template Retrieval
  // ---------------------------------------------------------------------------

  describe('Template Retrieval', () => {
    it('should get a template by ID', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics');
      expect(tpl).toBeDefined();
      expect(tpl!.id).toBe('tpl-saas-metrics');
    });

    it('should return undefined for non-existent template', () => {
      const tpl = lib.getTemplate('non-existent');
      expect(tpl).toBeUndefined();
    });

    it('should get SaaS template with correct structure', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics')!;
      expect(tpl.industry).toBe('SaaS');
      expect(tpl.drivers.length).toBeGreaterThanOrEqual(1);
      expect(tpl.accounts.length).toBeGreaterThanOrEqual(1);
      expect(tpl.cascadeRules.length).toBeGreaterThanOrEqual(1);
      expect(tpl.tags.length).toBeGreaterThan(0);
    });

    it('should get Manufacturing template with correct structure', () => {
      const tpl = lib.getTemplate('tpl-manufacturing')!;
      expect(tpl.industry).toBe('Manufacturing');
      expect(tpl.drivers.length).toBeGreaterThanOrEqual(1);
      expect(tpl.accounts.length).toBeGreaterThanOrEqual(1);
    });

    it('should get Retail template with correct structure', () => {
      const tpl = lib.getTemplate('tpl-retail')!;
      expect(tpl.industry).toBe('Retail');
      expect(tpl.drivers.length).toBeGreaterThanOrEqual(1);
      expect(tpl.accounts.length).toBeGreaterThanOrEqual(1);
    });

    it('should get Healthcare template with correct structure', () => {
      const tpl = lib.getTemplate('tpl-healthcare')!;
      expect(tpl.industry).toBe('Healthcare');
      expect(tpl.drivers.length).toBeGreaterThanOrEqual(1);
      expect(tpl.accounts.length).toBeGreaterThanOrEqual(1);
    });

    it('should get Banking template with correct structure', () => {
      const tpl = lib.getTemplate('tpl-banking')!;
      expect(tpl.industry).toBe('Banking');
      expect(tpl.drivers.length).toBeGreaterThanOrEqual(1);
      expect(tpl.accounts.length).toBeGreaterThanOrEqual(1);
    });

    it('should get Real Estate template', () => {
      const tpl = lib.getTemplate('tpl-real-estate')!;
      expect(tpl.industry).toBe('Real Estate');
    });

    it('should get Energy template', () => {
      const tpl = lib.getTemplate('tpl-energy')!;
      expect(tpl.industry).toBe('Energy');
    });

    it('should get Insurance template', () => {
      const tpl = lib.getTemplate('tpl-insurance')!;
      expect(tpl.industry).toBe('Insurance');
    });
  });

  // ---------------------------------------------------------------------------
  // Template Filtering by Category/Industry
  // ---------------------------------------------------------------------------

  describe('Template Filtering', () => {
    it('should filter by industry SaaS', () => {
      const results = lib.getTemplatesByIndustry('SaaS');
      expect(results).toHaveLength(1);
      expect(results![0]!.id).toBe('tpl-saas-metrics');
    });

    it('should filter by industry Manufacturing', () => {
      const results = lib.getTemplatesByIndustry('Manufacturing');
      expect(results).toHaveLength(1);
      expect(results![0]!.id).toBe('tpl-manufacturing');
    });

    it('should filter by industry Retail', () => {
      const results = lib.getTemplatesByIndustry('Retail');
      expect(results).toHaveLength(1);
    });

    it('should filter by industry Healthcare', () => {
      const results = lib.getTemplatesByIndustry('Healthcare');
      expect(results).toHaveLength(1);
    });

    it('should filter by industry Banking', () => {
      const results = lib.getTemplatesByIndustry('Banking');
      expect(results).toHaveLength(1);
    });

    it('should return empty for non-existent industry', () => {
      const results = lib.getTemplatesByIndustry('NonExistent' as TemplateIndustry);
      expect(results).toHaveLength(0);
    });

    it('should filter by category', () => {
      const categories = lib.getAllCategories();
      if (categories.length > 0) {
        const results = lib.getTemplatesByCategory(categories[0]!);
        expect(results.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return empty for non-existent category', () => {
      const results = lib.getTemplatesByCategory('nonexistent' as TemplateCategory);
      expect(results).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Template Instantiation
  // ---------------------------------------------------------------------------

  describe('Template Instantiation', () => {
    it('should instantiate a SaaS template', () => {
      const model = lib.instantiate('tpl-saas-metrics');
      expect(model.templateId).toBe('tpl-saas-metrics');
      expect(model.generatedDrivers.length).toBeGreaterThanOrEqual(1);
      expect(model.generatedAccounts.length).toBeGreaterThanOrEqual(1);
      expect(model.generatedRules.length).toBeGreaterThanOrEqual(1);
      expect(model.instantiatedAt).toBeDefined();
    });

    it('should instantiate a Manufacturing template', () => {
      const model = lib.instantiate('tpl-manufacturing');
      expect(model.templateId).toBe('tpl-manufacturing');
    });

    it('should instantiate a Retail template', () => {
      const model = lib.instantiate('tpl-retail');
      expect(model.templateId).toBe('tpl-retail');
    });

    it('should instantiate a Healthcare template', () => {
      const model = lib.instantiate('tpl-healthcare');
      expect(model.templateId).toBe('tpl-healthcare');
    });

    it('should instantiate a Banking template', () => {
      const model = lib.instantiate('tpl-banking');
      expect(model.templateId).toBe('tpl-banking');
    });

    it('should throw for non-existent template', () => {
      expect(() => lib.instantiate('non-existent')).toThrow('Template "non-existent" not found');
    });

    it('should produce independent copies (no shared references)', () => {
      const model1 = lib.instantiate('tpl-saas-metrics');
      const model2 = lib.instantiate('tpl-saas-metrics');
      if (model1.generatedDrivers.length > 0) {
        model1!.generatedDrivers[0]!.defaultValue = 999;
        expect(model2!.generatedDrivers[0]!.defaultValue).not.toBe(999);
      }
    });

    it('should apply driver overrides', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics')!;
      if (tpl.drivers.length > 0) {
        const driverId = tpl!.drivers[0]!.id;
        const model = lib.instantiate('tpl-saas-metrics', {
          [driverId]: 15,
        });
        const driver = model.generatedDrivers.find((d) => d.id === driverId);
        expect(driver).toBeDefined();
      }
    });

    it('should handle instantiation with empty parameters', () => {
      const model = lib.instantiate('tpl-saas-metrics', {});
      expect(model.parameters).toEqual({});
      expect(model.generatedDrivers.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle instantiation with undefined parameters', () => {
      const model = lib.instantiate('tpl-saas-metrics');
      expect(model.parameters).toEqual({});
    });

    it('should instantiate all built-in templates', () => {
      const templates = lib.listTemplates();
      for (const tpl of templates) {
        const model = lib.instantiate(tpl.id);
        expect(model.templateId).toBe(tpl.id);
        expect(model.instantiatedAt).toBeDefined();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Custom Templates
  // ---------------------------------------------------------------------------

  describe('Custom Templates', () => {
    const createMinimalTemplate = () => ({
      name: 'My Custom Model',
      description: 'A custom test model',
      category: 'revenue' as TemplateCategory,
      industry: 'SaaS' as TemplateIndustry,
      tags: ['custom', 'test'],
      drivers: [
        {
          id: 'custom-driver-1',
          name: 'Test Driver',
          description: 'A test driver',
          unit: 'percentage' as const,
          defaultValue: 10,
          minValue: 0,
          maxValue: 100,
          step: 1,
          category: 'Test',
          tags: ['test'],
        },
      ],
      accounts: [
        {
          id: 'custom-acct-1',
          name: 'Test Account',
          parentId: null,
          accountType: 'revenue' as const,
          debitSide: 'credit' as const,
          description: 'Test account',
          isCalculated: false,
        },
      ],
      cascadeRules: [
        {
          id: 'custom-rule-1',
          driverId: 'custom-driver-1',
          targetAccountId: 'custom-acct-1',
          cascadeType: 'direct' as const,
          impactType: 'multiplicative' as const,
          weight: 1,
          description: 'Test rule',
        },
      ],
    });

    it('should save a custom template', () => {
      const tpl = lib.saveCustomTemplate(createMinimalTemplate());
      expect(tpl.id).toBeDefined();
      expect(tpl.id).toMatch(/^tpl-custom-/);
      expect(tpl.name).toBe('My Custom Model');
      expect(tpl.isCustom).toBe(true);
      expect(tpl.version).toBe('1.0.0');
      expect(tpl.createdAt).toBeDefined();
      expect(tpl.updatedAt).toBeDefined();
    });

    it('should include custom templates in listing', () => {
      lib.saveCustomTemplate(createMinimalTemplate());
      const all = lib.listTemplates();
      expect(all).toHaveLength(9); // 8 built-in + 1 custom
    });

    it('should get custom template by ID', () => {
      const saved = lib.saveCustomTemplate(createMinimalTemplate());
      const retrieved = lib.getTemplate(saved.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('My Custom Model');
    });

    it('should increment custom count', () => {
      lib.saveCustomTemplate(createMinimalTemplate());
      expect(lib.getCustomCount()).toBe(1);
      lib.saveCustomTemplate({ ...createMinimalTemplate(), name: 'Another' });
      expect(lib.getCustomCount()).toBe(2);
    });

    it('should update total template count', () => {
      expect(lib.getTemplateCount()).toBe(8);
      lib.saveCustomTemplate(createMinimalTemplate());
      expect(lib.getTemplateCount()).toBe(9);
    });

    it('should include custom templates in category filter', () => {
      lib.saveCustomTemplate(createMinimalTemplate());
      const results = lib.getTemplatesByCategory('revenue');
      const custom = results.find((t) => t.isCustom);
      expect(custom).toBeDefined();
    });

    it('should include custom templates in industry filter', () => {
      lib.saveCustomTemplate(createMinimalTemplate());
      const results = lib.getTemplatesByIndustry('SaaS');
      const custom = results.find((t) => t.isCustom);
      expect(custom).toBeDefined();
    });

    it('should instantiate custom template', () => {
      const saved = lib.saveCustomTemplate(createMinimalTemplate());
      const model = lib.instantiate(saved.id);
      expect(model.templateId).toBe(saved.id);
      expect(model.generatedDrivers).toHaveLength(1);
      expect(model.generatedAccounts).toHaveLength(1);
    });

    it('should remove a custom template', () => {
      const saved = lib.saveCustomTemplate(createMinimalTemplate());
      expect(lib.removeCustomTemplate(saved.id)).toBe(true);
      expect(lib.getTemplate(saved.id)).toBeUndefined();
      expect(lib.getCustomCount()).toBe(0);
    });

    it('should return false when removing non-existent custom template', () => {
      expect(lib.removeCustomTemplate('non-existent')).toBe(false);
    });

    it('should not remove built-in templates', () => {
      expect(lib.removeCustomTemplate('tpl-saas-metrics')).toBe(false);
      expect(lib.getTemplate('tpl-saas-metrics')).toBeDefined();
    });

    it('should get only custom templates', () => {
      lib.saveCustomTemplate(createMinimalTemplate());
      lib.saveCustomTemplate({ ...createMinimalTemplate(), name: 'Another' });
      const customs = lib.getCustomTemplates();
      expect(customs).toHaveLength(2);
      expect(customs.every((t) => t.isCustom)).toBe(true);
    });

    it('should generate unique IDs for multiple custom templates', () => {
      const tpl1 = lib.saveCustomTemplate(createMinimalTemplate());
      const tpl2 = lib.saveCustomTemplate(createMinimalTemplate());
      expect(tpl1.id).not.toBe(tpl2.id);
    });
  });

  // ---------------------------------------------------------------------------
  // Template Structure Validation
  // ---------------------------------------------------------------------------

  describe('Template Structure Validation', () => {
    it('every template should have at least 1 driver', () => {
      for (const tpl of lib.listTemplates()) {
        expect(tpl.drivers.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every template should have at least 1 account', () => {
      for (const tpl of lib.listTemplates()) {
        expect(tpl.accounts.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every template should have cascade rules', () => {
      for (const tpl of lib.listTemplates()) {
        expect(tpl.cascadeRules.length).toBeGreaterThan(0);
      }
    });

    it('every template should have tags', () => {
      for (const tpl of lib.listTemplates()) {
        expect(tpl.tags.length).toBeGreaterThan(0);
      }
    });

    it('every template should have a version', () => {
      for (const tpl of lib.listTemplates()) {
        expect(tpl.version).toBeDefined();
        expect(tpl.version.length).toBeGreaterThan(0);
      }
    });

    it('every template should have isCustom flag', () => {
      for (const tpl of lib.listTemplates()) {
        expect(typeof tpl.isCustom).toBe('boolean');
      }
    });

    it('every template should have periods', () => {
      for (const tpl of lib.listTemplates()) {
        expect(tpl.periods).toBeDefined();
        expect(tpl.periods.start).toBeDefined();
        expect(tpl.periods.end).toBeDefined();
      }
    });

    it('every driver should have required fields', () => {
      for (const tpl of lib.listTemplates()) {
        for (const driver of tpl.drivers) {
          expect(driver.id).toBeDefined();
          expect(driver.name).toBeDefined();
          expect(driver.description).toBeDefined();
          expect(driver.unit).toBeDefined();
          expect(typeof driver.defaultValue).toBe('number');
          expect(typeof driver.minValue).toBe('number');
          expect(typeof driver.maxValue).toBe('number');
          expect(driver.minValue).toBeLessThanOrEqual(driver.defaultValue);
          expect(driver.maxValue).toBeGreaterThanOrEqual(driver.defaultValue);
        }
      }
    });

    it('every account should have required fields', () => {
      for (const tpl of lib.listTemplates()) {
        for (const account of tpl.accounts) {
          expect(account.id).toBeDefined();
          expect(account.name).toBeDefined();
          expect(['asset', 'liability', 'equity', 'revenue', 'expense', 'memo']).toContain(
            account.accountType
          );
          expect(['debit', 'credit']).toContain(account.debitSide);
          expect(typeof account.isCalculated).toBe('boolean');
        }
      }
    });

    it('cascade rule drivers should reference existing drivers in same template', () => {
      for (const tpl of lib.listTemplates()) {
        const driverIds = new Set(tpl.drivers.map((d) => d.id));
        for (const rule of tpl.cascadeRules) {
          expect(driverIds.has(rule.driverId)).toBe(true);
        }
      }
    });

    it('cascade rule targets should reference existing accounts in same template', () => {
      for (const tpl of lib.listTemplates()) {
        const accountIds = new Set(tpl.accounts.map((a) => a.id));
        for (const rule of tpl.cascadeRules) {
          expect(accountIds.has(rule.targetAccountId)).toBe(true);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    it('should validate existing template structure', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics')!;
      const result = lib.validate(tpl);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject template with missing ID', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics')!;
      const invalidTpl = { ...tpl, id: '' };
      const result = lib.validate(invalidTpl);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject template with no drivers', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics')!;
      const invalidTpl = { ...tpl, drivers: [] };
      const result = lib.validate(invalidTpl);
      expect(result.valid).toBe(false);
    });

    it('should reject template with no accounts', () => {
      const tpl = lib.getTemplate('tpl-saas-metrics')!;
      const invalidTpl = { ...tpl, accounts: [] };
      const result = lib.validate(invalidTpl);
      expect(result.valid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Composition
  // ---------------------------------------------------------------------------

  describe('Composition', () => {
    it('should compose two templates', () => {
      const comp = lib.compose({
        name: 'SaaS + Manufacturing',
        description: 'Combined model',
        templateIds: ['tpl-saas-metrics', 'tpl-manufacturing'],
      });
      expect(comp.id).toBeDefined();
      expect(comp.name).toBe('SaaS + Manufacturing');
      expect(comp.templateIds).toHaveLength(2);
      expect(comp.mergedDrivers.length).toBeGreaterThan(0);
      expect(comp.mergedAccounts.length).toBeGreaterThan(0);
    });

    it('should throw for composition with less than 2 templates', () => {
      expect(() =>
        lib.compose({
          name: 'Invalid',
          description: 'test',
          templateIds: ['tpl-saas-metrics'],
        })
      ).toThrow('at least 2');
    });

    it('should throw for composition with non-existent template', () => {
      expect(() =>
        lib.compose({
          name: 'Invalid',
          description: 'test',
          templateIds: ['tpl-saas-metrics', 'non-existent'],
        })
      ).toThrow('not found');
    });

    it('should list compositions', () => {
      lib.compose({
        name: 'Test',
        description: 'test',
        templateIds: ['tpl-saas-metrics', 'tpl-manufacturing'],
      });
      expect(lib.listCompositions()).toHaveLength(1);
    });

    it('should get composition by ID', () => {
      const comp = lib.compose({
        name: 'Test',
        description: 'test',
        templateIds: ['tpl-saas-metrics', 'tpl-manufacturing'],
      });
      expect(lib.getComposition(comp.id)).toBeDefined();
    });

    it('should remove composition', () => {
      const comp = lib.compose({
        name: 'Test',
        description: 'test',
        templateIds: ['tpl-saas-metrics', 'tpl-manufacturing'],
      });
      expect(lib.removeComposition(comp.id)).toBe(true);
      expect(lib.listCompositions()).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  describe('Serialization', () => {
    it('should serialize and deserialize', () => {
      const json = lib.serialize();
      expect(json).toBeDefined();
      expect(json.length).toBeGreaterThan(0);

      const lib2 = TemplateLibrary.deserialize(json);
      expect(lib2.getBuiltInCount()).toBe(8);
    });

    it('should preserve custom templates through serialization', () => {
      lib.saveCustomTemplate({
        name: 'Custom',
        description: 'test',
        category: 'revenue',
        industry: 'SaaS',
        tags: ['test'],
        drivers: [
          {
            id: 'd1',
            name: 'D1',
            description: 'd',
            unit: 'percentage',
            defaultValue: 10,
            minValue: 0,
            maxValue: 100,
            step: 1,
            category: 'c',
            tags: [],
          },
        ],
        accounts: [
          {
            id: 'a1',
            name: 'A1',
            parentId: null,
            accountType: 'revenue',
            debitSide: 'credit',
            description: 'a',
            isCalculated: false,
          },
        ],
        cascadeRules: [],
      });

      const json = lib.serialize();
      const lib2 = TemplateLibrary.deserialize(json);
      expect(lib2.getCustomCount()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should handle multiple library instances independently', () => {
      const lib2 = new TemplateLibrary();
      lib.saveCustomTemplate({
        name: 'Only in lib1',
        description: 'test',
        category: 'revenue',
        industry: 'SaaS',
        tags: [],
        drivers: [
          {
            id: 'd1',
            name: 'D1',
            description: 'd',
            unit: 'percentage',
            defaultValue: 10,
            minValue: 0,
            maxValue: 100,
            step: 1,
            category: 'c',
            tags: [],
          },
        ],
        accounts: [
          {
            id: 'a1',
            name: 'A1',
            parentId: null,
            accountType: 'revenue',
            debitSide: 'credit',
            description: 'a',
            isCalculated: false,
          },
        ],
        cascadeRules: [],
      });
      expect(lib.getTemplateCount()).toBe(9);
      expect(lib2.getTemplateCount()).toBe(8);
    });

    it('should preserve template immutability after instantiation', () => {
      const original = lib.getTemplate('tpl-saas-metrics')!;
      const originalDefaultValue = original.drivers[0]?.defaultValue;

      lib.instantiate('tpl-saas-metrics', {
        [original.drivers[0]?.id ?? '']: 999,
      });

      const after = lib.getTemplate('tpl-saas-metrics')!;
      expect(after.drivers[0]?.defaultValue).toBe(originalDefaultValue);
    });
  });
});
