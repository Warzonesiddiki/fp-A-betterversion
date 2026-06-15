// ── Engines barrel (sorted alphabetically) ──────────────────────────────────

export { AICopilotEngine } from './AICopilotEngine';
// export { AIEngine } from './AIEngine'; // barrel-export disabled for dynamic import splitting
export { AdvancedExcelEngine } from './AdvancedExcelEngine';
export { AdvancedOLAPEngine } from './AdvancedOLAPEngine';
export { AdvancedPDFEngine } from './AdvancedPDFEngine';
export { AggregateTableEngine } from './AggregateTableEngine';
export { AggregationDesigner } from './AggregationDesigner';
// export { AllocationEngine } from './AllocationEngine'; // barrel-export disabled for dynamic import splitting
export { AllocationRuleEngine } from './AllocationRuleEngine';
export { AnomalyDetectionEngine } from './AnomalyDetectionEngine'; // RE-ENABLED 2026-06-15
export { AnomalyExplainer } from './AnomalyExplainer';
export { ArrayFormulaEngine } from './ArrayFormulaEngine';
export { AssumptionEngine } from './AssumptionEngine';
// export { AuditEngine } from './AuditEngine'; // barrel-export disabled for dynamic import splitting
export { AuditLogEngine } from './AuditLogEngine';
export {
  AuditTrailEngine,
  type AuditEntry,
  type AuditQuery,
  type AuditAction,
  type EntityType,
  type MerkleProof,
  type TamperDetectionResult,
  type SOXExport,
} from './AuditTrailEngine';
export { AutoCommentaryEngine } from './AutoCommentaryEngine';
// export { AutoSaveEngine } from './AutoSaveEngine'; // barrel-export disabled for dynamic import splitting
export { BankingEngine } from './BankingEngine';
export { BatchOperationEngine } from './BatchOperationEngine';
// barrel-export disabled for dynamic import splitting // BondPricingEngine from './BondPricingEngine'; // barrel-export disabled for dynamic import splitting
export { BreakEvenEngine } from './BreakEvenEngine';
export { BudgetCollectionEngine } from './BudgetCollectionEngine';
export { COGSVarianceEngine } from './COGSVarianceEngine';
// export { CalculationGraph } from './CalculationGraph'; // barrel-export disabled for dynamic import splitting
export { CalculationQueue } from './CalculationQueue';
export { CapExEngine } from './CapExEngine';
export {
  CascadeCalculationEngine,
  type OwnershipNode,
  type CascadeICPair,
  type CascadeFXRate,
  type CascadeStep,
  type CascadeResult,
  type CascadeMethod,
} from './CascadeCalculationEngine';
export { CashEngine } from './CashEngine';
export { CashFlowWaterfallEngine } from './CashFlowWaterfallEngine';
export { CellAuditTrailEngine } from './CellAuditTrailEngine';
export { CellCommentEngine } from './CellCommentEngine';
export { CellProtectionEngine } from './CellProtectionEngine';
export { CellValidationEngine } from './CellValidationEngine';
export { ChartAnnotationEngine } from './ChartAnnotationEngine';
// export { ComplianceEngine } from './ComplianceEngine'; // barrel-export disabled for dynamic import splitting
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
// export { ConnectorEngine } from './ConnectorEngine'; // barrel-export disabled for dynamic import splitting
export { ConsolidationAdjustmentsEngine } from './ConsolidationAdjustmentsEngine';
// export { ConsolidationEngine } from './ConsolidationEngine'; // barrel-export disabled for dynamic import splitting
export { ConstructionEngine } from './ConstructionEngine';
// export { CrashRecoveryEngine } from './CrashRecoveryEngine'; // barrel-export disabled for dynamic import splitting
export { CreditRiskEngine } from './CreditRiskEngine';
// export { CubeEngine } from './CubeEngine'; // barrel-export disabled for dynamic import splitting
export { CubeEnginePersistence } from './CubeEnginePersistence';
export { CubeMigrationEngine } from './CubeMigrationEngine';
export { CubePartitioner } from './CubePartitioner';
export { CubeSecurityEngine } from './CubeSecurityEngine';
export { CustomFieldEngine } from './CustomFieldEngine';
// export { DashboardBuilderEngine } from './DashboardBuilderEngine'; // barrel-export disabled for dynamic import splitting
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
// export { DriverCascadeEngine } from './DriverCascadeEngine'; // barrel-export disabled for dynamic import splitting
export { DriverLibrary } from './DriverLibrary';
// export { ESGEngine } from './ESGEngine'; // barrel-export disabled for dynamic import splitting
export { ETLPipelineEngine } from './ETLPipelineEngine';
export { EncryptionEngine } from './EncryptionEngine';
export { EnergyEngine } from './EnergyEngine';
export { engineRegistry } from './EngineRegistry';
// export { ExcelImportEngine } from './ExcelImportEngine'; // barrel-export disabled for dynamic import splitting
export { ExcelKeyboardEngine } from './ExcelKeyboardEngine';
export { ExcelKeyboardShortcuts } from './ExcelKeyboardShortcuts';
export { ExportEngine } from './ExportEngine'; // barrel-export disabled for dynamic import splitting
export { ExportTemplateEngine } from './ExportTemplateEngine';
// export { FXEngine } from './FXEngine'; // barrel-export disabled for dynamic import splitting
export { FairValueEngine } from './FairValueEngine';
export { FinPlanFileEngine } from './FinPlanFileEngine';
export { FinanceCopilotEngine } from './FinanceCopilotEngine';
export {
  FinancialCloseEngine,
  type CloseTask,
  type CloseTaskInstance,
  type ClosePlan,
  type CloseTaskStatus,
  type CloseTaskPriority,
  type ClosePeriod,
  type CloseApproverRole,
  type CloseValidationResult,
  type CloseProgress,
  type CloseConflict,
} from './FinancialCloseEngine';
export { FinancialInstrumentsEngine } from './FinancialInstrumentsEngine';
export { FiscalCalendar } from './FiscalCalendar';
export { ForecastMethodEngine } from './ForecastMethodEngine';
export { ForecastReconciliationEngine } from './ForecastReconciliationEngine';
export { FormulaAutoCompleteEngine } from './FormulaAutoCompleteEngine';
// export { FormulaEngine } from './FormulaEngine'; // barrel-export disabled for dynamic import splitting
// FormulaFunctionRegistry — removed from barrel to preserve EngineRegistry dynamic import splitting.
// Import directly: import { FormulaFunctionRegistry } from '@/engines/FormulaFunctionRegistry';
// StateMachine — removed from barrel to preserve EngineRegistry dynamic import splitting.
// Import directly: import { StateMachine } from '@/engines/StateMachine';
export { GlobalSearchEngine } from './GlobalSearchEngine';
export { GoalSeekEngine } from './GoalSeekEngine'; // RE-ENABLED 2026-06-15
export { GridOfflineEngine } from './GridOfflineEngine';
export { GroupOutlineEngine } from './GroupOutlineEngine';
export { HealthcareEngine } from './HealthcareEngine';
export { ICMatchingEngine } from './ICMatchingEngine';
export { ImpairmentEngine } from './ImpairmentEngine';
// export { ImportEngine } from './ImportEngine'; // barrel-export disabled for dynamic import splitting
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
// export { MDXEngine } from './MDXEngine'; // barrel-export disabled for dynamic import splitting
export { ManufacturingEngine } from './ManufacturingEngine';
export { MasterDataEngine } from './MasterDataEngine';
export { MigrationEngine } from './MigrationEngine';
// export { MonteCarloEngine } from './MonteCarloEngine'; // barrel-export disabled for dynamic import splitting
export { MultiBookEngine } from './MultiBookEngine';
export { MultiCurrencyEngine } from './MultiCurrencyEngine';
// export { NLQEngine } from './NLQEngine'; // barrel-export disabled for dynamic import splitting
export { NamedRangeEngine } from './NamedRangeEngine';
export { OptionPricingEngine } from './OptionPricingEngine';
export { PeriodCloseEngine } from './PeriodCloseEngine';
export {
  PeriodLockEngine,
  type PeriodInfo,
  type PeriodState,
  type PeriodTransition,
  type PeriodLockResult,
  type PeriodValidationResult,
} from './PeriodLockEngine';
// export { PivotTableEngine } from './PivotTableEngine'; // barrel-export disabled for dynamic import splitting
export { PluginEngine } from './PluginEngine';
export { ProfessionalExportEngine } from './ProfessionalExportEngine';
export { QueryCache } from './QueryCache';
// export { RBACEngine } from './RBACEngine'; // barrel-export disabled for dynamic import splitting
export { RealEstateEngine } from './RealEstateEngine';
export { RecentFilesEngine } from './RecentFilesEngine';
export {
  RatioAnalysisEngine,
  type BalanceSheet,
  type IncomeStatement,
  type CashFlow,
  type RatioResult,
  type RatioSuite,
} from './RatioAnalysisEngine';
export { ReconciliationEngine } from './ReconciliationEngine';
export {
  RegulatoryReportingEngine,
  type ReportTemplate,
  type ReportSection,
  type ValidationRule,
  type ReportData,
  type ValidationIssue,
  type ValidationResult,
  type ReportFinding,
  type SignedReport,
  type ESGMetrics,
  type ReportFramework,
  type ReportSeverity,
  type OutputFormat,
} from './RegulatoryReportingEngine';
// export { ReportBookEngine } from './ReportBookEngine'; // barrel-export disabled for dynamic import splitting
// export { ReportBuilderEngine } from './ReportBuilderEngine'; // barrel-export disabled for dynamic import splitting
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
// export { RollingForecastEngine } from './RollingForecastEngine'; // barrel-export disabled for dynamic import splitting
export { SOXComplianceEngine } from './SOXComplianceEngine';
export { SaaSMetricsEngine } from './SaaSMetricsEngine';
export { SafeMathParser } from './SafeMathParser';
// export { ScenarioEngine } from './ScenarioEngine'; // barrel-export disabled for dynamic import splitting
export { SegmentReportingEngine } from './SegmentReportingEngine';
export { SensitivityEngine } from './SensitivityEngine'; // RE-ENABLED 2026-06-15
export { SensitivityTableEngine } from './SensitivityTableEngine';
export { SessionEngine } from './SessionEngine';
// export { SignConventionEngine } from './SignConventionEngine'; // barrel-export disabled for dynamic import splitting
export { SmartImportMapper } from './SmartImportMapper';
export { SmartImportMapping } from './SmartImportMapping';
export { SolverEngine } from './SolverEngine';
// export { SpreadEngine } from './SpreadEngine'; // barrel-export disabled for dynamic import splitting
// StateMachine removed — see comment above FormulaFunctionRegistry
export { StreamImportEngine } from './StreamImportEngine';
export { SyncEngine } from './SyncEngine';
export { TaxEngine } from './TaxEngine';
// CHRONOS 2026-06-15 — temporal utility module (UTC-anchored, DST/leap/TZ-safe)
export {
  addDays,
  addMonths,
  compareTimestamps,
  daysBetween,
  endOfUTCDay,
  endOfUTCMonth,
  isInRange,
  isLeapYear,
  parseToUTCEpoch,
  startOfUTCDay,
  startOfUTCMonth,
  toCalendarDateInTZ,
  toUTCISOString,
  DEFAULT_CALENDAR,
  fiscalYearOf,
  fiscalYearStart,
  periodOf,
  quarterOf,
  type CalendarDate,
  type DateRange,
  type ISOTimestamp,
  type TimezoneID,
  type FiscalCalendarConfig,
  type FiscalPeriod,
  type FiscalQuarter,
} from './temporal';
// export { TemplateEngine } from './TemplateEngine'; // barrel-export disabled for dynamic import splitting
export { TemplateLibrary } from './TemplateLibrary';
// export { ThreeStatementEngine } from './ThreeStatementEngine'; // barrel-export disabled for dynamic import splitting
export { UndoRedoEngine } from './UndoRedoEngine';
// export { ValidationEngine } from './ValidationEngine'; // barrel-export disabled for dynamic import splitting
export {
  VarianceAttributionEngine,
  type Segment,
  type SegmentType,
  type VarianceAttribution,
  type AttributionSummary,
  type SignificanceResult,
  type ReconciliationResult,
  type SegmentMargin,
} from './VarianceAttributionEngine';
export { VarianceDecompositionEngine } from './VarianceDecompositionEngine';
export { VersionControlEngine } from './VersionControlEngine';
export { VisualWorkflowEngine } from './VisualWorkflowEngine';
export { WaterfallBridgeEngine } from './WaterfallBridgeEngine';
// export { WhatIfSandboxEngine } from './WhatIfSandboxEngine'; // barrel-export disabled for dynamic import splitting
export { WindowStateManager } from './WindowStateManager';
export { WorkflowActionEngine } from './WorkflowActionEngine';
export { WorkflowBuilderEngine } from './WorkflowBuilderEngine';
// export { WorkflowEngine } from './WorkflowEngine'; // barrel-export disabled for dynamic import splitting
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
