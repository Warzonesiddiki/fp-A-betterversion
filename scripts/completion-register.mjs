#!/usr/bin/env node
/**
 * completion-register.mjs — the completion register gate (PR #86, plan §3).
 *
 * WHY THIS EXISTS
 * ---------------
 * The programme that runs from PR #85 to PR #100 is defined as a CLOSED
 * COMPLETION REGISTER (DEC-058): every identified responsibility carries a
 * status from a closed vocabulary and evidence that resolves. This script is
 * the meter. Without it, "we are nearly done" is an opinion, because nothing
 * notices when a route lands with no row, when a status becomes a word someone
 * liked, or when the rendered table stops matching the data behind it.
 *
 * WHAT IS CENSUSED FROM THE TREE (never typed in)
 *   routes         src/App.tsx <Route path=…>                      (231)
 *   engines        src/engines/*.ts minus tests/plumbing           (180)
 *   requirements   docs/discovery/requirements-register.md          (19)
 *   annex          docs/MASTER_CHECKLIST_COVERAGE.md rows + the
 *                  coverage-scope contract's expected sections     (200)
 *   capabilities   CAPABILITIES below, mirroring plan §4 domains
 *   owner ids      docs/TASKBOARD.md §OWNER                          O1–O9
 *   decision ids   docs/discovery/decision-log.md                 DEC-nnn
 *   npm scripts    package.json scripts (a SUPPORTED row must cite one)
 *
 * GATE RULES (plan §3; every one has a failing test in
 * src/__tests__/completionRegister.test.ts)
 *   1. exactly one row per censused item, and no row whose item is gone
 *   2. no blank status; no status outside the vocabulary
 *   3. SUPPORTED needs ≥1 existing test file, a real npm gate and an existing doc
 *   4. BLOCKED-ON-OWNER needs an O-id present in the taskboard owner table
 *   5. RETIRED needs a DEC id present in the decision log (+ a commit sha)
 *   6. NOT_BUILT needs the row/document that names it; EXPERIMENTAL its gate
 *   7. the rendered markdown must match the JSON byte for byte
 *
 * USAGE
 *   node scripts/completion-register.mjs             # validate + render the view
 *   node scripts/completion-register.mjs --check     # validate + fail if stale
 *   node scripts/completion-register.mjs --seed      # add rows for new census items
 *   node scripts/completion-register.mjs --release   # also require C1 (PR #100)
 *   node scripts/completion-register.mjs --root=DIR  # fixture trees (tests)
 *
 * EXIT CODES
 *   0 verified · 1 violation or stale · 2 could not verify at all
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STATUSES = ['SUPPORTED', 'EXPERIMENTAL', 'BLOCKED-ON-OWNER', 'RETIRED', 'NOT_BUILT'];

const HERE = dirname(fileURLToPath(import.meta.url));
const argRoot = process.argv.find((a) => a.startsWith('--root='));
const ROOT = argRoot ? resolve(argRoot.slice('--root='.length)) : resolve(HERE, '..');
const CHECK = process.argv.includes('--check');
const SEED = process.argv.includes('--seed');
const RELEASE = process.argv.includes('--release');

const REGISTER_JSON = join(ROOT, 'docs', 'plan', 'completion-register.json');
const REGISTER_VIEW = join(ROOT, 'docs', 'plan', 'COMPLETION_REGISTER.md');
const START = '<!-- REGISTER:START -->';
const END = '<!-- REGISTER:END -->';

/**
 * The eleven domains of plan §4. A capability id is `domain.name`; the gate
 * requires every domain below to have at least one row, so a new domain in the
 * plan cannot be silently left out of the register.
 */
export const DOMAINS = {
  data: 'DATA & INTEGRATION',
  close: 'ACTUALS & CLOSE',
  plan: 'PLAN & FORECAST',
  model: 'MODEL & CONSOLIDATE',
  analyze: 'ANALYZE & PERFORMANCE',
  ops: 'OPERATIONAL PLANNING',
  wf: 'WORKFLOW & GOVERNANCE',
  report: 'REPORT & COMMUNICATE',
  admin: 'ADMIN (cross-cutting)',
  govern: 'GOVERN (cross-cutting)',
  ai: 'AI (cross-cutting)',
};

