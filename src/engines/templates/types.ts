// =============================================================================
// Template Library -- Shared Types and Helpers
// =============================================================================

export type TemplateCategory =
  | 'revenue'
  | 'cogs'
  | 'opex'
  | 'workforce'
  | 'capex'
  | 'cashflow'
  | 'balance-sheet';

export type TemplateIndustry =
  | 'SaaS'
  | 'Manufacturing'
  | 'Retail'
  | 'Healthcare'
  | 'Banking'
  | 'Real Estate'
  | 'Energy'
  | 'Insurance';

export type DriverUnit =
  | 'percentage'
  | 'absolute'
  | 'index'
  | 'ratio'
  | 'currency'
  | 'months'
  | 'days'
  | 'count';

export interface DriverDefinition {
  id: string;
  name: string;
  description: string;
  unit: DriverUnit;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  category: string;
  tags: string[];
}

export interface AccountDefinition {
  id: string;
  name: string;
  parentId: string | null;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'memo';
  debitSide: 'debit' | 'credit';
  description: string;
  isCalculated: boolean;
}

export interface CascadeRuleDefinition {
  id: string;
  driverId: string;
  targetAccountId: string;
  cascadeType: 'direct' | 'weighted' | 'formula';
  impactType: 'additive' | 'multiplicative' | 'replacement';
  weight: number;
  formula?: string;
  description: string;
}

export interface PeriodRange {
  start: string;
  end: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
}

export interface FPTemplate {
  id: string;
  name: string;
  description: string;
  industry: TemplateIndustry;
  category: TemplateCategory;
  version: string;
  drivers: DriverDefinition[];
  cascadeRules: CascadeRuleDefinition[];
  accounts: AccountDefinition[];
  periods: PeriodRange;
  tags: string[];
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInstance {
  templateId: string;
  parameters: Record<string, number>;
  generatedDrivers: DriverDefinition[];
  generatedRules: CascadeRuleDefinition[];
  generatedAccounts: AccountDefinition[];
  instantiatedAt: string;
}

export interface TemplateComposition {
  id: string;
  name: string;
  description: string;
  templateIds: string[];
  mergedDrivers: DriverDefinition[];
  mergedRules: CascadeRuleDefinition[];
  mergedAccounts: AccountDefinition[];
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function makePeriodRange(
  start: string,
  end: string,
  frequency: PeriodRange['frequency']
): PeriodRange {
  return { start, end, frequency };
}
