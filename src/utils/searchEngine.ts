/**
 * Global search engine for FinPlan Pro
 * Searches across budgets, forecasts, scenarios, GL entries, accounts, entities
 */

export interface SearchResult {
  id: string;
  type: 'budget' | 'forecast' | 'scenario' | 'account' | 'entity' | 'page' | 'engine';
  title: string;
  subtitle?: string;
  path: string;
  score: number;
}

interface SearchableItem {
  id: string;
  type: SearchResult['type'];
  title: string;
  subtitle?: string;
  path: string;
  keywords: string[];
}

const searchableItems: SearchableItem[] = [];

export function registerSearchItems(items: SearchableItem[]): void {
  searchableItems.push(...items);
}

export function search(query: string, limit: number = 20): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);

  const scored: SearchResult[] = [];

  for (const item of searchableItems) {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const subtitleLower = item.subtitle?.toLowerCase() ?? '';
    const keywordsLower = item.keywords.map((k) => k.toLowerCase());

    // Exact title match
    if (titleLower === lowerQuery) {
      score += 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(lowerQuery)) {
      score += 80;
    }
    // Title contains query
    else if (titleLower.includes(lowerQuery)) {
      score += 60;
    }

    // Subtitle match
    if (subtitleLower.includes(lowerQuery)) {
      score += 30;
    }

    // Keyword matches
    for (const term of terms) {
      if (titleLower.includes(term)) score += 20;
      if (subtitleLower.includes(term)) score += 10;
      if (keywordsLower.some((k) => k.includes(term))) score += 15;
    }

    // Type boost
    if (item.type === 'page') score += 5;

    if (score > 0) {
      scored.push({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        path: item.path,
        score,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function registerPageSearchItems(): void {
  const pages: SearchableItem[] = [
    {
      id: 'dashboard',
      type: 'page',
      title: 'Dashboard',
      path: '/',
      keywords: ['home', 'overview', 'kpi'],
    },
    {
      id: 'budgets',
      type: 'page',
      title: 'Budgets',
      path: '/budgets',
      keywords: ['budget', 'planning', 'allocation'],
    },
    {
      id: 'forecasts',
      type: 'page',
      title: 'Forecasts',
      path: '/forecasts',
      keywords: ['forecast', 'prediction', 'rolling'],
    },
    {
      id: 'scenarios',
      type: 'page',
      title: 'Scenarios',
      path: '/scenarios',
      keywords: ['scenario', 'what-if', 'simulation'],
    },
    {
      id: 'reports',
      type: 'page',
      title: 'Reports',
      path: '/reports',
      keywords: ['report', 'financial', 'statement'],
    },
    {
      id: 'consolidation',
      type: 'page',
      title: 'Consolidation',
      path: '/consolidation',
      keywords: ['consolidation', 'multi-entity', 'merge'],
    },
    {
      id: 'currency',
      type: 'page',
      title: 'Currency',
      path: '/currency',
      keywords: ['currency', 'fx', 'exchange', 'rate'],
    },
    {
      id: 'audit',
      type: 'page',
      title: 'Audit Trail',
      path: '/audit',
      keywords: ['audit', 'compliance', 'sox'],
    },
    {
      id: 'settings',
      type: 'page',
      title: 'Settings',
      path: '/settings',
      keywords: ['settings', 'config', 'preferences'],
    },
    {
      id: 'templates',
      type: 'page',
      title: 'Templates',
      path: '/templates',
      keywords: ['template', 'gallery', 'preset'],
    },
    {
      id: 'charts',
      type: 'page',
      title: 'Chart Showcase',
      path: '/charts',
      keywords: ['chart', 'visualization', 'graph'],
    },
    {
      id: 'nlq',
      type: 'page',
      title: 'NLQ Chat',
      path: '/nlq',
      keywords: ['nlq', 'query', 'natural language', 'ai'],
    },
    {
      id: 'data-import',
      type: 'page',
      title: 'Data Import',
      path: '/data/import',
      keywords: ['import', 'excel', 'csv', 'upload'],
    },
    {
      id: 'chart-of-accounts',
      type: 'page',
      title: 'Chart of Accounts',
      path: '/data/accounts',
      keywords: ['account', 'gl', 'chart'],
    },
    {
      id: 'profit-loss',
      type: 'page',
      title: 'Profit & Loss',
      path: '/reports/pnl',
      keywords: ['profit', 'loss', 'income', 'statement'],
    },
    {
      id: 'balance-sheet',
      type: 'page',
      title: 'Balance Sheet',
      path: '/reports/balance-sheet',
      keywords: ['balance', 'sheet', 'assets', 'liabilities'],
    },
    {
      id: 'cash-flow',
      type: 'page',
      title: 'Cash Flow',
      path: '/reports/cash-flow',
      keywords: ['cash', 'flow', 'operating', 'investing'],
    },
    {
      id: 'three-statement',
      type: 'page',
      title: '3-Statement Dashboard',
      path: '/reports/three-statement',
      keywords: ['3-statement', 'integrated', 'p&l', 'bs', 'cf'],
    },
    {
      id: 'what-if',
      type: 'page',
      title: 'What-If Analysis',
      path: '/forecasts/what-if',
      keywords: ['what-if', 'slider', 'simulation'],
    },
    {
      id: 'rolling-forecast',
      type: 'page',
      title: 'Rolling Forecast',
      path: '/forecasts/rolling',
      keywords: ['rolling', 'forecast', 'continuous'],
    },
    {
      id: 'driver-planning',
      type: 'page',
      title: 'Driver Planning',
      path: '/forecasts/drivers',
      keywords: ['driver', 'planning', 'cascade'],
    },
    {
      id: 'variance',
      type: 'page',
      title: 'Variance Dashboard',
      path: '/variance',
      keywords: ['variance', 'budget', 'actual', 'favorable'],
    },
    {
      id: 'collaboration',
      type: 'page',
      title: 'Collaboration',
      path: '/collaboration',
      keywords: ['collaboration', 'comment', 'task'],
    },
    {
      id: 'help',
      type: 'page',
      title: 'Help',
      path: '/help',
      keywords: ['help', 'faq', 'support'],
    },
  ];
  registerSearchItems(pages);
}
