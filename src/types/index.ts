// =============================================================================
// FINPLAN PRO - COMPLETE TYPE DEFINITIONS
// =============================================================================

// --- Enums & Literals ---

export type BudgetStatus = 'Draft' | 'InReview' | 'Approved' | 'Locked' | 'Rejected';
export type ForecastType = 'Rolling' | 'Quarterly' | 'Annual';
export type AccountType = 'Revenue' | 'COGS' | 'OpEx' | 'CapEx' | 'Asset' | 'Liability' | 'Equity';
export type Role = 'Admin' | 'FP&A_Manager' | 'Analyst' | 'Department_Head' | 'Viewer';
export type VarianceStatus = 'Favorable' | 'Unfavorable' | 'Neutral';
export type ThresholdStatus = 'Within' | 'Watch' | 'Significant';
export type TaskStatus = 'Todo' | 'Pending' | 'InProgress' | 'Completed' | 'Done' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type PeriodType = 'Monthly' | 'Quarterly' | 'Annual' | 'Adjusting';
export type CalendarType = 'Standard' | '4-4-5' | '4-5-4' | '13-Period';
export type ApprovalAction = 'Approve' | 'Reject' | 'RequestChanges';
export type ImportStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

// --- Core Domain Interfaces ---

export interface FiscalPeriod {
  readonly id: string;
  readonly year: number;
  readonly periodNumber: number;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly periodType: PeriodType;
  readonly isAdjustingPeriod: boolean;
  readonly isClosed: boolean;
  readonly closedAt: string | null;
  readonly closedBy: string | null;
}

export interface GLAccount {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly category: string;
  readonly subCategory: string;
  readonly parentId: string | null;
  readonly level: number;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly entityId: string;
  readonly departmentId: string | null;
  readonly isCalculated: boolean;
  readonly formula: string | null;
  readonly children: GLAccount[];
}

