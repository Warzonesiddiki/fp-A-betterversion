/**
 * N3 — forecast writer authorization: denial, permission-pinning and mutation evidence.
 *
 * WHY THIS EXISTS
 * ---------------
 * `src/store/forecastStore.ts` wraps six financial writers in
 * `enforce(Permissions.*)` — `setForecasts`, `createForecast`, `updateForecast`,
 * `deleteForecast`, `setDrivers`, `updateDriver`. Before this suite the denial
 * evidence was one line in `rbacNegativeAuthorization.test.ts` covering
 * `setForecasts` only. A store whose guard was deleted would still have passed
 * every remaining forecast test, which is the same vacuous-gate class this repo
 * has shipped before (the `ratchet-docs-check` Windows path bug).
 *
 * Three things are proven per writer:
 *   1. DENIAL for a signed-out session and for an under-privileged real role
 *      (Viewer = `forecast:read` only).
 *   2. PERMISSION PINNING — an Admin carrying every grant EXCEPT the one the
 *      writer claims must be denied, and the error must name that permission.
 *      This distinguishes "something threw" from "the right guard ran".
 *   3. NO SIDE EFFECT — store state AND undo history are byte-identical after a
 *      denial. `enforce` checks before invoking the handler, so a denial must not
 *      capture an undo snapshot either; a guard that throws *after* mutating
 *      would still be data corruption.
 *
 * A real-role asymmetry is pinned deliberately: Analyst holds `forecast:create`
 * and `forecast:update` but NOT `forecast:delete`, so Analyst may create and
 * edit yet must be refused a delete. Only Admin may delete.
 *
 * MUTATION-VERIFIED (2026-10-21), measured, not estimated — the first attempt at
 * this paragraph guessed "two cases" and the mutant proved it wrong:
 *   - `updateForecast` guard swapped FORECAST_UPDATE -> FORECAST_READ:
 *     **3 failed / 4 passed**. The three are `signedOut.updateForecast`,
 *     `viewer.updateForecast`, `noUpdate.updateForecast`. Note the first still
 *     *denied* (a signed-out user holds no grants) and failed only because the
 *     error named `forecast:read` — which is the point of asserting the
 *     permission name: a swapped guard is caught even when denial still happens.
 *   - `deleteForecast` guard swapped FORECAST_DELETE -> FORECAST_READ:
 *     **4 failed / 3 passed** (signed-out naming, Viewer, Admin-without-delete,
 *     and the Analyst real-role case, since Analyst holds `forecast:read`).
 * Both times `src/store/forecastStore.ts` was restored and `git diff` was empty.
 * No production source was changed by this suite.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useForecastStore } from './forecastStore';
import { actAs, actAsRoleWithout, signOut, expectPermissionDenied } from '@/test/rbacFixtures';
import type { Forecast, ForecastDriver } from '@/types';

const forecastFixture = (overrides: Partial<Forecast> = {}): Forecast => ({
  id: 'fcst-auth-probe',
  name: 'Authorization probe',
  description: 'N3 denial probe',
  type: 'Rolling',
  baseBudgetId: 'budget-auth-probe',
  baseBudgetName: 'Authorization probe budget',
  status: 'Draft',
  rollingWindowMonths: 12,
  confidenceLevel: 'Medium',
  createdBy: 'original-author',
  createdByName: 'Original author',
  lastUpdated: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const driverFixture = (overrides: Partial<ForecastDriver> = {}): ForecastDriver => ({
  id: 'drv-auth-probe',
  name: 'Authorization probe driver',
  description: 'N3 denial probe',
  driverType: 'Headcount',
  baseValue: 100,
  currentValue: 110,
  ...overrides,
});

/** Snapshot the writable financial state so a denial can be proven inert. */
const snapshot = () =>
  JSON.stringify({
    forecasts: useForecastStore.getState().forecasts,
    drivers: useForecastStore.getState().drivers,
    selectedForecastId: useForecastStore.getState().selectedForecastId,
  });

beforeEach(() => {
  useForecastStore.setState({
    forecasts: [forecastFixture()],
    drivers: [driverFixture()],
    selectedForecastId: 'fcst-auth-probe',
  });
});

afterEach(() => {
  signOut();
});

/**
 * A denied writer must throw, must name the permission it required, and must
 * leave financial state plus undo history untouched.
 */
function expectDenied(run: () => unknown, permission: string, label: string): void {
  const before = snapshot();
  const historyBefore = useForecastStore.getState().getHistoryLength();

  const error = expectPermissionDenied(run);

  expect(error.message, `${label}: error must name ${permission}`).toContain(permission);
  expect(snapshot(), `${label}: state must be unchanged after denial`).toBe(before);
  expect(
    useForecastStore.getState().getHistoryLength(),
    `${label}: denial must not capture an undo snapshot`
  ).toBe(historyBefore);
}

