/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AsyncErrorBoundary } from './components/ui/AsyncErrorBoundary';
import {
  RouteGroupErrorBoundary,
  RouteSkeleton,
} from './components/errors/RouteGroupErrorBoundary';
import { useFirstRun } from './hooks/useFirstRun';

// Core (not route-dependent)
const OnboardingWizard = lazy(
  () => import('./components/ui/OnboardingWizard').then((m) => ({ default: m.default })) as any
);

// Auth
const LoginPage = lazy(
  () => import('./pages/auth/LoginPage').then((m) => ({ default: m.default })) as any
);
const RegisterPage = lazy(
  () => import('./pages/auth/RegisterPage').then((m) => ({ default: m.default })) as any
);
const ForgotPasswordPage = lazy(
  () =>
    import('./pages/auth/ForgotPasswordPage').then((m) => ({
      default: m.default,
    })) as any
);
const OnboardingWizardWrapper = lazy(
  () => import('./pages/auth/OnboardingWizard').then((m) => ({ default: m.default })) as any
);

// Core
const DashboardPage = lazy(
  () => import('./pages/DashboardPage').then((m) => ({ default: m.default })) as any
);
const BudgetListPage = lazy(
  () => import('./pages/budgets/BudgetListPage').then((m) => ({ default: m.default })) as any
);
const BudgetCreatePage = lazy(
  () => import('./pages/budgets/BudgetCreatePage').then((m) => ({ default: m.default })) as any
);
const BudgetDetailPage = lazy(
  () => import('./pages/budgets/BudgetDetailPage').then((m) => ({ default: m.default })) as any
);
const BudgetVAReport = lazy(
  () => import('./pages/budgets/BudgetVAReport').then((m) => ({ default: m.default })) as any
);
const ForecastListPage = lazy(
  () =>
    import('./pages/forecasts/ForecastListPage').then((m) => ({
      default: m.default,
    })) as any
);
const ForecastBuilderPage = lazy(
  () =>
    import('./pages/forecasts/ForecastBuilderPage').then((m) => ({
      default: m.default,
    })) as any
);
const WhatIfPage = lazy(
  () => import('./pages/forecasts/WhatIfPage').then((m) => ({ default: m.default })) as any
);
const ReportsListPage = lazy(() => import('./pages/reports/ReportsListPage') as any);
const VarianceDashboardPage = lazy(() => import('./pages/variance/VarianceDashboardPage') as any);
const ScenarioListPage = lazy(() => import('./pages/scenarios/ScenarioListPage') as any);
const ScenarioBuilderPage = lazy(() => import('./pages/scenarios/ScenarioBuilderPage') as any);
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage') as any);
const BenchmarkingPage = lazy(() => import('./pages/analytics/BenchmarkingPage') as any);
const GoalSeekPage = lazy(() => import('./pages/analytics/GoalSeekPage') as any);
const AIIntelligencePage = lazy(() => import('./pages/ai/AIIntelligencePage') as any);

// Data & GL
const GLUploadPage = lazy(() => import('./pages/data/GLUploadPage') as any);
const GLExplorerPage = lazy(() => import('./pages/data/GLExplorerPage') as any);
const GLTrialBalancePage = lazy(() => import('./pages/data/GLTrialBalancePage') as any);
const GLJournalsPage = lazy(() => import('./pages/data/GLJournalsPage') as any);
const GLAccountAnalysisPage = lazy(() => import('./pages/data/GLAccountAnalysisPage') as any);
const GLReportingPage = lazy(() => import('./pages/data/GLReportingPage') as any);
const DataImportPage = lazy(() => import('./pages/data/DataImportPage') as any);
const MigrationPage = lazy(() => import('./pages/data/MigrationPage') as any);
const ChartOfAccountsPage = lazy(() => import('./pages/data/ChartOfAccountsPage') as any);
const AuditTrailPage = lazy(() => import('./pages/audit/AuditTrailPage') as any);