/** Named capabilities per domain — plan §4, one register row each. */
export const CAPABILITIES = [
  // DATA & INTEGRATION
  'data.d365-fo-gl',
  'data.d365-journal',
  'data.d365-bc-gl',
  'data.csv-xlsx-intake',
  'data.mapping',
  'data.validation',
  'data.quarantine',
  'data.control-totals',
  'data.lineage',
  // ACTUALS & CLOSE
  'close.period-entity-scope',
  'close.trial-balance',
  'close.tie-out',
  'close.state-machine',
  'close.write-guards',
  'close.audit-chain',
  'close.corrections',
  // PLAN & FORECAST
  'plan.budgets',
  'plan.versions',
  'plan.rolling-forecast',
  'plan.scenarios',
  'plan.assumptions',
  'plan.drivers-cascades',
  'plan.operational-plans',
  // MODEL & CONSOLIDATE
  'model.consolidation',
  'model.ic-elimination',
  'model.fx-translation',
  'model.revenue-recognition',
  'model.leases',
  'model.tax',
  'model.multi-book',
  // ANALYZE & PERFORMANCE
  'analyze.statements',
  'analyze.variance-decomposition',
  'analyze.drill-to-source',
  'analyze.exception-rules',
  'analyze.findings-disposition',
  'analyze.explanations',
  // OPERATIONAL PLANNING
  'ops.cash-planning',
  'ops.workforce',
  'ops.capex',
  // WORKFLOW & GOVERNANCE
  'wf.reviews',
  'wf.approvals',
  'wf.correction-follow-through',
  'wf.rbac',
  'wf.auditability',
  'wf.administration',
  'wf.human-attribution',
  // REPORT & COMMUNICATE
  'report.statements',
  'report.board-pack',
  'report.xlsx-formula',
  'report.pdf',
  'report.pptx-editable',
  'report.tie-back',
  // ADMIN
  'admin.users',
  'admin.settings',
  'admin.integrations',
  'admin.data-management',
  'admin.backup-restore',
  // GOVERN
  'govern.authorization',
  'govern.sox-authority',
  'govern.security-policy',
  'govern.entity-scope',
  // AI
  'ai.verified-facts-gate',
  'ai.local-only',
  'ai.explicit-invocation',
  'ai.no-egress',
];

/**
 * Seed defaults, and only seed defaults. A capability is EXPERIMENTAL when a
 * routed screen hosts it (the route is the gate), BLOCKED-ON-OWNER when a named
 * owner decision is the blocker, and NOT_BUILT otherwise. Nothing seeds as
 * SUPPORTED: that status has to be earned with tests in a later PR.
 */
const CAPABILITY_SEED = {
  'data.d365-fo-gl': { blockedBy: 'O1' },
  'data.d365-journal': { blockedBy: 'O1' },
  'data.d365-bc-gl': { blockedBy: 'O1' },
  'data.csv-xlsx-intake': { route: '/data/gl-upload' },
  'data.mapping': { route: '/data/data-flow' },
  'data.validation': { route: '/data/exceptions' },
  'data.quarantine': { route: '/data/gl-explorer' },
  'data.control-totals': { route: '/data/gl-trial-balance' },
  'data.lineage': { route: '/analytics/data-lineage' },
  'close.period-entity-scope': { route: '/periods/close' },
  'close.trial-balance': { route: '/data/gl-trial-balance' },
  'close.tie-out': { route: '/data/reconciliation' },
  'close.state-machine': { route: '/periods/close' },
  'close.write-guards': { route: '/data/gl-journals' },
  'close.audit-chain': { route: '/audit/trail' },
  'close.corrections': { route: '/data/corrections' },
  'plan.budgets': { route: '/budgets' },
  'plan.versions': { route: '/budgets/bva' },
  'plan.rolling-forecast': { blockedBy: 'O2' },
  'plan.scenarios': { route: '/scenarios' },
  'plan.assumptions': { route: '/forecasts/drivers' },
  'plan.drivers-cascades': { route: '/forecasts/drivers' },
  'model.consolidation': { route: '/consolidation' },
  'model.ic-elimination': { route: '/consolidation/ic-eliminations' },
  'model.fx-translation': { route: '/currency/translation' },
  'model.revenue-recognition': { route: '/revenue' },
  'model.leases': { route: '/lease' },
  'model.tax': { route: '/tax' },
  'model.multi-book': { route: '/accounting' },
  'analyze.statements': { route: '/reports/three-statement' },
  'analyze.variance-decomposition': { route: '/variance' },
  'analyze.drill-to-source': { route: '/data/gl-explorer' },
  'analyze.exception-rules': { route: '/data/exceptions' },
  'analyze.findings-disposition': { route: '/data/exceptions' },
  'analyze.explanations': { route: '/variance' },
  'ops.cash-planning': { route: '/cash/forecast' },
  'ops.workforce': { route: '/workforce' },
  'ops.capex': { route: '/capex' },
  'wf.reviews': { route: '/budgets/approval' },
  'wf.approvals': { route: '/budgets/approval' },
  'wf.correction-follow-through': { route: '/data/corrections' },
  'wf.rbac': { route: '/settings/security' },
  'wf.auditability': { route: '/audit/trail' },
  'wf.administration': { route: '/admin' },
  'wf.human-attribution': { route: '/audit/trail' },
  'report.statements': { route: '/reports/three-statement' },
  'report.board-pack': { route: '/board-pack' },
  'report.xlsx-formula': { route: '/reports' },
  'report.pdf': { route: '/reports' },
  'report.pptx-editable': { route: '/board-pack' },
  'report.tie-back': { route: '/reports' },
  'admin.users': { route: '/admin' },
  'admin.settings': { route: '/settings' },
  'admin.integrations': { route: '/settings/integrations' },
  'admin.data-management': { route: '/data' },
  'admin.backup-restore': { blockedBy: 'O3' },
  'govern.authorization': { route: '/settings/security' },
  'govern.sox-authority': { blockedBy: 'O4' },
  'govern.security-policy': { route: '/settings/security' },
  'govern.entity-scope': { blockedBy: 'O9' },
  'ai.verified-facts-gate': { route: '/ai' },
  'ai.local-only': { route: '/ai' },
  'ai.explicit-invocation': { route: '/ai' },
  'ai.no-egress': {
    needsProof: 'no egress path is proven; DEC-022 is policy, not a tested control',
  },
};

