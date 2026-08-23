import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import {
  RouteGroupErrorBoundary,
  RouteSkeleton,
} from './components/errors/RouteGroupErrorBoundary';
import { useFirstRun } from './hooks/useFirstRun';
import { StorageFailureBanner } from './components/system/StorageFailureBanner';
import { isTauriRuntime } from './utils/tauriRuntime';

// Core (not route-dependent)
const OnboardingWizard = lazy(() =>
  import('./components/ui/OnboardingWizard').then((m) => ({ default: m.default }))
);

// Auth
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.default }))
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.default }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({
    default: m.default,
  }))
);
const OnboardingWizardWrapper = lazy(() =>
  import('./pages/auth/OnboardingWizard').then((m) => ({ default: m.default }))
);

// Core
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.default }))
);
const BudgetListPage = lazy(() =>
  import('./pages/budgets/BudgetListPage').then((m) => ({ default: m.default }))
);
const BudgetCreatePage = lazy(() =>
  import('./pages/budgets/BudgetCreatePage').then((m) => ({ default: m.default }))
);
const BudgetDetailPage = lazy(() =>
  import('./pages/budgets/BudgetDetailPage').then((m) => ({ default: m.default }))
);
const BudgetVAReport = lazy(() =>
  import('./pages/budgets/BudgetVAReport').then((m) => ({ default: m.default }))
);
const ForecastListPage = lazy(() =>
  import('./pages/forecasts/ForecastListPage').then((m) => ({
    default: m.default,
  }))
);
const ForecastBuilderPage = lazy(() =>
  import('./pages/forecasts/ForecastBuilderPage').then((m) => ({
    default: m.default,
  }))
);
const WhatIfPage = lazy(() =>
  import('./pages/forecasts/WhatIfPage').then((m) => ({ default: m.default }))
);
const ReportsListPage = lazy(() => import('./pages/reports/ReportsListPage'));
const VarianceDashboardPage = lazy(() => import('./pages/variance/VarianceDashboardPage'));
const ScenarioListPage = lazy(() => import('./pages/scenarios/ScenarioListPage'));
const ScenarioBuilderPage = lazy(() => import('./pages/scenarios/ScenarioBuilderPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const BenchmarkingPage = lazy(() => import('./pages/analytics/BenchmarkingPage'));
const GoalSeekPage = lazy(() => import('./pages/analytics/GoalSeekPage'));
const AIIntelligencePage = lazy(() => import('./pages/ai/AIIntelligencePage'));

// Data & GL
const GLUploadPage = lazy(() => import('./pages/data/GLUploadPage'));
const GLExplorerPage = lazy(() => import('./pages/data/GLExplorerPage'));
const GLTrialBalancePage = lazy(() => import('./pages/data/GLTrialBalancePage'));
const GLJournalsPage = lazy(() => import('./pages/data/GLJournalsPage'));
const GLAccountAnalysisPage = lazy(() => import('./pages/data/GLAccountAnalysisPage'));
const GLReportingPage = lazy(() => import('./pages/data/GLReportingPage'));
const DataImportPage = lazy(() => import('./pages/data/DataImportPage'));
const MigrationPage = lazy(() => import('./pages/data/MigrationPage'));
const ChartOfAccountsPage = lazy(() => import('./pages/data/ChartOfAccountsPage'));
const AuditTrailPage = lazy(() => import('./pages/audit/AuditTrailPage'));

// Financial Ops
const ConsolidationDashboard = lazy(() => import('./pages/consolidation/ConsolidationDashboard'));
const ICEliminationPage = lazy(() => import('./pages/consolidation/ICEliminationPage'));
const OwnershipTreePage = lazy(() => import('./pages/consolidation/OwnershipTreePage'));
const FXRatesPage = lazy(() => import('./pages/currency/FXRatesPage'));
const TranslationResultPage = lazy(() => import('./pages/currency/TranslationResultPage'));
const HedgeManagementPage = lazy(() => import('./pages/currency/HedgeManagementPage'));
const RevRecDashboard = lazy(() => import('./pages/revenue/RevRecDashboard'));
const DeferredSchedulePage = lazy(() => import('./pages/revenue/DeferredSchedulePage'));
const LeaseDashboard = lazy(() => import('./pages/lease/LeaseDashboard'));
const LeaseDetailPage = lazy(() => import('./pages/lease/LeaseDetailPage'));
const TaxProvisionPage = lazy(() => import('./pages/tax/TaxProvisionPage'));
const TransferPricingPage = lazy(() => import('./pages/tax/TransferPricingPage'));
const CapExDashboard = lazy(() => import('./pages/capex/CapExDashboard'));
const DepreciationForecastPage = lazy(() => import('./pages/capex/DepreciationForecastPage'));
const DepreciationPage = lazy(() => import('./pages/accounting/DepreciationPage'));
const MultiBookPage = lazy(() => import('./pages/accounting/MultiBookPage'));
const FairValuePage = lazy(() => import('./pages/audit/FairValuePage'));
const ImpairmentPage = lazy(() => import('./pages/audit/ImpairmentPage'));
const SegmentReportingPage = lazy(() => import('./pages/reports/SegmentReportingPage'));
const DashboardBuilderPage = lazy(() => import('./pages/analytics/DashboardBuilderPage'));
const PivotExplorerPage = lazy(() => import('./pages/analytics/PivotExplorerPage'));
const DebugPage = lazy(() => import('./pages/admin/DebugPage'));
const PluginMarketplacePage = lazy(() => import('./pages/plugins/PluginMarketplacePage'));

// Cash & Treasury
const CashForecastPage = lazy(() => import('./pages/cash/CashForecastPage'));
const DebtSchedulePage = lazy(() => import('./pages/cash/DebtSchedulePage'));
const WorkingCapitalPage = lazy(() => import('./pages/cash/WorkingCapitalPage'));
const InvestmentPage = lazy(() => import('./pages/treasury/InvestmentPage'));
const FXExposurePage = lazy(() => import('./pages/treasury/FXExposurePage'));
const LoanAmortizationPage = lazy(() => import('./pages/treasury/LoanAmortizationPage'));

// Workforce
const HeadcountPlanPage = lazy(() => import('./pages/workforce/HeadcountPlanPage'));
const CompModelingPage = lazy(() => import('./pages/workforce/CompModelingPage'));
const PayrollForecastPage = lazy(() => import('./pages/workforce/PayrollForecastPage'));

// Reports
const ProfitLossPage = lazy(() => import('./pages/reports/ProfitLossPage'));
const ThreeStatementDashboardPage = lazy(
  () => import('./pages/reports/ThreeStatementDashboardPage')
);
const BalanceSheetPage = lazy(() => import('./pages/reports/BalanceSheetPage'));
const CashFlowPage = lazy(() => import('./pages/reports/CashFlowPage'));
const BudgetVsActualPage = lazy(() => import('./pages/reports/BudgetVsActualPage'));
const BoardPackPage = lazy(() => import('./pages/reports/BoardPackPage'));
const ReportDesignerPage = lazy(() => import('./pages/reports/ReportDesignerPage'));
const TemplateGalleryPage = lazy(() => import('./pages/templates/TemplateGalleryPage'));

// Industry: SaaS
const ARRDashboard = lazy(() => import('./pages/saas/ARRDashboard'));
const CohortAnalysisPage = lazy(() => import('./pages/saas/CohortAnalysisPage'));
const ChurnDashboard = lazy(() => import('./pages/saas/ChurnDashboard'));

// Industry: Manufacturing
const ProductionDashboardPage = lazy(() => import('./pages/manufacturing/ProductionDashboardPage'));
const COGSVariancePage = lazy(() => import('./pages/manufacturing/COGSVariancePage'));
const InventoryPage = lazy(() => import('./pages/manufacturing/InventoryPage'));

// Industry: Retail
const StoreDashboardPage = lazy(() => import('./pages/retail/StoreDashboardPage'));
const PromoAnalysisPage = lazy(() => import('./pages/retail/PromoAnalysisPage'));

// Industry: Banking
const NIMDashboardPage = lazy(() => import('./pages/banking/NIMDashboardPage'));
const CapitalAdequacyPage = lazy(() => import('./pages/banking/CapitalAdequacyPage'));
const LoanLossPage = lazy(() => import('./pages/banking/LoanLossPage'));

// Industry: Healthcare
const HealthcareDashboardPage = lazy(() => import('./pages/healthcare/HealthcareDashboardPage'));
const PatientRevenuePage = lazy(() => import('./pages/healthcare/PatientRevenuePage'));
const ClinicalTrialCostPage = lazy(() => import('./pages/healthcare/ClinicalTrialCostPage'));

// Industry: Energy & ESG
const EnergyDashboardPage = lazy(() => import('./pages/energy/EnergyDashboardPage'));
const EnergyProductionDashboard = lazy(() => import('./pages/energy/EnergyProductionDashboard'));
const EnergyRiskPage = lazy(() => import('./pages/energy/EnergyRiskPage'));
const RenewableEnergyPage = lazy(() => import('./pages/energy/RenewableEnergyPage'));
const EmissionsTradingPage = lazy(() => import('./pages/energy/EmissionsTradingPage'));
const CarbonDashboardPage = lazy(() => import('./pages/esg/CarbonDashboardPage'));
const CSRDReportPage = lazy(() => import('./pages/esg/CSRDReportPage'));

// Utility
const CollaborationPage = lazy(() => import('./pages/collaboration/CollaborationPage'));
const ApprovalQueuePage = lazy(() => import('./pages/collaboration/ApprovalQueuePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const UserManagementPage = lazy(() => import('./pages/settings/UserManagementPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ApiReferencePage = lazy(() => import('./pages/docs/ApiReferencePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DrillDownWindowPage = lazy(() => import('./pages/DrillDownWindowPage'));

// Phase 4 G11 - additional pages (re-import batch)
const BudgetApproval = lazy(() => import('./pages/budgets/BudgetApproval'));
const DriverPlanningPage = lazy(() => import('./pages/forecasts/DriverPlanningPage'));
const RollingForecastPage = lazy(() => import('./pages/forecasts/RollingForecastPage'));
const ScenarioComparisonPage = lazy(() => import('./pages/scenarios/ScenarioComparisonPage'));
const DataLineagePage = lazy(() => import('./pages/analytics/DataLineagePage'));
const NLQChatPage = lazy(() => import('./pages/ai/NLQChatPage'));
const DataFlowMapPage = lazy(() => import('./pages/data/DataFlowMapPage'));
const ReconciliationPage = lazy(() => import('./pages/data/ReconciliationPage'));
const VersionDiffPage = lazy(() => import('./pages/data/VersionDiffPage'));
const SOXCompliancePage = lazy(() => import('./pages/audit/SOXCompliancePage'));
const PeriodClosePage = lazy(() => import('./pages/periods/PeriodClosePage'));
const ConsolidationPage = lazy(() => import('./pages/consolidation/ConsolidationPage'));
const LeaseAccountingPage = lazy(() => import('./pages/lease/LeaseAccountingPage'));
const CapexTracker = lazy(() => import('./pages/capex/CapexTracker'));
const BenchmarksPage = lazy(() => import('./pages/admin/BenchmarksPage'));
// N-0013: makes every calculation engine reachable from the UI.
const EngineCatalogPage = lazy(() => import('./pages/admin/EngineCatalogPage'));
const BankingDashboard = lazy(() => import('./pages/banking/BankingDashboard'));
const BankReconciliation = lazy(() => import('./pages/banking/BankReconciliation'));
const BankStatements = lazy(() => import('./pages/banking/BankStatements'));
const BondPortfolioPage = lazy(() => import('./pages/bonds/BondPortfolioPage'));
const YieldCurvePage = lazy(() => import('./pages/bonds/YieldCurvePage'));
const CreditRiskPage = lazy(() => import('./pages/credit/CreditRiskPage'));
const ConstructionDashboardPage = lazy(
  () => import('./pages/construction/ConstructionDashboardPage')
);
const EquipmentManagementPage = lazy(() => import('./pages/construction/EquipmentManagementPage'));
const ProjectCostingPage = lazy(() => import('./pages/construction/ProjectCostingPage'));
const RealEstateDashboardPage = lazy(() => import('./pages/realestate/RealEstateDashboardPage'));
const FacilityManagementPage = lazy(() => import('./pages/realestate/FacilityManagementPage'));
const PropertyPortfolioPage = lazy(() => import('./pages/realestate/PropertyPortfolioPage'));
const REITDashboardPage = lazy(() => import('./pages/realestate/REITDashboardPage'));
const ValuationPage = lazy(() => import('./pages/realestate/ValuationPage'));
const ClaimsAnalyticsPage = lazy(() => import('./pages/insurance/ClaimsAnalyticsPage'));
const InsuranceDashboardPage = lazy(() => import('./pages/insurance/InsuranceDashboardPage'));
const InsurancePage = lazy(() => import('./pages/insurance/InsurancePage'));
const UnderwritingPage = lazy(() => import('./pages/insurance/UnderwritingPage'));
const HealthcarePage = lazy(() => import('./pages/healthcare/HealthcarePage'));
const ValueBasedCarePage = lazy(() => import('./pages/healthcare/ValueBasedCarePage'));
const EnergySectorPage = lazy(() => import('./pages/energy/EnergySectorPage'));
const ESGPage = lazy(() => import('./pages/esg/ESGPage'));
const ManufacturingPage = lazy(() => import('./pages/manufacturing/ManufacturingPage'));
const InventoryDashboard = lazy(() => import('./pages/retail/InventoryDashboard'));
const InventoryPlanningPage = lazy(() => import('./pages/retail/InventoryPlanningPage'));
const StorePerformancePage = lazy(() => import('./pages/retail/StorePerformancePage'));
const ChurnAnalysisPage = lazy(() => import('./pages/saas/ChurnAnalysisPage'));
const SaaSPage = lazy(() => import('./pages/saas/SaaSPage'));
const ReportScheduler = lazy(() => import('./pages/reports/ReportScheduler'));
const ReportTemplateLibraryPage = lazy(() => import('./pages/reports/ReportTemplateLibraryPage'));
const ReportBookBuilder = lazy(() => import('./pages/reports/ReportBookBuilder'));
const FinancialStatementTemplates = lazy(
  () => import('./pages/reports/FinancialStatementTemplates')
);
const TemplatePreviewPage = lazy(() => import('./pages/templates/TemplatePreviewPage'));
const ChartShowcasePage = lazy(() => import('./pages/charts/ChartShowcasePage'));
const AtlasVisualBaselinePage = lazy(() => import('./pages/visual/AtlasVisualBaselinePage'));
const ActivityFeed = lazy(() => import('./pages/collaboration/ActivityFeed'));
const SharedReports = lazy(() => import('./pages/collaboration/SharedReports'));
const TeamWorkspace = lazy(() => import('./pages/collaboration/TeamWorkspace'));
const BackupRestorePage = lazy(() => import('./pages/settings/BackupRestorePage'));
const IntegrationSettingsPage = lazy(() => import('./pages/settings/IntegrationSettingsPage'));
const SecuritySettingsPage = lazy(() => import('./pages/settings/SecuritySettingsPage'));

// Phase 4 G11 - Sector dashboards (18 sector/* + 4 sectors/* + 4 legacy aliases)
const AgricultureDashboardPage = lazy(() => import('./pages/sector/AgricultureDashboardPage'));
const SectorBankingDashboardPage = lazy(() => import('./pages/sector/BankingDashboardPage'));
const SectorConstructionDashboardPage = lazy(
  () => import('./pages/sector/ConstructionDashboardPage')
);
const SectorEducationDashboardPage = lazy(() => import('./pages/sector/EducationDashboardPage'));
const EmissionsDashboardPage = lazy(() => import('./pages/sector/EmissionsTradingPage'));
const SectorEnergyDashboardPage = lazy(() => import('./pages/sector/EnergyDashboardPage'));
const EquipmentDashboardPage = lazy(() => import('./pages/sector/EquipmentManagementPage'));
const SectorGovernmentDashboardPage = lazy(() => import('./pages/sector/GovernmentDashboardPage'));
const SectorHealthcareDashboardPage = lazy(() => import('./pages/sector/HealthcareDashboardPage'));
const HospitalityDashboardPage = lazy(() => import('./pages/sector/HospitalityDashboardPage'));
const SectorInsuranceDashboardPage = lazy(() => import('./pages/sector/InsuranceDashboardPage'));
const SectorLogisticsDashboardPage = lazy(() => import('./pages/sector/LogisticsDashboardPage'));
const SectorManufacturingDashboardPage = lazy(
  () => import('./pages/sector/ManufacturingDashboardPage')
);
const SectorRealEstateDashboardPage = lazy(() => import('./pages/sector/RealEstateDashboardPage'));
const SectorRetailDashboardPage = lazy(() => import('./pages/sector/RetailDashboardPage'));
const SectorDashboardPage = lazy(() => import('./pages/sector/SectorPage'));
const TechnologyDashboardPage = lazy(() => import('./pages/sector/TechnologyDashboardPage'));
const TelecommunicationsDashboardPage = lazy(() => import('./pages/sector/TelecomDashboardPage'));
// W0.5 slice 1: /sectors/* duplicates removed — /sectors/* now redirects to /sector/* (RC3).

// Wave 9 Phase 3 — sector-depth specialized pages
const FleetCostDashboardPage = lazy(() => import('./pages/logistics/FleetCostDashboardPage'));
const WarehouseCostDashboardPage = lazy(
  () => import('./pages/logistics/WarehouseCostDashboardPage')
);
const GrantDisbursementPage = lazy(() => import('./pages/government/GrantDisbursementPage'));
const ProcurementCyclePage = lazy(() => import('./pages/government/ProcurementCyclePage'));
const EnrollmentRetentionPage = lazy(() => import('./pages/education/EnrollmentRetentionPage'));
const ResearchGrantsPage = lazy(() => import('./pages/education/ResearchGrantsPage'));
/**
 * RouteGroupWrapper provides a shared ErrorBoundary and Suspense context
 * for logical groups of routes, using domain-aware error boundaries
 * and loading skeletons.
 */
function RouteGroupWrapper({ domain }: { domain: keyof typeof _DOMAIN_MAP }) {
  return (
    <RouteGroupErrorBoundary domain={domain}>
      <Suspense fallback={<RouteSkeleton domain={domain} />}>
        <Outlet />
      </Suspense>
    </RouteGroupErrorBoundary>
  );
}

/** Domain map for RouteGroupWrapper (value used only as a type via keyof typeof). */
const _DOMAIN_MAP = {
  core: 'core' as const,
  dataGL: 'dataGL' as const,
  finops: 'finops' as const,
  cash: 'cash' as const,
  reports: 'reports' as const,
  industry: 'industry' as const,
  utility: 'utility' as const,
};

export default function App() {
  const { isFirstRun, completeSetup } = useFirstRun();

  // Desktop-only runtime gate (owner decision 2026-08-12: the F-05 browser
  // beta channel — VITE_BETA_WEB + data-beta-web marker — was removed; the
  // product is a desktop app, not a web app). A plain browser is blocked
  // unconditionally. The check is evaluated per render (isTauriRuntime), not
  // captured at module load, so the gate stays correct across runtime changes.
  if (!isTauriRuntime()) {
    alert(
      'This application is designed to run exclusively as a desktop app via Tauri. It is not supported in a standard web browser.'
    );
    return null;
  }

  if (isFirstRun) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingWizard onComplete={completeSetup} />
      </Suspense>
    );
  }

  return (
    <Router>
      <ThemeProvider>
        {/* N-0002: storage durability failures must be visible, not silent. */}
        <StorageFailureBanner />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route
              path="/login"
              element={
                <ErrorBoundary>
                  <LoginPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <ErrorBoundary>
                  <RegisterPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <ErrorBoundary>
                  <ForgotPasswordPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ErrorBoundary>
                  <OnboardingWizardWrapper />
                </ErrorBoundary>
              }
            />
            <Route
              path="/drill-down"
              element={
                <ErrorBoundary>
                  <DrillDownWindowPage />
                </ErrorBoundary>
              }
            />

            <Route element={<AppLayout />}>
              {/* W0.5 slice 2 (RC3): "/" was a pure alias of "/dashboard" — both
                  mounted the identical DashboardPage element. One canonical hub
                  now renders it ("/dashboard", the PillarNav PLAN hub); legacy
                  root links (error fallbacks, Ctrl+1, NotFound "Go Home") keep
                  working through this in-shell replace redirect. */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ErrorBoundary>
                    <DashboardPage />
                  </ErrorBoundary>
                }
              />
              {/* Dev-only Atlas visual-regression harness (BMAD F-02 runbook) — not linked from navigation. */}
              <Route
                path="/visual/atlas"
                element={
                  <ErrorBoundary>
                    <AtlasVisualBaselinePage />
                  </ErrorBoundary>
                }
              />

              {/* Core Modules Group */}
              <Route element={<RouteGroupWrapper domain="core" />}>
                <Route path="/budgets" element={<BudgetListPage />} />
                <Route path="/budgets/create" element={<BudgetCreatePage />} />
                <Route path="/budgets/bva" element={<BudgetVAReport />} />
                <Route path="/budgets/:id" element={<BudgetDetailPage />} />

                <Route path="/forecasts" element={<ForecastListPage />} />
                <Route path="/forecasts/create" element={<ForecastBuilderPage />} />
                <Route path="/forecasts/:id" element={<ForecastBuilderPage />} />
                <Route path="/forecasts/what-if" element={<WhatIfPage />} />

                <Route path="/scenarios" element={<ScenarioListPage />} />
                <Route path="/scenarios/create" element={<ScenarioBuilderPage />} />
                <Route path="/scenarios/:id" element={<ScenarioBuilderPage />} />

                <Route path="/variance" element={<VarianceDashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/analytics/benchmarking" element={<BenchmarkingPage />} />
                <Route path="/analytics/goal-seek" element={<GoalSeekPage />} />
                <Route path="/analytics/dashboard-builder" element={<DashboardBuilderPage />} />
                <Route path="/analytics/pivot-explorer" element={<PivotExplorerPage />} />
                <Route path="/ai" element={<AIIntelligencePage />} />
              </Route>

              {/* Data & GL Group */}
              <Route element={<RouteGroupWrapper domain="dataGL" />}>
                <Route path="/data" element={<DataImportPage />} />
                <Route path="/data/migration" element={<MigrationPage />} />
                <Route path="/data/chart-of-accounts" element={<ChartOfAccountsPage />} />
                <Route path="/data/gl-upload" element={<GLUploadPage />} />
                <Route path="/data/gl-explorer" element={<GLExplorerPage />} />
                <Route path="/data/gl-trial-balance" element={<GLTrialBalancePage />} />
                <Route path="/data/gl-journals" element={<GLJournalsPage />} />
                <Route path="/data/gl-account-analysis" element={<GLAccountAnalysisPage />} />
                <Route path="/data/gl-reporting" element={<GLReportingPage />} />
                <Route path="/audit/trail" element={<AuditTrailPage />} />
                <Route path="/audit/sox" element={<SOXCompliancePage />} />
                <Route path="/periods/close" element={<PeriodClosePage />} />
                <Route path="/budgets/approval" element={<BudgetApproval />} />
                <Route path="/forecasts/drivers" element={<DriverPlanningPage />} />
                <Route path="/forecasts/rolling" element={<RollingForecastPage />} />
                <Route path="/scenarios/compare" element={<ScenarioComparisonPage />} />
                <Route path="/analytics/data-lineage" element={<DataLineagePage />} />
                <Route path="/ai/nlq" element={<NLQChatPage />} />
                <Route path="/data/data-flow" element={<DataFlowMapPage />} />
                <Route path="/data/reconciliation" element={<ReconciliationPage />} />
                <Route path="/data/version-diff" element={<VersionDiffPage />} />
                <Route path="/consolidation/detail" element={<ConsolidationPage />} />
                <Route path="/lease/accounting" element={<LeaseAccountingPage />} />
                <Route path="/capex/tracker" element={<CapexTracker />} />
                <Route path="/admin/benchmarks" element={<BenchmarksPage />} />
                <Route path="/admin/engines" element={<EngineCatalogPage />} />
                <Route path="/banking/banking" element={<BankingDashboard />} />
                <Route path="/banking/reconciliation" element={<BankReconciliation />} />
                <Route path="/banking/statements" element={<BankStatements />} />
                <Route path="/bonds/portfolio" element={<BondPortfolioPage />} />
                <Route path="/bonds/yield-curve" element={<YieldCurvePage />} />
                <Route path="/credit/risk" element={<CreditRiskPage />} />
                <Route path="/construction/dashboard" element={<ConstructionDashboardPage />} />
                <Route path="/construction/equipment" element={<EquipmentManagementPage />} />
                <Route path="/construction/project" element={<ProjectCostingPage />} />
                <Route path="/realestate/dashboard" element={<RealEstateDashboardPage />} />
                <Route path="/realestate/facility" element={<FacilityManagementPage />} />
                <Route path="/realestate/portfolio" element={<PropertyPortfolioPage />} />
                <Route path="/realestate/reit" element={<REITDashboardPage />} />
                <Route path="/realestate/valuation" element={<ValuationPage />} />
                <Route path="/insurance/claims" element={<ClaimsAnalyticsPage />} />
                <Route path="/insurance/dashboard" element={<InsuranceDashboardPage />} />
                <Route path="/insurance/insurance" element={<InsurancePage />} />
                <Route path="/insurance/underwriting" element={<UnderwritingPage />} />
                <Route path="/healthcare/overview" element={<HealthcarePage />} />
                <Route path="/healthcare/value-based" element={<ValueBasedCarePage />} />
                <Route path="/energy/sector" element={<EnergySectorPage />} />
                <Route path="/esg/overview" element={<ESGPage />} />
                <Route path="/manufacturing/overview" element={<ManufacturingPage />} />
                <Route path="/retail/retail" element={<Navigate to="/retail/stores" replace />} />
                <Route
                  path="/retail/dashboard"
                  element={<Navigate to="/retail/stores" replace />}
                />
                <Route path="/retail/inventory" element={<InventoryDashboard />} />
                <Route path="/retail/inventory-planning" element={<InventoryPlanningPage />} />
                <Route path="/retail/performance" element={<StorePerformancePage />} />
                <Route path="/saas/churn-analysis" element={<ChurnAnalysisPage />} />
                <Route path="/saas/overview" element={<SaaSPage />} />
                <Route path="/collaboration/activity" element={<ActivityFeed />} />
                <Route path="/collaboration/shared" element={<SharedReports />} />
                <Route path="/collaboration/team" element={<TeamWorkspace />} />
                <Route path="/settings/backup" element={<BackupRestorePage />} />
                {/* Superseded by /settings/integrations (Integrations hub, ledger #29/#30); kept as a redirect so stale bookmarks/links land on the real surface. */}
                <Route
                  path="/settings/connectors"
                  element={<Navigate to="/settings/integrations" replace />}
                />
                <Route path="/settings/integrations" element={<IntegrationSettingsPage />} />
                <Route path="/settings/security" element={<SecuritySettingsPage />} />
                <Route path="/templates/preview" element={<TemplatePreviewPage />} />
                <Route
                  path="/charts/chart-of-accounts"
                  element={<Navigate to="/data/chart-of-accounts" replace />}
                />
                <Route path="/charts/showcase" element={<ChartShowcasePage />} />
                <Route path="/reports/designer" element={<ReportDesignerPage />} />
                <Route path="/reports/scheduler" element={<ReportScheduler />} />
                <Route path="/reports/library" element={<ReportTemplateLibraryPage />} />
                <Route path="/reports/book-builder" element={<ReportBookBuilder />} />
                <Route path="/reports/templates" element={<FinancialStatementTemplates />} />
              </Route>

              {/* Financial Operations Group */}
              <Route element={<RouteGroupWrapper domain="finops" />}>
                <Route path="/consolidation" element={<ConsolidationDashboard />} />
                <Route path="/consolidation/ic-eliminations" element={<ICEliminationPage />} />
                <Route path="/consolidation/ownership" element={<OwnershipTreePage />} />
                {/* W0.5 slice 3 (RC3): namespace hub roots declared as shell
                    targets but never routed now resolve to their canonical
                    child instead of the 404 catch-all (/revenue is exercised
                    by src/pages/smoke2.test.tsx at this URL). */}
                <Route path="/currency" element={<Navigate to="/currency/fx-rates" replace />} />
                <Route path="/currency/fx-rates" element={<FXRatesPage />} />
                <Route path="/currency/translation" element={<TranslationResultPage />} />
                <Route path="/currency/hedging" element={<HedgeManagementPage />} />
                <Route path="/revenue" element={<Navigate to="/revenue/rev-rec" replace />} />
                <Route path="/revenue/rev-rec" element={<RevRecDashboard />} />
                <Route path="/revenue/deferred" element={<DeferredSchedulePage />} />
                <Route path="/lease" element={<LeaseDashboard />} />
                <Route path="/lease/:id" element={<LeaseDetailPage />} />
                <Route path="/tax" element={<Navigate to="/tax/provision" replace />} />
                <Route path="/tax/provision" element={<TaxProvisionPage />} />
                <Route path="/tax/transfer-pricing" element={<TransferPricingPage />} />
                <Route path="/capex" element={<CapExDashboard />} />
                <Route path="/capex/depreciation" element={<DepreciationForecastPage />} />
              </Route>

              {/* Cash & Treasury Group */}
              <Route element={<RouteGroupWrapper domain="cash" />}>
                <Route path="/cash/forecast" element={<CashForecastPage />} />
                <Route path="/cash/debt" element={<DebtSchedulePage />} />
                <Route path="/cash/working-capital" element={<WorkingCapitalPage />} />
                {/* W0.5 slice 3 (RC3): treasury hub root → first canonical child. */}
                <Route path="/treasury" element={<Navigate to="/treasury/investments" replace />} />
                <Route path="/treasury/investments" element={<InvestmentPage />} />
                <Route path="/treasury/fx-exposure" element={<FXExposurePage />} />
                <Route path="/treasury/loan-amortization" element={<LoanAmortizationPage />} />
              </Route>

              {/* Reports Group */}
              <Route element={<RouteGroupWrapper domain="reports" />}>
                <Route path="/reports" element={<ReportsListPage />} />
                <Route path="/reports/profit-loss" element={<ProfitLossPage />} />
                <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />
                <Route path="/reports/cash-flow" element={<CashFlowPage />} />
                <Route path="/reports/three-statement" element={<ThreeStatementDashboardPage />} />
                <Route path="/reports/budget-vs-actual" element={<BudgetVsActualPage />} />
                <Route path="/board-pack" element={<BoardPackPage />} />
                <Route path="/templates" element={<TemplateGalleryPage />} />
              </Route>

              {/* Industry-Specific & Workforce Group */}
              <Route element={<RouteGroupWrapper domain="industry" />}>
                {/* W0.5 slice 3 (RC3): workforce hub root → first canonical child. */}
                <Route path="/workforce" element={<Navigate to="/workforce/headcount" replace />} />
                <Route path="/workforce/headcount" element={<HeadcountPlanPage />} />
                <Route path="/workforce/compensation" element={<CompModelingPage />} />
                <Route path="/workforce/payroll" element={<PayrollForecastPage />} />
                <Route path="/saas/arr" element={<ARRDashboard />} />
                <Route path="/saas/cohort" element={<CohortAnalysisPage />} />
                <Route path="/saas/churn" element={<ChurnDashboard />} />
                <Route path="/manufacturing/production" element={<ProductionDashboardPage />} />
                <Route path="/manufacturing/cogs" element={<COGSVariancePage />} />
                <Route path="/manufacturing/inventory" element={<InventoryPage />} />
                <Route path="/retail/stores" element={<StoreDashboardPage />} />
                <Route path="/retail/promo" element={<PromoAnalysisPage />} />
                <Route path="/banking/nim" element={<NIMDashboardPage />} />
                <Route path="/banking/capital" element={<CapitalAdequacyPage />} />
                <Route path="/banking/loan-loss" element={<LoanLossPage />} />
                <Route path="/healthcare/dashboard" element={<HealthcareDashboardPage />} />
                <Route path="/healthcare/revenue" element={<PatientRevenuePage />} />
                <Route path="/healthcare/clinical-trials" element={<ClinicalTrialCostPage />} />
                <Route path="/energy/dashboard" element={<EnergyDashboardPage />} />
                <Route path="/energy/production" element={<EnergyProductionDashboard />} />
                <Route path="/energy/risk" element={<EnergyRiskPage />} />
                <Route path="/energy/renewable" element={<RenewableEnergyPage />} />
                <Route path="/energy/emissions" element={<EmissionsTradingPage />} />
                <Route path="/esg/carbon" element={<CarbonDashboardPage />} />
                <Route path="/esg/csrd" element={<CSRDReportPage />} />
              </Route>

              {/* Utility & Collaboration Group */}
              <Route element={<RouteGroupWrapper domain="utility" />}>
                {/* W0.5 slice 3 (RC3): admin/accounting hub roots → canonical
                    children (/admin is navigated by tests/e2e/workflows/
                    12-admin.spec.ts). */}
                <Route path="/admin" element={<Navigate to="/admin/debug" replace />} />
                <Route path="/admin/debug" element={<DebugPage />} />
                <Route
                  path="/accounting"
                  element={<Navigate to="/accounting/depreciation" replace />}
                />
                <Route path="/accounting/depreciation" element={<DepreciationPage />} />
                <Route path="/accounting/multi-book" element={<MultiBookPage />} />
                <Route path="/audit/fair-value" element={<FairValuePage />} />
                <Route path="/audit/impairment" element={<ImpairmentPage />} />
                <Route path="/reports/segment" element={<SegmentReportingPage />} />
                <Route path="/collaboration" element={<CollaborationPage />} />
                <Route path="/collaboration/approvals" element={<ApprovalQueuePage />} />
                <Route path="/plugins" element={<PluginMarketplacePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/users" element={<UserManagementPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/docs/api" element={<ApiReferencePage />} />
              </Route>

              {/* Phase 4 G11 — Sector dashboards + aliases.
                  These render inside AppLayout so industry screens keep the
                  sidebar, navbar and financial context bar like every other
                  page; previously they sat outside the layout (and after the
                  catch-all), so they matched but rendered with no app chrome
                  and no way to navigate onward. */}
              <Route element={<RouteGroupWrapper domain="industry" />}>
                {/* Phase 4 G11 — Sector dashboards (18) + aliases */}
                <Route path="/sector/agriculture" element={<AgricultureDashboardPage />} />
                <Route path="/sector/banking" element={<SectorBankingDashboardPage />} />
                <Route path="/sector/construction" element={<SectorConstructionDashboardPage />} />
                <Route path="/sector/education" element={<SectorEducationDashboardPage />} />
                <Route path="/sector/emissions" element={<EmissionsDashboardPage />} />
                <Route path="/sector/energy" element={<SectorEnergyDashboardPage />} />
                <Route path="/sector/equipment" element={<EquipmentDashboardPage />} />
                <Route path="/sector/government" element={<SectorGovernmentDashboardPage />} />
                <Route path="/sector/healthcare" element={<SectorHealthcareDashboardPage />} />
                <Route path="/sector/hospitality" element={<HospitalityDashboardPage />} />
                <Route path="/sector/insurance" element={<SectorInsuranceDashboardPage />} />
                <Route path="/sector/logistics" element={<SectorLogisticsDashboardPage />} />
                <Route
                  path="/sector/manufacturing"
                  element={<SectorManufacturingDashboardPage />}
                />
                <Route path="/sector/real-estate" element={<SectorRealEstateDashboardPage />} />
                <Route path="/sector/retail" element={<SectorRetailDashboardPage />} />
                <Route path="/sector/sector" element={<SectorDashboardPage />} />
                <Route path="/sector/technology" element={<TechnologyDashboardPage />} />
                <Route
                  path="/sector/telecommunications"
                  element={<TelecommunicationsDashboardPage />}
                />
                <Route
                  path="/sectors/education"
                  element={<Navigate to="/sector/education" replace />}
                />
                <Route
                  path="/sectors/government"
                  element={<Navigate to="/sector/government" replace />}
                />
                <Route
                  path="/sectors/logistics"
                  element={<Navigate to="/sector/logistics" replace />}
                />
                <Route
                  path="/sectors/telecom"
                  element={<Navigate to="/sector/telecommunications" replace />}
                />
                {/* W0.5 slice 1 (RC3): alias roots redirect to canonical sector pages. */}
                <Route path="/education" element={<Navigate to="/sector/education" replace />} />
                <Route path="/education/enrollment" element={<EnrollmentRetentionPage />} />
                <Route path="/education/research-grants" element={<ResearchGrantsPage />} />
                <Route path="/government" element={<Navigate to="/sector/government" replace />} />
                <Route path="/government/grants" element={<GrantDisbursementPage />} />
                <Route path="/government/procurement" element={<ProcurementCyclePage />} />
                <Route path="/logistics" element={<Navigate to="/sector/logistics" replace />} />
                <Route path="/logistics/fleet-cost" element={<FleetCostDashboardPage />} />
                <Route path="/logistics/warehouse-cost" element={<WarehouseCostDashboardPage />} />
                <Route
                  path="/telecom"
                  element={<Navigate to="/sector/telecommunications" replace />}
                />
                <Route path="/forecasts/compare" element={<Navigate to="/scenarios" replace />} />
                <Route
                  path="/forecasts/auto-update"
                  element={<Navigate to="/forecasts" replace />}
                />
                <Route path="/scenarios/merge" element={<Navigate to="/scenarios" replace />} />
                <Route path="/scenarios/lock" element={<Navigate to="/scenarios" replace />} />
              </Route>

              {/* W0.5 slice 2 (RC3): rescue aliases for deep links that were never
                  declared routes — journey specs (tests/e2e/journeys/*), stale
                  bookmarks and old menu entries now land on the real surface
                  instead of the 404 catch-all. Navigate-only: no chrome needed,
                  but they live inside the shell so the UI-03 route-shell contract
                  sees them as ordinary in-shell paths. */}
              <Route element={<RouteGroupWrapper domain="utility" />}>
                {/* Audit family */}
                <Route path="/audit" element={<Navigate to="/audit/trail" replace />} />
                <Route path="/audit-trail" element={<Navigate to="/audit/trail" replace />} />
                <Route path="/sox" element={<Navigate to="/audit/sox" replace />} />
                <Route path="/compliance/sox" element={<Navigate to="/audit/sox" replace />} />

                {/* Period close family */}
                <Route path="/periods" element={<Navigate to="/periods/close" replace />} />
                <Route path="/period-close" element={<Navigate to="/periods/close" replace />} />
                <Route
                  path="/period-close/trial-balance"
                  element={<Navigate to="/periods/close" replace />}
                />
                <Route
                  path="/period-close/consolidation"
                  element={<Navigate to="/periods/close" replace />}
                />
                <Route
                  path="/period-close/lock"
                  element={<Navigate to="/periods/close" replace />}
                />
                <Route
                  path="/period-close/checklist"
                  element={<Navigate to="/periods/close" replace />}
                />
                <Route
                  path="/period-close/signoff"
                  element={<Navigate to="/periods/close" replace />}
                />

                {/* Cash & treasury */}
                <Route path="/cash-forecast" element={<Navigate to="/cash/forecast" replace />} />
                <Route path="/fx-rates" element={<Navigate to="/currency/fx-rates" replace />} />

                {/* Data & GL */}
                <Route
                  path="/reconciliation"
                  element={<Navigate to="/data/reconciliation" replace />}
                />
                <Route
                  path="/reports/trial-balance"
                  element={<Navigate to="/data/gl-trial-balance" replace />}
                />

                {/* Settings */}
                <Route path="/backup" element={<Navigate to="/settings/backup" replace />} />
                <Route
                  path="/backup/restore"
                  element={<Navigate to="/settings/backup" replace />}
                />

                {/* Reporting */}
                <Route path="/reports/variance" element={<Navigate to="/variance" replace />} />
                <Route
                  path="/reports/board-pack/new"
                  element={<Navigate to="/board-pack" replace />}
                />

                {/* Consolidation */}
                <Route
                  path="/ic-elimination"
                  element={<Navigate to="/consolidation/ic-eliminations" replace />}
                />
                <Route
                  path="/intercompany/*"
                  element={<Navigate to="/consolidation/ic-eliminations" replace />}
                />
              </Route>
            </Route>

            <Route
              path="*"
              element={
                <ErrorBoundary>
                  <NotFoundPage />
                </ErrorBoundary>
              }
            />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </Router>
  );
}
