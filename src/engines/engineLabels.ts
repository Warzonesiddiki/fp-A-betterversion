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
  XBRLEngine:
    'Tested XBRL mapping/fact/XML logic with no product path and no filing claim: a valid filing needs an owner-chosen jurisdiction taxonomy, entity identifiers and assurance rules (DEC-021, extension E4). Must not be presented as a supported export until then.',
  AcquisitionAccounting:
    'ASC 805 purchase-price allocation and ASC 350 goodwill impairment with hand-computed oracles, but no product path yet: no acquisition workflow page collects consideration/NCI/fair-value inputs. Catalogued for evaluation only until the consolidation workflow wires it (Phase 8 remainder).',
  FormulaEngine:
    'Duplicate formula evaluator superseded by SafeMathParser (DEC-020, the canonical engine with the Excel-known-answer oracle suite). Its only product-dir touchpoint is a circular-reference detection hook with no product consumer today, which orchestrates a caller-supplied evaluator and must never call FormulaEngine.evaluate; a census test (formulaEngineCensus.test.ts) pins that boundary so no product path can start evaluating with it silently.',
  ForecastMethodEngine:
    'Forecast method library (SMA/WMA/exponential smoothing/Holt-Winters/ensemble) with no product path: the shipped Forecast builder page implements its own four methods (linear/CAGR/last-3/flat) with their own walk-forward backtest, and no page or store calls this engine. Its measured evidence is the walk-forward backtest harness in src/services/forecast; adopting these methods in the builder is extension-scope work (E3), per DEC-019 labelling.',
};

export function experimentalReason(engineId: string): string | null {
  return EXPERIMENTAL_ENGINES[engineId] ?? null;
}
