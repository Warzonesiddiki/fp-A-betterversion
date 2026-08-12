export interface PageHelpDef {
  title: string;
  sections: { title: string; content: string; example?: string }[];
}

/**
 * Help text for every routed page in the application (Phase 9 / G14 _docs.ts).
 * Mnemosyne ownership: src/pages/_docs.ts and any test that lives under src/test/.
 *
 * Coverage target: every `path="..."` defined in src/App.tsx must have a key
 * here so the HelpPanel always has a content panel to show.
 */
export const PAGE_HELP: Record<string, PageHelpDef> = {
  // ── Auth & Onboarding ─────────────────────────────────────────────────────
  '/login': {
    title: 'Sign In',
    sections: [
      {
        title: 'What is this page?',
        content: 'Sign in with your FinPlan Pro account. SSO is supported for enterprise tenants.',
      },
      {
        title: 'Trouble signing in?',
        content:
          'Use the Forgot Password link to receive a reset email, or contact your workspace admin.',
      },
    ],
  },
  '/register': {
    title: 'Create Account',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Create a new FinPlan Pro account. A confirmation email is sent to verify the address.',
      },
    ],
  },
  '/forgot-password': {
    title: 'Reset Password',
    sections: [
      {
        title: 'What is this page?',
        content: 'Receive a password-reset link by email. Links expire after 30 minutes.',
      },
    ],
  },
  '/onboarding': {
    title: 'Onboarding Wizard',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A guided 5-step setup that walks through company info, fiscal calendar, base currency, chart of accounts, and your first budget.',
      },
      {
        title: 'Can I skip steps?',
        content: 'Yes — every step is also accessible from Settings, so onboarding is resumable.',
      },
    ],
  },
  '/help': {
    title: 'Help Center',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Browse the FinPlan Pro help library, search documentation, and open the contextual HelpPanel for any page.',
      },
    ],
  },
  '/profile': {
    title: 'My Profile',
    sections: [
      {
        title: 'What is this page?',
        content: 'Edit your display name, profile photo, notification preferences, and time zone.',
      },
    ],
  },

  // ── Core dashboards ───────────────────────────────────────────────────────
  '/': {
    title: 'Home',
    sections: [
      {
        title: 'What is this page?',
        content:
          'The application root. You will be redirected to the dashboard once you are signed in.',
      },
    ],
  },
  '/dashboard': {
    title: 'Dashboard Overview',
    sections: [
      {
        title: 'What is this page?',
        content: 'The dashboard shows your key financial metrics at a glance.',
      },
      {
        title: 'Key metrics explained',
        content:
          'Revenue = total income. EBITDA = profit before interest, tax, depreciation, and amortization.',
      },
      {
        title: 'What should I do here?',
        content: 'Review the numbers. If something looks off, click into that section for details.',
      },
    ],
  },
  '/drill-down': {
    title: 'Drill-Down',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A deep-dive explorer that lets you traverse the chart of accounts from summary totals to individual journal lines.',
      },
      {
        title: 'Navigation',
        content:
          'Click any cell to drill in, the breadcrumb at the top to drill out, and the "Lock" icon to keep the level in view.',
      },
    ],
  },

  // ── Budgets ───────────────────────────────────────────────────────────────
  '/budgets': {
    title: 'Budgets',
    sections: [
      {
        title: 'Managing Budgets',
        content:
          'This page lists all your active and draft budgets. You can track progress and approval status here.',
      },
      {
        title: 'Creating a Budget',
        content:
          'Click "Create Budget" to start the 4-step wizard. You can select accounts and departments to include.',
      },
    ],
  },
  '/budgets/create': {
    title: 'Create Budget',
    sections: [
      {
        title: 'What is this page?',
        content:
          'The 4-step budget wizard. Choose accounts, departments, seasonality, and the budget period.',
      },
      {
        title: 'Submitting',
        content:
          'Final step writes a Draft budget. You can then route it for approval or publish immediately.',
      },
    ],
  },
  '/budgets/bva': {
    title: 'Budget vs Actual Report',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A combined view of all budgets vs actuals across the year. Variances are surfaced for review.',
      },
    ],
  },
  '/budgets/:id': {
    title: 'Budget Detail',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Edit a single budget. Switch tabs to manage lines, versions, comments, and approvals.',
      },
    ],
  },

  // ── Forecasts & Scenarios ────────────────────────────────────────────────
  '/forecasts': {
    title: 'Forecasts',
    sections: [
      {
        title: 'Financial Forecasting',
        content:
          'Forecasts help you project future performance based on current trends and assumptions.',
      },
      {
        title: 'Rolling Forecasts',
        content:
          'A rolling forecast adds a new period to the future as the current period ends, keeping your horizon constant.',
      },
    ],
  },
  '/forecasts/create': {
    title: 'New Forecast',
    sections: [
      {
        title: 'What is this page?',
        content:
          'The forecast builder. Define a horizon, growth assumptions, and select the accounts to project.',
      },
    ],
  },
  '/forecasts/:id': {
    title: 'Forecast Detail',
    sections: [
      {
        title: 'What is this page?',
        content: 'Inspect a specific forecast, compare versions, and fork into a new variant.',
      },
    ],
  },
  '/forecasts/what-if': {
    title: 'What-If Analysis',
    sections: [
      {
        title: 'What is this page?',
        content: 'Toggle assumptions live and see the impact on your forecast in real time.',
      },
    ],
  },
  '/forecasts/rolling': {
    title: 'Rolling Forecast Help',
    sections: [
      {
        title: 'What is a Rolling Forecast?',
        content:
          'A rolling forecast continuously extends the forecast horizon by adding a new period as each current period closes. It always looks 12 months ahead, ideal for dynamic planning.',
      },
      {
        title: 'Actual vs Forecast',
        content:
          'Compare actual GL data against forecasted values. Green variance means actuals exceeded forecast (favorable for revenue).',
      },
      {
        title: 'Forecast Assumptions',
        content:
          'Revenue growth and expense inflation are computed from the trailing 12-month trend of your GL entries.',
      },
    ],
  },
  '/scenarios': {
    title: 'Scenario Planning',
    sections: [
      {
        title: 'What-If Analysis',
        content:
          'Test how different economic conditions or business decisions affect your bottom line.',
      },
      {
        title: 'Optimistic vs Pessimistic',
        content: 'Compare a "best case" and "worst case" scenario side-by-side.',
      },
    ],
  },
  '/scenarios/create': {
    title: 'New Scenario',
    sections: [
      {
        title: 'What is this page?',
        content: 'Clone an existing plan and tweak the assumptions to model a new scenario.',
      },
    ],
  },
  '/scenarios/:id': {
    title: 'Scenario Detail',
    sections: [
      {
        title: 'What is this page?',
        content: 'Side-by-side comparison of a scenario against the base plan.',
      },
    ],
  },

  // ── Variance & Analytics ─────────────────────────────────────────────────
  '/variance': {
    title: 'Variance Analysis',
    sections: [
      {
        title: 'Understanding Variances',
        content: 'A variance is the difference between your budgeted amount and actual amount.',
      },
      {
        title: 'Favorable vs Unfavorable',
        content:
          'Higher revenue than budget is favorable. Higher expenses than budget is unfavorable.',
      },
    ],
  },
  '/analytics': {
    title: 'Advanced Analytics',
    sections: [
      {
        title: 'Trend Analysis',
        content: 'View 24-month trends for revenue, expenses, and margins.',
      },
      {
        title: 'Data Visualization',
        content: "Use interactive charts to spot patterns that aren't obvious in tables.",
      },
    ],
  },
  '/analytics/benchmarking': {
    title: 'Benchmarking',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Compare your KPIs against an industry peer set, segmented by revenue band and geography.',
      },
    ],
  },
  '/analytics/goal-seek': {
    title: 'Goal Seek',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Solve for the inputs required to hit a target output (e.g. "what revenue do we need to hit 20% margin?").',
      },
    ],
  },
  '/analytics/dashboard-builder': {
    title: 'Dashboard Builder',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Drag-and-drop dashboard designer. Save personal or team dashboards and pin them to the home screen.',
      },
    ],
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  '/ai': {
    title: 'AI Intelligence',
    sections: [
      {
        title: 'What is this page?',
        content:
          'AI-assisted insights: anomaly detection, natural-language variance explanations, and forecast suggestions.',
      },
      {
        title: 'Privacy',
        content:
          'Your GL data is processed inside the local worker pool. Nothing is sent to the cloud without explicit opt-in.',
      },
    ],
  },

  // ── Data & GL ─────────────────────────────────────────────────────────────
  '/data': {
    title: 'Data Management',
    sections: [
      {
        title: 'Importing Data',
        content: 'Upload your General Ledger data here to update the entire application.',
      },
      {
        title: 'Chart of Accounts',
        content: 'Manage your accounting structure, add new accounts, or change mappings.',
      },
    ],
  },
  '/data/migration': {
    title: 'Data Migration',
    sections: [
      {
        title: 'What is this page?',
        content:
          'One-shot migration from QuickBooks, Xero, NetSuite, or a generic CSV with a column-mapping wizard.',
      },
    ],
  },
  '/data/chart-of-accounts': {
    title: 'Chart of Accounts',
    sections: [
      {
        title: 'What is this page?',
        content:
          'The full chart of accounts, including account type, normal balance, and a description for each account.',
      },
      {
        title: 'Editing Accounts',
        content:
          'Click any row to inline-edit. Account codes are immutable once a transaction references them.',
      },
    ],
  },
  '/data/gl-upload': {
    title: 'GL Upload',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Drag-and-drop a GL CSV/Excel file. The pipeline detects the schema and previews the first 100 rows before commit.',
      },
    ],
  },
  '/data/gl-explorer': {
    title: 'GL Explorer',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Filterable, exportable table view of every journal line. Group by account, period, department, or class.',
      },
    ],
  },
  '/data/gl-trial-balance': {
    title: 'Trial Balance',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A point-in-time trial balance with running totals. Debits must equal credits for the report to close.',
      },
    ],
  },
  '/data/gl-journals': {
    title: 'Journals',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Browse, post, and reverse journal entries. Manual journal entries can be created from this page.',
      },
    ],
  },
  '/data/gl-account-analysis': {
    title: 'Account Analysis',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A per-account trend and seasonality analyzer. Click an account in the chart of accounts to land here.',
      },
    ],
  },
  '/data/gl-reporting': {
    title: 'GL Reporting',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Build custom reports directly from the GL. Save report definitions to share with the team.',
      },
    ],
  },

  // ── Audit & Compliance ───────────────────────────────────────────────────
  '/audit/trail': {
    title: 'Audit Trail',
    sections: [
      {
        title: 'What is this page?',
        content:
          'An append-only log of every write to the system. Filter by user, entity, and date range.',
      },
    ],
  },
  '/audit/fair-value': {
    title: 'Fair Value (ASC 820)',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Level 1/2/3 fair-value classification and price-source documentation for financial instruments.',
      },
    ],
  },
  '/audit/impairment': {
    title: 'Impairment (ASC 360)',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Trigger and test goodwill and indefinite-lived intangible asset impairment events.',
      },
    ],
  },

  // ── Consolidation ─────────────────────────────────────────────────────────
  '/consolidation': {
    title: 'Multi-Entity Consolidation',
    sections: [
      {
        title: 'Group Reporting',
        content: 'Combine financial results from multiple subsidiaries into one view.',
      },
      {
        title: 'Eliminations',
        content: 'Remove intercompany transactions to avoid double-counting.',
      },
    ],
  },
  '/consolidation/ic-eliminations': {
    title: 'Intercompany Eliminations',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Match and eliminate intercompany balances and transactions. Unmatched lines are flagged for review.',
      },
    ],
  },
  '/consolidation/ownership': {
    title: 'Ownership Tree',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A visual tree of entities and ownership percentages. Click any node to see the full org structure.',
      },
    ],
  },

  // ── Currency ──────────────────────────────────────────────────────────────
  '/currency/fx-rates': {
    title: 'Exchange Rates',
    sections: [
      {
        title: 'Managing Rates',
        content: 'Define the exchange rates used for translating foreign entity results.',
      },
      {
        title: 'Historical Rates',
        content: 'Keep a record of rates over time for accurate periodic translation.',
      },
    ],
  },
  '/currency/translation': {
    title: 'Translation Results',
    sections: [
      {
        title: 'What is this page?',
        content: 'Cumulative translation adjustment (CTA) and translated trial balance per period.',
      },
    ],
  },
  '/currency/hedging': {
    title: 'Hedge Management',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Track FX and interest-rate hedges with effectiveness testing under ASC 815 / IFRS 9.',
      },
    ],
  },

  // ── Revenue & Lease ───────────────────────────────────────────────────────
  '/revenue/rev-rec': {
    title: 'Revenue Recognition (ASC 606)',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Performance obligations, transaction price allocation, and recognized revenue by period.',
      },
    ],
  },
  '/revenue/deferred': {
    title: 'Deferred Revenue Schedule',
    sections: [
      {
        title: 'What is this page?',
        content: 'Roll-forward of deferred revenue with recognition events by period.',
      },
    ],
  },
  '/lease': {
    title: 'Lease Accounting (ASC 842 / IFRS 16)',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Track Right-of-Use assets and lease liabilities recognized on the balance sheet for operating and finance leases.',
      },
      {
        title: 'Lease Classification',
        content:
          'Account prefixes 17xx represent ROU assets, 23xx represent lease liabilities. Descriptions containing "lease", "rent", or "tenant" are auto-classified.',
      },
    ],
  },
  '/lease/:id': {
    title: 'Lease Detail',
    sections: [
      {
        title: 'What is this page?',
        content: "A single lease's amortization schedule, journal entries, and maturity analysis.",
      },
    ],
  },

  // ── Tax ───────────────────────────────────────────────────────────────────
  '/tax/provision': {
    title: 'Tax Provision (ASC 740)',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Current and deferred tax provision, effective-rate reconciliation, and uncertain tax positions.',
      },
    ],
  },
  '/tax/transfer-pricing': {
    title: 'Transfer Pricing',
    sections: [
      {
        title: 'What is this page?',
        content: 'Intercompany transfer pricing documentation and benchmark analysis.',
      },
    ],
  },

  // ── CapEx & Accounting ────────────────────────────────────────────────────
  '/capex': {
    title: 'CapEx Tracker',
    sections: [
      {
        title: 'Capital Expenditure Tracking',
        content:
          'Monitor long-term asset investments, including project budgets, asset values, and depreciation schedules.',
      },
      {
        title: 'Projects vs Assets',
        content:
          'Projects are planned capital initiatives with budgets. Assets are capitalized items with depreciation over their useful life.',
      },
    ],
  },
  '/capex/depreciation': {
    title: 'Depreciation Forecast',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Project depreciation expense forward using the configured method (straight-line, declining balance, units-of-production).',
      },
    ],
  },
  '/accounting/depreciation': {
    title: 'Depreciation Schedule',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Post and review depreciation entries. Supports multiple books (statutory, tax, management).',
      },
    ],
  },
  '/accounting/multi-book': {
    title: 'Multi-Book Accounting',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Configure and reconcile multiple parallel books. Use this to manage IFRS vs US GAAP differences.',
      },
    ],
  },

  // ── Cash & Treasury ───────────────────────────────────────────────────────
  '/cash/forecast': {
    title: 'Cash Forecast',
    sections: [
      {
        title: 'What is this page?',
        content: '13-week rolling cash forecast driven by AR/AP schedules and forecast revenue.',
      },
    ],
  },
  '/cash/debt': {
    title: 'Debt Schedule',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Track outstanding debt instruments, principal amortizations, and interest accruals.',
      },
    ],
  },
  '/cash/working-capital': {
    title: 'Working Capital',
    sections: [
      {
        title: 'What is this page?',
        content:
          'DIO, DSO, DPO and the cash conversion cycle. Drill into each component for variance drivers.',
      },
    ],
  },
  '/treasury/investments': {
    title: 'Treasury Investments',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Cash equivalents, marketable securities, and yield tracking. Mark-to-market is automatic for Level 1/2 securities.',
      },
    ],
  },
  '/treasury/fx-exposure': {
    title: 'FX Exposure',
    sections: [
      {
        title: 'What is this page?',
        content: 'Net FX exposure by currency with sensitivity to +/- 5% rate moves.',
      },
    ],
  },
  '/treasury/loan-amortization': {
    title: 'Loan Amortization',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Compute a loan amortization schedule from principal, annual rate, and term. Payments, interest, and ending balance are calculated by the LoanAmortizationEngine using exact-decimal arithmetic, so the loan pays off to $0.00.',
      },
    ],
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  '/reports': {
    title: 'Financial Reports',
    sections: [
      {
        title: 'Standard Statements',
        content: 'Access your P&L, Balance Sheet, and Cash Flow statements here.',
      },
      {
        title: 'Exporting',
        content:
          'All reports can be exported to professional PDF or Excel formats for board meetings.',
      },
    ],
  },
  '/reports/profit-loss': {
    title: 'Profit & Loss Statement',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A standard P&L with revenue, COGS, gross profit, opex, and net income. Drill into any line for GL detail.',
      },
    ],
  },
  '/reports/balance-sheet': {
    title: 'Balance Sheet',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Assets, Liabilities, and Equity at a point in time. The balance check runs on every load.',
      },
    ],
  },
  '/reports/cash-flow': {
    title: 'Cash Flow Statement',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Operating, Investing, and Financing cash flow. The indirect method is the default.',
      },
    ],
  },
  '/reports/three-statement': {
    title: 'Three-Statement Dashboard',
    sections: [
      {
        title: 'What is this page?',
        content:
          'All three statements on a single page with a balance check between them. Critical for SOX/audit.',
      },
    ],
  },
  '/reports/budget-vs-actual': {
    title: 'Budget vs Actual',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Compare your budgeted amounts to actual performance across all accounts. Variances are calculated per account and highlighted when material (>10%).',
      },
      {
        title: 'Reading Variances',
        content:
          'Variance = Actual - Budget. Variance % = Variance / |Budget| × 100. Green rows are favorable (revenue higher than budget or expenses lower). Red rows are unfavorable.',
      },
      {
        title: 'Material Variances',
        content:
          'Variances exceeding 10% are flagged as "Material" with an orange badge. Use the filter to show only variances above a certain threshold.',
      },
      {
        title: 'Filters & Export',
        content:
          'Use the Filter panel to narrow by account type, department, or minimum variance %. Export to PDF, Excel, or CSV for reporting.',
      },
      {
        title: 'Waterfall & Decomposition',
        content:
          'The waterfall chart traces Budget → each account variance → Actual. Revenue accounts show Price vs Volume decomposition when data is available.',
      },
    ],
  },
  '/reports/segment': {
    title: 'Segment Reporting (ASC 280)',
    sections: [
      {
        title: 'What is this page?',
        content: 'Reportable segments per ASC 280 with revenue, expense, and asset allocation.',
      },
    ],
  },
  '/reports/scheduler': {
    title: 'Report Scheduler',
    sections: [
      {
        title: 'What is Report Scheduling?',
        content:
          'Automate the generation and distribution of financial reports on a recurring basis.',
      },
      {
        title: 'Setting Up a Schedule',
        content:
          'Select a report, choose frequency, and configure recipients. Reports generate automatically at the specified interval.',
      },
    ],
  },
  '/board-pack': {
    title: 'Board Pack',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Pre-built PDF bundle for the board: P&L, BS, CF, BvA, KPI, and executive summary. Customize the section order here.',
      },
    ],
  },
  '/templates': {
    title: 'Report Templates',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A library of pre-built report templates you can clone and customize. Submit your own to the community gallery.',
      },
    ],
  },

  // ── Workforce ─────────────────────────────────────────────────────────────
  '/workforce/headcount': {
    title: 'Headcount Plan',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Plan hires and departures by department and quarter. Headcount flows through to payroll forecast.',
      },
    ],
  },
  '/workforce/compensation': {
    title: 'Compensation Modeling',
    sections: [
      {
        title: 'What is this page?',
        content: 'Model merit, bonus, and equity compensation. View cost by department and period.',
      },
    ],
  },
  '/workforce/payroll': {
    title: 'Payroll Forecast',
    sections: [
      {
        title: 'What is this page?',
        content: 'Forward 24-month payroll forecast with tax, benefits, and overtime included.',
      },
    ],
  },

  // ── Industry Verticals ────────────────────────────────────────────────────
  '/saas/arr': {
    title: 'ARR Dashboard',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Annual Recurring Revenue broken out by cohort, plan, and region. Includes new, expansion, contraction, and churned ARR.',
      },
    ],
  },
  '/saas/cohort': {
    title: 'Cohort Analysis',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Retention and revenue cohorts over time. Click a cell to see the underlying customers.',
      },
    ],
  },
  '/saas/churn': {
    title: 'Churn Dashboard',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Logo churn, revenue churn, and the leading indicators. Drill into the cohort source.',
      },
    ],
  },
  '/manufacturing/production': {
    title: 'Production Dashboard',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Units produced, downtime, and yield by line. Use this to track factory efficiency.',
      },
    ],
  },
  '/manufacturing/cogs': {
    title: 'COGS Variance',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Standard vs actual COGS by material, labor, and overhead. Price and quantity variances are split.',
      },
    ],
  },
  '/manufacturing/inventory': {
    title: 'Inventory',
    sections: [
      {
        title: 'What is this page?',
        content: 'On-hand, on-order, and reserved inventory. Includes FIFO/LIFO/WAC valuations.',
      },
    ],
  },
  '/retail/stores': {
    title: 'Store Performance',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Same-store sales, traffic, and conversion by location. Compare to last year and budget.',
      },
    ],
  },
  '/retail/promo': {
    title: 'Promo Analysis',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Lift, cannibalization, and halo of each promotion. Tied to the campaign calendar.',
      },
    ],
  },
  '/banking/nim': {
    title: 'Net Interest Margin',
    sections: [
      {
        title: 'What is this page?',
        content:
          'NIM trend, asset/liability mix, and rate-sensitivity gap. Reprices with each rate change.',
      },
    ],
  },
  '/banking/capital': {
    title: 'Capital Adequacy',
    sections: [
      {
        title: 'What is this page?',
        content:
          'CET1, Tier 1, and Total Capital ratios vs Basel III/IV minimums. Includes stress scenarios.',
      },
    ],
  },
  '/banking/loan-loss': {
    title: 'Loan Loss Provisions',
    sections: [
      {
        title: 'What is this page?',
        content:
          'CECL/IFRS 9 expected credit loss calculations, with vintage and roll-rate analyses.',
      },
    ],
  },
  '/healthcare/dashboard': {
    title: 'Healthcare Dashboard',
    sections: [
      {
        title: 'What is this page?',
        content: 'Operating margin, payer mix, and patient volume metrics.',
      },
    ],
  },
  '/healthcare/revenue': {
    title: 'Patient Revenue',
    sections: [
      {
        title: 'What is this page?',
        content: 'Net patient revenue by service line with denial and underpayment analytics.',
      },
    ],
  },
  '/healthcare/clinical-trials': {
    title: 'Clinical Trial Costing',
    sections: [
      {
        title: 'What is this page?',
        content: 'Phase-by-phase cost tracking, milestone burn, and sponsor invoicing.',
      },
    ],
  },
  '/energy/dashboard': {
    title: 'Energy Dashboard',
    sections: [
      {
        title: 'What is this page?',
        content: 'Production, reserves, and realized price by asset.',
      },
    ],
  },
  '/energy/production': {
    title: 'Energy Production',
    sections: [
      {
        title: 'What is this page?',
        content: 'Daily production volumes, downtime events, and recovery factor analysis.',
      },
    ],
  },
  '/energy/risk': {
    title: 'Energy Risk',
    sections: [
      {
        title: 'What is this page?',
        content: 'Commodity hedge effectiveness, basis exposure, and VaR by portfolio.',
      },
    ],
  },
  '/energy/renewable': {
    title: 'Renewable Energy',
    sections: [
      {
        title: 'What is this page?',
        content: 'REC inventory, PPA performance, and tax-credit accrual tracking.',
      },
    ],
  },
  '/energy/emissions': {
    title: 'Emissions Trading',
    sections: [
      {
        title: 'What is this page?',
        content: 'Carbon allowance positions, MTM P&L, and cap-and-trade compliance.',
      },
    ],
  },
  '/esg/carbon': {
    title: 'Carbon Footprint',
    sections: [
      {
        title: 'What is this page?',
        content: 'Scope 1/2/3 emissions with intensity ratios. Pulls from utility and travel data.',
      },
    ],
  },
  '/esg/csrd': {
    title: 'CSRD Report',
    sections: [
      {
        title: 'What is this page?',
        content: 'ESRS-aligned double-materiality assessment and disclosure builder.',
      },
    ],
  },

  // ── Admin & Settings ─────────────────────────────────────────────────────
  '/admin/debug': {
    title: 'Debug Console',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Diagnostic console: clear local state, inspect the persistence layer, and force-rerun benchmarks. Dev-only — hidden in production builds.',
      },
    ],
  },
  '/collaboration': {
    title: 'Collaboration',
    sections: [
      {
        title: 'Comments & Tasks',
        content: 'Discuss financial results with your team and assign action items.',
      },
      {
        title: 'Approvals',
        content: 'Review and approve budgets or forecasts submitted by department heads.',
      },
    ],
  },
  '/collaboration/approvals': {
    title: 'Approval Queue',
    sections: [
      {
        title: 'What is this page?',
        content:
          'All budgets, forecasts, and journal entries awaiting your approval, in priority order.',
      },
    ],
  },
  '/plugins': {
    title: 'Plugin Marketplace',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Browse, install, and configure FinPlan Pro plugins. Plugins run in a sandboxed worker and have explicit permission scopes.',
      },
    ],
  },
  '/settings': {
    title: 'System Settings',
    sections: [
      {
        title: 'Organization',
        content: 'Manage your company name, fiscal year, and base currency.',
      },
      {
        title: 'Users & Roles',
        content: 'Control who has access to the application and what they can see.',
      },
    ],
  },
  '/settings/users': {
    title: 'User Management',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Invite teammates, assign roles (Admin, Editor, Viewer), and audit session activity.',
      },
    ],
  },
  // ── Stub entries (G14 coverage) ─────────────────────────────────────────────
  '/admin/benchmarks': {
    title: 'Benchmarks',
    sections: [
      { title: 'What is this page?', content: 'Compare your metrics against industry benchmarks.' },
    ],
  },
  '/ai/nlq': {
    title: 'Natural Language Query',
    sections: [
      { title: 'What is this page?', content: 'Ask questions about your data in plain English.' },
    ],
  },
  '/analytics/data-lineage': {
    title: 'Data Lineage',
    sections: [
      { title: 'What is this page?', content: 'Track the flow of data from source to report.' },
    ],
  },
  '/audit/sox': {
    title: 'SOX Audit',
    sections: [
      { title: 'What is this page?', content: 'Sarbanes-Oxley controls and audit trail.' },
    ],
  },
  '/periods/close': {
    title: 'Period Close',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Run the month-end close: pick a fiscal period, work the close checklist, and walk the period through open → soft-close → hard-close → locked. Every transition is validated (trial balance must balance, GL data must exist, budgets approved) and recorded in a SHA-256 chained audit log.',
      },
      {
        title: 'Who can close a period?',
        content:
          'Admin and FP&A Managers can soft-close, hard-close and lock periods (period:close). Reopening a closed or locked period requires Admin (period:reopen) and a reason. All other roles see the workflow read-only.',
      },
      {
        title: 'Why would a close be blocked?',
        content:
          'The pre-close validation panel shows the exact reason: no GL entries in the period, an unbalanced trial balance (debits ≠ credits to the cent), unapproved fiscal-year budgets, or incomplete critical checklist tasks. Hard-close and lock are blocked until every check passes.',
      },
      {
        title: 'What happens when a period is locked?',
        content:
          'The period cannot be posted to or reopened without admin force-reopen. Its budget line items and the fiscal year’s scenarios are frozen, and the post-close report pack (P&L, balance sheet, cash flow) can be exported from the real GL.',
      },
    ],
  },
  '/banking/banking': {
    title: 'Banking',
    sections: [{ title: 'What is this page?', content: 'Banking sector dashboard.' }],
  },
  '/banking/reconciliation': {
    title: 'Bank Reconciliation',
    sections: [
      { title: 'What is this page?', content: 'Match bank statements to ledger entries.' },
    ],
  },
  '/banking/statements': {
    title: 'Bank Statements',
    sections: [{ title: 'What is this page?', content: 'View imported bank statements.' }],
  },
  '/bonds/portfolio': {
    title: 'Bond Portfolio',
    sections: [{ title: 'What is this page?', content: 'Track bond holdings and yield.' }],
  },
  '/bonds/yield-curve': {
    title: 'Yield Curve',
    sections: [{ title: 'What is this page?', content: 'Visualize the current yield curve.' }],
  },
  '/budgets/approval': {
    title: 'Budget Approval',
    sections: [{ title: 'What is this page?', content: 'Approve or reject submitted budgets.' }],
  },
  '/capex/tracker': {
    title: 'CapEx Tracker',
    sections: [
      { title: 'What is this page?', content: 'Track capital expenditure requests and approvals.' },
    ],
  },
  '/charts/chart-of-accounts': {
    title: 'Chart of Accounts',
    sections: [{ title: 'What is this page?', content: 'View and manage the chart of accounts.' }],
  },
  '/charts/showcase': {
    title: 'Chart Showcase',
    sections: [{ title: 'What is this page?', content: 'Browse all available chart types.' }],
  },
  '/collaboration/activity': {
    title: 'Activity Feed',
    sections: [{ title: 'What is this page?', content: 'Recent activity from your team.' }],
  },
  '/collaboration/shared': {
    title: 'Shared With Me',
    sections: [{ title: 'What is this page?', content: 'Items others have shared with you.' }],
  },
  '/collaboration/team': {
    title: 'Team',
    sections: [{ title: 'What is this page?', content: 'View your team members.' }],
  },
  '/consolidation/detail': {
    title: 'Consolidation Detail',
    sections: [{ title: 'What is this page?', content: 'Drill into a consolidation run.' }],
  },
  '/construction/dashboard': {
    title: 'Construction Dashboard',
    sections: [{ title: 'What is this page?', content: 'Construction sector KPIs.' }],
  },
  '/construction/equipment': {
    title: 'Equipment Tracking',
    sections: [{ title: 'What is this page?', content: 'Track construction equipment usage.' }],
  },
  '/construction/project': {
    title: 'Project Tracking',
    sections: [{ title: 'What is this page?', content: 'Track construction project budgets.' }],
  },
  '/credit/risk': {
    title: 'Credit Risk',
    sections: [{ title: 'What is this page?', content: 'Monitor credit risk exposure.' }],
  },
  '/data/data-flow': {
    title: 'Data Flow',
    sections: [{ title: 'What is this page?', content: 'Visualize data pipelines.' }],
  },
  '/data/reconciliation': {
    title: 'Data Reconciliation',
    sections: [{ title: 'What is this page?', content: 'Reconcile data between sources.' }],
  },
  '/data/reconciliation-results': {
    title: 'Reconciliation Results',
    sections: [{ title: 'What is this page?', content: 'View reconciliation outcomes.' }],
  },
  '/data/version-diff': {
    title: 'Version Diff',
    sections: [{ title: 'What is this page?', content: 'Compare data versions.' }],
  },
  '/education': {
    title: 'Education',
    sections: [{ title: 'What is this page?', content: 'Education sector dashboard.' }],
  },
  '/education/enrollment': {
    title: 'Enrollment & Retention',
    sections: [
      {
        title: 'What is this page?',
        content: 'Enrollment, retention rate, revenue per student and faculty-to-student ratio.',
      },
    ],
  },
  '/education/research-grants': {
    title: 'Research Grants',
    sections: [
      {
        title: 'What is this page?',
        content: 'Research grant win rate, endowment growth and sponsored research revenue.',
      },
    ],
  },
  '/energy/sector': {
    title: 'Energy Sector',
    sections: [{ title: 'What is this page?', content: 'Energy sector KPIs.' }],
  },
  '/esg/overview': {
    title: 'ESG Overview',
    sections: [
      { title: 'What is this page?', content: 'Environmental, social, and governance metrics.' },
    ],
  },
  '/forecasts/auto-update': {
    title: 'Auto-Update Forecasts',
    sections: [{ title: 'What is this page?', content: 'Configure automatic forecast refresh.' }],
  },
  '/forecasts/compare': {
    title: 'Compare Forecasts',
    sections: [{ title: 'What is this page?', content: 'Side-by-side forecast comparison.' }],
  },
  '/forecasts/drivers': {
    title: 'Forecast Drivers',
    sections: [{ title: 'What is this page?', content: 'Manage the drivers behind forecasts.' }],
  },
  '/government': {
    title: 'Government',
    sections: [{ title: 'What is this page?', content: 'Government sector dashboard.' }],
  },
  '/government/grants': {
    title: 'Grants & Disbursement',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Grant disbursement rate, cost per citizen, revenue collection gap and budget utilization.',
      },
    ],
  },
  '/government/procurement': {
    title: 'Procurement Cycle',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Competitive tender percentage, compliance score, average cycle days and negotiated savings.',
      },
    ],
  },
  '/healthcare/overview': {
    title: 'Healthcare Overview',
    sections: [{ title: 'What is this page?', content: 'Healthcare sector KPIs.' }],
  },
  '/healthcare/value-based': {
    title: 'Value-Based Care',
    sections: [{ title: 'What is this page?', content: 'Value-based care contracts and metrics.' }],
  },
  '/insurance/claims': {
    title: 'Insurance Claims',
    sections: [{ title: 'What is this page?', content: 'Track insurance claims.' }],
  },
  '/insurance/dashboard': {
    title: 'Insurance Dashboard',
    sections: [{ title: 'What is this page?', content: 'Insurance sector KPIs.' }],
  },
  '/insurance/insurance': {
    title: 'Insurance',
    sections: [{ title: 'What is this page?', content: 'Insurance sector dashboard.' }],
  },
  '/insurance/underwriting': {
    title: 'Underwriting',
    sections: [{ title: 'What is this page?', content: 'Underwriting workflow.' }],
  },
  '/lease/accounting': {
    title: 'Lease Accounting',
    sections: [{ title: 'What is this page?', content: 'ASC 842 lease accounting.' }],
  },
  '/logistics': {
    title: 'Logistics',
    sections: [{ title: 'What is this page?', content: 'Logistics sector dashboard.' }],
  },
  '/logistics/fleet-cost': {
    title: 'Fleet Cost',
    sections: [
      {
        title: 'What is this page?',
        content: 'Cost per mile, fleet utilization, empty miles and fleet EBITDA analytics.',
      },
    ],
  },
  '/logistics/warehouse-cost': {
    title: 'Warehouse Cost',
    sections: [
      {
        title: 'What is this page?',
        content: 'Warehousing cost as a percentage of revenue and operating margin analytics.',
      },
    ],
  },
  '/manufacturing/overview': {
    title: 'Manufacturing Overview',
    sections: [{ title: 'What is this page?', content: 'Manufacturing sector KPIs.' }],
  },
  '/realestate/dashboard': {
    title: 'Real Estate Dashboard',
    sections: [{ title: 'What is this page?', content: 'Real estate sector KPIs.' }],
  },
  '/realestate/facility': {
    title: 'Facility Management',
    sections: [{ title: 'What is this page?', content: 'Manage facilities.' }],
  },
  '/realestate/portfolio': {
    title: 'Portfolio',
    sections: [{ title: 'What is this page?', content: 'Real estate portfolio.' }],
  },
  '/realestate/reit': {
    title: 'REIT',
    sections: [{ title: 'What is this page?', content: 'REIT analytics.' }],
  },
  '/realestate/valuation': {
    title: 'Property Valuation',
    sections: [{ title: 'What is this page?', content: 'Property valuation models.' }],
  },
  '/reports/book-builder': {
    title: 'Book Builder',
    sections: [{ title: 'What is this page?', content: 'Build report books.' }],
  },
  '/reports/designer': {
    title: 'Report Designer',
    sections: [{ title: 'What is this page?', content: 'Design custom reports.' }],
  },
  '/reports/library': {
    title: 'Report Library',
    sections: [{ title: 'What is this page?', content: 'Browse saved reports.' }],
  },
  '/reports/templates': {
    title: 'Report Templates',
    sections: [{ title: 'What is this page?', content: 'Pre-built report templates.' }],
  },
  '/retail/dashboard': {
    title: 'Retail Dashboard',
    sections: [{ title: 'What is this page?', content: 'Retail sector KPIs.' }],
  },
  '/retail/inventory': {
    title: 'Inventory',
    sections: [{ title: 'What is this page?', content: 'Inventory tracking.' }],
  },
  '/retail/inventory-planning': {
    title: 'Inventory Planning',
    sections: [{ title: 'What is this page?', content: 'Plan future inventory needs.' }],
  },
  '/retail/performance': {
    title: 'Store Performance',
    sections: [{ title: 'What is this page?', content: 'Per-store performance metrics.' }],
  },
  '/retail/retail': {
    title: 'Retail',
    sections: [{ title: 'What is this page?', content: 'Retail sector dashboard.' }],
  },
  '/saas/churn-analysis': {
    title: 'Churn Analysis',
    sections: [{ title: 'What is this page?', content: 'Customer churn analysis.' }],
  },
  '/saas/overview': {
    title: 'SaaS Overview',
    sections: [{ title: 'What is this page?', content: 'SaaS sector KPIs.' }],
  },
  '/scenarios/compare': {
    title: 'Compare Scenarios',
    sections: [
      { title: 'What is this page?', content: 'Compare multiple scenarios side-by-side.' },
    ],
  },
  '/scenarios/lock': {
    title: 'Scenario Locks',
    sections: [{ title: 'What is this page?', content: 'Locked scenario versions.' }],
  },
  '/scenarios/merge': {
    title: 'Merge Scenarios',
    sections: [{ title: 'What is this page?', content: 'Merge two scenarios.' }],
  },
  '/sector/agriculture': {
    title: 'Agriculture',
    sections: [{ title: 'What is this page?', content: 'Agriculture sector dashboard.' }],
  },
  '/sector/banking': {
    title: 'Banking',
    sections: [{ title: 'What is this page?', content: 'Banking sector dashboard.' }],
  },
  '/sector/construction': {
    title: 'Construction',
    sections: [{ title: 'What is this page?', content: 'Construction sector dashboard.' }],
  },
  '/sector/education': {
    title: 'Education',
    sections: [{ title: 'What is this page?', content: 'Education sector dashboard.' }],
  },
  '/sector/emissions': {
    title: 'Emissions',
    sections: [{ title: 'What is this page?', content: 'Carbon emissions tracking.' }],
  },
  '/sector/energy': {
    title: 'Energy',
    sections: [{ title: 'What is this page?', content: 'Energy sector dashboard.' }],
  },
  '/sector/equipment': {
    title: 'Equipment',
    sections: [{ title: 'What is this page?', content: 'Equipment sector dashboard.' }],
  },
  '/sector/government': {
    title: 'Government',
    sections: [{ title: 'What is this page?', content: 'Government sector dashboard.' }],
  },
  '/sector/healthcare': {
    title: 'Healthcare',
    sections: [{ title: 'What is this page?', content: 'Healthcare sector dashboard.' }],
  },
  '/sector/hospitality': {
    title: 'Hospitality',
    sections: [{ title: 'What is this page?', content: 'Hospitality sector dashboard.' }],
  },
  '/sector/insurance': {
    title: 'Insurance',
    sections: [{ title: 'What is this page?', content: 'Insurance sector dashboard.' }],
  },
  '/sector/logistics': {
    title: 'Logistics',
    sections: [{ title: 'What is this page?', content: 'Logistics sector dashboard.' }],
  },
  '/sector/manufacturing': {
    title: 'Manufacturing',
    sections: [{ title: 'What is this page?', content: 'Manufacturing sector dashboard.' }],
  },
  '/sector/real-estate': {
    title: 'Real Estate',
    sections: [{ title: 'What is this page?', content: 'Real estate sector dashboard.' }],
  },
  '/sector/retail': {
    title: 'Retail',
    sections: [{ title: 'What is this page?', content: 'Retail sector dashboard.' }],
  },
  '/sector/sector': {
    title: 'Sector',
    sections: [{ title: 'What is this page?', content: 'Sector overview.' }],
  },
  '/sector/technology': {
    title: 'Technology',
    sections: [{ title: 'What is this page?', content: 'Technology sector dashboard.' }],
  },
  '/sector/telecommunications': {
    title: 'Telecommunications',
    sections: [{ title: 'What is this page?', content: 'Telecommunications sector dashboard.' }],
  },
  '/sectors/education': {
    title: 'Education',
    sections: [{ title: 'What is this page?', content: 'Education sector dashboard.' }],
  },
  '/sectors/government': {
    title: 'Government',
    sections: [{ title: 'What is this page?', content: 'Government sector dashboard.' }],
  },
  '/sectors/logistics': {
    title: 'Logistics',
    sections: [{ title: 'What is this page?', content: 'Logistics sector dashboard.' }],
  },
  '/sectors/telecom': {
    title: 'Telecom',
    sections: [{ title: 'What is this page?', content: 'Telecommunications sector dashboard.' }],
  },
  '/settings/backup': {
    title: 'Backup',
    sections: [{ title: 'What is this page?', content: 'Backup and restore settings.' }],
  },
  '/settings/connectors': {
    title: 'Connectors',
    sections: [{ title: 'What is this page?', content: 'Configure external connectors.' }],
  },
  '/settings/integrations': {
    title: 'Integrations',
    sections: [{ title: 'What is this page?', content: 'Third-party integrations.' }],
  },
  '/settings/security': {
    title: 'Security',
    sections: [{ title: 'What is this page?', content: 'Security settings.' }],
  },
  '/telecom': {
    title: 'Telecom',
    sections: [{ title: 'What is this page?', content: 'Telecommunications sector dashboard.' }],
  },
  '/templates/preview': {
    title: 'Template Preview',
    sections: [
      { title: 'What is this page?', content: 'Preview a budget template before applying.' },
    ],
  },
  '/admin/engines': {
    title: 'Engine Catalog',
    sections: [
      {
        title: 'What is this page?',
        content:
          'An inventory of every financial calculation engine bundled with FinPlan Pro, including which pages, components, and stores reference it.',
      },
      {
        title: 'What should I do here?',
        content:
          'Use this to audit engine coverage: engines with no consumers are flagged so they can be wired up or removed.',
      },
    ],
  },
  '/analytics/pivot-explorer': {
    title: 'Pivot Explorer',
    sections: [
      {
        title: 'What is this page?',
        content:
          'An interactive pivot table for slicing GL and cube data by any combination of dimensions (account, entity, period, department).',
      },
      {
        title: 'What should I do here?',
        content: 'Drag dimensions onto rows/columns and choose a measure to aggregate.',
      },
    ],
  },
  '/docs/api': {
    title: 'API Reference',
    sections: [
      {
        title: 'What is this page?',
        content:
          'Reference documentation for the FinPlan Pro public API surface, including available endpoints and SDK usage.',
      },
    ],
  },
  '/visual/atlas': {
    title: 'Atlas Visual Baseline (Developer Harness)',
    sections: [
      {
        title: 'What is this page?',
        content:
          'A developer-only harness that renders every Atlas design-system primitive on one deterministic page so Playwright can capture byte-stable screenshots. It is not part of the FP&A workflow and is intentionally not linked from navigation.',
      },
      {
        title: 'What should I do here?',
        content:
          'Nothing, unless you are reviewing a visual-regression diff. Run the Atlas visual spec to compare this page against its committed baselines; any pixel change is either an intended design-token update (accept the new baseline) or an unintended regression (fix the component).',
      },
    ],
  },
};