const ENGINE_PLUMBING = new Set([
  'index',
  'types',
  'engineManifest.generated',
  'EngineRegistry',
  'ReportBuilderTypes',
  'report-builder-types',
]);

/**
 * Route dispositions, from docs/CAPABILITY_TRUTH_MATRIX.md, which reads the
 * decisions in docs/product/route-dispositions.json. PR #86 seeded 47 REVIEW
 * routes and forbade them from claiming SUPPORTED; PR #87 decided all 47, so a
 * REVIEW row is now a failure in its own right: it means a route entered the
 * tree with no recorded decision.
 */
const DISPOSITIONS = ['MIGRATE', 'EXPERIMENTAL', 'REVIEW', 'RETAIN', 'RETIRED'];
const MATRIX = 'docs/CAPABILITY_TRUTH_MATRIX.md';
const ROUTE_DECISIONS = 'docs/product/route-dispositions.json';

const REQUIREMENTS_REGISTER = 'docs/discovery/requirements-register.md';
const ANNEX = 'docs/MASTER_CHECKLIST_COVERAGE.md';
const SCOPE_REGISTER = 'docs/discovery/OWNER_SCOPE_REGISTER_111_200.md';
const TASKBOARD = 'docs/TASKBOARD.md';
const DECISION_LOG = 'docs/discovery/decision-log.md';
const PLAN = 'docs/plan/COMPLETION_PLAN_86_100.md';
const SPINE_EVIDENCE = 'docs/plan/spine-evidence.json';
const GOVERNANCE_EVIDENCE = 'docs/plan/governance-evidence.json';

