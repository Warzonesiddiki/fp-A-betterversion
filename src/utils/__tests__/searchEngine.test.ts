import { describe, it, expect, beforeEach } from 'vitest';
import { search, registerSearchItems, registerPageSearchItems } from '../searchEngine';

describe('searchEngine', () => {
  beforeEach(() => {
    registerPageSearchItems();
  });

  it('search returns results for matching query', () => {
    const results = search('budget');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.toLowerCase().includes('budget'))).toBe(true);
  });

  it('search returns empty for empty query', () => {
    expect(search('')).toEqual([]);
    expect(search('   ')).toEqual([]);
  });

  it('search respects limit', () => {
    const results = search('budget', 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('search prioritizes exact title match', () => {
    const results = search('Dashboard');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Dashboard');
    expect(results[0].score).toBeGreaterThanOrEqual(100);
  });

  it('registerSearchItems adds custom items', () => {
    const custom = [
      {
        id: 'custom-1',
        type: 'budget' as const,
        title: 'Custom Budget',
        path: '/custom',
        keywords: ['test'],
      },
    ];
    registerSearchItems(custom);
    const results = search('Custom');
    expect(results.some((r) => r.id === 'custom-1')).toBe(true);
  });

  it('search handles multi-word queries', () => {
    const results = search('Cash Flow');
    expect(results.some((r) => r.title.includes('Cash Flow'))).toBe(true);
  });

  it('search returns sorted by score descending', () => {
    const results = search('report');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});
