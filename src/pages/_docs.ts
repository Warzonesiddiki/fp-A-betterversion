export interface PageHelpDef {
  title: string;
  sections: { title: string; content: string; example?: string }[];
}

export const PAGE_HELP: Record<string, PageHelpDef> = {
  '/dashboard': {
    title: 'Dashboard Overview',
    sections: [
      {
        title: 'What is this page?',
        content: 'The dashboard shows your key financial metrics at a glance.',
        example: 'Like the cover page of your monthly financial report.',
      },
      {
        title: 'Key metrics explained',
        content: 'Revenue = total income. EBITDA = profit before interest, tax, depreciation.',
        example: 'If your company earns $1M and spends $600K, your EBITDA is $400K.',
      },
      {
        title: 'What should I do here?',
        content: 'Review the numbers. If something looks off, click into that section for details.',
      },
    ],
  },
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
};
