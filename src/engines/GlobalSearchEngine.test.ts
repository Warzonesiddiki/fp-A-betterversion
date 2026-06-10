/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalSearchEngine } from './GlobalSearchEngine';

describe('GlobalSearchEngine', () => {
  beforeEach(() => {
    GlobalSearchEngine.clearRecentSearches();
  });

  describe('search', () => {
    it('returns empty for empty query', () => {
      const results = GlobalSearchEngine.search('');
      expect(results).toEqual([]);
    });

    it('finds entities by title', () => {
      GlobalSearchEngine.buildIndex({
        budgets: [{ id: '1', name: 'Q1 Budget', status: 'active' }],
      });
      const results = GlobalSearchEngine.search('Q1');
      expect(results.length).toBeGreaterThan(0);
      expect(results![0]!.title).toContain('Q1');
    });

    it('returns results sorted by relevance', () => {
      GlobalSearchEngine.buildIndex({
        budgets: [
          { id: '1', name: 'Revenue Budget', status: 'active' },
          { id: '2', name: 'Expense Budget', status: 'active' },
        ],
      });
      const results = GlobalSearchEngine.search('Revenue');
      expect(results![0]!.title).toBe('Revenue Budget');
    });

    it('limits results', () => {
      GlobalSearchEngine.buildIndex({
        budgets: Array.from({ length: 20 }, (_, i) => ({
          id: String(i),
          name: `Budget ${i}`,
          status: 'active',
        })),
      });
      const results = GlobalSearchEngine.search('Budget', { limit: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('recent searches', () => {
    it('tracks recent searches', () => {
      GlobalSearchEngine.search('test query');
      const recent = GlobalSearchEngine.getRecentSearches();
      expect(recent).toContain('test query');
    });

    it('clears recent searches', () => {
      GlobalSearchEngine.search('test');
      GlobalSearchEngine.clearRecentSearches();
      expect(GlobalSearchEngine.getRecentSearches()).toEqual([]);
    });

    it('limits recent searches to 10', () => {
      for (let i = 0; i < 15; i++) {
        GlobalSearchEngine.search(`query ${i}`);
      }
      expect(GlobalSearchEngine.getRecentSearches().length).toBeLessThanOrEqual(10);
    });
  });

  describe('suggest', () => {
    it('returns suggestions for partial input', () => {
      GlobalSearchEngine.buildIndex({
        budgets: [{ id: '1', name: 'Revenue Budget', status: 'active' }],
      });
      const suggestions = GlobalSearchEngine.suggest('Rev');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});