// Financial Ops
const ConsolidationDashboard = lazy(
  () => import('./pages/consolidation/ConsolidationDashboard') as any
);
const ICEliminationPage = lazy(() => import('./pages/consolidation/ICEliminationPage') as any);
const OwnershipTreePage = lazy(() => import('./pages/consolidation/OwnershipTreePage') as any);
const FXRatesPage = lazy(() => import('./pages/currency/FXRatesPage') as any);
const TranslationResultPage = lazy(() => import('./pages/currency/TranslationResultPage') as any);
const HedgeManagementPage = lazy(() => import('./pages/currency/HedgeManagementPage') as any);
const RevRecDashboard = lazy(() => import('./pages/revenue/RevRecDashboard'));
const DeferredSchedulePage = lazy(() => import('./pages/revenue/DeferredSchedulePage') as any);
const LeaseDashboard = lazy(() => import('./pages/lease/LeaseDashboard') as any);
const LeaseDetailPage = lazy(() => import('./pages/lease/LeaseDetailPage') as any);
const TaxProvisionPage = lazy(() => import('./pages/tax/TaxProvisionPage') as any);
const TransferPricingPage = lazy(() => import('./pages/tax/TransferPricingPage') as any);
const CapExDashboard = lazy(() => import('./pages/capex/CapExDashboard'));
const DepreciationForecastPage = lazy(() => import('./pages/capex/DepreciationForecastPage'));
const DepreciationPage = lazy(() => import('./pages/accounting/DepreciationPage') as any);
const MultiBookPage = lazy(() => import('./pages/accounting/MultiBookPage') as any);
const FairValuePage = lazy(() => import('./pages/audit/FairValuePage') as any);
const ImpairmentPage = lazy(() => import('./pages/audit/ImpairmentPage') as any);
const SegmentReportingPage = lazy(() => import('./pages/reports/SegmentReportingPage') as any);
const DashboardBuilderPage = lazy(() => import('./pages/analytics/DashboardBuilderPage') as any);
const PivotExplorerPage = lazy(() => import('./pages/analytics/PivotExplorerPage') as any);
const DebugPage = lazy(() => import('./pages/admin/DebugPage') as any);
const PluginMarketplacePage = lazy(() => import('./pages/plugins/PluginMarketplacePage') as any);

// Cash & Treasury
const CashForecastPage = lazy(() => import('./pages/cash/CashForecastPage') as any);
const DebtSchedulePage = lazy(() => import('./pages/cash/DebtSchedulePage') as any);
const WorkingCapitalPage = lazy(() => import('./pages/cash/WorkingCapitalPage') as any);
const InvestmentPage = lazy(() => import('./pages/treasury/InvestmentPage') as any);
const FXExposurePage = lazy(() => import('./pages/treasury/FXExposurePage') as any);

// Workforce
const HeadcountPlanPage = lazy(() => import('./pages/workforce/HeadcountPlanPage') as any);
const CompModelingPage = lazy(() => import('./pages/workforce/CompModelingPage') as any);
const PayrollForecastPage = lazy(() => import('./pages/workforce/PayrollForecastPage') as any);

// Reports
const ProfitLossPage = lazy(() => import('./pages/reports/ProfitLossPage') as any);
const ThreeStatementDashboardPage = lazy(
  () => import('./pages/reports/ThreeStatementDashboardPage')
);
const BalanceSheetPage = lazy(() => import('./pages/reports/BalanceSheetPage') as any);
const CashFlowPage = lazy(() => import('./pages/reports/CashFlowPage') as any);
const BudgetVsActualPage = lazy(() => import('./pages/reports/BudgetVsActualPage') as any);
const BoardPackPage = lazy(() => import('./pages/reports/BoardPackPage') as any);
const ReportDesignerPage = lazy(() => import('./pages/reports/ReportDesignerPage') as any);
const TemplateGalleryPage = lazy(() => import('./pages/templates/TemplateGalleryPage') as any);

// Industry: SaaS
const ARRDashboard = lazy(() => import('./pages/saas/ARRDashboard') as any);
const CohortAnalysisPage = lazy(() => import('./pages/saas/CohortAnalysisPage') as any);
const ChurnDashboard = lazy(() => import('./pages/saas/ChurnDashboard') as any);

// Industry: Manufacturing
const ProductionDashboardPage = lazy(
  () => import('./pages/manufacturing/ProductionDashboardPage') as any
);
const COGSVariancePage = lazy(() => import('./pages/manufacturing/COGSVariancePage') as any);
const InventoryPage = lazy(() => import('./pages/manufacturing/InventoryPage') as any);

// Industry: Retail
const StoreDashboardPage = lazy(() => import('./pages/retail/StoreDashboardPage') as any);
const PromoAnalysisPage = lazy(() => import('./pages/retail/PromoAnalysisPage') as any);

