// ── Engines barrel (sorted alphabetically) ──────────────────────────────────

export { AICopilotEngine } from './AICopilotEngine';
export { AIEngine } from './AIEngine';
export { AdvancedExcelEngine } from './AdvancedExcelEngine';
export { AdvancedOLAPEngine } from './AdvancedOLAPEngine';
export { AdvancedPDFEngine } from './AdvancedPDFEngine';
export { AggregateTableEngine } from './AggregateTableEngine';
export { AggregationDesigner } from './AggregationDesigner';
export { AllocationEngine } from './AllocationEngine';
export { AllocationRuleEngine } from './AllocationRuleEngine';
export { AnomalyDetectionEngine } from './AnomalyDetectionEngine';
export { AnomalyExplainer } from './AnomalyExplainer';
export { ArrayFormulaEngine } from './ArrayFormulaEngine';
export { AssumptionEngine } from './AssumptionEngine';
export { AuditEngine } from './AuditEngine';
export { AuditLogEngine } from './AuditLogEngine';
export { AutoCommentaryEngine } from './AutoCommentaryEngine';
export { AutoSaveEngine } from './AutoSaveEngine';
export { BankingEngine } from './BankingEngine';
export { BatchOperationEngine } from './BatchOperationEngine';
export { BondPricingEngine } from './BondPricingEngine';
export { BreakEvenEngine } from './BreakEvenEngine';
export { BudgetCollectionEngine } from './BudgetCollectionEngine';
export { COGSVarianceEngine } from './COGSVarianceEngine';
export { CalculationGraph } from './CalculationGraph';
export { CalculationQueue } from './CalculationQueue';
export { CapExEngine } from './CapExEngine';
export { CashEngine } from './CashEngine';
export { CashFlowWaterfallEngine } from './CashFlowWaterfallEngine';
export { CellAuditTrailEngine } from './CellAuditTrailEngine';
export { CellCommentEngine } from './CellCommentEngine';
export { CellProtectionEngine } from './CellProtectionEngine';
export { CellValidationEngine } from './CellValidationEngine';
export { ChartAnnotationEngine } from './ChartAnnotationEngine';
export { ComplianceEngine } from './ComplianceEngine';
export {
  createVarianceHighlightRule,
  createNegativeVarianceRule,
  createGrowthRateRule,
  createBudgetVsActualRule,
  generateRuleId,
  evaluateRule,
  evaluateRules,
  reorderRules,
  buildStyleFromFormat,
  DEFAULT_RULES,
} from './ConditionalFormattingEngine';
export { ConnectorEngine } from './ConnectorEngine';
export { ConsolidationAdjustmentsEngine } from './ConsolidationAdjustmentsEngine';
export { ConsolidationEngine } from './ConsolidationEngine';
export { ConstructionEngine } from './ConstructionEngine';
export { CrashRecoveryEngine } from './CrashRecoveryEngine';
export { CreditRiskEngine } from './CreditRiskEngine';
export { CubeEngine } from './CubeEngine';
export { CubeEnginePersistence } from './CubeEnginePersistence';
export { CubeMigrationEngine } from './CubeMigrationEngine';
export { CubePartitioner } from './CubePartitioner';
export { CubeSecurityEngine } from './CubeSecurityEngine';
export { CustomFieldEngine } from './CustomFieldEngine';
export { DashboardBuilderEngine } from './DashboardBuilderEngine';
export { DataCatalogEngine } from './DataCatalogEngine';
export { DataClassificationEngine } from './DataClassificationEngine';
export { DataGovernanceEngine } from './DataGovernanceEngine';
export { DataLineageEngine } from './DataLineageEngine';
export { DataMaskingEngine } from './DataMaskingEngine';
export { DataQualityEngine } from './DataQualityEngine';
export { DataRetentionEngine } from './DataRetentionEngine';
export { DebtScheduleEngine } from './DebtScheduleEngine';
export { DepreciationEngine } from './DepreciationEngine';
export { DimensionalModelingEngine } from './DimensionalModelingEngine';
export { DocumentEngine } from './DocumentEngine';
export { DrillThroughEngine } from './DrillThroughEngine';
export { DriverCascadeEngine } from './DriverCascadeEngine';
export { DriverLibrary } from './DriverLibrary';
export { ESGEngine } from './ESGEngine';
export { ETLPipelineEngine } from './ETLPipelineEngine';
export { EncryptionEngine } from './EncryptionEngine';
export { EnergyEngine } from './EnergyEngine';
export { engineRegistry } from './EngineRegistry';
export { ExcelImportEngine } from './ExcelImportEngine';
export { ExcelKeyboardEngine } from './ExcelKeyboardEngine';
export { ExcelKeyboardShortcuts } from './ExcelKeyboardShortcuts';
export { ExportEngine } from './ExportEngine';
export { ExportTemplateEngine } from './ExportTemplateEngine';
export { FXEngine } from './FXEngine';
export { FairValueEngine } from './FairValueEngine';
export { FinPlanFileEngine } from './FinPlanFileEngine';
export { FinanceCopilotEngine } from './FinanceCopilotEngine';
export { FinancialInstrumentsEngine } from './FinancialInstrumentsEngine';
export { FiscalCalendar } from './FiscalCalendar';
export { ForecastMethodEngine } from './ForecastMethodEngine';
export { ForecastReconciliationEngine } from './ForecastReconciliationEngine';
export { FormulaAutoCompleteEngine } from './FormulaAutoCompleteEngine';
export { FormulaEngine } from './FormulaEngine';
// FormulaFunctionRegistry — removed from barrel to preserve EngineRegistry dynamic import splitting.
// Import directly: import { FormulaFunctionRegistry } from '@/engines/FormulaFunctionRegistry';
// StateMachine — removed from barrel to preserve EngineRegistry dynamic import splitting.
// Import directly: import { StateMachine } from '@/engines/StateMachine';
export { GlobalSearchEngine } from './GlobalSearchEngine';
export { GoalSeekEngine } from './GoalSeekEngine';
export { GridOfflineEngine } from './GridOfflineEngine';
export { GroupOutlineEngine } from './GroupOutlineEngine';
export { HealthcareEngine } from './HealthcareEngine';
export { ICMatchingEngine } from './ICMatchingEngine';
export { ImpairmentEngine } from './ImpairmentEngine';
export { ImportEngine } from './ImportEngine';
export { IncrementalCalcEngine } from './IncrementalCalcEngine';
export { InsuranceEngine } from './InsuranceEngine';
export { IntercompanyMatchingEngine } from './IntercompanyMatchingEngine';
export { InventoryEngine } from './InventoryEngine';
export {
  DEFAULT_ITERATIVE_CONFIG,
  buildDependencyGraph,
  getCircularCells,
  solveIteratively,
  analyzeFormulas,
} from './IterativeCalculationEngine';
export { LeaseEngine } from './LeaseEngine';
export { LoanAmortizationEngine } from './LoanAmortizationEngine';
export { MDXEngine } from './MDXEngine';
export { ManufacturingEngine } from './ManufacturingEngine';
export { MasterDataEngine } from './MasterDataEngine';
export { MigrationEngine } from './MigrationEngine';
export { MonteCarloEngine } from './MonteCarloEngine';
export { MultiBookEngine } from './MultiBookEngine';
export { MultiCurrencyEngine } from './MultiCurrencyEngine';
export { NLQEngine } from './NLQEngine';
export { NamedRangeEngine } from './NamedRangeEngine';
export { OptionPricingEngine } from './OptionPricingEngine';
export { PeriodCloseEngine } from './PeriodCloseEngine';
export { PivotTableEngine } from './PivotTableEngine';
export { PluginEngine } from './PluginEngine';
export { ProfessionalExportEngine } from './ProfessionalExportEngine';
export { QueryCache } from './QueryCache';
export { RBACEngine } from './RBACEngine';
export { RealEstateEngine } from './RealEstateEngine';
export { RecentFilesEngine } from './RecentFilesEngine';
export { ReconciliationEngine } from './ReconciliationEngine';
export { ReportBookEngine } from './ReportBookEngine';
export { ReportBuilderEngine } from './ReportBuilderEngine';
export { ReportCacheEngine } from './ReportCacheEngine';
export { ReportDistributionEngine } from './ReportDistributionEngine';
export {
  generateProfitAndLossLayout,
  generateBalanceSheetLayout,
  renderSectionToHTML,
} from './ReportLayoutEngine';
export { ReportSchedulerEngine } from './ReportSchedulerEngine';
export { ReportSchedulingEngine } from './ReportSchedulingEngine';
export { ReportVersionEngine } from './ReportVersionEngine';
export { RetailEngine } from './RetailEngine';
export { RevRecEngine } from './RevRecEngine';
export { RollingForecastEngine } from './RollingForecastEngine';
export { SOXComplianceEngine } from './SOXComplianceEngine';
export { SaaSMetricsEngine } from './SaaSMetricsEngine';
export { SafeMathParser } from './SafeMathParser';
export { ScenarioEngine } from './ScenarioEngine';
export { SegmentReportingEngine } from './SegmentReportingEngine';
export { SensitivityEngine } from './SensitivityEngine';
export { SensitivityTableEngine } from './SensitivityTableEngine';
export { SessionEngine } from './SessionEngine';
export { SignConventionEngine } from './SignConventionEngine';
export { SmartImportMapper } from './SmartImportMapper';
export { SmartImportMapping } from './SmartImportMapping';
export { SolverEngine } from './SolverEngine';
export { SpreadEngine } from './SpreadEngine';
// StateMachine removed — see comment above FormulaFunctionRegistry
export { StreamImportEngine } from './StreamImportEngine';
export { SyncEngine } from './SyncEngine';
export { TaxEngine } from './TaxEngine';
export { TemplateEngine } from './TemplateEngine';
export { TemplateLibrary } from './TemplateLibrary';
export { ThreeStatementEngine } from './ThreeStatementEngine';
export { UndoRedoEngine } from './UndoRedoEngine';
export { ValidationEngine } from './ValidationEngine';
export { VarianceDecompositionEngine } from './VarianceDecompositionEngine';
export { VersionControlEngine } from './VersionControlEngine';
export { VisualWorkflowEngine } from './VisualWorkflowEngine';
export { WaterfallBridgeEngine } from './WaterfallBridgeEngine';
export { WhatIfSandboxEngine } from './WhatIfSandboxEngine';
export { WindowStateManager } from './WindowStateManager';
export { WorkflowActionEngine } from './WorkflowActionEngine';
export { WorkflowBuilderEngine } from './WorkflowBuilderEngine';
export { WorkflowEngine } from './WorkflowEngine';
export { WorkflowSchedulerEngine } from './WorkflowSchedulerEngine';
export { WorkflowTemplateEngine } from './WorkflowTemplateEngine';
export { WorkflowTriggerEngine } from './WorkflowTriggerEngine';
export { WorkforceEngine } from './WorkforceEngine';
export { WorkingCapitalEngine } from './WorkingCapitalEngine';
export { XBRLEngine } from './XBRLEngine';
export { YieldCurveEngine } from './YieldCurveEngine';

// ── Utility modules ─────────────────────────────────────────────────────────
export { default as exportToExcel } from './exportExcel';
export {
  generatePDFMetadata,
  exportLayout,
  importLayout,
  generateExcelExport,
  generateCSVExport,
  exportReport,
} from './report-builder-export';
export {
  parseFormulaReferences,
  evaluateFormula,
  safeEvaluate,
  columnLetterToIndex,
  columnIndexToLetter,
  buildBindingKey,
  resolveCellValue,
  resolveLayout,
  buildMetricKey,
  detectCircularReferences,
  calculateColumnSum,
  identifySectionRanges,
  autoPopulateTotals,
  getSections,
  addParameter,
  updateParameterValue,
  removeParameter,
  getParameters,
} from './report-builder-formulas';
export {
  generateReportId,
  createEmptyCell,
  createEmptyLayout,
  getTemplateLayout,
  getAvailableTemplates,
} from './report-builder-templates';

// ── Type-only re-exports ────────────────────────────────────────────────────
export type { CurvePoint } from './YieldCurveEngine';
export type { Financials } from './CreditRiskEngine';
export type { FXRateEntry, HistoricalRate, RateType } from './FXEngine';