function die(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// ---------------------------------------------------------------------------
// Census — everything below is measured from the tree, never typed in.
// ---------------------------------------------------------------------------
function census() {
  const problems = [];
  const missing = [];
  const need = (rel) => {
    if (!existsSync(join(ROOT, rel))) {
      missing.push(rel);
      return false;
    }
    return true;
  };

  if (!need('src/App.tsx')) return { problems: [`cannot verify: src/App.tsx is missing`] };
  if (!need(REQUIREMENTS_REGISTER)) {
    return { problems: [`cannot verify: ${REQUIREMENTS_REGISTER} is missing`] };
  }
  if (!need(ANNEX)) return { problems: [`cannot verify: ${ANNEX} is missing`] };
  if (!need(SCOPE_REGISTER)) return { problems: [`cannot verify: ${SCOPE_REGISTER} is missing`] };
  if (!need(TASKBOARD)) return { problems: [`cannot verify: ${TASKBOARD} is missing`] };
  if (!need(DECISION_LOG)) return { problems: [`cannot verify: ${DECISION_LOG} is missing`] };
  if (!need('package.json')) return { problems: ['cannot verify: package.json is missing'] };
  if (!existsSync(join(ROOT, 'src', 'engines'))) {
    return { problems: ['cannot verify: src/engines is missing'] };
  }

  // routes — same pattern as scripts/generate-capability-truth-matrix.mjs
  const app = read('src/App.tsx');
  const routeRe = /<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g;
  const matrixPath = join(ROOT, MATRIX);
  const dispositions = new Map();
  if (existsSync(matrixPath)) {
    for (const line of readFileSync(matrixPath, 'utf8').split(/\r?\n/)) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      // Route ids are paths, plus the `*` catch-all: it is a route in
      // src/App.tsx and needs a disposition like any other.
      const id = /^`(\/[^`]*|\*)`$/.exec(cells[0] ?? '');
      if (!id) continue;
      const word = /\b(MIGRATE|RETAIN|EXPERIMENTAL|RETIRED|REVIEW)\b/.exec(cells[2] ?? '');
      if (word) dispositions.set(id[1], word[1]);
    }
  }
  // Spine evidence (PR #88): capability -> the tests that exercise it. The
  // manifest itself is gated by scripts/verify-spine-evidence.mjs; here the
  // register re-checks the two facts it can (file exists, title is in the file)
  // so a copied claim cannot outlive the test it names.
  const connected = new Map();
  const governed = new Map();
  const routeConnected = new Map();
  const routeGoverned = new Map();
  if (existsSync(join(ROOT, SPINE_EVIDENCE))) {
    try {
      const manifest = JSON.parse(readFileSync(join(ROOT, SPINE_EVIDENCE), 'utf8'));
      for (const [capability, claims] of Object.entries(manifest.capabilities ?? {})) {
        if (Array.isArray(claims) && claims.length > 0) connected.set(capability, claims);
      }
      for (const [routePath, entry] of Object.entries(manifest.routes ?? {})) {
        const claims = entry?.claims ?? {};
        const list = Object.values(claims).filter((c) => c && typeof c.file === 'string');
        if (list.length > 0) routeConnected.set(routePath, list);
      }
    } catch (error) {
      problems.push(`${SPINE_EVIDENCE} is not valid JSON: ${error.message}`);
    }
  }
  if (existsSync(join(ROOT, GOVERNANCE_EVIDENCE))) {
    try {
      const gov = JSON.parse(readFileSync(join(ROOT, GOVERNANCE_EVIDENCE), 'utf8'));
      for (const [capability, claims] of Object.entries(gov.capabilities ?? {})) {
        if (Array.isArray(claims) && claims.length > 0) governed.set(capability, claims);
      }
      for (const [routePath, entry] of Object.entries(gov.routes ?? {})) {
        const claims = entry?.claims ?? {};
        const list = Object.values(claims).filter((c) => c && typeof c.file === 'string');
        if (list.length > 0) routeGoverned.set(routePath, list);
      }
    } catch (error) {
      problems.push(`${GOVERNANCE_EVIDENCE} is not valid JSON: ${error.message}`);
    }
  }

  const routes = [...app.matchAll(routeRe)].map(([, path, element]) => ({
    id: `route:${path}`,
    path,
    component: [...element.matchAll(/<([A-Z]\w+)(?:\s[^>]*)?\s*\/>/g)].at(-1)?.[1] ?? 'INLINE',
    // A route the matrix does not classify has no disposition, which is itself
    // a review item — never a quiet default to "fine".
    disposition: dispositions.get(path) ?? (dispositions.size > 0 ? 'REVIEW' : undefined),
  }));
  if (routes.length === 0) problems.push('census found no <Route> entries in src/App.tsx');

  // engines
  const engines = readdirSync(join(ROOT, 'src', 'engines'))
    .filter((f) => f.endsWith('.ts'))
    .filter((f) => !/\.(test|bench|benchmark|spec)\./.test(f))
    .map((f) => basename(f, '.ts'))
    .filter((name) => !ENGINE_PLUMBING.has(name))
    .sort()
    .map((name) => ({ id: `engine:${name}`, name }));
  if (engines.length === 0) problems.push('census found no engine modules');

  // requirements — `| FR-001 | … | Partial | … |`
  const requirements = [];
  for (const line of read(REQUIREMENTS_REGISTER).split(/\r?\n/)) {
    const m = /^\|\s*((?:FR|NFR|UX|AI)-\d+)\s*\|(.*)$/.exec(line);
    if (!m) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    requirements.push({
      id: `req:${m[1]}`,
      rawStatus: cells[4] ?? '',
      criterion: cells[2] ?? '',
    });
  }
  if (requirements.length === 0) problems.push('census found no requirement rows');

  // annex — numbered rows plus the declared scope contract
  const scopeMatch = read(SCOPE_REGISTER).match(/<!-- coverage-scope: (\{.*?\}) -->/);
  let scope = null;
  if (!scopeMatch) {
    problems.push(`${SCOPE_REGISTER} has no coverage-scope contract`);
  } else {
    try {
      scope = JSON.parse(scopeMatch[1]);
      if (!Number.isSafeInteger(scope.expectedSections) || !Array.isArray(scope.sourceOwed)) {
        problems.push('coverage-scope contract is missing expectedSections/sourceOwed');
        scope = null;
      }
    } catch {
      problems.push('coverage-scope contract is not valid JSON');
    }
  }
  const annexRows = [];
  for (const line of read(ANNEX).split(/\r?\n/)) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    annexRows.push({ number: Number(cells[0]), rawStatus: cells[2] ?? '' });
  }
  const annex = [];
  if (scope) {
    const byNumber = new Map(annexRows.map((r) => [r.number, r]));
    for (let n = 1; n <= scope.expectedSections; n += 1) {
      const found = byNumber.get(n);
      annex.push({
        id: `annex:${n}`,
        number: n,
        rawStatus: scope.sourceOwed.includes(n)
          ? 'SOURCE-OWED'
          : (found?.rawStatus ?? 'UNASSESSED'),
      });
    }
  }

  // owner ids — only the §OWNER table counts
  const taskboard = read(TASKBOARD);
  const ownerSectionStart = taskboard.indexOf('\n## OWNER');
  const ownerSection =
    ownerSectionStart === -1
      ? ''
      : (taskboard.slice(ownerSectionStart + 1).split(/\n## /)[0] ?? '');
  const owners = new Map();
  for (const line of ownerSection.split(/\r?\n/)) {
    const m = /^\|\s*(O\d+)\s*\|([^|]*)\|/.exec(line);
    if (m) owners.set(m[1], m[2].trim().replace(/\s+/g, ' '));
  }
  const ownerIds = new Set(owners.keys());

  // decision ids
  const decIds = new Set(
    [...read(DECISION_LOG).matchAll(/^\|\s*(DEC-\d+)\s*\|/gm)].map((m) => m[1])
  );

  // npm scripts
  const scripts = new Set(Object.keys(JSON.parse(read('package.json')).scripts ?? {}));

  return {
    problems,
    routes,
    engines,
    requirements,
    annex,
    capabilities: CAPABILITIES.map((id) => ({
      id: `cap:${id}`,
      connected: connected.get(id) ?? [],
      governed: governed.get(id) ?? [],
    })),
    routeConnected,
    routeGoverned,
    ownerIds,
    owners,
    decIds,
    scripts,
    scope,
    counts: {
      routes: routes.length,
      engines: engines.length,
      requirements: requirements.length,
      annex: annex.length,
      capabilities: CAPABILITIES.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Seed — derive honest defaults. SUPPORTED is never derived.
// ---------------------------------------------------------------------------
function seedRows(c, existingRows) {
  /** The owner question is the taskboard's own "needed from owner" cell. */
  const ownerQuestion = (id) => {
    const need = c.owners?.get(id);
    return need ? `${need} (${id}, docs/TASKBOARD.md §OWNER)` : `Owner decision ${id} is required.`;
  };
  const existing = new Map(existingRows.map((r) => [r.id, r]));
  const keep = (id, derived) => existing.get(id) ?? derived;
  const rows = [];

  for (const route of c.routes) {
    const existingRow = existing.get(route.id);
    if (existingRow) {
      // Disposition is census-derived, not authored: keep it aligned with the
      // matrix so PR #87's sweep is visible in the register the moment it lands.
      existingRow.evidence = {
        ...existingRow.evidence,
        ...(route.disposition ? { disposition: route.disposition } : {}),
      };
    }
    const derivedRoute = {
      kind: 'route',
      id: route.id,
      status: 'EXPERIMENTAL',
      evidence: {
        gatedBy: route.path,
        ...(route.disposition ? { disposition: route.disposition } : {}),
      },
      note:
        `Routed screen (${route.component}); not graded CONNECTED or GOVERNED in ` +
        `${MATRIX}.` +
        (route.disposition === 'REVIEW'
          ? ' Disposition REVIEW — no recorded decision yet (PR #87).'
          : ''),
    };
    const conn = c.routeConnected?.get(route.path) ?? [];
    const gov = c.routeGoverned?.get(route.path) ?? [];
    if (conn.length > 0) {
      derivedRoute.evidence = {
        ...derivedRoute.evidence,
        connected: conn.map((claim) => ({ file: claim.file, title: claim.title })),
      };
      if (gov.length === 0) {
        derivedRoute.note = `CONNECTED evidence recorded (${conn.length} test id(s)); not GOVERNED — authorization, audit and entity-scope evidence is PR #89.`;
      }
    }
    if (gov.length > 0) {
      derivedRoute.evidence = {
        ...derivedRoute.evidence,
        governed: gov.map((claim) => ({ file: claim.file, title: claim.title })),
      };
      if (conn.length > 0) {
        derivedRoute.note = `CONNECTED evidence recorded (${conn.length} test id(s)); GOVERNED evidence recorded (${gov.length} test id(s)); RBAC 409=302+107, audit chain single authority, O9 boundary stated.`;
      } else {
        derivedRoute.note = `GOVERNED evidence recorded (${gov.length} test id(s)); RBAC 409=302+107, audit chain single authority, O9 boundary stated.`;
      }
    }
    rows.push(keep(route.id, derivedRoute));
  }

  for (const engine of c.engines) {
    rows.push(
      keep(engine.id, {
        kind: 'engine',
        id: engine.id,
        status: 'EXPERIMENTAL',
        evidence: { gatedBy: 'src/engines/engineManifest.generated.ts' },
        note: 'Loadable engine in the manifest; no capability claims it as supported yet.',
      })
    );
  }

  for (const req of c.requirements) {
    const raw = req.rawStatus.toLowerCase();
    const derived =
      raw.startsWith('partial') || raw.startsWith('implemented')
        ? {
            kind: 'requirement',
            id: req.id,
            status: 'EXPERIMENTAL',
            evidence: { gatedBy: REQUIREMENTS_REGISTER },
            note: `Register status "${req.rawStatus}"; not verified by this register.`,
          }
        : {
            kind: 'requirement',
            id: req.id,
            status: 'NOT_BUILT',
            evidence: { namedBy: REQUIREMENTS_REGISTER },
            note: `Register status "${req.rawStatus || 'unset'}"; nothing claims it yet.`,
          };
    rows.push(keep(req.id, derived));
  }

  for (const section of c.annex) {
    const raw = section.rawStatus.toUpperCase();
    const works = raw === 'WORKS';
    rows.push(
      keep(section.id, {
        kind: 'annex',
        id: section.id,
        status: works ? 'EXPERIMENTAL' : 'NOT_BUILT',
        evidence: works
          ? { gatedBy: `${ANNEX} row ${section.number}` }
          : { namedBy: raw === 'SOURCE-OWED' ? SCOPE_REGISTER : ANNEX },
        note:
          raw === 'SOURCE-OWED'
            ? 'Checklist section not yet assessed (SOURCE OWED); missing is not zero and not complete.'
            : `Checklist status "${section.rawStatus || 'unassessed'}".`,
      })
    );
  }

  for (const capability of CAPABILITIES) {
    const plan = CAPABILITY_SEED[capability] ?? {};
    let derived;
    if (plan.blockedBy) {
      derived = {
        kind: 'capability',
        id: `cap:${capability}`,
        status: 'BLOCKED-ON-OWNER',
        evidence: {
          owner: plan.blockedBy,
          question: ownerQuestion(plan.blockedBy),
        },
        note: 'Named in the plan as blocked on an owner decision.',
      };
    } else if (plan.route) {
      derived = {
        kind: 'capability',
        id: `cap:${capability}`,
        status: 'EXPERIMENTAL',
        evidence: { gatedBy: plan.route },
        note: 'A routed screen hosts this capability; no support claim yet (see plan §5).',
      };
    } else {
      derived = {
        kind: 'capability',
        id: `cap:${capability}`,
        status: 'NOT_BUILT',
        evidence: { namedBy: PLAN },
        note: plan.needsProof ?? 'Identified in plan §4; nothing claims it yet.',
      };
    }
    // A mapped route that the tree does not have would make the seed claim a
    // gate that does not exist. Fall back to the honest default and say so in
    // the note; the real tree is checked for these notes after seeding.
    if (plan.route && !c.routes.some((r) => r.path === plan.route)) {
      derived = {
        kind: 'capability',
        id: `cap:${capability}`,
        status: 'NOT_BUILT',
        evidence: { namedBy: PLAN },
        note: `Seed mapping expected ${plan.route}, which is not a routed screen.`,
      };
    }
    const row = keep(`cap:${capability}`, derived);
    const connectedClaims =
      c.capabilities.find((entry) => entry.id === `cap:${capability}`)?.connected ?? [];
    const governedClaims =
      c.capabilities.find((entry) => entry.id === `cap:${capability}`)?.governed ?? [];
    if (connectedClaims.length > 0) {
      row.evidence = {
        ...row.evidence,
        connected: connectedClaims.map((claim) => ({ file: claim.file, title: claim.title })),
      };
      if (governedClaims.length === 0) {
        row.note = `CONNECTED evidence recorded (${connectedClaims.length} test id(s)); not GOVERNED — authorization, audit and entity-scope evidence is PR #89.`;
      }
    }
    if (governedClaims.length > 0) {
      row.evidence = {
        ...row.evidence,
        governed: governedClaims.map((claim) => ({ file: claim.file, title: claim.title })),
      };
      if (connectedClaims.length > 0) {
        row.note = `CONNECTED evidence recorded (${connectedClaims.length} test id(s)); GOVERNED evidence recorded (${governedClaims.length} test id(s)); RBAC 409=302+107, audit chain single authority, O9 boundary stated.`;
      } else {
        row.note = `GOVERNED evidence recorded (${governedClaims.length} test id(s)); RBAC 409=302+107, audit chain single authority, O9 boundary stated.`;
      }
    }
    rows.push(row);
  }

  return rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validate(rows, c) {
  const problems = [];
  const seen = new Set();
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));

  const byKind = new Map();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || typeof row.kind !== 'string') {
      problems.push(`row without kind/id: ${JSON.stringify(row)}`);
      continue;
    }
    if (seen.has(row.id)) problems.push(`duplicate row id ${row.id}`);
    seen.add(row.id);
    byKind.set(row.kind, (byKind.get(row.kind) ?? 0) + 1);

    if (!row.status) problems.push(`${row.id}: blank status`);
    else if (!STATUSES.includes(row.status)) {
      problems.push(`${row.id}: unknown status "${row.status}"`);
      continue;
    } else counts[row.status] += 1;

    const evidence = row.evidence ?? {};
    const str = (v) => typeof v === 'string' && v.trim().length > 0;

    if (evidence.disposition !== undefined) {
      if (!DISPOSITIONS.includes(evidence.disposition)) {
        problems.push(
          `${row.id}: unknown disposition "${evidence.disposition}" (allowed: ${DISPOSITIONS.join(', ')})`
        );
      } else if (evidence.disposition === 'REVIEW') {
        // PR #87 decided every route, so REVIEW is no longer a resting state:
        // it means a route (or a newly added one) has no recorded decision.
        // Failing here is the ratchet — a new route cannot enter the tree
        // unclassified, and a decided route cannot quietly slide back.
        problems.push(
          `${row.id}: disposition REVIEW — no recorded decision; decide it in ${ROUTE_DECISIONS}`
        );
      }
    }

    // Spine CONNECTED evidence (PR #88): every cited test must still exist and
    // still carry the cited title. This is the register's own copy of the check
    // scripts/verify-spine-evidence.mjs makes, so a stale claim fails here even
    // if the manifest is edited without the gate being run.
    if (evidence.connected !== undefined) {
      if (!Array.isArray(evidence.connected) || evidence.connected.length === 0) {
        problems.push(`${row.id}: connected evidence must be a non-empty list`);
      } else {
        for (const claim of evidence.connected) {
          if (!str(claim?.file) || !existsSync(join(ROOT, claim.file))) {
            problems.push(`${row.id}: connected test ${claim?.file} does not exist`);
            continue;
          }
          if (!str(claim?.title) || !read(claim.file).includes(claim.title)) {
            problems.push(`${row.id}: ${claim.file} has no test titled "${claim?.title}"`);
          }
        }
      }
    }
    // Spine GOVERNED evidence (PR #89): same discipline as CONNECTED — file exists,
    // title appears verbatim, file is a test file, not the page it grades.
    if (evidence.governed !== undefined) {
      if (!Array.isArray(evidence.governed) || evidence.governed.length === 0) {
        problems.push(`${row.id}: governed evidence must be a non-empty list`);
      } else {
        for (const claim of evidence.governed) {
          if (!str(claim?.file) || !existsSync(join(ROOT, claim.file))) {
            problems.push(`${row.id}: governed test ${claim?.file} does not exist`);
            continue;
          }
          if (!str(claim?.title) || !read(claim.file).includes(claim.title)) {
            problems.push(`${row.id}: ${claim.file} has no test titled "${claim?.title}"`);
          }
        }
      }
    }

    switch (row.status) {
      case 'SUPPORTED': {
        const tests = evidence.tests;
        if (!Array.isArray(tests) || tests.length === 0) {
          problems.push(`${row.id}: SUPPORTED requires at least one test id`);
        } else {
          for (const test of tests) {
            if (!str(test) || !existsSync(join(ROOT, test))) {
              problems.push(`${row.id}: test id "${test}" does not exist`);
            } else if (!/\.(test|spec)\.tsx?$/.test(test)) {
              problems.push(`${row.id}: test id "${test}" is not a test file`);
            }
          }
        }
        if (!str(evidence.gate)) problems.push(`${row.id}: SUPPORTED requires a gate command`);
        else if (!c.scripts.has(evidence.gate)) {
          problems.push(`${row.id}: gate "${evidence.gate}" is not an npm script`);
        }
        if (!str(evidence.doc)) problems.push(`${row.id}: SUPPORTED requires a doc link`);
        else if (!existsSync(join(ROOT, evidence.doc))) {
          problems.push(`${row.id}: doc "${evidence.doc}" does not exist`);
        }
        break;
      }
      case 'EXPERIMENTAL':
        if (!str(evidence.gatedBy)) {
          problems.push(`${row.id}: EXPERIMENTAL requires the route/flag/module that gates it`);
        }
        break;
      case 'BLOCKED-ON-OWNER':
        if (!str(evidence.owner)) problems.push(`${row.id}: BLOCKED-ON-OWNER requires an owner id`);
        else if (!c.ownerIds.has(evidence.owner)) {
          problems.push(`${row.id}: ${evidence.owner} is not in the owner table`);
        }
        if (!str(evidence.question)) {
          problems.push(`${row.id}: BLOCKED-ON-OWNER requires the question being blocked`);
        }
        break;
      case 'RETIRED':
        if (!str(evidence.decision)) problems.push(`${row.id}: RETIRED requires a decision id`);
        else if (!c.decIds.has(evidence.decision)) {
          problems.push(`${row.id}: ${evidence.decision} is not in the decision log`);
        }
        if (!str(evidence.commit)) problems.push(`${row.id}: RETIRED requires a removal commit`);
        else if (existsSync(join(ROOT, '.git'))) {
          try {
            execFileSync('git', ['rev-parse', '--verify', `${evidence.commit}^{commit}`], {
              cwd: ROOT,
              stdio: 'ignore',
            });
          } catch {
            problems.push(`${row.id}: commit ${evidence.commit} does not resolve`);
          }
        }
        break;
      case 'NOT_BUILT':
        if (!str(evidence.namedBy)) {
          problems.push(`${row.id}: NOT_BUILT requires a namedBy row or document`);
        } else if (
          evidence.namedBy.includes('/') &&
          !existsSync(join(ROOT, evidence.namedBy.split(' row ')[0]))
        ) {
          problems.push(`${row.id}: namedBy "${evidence.namedBy}" does not resolve`);
        }
        break;
    }
  }

  // census agreement — both directions
  const censusIds = [
    ...c.routes.map((r) => r.id),
    ...c.engines.map((e) => e.id),
    ...c.requirements.map((r) => r.id),
    ...c.annex.map((a) => a.id),
    ...c.capabilities.map((x) => x.id),
  ];
  for (const id of censusIds) {
    if (!seen.has(id)) problems.push(`no register row for ${id}`);
  }
  const censusSet = new Set(censusIds);
  for (const id of seen) {
    if (!censusSet.has(id)) problems.push(`${id} is not in the census (deleted item or typo)`);
  }

  // every domain of the plan must be represented
  for (const domain of Object.keys(DOMAINS)) {
    const present = [...seen].some((id) => id.startsWith(`cap:${domain}.`));
    if (!present) problems.push(`domain "${domain}" has no capability row`);
  }

  return { problems, counts };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function evidenceText(evidence) {
  return Object.entries(evidence ?? {})
    .map(([k, v]) => {
      if (k === 'connected') {
        // A count plus the files, not an array dump: the claim is "these tests
        // exercise it", and the file names are what a reader can go and run.
        const files = (v ?? []).map((claim) => claim.file);
        return `connected=${files.length} [${files.join(' ')}]`;
      }
      if (k === 'governed') {
        const files = (v ?? []).map((claim) => claim.file);
        return `governed=${files.length} [${files.join(' ')}]`;
      }
      return `${k}=${Array.isArray(v) ? v.join(' ') : String(v)}`;
    })
    .join('; ');
}

