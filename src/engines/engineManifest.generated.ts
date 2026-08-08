/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Regenerate with: node scripts/generate-engine-manifest.mjs
 *
 * Maps every engine id to a dynamic import (N-0013). Hand-maintaining this
 * list is exactly how EngineRegistry ended up knowing only 40 of 181
 * engines while the rest were unreachable at runtime.
 *
 * Engines: 181
 */

export type EngineId =
  | 'AICopilotEngine'
  | 'AIEngine'
  | 'AdvancedExcelEngine'
  | 'AdvancedOLAPEngine'
  | 'AdvancedPDFEngine'
  | 'AggregateTableEngine'
  | 'AggregationDesigner'
  | 'AllocationEngine'
  | 'AllocationRuleEngine'
  | 'AnomalyDetectionEngine'
  | 'AnomalyExplainer'
  | 'ArrayFormulaEngine'
  | 'AssumptionEngine'
  | 'AuditEngine'
  | 'AuditLogEngine'
  | 'AuditTrailEngine'
  | 'AutoCommentaryEngine'
  | 'AutoSaveEngine'
  | 'BankingEngine'
  | 'BatchOperationEngine'
  | 'BondPricingEngine'
  | 'BreakEvenEngine'
  | 'BudgetCollectionEngine'
  | 'COGSVarianceEngine'
  | 'CalculationGraph'
  | 'CalculationQueue'
  | 'CapExEngine'
  | 'CascadeCalculationEngine'
  | 'CashEngine'
  | 'CashFlowWaterfallEngine'
  | 'CellAuditTrailEngine'
  | 'CellCommentEngine'
  | 'CellProtectionEngine'
  | 'CellValidationEngine'
  | 'ChartAnnotationEngine'
  | 'ComplianceEngine'
  | 'ConditionalFormattingEngine'
  | 'ConnectorEngine'
  | 'ConsolidationAdjustmentsEngine'
  | 'ConsolidationEngine'
  | 'ConstructionEngine'
  | 'CrashRecoveryEngine'
  | 'CreditRiskEngine'
  | 'CubeEngine'
  | 'CubeEnginePersistence'
  | 'CubeMigrationEngine'
  | 'CubePartitioner'
  | 'CubeSecurityEngine'
  | 'CustomFieldEngine'
  | 'DAGEngine'
  | 'DashboardBuilderEngine'
  | 'DataCatalogEngine'
  | 'DataClassificationEngine'
  | 'DataGovernanceEngine'
  | 'DataLineageEngine'
  | 'DataMaskingEngine'
  | 'DataQualityEngine'
  | 'DataRetentionEngine'
  | 'DebtScheduleEngine'
  | 'DepreciationEngine'
  | 'DimensionalModelingEngine'
  | 'DocumentEngine'
  | 'DrillThroughEngine'
  | 'DriverCascadeEngine'
  | 'DriverLibrary'
  | 'ESGEngine'
  | 'ETLPipelineEngine'
  | 'EncryptionEngine'
  | 'EnergyEngine'
  | 'ExcelImportEngine'
  | 'ExcelKeyboardEngine'
  | 'ExcelKeyboardShortcuts'
  | 'ExportEngine'
  | 'ExportTemplateEngine'
  | 'FXEngine'
  | 'FairValueEngine'
  | 'FinPlanFileEngine'
  | 'FinanceCopilotEngine'
  | 'FinancialCloseEngine'
  | 'FinancialInstrumentsEngine'
  | 'FiscalCalendar'
  | 'FiscalCalendarEngine'
  | 'ForecastMethodEngine'
  | 'ForecastReconciliationEngine'
  | 'FormulaAutoCompleteEngine'
  | 'FormulaEngine'
  | 'FormulaFunctionRegistry'
  | 'GlobalSearchEngine'
  | 'GoalSeekEngine'
  | 'GridOfflineEngine'
  | 'GroupOutlineEngine'
  | 'HealthcareEngine'
  | 'ICMatchingEngine'
  | 'ImpairmentEngine'
  | 'ImportEngine'
  | 'IncrementalCalcEngine'
  | 'InsuranceEngine'
  | 'IntercompanyMatchingEngine'
  | 'InventoryEngine'
  | 'IterativeCalculationEngine'
  | 'LeaseEngine'
  | 'LoanAmortizationEngine'
  | 'MDXEngine'
  | 'ManufacturingEngine'
  | 'MasterDataEngine'
  | 'MigrationEngine'
  | 'MonteCarloEngine'
  | 'MultiBookEngine'
  | 'MultiCurrencyEngine'
  | 'NLQEngine'
  | 'NamedRangeEngine'
  | 'OperationalDriverEngine'
  | 'OptionPricingEngine'
  | 'PeriodCloseEngine'
  | 'PeriodCloseStateMachine'
  | 'PeriodLockEngine'
  | 'PivotTableEngine'
  | 'PluginEngine'
  | 'ProfessionalExportEngine'
  | 'QueryCache'
  | 'RBACEngine'
  | 'RatioAnalysisEngine'
  | 'RealEstateEngine'
  | 'RecentFilesEngine'
  | 'ReconciliationEngine'
  | 'RegulatoryReportingEngine'
  | 'ReportBookEngine'
  | 'ReportBuilderEngine'
  | 'ReportCacheEngine'
  | 'ReportDistributionEngine'
  | 'ReportLayoutEngine'
  | 'ReportSchedulerEngine'
  | 'ReportSchedulingEngine'
  | 'ReportVersionEngine'
  | 'RetailEngine'
  | 'RevRecEngine'
  | 'RollingForecastEngine'
  | 'SOXComplianceEngine'
  | 'SaaSMetricsEngine'
  | 'SafeMathParser'
  | 'ScenarioEngine'
  | 'SegmentReportingEngine'
  | 'SensitivityEngine'
  | 'SensitivityTableEngine'
  | 'SessionEngine'
  | 'SignConventionEngine'
  | 'SmartImportMapper'
  | 'SmartImportMapping'
  | 'SolverEngine'
  | 'SpreadEngine'
  | 'StateMachine'
  | 'StreamImportEngine'
  | 'SyncEngine'
  | 'TaxEngine'
  | 'TemplateEngine'
  | 'TemplateLibrary'
  | 'ThreeStatementEngine'
  | 'UndoRedoEngine'
  | 'ValidationEngine'
  | 'VarianceAttributionEngine'
  | 'VarianceDecompositionEngine'
  | 'VersionControlEngine'
  | 'VisualWorkflowEngine'
  | 'WaterfallBridgeEngine'
  | 'WhatIfSandboxEngine'
  | 'WindowStateManager'
  | 'WorkflowActionEngine'
  | 'WorkflowBuilderEngine'
  | 'WorkflowEngine'
  | 'WorkflowSchedulerEngine'
  | 'WorkflowTemplateEngine'
  | 'WorkflowTriggerEngine'
  | 'WorkforceEngine'
  | 'WorkingCapitalEngine'
  | 'XBRLEngine'
  | 'YieldCurveEngine'
  | 'exportExcel'
  | 'report-builder-export'
  | 'report-builder-formulas'
  | 'report-builder-templates'
  | 'reportDataBuilder';

