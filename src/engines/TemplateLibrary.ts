// =============================================================================
// TEMPLATE LIBRARY -- Pre-built FP&A model templates for instant instantiation
// Provides SaaS, Manufacturing, Retail, Healthcare, Banking, Real Estate,
// Energy, and Insurance models with composition support.
// Pure TypeScript, deterministic, testable, zero external dependencies
// =============================================================================

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makePeriodRange(
  start: string,
  end: string,
  frequency: PeriodRange['frequency']
): PeriodRange {
  return { start, end, frequency };
}

// ---------------------------------------------------------------------------
// Built-in Template: SaaS
// ---------------------------------------------------------------------------

function buildSaaSTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'saas-mrr-growth',
      name: 'MRR Growth Rate',
      description: 'Monthly Recurring Revenue growth rate',
      unit: 'percentage',
      defaultValue: 8,
      minValue: -50,
      maxValue: 200,
      step: 1,
      category: 'Revenue',
      tags: ['mrr', 'growth', 'recurring'],
    },
    {
      id: 'saas-churn-rate',
      name: 'Monthly Churn Rate',
      description: 'Percentage of customers lost per month',
      unit: 'percentage',
      defaultValue: 3,
      minValue: 0,
      maxValue: 30,
      step: 0.5,
      category: 'Retention',
      tags: ['churn', 'retention'],
    },
    {
      id: 'saas-arpu',
      name: 'Average Revenue Per User',
      description: 'Average monthly revenue per customer',
      unit: 'currency',
      defaultValue: 500,
      minValue: 0,
      maxValue: 100000,
      step: 10,
      category: 'Revenue',
      tags: ['arpu', 'pricing'],
    },
    {
      id: 'saas-cac',
      name: 'Customer Acquisition Cost',
      description: 'Cost to acquire one new customer',
      unit: 'currency',
      defaultValue: 3000,
      minValue: 0,
      maxValue: 100000,
      step: 100,
      category: 'Sales',
      tags: ['cac', 'acquisition'],
    },
    {
      id: 'saas-gross-margin',
      name: 'Gross Margin',
      description: 'Gross margin percentage',
      unit: 'percentage',
      defaultValue: 75,
      minValue: 0,
      maxValue: 100,
      step: 1,
      category: 'Profitability',
      tags: ['margin', 'profitability'],
    },
    {
      id: 'saas-expansion-rate',
      name: 'Net Expansion Rate',
      description: 'Revenue expansion from existing customers',
      unit: 'percentage',
      defaultValue: 5,
      minValue: 0,
      maxValue: 100,
      step: 1,
      category: 'Revenue',
      tags: ['expansion', 'upsell'],
    },
    {
      id: 'saas-new-customers',
      name: 'New Customers per Month',
      description: 'Number of new customers acquired monthly',
      unit: 'count',
      defaultValue: 50,
      minValue: 0,
      maxValue: 10000,
      step: 5,
      category: 'Sales',
      tags: ['acquisition', 'growth'],
    },
    {
      id: 'saas-avg-contract',
      name: 'Average Contract Length',
      description: 'Average customer contract duration in months',
      unit: 'months',
      defaultValue: 12,
      minValue: 1,
      maxValue: 60,
      step: 1,
      category: 'Contract',
      tags: ['contract', 'retention'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'saas-arr',
      name: 'Annual Recurring Revenue',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Total ARR',
      isCalculated: true,
    },
    {
      id: 'saas-mrr',
      name: 'Monthly Recurring Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Total MRR',
      isCalculated: true,
    },
    {
      id: 'saas-new-mrr',
      name: 'New MRR',
      parentId: 'saas-mrr',
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'MRR from new customers',
      isCalculated: false,
    },
    {
      id: 'saas-expansion-mrr',
      name: 'Expansion MRR',
      parentId: 'saas-mrr',
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'MRR from upsells',
      isCalculated: true,
    },
    {
      id: 'saas-churned-mrr',
      name: 'Churned MRR',
      parentId: 'saas-mrr',
      accountType: 'revenue',
      debitSide: 'debit',
      description: 'Lost MRR from churn',
      isCalculated: true,
    },
    {
      id: 'saas-net-mrr',
      name: 'Net New MRR',
      parentId: 'saas-mrr',
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Net MRR change',
      isCalculated: true,
    },
    {
      id: 'saas-cogs',
      name: 'Cost of Goods Sold',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Hosting, support costs',
      isCalculated: true,
    },
    {
      id: 'saas-gross-profit',
      name: 'Gross Profit',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'MRR minus COGS',
      isCalculated: true,
    },
    {
      id: 'saas-sm-expense',
      name: 'Sales & Marketing Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'S&M spend',
      isCalculated: false,
    },
    {
      id: 'saas-rd-expense',
      name: 'R&D Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Engineering costs',
      isCalculated: false,
    },
    {
      id: 'saas-ga-expense',
      name: 'G&A Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Admin costs',
      isCalculated: false,
    },
    {
      id: 'saas-total-opex',
      name: 'Total Operating Expense',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Total OpEx',
      isCalculated: true,
    },
    {
      id: 'saas-ebitda',
      name: 'EBITDA',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Operating income before D&A',
      isCalculated: true,
    },
    {
      id: 'saas-customer-count',
      name: 'Customer Count',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Total active customers',
      isCalculated: true,
    },
    {
      id: 'saas-ltv',
      name: 'Customer Lifetime Value',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'LTV per customer',
      isCalculated: true,
    },
    {
      id: 'saas-ltv-cac-ratio',
      name: 'LTV/CAC Ratio',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Unit economics ratio',
      isCalculated: true,
    },
    {
      id: 'saas-nrr',
      name: 'Net Revenue Retention',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'NRR percentage',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'saas-c-1',
      driverId: 'saas-mrr-growth',
      targetAccountId: 'saas-new-mrr',
      cascadeType: 'formula',
      impactType: 'multiplicative',
      weight: 1,
      formula: 'x * prev / 100 + prev',
      description: 'MRR growth drives new MRR',
    },
    {
      id: 'saas-c-2',
      driverId: 'saas-churn-rate',
      targetAccountId: 'saas-churned-mrr',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Churn rate drives churned MRR',
    },
    {
      id: 'saas-c-3',
      driverId: 'saas-arpu',
      targetAccountId: 'saas-mrr',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 0.5,
      description: 'ARPU changes flow to MRR',
    },
    {
      id: 'saas-c-4',
      driverId: 'saas-expansion-rate',
      targetAccountId: 'saas-expansion-mrr',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Expansion rate drives expansion MRR',
    },
    {
      id: 'saas-c-5',
      driverId: 'saas-new-customers',
      targetAccountId: 'saas-new-mrr',
      cascadeType: 'weighted',
      impactType: 'additive',
      weight: 1,
      description: 'New customers drive new MRR',
    },
    {
      id: 'saas-c-6',
      driverId: 'saas-gross-margin',
      targetAccountId: 'saas-cogs',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * (100 - x) / 100',
      description: 'Margin changes drive COGS',
    },
    {
      id: 'saas-c-7',
      driverId: 'saas-cac',
      targetAccountId: 'saas-sm-expense',
      cascadeType: 'weighted',
      impactType: 'additive',
      weight: 1,
      description: 'CAC drives S&M expense',
    },
  ];

  return {
    id: 'tpl-saas-metrics',
    name: 'SaaS Metrics Model',
    description:
      'Comprehensive SaaS financial model with ARR, MRR, churn analysis, LTV/CAC, and net revenue retention. Ideal for subscription businesses tracking unit economics.',
    industry: 'SaaS',
    category: 'revenue',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'monthly'),
    tags: ['saas', 'subscription', 'arr', 'mrr', 'churn', 'ltv', 'cac', 'nrr'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Manufacturing
// ---------------------------------------------------------------------------

function buildManufacturingTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'mfg-material-cost',
      name: 'Raw Material Cost per Unit',
      description: 'Cost of raw materials per finished unit',
      unit: 'currency',
      defaultValue: 25,
      minValue: 0,
      maxValue: 10000,
      step: 0.5,
      category: 'COGS',
      tags: ['material', 'cost'],
    },
    {
      id: 'mfg-labor-rate',
      name: 'Direct Labor Rate',
      description: 'Hourly labor rate for production workers',
      unit: 'currency',
      defaultValue: 35,
      minValue: 10,
      maxValue: 200,
      step: 1,
      category: 'COGS',
      tags: ['labor', 'wages'],
    },
    {
      id: 'mfg-labor-hours',
      name: 'Labor Hours per Unit',
      description: 'Direct labor hours required per unit',
      unit: 'absolute',
      defaultValue: 0.5,
      minValue: 0,
      maxValue: 100,
      step: 0.1,
      category: 'COGS',
      tags: ['labor', 'efficiency'],
    },
    {
      id: 'mfg-overhead-rate',
      name: 'Overhead Allocation Rate',
      description: 'Manufacturing overhead as % of direct costs',
      unit: 'percentage',
      defaultValue: 40,
      minValue: 0,
      maxValue: 200,
      step: 5,
      category: 'COGS',
      tags: ['overhead'],
    },
    {
      id: 'mfg-yield',
      name: 'Production Yield',
      description: 'Percentage of good units produced',
      unit: 'percentage',
      defaultValue: 95,
      minValue: 50,
      maxValue: 100,
      step: 0.5,
      category: 'Production',
      tags: ['yield', 'quality'],
    },
    {
      id: 'mfg-volume',
      name: 'Production Volume',
      description: 'Units produced per month',
      unit: 'count',
      defaultValue: 10000,
      minValue: 0,
      maxValue: 1000000,
      step: 100,
      category: 'Production',
      tags: ['volume', 'capacity'],
    },
    {
      id: 'mfg-price',
      name: 'Selling Price per Unit',
      description: 'Average selling price per unit',
      unit: 'currency',
      defaultValue: 75,
      minValue: 0,
      maxValue: 100000,
      step: 1,
      category: 'Revenue',
      tags: ['price', 'revenue'],
    },
    {
      id: 'mfg-inventory-days',
      name: 'Inventory Days on Hand',
      description: 'Average days of inventory held',
      unit: 'days',
      defaultValue: 45,
      minValue: 0,
      maxValue: 365,
      step: 1,
      category: 'Working Capital',
      tags: ['inventory', 'turns'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'mfg-revenue',
      name: 'Net Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Total product revenue',
      isCalculated: true,
    },
    {
      id: 'mfg-material-cost-total',
      name: 'Raw Material Cost',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total material costs',
      isCalculated: true,
    },
    {
      id: 'mfg-labor-cost-total',
      name: 'Direct Labor Cost',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total labor costs',
      isCalculated: true,
    },
    {
      id: 'mfg-overhead-total',
      name: 'Manufacturing Overhead',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Allocated overhead',
      isCalculated: true,
    },
    {
      id: 'mfg-cogs',
      name: 'Cost of Goods Sold',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total COGS',
      isCalculated: true,
    },
    {
      id: 'mfg-gross-profit',
      name: 'Gross Profit',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Revenue minus COGS',
      isCalculated: true,
    },
    {
      id: 'mfg-gross-margin',
      name: 'Gross Margin %',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Gross margin percentage',
      isCalculated: true,
    },
    {
      id: 'mfg-good-units',
      name: 'Good Units Produced',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Units passing quality',
      isCalculated: true,
    },
    {
      id: 'mfg-scrap-units',
      name: 'Scrap Units',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Defective units',
      isCalculated: true,
    },
    {
      id: 'mfg-cost-per-unit',
      name: 'Fully Loaded Cost per Unit',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Total cost per good unit',
      isCalculated: true,
    },
    {
      id: 'mfg-inventory-value',
      name: 'Inventory Value',
      parentId: null,
      accountType: 'asset',
      debitSide: 'debit',
      description: 'On-hand inventory value',
      isCalculated: true,
    },
    {
      id: 'mfg-contribution-margin',
      name: 'Contribution Margin',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Price minus variable cost',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'mfg-c-1',
      driverId: 'mfg-material-cost',
      targetAccountId: 'mfg-material-cost-total',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Material cost drives total material',
    },
    {
      id: 'mfg-c-2',
      driverId: 'mfg-labor-rate',
      targetAccountId: 'mfg-labor-cost-total',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Labor rate drives total labor',
    },
    {
      id: 'mfg-c-3',
      driverId: 'mfg-overhead-rate',
      targetAccountId: 'mfg-overhead-total',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'OH rate drives total overhead',
    },
    {
      id: 'mfg-c-4',
      driverId: 'mfg-yield',
      targetAccountId: 'mfg-good-units',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Yield drives good units',
    },
    {
      id: 'mfg-c-5',
      driverId: 'mfg-volume',
      targetAccountId: 'mfg-revenue',
      cascadeType: 'weighted',
      impactType: 'additive',
      weight: 1,
      description: 'Volume drives revenue',
    },
    {
      id: 'mfg-c-6',
      driverId: 'mfg-price',
      targetAccountId: 'mfg-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Price drives revenue',
    },
    {
      id: 'mfg-c-7',
      driverId: 'mfg-inventory-days',
      targetAccountId: 'mfg-inventory-value',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Days drives inventory value',
    },
  ];

  return {
    id: 'tpl-manufacturing',
    name: 'Manufacturing COGS Model',
    description:
      'Manufacturing cost model with material costs, direct labor, overhead allocation, production yield, and breakeven analysis.',
    industry: 'Manufacturing',
    category: 'cogs',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'monthly'),
    tags: ['manufacturing', 'cogs', 'materials', 'labor', 'overhead', 'yield', 'production'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Retail
// ---------------------------------------------------------------------------

function buildRetailTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'ret-same-store-sales',
      name: 'Same-Store Sales Growth',
      description: 'Year-over-year sales growth for existing stores',
      unit: 'percentage',
      defaultValue: 3,
      minValue: -30,
      maxValue: 50,
      step: 0.5,
      category: 'Revenue',
      tags: ['comps', 'organic'],
    },
    {
      id: 'ret-traffic',
      name: 'Store Traffic',
      description: 'Monthly customer visits per store',
      unit: 'count',
      defaultValue: 15000,
      minValue: 0,
      maxValue: 500000,
      step: 100,
      category: 'Traffic',
      tags: ['footfall'],
    },
    {
      id: 'ret-conversion',
      name: 'Conversion Rate',
      description: 'Percentage of visitors who purchase',
      unit: 'percentage',
      defaultValue: 22,
      minValue: 0,
      maxValue: 100,
      step: 0.5,
      category: 'Sales',
      tags: ['conversion'],
    },
    {
      id: 'ret-basket-size',
      name: 'Average Basket Size',
      description: 'Average transaction value',
      unit: 'currency',
      defaultValue: 65,
      minValue: 0,
      maxValue: 10000,
      step: 1,
      category: 'Revenue',
      tags: ['atv', 'ticket'],
    },
    {
      id: 'ret-inventory-turns',
      name: 'Inventory Turns',
      description: 'Annual inventory turnover ratio',
      unit: 'ratio',
      defaultValue: 6,
      minValue: 0,
      maxValue: 52,
      step: 0.5,
      category: 'Inventory',
      tags: ['turns'],
    },
    {
      id: 'ret-store-count',
      name: 'Store Count',
      description: 'Number of operating stores',
      unit: 'count',
      defaultValue: 25,
      minValue: 0,
      maxValue: 10000,
      step: 1,
      category: 'Operations',
      tags: ['stores'],
    },
    {
      id: 'ret-rent-psf',
      name: 'Rent per Square Foot',
      description: 'Annual rent cost per square foot',
      unit: 'currency',
      defaultValue: 35,
      minValue: 0,
      maxValue: 500,
      step: 1,
      category: 'Occupancy',
      tags: ['rent'],
    },
    {
      id: 'ret-markup',
      name: 'Markup Percentage',
      description: 'Gross markup on cost of goods',
      unit: 'percentage',
      defaultValue: 55,
      minValue: 0,
      maxValue: 500,
      step: 1,
      category: 'Margin',
      tags: ['markup', 'pricing'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'ret-total-revenue',
      name: 'Total Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Total retail sales',
      isCalculated: true,
    },
    {
      id: 'ret-transactions',
      name: 'Transaction Count',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Total transactions',
      isCalculated: true,
    },
    {
      id: 'ret-cogs',
      name: 'Cost of Goods Sold',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Product cost',
      isCalculated: true,
    },
    {
      id: 'ret-gross-profit',
      name: 'Gross Profit',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Revenue minus COGS',
      isCalculated: true,
    },
    {
      id: 'ret-shrinkage',
      name: 'Shrinkage Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Inventory loss',
      isCalculated: true,
    },
    {
      id: 'ret-occupancy',
      name: 'Occupancy Cost',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total rent expense',
      isCalculated: true,
    },
    {
      id: 'ret-payroll',
      name: 'Store Payroll',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Labor costs',
      isCalculated: false,
    },
    {
      id: 'ret-store-profit',
      name: 'Store-Level Profit',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Store contribution',
      isCalculated: true,
    },
    {
      id: 'ret-avg-inventory',
      name: 'Average Inventory',
      parentId: null,
      accountType: 'asset',
      debitSide: 'debit',
      description: 'Inventory on hand',
      isCalculated: true,
    },
    {
      id: 'ret-sales-per-sqft',
      name: 'Sales per Square Foot',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Productivity metric',
      isCalculated: true,
    },
    {
      id: 'ret-sales-per-store',
      name: 'Sales per Store',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Average store revenue',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'ret-c-1',
      driverId: 'ret-traffic',
      targetAccountId: 'ret-transactions',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Traffic drives transactions',
    },
    {
      id: 'ret-c-2',
      driverId: 'ret-conversion',
      targetAccountId: 'ret-transactions',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Conversion drives transactions',
    },
    {
      id: 'ret-c-3',
      driverId: 'ret-basket-size',
      targetAccountId: 'ret-total-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Basket size drives revenue',
    },
    {
      id: 'ret-c-4',
      driverId: 'ret-store-count',
      targetAccountId: 'ret-total-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Store count drives revenue',
    },
    {
      id: 'ret-c-5',
      driverId: 'ret-markup',
      targetAccountId: 'ret-cogs',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current / (1 + x / 100)',
      description: 'Markup drives COGS',
    },
    {
      id: 'ret-c-6',
      driverId: 'ret-inventory-turns',
      targetAccountId: 'ret-avg-inventory',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current / x',
      description: 'Turns drive inventory',
    },
  ];

  return {
    id: 'tpl-retail',
    name: 'Retail Store Model',
    description:
      'Multi-unit retail model with same-store sales, traffic/conversion funnel, basket analysis, inventory turns, and store-level profitability.',
    industry: 'Retail',
    category: 'revenue',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'monthly'),
    tags: ['retail', 'store', 'traffic', 'conversion', 'basket', 'inventory', 'occupancy'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Healthcare
// ---------------------------------------------------------------------------

function buildHealthcareTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'hc-member-months',
      name: 'Member Months',
      description: 'Total member months for the period',
      unit: 'absolute',
      defaultValue: 120000,
      minValue: 0,
      maxValue: 10000000,
      step: 1000,
      category: 'Membership',
      tags: ['members', 'enrollment'],
    },
    {
      id: 'hc-pmpm-premium',
      name: 'PMPM Premium',
      description: 'Per Member Per Month premium revenue',
      unit: 'currency',
      defaultValue: 450,
      minValue: 0,
      maxValue: 5000,
      step: 5,
      category: 'Revenue',
      tags: ['premium', 'pmpm'],
    },
    {
      id: 'hc-utilization',
      name: 'Inpatient Utilization',
      description: 'Inpatient admissions per 1000 members',
      unit: 'ratio',
      defaultValue: 65,
      minValue: 0,
      maxValue: 200,
      step: 1,
      category: 'Utilization',
      tags: ['utilization', 'admits'],
    },
    {
      id: 'hc-avg-length-stay',
      name: 'Average Length of Stay',
      description: 'Average days per inpatient admission',
      unit: 'days',
      defaultValue: 4.5,
      minValue: 0,
      maxValue: 30,
      step: 0.5,
      category: 'Utilization',
      tags: ['alos'],
    },
    {
      id: 'hc-unit-cost',
      name: 'Per Diem Cost',
      description: 'Cost per inpatient day',
      unit: 'currency',
      defaultValue: 2500,
      minValue: 0,
      maxValue: 50000,
      step: 50,
      category: 'Cost',
      tags: ['cost', 'per diem'],
    },
    {
      id: 'hc-risk-adj',
      name: 'Risk Adjustment Factor',
      description: 'Risk score adjustment for member acuity',
      unit: 'index',
      defaultValue: 1.0,
      minValue: 0.5,
      maxValue: 3.0,
      step: 0.05,
      category: 'Risk',
      tags: ['risk', 'hcc'],
    },
    {
      id: 'hc-admin-cost',
      name: 'Admin Cost PMPM',
      description: 'Administrative cost per member per month',
      unit: 'currency',
      defaultValue: 35,
      minValue: 0,
      maxValue: 500,
      step: 1,
      category: 'Admin',
      tags: ['admin'],
    },
    {
      id: 'hc-medical-loss-ratio',
      name: 'Target MLR',
      description: 'Target medical loss ratio',
      unit: 'percentage',
      defaultValue: 82,
      minValue: 60,
      maxValue: 95,
      step: 1,
      category: 'Margin',
      tags: ['mlr'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'hc-premium-revenue',
      name: 'Premium Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Total premium income',
      isCalculated: true,
    },
    {
      id: 'hc-medical-cost',
      name: 'Total Medical Cost',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total claims expense',
      isCalculated: true,
    },
    {
      id: 'hc-ip-cost',
      name: 'Inpatient Cost',
      parentId: 'hc-medical-cost',
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Inpatient claims',
      isCalculated: true,
    },
    {
      id: 'hc-op-cost',
      name: 'Outpatient Cost',
      parentId: 'hc-medical-cost',
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Outpatient claims',
      isCalculated: false,
    },
    {
      id: 'hc-pharmacy-cost',
      name: 'Pharmacy Cost',
      parentId: 'hc-medical-cost',
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Pharmacy claims',
      isCalculated: false,
    },
    {
      id: 'hc-professional-cost',
      name: 'Professional Cost',
      parentId: 'hc-medical-cost',
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Physician services',
      isCalculated: false,
    },
    {
      id: 'hc-mlr',
      name: 'Medical Loss Ratio',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'MLR percentage',
      isCalculated: true,
    },
    {
      id: 'hc-admin-expense',
      name: 'Administrative Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total admin costs',
      isCalculated: true,
    },
    {
      id: 'hc-underwriting-income',
      name: 'Underwriting Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Premium minus costs',
      isCalculated: true,
    },
    {
      id: 'hc-net-income',
      name: 'Net Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Bottom line',
      isCalculated: true,
    },
    {
      id: 'hc-pmpm-medical',
      name: 'PMPM Medical Cost',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Medical cost per member',
      isCalculated: true,
    },
    {
      id: 'hc-ip-admits',
      name: 'IP Admissions',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Total admissions',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'hc-c-1',
      driverId: 'hc-member-months',
      targetAccountId: 'hc-premium-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Members drive premium revenue',
    },
    {
      id: 'hc-c-2',
      driverId: 'hc-pmpm-premium',
      targetAccountId: 'hc-premium-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'PMPM drives premium revenue',
    },
    {
      id: 'hc-c-3',
      driverId: 'hc-utilization',
      targetAccountId: 'hc-ip-cost',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Utilization drives IP cost',
    },
    {
      id: 'hc-c-4',
      driverId: 'hc-unit-cost',
      targetAccountId: 'hc-ip-cost',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Unit cost drives IP cost',
    },
    {
      id: 'hc-c-5',
      driverId: 'hc-risk-adj',
      targetAccountId: 'hc-ip-cost',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Risk adjustment drives IP cost',
    },
    {
      id: 'hc-c-6',
      driverId: 'hc-admin-cost',
      targetAccountId: 'hc-admin-expense',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Admin PMPM drives admin expense',
    },
  ];

  return {
    id: 'tpl-healthcare',
    name: 'Healthcare PMPM Model',
    description:
      'Healthcare payer model with member months, utilization management, PMPM cost analysis, risk adjustment, and medical loss ratio tracking.',
    industry: 'Healthcare',
    category: 'opex',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'monthly'),
    tags: ['healthcare', 'payer', 'pmpm', 'mlr', 'utilization', 'risk adjustment'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Banking
// ---------------------------------------------------------------------------

function buildBankingTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'bank-fed-funds',
      name: 'Fed Funds Rate',
      description: 'Federal funds target rate',
      unit: 'percentage',
      defaultValue: 4.5,
      minValue: 0,
      maxValue: 20,
      step: 0.25,
      category: 'Rates',
      tags: ['rates', 'monetary'],
    },
    {
      id: 'bank-loan-yield',
      name: 'Loan Yield',
      description: 'Weighted average yield on loan portfolio',
      unit: 'percentage',
      defaultValue: 6.5,
      minValue: 0,
      maxValue: 30,
      step: 0.25,
      category: 'Rates',
      tags: ['yield'],
    },
    {
      id: 'bank-deposit-cost',
      name: 'Cost of Deposits',
      description: 'Weighted average cost of deposits',
      unit: 'percentage',
      defaultValue: 2.0,
      minValue: 0,
      maxValue: 15,
      step: 0.25,
      category: 'Rates',
      tags: ['deposits'],
    },
    {
      id: 'bank-loan-volume',
      name: 'Loan Portfolio',
      description: 'Total outstanding loans',
      unit: 'currency',
      defaultValue: 5000000000,
      minValue: 0,
      maxValue: 1000000000000,
      step: 100000000,
      category: 'Volume',
      tags: ['loans'],
    },
    {
      id: 'bank-deposit-volume',
      name: 'Deposit Base',
      description: 'Total deposits outstanding',
      unit: 'currency',
      defaultValue: 6000000000,
      minValue: 0,
      maxValue: 1000000000000,
      step: 100000000,
      category: 'Volume',
      tags: ['deposits'],
    },
    {
      id: 'bank-npl-ratio',
      name: 'Non-Performing Loan Ratio',
      description: 'NPLs as % of total loans',
      unit: 'percentage',
      defaultValue: 1.2,
      minValue: 0,
      maxValue: 20,
      step: 0.1,
      category: 'Credit Quality',
      tags: ['npl', 'credit'],
    },
    {
      id: 'bank-provision-rate',
      name: 'Provision Rate',
      description: 'Loan loss provision as % of loans',
      unit: 'percentage',
      defaultValue: 0.5,
      minValue: 0,
      maxValue: 10,
      step: 0.05,
      category: 'Credit Quality',
      tags: ['provision'],
    },
    {
      id: 'bank-capital-ratio',
      name: 'Tier 1 Capital Ratio',
      description: 'Tier 1 capital as % of risk-weighted assets',
      unit: 'percentage',
      defaultValue: 12,
      minValue: 0,
      maxValue: 30,
      step: 0.5,
      category: 'Capital',
      tags: ['capital', 'basel'],
    },
    {
      id: 'bank-efficiency-ratio',
      name: 'Efficiency Ratio',
      description: 'Operating expense as % of revenue',
      unit: 'percentage',
      defaultValue: 55,
      minValue: 20,
      maxValue: 100,
      step: 1,
      category: 'Efficiency',
      tags: ['efficiency'],
    },
    {
      id: 'bank-noninterest-income',
      name: 'Non-Interest Income Pct',
      description: 'Non-interest income as % of average assets',
      unit: 'percentage',
      defaultValue: 1.5,
      minValue: 0,
      maxValue: 10,
      step: 0.1,
      category: 'Revenue',
      tags: ['fees'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'bank-net-interest-income',
      name: 'Net Interest Income',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'NII',
      isCalculated: true,
    },
    {
      id: 'bank-interest-income',
      name: 'Interest Income',
      parentId: 'bank-net-interest-income',
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Interest on loans',
      isCalculated: true,
    },
    {
      id: 'bank-interest-expense',
      name: 'Interest Expense',
      parentId: 'bank-net-interest-income',
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Interest on deposits',
      isCalculated: true,
    },
    {
      id: 'bank-nim',
      name: 'Net Interest Margin',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'NIM percentage',
      isCalculated: true,
    },
    {
      id: 'bank-npl-amount',
      name: 'Non-Performing Loans',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'NPL balance',
      isCalculated: true,
    },
    {
      id: 'bank-provision',
      name: 'Loan Loss Provision',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Credit provision',
      isCalculated: true,
    },
    {
      id: 'bank-noninterest-rev',
      name: 'Non-Interest Income',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Fee income',
      isCalculated: true,
    },
    {
      id: 'bank-total-revenue',
      name: 'Total Revenue',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'NII + Non-interest',
      isCalculated: true,
    },
    {
      id: 'bank-operating-expense',
      name: 'Operating Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total OpEx',
      isCalculated: true,
    },
    {
      id: 'bank-pretax-income',
      name: 'Pre-Tax Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Pretax profit',
      isCalculated: true,
    },
    {
      id: 'bank-net-income',
      name: 'Net Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Bottom line',
      isCalculated: true,
    },
    {
      id: 'bank-tier1-capital',
      name: 'Tier 1 Capital',
      parentId: null,
      accountType: 'equity',
      debitSide: 'credit',
      description: 'T1 capital',
      isCalculated: true,
    },
    {
      id: 'bank-roa',
      name: 'Return on Assets',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'ROA',
      isCalculated: true,
    },
    {
      id: 'bank-roe',
      name: 'Return on Equity',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'ROE',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'bank-c-1',
      driverId: 'bank-loan-yield',
      targetAccountId: 'bank-interest-income',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Yield drives interest income',
    },
    {
      id: 'bank-c-2',
      driverId: 'bank-loan-volume',
      targetAccountId: 'bank-interest-income',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Loan volume drives interest income',
    },
    {
      id: 'bank-c-3',
      driverId: 'bank-deposit-cost',
      targetAccountId: 'bank-interest-expense',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Deposit cost drives interest expense',
    },
    {
      id: 'bank-c-4',
      driverId: 'bank-deposit-volume',
      targetAccountId: 'bank-interest-expense',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Deposit volume drives interest expense',
    },
    {
      id: 'bank-c-5',
      driverId: 'bank-npl-ratio',
      targetAccountId: 'bank-npl-amount',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'NPL ratio drives NPL amount',
    },
    {
      id: 'bank-c-6',
      driverId: 'bank-provision-rate',
      targetAccountId: 'bank-provision',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Provision rate drives provision',
    },
    {
      id: 'bank-c-7',
      driverId: 'bank-efficiency-ratio',
      targetAccountId: 'bank-operating-expense',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Efficiency ratio drives OpEx',
    },
  ];

  return {
    id: 'tpl-banking',
    name: 'Banking NIM Model',
    description:
      'Banking net interest margin model with rate and volume drivers, credit quality metrics, capital adequacy ratios, and profitability analysis.',
    industry: 'Banking',
    category: 'balance-sheet',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'quarterly'),
    tags: ['banking', 'nim', 'npl', 'capital', 'roa', 'roe', 'credit'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Real Estate
// ---------------------------------------------------------------------------

function buildRealEstateTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 're-occupancy-rate',
      name: 'Occupancy Rate',
      description: 'Percentage of units occupied',
      unit: 'percentage',
      defaultValue: 93,
      minValue: 50,
      maxValue: 100,
      step: 0.5,
      category: 'Occupancy',
      tags: ['occupancy', 'vacancy'],
    },
    {
      id: 're-avg-rent',
      name: 'Average Rent per Unit',
      description: 'Monthly rent per unit',
      unit: 'currency',
      defaultValue: 1800,
      minValue: 0,
      maxValue: 50000,
      step: 50,
      category: 'Revenue',
      tags: ['rent', 'pricing'],
    },
    {
      id: 're-unit-count',
      name: 'Total Units',
      description: 'Total rentable units in portfolio',
      unit: 'count',
      defaultValue: 200,
      minValue: 0,
      maxValue: 50000,
      step: 10,
      category: 'Portfolio',
      tags: ['units', 'portfolio'],
    },
    {
      id: 're-rent-escalation',
      name: 'Annual Rent Escalation',
      description: 'Annual rent increase percentage',
      unit: 'percentage',
      defaultValue: 3,
      minValue: 0,
      maxValue: 15,
      step: 0.5,
      category: 'Revenue',
      tags: ['escalation', 'growth'],
    },
    {
      id: 're-operating-expense-ratio',
      name: 'Operating Expense Ratio',
      description: 'Operating expenses as % of revenue',
      unit: 'percentage',
      defaultValue: 42,
      minValue: 20,
      maxValue: 70,
      step: 1,
      category: 'Expenses',
      tags: ['opex', 'noi'],
    },
    {
      id: 're-cap-rate',
      name: 'Cap Rate',
      description: 'Capitalization rate for valuation',
      unit: 'percentage',
      defaultValue: 5.5,
      minValue: 2,
      maxValue: 15,
      step: 0.25,
      category: 'Valuation',
      tags: ['cap rate', 'valuation'],
    },
    {
      id: 're-vacancy-loss',
      name: 'Vacancy Loss Rate',
      description: 'Revenue loss from vacancy',
      unit: 'percentage',
      defaultValue: 5,
      minValue: 0,
      maxValue: 30,
      step: 0.5,
      category: 'Occupancy',
      tags: ['vacancy', 'loss'],
    },
    {
      id: 're-capex-psf',
      name: 'CapEx per Square Foot',
      description: 'Capital expenditure per square foot',
      unit: 'currency',
      defaultValue: 5,
      minValue: 0,
      maxValue: 100,
      step: 0.5,
      category: 'CapEx',
      tags: ['capex', 'maintenance'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 're-gross-revenue',
      name: 'Gross Potential Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Max revenue at 100% occupancy',
      isCalculated: true,
    },
    {
      id: 're-vacancy-loss',
      name: 'Vacancy Loss',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'debit',
      description: 'Revenue lost to vacancy',
      isCalculated: true,
    },
    {
      id: 're-effective-revenue',
      name: 'Effective Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Revenue after vacancy',
      isCalculated: true,
    },
    {
      id: 're-operating-expense',
      name: 'Operating Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total property operating costs',
      isCalculated: true,
    },
    {
      id: 're-noi',
      name: 'Net Operating Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'NOI',
      isCalculated: true,
    },
    {
      id: 're-noi-margin',
      name: 'NOI Margin',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'NOI as % of revenue',
      isCalculated: true,
    },
    {
      id: 're-capex',
      name: 'Capital Expenditures',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total CapEx',
      isCalculated: true,
    },
    {
      id: 're-cash-flow',
      name: 'Free Cash Flow',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'NOI minus CapEx',
      isCalculated: true,
    },
    {
      id: 're-property-value',
      name: 'Implied Property Value',
      parentId: null,
      accountType: 'asset',
      debitSide: 'debit',
      description: 'NOI / Cap Rate',
      isCalculated: true,
    },
    {
      id: 're-rent-per-sqft',
      name: 'Rent per Square Foot',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Annual rent per sqft',
      isCalculated: true,
    },
    {
      id: 're-occupied-units',
      name: 'Occupied Units',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Units currently occupied',
      isCalculated: true,
    },
    {
      id: 're-revenue-per-unit',
      name: 'Revenue per Unit',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Monthly revenue per unit',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 're-c-1',
      driverId: 're-avg-rent',
      targetAccountId: 're-gross-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Average rent drives gross revenue',
    },
    {
      id: 're-c-2',
      driverId: 're-unit-count',
      targetAccountId: 're-gross-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Unit count drives gross revenue',
    },
    {
      id: 're-c-3',
      driverId: 're-occupancy-rate',
      targetAccountId: 're-occupied-units',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Occupancy drives occupied units',
    },
    {
      id: 're-c-4',
      driverId: 're-vacancy-loss',
      targetAccountId: 're-vacancy-loss',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Vacancy rate drives loss',
    },
    {
      id: 're-c-5',
      driverId: 're-operating-expense-ratio',
      targetAccountId: 're-operating-expense',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'OER drives operating expenses',
    },
    {
      id: 're-c-6',
      driverId: 're-cap-rate',
      targetAccountId: 're-property-value',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'x > 0 ? current / (x / 100) : 0',
      description: 'Cap rate drives property value',
    },
  ];

  return {
    id: 'tpl-real-estate',
    name: 'Real Estate Portfolio Model',
    description:
      'Commercial real estate model with occupancy, NOI, cap rate valuation, operating expense ratios, and cash flow analysis.',
    industry: 'Real Estate',
    category: 'cashflow',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'monthly'),
    tags: ['real estate', 'noi', 'cap rate', 'occupancy', 'property', 'valuation', 'cash flow'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Energy
// ---------------------------------------------------------------------------

function buildEnergyTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'en-production-volume',
      name: 'Production Volume',
      description: 'Barrels of oil equivalent per day',
      unit: 'count',
      defaultValue: 50000,
      minValue: 0,
      maxValue: 1000000,
      step: 1000,
      category: 'Production',
      tags: ['production', 'volume'],
    },
    {
      id: 'en-commodity-price',
      name: 'Commodity Price',
      description: 'Price per barrel of oil equivalent',
      unit: 'currency',
      defaultValue: 75,
      minValue: 0,
      maxValue: 200,
      step: 1,
      category: 'Pricing',
      tags: ['price', 'commodity'],
    },
    {
      id: 'en-royalty-rate',
      name: 'Royalty Rate',
      description: 'Royalty payments as % of revenue',
      unit: 'percentage',
      defaultValue: 12.5,
      minValue: 0,
      maxValue: 30,
      step: 0.5,
      category: 'Cost',
      tags: ['royalty'],
    },
    {
      id: 'en-lifting-cost',
      name: 'Lifting Cost per BOE',
      description: 'Operating cost per barrel produced',
      unit: 'currency',
      defaultValue: 12,
      minValue: 0,
      maxValue: 100,
      step: 0.5,
      category: 'Cost',
      tags: ['lifting', 'opex'],
    },
    {
      id: 'en-dda-rate',
      name: 'DD&A Rate',
      description: 'Depletion, depreciation, amortization rate',
      unit: 'percentage',
      defaultValue: 15,
      minValue: 0,
      maxValue: 50,
      step: 1,
      category: 'DD&A',
      tags: ['depletion', 'depreciation'],
    },
    {
      id: 'en-decline-rate',
      name: 'Production Decline Rate',
      description: 'Annual production decline rate',
      unit: 'percentage',
      defaultValue: 8,
      minValue: 0,
      maxValue: 40,
      step: 1,
      category: 'Production',
      tags: ['decline', 'reserves'],
    },
    {
      id: 'en-capex-budget',
      name: 'CapEx Budget',
      description: 'Annual capital expenditure budget',
      unit: 'currency',
      defaultValue: 200000000,
      minValue: 0,
      maxValue: 50000000000,
      step: 1000000,
      category: 'CapEx',
      tags: ['capex', 'drilling'],
    },
    {
      id: 'en-tax-rate',
      name: 'Effective Tax Rate',
      description: 'Corporate effective tax rate',
      unit: 'percentage',
      defaultValue: 25,
      minValue: 0,
      maxValue: 50,
      step: 1,
      category: 'Tax',
      tags: ['tax'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'en-revenue',
      name: 'Total Revenue',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Total commodity revenue',
      isCalculated: true,
    },
    {
      id: 'en-royalty-expense',
      name: 'Royalty Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Royalty payments',
      isCalculated: true,
    },
    {
      id: 'en-net-revenue',
      name: 'Net Revenue',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Revenue minus royalties',
      isCalculated: true,
    },
    {
      id: 'en-lifting-cost-total',
      name: 'Total Lifting Cost',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total operating costs',
      isCalculated: true,
    },
    {
      id: 'en-dda',
      name: 'DD&A Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Depletion, depreciation, amortization',
      isCalculated: true,
    },
    {
      id: 'en-operating-income',
      name: 'Operating Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Net revenue minus lifting and DD&A',
      isCalculated: true,
    },
    {
      id: 'en-capex',
      name: 'Capital Expenditures',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Total CapEx',
      isCalculated: true,
    },
    {
      id: 'en-pre-tax-income',
      name: 'Pre-Tax Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Income before taxes',
      isCalculated: true,
    },
    {
      id: 'en-tax-expense',
      name: 'Tax Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Corporate tax',
      isCalculated: true,
    },
    {
      id: 'en-net-income',
      name: 'Net Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Bottom line',
      isCalculated: true,
    },
    {
      id: 'en-boe-per-day',
      name: 'BOE per Day',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Daily production rate',
      isCalculated: true,
    },
    {
      id: 'en-boe-per-year',
      name: 'Annual BOE',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Annual production volume',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'en-c-1',
      driverId: 'en-production-volume',
      targetAccountId: 'en-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Volume drives revenue',
    },
    {
      id: 'en-c-2',
      driverId: 'en-commodity-price',
      targetAccountId: 'en-revenue',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Price drives revenue',
    },
    {
      id: 'en-c-3',
      driverId: 'en-royalty-rate',
      targetAccountId: 'en-royalty-expense',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'Royalty rate drives royalty expense',
    },
    {
      id: 'en-c-4',
      driverId: 'en-lifting-cost',
      targetAccountId: 'en-lifting-cost-total',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Lifting cost per unit drives total',
    },
    {
      id: 'en-c-5',
      driverId: 'en-decline-rate',
      targetAccountId: 'en-boe-per-day',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * (1 - x / 100)',
      description: 'Decline rate reduces production',
    },
    {
      id: 'en-c-6',
      driverId: 'en-dda-rate',
      targetAccountId: 'en-dda',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'DD&A rate drives depletion',
    },
  ];

  return {
    id: 'tpl-energy',
    name: 'Energy Upstream Model',
    description:
      'Upstream energy model with production volumes, commodity pricing, lifting costs, DD&A, and reserve economics for oil and gas companies.',
    industry: 'Energy',
    category: 'revenue',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'monthly'),
    tags: ['energy', 'oil', 'gas', 'upstream', 'production', 'commodity', 'reserves'],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Built-in Template: Insurance