export interface BudgetLineItem {
  readonly id: string;
  readonly budgetId: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly accountCode: string;
  readonly accountType: AccountType;
  readonly periodId: string;
  readonly month: number;
  readonly amount: number;
  readonly formula: string | null;
  readonly isCalculated: boolean;
  readonly isLocked: boolean;
  readonly isReadOnly: boolean;
  readonly notes: string | null;
  readonly driverId: string | null;
  readonly assumptions: string | null;
  readonly version: number;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Budget {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly fiscalYear: number;
  readonly status: BudgetStatus;
  readonly template: string;
  readonly departments: readonly string[];
  readonly entities: readonly string[];
  readonly baseCurrency: string;
  readonly totalAmount: number;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt: string | null;
  readonly approvedAt: string | null;
  readonly approvedBy: string | null;
  readonly version: number;
  readonly progress: number;
}

export interface Forecast {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: ForecastType;
  readonly baseBudgetId: string;
  readonly baseBudgetName: string;
  readonly status: 'Draft' | 'InProgress' | 'Completed';
  readonly rollingWindowMonths: number;
  readonly confidenceLevel: 'High' | 'Medium' | 'Low';
  readonly createdBy: string;
  readonly createdByName: string;
  readonly lastUpdated: string;
  readonly createdAt: string;
}

export interface ForecastDriver {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly driverType: 'Headcount' | 'Revenue' | 'Price' | 'Volume' | 'Rate' | 'Custom';
  readonly baseValue: number;
  readonly currentValue: number;
  readonly unit: string;
  readonly affectedAccountIds: readonly string[];
  readonly formula: string;
}

export interface VarianceAnalysis {
  readonly id: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly accountCode: string;
  readonly accountType: AccountType;
  readonly budgetAmount: number;
  readonly actualAmount: number;
  readonly forecastAmount: number;
  readonly dollarVariance: number;
  readonly percentVariance: number;
  readonly varianceStatus: VarianceStatus;
  readonly thresholdStatus: ThresholdStatus;
  readonly commentary: string | null;
  readonly commentaryStatus: 'NotStarted' | 'Draft' | 'Submitted' | 'Reviewed';
  readonly monthlyBreakdown: readonly MonthlyVariance[];
  readonly rateVariance: number;
  readonly volumeVariance: number;
}

export interface MonthlyVariance {
  readonly month: number;
  readonly monthName: string;
  readonly budget: number;
  readonly actual: number;
  readonly variance: number;
  readonly percent: number;
}

export interface Scenario {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly baseBudgetId: string;
  readonly baseBudgetName: string;
  readonly type: 'Base' | 'Optimistic' | 'Pessimistic' | 'Custom';
  readonly probability: number;
  readonly isActive: boolean;
  readonly isLocked: boolean;
  readonly assumptions: readonly ScenarioAssumption[];
  readonly calculatedMetrics: ScenarioMetrics;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ScenarioAssumption {
  readonly id: string;
  readonly name: string;
  readonly driverType: string;
  readonly baseValue: number;
  readonly currentValue: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly stepSize: number;
  readonly unit: string;
  readonly affectedAccountIds: readonly string[];
}

export interface ScenarioMetrics {
  readonly revenue: number;
  readonly ebitda: number;
  readonly netIncome: number;
  readonly cashFlow: number;
  readonly headcount: number;
  readonly burnRate: number;
  readonly runway: number;
  readonly grossMargin: number;
  readonly ebitdaMargin: number;
}

export interface User {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly name?: string;
  readonly avatarUrl: string | null;
  readonly role: Role;
  readonly departmentId: string;
  readonly departmentName: string;
  readonly entityId: string;
  readonly status: 'Active' | 'Inactive' | 'Pending';
  readonly lastLoginAt: string;
  readonly mfaEnabled: boolean;
  readonly permissions: readonly string[];
}

export interface Department {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly costCenter: string;
  readonly headId: string | null;
  readonly headName: string | null;
  readonly budgetAmount: number;
  readonly userCount: number;
}

export interface Entity {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly currency: string;
  readonly country: string;
  readonly isParent: boolean;
  readonly parentId: string | null;
}

export interface ExchangeRate {
  readonly id: string;
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly effectiveDate: string;
  readonly source?: 'manual' | 'api' | 'feed';
}

export interface ActivityLog {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly resourceName: string;
  readonly details: {
    readonly oldValue?: string | number;
    readonly newValue?: string | number;
    readonly field?: string;
    readonly cellId?: string;
  } | null;
  readonly timestamp: string;
}

export interface Notification {
  readonly id: string;
  readonly type: 'info' | 'success' | 'warning' | 'error' | 'approval' | 'mention' | 'deadline';
  readonly title: string;
  readonly message: string;
  readonly isRead: boolean;
  readonly actionUrl: string | null;
  readonly createdAt: string;
}

export interface Comment {
  readonly id: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly resourceName?: string;
  readonly cellId: string | null;
  readonly parentId: string | null;
  readonly authorId: string;
  readonly authorName: string;
  readonly authorInitials: string;
  readonly content: string;
  readonly mentions: readonly string[];
  readonly isResolved: boolean;
  readonly resolvedAt: string | null;
  readonly createdAt: string;
  readonly replies: readonly Comment[];
}

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly assigneeId: string;
  readonly assigneeName: string;
  readonly dueDate: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly relatedResourceType: string | null;
  readonly relatedResourceId: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface ApprovalRequest {
  readonly id: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly resourceName: string;
  readonly requesterId: string;
  readonly requesterName: string;
  readonly amount: number;
  readonly status: 'Pending' | 'Approved' | 'Rejected' | 'ChangesRequested';
  readonly submittedAt: string;
  readonly reviewedAt: string | null;
  readonly reviewedBy: string | null;
  readonly comments: string | null;
}

export interface ImportJob {
  readonly id: string;
  readonly filename: string;
  readonly fileType: string;
  readonly status: ImportStatus;
  readonly rowCount: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly startedBy: string;
  readonly startedByName: string;
  readonly error?: string | null;
}

export interface CellAuditEntry {
  readonly id: string;
  readonly cellId: string;
  readonly accountId: string;
  readonly accountName: string;
  readonly month: number;
  readonly oldValue: number;
  readonly newValue: number;
  readonly userId: string;
  readonly userName: string;
  readonly timestamp: string;
  readonly reason: string | null;
}

export interface DashboardWidget {
  readonly id: string;
  readonly type: 'kpi' | 'chart' | 'table' | 'list' | 'actions';
  readonly title: string;
  readonly position: { x: number; y: number; w: number; h: number };
  readonly config: Record<string, unknown>;
}

export interface KPIMetric {
  readonly label: string;
  readonly value: number;
  readonly formattedValue: string;
  readonly change: number;
  readonly changeFormatted: string;
  readonly changeType: 'positive' | 'negative' | 'neutral';
  readonly sparklineData: readonly number[];
  readonly comparisonLabel: string;
}

// --- API Response Types ---

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
  readonly totalPages: number;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string;
  readonly errors?: Record<string, string[]>;
}

// --- Store Types ---

export interface AuthState {
  user: User | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly mfaRequired: boolean;
  readonly activeEntityId: string;
  readonly error: string | null;
  readonly loginAttempts: number;
  readonly lockedUntil: string | null;
  readonly tokenExpiry: number | null;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly loginMock: (email: string, password: string) => Promise<void>;
  readonly loginReal: (email: string, password: string) => Promise<void>;
  readonly register: (name: string, email: string, password: string) => Promise<void>;
  readonly logout: () => void;
  readonly refreshAccessToken: () => Promise<void>;
  readonly setUser: (user: User) => void;
  readonly switchEntity: (entityId: string) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
  readonly setLoading: (loading: boolean) => void;
}

export interface UIState {
  sidebarCollapsed: boolean;
  readonly mobileSidebarOpen: boolean;
  readonly theme: 'light' | 'dark';
  readonly commandPaletteOpen: boolean;
  readonly toasts: readonly ToastMessage[];
  readonly isOnline: boolean;
  readonly globalDateRange: { start: string; end: string };
  readonly error: string | null;
  readonly toggleSidebar: () => void;
  readonly openMobileSidebar: () => void;
  readonly closeMobileSidebar: () => void;
  readonly setTheme: (theme: 'light' | 'dark') => void;
  readonly toggleCommandPalette: () => void;
  readonly addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  readonly removeToast: (id: string) => void;
  readonly setOnline: (online: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
}

export interface ToastMessage {
  readonly id: string;
  readonly type: 'success' | 'error' | 'warning' | 'info';
  readonly title: string;
  readonly message?: string;
  readonly duration?: number;
}

// --- Settings Entity Types ---

export interface OrganizationSettings {
  readonly name: string;
  readonly fiscalYear: number;
  readonly fiscalYearStart: string;
  readonly calendarType: CalendarType;
  readonly baseCurrency: string;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly decimalPlaces: number;
}

export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly name?: string;
  readonly role: Role;
  readonly department: string;
  readonly status: 'Active' | 'Inactive' | 'Pending';
}

export interface UserRole {
  readonly id: string;
  readonly name: string;
  readonly permissions: string[];
}

// --- Report Entity Types ---

export interface FinanceReport {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly format: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface ScheduledReport {
  readonly id: string;
  readonly reportId: string;
  readonly frequency: string;
  readonly recipients: string[];
  readonly nextRun: string;
  readonly isActive: boolean;
}

// --- Store State Types ---

export interface BudgetState {
  budgets: Budget[];
  readonly activeBudgetId: string | null;
  readonly lineItems: BudgetLineItem[];
  readonly isLoading: boolean;
  readonly isSubmitting: boolean;
  readonly lastChange: {
    readonly cellId: string;
    readonly oldValue: number;
    readonly newValue: number;
    readonly timestamp: string;
  } | null;
  readonly history: BudgetLineItem[][];
  readonly historyIndex: number;
  readonly selectedCellId: string | null;
  readonly setBudgets: (budgets: Budget[]) => void;
  readonly setActiveBudget: (id: string) => void;
  readonly setLineItems: (items: BudgetLineItem[]) => void;
  readonly updateLineItem: (id: string, updates: Partial<BudgetLineItem>) => void;
  readonly createBudget: (
    budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => string;
  readonly deleteBudget: (id: string) => void;
  readonly duplicateBudget: (id: string) => string;
  readonly submitBudget: (id: string) => Promise<void>;
  readonly approveBudget: (id: string) => void;
  readonly rejectBudget: (id: string) => void;
  readonly updateBudget: (id: string, updates: Partial<Budget>) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly setSelectedCell: (id: string | null) => void;
}

export interface CollaborationState {
  comments: Comment[];
  readonly tasks: Task[];
  readonly approvals: ApprovalRequest[];
  readonly activityLog: ActivityLog[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly setComments: (comments: Comment[]) => void;
  readonly addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>) => void;
  readonly setTasks: (tasks: Task[]) => void;
  readonly addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  readonly updateTaskStatus: (id: string, status: TaskStatus) => void;
  readonly setApprovals: (approvals: ApprovalRequest[]) => void;
  readonly updateApprovalStatus: (
    id: string,
    status: ApprovalRequest['status'],
    comment?: string
  ) => void;
  readonly setActivityLog: (log: ActivityLog[]) => void;
  readonly addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
}

export interface DataState {
  accounts: GLAccount[];
  readonly importJobs: ImportJob[];
  readonly selectedAccountId: string | null;
  readonly lastImportDate: string | null;
  readonly setAccounts: (accounts: GLAccount[]) => void;
  readonly addAccount: (account: Omit<GLAccount, 'id' | 'children'>) => void;
  readonly updateAccount: (id: string, updates: Partial<GLAccount>) => void;
  readonly deleteAccount: (id: string) => void;
  readonly toggleAccountActive: (id: string) => void;
  readonly addImportJob: (job: Omit<ImportJob, 'id' | 'status' | 'startedAt'>) => string;
  readonly updateImportStatus: (id: string, status: ImportStatus, error?: string) => void;
  readonly setSelectedAccount: (id: string | null) => void;
}

export interface ForecastState {
  forecasts: Forecast[];
  readonly drivers: ForecastDriver[];
  readonly selectedForecastId: string | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: () => boolean;
  readonly canRedo: () => boolean;
  readonly getHistoryLength: () => number;
  readonly setForecasts: (forecasts: Forecast[]) => void;
  readonly setSelectedForecast: (id: string) => void;
  readonly createForecast: (forecast: Omit<Forecast, 'id' | 'createdAt'>) => string;
  readonly updateForecast: (id: string, updates: Partial<Forecast>) => void;
  readonly deleteForecast: (id: string) => void;
  readonly setDrivers: (drivers: ForecastDriver[]) => void;
  readonly updateDriver: (id: string, updates: Partial<ForecastDriver>) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
  readonly setLoading: (loading: boolean) => void;
}

export interface NotificationState {
  notifications: Notification[];
  readonly unreadCount: number;
  readonly error: string | null;
  readonly setNotifications: (notifications: Notification[]) => void;
  readonly markAsRead: (id: string) => void;
  readonly markAllAsRead: () => void;
  readonly addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ) => void;
  readonly clearNotifications: () => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
}

export interface ReportState {
  reports: FinanceReport[];
  readonly scheduledReports: ScheduledReport[];
  readonly activeReportId: string | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly setReports: (reports: FinanceReport[]) => void;
  readonly setActiveReport: (id: string) => void;
  readonly createReport: (report: Omit<FinanceReport, 'id'>) => string;
  readonly deleteReport: (id: string) => void;
  readonly setScheduledReports: (scheduled: ScheduledReport[]) => void;
  readonly addScheduledReport: (scheduled: Omit<ScheduledReport, 'id'>) => string;
  readonly deleteScheduledReport: (id: string) => void;
  readonly toggleScheduledReport: (id: string) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
  readonly setLoading: (loading: boolean) => void;
}

export interface ScenarioState {
  scenarios: Scenario[];
  readonly selectedScenarioId: string | null;
  readonly comparedScenarioIds: string[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly setScenarios: (scenarios: Scenario[]) => void;
  readonly setSelectedScenario: (id: string) => void;
  readonly createScenario: (
    scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt' | 'isLocked'>
  ) => string;
  readonly updateScenario: (id: string, updates: Partial<Scenario>) => void;
  readonly deleteScenario: (id: string) => void;
  readonly toggleScenarioComparison: (id: string) => void;
  readonly lockScenario: (id: string) => void;
  readonly unlockScenario: (id: string) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
  readonly setLoading: (loading: boolean) => void;
}

export interface UserPreferences {
  readonly activeSector: string;
  readonly density?: 'comfortable' | 'compact';
  readonly currency?: string;
  readonly locale?: string;
}

export interface SettingsState {
  organization: OrganizationSettings;
  readonly users: UserProfile[];
  readonly roles: UserRole[];
  readonly preferences: UserPreferences;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly updateOrganization: (updates: Partial<OrganizationSettings>) => void;
  readonly setUsers: (users: UserProfile[]) => void;
  readonly addUser: (user: Omit<UserProfile, 'id'>) => void;
  readonly updateUser: (id: string, updates: Partial<UserProfile>) => void;
  readonly deleteUser: (id: string) => void;
  readonly setRoles: (roles: UserRole[]) => void;
  readonly updateRolePermissions: (roleId: string, permissions: string[]) => void;
  readonly updatePreferences: (updates: Partial<UserPreferences>) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
  readonly setLoading: (loading: boolean) => void;
}

export interface VarianceState {
  analyses: VarianceAnalysis[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly setAnalyses: (analyses: VarianceAnalysis[]) => void;
  readonly addAnalysis: (analysis: VarianceAnalysis) => void;
  readonly deleteAnalysis: (id: string) => void;
  readonly setError: (error: string | null) => void;
  readonly clearError: () => void;
  readonly setLoading: (loading: boolean) => void;
}

// --- GL Store Types ---

export interface GLEntry {
  readonly id: string;
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly period: string;
  readonly periodName: string;
  readonly debit: number;
  readonly credit: number;
  readonly netChange: number;
  readonly date: string;
  readonly postDate?: string;
  readonly amount: number;
  readonly description: string;
  readonly reference: string;
  readonly entityId?: string;
  readonly departmentId?: string;
  readonly currency?: string;
  // Source system metadata (from glData/RawGLEntry)
  readonly fiscalPeriod?: string;
  readonly department?: string;
  readonly entity?: string;
  readonly journalId?: string;
  readonly journalLine?: number;
  readonly source?: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType | 'Unknown';
  beginningBalance: number;
  debit: number;
  credit: number;
  netChange: number;
  endingBalance: number;
}

export interface AccountAnalysis {
  readonly accountId: string;
  readonly accountCode: string;
  readonly accountName: string;
  readonly monthlyTotals: { month: string; debit: number; credit: number; net: number }[];
  readonly totalDebit: number;
  readonly totalCredit: number;
  readonly averageBalance: number;
  readonly transactionCount: number;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  isRequired: boolean;
}

export interface ImportResult {
  filename: string;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  successCount: number;
  status: 'success' | 'partial' | 'error';
  timestamp?: string;
}

export interface ImportHistoryEntry extends ImportResult {
  readonly id: string;
  readonly timestamp: string;
}

export interface GLState {
  entries: GLEntry[];
  accounts: GLAccount[];
  trialBalance: TrialBalanceRow[];
  accountAnalysis: AccountAnalysis | null;
  columnMapping: ColumnMapping[];
  dateFilter: { start: string; end: string } | null;
  accountFilter: string[];
  isLoading: boolean;
  importProgress: number;
  importStatus:
    | 'idle'
    | 'processing'
    | 'complete'
    | 'error'
    | 'parsing'
    | 'validating'
    | 'importing';
  importError: string | null;
  lastImportResult: ImportResult | null;
  importHistory: ImportHistoryEntry[];
  lastImportEntryIds: string[];
  setEntries: (entries: GLEntry[]) => void;
  addEntry: (entry: GLEntry | GLEntry[]) => void;
  setAccounts: (accounts: GLAccount[]) => void;
  generateTrialBalance: () => void;
  analyzeAccount: (accountId: string) => void;
  filterByDate: (start: string, end: string) => void;
  filterByAccount: (accountIds: string[]) => void;
  clearFilters: () => void;
  updateColumnMapping: (mapping: ColumnMapping[]) => void;
  clearData: () => void;
  setImportProgress: (progress: number) => void;
  setImportStatus: (status: GLState['importStatus']) => void;
  setImportError: (error: string | null) => void;
  recordImport: (result: ImportResult) => void;
  undoLastImport: () => void;
  checkDuplicates: (entries: GLEntry[]) => { duplicates: number; newEntries: GLEntry[] };
  syncToCube: () => void;
  syncFromCube: () => void;
  getCubeState: () => {
    isInitialized: boolean;
    cellCount: number;
    historyCount: number;
    snapshotCount: number;
  };
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryLength: () => number;
}

// --- Analytics Store Types ---

export interface AnalyticsFilter {
  accountTypes: AccountType[];
  departments: string[];
  entities: string[];
  dateRange: { start: string; end: string };
}

export interface ChartConfig {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'waterfall' | 'gauge';
  title: string;
  metrics: string[];
  dimensions: string[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  colorScheme: string;
  showLegend: boolean;
  showGrid: boolean;
}

export interface AnalyticsState {
  charts: ChartConfig[];
  selectedChartId: string | null;
  dateRange: { start: string; end: string };
  selectedMetrics: string[];
  filter: AnalyticsFilter;
  isDrillDown: boolean;
  drillDownPath: string[];
  error: string | null;
  isLoading: boolean;
  addChart: (chart: Omit<ChartConfig, 'id'>) => void;
  updateChart: (id: string, updates: Partial<ChartConfig>) => void;
  removeChart: (id: string) => void;
  setSelectedChart: (id: string | null) => void;
  setDateRange: (dateRange: { start: string; end: string }) => void;
  setSelectedMetrics: (metrics: string[]) => void;
  setFilter: (filter: Partial<AnalyticsFilter>) => void;
  clearFilters: () => void;
  enterDrillDown: (dimension: string) => void;
  exitDrillDown: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
