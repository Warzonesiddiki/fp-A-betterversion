// =============================================================================
// TEMPLATE INDEX -- Aggregates all production templates into a single registry
// Import this to register all templates with the TemplateLibrary.
// =============================================================================

import type { FPTemplate } from '../engines/TemplateLibrary';

import { buildAnnualOperatingBudgetTemplate } from './AnnualOperatingBudget';
import { buildThreeStatementModel } from './ThreeStatementModel';
import { buildCashFlowForecastTemplate } from './CashFlowForecast';
import { buildHeadcountPlanTemplate } from './HeadcountPlan';
import { buildCapExPlanTemplate } from './CapExPlan';
import { buildConstructionProjectCostingTemplate } from './ConstructionProjectCosting';
import { buildEnergySectorPlanningTemplate } from './EnergySectorPlanning';
import { buildGovernmentBudgetTemplate } from './GovernmentBudget';
import { buildTechSaaSCompanyTemplate } from './TechSaaSCompany';
import { buildHealthcareRevenueCycleTemplate } from './HealthcareRevenueCycle';
import { buildRetailStorePerformanceTemplate } from './RetailStorePerformance';
import { buildManufacturingCOGSTemplate } from './ManufacturingCOGS';
import { buildBankingNIMTemplate } from './BankingNIM';
import { buildRealEstatePortfolioTemplate } from './RealEstatePortfolio';

/**
 * Returns all production-quality templates. Each template includes:
 * - Realistic default data (not placeholder/lorem ipsum)
 * - Full chart of accounts with parent-child hierarchy
 * - Driver definitions with min/max/step ranges
 * - Cascade rules linking drivers to accounts
 * - Pre-populated for a specific company/scenario
 */
export function getAllTemplates(): FPTemplate[] {
  return [
    buildAnnualOperatingBudgetTemplate(),
    buildThreeStatementModel(),
    buildCashFlowForecastTemplate(),
    buildHeadcountPlanTemplate(),
    buildCapExPlanTemplate(),
    buildManufacturingCOGSTemplate(),
    buildRetailStorePerformanceTemplate(),
    buildHealthcareRevenueCycleTemplate(),
    buildConstructionProjectCostingTemplate(),
    buildEnergySectorPlanningTemplate(),
    buildBankingNIMTemplate(),
    buildRealEstatePortfolioTemplate(),
    buildGovernmentBudgetTemplate(),
    buildTechSaaSCompanyTemplate(),
  ];
}

/**
 * Registers all production templates with an existing TemplateLibrary instance.
 */
export function registerProductionTemplates(register: (tpl: FPTemplate) => void): void {
  for (const tpl of getAllTemplates()) {
    register(tpl);
  }
}

export {
  buildAnnualOperatingBudgetTemplate,
  buildThreeStatementModel,
  buildCashFlowForecastTemplate,
  buildHeadcountPlanTemplate,
  buildCapExPlanTemplate,
  buildManufacturingCOGSTemplate,
  buildRetailStorePerformanceTemplate,
  buildHealthcareRevenueCycleTemplate,
  buildConstructionProjectCostingTemplate,
  buildEnergySectorPlanningTemplate,
  buildBankingNIMTemplate,
  buildRealEstatePortfolioTemplate,
  buildGovernmentBudgetTemplate,
  buildTechSaaSCompanyTemplate,
};
