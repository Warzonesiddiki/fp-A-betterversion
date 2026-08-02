/**
 * GAP-1 (F-0006) known-answer tests for WaterfallBridgeEngine's money
 * migration.
 *
 * Bridge values (start, components, running total, increases/decreases, net
 * change) are money figures used in variance/revenue bridge dashboards. Each
 * case is a FIXED input -> EXACT expected decimal asserted with `toBe`
 * (Object.is); the pre-migration float literal is recorded inline where it
 * differed.
 */
import { describe, it, expect } from 'vitest';
import { WaterfallBridgeEngine } from './WaterfallBridgeEngine';

describe('WaterfallBridgeEngine — money known answers (GAP-1 / F-0006)', () => {
  it('accumulates the running total exactly (float gave 0.6000000000000001)', () => {
    const bridge = WaterfallBridgeEngine.build(
      'Start',
      0.1,
      [
        { label: 'Up', value: 0.2 },
        { label: 'Down', value: -0.1 },
        { label: 'Up2', value: 0.4 },
      ],
      'End'
    );
    expect(bridge.startValue).toBe(0.1);
    expect(bridge.endValue).toBe(0.6);
    expect(bridge.totalIncrease).toBe(0.6);
    expect(bridge.totalDecrease).toBe(0.1);
  });

  it('computes net change exactly (float gave -0.10000000000000003)', () => {
    const bridge = WaterfallBridgeEngine.build(
      'Start',
      0.3,
      [{ label: 'Down', value: -0.1 }],
      'End'
    );
    expect(bridge.netChange).toBe(-0.1);
  });

  it('computes percent change from exact decimals (float gave 66.66666666666667)', () => {
    const bridge = WaterfallBridgeEngine.build('Start', 0.3, [{ label: 'Up', value: 0.2 }], 'End');
    expect(bridge.percentChange).toBe(66.66666666666667);
  });

  it('derives gross profit and EBITDA exactly (float gave 599.9999999999999)', () => {
    const bridge = WaterfallBridgeEngine.profitBridge(1000.1, 300.05, 100.05);
    expect(bridge.startValue).toBe(1000.1);
    expect(bridge.endValue).toBe(600);
    expect(bridge.netChange).toBe(-400.1);
  });

  it('computes variance bridge totals exactly (float gave 0.30000000000000004)', () => {
    const bridge = WaterfallBridgeEngine.varianceBridge(
      0.1,
      [
        { label: 'V1', amount: 0.2 },
        { label: 'V2', amount: -0.1 },
      ],
      0.2
    );
    expect(bridge.totalIncrease).toBe(0.2);
    expect(bridge.totalDecrease).toBe(0.1);
    expect(bridge.netChange).toBe(0.1);
  });

  it('returns zero percent change for a zero budget', () => {
    const bridge = WaterfallBridgeEngine.build('Start', 0, [{ label: 'Up', value: 5 }], 'End');
    expect(bridge.percentChange).toBe(0);
  });

  it('keeps whole-dollar known answers intact', () => {
    const bridge = WaterfallBridgeEngine.build(
      'Start',
      1000,
      [
        { label: 'A', value: 500 },
        { label: 'B', value: -200 },
      ],
      'End'
    );
    expect(bridge.startValue).toBe(1000);
    expect(bridge.endValue).toBe(1300);
    expect(bridge.totalIncrease).toBe(500);
    expect(bridge.totalDecrease).toBe(200);
    expect(bridge.netChange).toBe(300);
  });
});
