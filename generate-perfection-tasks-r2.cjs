/* eslint-disable */
// Round 2: Append project-specific perfection tasks to docs/task-board.json.
// Targets: engines, stores, pages, components, hooks, workers, services,
// utils, templates, OWASP, CWE, WCAG, compliance, locales, etc.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'docs', 'task-board.json');
const NOW = '2026-06-07T09:30:00.000Z';
const ROLES = ['ada', 'amelia', 'atlas', 'brutus', 'censor', 'cobalt', 'john', 'mary', 'paige', 'sally', 'sentinel'];
let rIdx = 0;
const role = () => ROLES[(rIdx++) % ROLES.length];

let counter = 3700;
const nextId = () => 'T' + String(counter++).padStart(5, '0');

const task = (cat, title, role_, priority, spec) => ({
  id: nextId(),
  cat,
  title,
  role: role_,
  priority,
  spec,
  deps: [],
  status: 'unclaimed',
  claimedBy: '',
  createdAt: NOW,
});

const wrap = (engine, what) => `Perfection pass for ${engine}: ${what}.`;

// ===== ENGINES (60 most critical, 4 perfection tasks each = 240) =====
const criticalEngines = [
  'SafeMathParser', 'FormulaEngine', 'FormulaFunctionRegistry', 'CubeEngine',
  'CubeEnginePersistence', 'ConsolidationEngine', 'ThreeStatementEngine',
  'MonteCarloEngine', 'ForecastMethodEngine', 'DriverCascadeEngine',
  'MasterDataEngine', 'MigrationEngine', 'SOXComplianceEngine',
  'AnomalyDetectionEngine', 'ValidationEngine', 'ReportBuilderEngine',
  'ProfessionalExportEngine', 'NLQEngine', 'AICopilotEngine', 'PluginEngine',
  'WorkflowEngine', 'WorkflowTemplateEngine', 'AllocationEngine',
  'FXEngine', 'MultiCurrencyEngine', 'MultiBookEngine', 'MDXEngine',
  'ExcelImportEngine', 'ImportEngine', 'ExportTemplateEngine',
  'EncryptionEngine', 'SessionEngine', 'AuthEngine', 'DataClassificationEngine',
  'CubeSecurityEngine', 'EncryptionEngine', 'RecentFilesEngine',
  'TaxEngine', 'RevRecEngine', 'LeaseEngine', 'DepreciationEngine',
  'BondPricingEngine', 'OptionPricingEngine', 'FairValueEngine',
  'BankingEngine', 'InsuranceEngine', 'HealthcareEngine', 'EnergyEngine',
  'ConstructionEngine', 'ManufacturingEngine', 'RealEstateEngine',
  'RetailEngine', 'LogisticsEngine', 'EducationEngine', 'WorkforceEngine',
  'GovernmentEngine', 'ESGEngine', 'CreditRiskEngine', 'InventoryEngine',
  'SpreadEngine', 'YieldCurveEngine', 'CashEngine', 'CapExEngine',
  'WorkingCapitalEngine', 'DebtScheduleEngine', 'LoanAmortizationEngine',
  'ImpairmentEngine', 'FinancialInstrumentsEngine', 'CashFlowWaterfallEngine',
  'BudgetCollectionEngine', 'RollingForecastEngine', 'ScenarioEngine',
  'WhatIfSandboxEngine', 'SensitivityEngine', 'GoalSeekEngine', 'SolverEngine',
  'ICMatchingEngine', 'IntercompanyMatchingEngine', 'ReconciliationEngine',
  'PeriodCloseEngine', 'CellValidationEngine', 'CellProtectionEngine',
  'CellAuditTrailEngine', 'CellCommentEngine', 'ConditionalFormattingEngine',
  'PivotTableEngine', 'GroupOutlineEngine', 'FreezePanesEngine', 'NamedRangeEngine',
  'ArrayFormulaEngine', 'ExcelKeyboardEngine', 'ExcelKeyboardShortcuts',
];