// Industry: Banking
const NIMDashboardPage = lazy(() => import('./pages/banking/NIMDashboardPage') as any);
const CapitalAdequacyPage = lazy(() => import('./pages/banking/CapitalAdequacyPage') as any);
const LoanLossPage = lazy(() => import('./pages/banking/LoanLossPage') as any);

// Industry: Healthcare
const HealthcareDashboardPage = lazy(
  () => import('./pages/healthcare/HealthcareDashboardPage') as any
);
const PatientRevenuePage = lazy(() => import('./pages/healthcare/PatientRevenuePage') as any);
const ClinicalTrialCostPage = lazy(() => import('./pages/healthcare/ClinicalTrialCostPage') as any);

// Industry: Energy & ESG
const EnergyDashboardPage = lazy(() => import('./pages/energy/EnergyDashboardPage') as any);
const EnergyProductionDashboard = lazy(
  () => import('./pages/energy/EnergyProductionDashboard') as any
);
const EnergyRiskPage = lazy(() => import('./pages/energy/EnergyRiskPage') as any);
const RenewableEnergyPage = lazy(() => import('./pages/energy/RenewableEnergyPage') as any);
const EmissionsTradingPage = lazy(() => import('./pages/energy/EmissionsTradingPage') as any);
const CarbonDashboardPage = lazy(() => import('./pages/esg/CarbonDashboardPage') as any);
const CSRDReportPage = lazy(() => import('./pages/esg/CSRDReportPage') as any);

// Utility
const CollaborationPage = lazy(() => import('./pages/collaboration/CollaborationPage') as any);
const ApprovalQueuePage = lazy(() => import('./pages/collaboration/ApprovalQueuePage') as any);
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage') as any);
const UserManagementPage = lazy(() => import('./pages/settings/UserManagementPage') as any);
const ProfilePage = lazy(() => import('./pages/ProfilePage') as any);
const HelpPage = lazy(() => import('./pages/HelpPage') as any);
const ApiReferencePage = lazy(() => import('./pages/docs/ApiReferencePage') as any);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage') as any);
const DrillDownWindowPage = lazy(() => import('./pages/DrillDownWindowPage') as any);

