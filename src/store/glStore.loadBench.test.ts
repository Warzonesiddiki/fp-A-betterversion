import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useGLStore } from './glStore';
import { sumMoney, toCents } from '@/utils/money';
import type { GLEntry } from '@/types/gl';

/**
 * T3 (plan Phase 6): the 100k-row GL load number. Loads 100,000 entries
 * through the real store path and proves (a) they all land, (b) the
 * period debit total equals an independent integer-cents oracle, and
 * (c) load + totalling stay inside generous interactive budgets on
 * shared hardware.
 */
describe('glStore — 100k-row load bench (T3)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'bench-user',
        email: 'bench@finplan.local',
        firstName: 'Bench',
        lastName: 'User',
        avatarUrl: null,
        role: 'Admin',
        departmentId: 'finance',
        departmentName: 'Finance',
        entityId: 'entity-001',
        status: 'Active',
        lastLoginAt: '2026-10-15T00:00:00.000Z',
        mfaEnabled: false,
        permissions: [
          'import:create',
          'import:read',
          'import:update',
          'import:delete',
          'ui:update',
        ],
      },
      isAuthenticated: true,
    });
    useGLStore.setState({
      entries: [],
      importStatus: 'idle',
      importProgress: 0,
      lastImportEntryIds: [],
    });
  });

  it('loads 100,000 entries with cent-exact totals inside the budget', () => {
    const entries: GLEntry[] = [];
    let oracleCents = 0; // independent oracle: plain integer cents
    for (let i = 0; i < 100_000; i += 1) {
      const day = String((i % 28) + 1).padStart(2, '0');
      const cents = ((i % 97) + 1) * 100 + (i % 3);
      oracleCents += cents;
      entries.push({
        id: `bench-${i}`,
        date: `2026-01-${day}`,
        postDate: `2026-01-${day}`,
        accountCode: `4${String(i % 50).padStart(3, '0')}`,
        accountName: 'Revenue',
        journalId: `J-${i}`,
        debit: cents / 100,
        credit: 0,
        amount: cents / 100,
      } as GLEntry);
    }

    const started = performance.now();
    useGLStore.getState().setEntries(entries);
    const loadMs = performance.now() - started;

    const state = useGLStore.getState();
    expect(state.entries).toHaveLength(100_000);

    const totalsStarted = performance.now();
    const inPeriod = state.entries.filter(
      (e) => (e.postDate ?? e.date) >= '2026-01-01' && (e.postDate ?? e.date) <= '2026-01-31'
    );
    const totalCents = toCents(sumMoney(inPeriod.map((e) => e.debit)));
    const totalsMs = performance.now() - totalsStarted;

    expect(inPeriod).toHaveLength(100_000);
    expect(totalCents).toBe(oracleCents);

    // The measured T3 number, printed every run (measured-or-not-stated).
    console.info(
      `[T3 bench] setEntries(100k)=${loadMs.toFixed(0)}ms totals=${totalsMs.toFixed(0)}ms`
    );
    // Generous ceilings for shared CI hardware; measured locally far below.
    expect(loadMs).toBeLessThan(10_000);
    expect(totalsMs).toBeLessThan(5_000);
  }, 60_000);
});
