-- FinPlan Pro - Institutional Grade SQLite Schema
-- Version: 2.0.0

-- 1. Entities
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    country TEXT,
    parent_id TEXT,
    ownership_pct REAL DEFAULT 100.0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES entities(id)
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    head_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chart of Accounts
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Revenue', 'COGS', 'OpEx', 'CapEx', 'Asset', 'Liability', 'Equity')),
    category TEXT,
    sub_category TEXT,
    parent_id TEXT,
    level INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    entity_id TEXT,
    department_id TEXT,
    is_calculated INTEGER DEFAULT 0,
    formula TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES accounts(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 4. GL Entries (Actuals)
CREATE TABLE IF NOT EXISTS gl_entries (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    account_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    department_id TEXT,
    post_date DATE NOT NULL,
    amount REAL NOT NULL,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    description TEXT,
    reference TEXT,
    batch_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    journal_id TEXT,
    idempotency_key TEXT,
    idempotency_hash TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 5. Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    name TEXT NOT NULL,
    description TEXT,
    fiscal_year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'InReview', 'Approved', 'Locked', 'Rejected')),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    total_amount REAL DEFAULT 0,
    entity_id TEXT,
    deleted_at TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME,
    approved_at DATETIME,
    approved_by TEXT,
    version INTEGER DEFAULT 1
);

-- 6. Budget Line Items
CREATE TABLE IF NOT EXISTS budget_line_items (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    budget_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    period_id TEXT,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    amount REAL NOT NULL DEFAULT 0,
    formula TEXT,
    is_calculated INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    notes TEXT,
    driver_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 7. Audit Trail
-- Canonical audit_trail shape. The server routes (budgets, entities, export,
-- forecasts, gl, periods, reports, scenarios, commands) all insert:
--   (id TEXT PK, action, entity_type, entity_id, user_id, details, created_at)
-- Server-side reconciliation (ensureCanonicalAuditTrail) migrates databases
-- that still carry the earlier resource_type/resource_id shape.
CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 8. Key-Value Store (For Zustand Persistence)
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Scenarios
CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    name TEXT NOT NULL,
    description TEXT,
    scenario_type TEXT NOT NULL DEFAULT 'custom' CHECK (scenario_type IN ('base', 'optimistic', 'pessimistic', 'custom', 'stress_test')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'locked')),
    base_scenario_id TEXT,
    fiscal_year INTEGER,
    entity_id TEXT,
    budget_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_scenario_id) REFERENCES scenarios(id)
);