// Phase 4 G11 - additional pages (re-import batch)
const BudgetApproval = lazy(() => import('./pages/budgets/BudgetApproval') as any);
const DriverPlanningPage = lazy(() => import('./pages/forecasts/DriverPlanningPage') as any);
const RollingForecastPage = lazy(() => import('./pages/forecasts/RollingForecastPage') as any);
const ScenarioComparisonPage = lazy(
  () => import('./pages/scenarios/ScenarioComparisonPage') as any
);
const DataLineagePage = lazy(() => import('./pages/analytics/DataLineagePage') as any);
const NLQChatPage = lazy(() => import('./pages/ai/NLQChatPage') as any);
const DataFlowMapPage = lazy(() => import('./pages/data/DataFlowMapPage') as any);
const DataSummaryCard = lazy(() => import('./pages/data/DataSummaryCard') as any);
const MigrationWizard = lazy(() => import('./pages/data/MigrationWizard') as any);
const ReconciliationPage = lazy(() => import('./pages/data/ReconciliationPage') as any);
const ImportJobHistory = lazy(() => import('./pages/data/ImportJobHistory') as any);
const VersionDiffPage = lazy(() => import('./pages/data/VersionDiffPage') as any);
const SOXCompliancePage = lazy(() => import('./pages/audit/SOXCompliancePage') as any);
const ConsolidationPage = lazy(() => import('./pages/consolidation/ConsolidationPage') as any);
const LeaseAccountingPage = lazy(() => import('./pages/lease/LeaseAccountingPage') as any);
const CapexTracker = lazy(() => import('./pages/capex/CapexTracker') as any);
const BenchmarksPage = lazy(() => import('./pages/admin/BenchmarksPage') as any);
const BankingDashboard = lazy(() => import('./pages/banking/BankingDashboard') as any);
const BankReconciliation = lazy(() => import('./pages/banking/BankReconciliation') as any);
const BankStatements = lazy(() => import('./pages/banking/BankStatements') as any);
const BondPortfolioPage = lazy(() => import('./pages/bonds/BondPortfolioPage') as any);
const YieldCurvePage = lazy(() => import('./pages/bonds/YieldCurvePage') as any);
const CreditRiskPage = lazy(() => import('./pages/credit/CreditRiskPage') as any);
const ConstructionDashboardPage = lazy(
  () => import('./pages/construction/ConstructionDashboardPage')
);
const EquipmentManagementPage = lazy(
  () => import('./pages/construction/EquipmentManagementPage') as any
);
const ProjectCostingPage = lazy(() => import('./pages/construction/ProjectCostingPage') as any);
const RealEstateDashboardPage = lazy(
  () => import('./pages/realestate/RealEstateDashboardPage') as any
);
const FacilityManagementPage = lazy(
  () => import('./pages/realestate/FacilityManagementPage') as any
);
const PropertyPortfolioPage = lazy(() => import('./pages/realestate/PropertyPortfolioPage') as any);
const REITDashboardPage = lazy(() => import('./pages/realestate/REITDashboardPage') as any);
const ValuationPage = lazy(() => import('./pages/realestate/ValuationPage') as any);
const ClaimsAnalyticsPage = lazy(() => import('./pages/insurance/ClaimsAnalyticsPage') as any);
const InsuranceDashboardPage = lazy(
  () => import('./pages/insurance/InsuranceDashboardPage') as any
);
const InsurancePage = lazy(() => import('./pages/insurance/InsurancePage') as any);
const UnderwritingPage = lazy(() => import('./pages/insurance/UnderwritingPage') as any);
const HealthcarePage = lazy(() => import('./pages/healthcare/HealthcarePage') as any);
const ValueBasedCarePage = lazy(() => import('./pages/healthcare/ValueBasedCarePage') as any);
const EnergySectorPage = lazy(() => import('./pages/energy/EnergySectorPage') as any);
const ESGPage = lazy(() => import('./pages/esg/ESGPage') as any);
const ManufacturingPage = lazy(() => import('./pages/manufacturing/ManufacturingPage') as any);
const RetailDashboard = lazy(() => import('./pages/retail/RetailDashboard') as any);
const RetailDashboardPage = lazy(() => import('./pages/retail/RetailDashboardPage') as any);
const InventoryDashboard = lazy(() => import('./pages/retail/InventoryDashboard') as any);
const InventoryPlanningPage = lazy(() => import('./pages/retail/InventoryPlanningPage') as any);
const StorePerformancePage = lazy(() => import('./pages/retail/StorePerformancePage') as any);
const ChurnAnalysisPage = lazy(() => import('./pages/saas/ChurnAnalysisPage') as any);
const SaaSPage = lazy(() => import('./pages/saas/SaaSPage') as any);
const ReportScheduler = lazy(() => import('./pages/reports/ReportScheduler') as any);
const ReportTemplateLibraryPage = lazy(
  () => import('./pages/reports/ReportTemplateLibraryPage') as any
);
const ReportBookBuilder = lazy(() => import('./pages/reports/ReportBookBuilder') as any);
const FinancialStatementTemplates = lazy(
  () => import('./pages/reports/FinancialStatementTemplates')
);
const TemplatePreviewPage = lazy(() => import('./pages/templates/TemplatePreviewPage') as any);
const ChartShowcasePage = lazy(() => import('./pages/charts/ChartShowcasePage') as any);
const ChartOfAccountsPageCharts = lazy(() => import('./pages/charts/ChartOfAccountsPage') as any);
const ActivityFeed = lazy(() => import('./pages/collaboration/ActivityFeed') as any);
const SharedReports = lazy(() => import('./pages/collaboration/SharedReports') as any);
const TeamWorkspace = lazy(() => import('./pages/collaboration/TeamWorkspace') as any);
const BackupRestorePage = lazy(() => import('./pages/settings/BackupRestorePage') as any);
const ConnectorSettingsPage = lazy(() => import('./pages/settings/ConnectorSettingsPage') as any);
const IntegrationSettingsPage = lazy(
  () => import('./pages/settings/IntegrationSettingsPage') as any
);
const SecuritySettingsPage = lazy(() => import('./pages/settings/SecuritySettingsPage') as any);

