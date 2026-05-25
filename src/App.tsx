import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import { ErrorBoundary } from './components/ui';
import { useFirstRun } from './hooks/useFirstRun';

// Core (not route-dependent)
const OnboardingWizard = lazy(() => import('./components/ui/OnboardingWizard'));

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OnboardingWizardWrapper = lazy(() => import('./pages/auth/OnboardingWizard'));

// Core
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BudgetListPage = lazy(() => import('./pages/budgets/BudgetListPage'));
const BudgetCreatePage = lazy(() => import('./pages/budgets/BudgetCreatePage'));
const BudgetDetailPage = lazy(() => import('./pages/budgets/BudgetDetailPage'));
const BudgetVAReport = lazy(() => import('./pages/budgets/BudgetVAReport'));
const ForecastListPage = lazy(() => import('./pages/forecasts/ForecastListPage'));
const ForecastBuilderPage = lazy(() => import('./pages/forecasts/ForecastBuilderPage'));
const WhatIfPage = lazy(() => import('./pages/forecasts/WhatIfPage'));
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
const DebugPage = lazy(() => import('./pages/admin/DebugPage'));
const PluginMarketplacePage = lazy(() => import('./pages/plugins/PluginMarketplacePage'));

// Cash & Treasury
const CashForecastPage = lazy(() => import('./pages/cash/CashForecastPage'));
const DebtSchedulePage = lazy(() => import('./pages/cash/DebtSchedulePage'));
const WorkingCapitalPage = lazy(() => import('./pages/cash/WorkingCapitalPage'));
const InvestmentPage = lazy(() => import('./pages/treasury/InvestmentPage'));
const FXExposurePage = lazy(() => import('./pages/treasury/FXExposurePage'));

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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DrillDownWindowPage = lazy(() => import('./pages/DrillDownWindowPage'));

/**
 * RouteGroupWrapper provides a shared ErrorBoundary and Suspense context
 * for logical groups of routes.
 */
function RouteGroupWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

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
              <Route element={<RouteGroupWrapper />}>
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
                <Route path="/ai" element={<AIIntelligencePage />} />
              </Route>

              {/* Data & GL Group */}
              <Route element={<RouteGroupWrapper />}>
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
              </Route>

              {/* Financial Operations Group */}
              <Route element={<RouteGroupWrapper />}>
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
              <Route element={<RouteGroupWrapper />}>
                <Route path="/cash/forecast" element={<CashForecastPage />} />
                <Route path="/cash/debt" element={<DebtSchedulePage />} />
                <Route path="/cash/working-capital" element={<WorkingCapitalPage />} />
                <Route path="/treasury/investments" element={<InvestmentPage />} />
                <Route path="/treasury/fx-exposure" element={<FXExposurePage />} />
              </Route>

              {/* Reports Group */}
              <Route element={<RouteGroupWrapper />}>
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
              <Route element={<RouteGroupWrapper />}>
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
              <Route element={<RouteGroupWrapper />}>
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