-- 10. Scenario Line Items
CREATE TABLE IF NOT EXISTS scenario_line_items (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    scenario_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    period_id TEXT,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    amount REAL NOT NULL DEFAULT 0,
    adjustment_pct REAL DEFAULT 0,
    adjustment_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 11. Forecasts
CREATE TABLE IF NOT EXISTS forecasts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    name TEXT NOT NULL,
    description TEXT,
    forecast_type TEXT NOT NULL DEFAULT 'Rolling' CHECK (forecast_type IN ('Rolling', 'Quarterly', 'Annual', 'Custom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'locked')),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    fiscal_year INTEGER,
    start_period TEXT,
    end_period TEXT,
    entity_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Forecast Periods
CREATE TABLE IF NOT EXISTS forecast_periods (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    forecast_id TEXT NOT NULL,
    period_id TEXT NOT NULL,
    period_name TEXT NOT NULL,
    period_start DATE,
    period_end DATE,
    is_locked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE
);

-- 13. Forecast Line Items
CREATE TABLE IF NOT EXISTS forecast_line_items (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    forecast_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    period_id TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    confidence REAL DEFAULT 0,
    methodology TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (forecast_id) REFERENCES forecasts(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 14. Reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    environment_id TEXT NOT NULL DEFAULT 'dev',
    name TEXT NOT NULL,
    description TEXT,
    report_type TEXT NOT NULL DEFAULT 'custom' CHECK (report_type IN ('income_statement', 'balance_sheet', 'cash_flow', 'trial_balance', 'variance', 'custom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'locked')),
    template_id TEXT,
    config TEXT,
    filters TEXT,
    layout TEXT,
    entity_id TEXT,
    created_by TEXT,
    is_template INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL DEFAULT 'custom',
    config TEXT NOT NULL,
    layout TEXT NOT NULL,
    is_system INTEGER DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'error', 'success', 'system')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    action_url TEXT,
    action_label TEXT,
    resource_type TEXT,
    resource_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Collaboration Comments
CREATE TABLE IF NOT EXISTS collaboration_comments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    content TEXT NOT NULL,
    mentions TEXT,
    is_resolved INTEGER DEFAULT 0,
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES collaboration_comments(id) ON DELETE CASCADE
);

-- 18. Collaboration Tasks
CREATE TABLE IF NOT EXISTS collaboration_tasks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'InProgress', 'Done', 'Cancelled')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    assigned_to TEXT,
    assigned_by TEXT,
    due_date DATE,
    completed_at DATETIME,
    resource_type TEXT,
    resource_id TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    resource_type TEXT,
    resource_id TEXT,
    uploaded_by TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    checksum TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. ESG Data
CREATE TABLE IF NOT EXISTS esg_data (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL CHECK (metric_category IN ('environmental', 'social', 'governance')),
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    period TEXT NOT NULL,
    entity_id TEXT,
    source TEXT,
    verified INTEGER DEFAULT 0,
    verified_by TEXT,
    verified_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- 21. Custom Fields
CREATE TABLE IF NOT EXISTS custom_fields (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multi_select', 'currency', 'percentage')),
    resource_type TEXT NOT NULL,
    is_required INTEGER DEFAULT 0,
    default_value TEXT,
    options TEXT,
    validation_rules TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 22. Custom Field Values
CREATE TABLE IF NOT EXISTS custom_field_values (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    field_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);

-- 23. Currency Rates
CREATE TABLE IF NOT EXISTS currency_rates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate REAL NOT NULL,
    effective_date DATE NOT NULL,
    source TEXT DEFAULT 'manual',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 24. Fiscal Periods
CREATE TABLE IF NOT EXISTS fiscal_periods (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    year INTEGER NOT NULL,
    period_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'Monthly' CHECK (period_type IN ('Monthly', 'Quarterly', 'Annual', 'Adjusting')),
    is_adjusting_period INTEGER DEFAULT 0,
    is_closed INTEGER DEFAULT 0,
    closed_at DATETIME,
    closed_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 25. Workflows
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    description TEXT,
    workflow_type TEXT NOT NULL DEFAULT 'approval' CHECK (workflow_type IN ('approval', 'review', 'sign_off', 'custom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'rejected')),
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    initiated_by TEXT NOT NULL,
    completed_by TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 26. Workflow Steps
CREATE TABLE IF NOT EXISTS workflow_steps (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    workflow_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_type TEXT NOT NULL DEFAULT 'approval' CHECK (step_type IN ('approval', 'review', 'notification', 'condition', 'action')),
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'skipped')),
    started_at DATETIME,
    completed_at DATETIME,
    completed_by TEXT,
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- 27. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- 28. Recent Activity
CREATE TABLE IF NOT EXISTS recent_activity (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_name TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 29. Stores (For Zustand Persistence)
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_gl_entries_date ON gl_entries(post_date);
CREATE INDEX IF NOT EXISTS idx_gl_entries_account ON gl_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_entity ON gl_entries(entity_id);
CREATE INDEX IF NOT EXISTS idx_gl_entries_batch ON gl_entries(batch_id);
-- W0.8.6 (K27): idempotent journal replay lookup. The KEY identifies a
-- BATCH (journal), so multiple rows legitimately share it — uniqueness is
-- enforced transactionally in the route (claim-check inside the insert
-- transaction; better-sqlite3 is synchronous/single-threaded). Scoped by
-- tenant_id so one tenant's keys never interact with another's; deleted
-- rows keep their key so a replay finds the tombstone instead of minting
-- duplicates. Postgres S2 note: replace with UNIQUE(tenant_id,
-- idempotency_key, journal_line).
CREATE INDEX IF NOT EXISTS idx_gl_entries_tenant_idem
    ON gl_entries(tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_budget_items_lookup ON budget_line_items(budget_id, account_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_period ON budget_line_items(period_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_year ON scenarios(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_scenario_items_scenario ON scenario_line_items(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_items_account ON scenario_line_items(account_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_year ON forecasts(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_forecast ON forecast_periods(forecast_id);
CREATE INDEX IF NOT EXISTS idx_forecast_items_forecast ON forecast_line_items(forecast_id);
CREATE INDEX IF NOT EXISTS idx_forecast_items_account ON forecast_line_items(account_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_resource ON collaboration_comments(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON collaboration_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON collaboration_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_resource ON documents(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_esg_category ON esg_data(metric_category);
CREATE INDEX IF NOT EXISTS idx_esg_period ON esg_data(period);
CREATE INDEX IF NOT EXISTS idx_esg_entity ON esg_data(entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_resource ON custom_fields(resource_type);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_resource ON custom_field_values(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_currency_rates_pair ON currency_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON currency_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_year ON fiscal_periods(year);
CREATE INDEX IF NOT EXISTS idx_workflows_resource ON workflows(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_user ON recent_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_resource ON recent_activity(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_created ON recent_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_entity ON accounts(entity_id);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_entities_parent ON entities(parent_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);

-- Tenancy (W0.2): tenant-scoped access indexes on high-volume surfaces
CREATE INDEX IF NOT EXISTS idx_gl_entries_tenant ON gl_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_tenant ON budget_line_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scenario_line_items_tenant ON scenario_line_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forecast_line_items_tenant ON forecast_line_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_tenant ON forecast_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_tenant ON audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
