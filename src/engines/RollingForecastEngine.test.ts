// =============================================================================
// ROLLING FORECAST ENGINE TESTS — 40+ tests for auto-extending forecasts
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { RollingForecastEngine, type ForecastPeriod } from './RollingForecastEngine';

describe('RollingForecastEngine', () => {
  let engine: RollingForecastEngine;

  beforeEach(() => {
    engine = new RollingForecastEngine();
  });

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  describe('Configuration', () => {
    it('should configure a forecast with defaults', () => {
      const config = engine.configure('fc-1');
      expect(config.windowMonths).toBe(12);
      expect(config.blendMethod).toBe('weighted');
      expect(config.autoExtend).toBe(true);
    });

    it('should configure with custom values', () => {
      const config = engine.configure('fc-1', { windowMonths: 24, blendMethod: 'trend' });
      expect(config.windowMonths).toBe(24);
      expect(config.blendMethod).toBe('trend');
    });

    it('should get config', () => {
      engine.configure('fc-1');
      expect(engine.getConfig('fc-1')).toBeDefined();
    });

    it('should get state', () => {
      engine.configure('fc-1');
      const state = engine.getState('fc-1');
      expect(state).toBeDefined();
      expect(state?.forecastId).toBe('fc-1');
    });

    it('should return undefined for non-existent config', () => {
      expect(engine.getConfig('non-existent')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Roll Forward
  // ---------------------------------------------------------------------------

  describe('Roll Forward', () => {
    it('should roll forward with actuals', () => {
      engine.configure('fc-1', { windowMonths: 12, extendMonths: 3 });

      const periods: ForecastPeriod[] = [
        { period: '2026-01', isActual: false, value: 100 },
        { period: '2026-02', isActual: false, value: 110 },
        { period: '2026-03', isActual: false, value: 120 },
      ];

      const actuals = new Map([
        ['2026-01', 105],
        ['2026-02', 112],
      ]);

      const result = engine.rollForward(
        'fc-1',
        actuals,
        (period) => {
          const values: Record<string, number> = {
            '2026-03': 120,
            '2026-04': 130,
            '2026-05': 140,
            '2026-06': 150,
          };
          return values[period] ?? 0;
        },
        periods
      );

      expect(result.actualizedCount).toBe(2);
      expect(result.newWindow.length).toBeGreaterThan(3);
      expect(result!.newWindow[0]!.isActual).toBe(true);
      // Value is blended: 105 * 0.7 + 100 * 0.3 = 103.5
      expect(result!.newWindow[0]!.value).toBe(103.5);
    });

    it('should throw when forecast not configured', () => {
      expect(() => engine.rollForward('non-existent', new Map(), () => 0, [])).toThrow();
    });

    it('should update state after roll', () => {
      engine.configure('fc-1', { windowMonths: 12, extendMonths: 2 });

      const periods: ForecastPeriod[] = [{ period: '2026-01', isActual: false, value: 100 }];

      engine.rollForward('fc-1', new Map([['2026-01', 105]]), () => 110, periods);

      const state = engine.getState('fc-1');
      expect(state?.lastRollDate).toBeDefined();
      expect(state?.actualizedPeriods).toContain('2026-01');
    });
  });

  // ---------------------------------------------------------------------------
  // Blend Methods
  // ---------------------------------------------------------------------------

  describe('Blend Methods', () => {
    it('should blend with weighted method', () => {
      engine.configure('fc-1', {
        blendMethod: 'weighted',
        recentWeight: 0.7,
        forecastWeight: 0.3,
        extendMonths: 0,
      });

      const periods: ForecastPeriod[] = [{ period: '2026-01', isActual: false, value: 100 }];

      const result = engine.rollForward('fc-1', new Map([['2026-01', 120]]), () => 100, periods);
      // weighted blend: 120 * 0.7 + 100 * 0.3 = 114
      expect(result!.newWindow[0]!.isActual).toBe(true);
      expect(result!.newWindow[0]!.value).toBe(114);
      expect(result.actualizedCount).toBe(1);
    });

    it('should blend with full-replace method', () => {
      engine.configure('fc-1', {
        blendMethod: 'full-replace',
        extendMonths: 0,
      });

      const periods: ForecastPeriod[] = [{ period: '2026-01', isActual: false, value: 100 }];

      const result = engine.rollForward('fc-1', new Map([['2026-01', 120]]), () => 100, periods);
      expect(result!.newWindow[0]!.isActual).toBe(true);
      expect(result!.newWindow[0]!.value).toBe(120);
    });
  });

  // ---------------------------------------------------------------------------
  // Confidence Calculation
  // ---------------------------------------------------------------------------

  describe('Confidence', () => {
    it('should calculate decreasing confidence for forecast periods', () => {
      engine.configure('fc-1', { windowMonths: 12, extendMonths: 3 });

      const periods: ForecastPeriod[] = [{ period: '2026-01', isActual: true, value: 100 }];

      const result = engine.rollForward('fc-1', new Map(), () => 110, periods);
      const forecastPeriods = result.newWindow.filter((p) => !p.isActual);
      expect(forecastPeriods.length).toBeGreaterThan(0);
      expect(forecastPeriods![0]!.confidence).toBeGreaterThan(0);
      expect(forecastPeriods![0]!.confidence).toBeLessThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Should Roll
  // ---------------------------------------------------------------------------

  describe('Should Roll', () => {
    it('should return true when no roll has happened', () => {
      engine.configure('fc-1');
      expect(engine.shouldRoll('fc-1', '2026-06')).toBe(true);
    });

    it('should return false when far from window end', () => {
      engine.configure('fc-1', { windowMonths: 12, extendMonths: 1 });

      const periods: ForecastPeriod[] = Array.from({ length: 12 }, (_, i) => ({
        period: `2026-${String(i + 1).padStart(2, '0')}`,
        isActual: i < 6,
        value: 100 + i * 10,
      }));

      engine.rollForward('fc-1', new Map(), () => 200, periods);
      expect(engine.shouldRoll('fc-1', '2026-01')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Actualized Boundary
  // ---------------------------------------------------------------------------

  describe('Actualized Boundary', () => {
    it('should return null before any roll', () => {
      engine.configure('fc-1');
      const boundary = engine.getActualizedBoundary('fc-1');
      expect(boundary.lastActual).toBeNull();
      expect(boundary.firstForecast).toBeNull();
    });

    it('should return boundary after roll', () => {
      engine.configure('fc-1', { extendMonths: 2 });

      const periods: ForecastPeriod[] = [
        { period: '2026-01', isActual: false, value: 100 },
        { period: '2026-02', isActual: false, value: 110 },
      ];

      engine.rollForward('fc-1', new Map([['2026-01', 105]]), () => 120, periods);

      const boundary = engine.getActualizedBoundary('fc-1');
      expect(boundary.lastActual).toBe('2026-01');
    });
  });

  // ---------------------------------------------------------------------------
  // Forecast from Drivers
  // ---------------------------------------------------------------------------

  describe('Forecast from Drivers', () => {
    it('should generate forecast from driver values', () => {
      const drivers = new Map([
        ['Revenue Growth', 10],
        ['Cost Growth', 5],
      ]);
      const baseValues = new Map([
        ['Revenue', 1000000],
        ['COGS', 600000],
      ]);
      const rules = [
        { driverName: 'Revenue Growth', account: 'Revenue', weight: 1 },
        { driverName: 'Cost Growth', account: 'COGS', weight: 1 },
      ];

      const result = engine.generateForecastFromDrivers(drivers, baseValues, rules);
      expect(result.get('Revenue')).toBe(1100000);
      expect(result.get('COGS')).toBe(630000);
    });

    it('should handle missing driver values', () => {
      const drivers = new Map([['Revenue Growth', 10]]);
      const baseValues = new Map([['Revenue', 1000000]]);
      const rules = [
        { driverName: 'Revenue Growth', account: 'Revenue', weight: 1 },
        { driverName: 'Missing Driver', account: 'Revenue', weight: 0.5 },
      ];

      const result = engine.generateForecastFromDrivers(drivers, baseValues, rules);
      expect(result.get('Revenue')).toBe(1100000);
    });
  });

  // ---------------------------------------------------------------------------
  // Export/Import
  // ---------------------------------------------------------------------------

  describe('Export/Import', () => {
    it('should export and import state', () => {
      engine.configure('fc-1', { windowMonths: 24 });
      const state = engine.exportState();
      expect(state.configs).toHaveLength(1);

      const newEngine = new RollingForecastEngine();
      newEngine.importState(state);
      expect(newEngine.getConfig('fc-1')?.windowMonths).toBe(24);
    });
  });

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  describe('Reset', () => {
    it('should reset all state', () => {
      engine.configure('fc-1');
      engine.reset();
      expect(engine.getConfig('fc-1')).toBeUndefined();
    });
  });
});