// Phase 4 G11 - Sector dashboards (18 sector/* + 4 sectors/* + 4 legacy aliases)
const AgricultureDashboardPage = lazy(
  () => import('./pages/sector/AgricultureDashboardPage') as any
);
const SectorBankingDashboardPage = lazy(() => import('./pages/sector/BankingDashboardPage') as any);
const SectorConstructionDashboardPage = lazy(
  () => import('./pages/sector/ConstructionDashboardPage')
);
const SectorEducationDashboardPage = lazy(
  () => import('./pages/sector/EducationDashboardPage') as any
);
const EmissionsDashboardPage = lazy(() => import('./pages/sector/EmissionsTradingPage') as any);
const SectorEnergyDashboardPage = lazy(() => import('./pages/sector/EnergyDashboardPage') as any);
const EquipmentDashboardPage = lazy(() => import('./pages/sector/EquipmentManagementPage') as any);
const SectorGovernmentDashboardPage = lazy(
  () => import('./pages/sector/GovernmentDashboardPage') as any
);
const SectorHealthcareDashboardPage = lazy(
  () => import('./pages/sector/HealthcareDashboardPage') as any
);
const HospitalityDashboardPage = lazy(
  () => import('./pages/sector/HospitalityDashboardPage') as any
);
const SectorInsuranceDashboardPage = lazy(
  () => import('./pages/sector/InsuranceDashboardPage') as any
);
const SectorLogisticsDashboardPage = lazy(
  () => import('./pages/sector/LogisticsDashboardPage') as any
);
const SectorManufacturingDashboardPage = lazy(
  () => import('./pages/sector/ManufacturingDashboardPage')
);
const SectorRealEstateDashboardPage = lazy(
  () => import('./pages/sector/RealEstateDashboardPage') as any
);
const SectorRetailDashboardPage = lazy(() => import('./pages/sector/RetailDashboardPage') as any);
const SectorDashboardPage = lazy(() => import('./pages/sector/SectorPage') as any);
const TechnologyDashboardPage = lazy(() => import('./pages/sector/TechnologyDashboardPage') as any);
const TelecommunicationsDashboardPage = lazy(
  () => import('./pages/sector/TelecomDashboardPage') as any
);
const SectorsEducationDashboardPage = lazy(
  () => import('./pages/sectors/EducationDashboardPage') as any
);
const SectorsGovernmentDashboardPage = lazy(
  () => import('./pages/sectors/GovernmentDashboardPage') as any
);
const SectorsLogisticsDashboardPage = lazy(
  () => import('./pages/sectors/LogisticsDashboardPage') as any
);
const SectorsTelecomDashboardPage = lazy(
  () => import('./pages/sectors/TelecomDashboardPage') as any
);
const EducationPage = lazy(() => import('./pages/sector/EducationDashboardPage') as any);
const GovernmentPage = lazy(() => import('./pages/sector/GovernmentDashboardPage') as any);
const LogisticsPage = lazy(() => import('./pages/sector/LogisticsDashboardPage') as any);
const TelecomPage = lazy(() => import('./pages/sector/TelecomDashboardPage') as any);
/**
 * RouteGroupWrapper provides a shared ErrorBoundary and Suspense context
 * for logical groups of routes, using domain-aware error boundaries
 * and loading skeletons.
 */
function RouteGroupWrapper({ domain }: { domain: keyof typeof DOMAIN_MAP }) {
  return (
    <RouteGroupErrorBoundary domain={domain}>
      <Suspense fallback={<RouteSkeleton domain={domain} />}>
        <Outlet />
      </Suspense>
    </RouteGroupErrorBoundary>
  );
}

