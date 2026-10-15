import { describe, expect, it } from 'vitest';
import { PeriodCloseStateMachine } from '@/engines/PeriodCloseStateMachine';
import { getGLPeriodWriteIssues, type GLPeriodAuthority } from './glPeriodWriteGuard';
import type { GLEntry } from '@/types';

function authority(
  state: 'open' | 'soft-close' | 'hard-close' | 'locked' = 'locked'
): GLPeriodAuthority {
  return {
    entries: { retail: { ...PeriodCloseStateMachine.createEntry('retail', 'E1'), state } },
    checklists: {
      retail: {
        fiscalScope: { startDate: '2025-12-29', endDate: '2026-01-25', isAdjustingPeriod: false },
      },
    },
  };
}
const row = (date = '2026-01-15', extra: Partial<GLEntry> = {}): Partial<GLEntry> => ({
  postDate: date,
  ...extra,
});

describe('GL fiscal write policy (DEC-008)', () => {
  it('fails closed before hydration, including when in-memory authority is empty', () => {
    expect(getGLPeriodWriteIssues([row()], { entries: {}, checklists: {} }, false)[0]?.index).toBe(
      -1
    );
    expect(getGLPeriodWriteIssues([], authority(), false)).toEqual([]);
    expect(getGLPeriodWriteIssues([row()], { entries: {}, checklists: {} }, true)).toEqual([]);
  });
  it.each(['soft-close', 'hard-close', 'locked'] as const)(
    'rejects %s without a privileged bypass',
    (state) => {
      expect(getGLPeriodWriteIssues([row()], authority(state), true)[0]?.reason).toContain(state);
    }
  );
  it('allows open periods, dates outside the closed range and other known entities', () => {
    expect(getGLPeriodWriteIssues([row()], authority('open'), true)).toEqual([]);
    expect(getGLPeriodWriteIssues([row('2026-01-26')], authority(), true)).toEqual([]);
    expect(
      getGLPeriodWriteIssues([row('2026-01-15', { entityId: 'E2' })], authority(), true)
    ).toEqual([]);
  });
  it.each(['2025-12-29', '2026-01-25'])(
    'uses inclusive actual fiscal boundaries (%s), not calendar months',
    (date) => {
      expect(getGLPeriodWriteIssues([row(date)], authority(), true)).toHaveLength(1);
    }
  );
  it('unknown entity and legacy entity display labels cannot evade a lock', () => {
    expect(
      getGLPeriodWriteIssues([row('2026-01-15', { entity: 'Company Name' })], authority(), true)
    ).toHaveLength(1);
  });
  it('returns the input index of every affected row', () => {
    expect(
      getGLPeriodWriteIssues([row('2026-01-26'), row(), row()], authority(), true).map(
        (i) => i.index
      )
    ).toEqual([1, 2]);
  });
  it('rejects legacy missing scopes until calendar backfill instead of guessing a month', () => {
    expect(
      getGLPeriodWriteIssues([row()], { ...authority(), checklists: {} }, true)[0]?.reason
    ).toMatch(/unavailable/);
  });
  it('rejects invalid persisted scopes', () => {
    const a = authority();
    const bad: GLPeriodAuthority = {
      ...a,
      checklists: {
        retail: {
          fiscalScope: { startDate: '2026-02-30', endDate: '2026-03-01', isAdjustingPeriod: false },
        },
      },
    };
    expect(getGLPeriodWriteIssues([row()], bad, true)[0]?.reason).toMatch(/invalid/);
  });
  it('rejects overlapping adjusting periods even if both periods are open', () => {
    const a = authority('open');
    const overlap: GLPeriodAuthority = {
      entries: {
        ...a.entries,
        adjustment: PeriodCloseStateMachine.createEntry('adjustment', 'E1'),
      },
      checklists: {
        ...a.checklists,
        adjustment: {
          fiscalScope: { startDate: '2026-01-25', endDate: '2026-01-25', isAdjustingPeriod: true },
        },
      },
    };
    expect(getGLPeriodWriteIssues([row('2026-01-25')], overlap, true)[0]?.reason).toMatch(
      /multiple/
    );
  });
  it.each([
    row('bad'),
    row('2026-01-26', { date: '2026-01-15' }),
    row('2026-01-26', { period: '2025-12' }),
    row('2026-01-26', { fiscalPeriod: 'retail' }),
  ])('rejects unresolvable or conflicting posting metadata: %j', (r) => {
    expect(getGLPeriodWriteIssues([r], authority(), true)).toHaveLength(1);
  });
  it('is deterministic and does not mutate its inputs', () => {
    const a = authority();
    const rows = [row()];
    const before = JSON.stringify([rows, a]);
    expect(getGLPeriodWriteIssues(rows, a, true)).toEqual(getGLPeriodWriteIssues(rows, a, true));
    expect(JSON.stringify([rows, a])).toBe(before);
  });
});
