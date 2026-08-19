import { describe, it, expect } from 'vitest';
import { deriveTelecomDashboard, type TelecomSubscriberInput } from './telecomDashboardData';

const SUBSCRIBERS: TelecomSubscriberInput[] = [
  { monthlyRevenue: 50, churnRisk: 'Low', status: 'Active' },
  { monthlyRevenue: 60.25, churnRisk: 'Medium', status: 'Active' },
  { monthlyRevenue: 40, churnRisk: 'High', status: 'Active' },
  { monthlyRevenue: 100, churnRisk: 'Low', status: 'Suspended' },
  { monthlyRevenue: 20, churnRisk: 'High', status: 'Churned' },
];

describe('deriveTelecomDashboard', () => {
  it('returns null when the workspace has recorded nothing', () => {
    expect(deriveTelecomDashboard([], [], [])).toBeNull();
  });

  it('counts and prices only ACTIVE subscribers', () => {
    const d = deriveTelecomDashboard(SUBSCRIBERS, [], [])!;
    expect(d.activeSubscribers).toBe(3);
    // (50 + 60.25 + 40) / 3 = 50.0833… → 50.08
    expect(d.arpu).toBe(50.08);
    expect(d.churnRisk).toEqual({ low: 1, medium: 1, high: 1 });
  });

  it('aggregates revenue decimally — no IEEE-754 drift in ARPU', () => {
    // Float addition gives 1.1 + 2.2 + 3.3 = 6.6000000000000005, so a float
    // average reports 2.2000000000000002. The decimal path is exact.
    const drift: TelecomSubscriberInput[] = [
      { monthlyRevenue: 1.1, churnRisk: 'Low', status: 'Active' },
      { monthlyRevenue: 2.2, churnRisk: 'Low', status: 'Active' },
      { monthlyRevenue: 3.3, churnRisk: 'Low', status: 'Active' },
    ];
    expect(deriveTelecomDashboard(drift, [], [])!.arpu).toBe(2.2);
  });

  it('emits null ARPU, not zero, when no subscriber is active', () => {
    const churnedOnly: TelecomSubscriberInput[] = [
      { monthlyRevenue: 20, churnRisk: 'High', status: 'Churned' },
    ];
    const d = deriveTelecomDashboard(churnedOnly, [], [])!;
    expect(d.activeSubscribers).toBe(0);
    expect(d.arpu).toBeNull();
  });

  it('maps subscriber history from the recorded ARPU trend rows', () => {
    const trends = [
      { month: '2025-01', arpu: 45.5, subscribers: 1200 },
      { month: '2025-02', arpu: 46.1, subscribers: 1240 },
    ];
    const d = deriveTelecomDashboard([], [], trends)!;
    expect(d.subscriberHistory).toEqual([
      { month: '2025-01', subscribers: 1200 },
      { month: '2025-02', subscribers: 1240 },
    ]);
  });
});
