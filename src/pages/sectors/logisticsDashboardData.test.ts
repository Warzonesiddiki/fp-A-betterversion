import { describe, it, expect } from 'vitest';
import {
  deriveLogisticsDashboard,
  type LogisticsGLEntry,
  type LogisticsRouteCost,
  type LogisticsShipment,
} from './logisticsDashboardData';

/**
 * Known-answer tests for the logistics dashboard.
 *
 * Ledger: freight revenue 900,000 (4000) + 100,000 (4100); fuel 300,000 (5000),
 * labour 200,000 (6000) -> cost 500,000, net 500,000.
 * Shipments: 3 delivered, 1 delayed, 1 in transit -> on-time 75%, 5 recorded.
 * Route: LAX-DFW cost 60,000 over 400 loads -> 150 per load.
 */
function e(
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number
): LogisticsGLEntry {
  return { accountCode, accountName, debit, credit };
}

const LEDGER: LogisticsGLEntry[] = [
  e('4000', 'Freight Revenue', 0, 900000),
  e('4100', 'Accessorials', 0, 100000),
  e('5000', 'Fuel', 300000, 0),
  e('6000', 'Driver Labour', 200000, 0),
];

const SHIPMENTS: LogisticsShipment[] = [
  { id: '1', status: 'Delivered', cost: 100 },
  { id: '2', status: 'Delivered', cost: 100 },
  { id: '3', status: 'Delivered', cost: 100 },
  { id: '4', status: 'Delayed', cost: 100 },
  { id: '5', status: 'In Transit', cost: 100 },
];

const ROUTES: LogisticsRouteCost[] = [
  { route: 'LAX-DFW', cost: 60000, volume: 400 },
  { route: 'ORD-ATL', cost: 15000, volume: 0 },
];

describe('deriveLogisticsDashboard — posted figures', () => {
  it('derives revenue and cost from the ledger', () => {
    const d = deriveLogisticsDashboard(LEDGER, SHIPMENTS, ROUTES)!;
    expect(d.postedRevenue).toBe(1000000);
    expect(d.postedCost).toBe(500000);
    expect(d.netResult).toBe(500000);
  });

  it('groups by posted account with real shares, not a typed pie', () => {
    const d = deriveLogisticsDashboard(LEDGER)!;
    expect(d.revenueByAccount).toEqual([
      { name: 'Freight Revenue', value: 900000, sharePercent: 90 },
      { name: 'Accessorials', value: 100000, sharePercent: 10 },
    ]);
    expect(d.costDistribution).toEqual([
      { name: 'Fuel', value: 300000, sharePercent: 60 },
      { name: 'Driver Labour', value: 200000, sharePercent: 40 },
    ]);
    // The old pie was Fuel 28 / Labor 24 / Equipment 15 / ... for every tenant.
    expect(JSON.stringify(d.costDistribution)).not.toContain('28');
  });

  it('returns null when nothing at all is loaded', () => {
    expect(deriveLogisticsDashboard([], [], [])).toBeNull();
  });
});

describe('deriveLogisticsDashboard — operations', () => {
  it('computes the on-time rate from recorded shipments', () => {
    const d = deriveLogisticsDashboard(LEDGER, SHIPMENTS)!;
    expect(d.shipmentCount).toBe(5);
    expect(d.onTimeRatePercent).toBe(75); // 3 delivered of 4 settled
  });

  it('never falls back to a default service level', () => {
    const d = deriveLogisticsDashboard(LEDGER, [])!;
    expect(d.onTimeRatePercent).toBeNull();
    expect(JSON.stringify(d)).not.toContain('96.4');
    expect(d.unavailable.map((u) => u.label)).toContain('On-time delivery rate');
  });

  it('derives cost per shipment only from recorded shipments', () => {
    expect(deriveLogisticsDashboard(LEDGER, SHIPMENTS)!.costPerShipment).toBe(100000);
    expect(deriveLogisticsDashboard(LEDGER, [])!.costPerShipment).toBeNull();
  });

  it('labels lane economics as cost and derives cost per load', () => {
    const d = deriveLogisticsDashboard(LEDGER, SHIPMENTS, ROUTES)!;
    expect(d.lanes[0]).toEqual({
      route: 'LAX-DFW',
      volume: 400,
      cost: 60000,
      costPerLoad: 150,
    });
    // A lane with no volume gets no per-load figure rather than a divide by zero.
    expect(d.lanes[1]!.costPerLoad).toBeNull();
  });

  it('declares telematics, WMS and mileage metrics unavailable', () => {
    const labels = deriveLogisticsDashboard(LEDGER, SHIPMENTS, ROUTES)!.unavailable.map(
      (u) => u.label
    );
    expect(labels).toContain('Fleet utilisation and average transit time');
    expect(labels).toContain('Warehouse capacity');
    expect(labels).toContain('Revenue per mile');
    expect(labels).toContain('Service-line revenue split (FTL / LTL / 3PL)');
  });
});