const engineSubs = (eng) => ([
  ['ui', `${eng} Memoization Audit`, 90, 'cobalt', wrap(eng, 'Audit memoization. Pure functions cached, IO deps memoized. Avoid 1000+ recompute per render.')],
  ['store', `${eng} Zustand Selector Granularity`, 88, 'cobalt', wrap(eng, 'Each consumer subscribes to minimum slice. Use shallow equality for object slices.')],
  ['err', `${eng} Graceful NaN/Infinity Handling`, 92, 'brutus', wrap(eng, 'SafeMathParser integration. Never produce NaN/Infinity. Throw typed MathError with code.')],
  ['perf', `${eng} Allocation Audit 100K ops`, 88, 'cobalt', wrap(eng, 'Zero-copy where possible. Reuse typed arrays. No hidden quadratic in hot path.')],
]);

const engineTasks = [];
criticalEngines.forEach((eng) => {
  engineSubs(eng).forEach(([cat, title, prio, r, spec]) =>
    engineTasks.push(task(cat, title, r, prio, spec))
  );
});

// ===== STORES (30 stores × 4 = 120) =====
const stores = [
  'authStore', 'budgetStore', 'capexStore', 'cashStore', 'cubeStore', 'dataStore',
  'driverStore', 'educationStore', 'energyStore', 'entityStore', 'esgStore',
  'forecastStore', 'fxRateStore', 'glStore', 'governmentStore', 'healthcareStore',
  'insuranceStore', 'logisticsStore', 'notificationStore', 'realEstateStore',
  'reportStore', 'retailStore', 'scenarioStore', 'settingsStore', 'telecomStore',
  'tourStore', 'uiStore', 'varianceStore', 'workflowStore', 'workforceStore',
  'collaborationStore', 'analyticsStore', 'constructionStore',
];

const storeSubs = (s) => ([
  ['store', `${s} Persistence Round-Trip`, 90, 'brutus', `Persistence test for ${s}: save -> load -> save -> load yields identical state. Schema migration.`] ,
  ['conc', `${s} Concurrent Update Safety`, 92, 'brutus', `Optimistic locking or Web Locks for ${s}. Conflict resolution policy.`] ,
  ['persist', `${s} Encryption at Rest`, 92, 'censor', `Wrap ${s} state with AES-GCM before write. Key derivation from passphrase.`] ,
  ['err', `${s} Action Error Isolation`, 88, 'brutus', `Every action in ${s} catches its own errors. UI sees typed error envelope, not crash.`] ,
]);

const storeTasks = [];
stores.forEach((s) => storeSubs(s).forEach(([cat, title, prio, r, spec]) =>
  storeTasks.push(task(cat, title, r, prio, spec))
));

// ===== PAGE CATEGORIES (47 × 4 = 188) =====
const pageCats = [
  'accounting', 'admin', 'ai', 'analytics', 'audit', 'auth', 'banking', 'bonds',
  'budgets', 'capex', 'cash', 'charts', 'collaboration', 'consolidation',
  'construction', 'credit', 'currency', 'dashboard', 'data', 'education',
  'energy', 'esg', 'forecasts', 'government', 'healthcare', 'insurance',
  'lease', 'logistics', 'manufacturing', 'onboarding', 'plugins', 'realestate',
  'reports', 'retail', 'revenue', 'saas', 'scenarios', 'sector', 'sectors',
  'settings', 'tax', 'telecom', 'templates', 'treasury', 'variance', 'workforce',
];

const pageSubs = (p) => ([
  ['page', `${p} page Suspense + ErrorBoundary`, 92, 'sally', `Wrap ${p} routes in dedicated boundaries. Page-level fallbacks.`] ,
  ['a11y', `${p} page axe-core pass`, 90, 'amelia', `Run axe-core on every page in ${p}. Zero violations.`] ,
  ['perf', `${p} page LCP < 2.5s`, 88, 'cobalt', `Largest Contentful Paint in ${p} optimized. Critical CSS inlined.`] ,
  ['e2e', `${p} page Playwright happy path`, 90, 'mary', `Playwright happy path E2E for every page in ${p}. 5 critical user flows.`] ,
]);