// ---------------------------------------------------------------------------

function buildInsuranceTemplate(): FPTemplate {
  const drivers: DriverDefinition[] = [
    {
      id: 'ins-gwp',
      name: 'Gross Written Premium',
      description: 'Total premiums written',
      unit: 'currency',
      defaultValue: 500000000,
      minValue: 0,
      maxValue: 50000000000,
      step: 1000000,
      category: 'Premium',
      tags: ['premium', 'gwp'],
    },
    {
      id: 'ins-loss-ratio',
      name: 'Loss Ratio',
      description: 'Claims paid as % of earned premium',
      unit: 'percentage',
      defaultValue: 62,
      minValue: 30,
      maxValue: 120,
      step: 1,
      category: 'Claims',
      tags: ['loss', 'claims'],
    },
    {
      id: 'ins-expense-ratio',
      name: 'Expense Ratio',
      description: 'Operating expenses as % of written premium',
      unit: 'percentage',
      defaultValue: 28,
      minValue: 10,
      maxValue: 50,
      step: 1,
      category: 'Expenses',
      tags: ['expense'],
    },
    {
      id: 'ins-commission-rate',
      name: 'Commission Rate',
      description: 'Agent commissions as % of premium',
      unit: 'percentage',
      defaultValue: 12,
      minValue: 0,
      maxValue: 30,
      step: 0.5,
      category: 'Distribution',
      tags: ['commission'],
    },
    {
      id: 'ins-reserve-ratio',
      name: 'Reserve Ratio',
      description: 'Loss reserves as % of earned premium',
      unit: 'percentage',
      defaultValue: 80,
      minValue: 30,
      maxValue: 200,
      step: 5,
      category: 'Reserves',
      tags: ['reserves', 'ibnr'],
    },
    {
      id: 'ins-investment-yield',
      name: 'Investment Yield',
      description: 'Return on invested assets',
      unit: 'percentage',
      defaultValue: 3.5,
      minValue: 0,
      maxValue: 15,
      step: 0.25,
      category: 'Investment',
      tags: ['investment', 'float'],
    },
    {
      id: 'ins-retention-rate',
      name: 'Policy Retention Rate',
      description: 'Percentage of policies renewed',
      unit: 'percentage',
      defaultValue: 88,
      minValue: 50,
      maxValue: 100,
      step: 1,
      category: 'Retention',
      tags: ['retention', 'renewal'],
    },
    {
      id: 'ins-combined-ratio-target',
      name: 'Target Combined Ratio',
      description: 'Target loss + expense ratio',
      unit: 'percentage',
      defaultValue: 95,
      minValue: 70,
      maxValue: 120,
      step: 1,
      category: 'Underwriting',
      tags: ['combined'],
    },
  ];

  const accounts: AccountDefinition[] = [
    {
      id: 'ins-gwp',
      name: 'Gross Written Premium',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Total premiums written',
      isCalculated: true,
    },
    {
      id: 'ins-earned-premium',
      name: 'Net Earned Premium',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Premium earned after reinsurance',
      isCalculated: true,
    },
    {
      id: 'ins-loss-expense',
      name: 'Loss & Loss Adjustment Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Claims paid + LAE',
      isCalculated: true,
    },
    {
      id: 'ins-commission-expense',
      name: 'Commission Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Agent commissions',
      isCalculated: true,
    },
    {
      id: 'ins-underwriting-expense',
      name: 'Underwriting Expense',
      parentId: null,
      accountType: 'expense',
      debitSide: 'debit',
      description: 'Operating expenses',
      isCalculated: true,
    },
    {
      id: 'ins-combined-ratio',
      name: 'Combined Ratio',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Loss + expense ratio',
      isCalculated: true,
    },
    {
      id: 'ins-underwriting-income',
      name: 'Underwriting Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Premium minus all costs',
      isCalculated: true,
    },
    {
      id: 'ins-investment-income',
      name: 'Investment Income',
      parentId: null,
      accountType: 'revenue',
      debitSide: 'credit',
      description: 'Return on float',
      isCalculated: true,
    },
    {
      id: 'ins-net-income',
      name: 'Net Income',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'Bottom line',
      isCalculated: true,
    },
    {
      id: 'ins-loss-reserves',
      name: 'Loss Reserves',
      parentId: null,
      accountType: 'liability',
      debitSide: 'credit',
      description: 'Outstanding claims reserves',
      isCalculated: true,
    },
    {
      id: 'ins-policy-count',
      name: 'Policy Count',
      parentId: null,
      accountType: 'memo',
      debitSide: 'debit',
      description: 'Total active policies',
      isCalculated: true,
    },
    {
      id: 'ins-avg-premium',
      name: 'Average Premium per Policy',
      parentId: null,
      accountType: 'memo',
      debitSide: 'credit',
      description: 'GWP / Policy Count',
      isCalculated: true,
    },
  ];

  const cascadeRules: CascadeRuleDefinition[] = [
    {
      id: 'ins-c-1',
      driverId: 'ins-loss-ratio',
      targetAccountId: 'ins-loss-expense',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'Loss ratio drives claims',
    },
    {
      id: 'ins-c-2',
      driverId: 'ins-gwp',
      targetAccountId: 'ins-gwp',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'GWP drives revenue',
    },
    {
      id: 'ins-c-3',
      driverId: 'ins-commission-rate',
      targetAccountId: 'ins-commission-expense',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'Commission rate drives commission expense',
    },
    {
      id: 'ins-c-4',
      driverId: 'ins-expense-ratio',
      targetAccountId: 'ins-underwriting-expense',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'Expense ratio drives underwriting expense',
    },
    {
      id: 'ins-c-5',
      driverId: 'ins-reserve-ratio',
      targetAccountId: 'ins-loss-reserves',
      cascadeType: 'formula',
      impactType: 'replacement',
      weight: 1,
      formula: 'current * x / 100',
      description: 'Reserve ratio drives reserves',
    },
    {
      id: 'ins-c-6',
      driverId: 'ins-retention-rate',
      targetAccountId: 'ins-policy-count',
      cascadeType: 'direct',
      impactType: 'multiplicative',
      weight: 1,
      description: 'Retention drives policy count',
    },
  ];

  return {
    id: 'tpl-insurance',
    name: 'Insurance Underwriting Model',
    description:
      'Property & casualty insurance model with combined ratio analysis, loss development, investment income, reserve adequacy, and policy retention tracking.',
    industry: 'Insurance',
    category: 'revenue',
    version: '1.0.0',
    drivers,
    cascadeRules,
    accounts,
    periods: makePeriodRange('2026-01', '2026-12', 'quarterly'),
    tags: [
      'insurance',
      'underwriting',
      'combined ratio',
      'loss ratio',
      'premium',
      'reserves',
      'float',
    ],
    isCustom: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

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
    periods?: PeriodRange;
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
      periods: params.periods ?? makePeriodRange('2026-01', '2026-12', 'monthly'),
      tags: params.tags,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    this.customTemplates.set(id, template);
    return template;
  }

  removeCustomTemplate(id: string): boolean {
    if (!this.customTemplates.has(id)) return false;
    this.customTemplates.delete(id);
    return true;
  }

  getCustomTemplates(): FPTemplate[] {
    return Array.from(this.customTemplates.values());
  }

  // --- Validation ---

  validateParameters(templateId: string, parameters: Record<string, number>): ValidationResult {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { valid: false, errors: [`Template "${templateId}" not found`] };
    }

    const errors: string[] = [];
    const driverMap = new Map(template.drivers.map((d) => [d.id, d]));

    for (const [key, value] of Object.entries(parameters)) {
      const driver = driverMap.get(key);
      if (!driver) {
        errors.push(`Unknown driver: "${key}"`);
        continue;
      }

      if (typeof value !== 'number' || !Number.isFinite(value)) {
        errors.push(`Parameter "${key}" must be a finite number, got ${String(value)}`);
        continue;
      }

      if (value < driver.minValue) {
        errors.push(`Parameter "${key}" value ${value} is below minimum ${driver.minValue}`);
      }

      if (value > driver.maxValue) {
        errors.push(`Parameter "${key}" value ${value} is above maximum ${driver.maxValue}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateTemplate(template: FPTemplate): ValidationResult {
    const errors: string[] = [];

    if (!template.id.trim()) errors.push('Template id is required');
    if (!template.name.trim()) errors.push('Template name is required');
    if (!template.description.trim()) errors.push('Template description is required');
    if (template.drivers.length === 0) errors.push('Template must have at least one driver');
    if (template.accounts.length === 0) errors.push('Template must have at least one account');

    const driverIds = new Set(template.drivers.map((d) => d.id));
    for (const rule of template.cascadeRules) {
      if (!driverIds.has(rule.driverId)) {
        errors.push(`Cascade rule "${rule.id}" references unknown driver "${rule.driverId}"`);
      }
    }

    const accountIds = new Set(template.accounts.map((a) => a.id));
    for (const rule of template.cascadeRules) {
      if (!accountIds.has(rule.targetAccountId)) {
        errors.push(
          `Cascade rule "${rule.id}" references unknown account "${rule.targetAccountId}"`
        );
      }
    }

    for (const driver of template.drivers) {
      if (driver.minValue > driver.maxValue) {
        errors.push(`Driver "${driver.id}" has minValue > maxValue`);
      }
      if (driver.defaultValue < driver.minValue || driver.defaultValue > driver.maxValue) {
        errors.push(`Driver "${driver.id}" defaultValue is out of range`);
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
