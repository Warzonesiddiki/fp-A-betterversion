#!/usr/bin/env node
/**
 * W0.5 route inventory generator (BLUEPRINT §9.3, RC1–RC4).
 *
 * Parses src/App.tsx for <Route path=...> declarations, classifies each
 * against the five-pillar target IA, and regenerates docs/product/ROUTE_MAP.md.
 * CI drift check: run `node scripts/generate-route-map.js --check` — fails if
 * the committed ROUTE_MAP.md is stale or top-level route count > 40 (RC2).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_TSX = path.join(__dirname, '..', 'src', 'App.tsx');
const OUT = path.join(__dirname, '..', 'docs', 'product', 'ROUTE_MAP.md');
const MAX_TOP_LEVEL = 40;

// Canonical top-level routes (target shell). Everything else is a view,
// a redirect, or deleted.
const TOP_LEVEL = [
  ['PLAN', '/', 'Dashboard'],
  ['PLAN', '/budgets', 'Budgets hub'],
  ['PLAN', '/forecasts', 'Forecasts hub'],
  ['PLAN', '/scenarios', 'Scenarios hub'],
  ['PLAN', '/workforce', 'Workforce hub'],
  ['PLAN', '/capex', 'CapEx hub'],
  ['PLAN', '/cash/forecast', 'Cash forecast'],
  ['PLAN', '/treasury', 'Treasury hub'],
  ['ANALYZE', '/variance', 'Variance dashboard'],
  ['ANALYZE', '/analytics', 'Analytics hub'],
  ['ANALYZE', '/ai', 'AI intelligence'],
  ['ANALYZE', '/drill-down', 'Drill-down window'],
  ['REPORT', '/reports', 'Reports hub'],
  ['REPORT', '/board-pack', 'Board pack'],
  ['REPORT', '/templates', 'Templates gallery'],
  ['MODEL', '/consolidation', 'Consolidation hub'],
  ['MODEL', '/currency', 'FX & translation hub'],
  ['MODEL', '/revenue', 'Revenue recognition hub'],
  ['MODEL', '/lease', 'Lease accounting hub'],
  ['MODEL', '/tax', 'Tax hub'],
  ['MODEL', '/accounting', 'Multi-book / depreciation / fair value hub'],
  ['ADMIN', '/data', 'Data & GL hub'],
  ['ADMIN', '/chart-of-accounts', 'Chart of accounts'],
  ['ADMIN', '/periods/close', 'Period close'],
  ['ADMIN', '/audit', 'Audit trail & SOX'],
  ['ADMIN', '/settings', 'Settings hub'],
  ['ADMIN', '/plugins', 'Plugin marketplace'],
  ['ADMIN', '/admin', 'Admin: debug / benchmarks / engines'],
  ['ADMIN', '/help', 'Help & API docs'],
  ['ADMIN', '/login', 'Auth (outside shell)'],
  ['ADMIN', '/register', 'Auth (outside shell)'],
  ['ADMIN', '/forgot-password', 'Auth (outside shell)'],
  ['ADMIN', '/onboarding', 'Auth (outside shell)'],
];

// path -> disposition of the current (pre-consolidation) route.
// view      = becomes an in-page tab/view under its pillar hub (no own route)
// redirect  = deleted but must redirect (RC3)
// canonical = already a kept top-level route
function classify(p) {
  if (
    [
      '/',
      '/dashboard',
      '/budgets',
      '/budgets/create',
      '/budgets/bva',
      '/forecasts',
      '/forecasts/create',
      '/scenarios',
      '/scenarios/create',
      '/workforce/headcount',
      '/workforce/compensation',
      '/workforce/payroll',
      '/capex',
      '/capex/depreciation',
      '/cash/forecast',
      '/treasury/investments',
      '/treasury/fx-exposure',
      '/treasury/loan-amortization',
      '/variance',
      '/analytics',
      '/ai',
      '/drill-down',
      '/reports',
      '/board-pack',
      '/templates',
      '/consolidation',
      '/currency/fx-rates',
      '/revenue/rev-rec',
      '/lease',
      '/tax/provision',
      '/accounting/depreciation',
      '/data',
      '/data/chart-of-accounts',
      '/periods/close',
      '/help',
      '/settings',
      '/plugins',
      '/admin/debug',
      '/login',
      '/register',
      '/forgot-password',
      '/onboarding',
    ].includes(p)
  )
    return 'canonical';
  const redirects = {
    '/sectors/education': '/sector/education',
    '/sectors/government': '/sector/government',
    '/sectors/logistics': '/sector/logistics',
    '/sectors/telecom': '/sector/telecommunications',
    '/education': '/sector/education',
    '/government': '/sector/government',
    '/logistics': '/sector/logistics',
    '/telecom': '/sector/telecommunications',
    '/retail/retail': '/retail/stores',
    '/retail/dashboard': '/retail/stores',
    '/forecasts/compare': '/scenarios',
    '/forecasts/auto-update': '/forecasts',
    '/scenarios/merge': '/scenarios',
    '/scenarios/lock': '/scenarios',
    '/charts/chart-of-accounts': '/data/chart-of-accounts',
    '/settings/connectors': '/settings/integrations',
  };
  if (redirects[p]) return `redirect -> ${redirects[p]}`;
  return 'view';
}

const src = fs.readFileSync(APP_TSX, 'utf8');
// B0 (W0.5 slice-2): tolerate whitespace/newlines between element={ and its
// JSX child. The previous regex required '<' immediately after 'element={'
// and silently missed every ErrorBoundary-wrapped route (auth pages, /,
// /dashboard, catch-all) — the gate inventoried 191 of 200 literals.
const re =
  /<Route\s+path="([^"]+)"\s+element=\{\s*(?:<Navigate[\s\S]*?to="([^"]+)"|<([A-Za-z][\w.]*))/g;
const routes = [];
let m;
while ((m = re.exec(src)) !== null) {
  routes.push({ path: m[1], navigateTo: m[2] || null, component: m[3] || null });
}
if (routes.length === 0) {
  console.error('No routes found — parser out of sync with src/App.tsx');
  process.exit(1);
}

const topLevelCount = TOP_LEVEL.length;
if (topLevelCount > MAX_TOP_LEVEL) {
  console.error(`RC2 violated: ${topLevelCount} top-level routes > ${MAX_TOP_LEVEL}`);
  process.exit(1);
}

const rows = routes.map((r) => {
  let disp = classify(r.path);
  if (r.navigateTo) disp = `redirect -> ${r.navigateTo}`;
  if (r.path === '*') disp = 'keep (catch-all → NotFound)';
  if (r.path === '/visual/atlas') disp = 'keep (dev-only, excluded from nav)';
  const isSector =
    r.path.startsWith('/sector/') ||
    r.path.startsWith('/sectors/') ||
    [
      '/education',
      '/education/enrollment',
      '/education/research-grants',
      '/government',
      '/government/grants',
      '/government/procurement',
      '/logistics',
      '/logistics/fleet-cost',
      '/logistics/warehouse-cost',
      '/telecom',
    ].includes(r.path);
  if (isSector && !disp.startsWith('redirect')) disp = 'view (sector capability, §3.1)';
  // B0 (RC1): every route maps to exactly one pillar via longest-prefix
  // match against the canonical targets. A route with no pillar fails the
  // gate instead of shipping as an unowned '—' row.
  let pillar = '—';
  let best = -1;
  for (const [p, target] of TOP_LEVEL) {
    if (r.path === target && target !== '/') {
      pillar = p;
      best = r.path.length;
      break;
    }
    if (target !== '/' && r.path.startsWith(target) && target.length > best) {
      pillar = p;
      best = target.length;
    }
  }
  if (pillar === '—' && (r.path === '/' || r.path === '/dashboard')) pillar = 'PLAN';
  // B0 second pass — family defaults for namespaces whose consolidation is
  // planned but not yet executed (W0.5 slice-2 batches B7-B10). These keep
  // RC1 satisfiable today without pretending the fold already happened.
  if (pillar === '—') {
    const FAMILY_DEFAULTS = [
      ['ANALYZE', /^\/sector/],
      ['ANALYZE', /^\/sectors/],
      [
        'ANALYZE',
        /^\/(banking|bonds|credit|construction|realestate|insurance|healthcare|energy|esg|manufacturing|retail|saas|telecom)\b/,
      ],
      ['ANALYZE', /^\/(education|government|logistics)(\/|$)/],
      ['ANALYZE', /^\/(charts|visual)\//],
      ['REPORT', /^\/collaboration/],
      ['PLAN', /^\/cash\//],
      ['ADMIN', /^\/docs\//],
      ['ADMIN', /^\/profile/],
      ['ADMIN', /^\*$/],
    ];
    for (const [p, re] of FAMILY_DEFAULTS) {
      if (re.test(r.path)) {
        pillar = p;
        break;
      }
    }
  }
  return { ...r, pillar, disposition: disp };
});

// RC1 enforcement: no unassigned pillars survive generation.
// Alias-inheritance: a redirect whose target is a declared route inherits
// that route's pillar (terminates; future alias batches self-classify).
for (const r of rows) {
  if (r.pillar === '—' && r.navigateTo) {
    const t = rows.find((x) => x.path === r.navigateTo);
    if (t && t.pillar !== '—') r.pillar = t.pillar;
  }
}
const unassigned = rows.filter((r) => r.pillar === '—').map((r) => r.path);
if (unassigned.length > 0) {
  console.error(
    `RC1 violated: ${unassigned.length} route(s) have no pillar mapping:\n  ${unassigned.join('\n  ')}\n` +
      'Add the path to TOP_LEVEL or teach classify() its disposition.'
  );
  process.exit(1);
}

const counts = {};
for (const r of rows)
  counts[r.disposition.split(' ')[0]] = (counts[r.disposition.split(' ')[0]] ?? 0) + 1;

const md = [];
md.push('# Route Map (W0.5)');
md.push('');
md.push('> Generated by `scripts/generate-route-map.js` from `src/App.tsx`. Do not edit by hand.');
md.push('> Rules: BLUEPRINT section 9.3 RC1-RC4. Target <=40 top-level routes.');
md.push('');
md.push(
  `**Route count correction:** blueprint says 193 lazy routes; measured today: **${rows.length}** \`<Route path>\` declarations in \`src/App.tsx\` (670 lines). The 193 figure is stale.`
);
md.push('');
md.push(`**Target shell:** ${topLevelCount} top-level routes (limit ${MAX_TOP_LEVEL}).`);
md.push('');
md.push('## Disposition summary');
md.push('');
for (const [k, v] of Object.entries(counts).sort()) md.push(`- \`${k}\`: ${v}`);
md.push('');
md.push('## Target top-level routes by pillar');
md.push('');
md.push('| Pillar | Path | Purpose |');
md.push('| --- | --- | --- |');
for (const [p, path_, purpose] of TOP_LEVEL) md.push(`| ${p} | \`${path_}\` | ${purpose} |`);
md.push('');
md.push('## Full inventory (current routes)');
md.push('');
md.push('| # | Current path | Component | Pillar | Disposition |');
md.push('| --- | --- | --- | --- | --- |');
rows.forEach((r, i) =>
  md.push(
    `| ${i + 1} | \`${r.path}\` | ${r.component ?? '(Navigate)'} | ${r.pillar} | ${r.disposition} |`
  )
);
md.push('');

const next = md.join('\n') + '\n';
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== next) {
    console.error('ROUTE_MAP.md is stale — regenerate with: node scripts/generate-route-map.js');
    process.exit(1);
  }
  console.log('ROUTE_MAP.md up to date.');
  process.exit(0);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, next);
console.log(`Wrote ${OUT}: ${rows.length} routes inventoried, ${topLevelCount} top-level targets.`);
