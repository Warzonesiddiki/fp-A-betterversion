import { useCallback, useRef } from 'react';

interface AIEvent {
  engine: string;
  action: string;
  latencyMs: number;
  confidence?: number;
  inputLength: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface AIAnalyticsState {
  events: AIEvent[];
  byEngine: Record<string, { count: number; avgLatency: number; avgConfidence: number }>;
  totalEvents: number;
}

const MAX_EVENTS = 500;

let globalEvents: AIEvent[] = [];

function computeStats(events: AIEvent[]): AIAnalyticsState['byEngine'] {
  const stats: Record<
    string,
    { count: number; totalLatency: number; totalConfidence: number; confidenceCount: number }
  > = {};

  for (const e of events) {
    if (!stats[e.engine]) {
      stats[e.engine] = { count: 0, totalLatency: 0, totalConfidence: 0, confidenceCount: 0 };
    }
    const s = stats[e.engine]!;
    s.count++;
    s.totalLatency += e.latencyMs;
    if (e.confidence !== undefined) {
      s.totalConfidence += e.confidence;
      s.confidenceCount++;
    }
  }

  const result: AIAnalyticsState['byEngine'] = {};
  for (const [engine, s] of Object.entries(stats)) {
    result[engine] = {
      count: s.count,
      avgLatency: s.totalLatency / s.count,
      avgConfidence: s.confidenceCount > 0 ? s.totalConfidence / s.confidenceCount : 0,
    };
  }
  return result;
}

export function useAIAnalytics() {
  const eventsRef = useRef<AIEvent[]>(globalEvents);

  const track = useCallback((event: Omit<AIEvent, 'timestamp'>) => {
    const full: AIEvent = { ...event, timestamp: Date.now() };
    globalEvents.push(full);
    if (globalEvents.length > MAX_EVENTS) {
      globalEvents = globalEvents.slice(-MAX_EVENTS);
    }
    eventsRef.current = globalEvents;
  }, []);

  const trackAsync = useCallback(
    async <T>(
      engine: string,
      action: string,
      fn: () => Promise<T>,
      options?: { inputLength?: number; metadata?: Record<string, unknown> }
    ): Promise<T> => {
      const start = performance.now();
      try {
        const result = await fn();
        const latencyMs = performance.now() - start;
        track({
          engine,
          action,
          latencyMs,
          inputLength: options?.inputLength ?? 0,
          metadata: options?.metadata,
        });
        return result;
      } catch (e) {
        const latencyMs = performance.now() - start;
        track({
          engine,
          action: `${action}:error`,
          latencyMs,
          inputLength: options?.inputLength ?? 0,
          metadata: { ...options?.metadata, error: String(e) },
        });
        throw e;
      }
    },
    [track]
  );

  const getStats = useCallback((): AIAnalyticsState => {
    const events = eventsRef.current;
    return {
      events,
      byEngine: computeStats(events),
      totalEvents: events.length,
    };
  }, []);

  const clearStats = useCallback(() => {
    globalEvents = [];
    eventsRef.current = globalEvents;
  }, []);

  const getRecentEvents = useCallback((count = 20) => {
    return eventsRef.current.slice(-count);
  }, []);

  return { track, trackAsync, getStats, clearStats, getRecentEvents };
}