const pageTasks = [];
pageCats.forEach((p) => pageSubs(p).forEach(([cat, title, prio, r, spec]) =>
  pageTasks.push(task(cat, title, r, prio, spec))
));

// ===== UI COMPONENTS (50+ × 3 = 150) =====
const components = [
  'AccountTree', 'Alert', 'AllocationHistory', 'AllocationPreview',
  'AllocationRuleBuilder', 'ApprovalDashboard', 'ApprovalQueue',
  'ApprovalWorkflowDesigner', 'AsyncErrorBoundary', 'Avatar', 'Badge',
  'BoxPlotChart', 'Breadcrumb', 'BulletChart', 'Button', 'ChartOfAccounts',
  'ConditionalRuleEditor', 'ConfirmDialog', 'ContextMenu', 'CurrencyInput',
  'DataGrid', 'DataGridToolbar', 'DataTable', 'DragFill', 'DrillDownModal',
  'DrillThroughBreadcrumb', 'DriverSlider', 'EmptyState', 'ErrorBoundary',
  'ErrorFallback', 'ErrorState', 'ExportMenu', 'FileDropZone', 'FinancialTable',
  'FindReplaceBar', 'FinPlanGrid', 'FocusTrap', 'FormulaAutocomplete',
  'FormulaBar', 'FunnelChart', 'GanttChart', 'GaugeChart',
  'GenerativeDashboard', 'GuidedTour', 'Heatmap', 'HelpPanel',
  'ICMatchingDashboard', 'ICReconciliationReport', 'Input', 'KeyboardOverlay',
  'KeyboardShortcutOverlay', 'KeyboardShortcutProvider', 'KeyboardShortcuts',
  'KPIValue', 'LazyChart', 'LiveRegion', 'LoadingScreen', 'Modal', 'NLQInput',
  'OnboardingWizard', 'PageErrorBoundary', 'Pagination', 'PeriodPicker',
  'PresenceIndicator', 'Progress', 'ProgressStepper', 'RuleRow', 'SandboxMode',
  'SankeyChart', 'SaveStatusIndicator', 'ScatterPlot', 'ScenarioComparisonGrid',
  'ScenarioLocking', 'ScenarioTimeline', 'Select', 'SelectionStatusBar',
  'SheetTabs', 'ShortcutHelpModal', 'Skeleton', 'SkipToContent', 'Sparkline',
  'SplitPane', 'SpreadsheetGrid', 'SystemHealthMonitor', 'Table', 'Tabs',
  'Toast', 'ToastContainer', 'Tooltip', 'TornadoChart', 'TourOverlay',
  'TreeMap', 'VersionDiffViewer', 'VisuallyHidden', 'WaterfallBridge',
  'WaterfallChart', 'WhatIfSandbox',
];

const compSubs = (c) => ([
  ['ui', `${c} ARIA roles & Contrast Audit`, 92, 'amelia', `${c} component meets WCAG 2.2 AA contrast and ARIA semantics.`] ,
  ['ui', `${c} WCAG 2.2 AA Keyboard Nav`, 92, 'amelia', `${c} fully keyboard operable. Tab order, focus indicator, Esc, Enter.`] ,
  ['ui', `${c} React.memo / useMemo Optimization`, 88, 'cobalt', `${c} memoization audit. Renders only when props change.`] ,
]);

const compTasks = [];
components.forEach((c) => compSubs(c).forEach(([cat, title, prio, r, spec]) =>
  compTasks.push(task(cat, title, r, prio, spec))
));