/** Domain map for RouteGroupWrapper */
const DOMAIN_MAP = {
  core: 'core' as const,
  dataGL: 'dataGL' as const,
  finops: 'finops' as const,
  cash: 'cash' as const,
  reports: 'reports' as const,
  industry: 'industry' as const,
  utility: 'utility' as const,
};

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export default function App() {
  const { isFirstRun, completeSetup } = useFirstRun();

  if (!isTauri) {
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
              <Route
                path="/"
                element={
                  <ErrorBoundary>
                    <DashboardPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ErrorBoundary>
                    <DashboardPage />
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
                <Route path="/budgets/approval" element={<BudgetApproval />} />
                <Route path="/forecasts/drivers" element={<DriverPlanningPage />} />
                <Route path="/forecasts/rolling" element={<RollingForecastPage />} />
                <Route path="/scenarios/compare" element={<ScenarioComparisonPage />} />
                <Route path="/analytics/data-lineage" element={<DataLineagePage />} />
                <Route path="/ai/nlq" element={<NLQChatPage />} />
                <Route path="/data/data-flow" element={<DataFlowMapPage />} />
                <Route path="/data/data-summary" element={<DataSummaryCard />} />
                <Route path="/data/migration-wizard" element={<MigrationWizard />} />
                <Route path="/data/reconciliation" element={<ReconciliationPage />} />
                <Route path="/data/import-history" element={<ImportJobHistory />} />
                <Route path="/data/version-diff" element={<VersionDiffPage />} />
                <Route path="/consolidation/detail" element={<ConsolidationPage />} />
                <Route path="/lease/accounting" element={<LeaseAccountingPage />} />
                <Route path="/capex/tracker" element={<CapexTracker />} />
                <Route path="/admin/benchmarks" element={<BenchmarksPage />} />
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
                <Route path="/retail/dashboard" element={<RetailDashboardPage />} />
                <Route path="/retail/inventory" element={<InventoryDashboard />} />
                <Route path="/retail/inventory-planning" element={<InventoryPlanningPage />} />
                <Route path="/retail/retail" element={<RetailDashboard />} />
                <Route path="/retail/performance" element={<StorePerformancePage />} />
                <Route path="/saas/churn-analysis" element={<ChurnAnalysisPage />} />
                <Route path="/saas/overview" element={<SaaSPage />} />
                <Route path="/collaboration/activity" element={<ActivityFeed />} />
                <Route path="/collaboration/shared" element={<SharedReports />} />
                <Route path="/collaboration/team" element={<TeamWorkspace />} />
                <Route path="/settings/backup" element={<BackupRestorePage />} />
                <Route path="/settings/connectors" element={<ConnectorSettingsPage />} />
                <Route path="/settings/integrations" element={<IntegrationSettingsPage />} />
                <Route path="/settings/security" element={<SecuritySettingsPage />} />
                <Route path="/templates/preview" element={<TemplatePreviewPage />} />
                <Route path="/charts/chart-of-accounts" element={<ChartOfAccountsPageCharts />} />
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
                <Route path="/currency/fx-rates" element={<FXRatesPage />} />
                <Route path="/currency/translation" element={<TranslationResultPage />} />
                <Route path="/currency/hedging" element={<HedgeManagementPage />} />
                <Route path="/revenue/rev-rec" element={<RevRecDashboard />} />
                <Route path="/revenue/deferred" element={<DeferredSchedulePage />} />
                <Route path="/lease" element={<LeaseDashboard />} />
                <Route path="/lease/:id" element={<LeaseDetailPage />} />
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
                <Route path="/treasury/investments" element={<InvestmentPage />} />
                <Route path="/treasury/fx-exposure" element={<FXExposurePage />} />
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
                <Route path="/admin/debug" element={<DebugPage />} />
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
            </Route>

            <Route
              path="*"
              element={
                <ErrorBoundary>
                  <NotFoundPage />
                </ErrorBoundary>
              }
            />
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
            <Route path="/sector/manufacturing" element={<SectorManufacturingDashboardPage />} />
            <Route path="/sector/real-estate" element={<SectorRealEstateDashboardPage />} />
            <Route path="/sector/retail" element={<SectorRetailDashboardPage />} />
            <Route path="/sector/sector" element={<SectorDashboardPage />} />
            <Route path="/sector/technology" element={<TechnologyDashboardPage />} />
            <Route
              path="/sector/telecommunications"
              element={<TelecommunicationsDashboardPage />}
            />
            <Route path="/sectors/education" element={<SectorsEducationDashboardPage />} />
            <Route path="/sectors/government" element={<SectorsGovernmentDashboardPage />} />
            <Route path="/sectors/logistics" element={<SectorsLogisticsDashboardPage />} />
            <Route path="/sectors/telecom" element={<SectorsTelecomDashboardPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/government" element={<GovernmentPage />} />
            <Route path="/logistics" element={<LogisticsPage />} />
            <Route path="/telecom" element={<TelecomPage />} />
            <Route path="/forecasts/compare" element={<ScenarioComparisonPage />} />
            <Route path="/forecasts/auto-update" element={<RollingForecastPage />} />
            <Route path="/scenarios/merge" element={<ScenarioComparisonPage />} />
            <Route path="/scenarios/lock" element={<ScenarioComparisonPage />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </Router>
  );
}