describe('forecastStore — signed-out sessions cannot write', () => {
  it('denies every financial writer while signed out', () => {
    signOut();
    expectDenied(
      () => useForecastStore.getState().setForecasts([]),
      'forecast:update',
      'signedOut.setForecasts'
    );
    expectDenied(
      () =>
        useForecastStore.getState().createForecast(forecastFixture({ id: 'new', name: 'Denied' })),
      'forecast:create',
      'signedOut.createForecast'
    );
    expectDenied(
      () => useForecastStore.getState().updateForecast('fcst-auth-probe', { name: 'Hijacked' }),
      'forecast:update',
      'signedOut.updateForecast'
    );
    expectDenied(
      () => useForecastStore.getState().deleteForecast('fcst-auth-probe'),
      'forecast:delete',
      'signedOut.deleteForecast'
    );
    expectDenied(
      () => useForecastStore.getState().setDrivers([]),
      'forecast:update',
      'signedOut.setDrivers'
    );
    expectDenied(
      () => useForecastStore.getState().updateDriver('drv-auth-probe', { currentValue: 999 }),
      'forecast:update',
      'signedOut.updateDriver'
    );
  });
});

describe('forecastStore — Viewer is read-only', () => {
  it('denies every financial writer for Viewer', () => {
    actAs('Viewer');
    expectDenied(
      () => useForecastStore.getState().setForecasts([]),
      'forecast:update',
      'viewer.setForecasts'
    );
    expectDenied(
      () =>
        useForecastStore.getState().createForecast(forecastFixture({ id: 'new2', name: 'Denied' })),
      'forecast:create',
      'viewer.createForecast'
    );
    expectDenied(
      () => useForecastStore.getState().updateForecast('fcst-auth-probe', { name: 'Hijacked' }),
      'forecast:update',
      'viewer.updateForecast'
    );
    expectDenied(
      () => useForecastStore.getState().deleteForecast('fcst-auth-probe'),
      'forecast:delete',
      'viewer.deleteForecast'
    );
    expectDenied(
      () => useForecastStore.getState().setDrivers([]),
      'forecast:update',
      'viewer.setDrivers'
    );
    expectDenied(
      () => useForecastStore.getState().updateDriver('drv-auth-probe', { currentValue: 999 }),
      'forecast:update',
      'viewer.updateDriver'
    );
  });
});

describe('forecastStore — each writer pins its own permission', () => {
  // An Admin that holds every grant EXCEPT one: only the writer(s) claiming that
  // permission may fail, which proves the specific guard rather than a generic deny.
  it('an Admin without forecast:update cannot set, update or drive-write', () => {
    actAsRoleWithout('Admin', 'forecast:update');
    expectDenied(
      () => useForecastStore.getState().setForecasts([]),
      'forecast:update',
      'noUpdate.setForecasts'
    );
    expectDenied(
      () => useForecastStore.getState().updateForecast('fcst-auth-probe', { name: 'Hijacked' }),
      'forecast:update',
      'noUpdate.updateForecast'
    );
    expectDenied(
      () => useForecastStore.getState().setDrivers([]),
      'forecast:update',
      'noUpdate.setDrivers'
    );
    expectDenied(
      () => useForecastStore.getState().updateDriver('drv-auth-probe', { currentValue: 999 }),
      'forecast:update',
      'noUpdate.updateDriver'
    );
  });

  it('an Admin without forecast:create cannot create, but can still update', () => {
    actAsRoleWithout('Admin', 'forecast:create');
    expectDenied(
      () =>
        useForecastStore.getState().createForecast(forecastFixture({ id: 'c1', name: 'Denied' })),
      'forecast:create',
      'noCreate.createForecast'
    );
    // Control: a different grant is untouched, so the guard is not blanket-deny.
    expect(() =>
      useForecastStore.getState().updateForecast('fcst-auth-probe', { name: 'Allowed edit' })
    ).not.toThrow();
  });

  it('an Admin without forecast:delete cannot delete, but can still create', () => {
    actAsRoleWithout('Admin', 'forecast:delete');
    expectDenied(
      () => useForecastStore.getState().deleteForecast('fcst-auth-probe'),
      'forecast:delete',
      'noDelete.deleteForecast'
    );
    expect(() =>
      useForecastStore
        .getState()
        .createForecast(forecastFixture({ id: 'c2', name: 'Allowed create' }))
    ).not.toThrow();
  });
});

describe('forecastStore — real-role asymmetry', () => {
  it('Analyst may create and edit but must NOT delete', () => {
    actAs('Analyst');
    expect(() =>
      useForecastStore
        .getState()
        .createForecast(forecastFixture({ id: 'analyst-new', name: 'Analyst forecast' }))
    ).not.toThrow();
    expect(() =>
      useForecastStore.getState().updateForecast('fcst-auth-probe', { name: 'Analyst edit' })
    ).not.toThrow();
    // Analyst holds forecast:create/update but not forecast:delete.
    expectDenied(
      () => useForecastStore.getState().deleteForecast('fcst-auth-probe'),
      'forecast:delete',
      'analyst.deleteForecast'
    );
  });

  it('Admin may delete, and the deletion clears a matching selection', () => {
    actAs('Admin');
    expect(() => useForecastStore.getState().deleteForecast('fcst-auth-probe')).not.toThrow();
    expect(useForecastStore.getState().forecasts).toHaveLength(0);
    expect(useForecastStore.getState().selectedForecastId).toBeNull();
  });
});