// ===== HOOKS (40 × 3 = 120) =====
const hooks = [
  'useAnimation', 'useAnnounce', 'useAuth', 'useAutoSave', 'useColumnVisibility',
  'useConfirmation', 'useCopilotSidebar', 'useCurrency', 'useDataGridExport',
  'useDebounce', 'useDensity', 'useDirtyState', 'useErrorHandler', 'useExport',
  'useFindReplace', 'useFirstRun', 'useFocusManagement', 'useFocusRestore',
  'useFreezePanes', 'useIndexedDB', 'useIntersectionObserver',
  'useKeyboardShortcuts', 'useOffline', 'usePeriods', 'usePersistence',
  'usePresence', 'useReducedMotion', 'useSector', 'useSelectionStats',
  'useTauriGlobalShortcuts', 'useTauriMenu', 'useThrottle', 'useTour',
  'useUndoableAction', 'useUndoRedo', 'useURLState', 'useWebSocket',
];

const hookSubs = (h) => ([
  ['ui', `${h} Cleanup audit`, 92, 'brutus', `${h} unsubscribes all listeners, aborts in-flight, clears timers.`] ,
  ['test', `${h} RTL test coverage`, 88, 'cobalt', `${h} unit + integration tests with React Testing Library.`] ,
  ['err', `${h} error boundary integration`, 88, 'brutus', `${h} surfaces typed errors. Never silently swallows.`] ,
]);

const hookTasks = [];
hooks.forEach((h) => hookSubs(h).forEach(([cat, title, prio, r, spec]) =>
  hookTasks.push(task(cat, title, r, prio, spec))
));

// ===== WORKERS (13 × 4 = 52) =====
const workers = [
  'batch-calc.worker', 'consolidation.worker', 'consolidationWorker',
  'exportWorker', 'formulaWorker', 'monte-carlo.worker', 'scenarioWorker',
  'storage.worker', 'WorkerPool', 'worker-pool',
];

const workerSubs = (w) => ([
  ['worker', `${w} crash recovery test`, 95, 'brutus', `${w} crash + respawn test. State preserved across restart.`] ,
  ['worker', `${w} backpressure handling`, 92, 'brutus', `${w} queue depth cap, drop oldest non-critical.`] ,
  ['perf', `${w} benchmark 10K tasks`, 88, 'cobalt', `${w} throughput benchmark. P50, P95, P99 latency.`] ,
  ['err', `${w} typed error envelope`, 90, 'brutus', `${w} postMessage uses structured error type with code + cause.`] ,
]);

const workerTasks = [];
workers.forEach((w) => workerSubs(w).forEach(([cat, title, prio, r, spec]) =>
  workerTasks.push(task(cat, title, r, prio, spec))
));

// ===== SERVICES (13 × 3 = 39) =====
const services = [
  'api', 'BenchmarkService', 'ChangeBroadcaster', 'nim', 'PresenceService',
  'RealtimeCollaborationManager', 'WebSocketManager',
];

const serviceSubs = (s) => ([
  ['conc', `${s} concurrent caller safety`, 92, 'brutus', `${s} handles 100 concurrent calls. No shared mutable state.`] ,
  ['err', `${s} typed error response`, 88, 'brutus', `${s} returns Result<T, ServiceError>. No thrown errors at boundary.`] ,
  ['sec', `${s} authn/authz enforcement`, 92, 'censor', `${s} verifies caller permissions on every method.`] ,
]);

const serviceTasks = [];
services.forEach((s) => serviceSubs(s).forEach(([cat, title, prio, r, spec]) =>
  serviceTasks.push(task(cat, title, r, prio, spec))
));

// ===== UTILS (40 × 3 = 120) =====
const utils = [
  'backupRestore', 'chunkedStorage', 'cn', 'constants', 'encryption',
  'financialFormatting', 'formatters', 'indexedDBStorage', 'localeFormatting',
  'logger', 'masterStorage', 'offlineCache', 'performance', 'retry',
  'security', 'sqlJsStorage', 'storageConstants', 'storeCache', 'tauriSqlStorage',
  'tokenRotation', 'validation', 'zipBuilder',
];

