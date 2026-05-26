// =============================================================================
// TEMPLATE LIBRARY -- Pre-built FP&A model templates for instant instantiation
// Provides SaaS, Manufacturing, Retail, Healthcare, Banking, Real Estate,
// Energy, and Insurance models with composition support.
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

// --- Types (re-exported from templates/types.ts) ---
export type {
  TemplateCategory,
  TemplateIndustry,
  DriverUnit,
  DriverDefinition,
  AccountDefinition,
  CascadeRuleDefinition,
  PeriodRange,
  FPTemplate,
  TemplateInstance,
  TemplateComposition,
  ValidationResult,
} from './templates/types';

export { makePeriodRange } from './templates/types';

// --- Template builders (re-exported from templates/) ---
export {
  buildSaaSTemplate,
  buildManufacturingTemplate,
  buildRetailTemplate,
  buildHealthcareTemplate,
  buildBankingTemplate,
  buildRealEstateTemplate,
  buildEnergyTemplate,
  buildInsuranceTemplate,
} from './templates';

// --- Internal imports for the class ---
import type {
  TemplateCategory,
  TemplateIndustry,
  DriverDefinition,
  AccountDefinition,
  CascadeRuleDefinition,
  FPTemplate,
  TemplateInstance,
  TemplateComposition,
} from './templates/types';

import {
  buildSaaSTemplate,
  buildManufacturingTemplate,
  buildRetailTemplate,
  buildHealthcareTemplate,
  buildBankingTemplate,
  buildRealEstateTemplate,
  buildEnergyTemplate,
  buildInsuranceTemplate,
} from './templates';

// ===========================================================================
// TEMPLATE LIBRARY ENGINE
// ===========================================================================

export class TemplateLibrary {
  private templates = new Map<string, FPTemplate>();
  private customTemplates = new Map<string, FPTemplate>();
  private compositions = new Map<string, TemplateComposition>();

  constructor() {
    this.registerBuiltInTemplates();
  }

  private registerBuiltInTemplates(): void {
    const builtIn = [
      buildSaaSTemplate(),
      buildManufacturingTemplate(),
      buildRetailTemplate(),
      buildHealthcareTemplate(),
      buildBankingTemplate(),
      buildRealEstateTemplate(),
      buildEnergyTemplate(),
      buildInsuranceTemplate(),
    ];

    for (const tpl of builtIn) {
      this.templates.set(tpl.id, tpl);
    }
  }

  // --- Listing and Retrieval ---

  listTemplates(): FPTemplate[] {
    return [...Array.from(this.templates.values()), ...Array.from(this.customTemplates.values())];
  }

  getTemplate(id: string): FPTemplate | undefined {
    return this.templates.get(id) ?? this.customTemplates.get(id);
  }

  getTemplatesByCategory(category: TemplateCategory): FPTemplate[] {
    return this.listTemplates().filter((t) => t.category === category);
  }

  getTemplatesByIndustry(industry: TemplateIndustry): FPTemplate[] {
    return this.listTemplates().filter((t) => t.industry === industry);
  }

  // --- Instantiation ---

  instantiate(templateId: string, parameters?: Record<string, number>): TemplateInstance {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    const mergedParameters = parameters ?? {};
    const generatedDrivers = this.applyDriverParameters(template.drivers, mergedParameters);

    return {
      templateId: template.id,
      parameters: mergedParameters,
      generatedDrivers,
      generatedRules: [...template.cascadeRules],
      generatedAccounts: [...template.accounts],
      instantiatedAt: new Date().toISOString(),
    };
  }

  private applyDriverParameters(
    drivers: DriverDefinition[],
    parameters: Record<string, number>
  ): DriverDefinition[] {
    return drivers.map((d) => {
      if (d.id in parameters) {
        const value = parameters[d.id];
        if (typeof value === 'number' && Number.isFinite(value)) {
          const clamped = Math.max(d.minValue, Math.min(d.maxValue, value));
          return { ...d, defaultValue: clamped };
        }
      }
      return { ...d };
    });
  }

  // --- Composition ---

  compose(params: {
    name: string;
    description: string;
    templateIds: string[];
  }): TemplateComposition {
    if (params.templateIds.length < 2) {
      throw new Error('Composition requires at least 2 templates');
    }

    const templates: FPTemplate[] = [];
    for (const id of params.templateIds) {
      const tpl = this.getTemplate(id);
      if (!tpl) {
        throw new Error(`Template "${id}" not found`);
      }
      templates.push(tpl);
    }

    const mergedDrivers = this.mergeDrivers(templates);
    const mergedRules = this.mergeRules(templates);
    const mergedAccounts = this.mergeAccounts(templates);

    const id = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const composition: TemplateComposition = {
      id,
      name: params.name,
      description: params.description,
      templateIds: params.templateIds,
      mergedDrivers,
      mergedRules,
      mergedAccounts,
      createdAt: new Date().toISOString(),
    };

    this.compositions.set(id, composition);
    return composition;
  }

