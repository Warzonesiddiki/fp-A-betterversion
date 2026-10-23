// =============================================================================
// PERIOD LOCK GUARD (W6-P0-11 — hard-lock freeze enforcement)
// -----------------------------------------------------------------------------
// periodCloseStore.propagateLock stamps isLocked onto existing lines when a
// period reaches 'locked', but the budget line-item mutation chokepoints in
// budgetStore (line edits, bulk replacement, header context and undo/redo) must consult the
// close state so edits/new writes cannot slip into a hard-locked period.
//
// This module centralizes that check: it maps a BudgetLineItem to a locked
// period (direct periodId match OR month + budget-fiscal-year match, mirroring
// propagateLock's matching) and rejects mutations with a typed PeriodLockedError
// BEFORE any store mutation happens.
//
// Deliberate exemption: updates that ONLY set { isLocked: true } stay allowed —
// that exact write shape is how propagateLock freezes lines after the entry has
// already flipped to 'locked'; blocking it would break the lock workflow itself.
//
// Import cycle note: budgetStore ↔ periodLockGuard/periodCloseStore form a
// module cycle; both sides only touch the other store's getState() inside
// function bodies at call time, never during module evaluation, so the cycle
// is safe under ESM/Vite.
// =============================================================================

import type { Budget, BudgetLineItem } from '@/types';
import { useBudgetStore } from './budgetStore';
import { usePeriodCloseStore } from './periodCloseStore';
import { useUIStore } from './uiStore';

/** Typed rejection for any mutation targeting a hard-locked ('locked') period. */
export class PeriodLockedError extends Error {
  readonly periodId: string;

  constructor(periodId: string, message?: string) {
    super(message ?? `Period ${periodId} is locked: its budget line items are frozen.`);
    this.name = 'PeriodLockedError';
    this.periodId = periodId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface LockedPeriodInfo {
  readonly periodId: string;
  readonly fiscalYear: number | null;
}

function periodNumberOf(periodId: string): number {
  return Number(periodId.replace(/^P/, ''));
}

/** Currently hard-locked periods with their fiscal year (from the close checklist plan). */
export function collectLockedPeriods(): readonly LockedPeriodInfo[] {
  const pc = usePeriodCloseStore.getState();
  const result: LockedPeriodInfo[] = [];
  for (const periodId of Object.keys(pc.entries)) {
    if (pc.entries[periodId]?.state !== 'locked') continue;
    result.push({ periodId, fiscalYear: pc.checklists[periodId]?.plan.fiscalYear ?? null });
  }
  return result;
}

/** The locked period this line belongs to (periodId match or month+fiscal-year match), or null. */
export function findLockedPeriodForItem(
  item: BudgetLineItem,
  budgets: readonly Budget[] = useBudgetStore.getState().budgets
): string | null {
  for (const lp of collectLockedPeriods()) {
    if (item.periodId === lp.periodId) return lp.periodId;
    const periodNumber = periodNumberOf(lp.periodId);
    if (lp.fiscalYear !== null && Number.isFinite(periodNumber) && item.month === periodNumber) {
      if (
        budgets.some((budget) => budget.id === item.budgetId && budget.fiscalYear === lp.fiscalYear)
      )
        return lp.periodId;
    }
  }
  return null;
}

/**
 * True when `updates` only re-asserts the freeze marker ({ isLocked: true }).
 * This is the write shape used by periodCloseStore.propagateLock and must pass
 * even though the period entry already reads 'locked'.
 */
export function isFreezeMarkerOnly(updates: Partial<BudgetLineItem>): boolean {
  const keys = Object.keys(updates);
  return keys.length > 0 && keys.every((k) => k === 'isLocked') && updates.isLocked === true;
}

function rejectLocked(periodId: string): never {
  const error = new PeriodLockedError(periodId);
  // Surface through the app toast mechanism; best-effort so a toast/RBAC
  // failure can never mask the typed rejection itself.
  try {
    useUIStore.getState().addToast({
      type: 'error',
      title: 'Period Locked',
      message: error.message,
    });
  } catch {
    // Toast path failed — the typed error below is the contract.
  }
  throw error;
}

/**
 * Chokepoint check for updateLineItem: throws PeriodLockedError (with an error
 * toast) when applying `updates` to `existing` would mutate a locked period.
 * Pure guard — performs no mutation itself, must run before set().
 */
export function assertUpdateAllowed(
  existing: BudgetLineItem,
  updates: Partial<BudgetLineItem>
): void {
  if (isFreezeMarkerOnly(updates)) return;
  for (const item of [existing, { ...existing, ...updates }]) {
    const lockedPeriodId = findLockedPeriodForItem(item);
    if (lockedPeriodId !== null) rejectLocked(lockedPeriodId);
  }
}

function lineFieldsDiffer(a: BudgetLineItem | undefined, b: BudgetLineItem | undefined): boolean {
  if (!a || !b) return true; // inserted or deleted by replay
  const ra = a as unknown as Record<string, unknown>;
  const rb = b as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (ra[key] !== rb[key]) return true;
  }
  return false;
}

/**
 * Chokepoint check for undo/redo snapshot replay: throws PeriodLockedError when
 * replaying `target` over `current` would edit, insert, or delete any line that
 * belongs to a hard-locked period. Lines whose values are identical pass.
 */
export function assertSnapshotReplayAllowed(
  current: readonly BudgetLineItem[],
  target: readonly BudgetLineItem[]
): void {
  const byId = new Map<string, { cur?: BudgetLineItem; tgt?: BudgetLineItem }>();
  for (const line of current) {
    if (byId.has(line.id)) throw new Error(`Duplicate current budget line ID: ${line.id}`);
    byId.set(line.id, { cur: line });
  }
  const targetIds = new Set<string>();
  for (const line of target) {
    if (targetIds.has(line.id)) throw new Error(`Duplicate target budget line ID: ${line.id}`);
    targetIds.add(line.id);
    const entry = byId.get(line.id);
    if (entry) entry.tgt = line;
    else byId.set(line.id, { tgt: line });
  }
  for (const { cur, tgt } of byId.values()) {
    if (!lineFieldsDiffer(cur, tgt)) continue;
    for (const item of [cur, tgt]) {
      if (!item) continue;
      const lockedPeriodId = findLockedPeriodForItem(item);
      if (lockedPeriodId !== null) rejectLocked(lockedPeriodId);
    }
  }
}

/**
 * A header's fiscal year is part of a line's close-period identity. Check both
 * collections before replacing/removing headers so callers cannot detach a
 * closed line or relabel its fiscal year to evade subsequent line guards.
 * Strict field equality is an immutability check, not rounded monetary math.
 */
export function assertBudgetHeaderChangesAllowed(
  current: readonly Budget[],
  target: readonly Budget[],
  lines: readonly BudgetLineItem[]
): void {
  for (const line of lines) {
    const previous = current.find((budget) => budget.id === line.budgetId);
    const next = target.find((budget) => budget.id === line.budgetId);
    if (!previous && !next) continue;
    if (previous && next) {
      const keys = Object.keys({ ...previous, ...next }) as (keyof Budget)[];
      if (keys.every((key) => JSON.stringify(previous[key]) === JSON.stringify(next[key])))
        continue;
    }
    const lockedPeriodId =
      findLockedPeriodForItem(line, current) ?? findLockedPeriodForItem(line, target);
    if (lockedPeriodId !== null) rejectLocked(lockedPeriodId);
  }
}