const utilSubs = (u) => ([
  ['test', `${u} 100% branch coverage`, 90, 'cobalt', `${u} full Vitest branch coverage including error paths.`] ,
  ['sec', `${u} input sanitization audit`, 90, 'censor', `${u} every input sanitized. No implicit trust.`] ,
  ['perf', `${u} allocation audit`, 85, 'cobalt', `${u} zero unnecessary allocations. Benchmarked.`] ,
]);

const utilTasks = [];
utils.forEach((u) => utilSubs(u).forEach(([cat, title, prio, r, spec]) =>
  utilTasks.push(task(cat, title, r, prio, spec))
));

// ===== TEMPLATES (15 × 4 = 60) =====
const templates = [
  'AnnualOperatingBudget', 'BankingNIM', 'CapExPlan', 'CashFlowForecast',
  'ConstructionProjectCosting', 'EnergySectorPlanning', 'GovernmentBudget',
  'HeadcountPlan', 'HealthcareRevenueCycle', 'ManufacturingCOGS',
  'RealEstatePortfolio', 'RetailStorePerformance', 'TechSaaSCompany',
  'ThreeStatementModel',
];

const tplSubs = (t) => ([
  ['page', `${t} template realistic seed data`, 88, 'sally', `${t} includes realistic numbers (not 100, 200, 300). Realistic ratios.`] ,
  ['test', `${t} template end-to-end smoke test`, 88, 'cobalt', `${t} load -> fill -> calc -> export -> close round-trip.`] ,
  ['i18n', `${t} template locale awareness`, 85, 'sally', `${t} format-aware for currency, date, number per locale.`] ,
  ['doc', `${t} template documentation`, 85, 'sally', `${t} includes user guide: assumptions, inputs, expected outputs.`] ,
]);

const tplTasks = [];
templates.forEach((t) => tplSubs(t).forEach(([cat, title, prio, r, spec]) =>
  tplTasks.push(task(cat, title, r, prio, spec))
));

// ===== OWASP Top 10 (2021) — 10 =====
const owasp = [
  ['sec', 'OWASP A01 Broken Access Control', 95, 'censor', 'Verify role/permission checks on every endpoint. IDOR test.'],
  ['sec', 'OWASP A02 Cryptographic Failures', 95, 'censor', 'TLS, at-rest, in-transit. No weak ciphers.'],
  ['sec', 'OWASP A03 Injection', 95, 'censor', 'XSS, SQL, NoSQL, LDAP, OS command.'],
  ['sec', 'OWASP A04 Insecure Design', 92, 'sentinel', 'Threat model per feature.'],
  ['sec', 'OWASP A05 Security Misconfiguration', 90, 'censor', 'Default creds, verbose errors, missing headers.'],
  ['sec', 'OWASP A06 Vulnerable Components', 90, 'censor', 'npm audit, OSV scanner.'],
  ['sec', 'OWASP A07 Identification & Auth Failures', 92, 'censor', 'Session, MFA, credential stuffing.'],
  ['sec', 'OWASP A08 Software & Data Integrity', 90, 'censor', 'Verify updates, CI/CD pipeline.'],
  ['sec', 'OWASP A09 Security Logging & Monitoring', 88, 'brutus', 'Sentry, audit log, alerting.'],
  ['sec', 'OWASP A10 SSRF', 88, 'censor', 'URL allowlist, no user-controlled fetch.'],
];
const owaspTasks = owasp.map(([cat, title, prio, r, spec]) => task(cat, title, r, prio, spec));

