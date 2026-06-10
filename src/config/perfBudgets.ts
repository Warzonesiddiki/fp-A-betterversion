/** @type {number} */
export const FMP_TARGET_MS = 100;
export const HERO_IMAGE_KB = 200;
export const FONT_SUBSET_RATIO = 0.4;
export const CRITICAL_CSS_KB = 14;
export const PRECONNECT_MAX = 4;

export const PAGE_RENDER_BUDGETS = {
  DashboardPage: FMP_TARGET_MS,
  LoginPage: FMP_TARGET_MS,
  SignupPage: FMP_TARGET_MS,
  OnboardingPage: FMP_TARGET_MS,
  SettingsPage: FMP_TARGET_MS,
  BudgetListPage: FMP_TARGET_MS,
  BudgetEditorPage: FMP_TARGET_MS,
  BudgetApprovalPage: FMP_TARGET_MS,
  BudgetComparisonPage: FMP_TARGET_MS,
  ForecastPage: FMP_TARGET_MS,
  RollingForecastPage: FMP_TARGET_MS,
  DriverModelingPage: FMP_TARGET_MS,
  SensitivityPage: FMP_TARGET_MS,
  ScenarioListPage: FMP_TARGET_MS,
  ScenarioEditorPage: FMP_TARGET_MS,
  ScenarioComparisonPage: FMP_TARGET_MS,
  ReportsListPage: FMP_TARGET_MS,
  ReportBuilderPage: FMP_TARGET_MS,
  ReportViewerPage: FMP_TARGET_MS,
  ScheduledReportsPage: FMP_TARGET_MS,
  ConsolidationPage: FMP_TARGET_MS,
  IntercompanyMatchingPage: FMP_TARGET_MS,
  EliminationPage: FMP_TARGET_MS,
  CubeBuilderPage: FMP_TARGET_MS,
  CubeViewerPage: FMP_TARGET_MS,
  CubePivotPage: FMP_TARGET_MS,
  CashFlowForecastPage: FMP_TARGET_MS,
  CashPositionPage: FMP_TARGET_MS,
  BankReconciliationPage: FMP_TARGET_MS,
  CapexPlanPage: FMP_TARGET_MS,
  FixedAssetRegisterPage: FMP_TARGET_MS,
  DepreciationPage: FMP_TARGET_MS,
  TaxProvisionPage: FMP_TARGET_MS,
  TaxReturnPage: FMP_TARGET_MS,
  TransferPricingPage: FMP_TARGET_MS,
  AuditTrailPage: FMP_TARGET_MS,
  CompliancePage: FMP_TARGET_MS,
  SOXControlsPage: FMP_TARGET_MS,
  AuditWorkpaperPage: FMP_TARGET_MS,
  AuditSamplingPage: FMP_TARGET_MS,
  AuditFindingsPage: FMP_TARGET_MS,
  RiskDashboardPage: FMP_TARGET_MS,
  RiskRegisterPage: FMP_TARGET_MS,
  RiskMatrixPage: FMP_TARGET_MS,
  VarianceAnalysisPage: FMP_TARGET_MS,
  DriverVariancePage: FMP_TARGET_MS,
} as const;

export const INFRA_BUDGETS = {
  imageOptimization: { maxHeroKb: HERO_IMAGE_KB, formats: ['webp', 'avif'] },
  fontSubsetting: { maxSubsetRatio: FONT_SUBSET_RATIO, formats: ['woff2'] },
  criticalCssInlining: { maxKb: CRITICAL_CSS_KB, aboveFoldOnly: true },
  resourceHints: { maxPreconnect: PRECONNECT_MAX, allow: ['preconnect', 'dns-prefetch'] },
} as const;

export type PageName = keyof typeof PAGE_RENDER_BUDGETS;
