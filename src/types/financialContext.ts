/**
 * FinancialContext — typed global financial context contract (F-03).
 *
 * UX contract: Scope → Time → Version → Currency → Freshness
 * (see _bmad/ux-design.md §4.1 and docs/design/FINPLAN_ATLAS.md).
 *
 * This is a UI/draft contract only. Official context for authoritative views
 * is resolved and filtered server-side (F-04 command/query envelope); this
 * module never claims client-side authorization authority.
 */

export interface FinancialEntityScope {
  /** Selected entity ids (empty = no entity selected / all permitted). */
  entityIds: readonly string[];
  /** Human label rendered in the context bar. */
  label: string;
}

export interface FinancialPeriod {
  /** Inclusive ISO period start, YYYY-MM. */
  start: string;
  /** Inclusive ISO period end, YYYY-MM. */
  end: string;
  calendar: 'fiscal' | 'calendar';
}

export type FinancialVersionLifecycle = 'draft' | 'inReview' | 'approved' | 'locked';

export interface FinancialVersion {
  id: string;
  label: string;
  lifecycle: FinancialVersionLifecycle;
}

export interface FinancialCurrency {
  /** ISO 4217 code, uppercase. */
  code: string;
}

export type FreshnessState = 'synced' | 'stale' | 'offlineQueued' | 'failed' | 'unknown';

/**
 * Truth boundary marker: 'local-draft' means the workspace cache/draft is the
 * source; 'server' means an authoritative Control Plane resolved the context.
 */
export type FinancialContextSource = 'local-draft' | 'server';

export interface FinancialContext {
  scope: FinancialEntityScope;
  period: FinancialPeriod;
  version: FinancialVersion | null;
  currency: FinancialCurrency;
  freshness: FreshnessState;
  source: FinancialContextSource;
}

export const DEFAULT_FINANCIAL_CONTEXT: FinancialContext = {
  scope: { entityIds: [], label: 'No entity selected' },
  period: { start: '', end: '', calendar: 'fiscal' },
  version: null,
  currency: { code: 'USD' },
  freshness: 'unknown',
  source: 'local-draft',
};

// ---------------------------------------------------------------------------
// Serialization (URL / saved-view contract)
//
// Freshness is intentionally NOT serialized: it is ephemeral runtime state and
// freezing it in a saved view would misrepresent data freshness.
// ---------------------------------------------------------------------------

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export function financialContextToParams(ctx: FinancialContext): URLSearchParams {
  const params = new URLSearchParams();
  if (ctx.scope.entityIds.length > 0) {
    params.set('entity', ctx.scope.entityIds.join(','));
  }
  if (ctx.period.start && ctx.period.end) {
    params.set('period', `${ctx.period.start}..${ctx.period.end}`);
  }
  if (ctx.version) {
    params.set('version', ctx.version.id);
  }
  params.set('currency', ctx.currency.code);
  return params;
}

/** Canonical, deterministic query-string form (no leading '?'). */
export function serializeFinancialContext(ctx: FinancialContext): string {
  return financialContextToParams(ctx).toString();
}

/**
 * Parse a partial context from URL search params. Invalid values are ignored
 * (never silently coerced); returns an empty patch when nothing is usable.
 */
export function financialContextFromParams(params: URLSearchParams): Partial<FinancialContext> {
  const patch: Partial<FinancialContext> = {};

  const entity = params.get('entity');
  if (entity && entity.length > 0) {
    const entityIds = entity.split(',').filter((id) => id.length > 0);
    if (entityIds.length > 0) {
      patch.scope = { entityIds, label: entityIds.join(', ') };
    }
  }

  const period = params.get('period');
  if (period) {
    const [start, end] = period.split('..');
    if (start && end && PERIOD_PATTERN.test(start) && PERIOD_PATTERN.test(end)) {
      patch.period = { start, end, calendar: 'fiscal' };
    }
  }

  const version = params.get('version');
  if (version && version.length > 0) {
    patch.version = { id: version, label: version, lifecycle: 'draft' };
  }

  const currency = params.get('currency');
  if (currency && CURRENCY_PATTERN.test(currency)) {
    patch.currency = { code: currency };
  }

  return patch;
}

export function mergeFinancialContext(
  base: FinancialContext,
  patch: Partial<FinancialContext>
): FinancialContext {
  return {
    scope: patch.scope ?? base.scope,
    period: patch.period ?? base.period,
    version: patch.version !== undefined ? patch.version : base.version,
    currency: patch.currency ?? base.currency,
    freshness: patch.freshness ?? base.freshness,
    source: patch.source ?? base.source,
  };
}

export function financialContextsEqual(a: FinancialContext, b: FinancialContext): boolean {
  return (
    serializeFinancialContext(a) === serializeFinancialContext(b) &&
    a.freshness === b.freshness &&
    a.source === b.source
  );
}