// ===== CWE Top 25 (25) =====
const cwes = [
  'CWE-787 Out-of-bounds Write', 'CWE-79 XSS', 'CWE-89 SQL Injection',
  'CWE-20 Improper Input Validation', 'CWE-125 Out-of-bounds Read',
  'CWE-78 OS Command Injection', 'CWE-416 Use After Free', 'CWE-22 Path Traversal',
  'CWE-352 CSRF', 'CWE-434 Unrestricted File Upload', 'CWE-862 Missing Authorization',
  'CWE-476 NULL Pointer Dereference', 'CWE-287 Improper Authentication',
  'CWE-190 Integer Overflow', 'CWE-502 Deserialization', 'CWE-77 Command Injection',
  'CWE-119 Buffer Error', 'CWE-798 Hardcoded Credentials',
  'CWE-918 SSRF', 'CWE-306 Missing Authentication', 'CWE-362 Concurrent Execution',
  'CWE-94 Code Injection', 'CWE-732 Permission Assignment', 'CWE-611 XXE',
  'CWE-601 Open Redirect',
];
const cweTasks = cwes.map((t) => task('sec', `Mitigate ${t}`, 'censor', 90, `Audit codebase for ${t}. Add detection + prevention. Apply CWE mitigation guidance.`));

// ===== WCAG 2.2 specific criteria (15) =====
const wcag = [
  ['1.1.1 Non-text Content', 'amelia', 95], ['1.3.1 Info and Relationships', 'amelia', 95],
  ['1.4.3 Contrast Minimum', 'amelia', 95], ['1.4.11 Non-text Contrast', 'amelia', 92],
  ['1.4.12 Text Spacing', 'amelia', 90], ['1.4.13 Content on Hover', 'amelia', 90],
  ['2.1.1 Keyboard', 'amelia', 95], ['2.1.2 No Keyboard Trap', 'amelia', 95],
  ['2.4.3 Focus Order', 'amelia', 92], ['2.4.7 Focus Visible', 'amelia', 92],
  ['2.4.11 Focus Not Obscured (Min)', 'amelia', 90], ['2.5.7 Dragging Movements', 'amelia', 90],
  ['2.5.8 Target Size (Min)', 'amelia', 90], ['3.3.1 Error Identification', 'amelia', 92],
  ['4.1.2 Name, Role, Value', 'amelia', 95],
];
const wcagTasks = wcag.map(([n, r, p]) => task('a11y', `WCAG 2.2 ${n} compliance audit`, r, p, `Audit codebase for ${n}. Document violations and fix path.`));

// ===== COMPLIANCE REGIMES (50) =====
const regs = [
  ['PCI-DSS 4.0 Level 1', 92], ['PCI-DSS 4.0 SAQ-A', 90], ['PCI-DSS 4.0 P2PE', 88],
  ['FedRAMP Moderate', 90], ['FedRAMP High', 92], ['FedRAMP Tailored', 88],
  ['ISO/IEC 27001:2022', 90], ['ISO/IEC 27002:2022', 88], ['ISO/IEC 27017', 85],
  ['ISO/IEC 27018', 85], ['ISO/IEC 27701', 85], ['NIST CSF 2.0', 88],
  ['NIST 800-53 Rev. 5', 88], ['NIST 800-171', 88], ['NIST SSDF 1.1', 85],
  ['CIS Controls v8', 85], ['CIS Benchmarks', 85], ['OWASP ASVS 4.0', 90],
  ['OWASP SAMM 2.0', 85], ['CWE Top 25', 88], ['CVSS 3.1', 85],
  ['HIPAA Security Rule', 92], ['HIPAA Privacy Rule', 90], ['HITRUST CSF', 88],
  ['HITECH Act', 88], ['GDPR Article 32', 92], ['GDPR Article 25', 90],
  ['GDPR Article 35 DPIA', 90], ['CCPA / CPRA', 88], ['LGPD (Brazil)', 85],
  ['PIPEDA (Canada)', 85], ['PIPL (China)', 85], ['PDPA (Singapore)', 85],
  ['Privacy Act (Australia)', 85], ['APPI (Japan)', 85], ['DPDP (India)', 85],
  ['SOX Section 404', 92], ['SOX Section 302', 90], ['SOX Section 906', 88],
  ['COSO 2013 Internal Control', 88], ['COBIT 2019', 85], ['ITIL 4', 80],
  ['AICPA SOC 1 Type II', 88], ['AICPA SOC 2 Type II', 90], ['AICPA SOC 3', 85],
  ['ISO 9001:2015', 80], ['ISO 14001:2015', 75], ['ISO 45001:2018', 75],
  ['ADA Title III', 88], ['Section 508', 88], ['EN 301 549', 85],
];
const regTasks = regs.map(([name, prio]) => task('sec', `${name} compliance audit`, 'censor', prio, `Gap analysis against ${name}. Document controls, evidence, and remediation roadmap.`));

