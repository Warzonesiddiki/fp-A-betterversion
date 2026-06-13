import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIAnalytics } from './useAIAnalytics';

describe('useAIAnalytics', () => {
  beforeEach(() => {
    // Reset global state
    const { result } = renderHook(() => useAIAnalytics());
    act(() => result.current.clearStats());
  });

  it('should track events', () => {
    const { result } = renderHook(() => useAIAnalytics());

    act(() => {
      result.current.track({
        engine: 'FinanceCopilotEngine',
        action: 'answer',
        latencyMs: 5,
        confidence: 0.9,
        inputLength: 20,
      });
    });

    const stats = result.current.getStats();
    expect(stats.totalEvents).toBe(1);
    expect(stats.byEngine['FinanceCopilotEngine']).toBeDefined();
    expect(stats.byEngine['FinanceCopilotEngine']!.count).toBe(1);
  });

  it('should compute average latency and confidence', () => {
    const { result } = renderHook(() => useAIAnalytics());

    act(() => {
      result.current.track({
        engine: 'AICopilotEngine',
        action: 'suggestFormula',
        latencyMs: 10,
        confidence: 0.85,
        inputLength: 15,
      });
      result.current.track({
        engine: 'AICopilotEngine',
        action: 'suggestFormula',
        latencyMs: 20,
        confidence: 0.75,
        inputLength: 25,
      });
    });

    const stats = result.current.getStats();
    expect(stats.byEngine['AICopilotEngine']!.count).toBe(2);
    expect(stats.byEngine['AICopilotEngine']!.avgLatency).toBe(15);
    expect(stats.byEngine['AICopilotEngine']!.avgConfidence).toBeCloseTo(0.8, 2);
  });

  it('should track async operations with timing', async () => {
    const { result } = renderHook(() => useAIAnalytics());

    await act(async () => {
      await result.current.trackAsync(
        'NLQEngine',
        'parseQuery',
        async () => {
          return { parsed: true };
        },
        { inputLength: 30 }
      );
    });

    const stats = result.current.getStats();
    expect(stats.totalEvents).toBe(1);
    expect(stats.byEngine['NLQEngine']!.count).toBe(1);
    expect(stats.byEngine['NLQEngine']!.avgLatency).toBeGreaterThanOrEqual(0);
  });

  it('should track async errors', async () => {
    const { result } = renderHook(() => useAIAnalytics());

    await act(async () => {
      try {
        await result.current.trackAsync('AIEngine', 'init', async () => {
          throw new Error('WebGPU failed');
        });
      } catch {
        // expected
      }
    });

    const stats = result.current.getStats();
    expect(stats.totalEvents).toBe(1);
    expect(stats.byEngine['AIEngine']!.count).toBe(1);
  });

  it('should return recent events', () => {
    const { result } = renderHook(() => useAIAnalytics());

    act(() => {
      result.current.track({
        engine: 'Engine1',
        action: 'test',
        latencyMs: 1,
        inputLength: 5,
      });
      result.current.track({
        engine: 'Engine2',
        action: 'test',
        latencyMs: 2,
        inputLength: 5,
      });
    });

    const recent = result.current.getRecentEvents(1);
    expect(recent).toHaveLength(1);
    expect(recent[0]!.engine).toBe('Engine2');
  });

  it('should clear stats', () => {
    const { result } = renderHook(() => useAIAnalytics());

    act(() => {
      result.current.track({
        engine: 'Test',
        action: 'test',
        latencyMs: 1,
        inputLength: 5,
      });
    });

    expect(result.current.getStats().totalEvents).toBe(1);

    act(() => result.current.clearStats());

    expect(result.current.getStats().totalEvents).toBe(0);
  });
});