export type EngineModule = Record<string, unknown>;

/** Dynamic import for every engine module in src/engines. */
export const ENGINE_MANIFEST: Record<EngineId, () => Promise<EngineModule>> = {
  AICopilotEngine: () => import('./AICopilotEngine'),
  AIEngine: () => import('./AIEngine'),
  AdvancedExcelEngine: () => import('./AdvancedExcelEngine'),
  AdvancedOLAPEngine: () => import('./AdvancedOLAPEngine'),
  AdvancedPDFEngine: () => import('./AdvancedPDFEngine'),
  AggregateTableEngine: () => import('./AggregateTableEngine'),
  AggregationDesigner: () => import('./AggregationDesigner'),
  AllocationEngine: () => import('./AllocationEngine'),
  AllocationRuleEngine: () => import('./AllocationRuleEngine'),
  AnomalyDetectionEngine: () => import('./AnomalyDetectionEngine'),
  AnomalyExplainer: () => import('./AnomalyExplainer'),
  ArrayFormulaEngine: () => import('./ArrayFormulaEngine'),
  AssumptionEngine: () => import('./AssumptionEngine'),
  AuditEngine: () => import('./AuditEngine'),
  AuditLogEngine: () => import('./AuditLogEngine'),
  AuditTrailEngine: () => import('./AuditTrailEngine'),
  AutoCommentaryEngine: () => import('./AutoCommentaryEngine'),
  AutoSaveEngine: () => import('./AutoSaveEngine'),
  BankingEngine: () => import('./BankingEngine'),
  BatchOperationEngine: () => import('./BatchOperationEngine'),
  BondPricingEngine: () => import('./BondPricingEngine'),
  BreakEvenEngine: () => import('./BreakEvenEngine'),
  BudgetCollectionEngine: () => import('./BudgetCollectionEngine'),
  COGSVarianceEngine: () => import('./COGSVarianceEngine'),
  CalculationGraph: () => import('./CalculationGraph'),
  CalculationQueue: () => import('./CalculationQueue'),
  CapExEngine: () => import('./CapExEngine'),
  CascadeCalculationEngine: () => import('./CascadeCalculationEngine'),
  CashEngine: () => import('./CashEngine'),
  CashFlowWaterfallEngine: () => import('./CashFlowWaterfallEngine'),
  CellAuditTrailEngine: () => import('./CellAuditTrailEngine'),
  CellCommentEngine: () => import('./CellCommentEngine'),
  CellProtectionEngine: () => import('./CellProtectionEngine'),
  CellValidationEngine: () => import('./CellValidationEngine'),
  ChartAnnotationEngine: () => import('./ChartAnnotationEngine'),
  ComplianceEngine: () => import('./ComplianceEngine'),
  ConditionalFormattingEngine: () => import('./ConditionalFormattingEngine'),
  ConnectorEngine: () => import('./ConnectorEngine'),
  ConsolidationAdjustmentsEngine: () => import('./ConsolidationAdjustmentsEngine'),
  ConsolidationEngine: () => import('./ConsolidationEngine'),
  ConstructionEngine: () => import('./ConstructionEngine'),
  CrashRecoveryEngine: () => import('./CrashRecoveryEngine'),
  CreditRiskEngine: () => import('./CreditRiskEngine'),
  CubeEngine: () => import('./CubeEngine'),
  CubeEnginePersistence: () => import('./CubeEnginePersistence'),
  CubeMigrationEngine: () => import('./CubeMigrationEngine'),
  CubePartitioner: () => import('./CubePartitioner'),
  CubeSecurityEngine: () => import('./CubeSecurityEngine'),
  CustomFieldEngine: () => import('./CustomFieldEngine'),
  DAGEngine: () => import('./DAGEngine'),
  DashboardBuilderEngine: () => import('./DashboardBuilderEngine'),
  DataCatalogEngine: () => import('./DataCatalogEngine'),
  DataClassificationEngine: () => import('./DataClassificationEngine'),
  DataGovernanceEngine: () => import('./DataGovernanceEngine'),
  DataLineageEngine: () => import('./DataLineageEngine'),
  DataMaskingEngine: () => import('./DataMaskingEngine'),
  DataQualityEngine: () => import('./DataQualityEngine'),
  DataRetentionEngine: () => import('./DataRetentionEngine'),
  DebtScheduleEngine: () => import('./DebtScheduleEngine'),
  DepreciationEngine: () => import('./DepreciationEngine'),
  DimensionalModelingEngine: () => import('./DimensionalModelingEngine'),
  DocumentEngine: () => import('./DocumentEngine'),
  DrillThroughEngine: () => import('./DrillThroughEngine'),
  DriverCascadeEngine: () => import('./DriverCascadeEngine'),
  DriverLibrary: () => import('./DriverLibrary'),
  ESGEngine: () => import('./ESGEngine'),
  ETLPipelineEngine: () => import('./ETLPipelineEngine'),
  EncryptionEngine: () => import('./EncryptionEngine'),
  EnergyEngine: () => import('./EnergyEngine'),
  ExcelImportEngine: () => import('./ExcelImportEngine'),
  ExcelKeyboardEngine: () => import('./ExcelKeyboardEngine'),
  ExcelKeyboardShortcuts: () => import('./ExcelKeyboardShortcuts'),
  ExportEngine: () => import('./ExportEngine'),
  ExportTemplateEngine: () => import('./ExportTemplateEngine'),
  FXEngine: () => import('./FXEngine'),
  FairValueEngine: () => import('./FairValueEngine'),
  FinPlanFileEngine: () => import('./FinPlanFileEngine'),
  FinanceCopilotEngine: () => import('./FinanceCopilotEngine'),
  FinancialCloseEngine: () => import('./FinancialCloseEngine'),
  FinancialInstrumentsEngine: () => import('./FinancialInstrumentsEngine'),
  FiscalCalendar: () => import('./FiscalCalendar'),
  FiscalCalendarEngine: () => import('./FiscalCalendarEngine'),
  ForecastMethodEngine: () => import('./ForecastMethodEngine'),
  ForecastReconciliationEngine: () => import('./ForecastReconciliationEngine'),
  FormulaAutoCompleteEngine: () => import('./FormulaAutoCompleteEngine'),
  FormulaEngine: () => import('./FormulaEngine'),
  FormulaFunctionRegistry: () => import('./FormulaFunctionRegistry'),
  GlobalSearchEngine: () => import('./GlobalSearchEngine'),
  GoalSeekEngine: () => import('./GoalSeekEngine'),
  GridOfflineEngine: () => import('./GridOfflineEngine'),
  GroupOutlineEngine: () => import('./GroupOutlineEngine'),
  HealthcareEngine: () => import('./HealthcareEngine'),
  ICMatchingEngine: () => import('./ICMatchingEngine'),
  ImpairmentEngine: () => import('./ImpairmentEngine'),
  ImportEngine: () => import('./ImportEngine'),
  IncrementalCalcEngine: () => import('./IncrementalCalcEngine'),
  InsuranceEngine: () => import('./InsuranceEngine'),
  IntercompanyMatchingEngine: () => import('./IntercompanyMatchingEngine'),
  InventoryEngine: () => import('./InventoryEngine'),
  IterativeCalculationEngine: () => import('./IterativeCalculationEngine'),
  LeaseEngine: () => import('./LeaseEngine'),
  LoanAmortizationEngine: () => import('./LoanAmortizationEngine'),
  MDXEngine: () => import('./MDXEngine'),
  ManufacturingEngine: () => import('./ManufacturingEngine'),
  MasterDataEngine: () => import('./MasterDataEngine'),
  MigrationEngine: () => import('./MigrationEngine'),
  MonteCarloEngine: () => import('./MonteCarloEngine'),
  MultiBookEngine: () => import('./MultiBookEngine'),
  MultiCurrencyEngine: () => import('./MultiCurrencyEngine'),
  NLQEngine: () => import('./NLQEngine'),
  NamedRangeEngine: () => import('./NamedRangeEngine'),
  OperationalDriverEngine: () => import('./OperationalDriverEngine'),
  OptionPricingEngine: () => import('./OptionPricingEngine'),
  PeriodCloseEngine: () => import('./PeriodCloseEngine'),
  PeriodCloseStateMachine: () => import('./PeriodCloseStateMachine'),
  PeriodLockEngine: () => import('./PeriodLockEngine'),
  PivotTableEngine: () => import('./PivotTableEngine'),
  PluginEngine: () => import('./PluginEngine'),
  ProfessionalExportEngine: () => import('./ProfessionalExportEngine'),
  QueryCache: () => import('./QueryCache'),
  RBACEngine: () => import('./RBACEngine'),
  RatioAnalysisEngine: () => import('./RatioAnalysisEngine'),
  RealEstateEngine: () => import('./RealEstateEngine'),
  RecentFilesEngine: () => import('./RecentFilesEngine'),
  ReconciliationEngine: () => import('./ReconciliationEngine'),
  RegulatoryReportingEngine: () => import('./RegulatoryReportingEngine'),
  ReportBookEngine: () => import('./ReportBookEngine'),
  ReportBuilderEngine: () => import('./ReportBuilderEngine'),
  ReportCacheEngine: () => import('./ReportCacheEngine'),
  ReportDistributionEngine: () => import('./ReportDistributionEngine'),
  ReportLayoutEngine: () => import('./ReportLayoutEngine'),
  ReportSchedulerEngine: () => import('./ReportSchedulerEngine'),
  ReportSchedulingEngine: () => import('./ReportSchedulingEngine'),
  ReportVersionEngine: () => import('./ReportVersionEngine'),
  RetailEngine: () => import('./RetailEngine'),
  RevRecEngine: () => import('./RevRecEngine'),
  RollingForecastEngine: () => import('./RollingForecastEngine'),
  SOXComplianceEngine: () => import('./SOXComplianceEngine'),
  SaaSMetricsEngine: () => import('./SaaSMetricsEngine'),
  SafeMathParser: () => import('./SafeMathParser'),
  ScenarioEngine: () => import('./ScenarioEngine'),
  SegmentReportingEngine: () => import('./SegmentReportingEngine'),
  SensitivityEngine: () => import('./SensitivityEngine'),
  SensitivityTableEngine: () => import('./SensitivityTableEngine'),
  SessionEngine: () => import('./SessionEngine'),
  SignConventionEngine: () => import('./SignConventionEngine'),
  SmartImportMapper: () => import('./SmartImportMapper'),
  SmartImportMapping: () => import('./SmartImportMapping'),
  SolverEngine: () => import('./SolverEngine'),
  SpreadEngine: () => import('./SpreadEngine'),
  StateMachine: () => import('./StateMachine'),
  StreamImportEngine: () => import('./StreamImportEngine'),
  SyncEngine: () => import('./SyncEngine'),
  TaxEngine: () => import('./TaxEngine'),
  TemplateEngine: () => import('./TemplateEngine'),
  TemplateLibrary: () => import('./TemplateLibrary'),
  ThreeStatementEngine: () => import('./ThreeStatementEngine'),
  UndoRedoEngine: () => import('./UndoRedoEngine'),
  ValidationEngine: () => import('./ValidationEngine'),
  VarianceAttributionEngine: () => import('./VarianceAttributionEngine'),
  VarianceDecompositionEngine: () => import('./VarianceDecompositionEngine'),
  VersionControlEngine: () => import('./VersionControlEngine'),
  VisualWorkflowEngine: () => import('./VisualWorkflowEngine'),
  WaterfallBridgeEngine: () => import('./WaterfallBridgeEngine'),
  WhatIfSandboxEngine: () => import('./WhatIfSandboxEngine'),
  WindowStateManager: () => import('./WindowStateManager'),
  WorkflowActionEngine: () => import('./WorkflowActionEngine'),
  WorkflowBuilderEngine: () => import('./WorkflowBuilderEngine'),
  WorkflowEngine: () => import('./WorkflowEngine'),
  WorkflowSchedulerEngine: () => import('./WorkflowSchedulerEngine'),
  WorkflowTemplateEngine: () => import('./WorkflowTemplateEngine'),
  WorkflowTriggerEngine: () => import('./WorkflowTriggerEngine'),
  WorkforceEngine: () => import('./WorkforceEngine'),
  WorkingCapitalEngine: () => import('./WorkingCapitalEngine'),
  XBRLEngine: () => import('./XBRLEngine'),
  YieldCurveEngine: () => import('./YieldCurveEngine'),
  exportExcel: () => import('./exportExcel'),
  'report-builder-export': () => import('./report-builder-export'),
  'report-builder-formulas': () => import('./report-builder-formulas'),
  'report-builder-templates': () => import('./report-builder-templates'),
  reportDataBuilder: () => import('./reportDataBuilder'),
};

/** Every known engine id, sorted. */
export const ENGINE_IDS = Object.keys(ENGINE_MANIFEST) as EngineId[];

/** Total number of engine modules reachable through the registry. */
export const ENGINE_COUNT = ENGINE_IDS.length;
