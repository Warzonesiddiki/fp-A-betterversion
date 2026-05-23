// =============================================================================
// Template Library -- Sector Templates Barrel Export
// =============================================================================

export { buildSaaSTemplate } from './saas';
export { buildManufacturingTemplate } from './manufacturing';
export { buildRetailTemplate } from './retail';
export { buildHealthcareTemplate } from './healthcare';
export { buildBankingTemplate } from './banking';
export { buildRealEstateTemplate } from './real-estate';
export { buildEnergyTemplate } from './energy';
export { buildInsuranceTemplate } from './insurance';

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
} from './types';

export { makePeriodRange } from './types';
