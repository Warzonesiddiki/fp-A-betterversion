import { bench, describe } from 'vitest';
import { CashEngine } from './CashEngine';

describe('CashEngine Benchmark', () => {
  const startingBalance = 10000;
  const inflows = Array.from({ length: 13 }, (_, i) => ({
    week: `W${i + 1}`,
    amount: Math.random() * 1000,
  }));
  const outflows = Array.from({ length: 13 }, (_, i) => ({
    week: `W${i + 1}`,
    amount: Math.random() * 1000,
  }));

  bench(
    'forecast13Week 1M loops',
    () => {
      CashEngine.forecast13Week(startingBalance, inflows, outflows, 5000);
    },
    { iterations: 1000000 }
  );
});
