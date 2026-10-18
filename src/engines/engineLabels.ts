/**
 * DEC-019 — EXPERIMENTAL engine labels.
 *
 * An engine that only surfaces in the /admin/engines catalog viewer is
 * reachable in the mechanical sense but is NOT a shipped product
 * feature. Such engines are labelled here with the measured reason, so
 * the catalog (and any future surface) must present them as
 * experimental rather than silently implying support.
 *
 * Labels are data, not claims: each entry names why the engine has no
 * product path today. `engineLabels.test.ts` keeps every id honest
 * against the generated manifest.
 */
export const EXPERIMENTAL_ENGINES: Record<string, string> = {
  RollingForecastEngine:
    'Tested roll/blend state machine with no product path: the shipped rolling-forecast page derives figures from posted GL via rollingForecastModel, and no store or page consumes this engine. Wiring it in changes planning behaviour and awaits the owner roll-semantics answer (DEC-019).',
};

export function experimentalReason(engineId: string): string | null {
  return EXPERIMENTAL_ENGINES[engineId] ?? null;
}