// ===== i18n locales (15) =====
const locales = [
  ['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['fr-FR', 'French (France)'],
  ['de-DE', 'German (Germany)'], ['es-ES', 'Spanish (Spain)'], ['es-MX', 'Spanish (Mexico)'],
  ['pt-BR', 'Portuguese (Brazil)'], ['it-IT', 'Italian (Italy)'], ['nl-NL', 'Dutch (Netherlands)'],
  ['ja-JP', 'Japanese'], ['zh-CN', 'Chinese (Simplified)'], ['zh-TW', 'Chinese (Traditional)'],
  ['ko-KR', 'Korean'], ['ar-SA', 'Arabic (Saudi Arabia)'], ['he-IL', 'Hebrew (Israel)'],
  ['hi-IN', 'Hindi (India)'], ['ru-RU', 'Russian'], ['pl-PL', 'Polish'], ['sv-SE', 'Swedish'],
];
const localeTasks = locales.map(([code, name]) => task('i18n', `${name} (${code}) locale completeness`, 'sally', 85, `Verify all UI strings, date/number/currency formats translated for ${name}. No English fallback.`));

// ===== CALENDAR SYSTEMS (8) =====
const calendars = [
  ['Gregorian', 'ISO 8601'], ['Hebrew', 'Jewish calendar'], ['Hijri', 'Islamic lunar'],
  ['Buddhist', 'Thai solar'], ['Japanese Imperial', 'Era-based'], ['Indian Saka', 'National Indian'],
  ['Persian', 'Solar Hijri'], ['Ethiopian', '13-month solar'],
];
const calTasks = calendars.map(([n, d]) => task('i18n', `${n} calendar support (${d})`, 'mary', 80, `Fiscal date math for ${n} calendar. Test leap years, month boundaries, era transitions.`));

// ===== CURRENCY QUIRKS (10) =====
const currencies = [
  ['BHD', 'Bahraini Dinar', '3 decimals'], ['JPY', 'Japanese Yen', '0 decimals'],
  ['KWD', 'Kuwaiti Dinar', '3 decimals'], ['CLF', 'Chilean UF', '4 decimals'],
  ['TRY', 'Turkish Lira', '2 decimals, high inflation'],
  ['VEF', 'Venezuelan Bolívar', 'hyperinflation'], ['ZWL', 'Zimbabwe Dollar', 'hyperinflation'],
  ['BTC', 'Bitcoin', '8 decimals, sats'], ['ETH', 'Ether', '18 decimals, wei'],
  ['XAU', 'Gold troy oz', 'precious metal'],
];
const curTasks = currencies.map(([code, n, q]) => task('eng', `${code} (${n}) precision handling`, 'mary', 88, `${n} requires ${q}. Test rounding, display, calculations.`));

// ===== BROWSER QUIRKS (20) =====
const browserQuirks = [
  ['Safari iOS date parsing', 'YYYY-MM-DD only'], ['Safari ITP storage eviction', '7-day cap for cross-site'],
  ['Firefox strict backslash in path', 'File API'], ['Edge IE compat quirks', 'legacy'],
  ['Chrome SameSite default Lax', 'cookie behavior'], ['Safari number-to-string', 'precision loss'],
  ['Safari IndexedDB version race', 'rare'], ['Firefox scrollbar gutter', '17px reservation'],
  ['Chrome download attribute', 'origin policy'], ['iOS PWA standalone quirks', 'no status bar'],
  ['Android back button', 'history.back'], ['Mac Cmd vs Ctrl', 'shortcut prefix'],
  ['Windows Alt key', 'menu accelerator'], ['High DPI rendering', 'image quality'],
  ['Touch event coalescing', 'passive listeners'], ['Pointer events polyfill', 'IE 11 only'],
  ['WebKit CSS backdrop-filter', 'fallback'], ['WebKit overscroll-behavior', 'bounce'],
  ['Edge chromium detection', 'navigator.userAgentData'], ['Safari Autofill credit card', 'disable'],
];
const browserTasks = browserQuirks.map(([t, d]) => task('test', `Browser: ${t} (${d})`, 'cobalt', 88, `Verify ${t} works on all target browsers. Add test if missing.`));

// ===== NOTIFICATIONS / EMAIL / SMS (20) =====
const notif = [
  ['email', 'Email template i18n', 88], ['email', 'Email template spam score', 85],
  ['email', 'Email unsubscribe header', 92], ['email', 'Email DKIM/SPF/DMARC', 90],
  ['email', 'Email bounce handling', 88], ['email', 'Email open tracking', 80],
  ['sms', 'SMS template length', 88], ['sms', 'SMS unicode (UCS-2)', 85],
  ['sms', 'SMS opt-in/opt-out', 92], ['sms', 'SMS rate limiting', 88],
  ['push', 'Push permission UX', 88], ['push', 'Push quiet hours', 85],
  ['push', 'Push rich media', 85], ['push', 'Push action buttons', 85],
  ['push', 'Push channel grouping', 80], ['webhook', 'Webhook signature verify', 92],
  ['webhook', 'Webhook retry with backoff', 90], ['webhook', 'Webhook DLQ', 88],
  ['webhook', 'Webhook idempotency', 88], ['webhook', 'Webhook delivery audit', 85],
];
const notifTasks = notif.map(([cat, title, prio]) => task(cat, title, 'sally', prio, `Implement and verify ${title} per compliance and reliability best practices.`));

// ===== SEARCH / FILTER / SORT (15) =====
const search = [
  ['Global search latency < 100ms', 'cobalt', 90],
  ['Fuzzy match (Levenshtein)', 'cobalt', 85],
  ['Full-text search highlighting', 'sally', 88],
  ['Search history', 'brutus', 80],
  ['Search suggestions', 'sally', 85],
  ['Advanced filter DSL', 'cobalt', 88],
  ['Filter chip persistence', 'sally', 85],
  ['Sort by multi-column', 'sally', 88],
  ['Sort stable (Timsort)', 'cobalt', 85],
  ['Locale-aware sort', 'sally', 88],
  ['Search keyboard nav (j/k)', 'amelia', 88],
  ['Search empty state', 'sally', 85],
  ['Search rate limit', 'cobalt', 85],
  ['Search index update', 'cobalt', 88],
  ['Search accessibility', 'amelia', 90],
];
const searchTasks = search.map(([t, r, p]) => task('ui', t, r, p, `Implement and verify ${t} end-to-end.`));

// Combine all
const all = [
  ...engineTasks, ...storeTasks, ...pageTasks, ...compTasks, ...hookTasks,
  ...workerTasks, ...serviceTasks, ...utilTasks, ...tplTasks, ...owaspTasks,
  ...cweTasks, ...wcagTasks, ...regTasks, ...localeTasks, ...calTasks,
  ...curTasks, ...browserTasks, ...notifTasks, ...searchTasks,
];

console.log('Generated', all.length, 'new tasks');
const cats = {};
all.forEach(t => { cats[t.cat] = (cats[t.cat]||0)+1; });
console.log('By category:');
Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  '+k.padEnd(10)+v));

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const before = data.queue.length;
data.queue.push(...all);
data.totalTasks = data.queue.length;
data.lastUpdated = NOW;
fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log('Tasks: ' + before + ' -> ' + data.queue.length);
console.log('Last ID:', data.queue[data.queue.length-1].id);
