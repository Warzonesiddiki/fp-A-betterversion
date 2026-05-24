/**
 * Tests for WaterfallBridgeEngine
 * Covers: build, profitBridge, varianceBridge
 */
import { describe, it, expect } from 'vitest';
import { WaterfallBridgeEngine } from './WaterfallBridgeEngine';

describe('WaterfallBridgeEngine', () => {
  describe('build', () => {
    it('should build a profit bridge with start, components, and end', () => {
      const bridge = WaterfallBridgeEngine.build(
        'Start',
        1000,
        [
          { label: 'Revenue', value: 500 },
          { label: 'COGS', value: -200 },
          { label: 'OpEx', value: -100 },
        ],
        'End'
      );
      expect(bridge.items.length).toBeGreaterThan(0);
      expect(bridge.items[0].label).toBe('Start');
      expect(bridge.items[0].value).toBe(1000);
      expect(bridge.items[bridge.items.length - 1].label).toBe('End');
    });

    it('should calculate correct totals', () => {
      const bridge = WaterfallBridgeEngine.build(
        'Start',
        1000,
        [
          { label: 'Revenue', value: 500 },
          { label: 'COGS', value: -200 },
        ],
        'End'
      );
      expect(bridge.startValue).toBe(1000);
      expect(bridge.endValue).toBe(1300);
      expect(bridge.totalIncrease).toBe(500);
      expect(bridge.totalDecrease).toBe(200);
    });

    it('should handle empty components', () => {
      const bridge = WaterfallBridgeEngine.build('Start', 1000, [], 'End');
      expect(bridge.items).toHaveLength(2);
      expect(bridge.items[0].type).toBe('start');
      expect(bridge.items[1].type).toBe('end');
      expect(bridge.endValue).toBe(1000);
    });
  });

  describe('profitBridge', () => {
    it('should build a P&L bridge from revenues, cogs, opex', () => {
      const bridge = WaterfallBridgeEngine.profitBridge(1000000, 400000, 200000);
      expect(bridge.items.length).toBeGreaterThan(0);
      expect(bridge.startValue).toBe(1000000);
      expect(bridge.endValue).toBe(400000);
    });
  });

  describe('varianceBridge', () => {
    it('should build a variance bridge from budget to actual', () => {
      const bridge = WaterfallBridgeEngine.varianceBridge(
        1000000,
        [
          { label: 'Volume Variance', amount: 50000 },
          { label: 'Price Variance', amount: -20000 },
        ],
        1030000
      );
      expect(bridge.items.length).toBeGreaterThan(0);
      expect(bridge.startValue).toBe(1000000);
      expect(bridge.endValue).toBe(1030000);
    });
  });
});