  private mergeDrivers(templates: FPTemplate[]): DriverDefinition[] {
    const seen = new Set<string>();
    const merged: DriverDefinition[] = [];
    for (const tpl of templates) {
      for (const driver of tpl.drivers) {
        if (!seen.has(driver.id)) {
          seen.add(driver.id);
          merged.push({ ...driver });
        }
      }
    }
    return merged;
  }

  private mergeRules(templates: FPTemplate[]): CascadeRuleDefinition[] {
    const seen = new Set<string>();
    const merged: CascadeRuleDefinition[] = [];
    for (const tpl of templates) {
      for (const rule of tpl.cascadeRules) {
        if (!seen.has(rule.id)) {
          seen.add(rule.id);
          merged.push({ ...rule });
        }
      }
    }
    return merged;
  }

  private mergeAccounts(templates: FPTemplate[]): AccountDefinition[] {
    const seen = new Set<string>();
    const merged: AccountDefinition[] = [];
    for (const tpl of templates) {
      for (const account of tpl.accounts) {
        if (!seen.has(account.id)) {
          seen.add(account.id);
          merged.push({ ...account });
        }
      }
    }
    return merged;
  }

  getComposition(id: string): TemplateComposition | undefined {
    return this.compositions.get(id);
  }

  listCompositions(): TemplateComposition[] {
    return Array.from(this.compositions.values());
  }

  removeComposition(id: string): boolean {
    return this.compositions.delete(id);
  }

  // --- Custom Templates ---

  saveCustomTemplate(params: {
    name: string;
    description: string;
    industry: TemplateIndustry;
    category: TemplateCategory;
    tags: string[];
    drivers: DriverDefinition[];
    accounts: AccountDefinition[];
    cascadeRules: CascadeRuleDefinition[];
  }): FPTemplate {
    const id = `tpl-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const template: FPTemplate = {
      id,
      name: params.name,
      description: params.description,
      industry: params.industry,
      category: params.category,
      version: '1.0.0',
      drivers: params.drivers,
      cascadeRules: params.cascadeRules,
      accounts: params.accounts,
      periods: { start: '2026-01', end: '2026-12', frequency: 'monthly' },
      tags: params.tags,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    this.customTemplates.set(id, template);
    return template;
  }

  deleteCustomTemplate(id: string): boolean {
    return this.customTemplates.delete(id);
  }

  // --- Validation ---

  validate(template: FPTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.industry) errors.push('Industry is required');
    if (!template.category) errors.push('Category is required');
    if (template.drivers.length === 0) errors.push('At least one driver is required');
    if (template.accounts.length === 0) errors.push('At least one account is required');

    for (const rule of template.cascadeRules) {
      if (!template.drivers.some((d) => d.id === rule.driverId)) {
        errors.push(`Cascade rule "${rule.id}" references unknown driver "${rule.driverId}"`);
      }
      if (!template.accounts.some((a) => a.id === rule.targetAccountId)) {
        errors.push(
          `Cascade rule "${rule.id}" references unknown account "${rule.targetAccountId}"`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // --- Serialization ---

  serialize(): string {
    const data = {
      templates: Array.from(this.templates.values()),
      customTemplates: Array.from(this.customTemplates.values()),
      compositions: Array.from(this.compositions.values()),
    };
    return JSON.stringify(data, null, 2);
  }

  static deserialize(json: string): TemplateLibrary {
    const parsed = JSON.parse(json) as {
      templates?: FPTemplate[];
      customTemplates?: FPTemplate[];
      compositions?: TemplateComposition[];
    };

    const lib = new TemplateLibrary();

    if (Array.isArray(parsed.customTemplates)) {
      for (const tpl of parsed.customTemplates) {
        lib.customTemplates.set(tpl.id, tpl);
      }
    }

    if (Array.isArray(parsed.compositions)) {
      for (const comp of parsed.compositions) {
        lib.compositions.set(comp.id, comp);
      }
    }

    return lib;
  }

  // --- Statistics ---

  getTemplateCount(): number {
    return this.templates.size + this.customTemplates.size;
  }

  getBuiltInCount(): number {
    return this.templates.size;
  }

  getCustomCount(): number {
    return this.customTemplates.size;
  }

  getAllCategories(): TemplateCategory[] {
    const categories = new Set<TemplateCategory>();
    for (const tpl of this.listTemplates()) {
      categories.add(tpl.category);
    }
    return Array.from(categories).sort();
  }

  getAllIndustries(): TemplateIndustry[] {
    const industries = new Set<TemplateIndustry>();
    for (const tpl of this.listTemplates()) {
      industries.add(tpl.industry);
    }
    return Array.from(industries).sort();
  }

  // --- Reset ---

  reset(): void {
    this.templates.clear();
    this.customTemplates.clear();
    this.compositions.clear();
    this.registerBuiltInTemplates();
  }

  resetCustom(): void {
    this.customTemplates.clear();
    this.compositions.clear();
  }
}
