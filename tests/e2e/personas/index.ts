/**
 * PERSONA TEST ALIASES — BARREL INDEX
 * Owner: Sentinel (slot 019ecc6f-1c06-79c0-953c-91c537b63c39) + Iris (slot 019ecc6f-1bcc-7d73-9cd8-e1deb114d270) co-author
 * Source: docs/ratification/RATIFICATION_GATE_PRECHECK_PERSONA_UX.md v0.1.2 §Dim 5
 * Coverage: 12 personas × {main alias + sub-aliases} = 22 test files
 * v0.1.2 amendment (PICK M, 2026-06-17): +2 sectors (Real Estate RE-001 + Telecom TEL-001) per Vesta SECTOR_ENGINE_AUDIT v0.6 (5fae34d26)
 * Purpose: Persona-named lookup over feature-named journey specs in `journeys/`
 * See: tests/e2e/USER_JOURNEY_TEST_COVERAGE.md v0.3 §3 (Persona Mapping Matrix)
 *
 * Run with: `npx playwright test tests/e2e/personas/`
 */

export const PERSONA_ALIAS_MAP = {
  'cfo-enterprise':           { journeys: ['01-import-data', '02-multi-scenario', '03-period-close'], tests: 3 },
  'cfo-enterprise-quarter-close': { journeys: ['03-period-close'], tests: 1 },
  'cfo-midmarket':            { journeys: ['01-import-data', '02-multi-scenario'], tests: 2 },
  'cfo-midmarket-monthly-rollup': { journeys: ['02-multi-scenario'], tests: 1 },
  'controller-small-biz':     { journeys: ['01-import-data', '05-audit-trail'], tests: 2 },
  'controller-sb-trial-balance': { journeys: ['05-audit-trail'], tests: 1 },
  'fp-and-a-analyst':         { journeys: ['04-variance-analysis', '02-multi-scenario'], tests: 2 },
  'fpa-analyst-budget-vs-actual': { journeys: ['04-variance-analysis'], tests: 1 },
  'treasury':                 { journeys: ['02-multi-scenario', '06-backup-restore'], tests: 2 },
  'treasury-cash-forecast':   { journeys: ['02-multi-scenario'], tests: 1 },
  'audit-compliance':         { journeys: ['05-audit-trail', '09-cross-muse-integration'], tests: 2 },
  'audit-soc2-walkthrough':   { journeys: ['05-audit-trail'], tests: 1 },
  'operations-vendor-scorecard': { journeys: ['07-plugin-sandbox'], tests: 1 },
  'sector-logistics':         { journeys: ['07-plugin-sandbox', '08-temporal-edge-cases'], tests: 2 },
  'sector-logistics-warehouse': { journeys: ['07-plugin-sandbox'], tests: 1 },
  'sector-nonprofit':         { journeys: ['06-backup-restore', '10-temporal-e2e-cross-check'], tests: 2 },
  'sector-nonprofit-form990': { journeys: ['10-temporal-e2e-cross-check'], tests: 1 },
  'sector-healthcare':        { journeys: ['08-temporal-edge-cases', '09-cross-muse-integration'], tests: 2 },
  'sector-real-estate':       { journeys: ['02-multi-scenario', '04-variance-analysis', '06-backup-restore'], tests: 3 },
  'sector-real-estate-irr':   { journeys: ['04-variance-analysis'], tests: 1 },
  'sector-telecom':           { journeys: ['02-multi-scenario', '04-variance-analysis', '07-plugin-sandbox'], tests: 3 },
  'sector-telecom-churn':     { journeys: ['04-variance-analysis'], tests: 1 },
} as const;

export type PersonaAliasKey = keyof typeof PERSONA_ALIAS_MAP;
