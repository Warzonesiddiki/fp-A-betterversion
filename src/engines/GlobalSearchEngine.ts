/**
 * GlobalSearchEngine — Full-text search across all FinPlan Pro data
 * Searches budgets, forecasts, scenarios, accounts, entities, formulas
 */

interface SearchResult {
  id: string;
  type: 'budget' | 'forecast' | 'scenario' | 'account' | 'entity' | 'formula' | 'page' | 'engine';
  title: string;
  description: string;
  path: string;
  relevance: number;
  metadata?: Record<string, unknown>;
}

interface SearchIndex {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[];
  path: string;
}

export class GlobalSearchEngine {
  private static index: SearchIndex[] = [];
  private static recentSearches: string[] = [];
  private static maxRecent = 10;

  /**
   * Build search index from stores
   */
  static buildIndex(stores: {
    budgets?: Array<{ id: string; name: string; status: string }>;
    forecasts?: Array<{ id: string; name: string; status: string }>;
    scenarios?: Array<{ id: string; name: string }>;
    entities?: Array<{ id: string; name: string; type: string }>;
  }): void {
    this.index = [];

    if (stores.budgets) {
      for (const b of stores.budgets) {
        this.index.push({
          id: b.id,
          type: 'budget',
          title: b.name,
          content: `Budget ${b.name} ${b.status}`,
          tags: ['budget', b.status],
          path: `/budgets/${b.id}`,
        });
      }
    }
    if (stores.forecasts) {
      for (const f of stores.forecasts) {
        this.index.push({
          id: f.id,
          type: 'forecast',
          title: f.name,
          content: `Forecast ${f.name} ${f.status}`,
          tags: ['forecast', f.status],
          path: `/forecasts/${f.id}`,
        });
      }
    }
    if (stores.scenarios) {
      for (const s of stores.scenarios) {
        this.index.push({
          id: s.id,
          type: 'scenario',
          title: s.name,
          content: `Scenario ${s.name}`,
          tags: ['scenario'],
          path: `/scenarios/${s.id}`,
        });
      }
    }
    if (stores.entities) {
      for (const e of stores.entities) {
        this.index.push({
          id: e.id,
          type: 'entity',
          title: e.name,
          content: `Entity ${e.name} ${e.type}`,
          tags: ['entity', e.type],
          path: `/entities/${e.id}`,
        });
      }
    }

    // Add static pages
    const pages = [
      { path: '/dashboard', title: 'Dashboard', tags: ['page', 'home'] },
      { path: '/budgets', title: 'Budgets', tags: ['page', 'budget'] },
      { path: '/forecasts', title: 'Forecasts', tags: ['page', 'forecast'] },
      { path: '/scenarios', title: 'Scenarios', tags: ['page', 'scenario'] },
      { path: '/reports/pnl', title: 'P&L Statement', tags: ['page', 'report'] },
      { path: '/reports/balance-sheet', title: 'Balance Sheet', tags: ['page', 'report'] },
      { path: '/reports/cash-flow', title: 'Cash Flow', tags: ['page', 'report'] },
      { path: '/data/import', title: 'Data Import', tags: ['page', 'import'] },
      { path: '/settings', title: 'Settings', tags: ['page', 'settings'] },
    ];
    for (const p of pages) {
      this.index.push({
        id: p.path,
        type: 'page',
        title: p.title,
        content: p.title,
        tags: p.tags,
        path: p.path,
      });
    }
  }

  /**
   * Search across all indexed data
   */
  static search(query: string, options?: { types?: string[]; limit?: number }): SearchResult[] {
    if (!query.trim()) return [];

    const limit = options?.limit ?? 20;
    const types = options?.types;
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 1);

    // Track search
    this.recentSearches = [query, ...this.recentSearches.filter((s) => s !== query)].slice(
      0,
      this.maxRecent
    );

    const results: SearchResult[] = [];

    for (const item of this.index) {
      if (types && !types.includes(item.type)) continue;

      let relevance = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();

      // Exact title match = highest relevance
      if (titleLower === queryLower) {
        relevance = 1.0;
      }
      // Title contains query
      else if (titleLower.includes(queryLower)) {
        relevance = 0.9;
      }
      // Content contains all terms
      else if (queryTerms.every((term) => contentLower.includes(term))) {
        relevance = 0.7;
      }
      // Content contains some terms
      else if (queryTerms.some((term) => contentLower.includes(term))) {
        relevance = 0.5;
      }
      // Tag match
      else if (item.tags.some((tag) => queryTerms.some((term) => tag.includes(term)))) {
        relevance = 0.4;
      }

      if (relevance > 0) {
        results.push({
          id: item.id,
          type: item.type as SearchResult['type'],
          title: item.title,
          description: item.content.slice(0, 100),
          path: item.path,
          relevance,
          metadata: { tags: item.tags },
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
  }

  /**
   * Fuzzy search for typos
   */
  static fuzzySearch(query: string): SearchResult[] {
    // Simple Levenshtein-based fuzzy matching
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const item of this.index) {
      const titleLower = item.title.toLowerCase();
      const distance = this.levenshtein(queryLower, titleLower.slice(0, queryLower.length));
      if (distance <= 2) {
        results.push({
          id: item.id,
          type: item.type as SearchResult['type'],
          title: item.title,
          description: item.content.slice(0, 100),
          path: item.path,
          relevance: 1 - distance / queryLower.length,
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  }

  /**
   * Get recent searches
   */
  static getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  /**
   * Clear recent searches
   */
  static clearRecentSearches(): void {
    this.recentSearches = [];
  }

  /**
   * Get suggestions based on partial input
   */
  static suggest(partial: string): string[] {
    if (!partial.trim()) return this.recentSearches;
    const lower = partial.toLowerCase();
    const matches = this.index
      .filter((item) => item.title.toLowerCase().includes(lower))
      .map((item) => item.title)
      .slice(0, 8);
    return [
      ...new Set([
        ...matches,
        ...this.recentSearches.filter((s) => s.toLowerCase().includes(lower)),
      ]),
    ];
  }

  private static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0]![j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b[i - 1] === a[j - 1] ? 0 : 1;
        const minVal = Math.min(
          matrix[i - 1]![j - 1]! + cost,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
        matrix[i]![j] = minVal;
      }
    }
    return matrix[b.length]![a.length]!;
  }
}
