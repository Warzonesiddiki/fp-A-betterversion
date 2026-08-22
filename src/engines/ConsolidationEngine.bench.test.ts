/**
 * Lane R23 (wave 3) — performance benchmark seed.
 *
 * Hot path: ConsolidationEngine.consolidate — the multi-entity aggregation
 * path that merges every entity's GL entries into a combined worksheet,
 * applies intercompany eliminations, minority interest and the balance
 * check. Fixture: 200 entities × 50 entries (10,000 GLEntries across all
 * five account categories), a star ownership structure (parent fully owns
 * each subsidiary), and 100 intercompany pairs. All entities are USD with
 * no FX table so the bench isolates aggregation work, not translation.
 *
 * Runs under the bench-only config: npm run test:bench
 * (vitest.bench.config.ts includes every ".bench.test.ts" file under src/
 * and the default suite excludes them). Benches measure only — no
 * assertions. Adaptive batch sizing keeps the whole run well under the 5s
 * budget; the reported number is the median of 7 samples as ops/sec.
 */
import { describe, it } from 'vitest';
import { ConsolidationEngine, type EntityData } from './ConsolidationEngine';
import type { GLEntry } from '@/types';

/** Deterministic LCG so every run measures identical work. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface CategorySpec {
  prefix: string;
  name: string;
  debit: boolean;
}

// One account per category family, realistic codes:
// 1xxx asset · 2xxx liability · 3xxx equity · 4xxx revenue · 5xxx expense.
const CATEGORY_SPECS: CategorySpec[] = [
  { prefix: '1100', name: 'Cash & Equivalents', debit: true },
  { prefix: '1500', name: 'PP&E', debit: true },
  { prefix: '2100', name: 'Accounts Payable', debit: false },
  { prefix: '3100', name: 'Retained Earnings', debit: false },
  { prefix: '4000', name: 'Product Revenue', debit: false },
  { prefix: '5000', name: 'Operating Expense', debit: true },
];

const ENTITY_COUNT = 200;
const ENTRIES_PER_ENTITY = 50;
const IC_PAIR_COUNT = 100;

function buildEntry(entityIdx: number, entryIdx: number, rand: () => number): GLEntry {
  const spec = CATEGORY_SPECS[entryIdx % CATEGORY_SPECS.length]!;
  const cents = Math.round((500 + rand() * 9500) * 100) / 100;
  // Debit-normal categories post debits; credit-normal post credits.
  const debit = spec.debit ? cents : 0;
  const credit = spec.debit ? 0 : cents;
  return {
    id: `e${entityIdx}-j${entryIdx}`,
    accountId: `${spec.prefix}-${entityIdx}`,
    accountCode: spec.prefix,
    accountName: spec.name,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit,
    credit,
    netChange: spec.debit ? cents : -cents,
    amount: spec.debit ? cents : -cents,
    date: '2026-01-15',
    description: `${spec.name} posting`,
    reference: `REF-${entityIdx}-${entryIdx}`,
    entityId: `entity-${String(entityIdx).padStart(3, '0')}`,
    currency: 'USD',
  };
}

function buildFixture(): {
  entities: EntityData[];
  ownerships: Parameters<typeof ConsolidationEngine.consolidate>[1];
  icPairs: Parameters<typeof ConsolidationEngine.consolidate>[2];
} {
  const rand = lcg(20260823);
  const entities: EntityData[] = [];
  for (let i = 0; i < ENTITY_COUNT; i++) {
    const entries: GLEntry[] = [];
    for (let j = 0; j < ENTRIES_PER_ENTITY; j++) {
      entries.push(buildEntry(i, j, rand));
    }
    entities.push({
      entityId: `entity-${String(i).padStart(3, '0')}`,
      entityName: `Subsidiary ${i}`,
      currency: 'USD',
      entries,
    });
  }
  // Star hierarchy: entity-000 fully owns every other entity.
  const ownerships = entities.slice(1).map((child) => ({
    parentId: 'entity-000',
    childId: child.entityId,
    ownershipPct: 100,
    method: 'full' as const,
  }));
  // Reciprocal receivable/payable pairs between sibling subsidiaries.
  const icPairs = Array.from({ length: IC_PAIR_COUNT }, (_, k) => ({
    fromEntityId: `entity-${String(1 + (k % (ENTITY_COUNT - 1))).padStart(3, '0')}`,
    toEntityId: `entity-${String(1 + ((k + 7) % (ENTITY_COUNT - 1))).padStart(3, '0')}`,
    accountCode: '1200',
    amount: Math.round((100 + rand() * 900) * 100) / 100,
    type: 'receivable' as const,
  }));
  return { entities, ownerships, icPairs };
}

/** Adaptive timing harness — identical contract to the other R23 benches.
 *  Warm up, calibrate a batch that takes ≥60ms, then take as many samples
 *  as fit a 2.5s measuring budget (3–7) and log the median as ops/sec. */
function measureMedian(name: string, op: () => void): void {
  op();
  let batch = 1;
  let calibratedMs = 60;
  for (;;) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) op();
    const dt = performance.now() - t0;
    if (dt >= 60) {
      calibratedMs = dt;
      break;
    }
    const next = Math.min(8192, Math.ceil((60 / Math.max(dt, 0.05)) * batch));
    if (next <= batch) break;
    batch = next;
  }
  // Budget guard: expensive ops (e.g., full consolidations) drop to 3
  // samples so the whole bench stays inside its <5s run budget.
  const samples = Math.max(3, Math.min(7, Math.floor(2500 / Math.max(calibratedMs, 1))));
  const durations: number[] = [];
  for (let s = 0; s < samples; s++) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) op();
    durations.push(performance.now() - t0);
  }
  durations.sort((a, b) => a - b);
  const medianMs = durations[Math.floor(samples / 2)]!;
  const perOpMs = medianMs / batch;
  console.log(
    `[bench] ${name}: median ${perOpMs.toFixed(4)} ms/op · ${Math.round(1000 / perOpMs).toLocaleString('en-US')} ops/s · batch=${batch} · samples=${samples} · measured=${durations.reduce((a, b) => a + b, 0).toFixed(0)}ms`
  );
}

describe('bench: ConsolidationEngine.consolidate (200 entities × 50 entries)', () => {
  it('measures multi-entity consolidation ops/sec', () => {
    const { entities, ownerships, icPairs } = buildFixture();
    measureMedian('ConsolidationEngine.consolidate(200×50)', () => {
      ConsolidationEngine.consolidate(entities, ownerships, icPairs);
    });
  });
});
