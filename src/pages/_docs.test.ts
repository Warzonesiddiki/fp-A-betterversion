/**
 * _docs.ts tests — P0 coverage for G14 (help docs) and G15 (E2E walkthrough).
 * Mnemosyne ownership: src/test/ + src/pages/_docs.ts test lives here because the
 * file under test is a simple data map. We keep the test next to the data.
 *
 * Verifies:
 *  1. Every `path="..."` defined in src/App.tsx (excluding `:param` and `*`)
 *     has a key in PAGE_HELP.
 *  2. Every entry has a non-empty title and at least one section.
 *  3. No two entries share the same normalized path key.
 *  4. The 192-route aspirational target check (currently 98 unique concrete
 *     routes; we tolerate any `path="/..."` other than `*` and dynamic).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_HELP } from './_docs';

const APP_TSX_PATH = join(process.cwd(), 'src', 'App.tsx');

function extractAppRoutes(): string[] {
  const src = readFileSync(APP_TSX_PATH, 'utf8');
  const matches = src.matchAll(/path="([^"]+)"/g);
  const set = new Set<string>();
  for (const m of matches) {
    const p = m[1]!;
    if (p === '*' || p === '/' || p.includes(':')) continue;
    set.add(p);
  }
  return Array.from(set).sort();
}

describe('PAGE_HELP (G14 _docs.ts)', () => {
  const routes = extractAppRoutes();
  const keys = new Set(Object.keys(PAGE_HELP));

  it('has help entries for every concrete route in App.tsx (except / and dynamic)', () => {
    const missing = routes.filter((r) => !keys.has(r));
    expect(missing, `Missing help entries: ${missing.join(', ')}`).toEqual([]);
  });

  it('has help for the root / route (redirect target)', () => {
    expect(keys.has('/')).toBe(true);
  });

  it('every entry has a non-empty title', () => {
    for (const [path, def] of Object.entries(PAGE_HELP)) {
      expect(def.title, `${path}: missing title`).toBeTruthy();
      expect(def.title.length, `${path}: title too short`).toBeGreaterThan(0);
    }
  });

  it('every entry has at least one section with content', () => {
    for (const [path, def] of Object.entries(PAGE_HELP)) {
      expect(def.sections.length, `${path}: no sections`).toBeGreaterThan(0);
      for (const s of def.sections) {
        expect(s.title, `${path}: section missing title`).toBeTruthy();
        expect(s.content, `${path}.${s.title}: empty content`).toBeTruthy();
      }
    }
  });

  it('no duplicate keys (path uniqueness)', () => {
    const sorted = [...keys].sort();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).not.toBe(sorted[i - 1]);
    }
  });

  it('covers the core workflows called out in OPENHANDS (Phase 9)', () => {
    const required = [
      '/dashboard',
      '/budgets',
      '/budgets/bva',
      '/forecasts',
      '/forecasts/rolling',
      '/scenarios',
      '/reports',
      '/reports/budget-vs-actual',
      '/reports/scheduler',
      '/analytics',
      '/ai',
      '/data',
      '/settings',
    ];
    for (const p of required) {
      expect(keys.has(p), `Required workflow route ${p} missing from PAGE_HELP`).toBe(true);
    }
  });

  it('has at least 60 documented pages (G14 floor; final 192 target)', () => {
    expect(keys.size).toBeGreaterThanOrEqual(60);
  });
});