function render(rows, c, counts) {
  const order = ['route', 'engine', 'requirement', 'annex', 'capability'];
  const label = {
    route: 'Routed screens',
    engine: 'Engines',
    requirement: 'Requirements',
    annex: 'Checklist sections',
    capability: 'Vision capabilities',
  };
  const out = [];
  out.push(START);
  out.push('');
  out.push('## Summary');
  out.push('');
  out.push('| Measure | Value |');
  out.push('| --- | --- |');
  for (const status of STATUSES) out.push(`| ${status} | ${counts[status]} |`);
  out.push(`| Total rows | ${rows.length} |`);
  out.push('');
  const reviewCount = rows.filter((r) => r.evidence?.disposition === 'REVIEW').length;
  if (reviewCount > 0 || rows.some((r) => r.evidence?.disposition)) {
    out.push('| Route disposition | Count |');
    out.push('| --- | --- |');
    for (const disposition of DISPOSITIONS) {
      out.push(
        `| ${disposition} | ${rows.filter((r) => r.evidence?.disposition === disposition).length} |`
      );
    }
    out.push('');
  }
  out.push('| Census | Count |');
  out.push('| --- | --- |');
  for (const [key, value] of Object.entries(c.counts)) out.push(`| ${key} | ${value} |`);
  out.push('');
  for (const kind of order) {
    const group = rows.filter((r) => r.kind === kind);
    if (group.length === 0) continue;
    out.push(`## ${label[kind]} (${group.length})`);
    out.push('');
    out.push('| Id | Status | Evidence | Note |');
    out.push('| --- | --- | --- | --- |');
    for (const row of group) {
      const note = (row.note ?? '').replace(/\|/g, '\\|');
      out.push(`| \`${row.id}\` | ${row.status} | ${evidenceText(row.evidence)} | ${note} |`);
    }
    out.push('');
  }
  out.push(END);
  return out.join('\n');
}

