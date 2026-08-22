import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import pt from './locales/pt.json';

/**
 * W-A11Y / release-gate parity sweep (lane R21).
 *
 * Pins two invariants:
 *  1. Every translation key statically referenced in production source
 *     (`t('dotted.key')`) resolves to a string in the default (en) resource,
 *     so a raw key can never render even before fallback kicks in.
 *  2. Every locale carries EVERY en key (structural parity), so i18next's
 *     fallbackLng never has to bridge a gap at runtime.
 *
 * The one dynamic template family in the codebase (`t(\`months.${m}\`)`,
 * OnboardingWizard) cannot be extracted statically and is pinned explicitly.
 */

type Resource = Record<string, unknown>;

const RESOURCES: Record<string, Resource> = { en, es, fr, de, ja, zh, ar, pt };

function flattenLeaves(
  node: unknown,
  prefix = '',
  acc: Set<string> = new Set<string>()
): Set<string> {
  if (node !== null && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Resource)) {
      flattenLeaves(v, prefix ? `${prefix}.${k}` : k, acc);
    }
  } else if (prefix) {
    acc.add(prefix);
  }
  return acc;
}

function resolveKey(resource: Resource, key: string): unknown {
  let current: unknown = resource;
  for (const segment of key.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Resource)[segment];
  }
  return current;
}

// Matches t('key') / t("key"), including across line breaks. Word-boundary
// anchor keeps method names like split( / parseInt( out of the results.
const USAGE_PATTERN = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g;
// A plausible i18n key: dot-separated identifier segments (skips stray
// one-word arguments that are not translation lookups).
const KEY_SHAPE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_-]+)+$/;

function collectProductionFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // src/i18n holds the resources and this test itself; skip it.
      if (entry === 'i18n') continue;
      collectProductionFiles(full, acc);
    } else if (
      /\.(tsx?|jsx?)$/.test(entry) &&
      !/\.test\.|\.spec\./.test(entry) &&
      !entry.endsWith('.d.ts')
    ) {
      acc.push(full);
    }
  }
  return acc;
}

function extractUsedKeys(): string[] {
  const used = new Set<string>();
  for (const file of collectProductionFiles(join(process.cwd(), 'src'))) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(USAGE_PATTERN)) {
      const key = match[2];
      if (key && KEY_SHAPE.test(key)) used.add(key);
    }
  }
  return [...used];
}

describe('i18n parity release gate', () => {
  it('every statically referenced t() key resolves in the en resource', () => {
    const usedKeys = extractUsedKeys();
    // Guard against silent scanner regression: the real inventory is ~45 keys.
    expect(usedKeys.length).toBeGreaterThan(30);
    const missing = usedKeys.filter((key) => typeof resolveKey(en, key) !== 'string');
    expect(missing).toEqual([]);
  });

  it('the dynamic months.* template family is covered in en', () => {
    const months = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];
    for (const month of months) {
      expect(typeof resolveKey(en, `months.${month}`)).toBe('string');
    }
  });

  it('en itself has no empty leaf values', () => {
    for (const key of flattenLeaves(en)) {
      const value = resolveKey(en, key);
      expect(typeof value === 'string' && (value as string).length > 0, `${key} is empty`).toBe(
        true
      );
    }
  });

  it.each(Object.keys(RESOURCES).filter((locale) => locale !== 'en'))(
    '%s carries every en key (announce-once for fallback: never needed)',
    (locale: string) => {
      const enKeys = flattenLeaves(en);
      const localeKeys = flattenLeaves(RESOURCES[locale]);
      const missing = [...enKeys].filter((key) => !localeKeys.has(key));
      expect(missing).toEqual([]);
    }
  );

  it('all locale key sets are exactly identical to en (no drift either direction)', () => {
    const enKeys = [...flattenLeaves(en)].sort();
    for (const locale of Object.keys(RESOURCES).filter((name) => name !== 'en')) {
      const localeKeys = [...flattenLeaves(RESOURCES[locale])].sort();
      expect(localeKeys).toEqual(enKeys);
    }
  });
});