function viewDocument(block) {
  return `# Completion register

> **Generated — do not edit.** Source of truth: docs/plan/completion-register.json.
> Renderer and gate: \`node scripts/completion-register.mjs\` (\`--check\` in \`npm run docs:verify\`).
> Vocabulary and rules: docs/plan/COMPLETION_PLAN_86_100.md §3, adopted in DEC-058.

A row saying SUPPORTED means a test fails when the behaviour breaks, a gate is
named, and a document explains it. A row saying BLOCKED-ON-OWNER names the owner
question that stops it. Nothing here is promoted by prose.

${block}
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const c = census();
if (c.problems?.some((p) => p.startsWith('cannot verify'))) {
  die(2, `✗ completion register: ${c.problems.join('; ')}`);
}

const committed = existsSync(REGISTER_JSON)
  ? JSON.parse(readFileSync(REGISTER_JSON, 'utf8'))
  : { schema: 1, rows: [] };
const committedRows = Array.isArray(committed.rows) ? committed.rows : [];

let rows;
if (SEED) {
  rows = seedRows(c, committedRows);
} else {
  rows = committedRows;
  if (rows.length === 0) {
    die(
      2,
      '✗ completion register: docs/plan/completion-register.json is missing or empty — run --seed'
    );
  }
}

const { problems, counts } = validate(rows, c);
if (c.problems?.length) problems.unshift(...c.problems);
if (problems.length > 0) {
  process.stderr.write(
    `✗ completion register: ${problems.length} problem(s)\n${problems
      .map((p) => `  - ${p}`)
      .join('\n')}\n`
  );
  process.exit(1);
}

const block = render(rows, c, counts);
const document = viewDocument(block);

if (SEED) {
  mkdirSync(dirname(REGISTER_JSON), { recursive: true });
  writeFileSync(
    REGISTER_JSON,
    `${JSON.stringify(
      {
        schema: 1,
        source: PLAN,
        vocabulary: STATUSES,
        census: c.counts,
        rows,
      },
      null,
      2
    )}\n`
  );
  writeFileSync(REGISTER_VIEW, document);
  process.stdout.write(
    `✓ completion register seeded: ${rows.length} rows (${STATUSES.map((s) => `${s} ${counts[s]}`).join(', ')})\n`
  );
  process.exit(0);
}

if (RELEASE) {
  const blocking = rows.filter((r) => r.status !== 'SUPPORTED' && r.status !== 'RETIRED');
  if (blocking.length > 0) {
    process.stderr.write(
      `✗ completion register: release contract C1 requires every row SUPPORTED or RETIRED; ` +
        `${blocking.length} row(s) are not.\n` +
        `  first: ${blocking
          .slice(0, 10)
          .map((r) => `${r.id}=${r.status}`)
          .join(', ')}\n`
    );
    process.exit(1);
  }
}

const current = existsSync(REGISTER_VIEW) ? readFileSync(REGISTER_VIEW, 'utf8') : '';
if (current !== document) {
  if (CHECK) {
    die(
      1,
      '✗ completion register: rendered view is stale — run `npm run completion:register` and commit the result'
    );
  }
  writeFileSync(REGISTER_VIEW, document);
  process.stdout.write('✓ completion register: view re-rendered\n');
}

const reviewCount = rows.filter((r) => r.evidence?.disposition === 'REVIEW').length;
process.stdout.write(
  `✓ completion register: ${rows.length} rows · ${STATUSES.map((s) => `${s} ${counts[s]}`).join(' · ')}` +
    (rows.some((r) => r.evidence?.disposition) ? ` · disposition REVIEW ${reviewCount}` : '') +
    `\n`
);
