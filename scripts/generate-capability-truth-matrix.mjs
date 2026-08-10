#!/usr/bin/env node
/**
 * Produces a reproducible static-evidence inventory for FinPlan Pro.
 *
 * Important: source presence and a colocated test are not proof of integration,
 * governance, or enterprise readiness. Those statuses remain UNVERIFIED until
 * a human-reviewed evidence record links contract, E2E, authorization, audit,
 * performance, accessibility, and operational checks.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'docs', 'CAPABILITY_TRUTH_MATRIX.md');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function sourceFiles(directory, extensions) {
  return walk(join(root, directory))
    .filter((file) => extensions.includes(extname(file)))
    .filter((file) => !file.includes('/__tests__/') && !/\.(test|spec)\.[jt]sx?$/.test(file))
    .sort();
}

function titleCase(value) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const allFiles = walk(join(root, 'src'));
function hasTestFor(file) {
  const basename = file.slice(0, file.length - extname(file).length);
  const name = basename.split('/').at(-1);
  const sameDirectory = [
    `${basename}.test.ts`,
    `${basename}.test.tsx`,
    `${basename}.spec.ts`,
    `${basename}.spec.tsx`,
  ];
  return sameDirectory.some(existsSync) || allFiles.some((candidate) =>
    candidate.endsWith(`/${name}.test.ts`) ||
    candidate.endsWith(`/${name}.test.tsx`) ||
    candidate.endsWith(`/${name}.spec.ts`) ||
    candidate.endsWith(`/${name}.spec.tsx`)
  );
}

function evidenceStatus(file) {
  return hasTestFor(file) ? 'BUILT — TEST EVIDENCE' : 'BUILT — TEST NOT FOUND';
}

function moduleClassification(file, area) {
  const path = relative(root, file).toLowerCase();
  const has = (pattern) => pattern.test(path);

  if (area === 'page') {
    if (has(/pages\/(budgets|forecasts|scenarios|variance|analytics|workforce|templates)/))
      return ['Modeling', 'MIGRATE — canonical modeling pattern', 'FP&A product owner'];
    if (has(/pages\/(consolidation|currency|cash|treasury|data|periods|accounting)/))
      return ['Close', 'MIGRATE — close / data-control pattern', 'Controller product owner'];
    if (has(/pages\/reports/)) return ['Reporting', 'MIGRATE — report / board-pack pattern', 'Reporting product owner'];
    if (has(/pages\/(sector|sectors|saas|retail|energy|healthcare|banking|manufacturing|realestate|insurance|logistics|government|education|construction|hospitality|telecom)/))
      return ['Vertical', 'EXPERIMENTAL — certify or retire', 'Vertical portfolio owner'];
    if (has(/pages\/(auth|settings|admin|plugins|docs|audit)/)) return ['Admin', 'MIGRATE — admin/evidence pattern', 'Platform product owner'];
    if (has(/pages\/ai/)) return ['AI', 'EXPERIMENTAL — governed AI validation', 'AI governance owner'];
    return ['Workspace', 'MIGRATE — workspace/support pattern', 'Finance product owner'];
  }

  if (area === 'engine') {
    if (has(/consolidation|currency|fx|intercompany|reconciliation|close/)) return ['Close calculation', 'RETAIN — characterize and govern', 'Controller domain owner'];
    if (has(/formula|budget|forecast|scenario|planning|driver|allocation/)) return ['Planning calculation', 'RETAIN — characterize and govern', 'FP&A domain owner'];
    if (has(/ai|copilot|nlq|anomaly/)) return ['AI calculation', 'EXPERIMENTAL — governed AI validation', 'AI governance owner'];
    return ['Financial calculation', 'RETAIN — characterize and govern', 'Finance engineering owner'];
  }

  if (area === 'store') return ['Client state', 'REVIEW — authority boundary required', 'Frontend platform owner'];
  if (area === 'service') return ['Application service', 'REVIEW — authority and audit evidence required', 'Platform engineering owner'];
  if (area === 'component') {
    if (has(/components\/(ui|layout|errors|system)/)) return ['Shared experience', 'RETAIN — Atlas certification required', 'Design system owner'];
    if (has(/components\/(spreadsheet|budgets|scenarios|workflow|finance)/)) return ['Finance experience', 'MIGRATE — canonical workflow pattern', 'FP&A product owner'];
    if (has(/components\/(audit|consolidation|currency|data)/)) return ['Control experience', 'MIGRATE — evidence/control pattern', 'Controller product owner'];
    return ['Domain experience', 'REVIEW — disposition required', 'Finance product owner'];
  }
  return ['Unclassified', 'REVIEW — disposition required', 'Unassigned'];
}

function matrixRows(files, area) {
  return files.map((file) => {
    const path = relative(root, file).replaceAll('|', '\\|');
    const [category, disposition, owner] = moduleClassification(file, area);
    return `| ${titleCase(file.split('/').at(-1).replace(extname(file), ''))} | ${category} | ${disposition} | ${owner} | \`${path}\` | ${evidenceStatus(file)} | UNVERIFIED | UNVERIFIED | UNVERIFIED | Static inventory only; see evidence protocol. |`;
  });
}

function routeDisposition(route) {
  if (['/', '/dashboard'].includes(route)) return ['Workspace', 'MIGRATE — Decision Workspace', 'CFO / FP&A product owner'];
  if (/^\/(budgets|forecasts|scenarios|variance|analytics|ai|workforce|templates)/.test(route)) return ['Modeling', 'MIGRATE — canonical modeling pattern', 'FP&A product owner'];
  if (/^\/(consolidation|currency|cash|treasury|data\/(gl|trial|journals|account)|periods)/.test(route)) return ['Close', 'MIGRATE — Close / treasury pattern', 'Controller product owner'];
  if (/^\/(reports|charts)/.test(route)) return ['Reporting', 'MIGRATE — report / board-pack pattern', 'Reporting product owner'];
  if (/^\/(settings|admin|plugins|docs|audit|profile)/.test(route)) return ['Admin', 'MIGRATE — admin/evidence pattern', 'Platform product owner'];
  if (/^\/(sector|sectors|agriculture|banking|construction|education|energy|government|healthcare|hospitality|insurance|logistics|manufacturing|realestate|retail|saas|technology|telecom)/.test(route)) return ['Vertical', 'EXPERIMENTAL — certify or retire', 'Vertical portfolio owner'];
  if (/^\/(login|register|forgot-password|onboarding)/.test(route)) return ['Identity', 'RETAIN — migrate to enterprise auth', 'Platform product owner'];
  if (/^\/(collaboration|help|drill-down)/.test(route)) return ['Supporting', 'MIGRATE — supporting journey pattern', 'Platform product owner'];
  return ['Unclassified', 'REVIEW — disposition required', 'Unassigned'];
}

function routeRows() {
  const appPath = join(root, 'src', 'App.tsx');
  const app = readFileSync(appPath, 'utf8');
  const imports = new Map();
  const importPattern = /const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;
  for (const match of app.matchAll(importPattern)) {
    imports.set(match[1], match[2]);
  }
  const routes = [];
  // Supports direct route elements and elements wrapped in ErrorBoundary.
  // The final self-closing PascalCase element is the routed screen component.
  const routePattern = /<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g;
  for (const match of app.matchAll(routePattern)) {
    const [, route, element] = match;
    const componentMatches = [...element.matchAll(/<([A-Z]\w+)(?:\s[^>]*)?\s*\/>/g)];
    const component = componentMatches.at(-1)?.[1] ?? 'INLINE / WRAPPED';
    const importPath = imports.get(component);
    const candidates = importPath
      ? ['.tsx', '.ts', '/index.tsx', '/index.ts'].map((suffix) => join(root, 'src', `${importPath.replace(/^\.\//, '')}${suffix}`))
      : [];
    const source = candidates.find(existsSync);
    const sourceDisplay = source ? `\`${relative(root, source)}\`` : importPath ? `MISSING: \`src/${importPath}\`` : 'INLINE / WRAPPED';
    const staticStatus = source ? evidenceStatus(source) : importPath ? 'MISSING' : 'BUILT — INLINE / WRAPPED';
    const [pillar, disposition, owner] = routeDisposition(route);
    routes.push(`| \`${route}\` | ${pillar} | ${disposition} | ${owner} | ${component} | ${sourceDisplay} | ${staticStatus} | UNVERIFIED | UNVERIFIED | UNVERIFIED | Route evidence only; execute journey review. |`);
  }
  return routes;
}

const generatedAt = 'from current working tree';
const pages = sourceFiles('src/pages', ['.ts', '.tsx']);
const engines = sourceFiles('src/engines', ['.ts']);
const stores = sourceFiles('src/store', ['.ts']);
const components = sourceFiles('src/components', ['.ts', '.tsx']);
// First-party API clients live in `src/api` (e.g., the Control-Plane command
// client); third-party connector clients live in `src/services/api-integration`.
// Both are service modules for inventory purposes.
const services = [
  ...sourceFiles('src/services', ['.ts', '.tsx']),
  ...sourceFiles('src/api', ['.ts', '.tsx']),
];

const content = `# FinPlan Pro — Capability Truth Matrix\n\n> **Generated:** ${generatedAt}\n> **Generator:** \`node scripts/generate-capability-truth-matrix.mjs\`\n> **Purpose:** A reproducible, route-by-route and module-by-module static evidence baseline for the zero-compromise roadmap.\n\n## Read this before using the matrix\n\nThis document is intentionally conservative. It records what the checked-out source tree can prove mechanically: a route/module source file exists and whether a conventionally named colocated test was found. It **does not** infer a feature is connected to authoritative data, governed by policy, or enterprise-ready. Those claims require the linked evidence defined below.\n\n| Maturity | Meaning | Evidence required before status may be set |\n|---|---|---|\n| **BUILT** | Source exists. | Source path and owner. |\n| **CONNECTED** | Uses real domain contract/data and handles loading, empty, error, and stale/offline states. | Integration test or E2E run, data contract, screenshots/trace. |\n| **GOVERNED** | Server-side authorization, validation, audit, tenant/entity scope, lifecycle/version rules are enforced. | API/authz tests, audit record, policy reference, threat-model check. |\n| **ENTERPRISE-READY** | Governed and operationally fit for a supported customer workflow. | Performance, accessibility, observability, backup/rollback, runbook, security, and customer acceptance evidence. |\n\n**Rules:** A blank or \`UNVERIFIED\` value is not a failure; it is a prohibition on claiming that maturity. Generated accountable roles are governance placeholders, not invented named owners; a named owner must be assigned in the delivery system before a capability can be promoted. \`BUILT — TEST NOT FOUND\` means no conventionally named test was found by this generator; it does not prove no test exists.\n\n## Completion protocol\n\nFor every row, create a tracked evidence record in the delivery system with: owner; target persona/job; data source; API/command; authorization policy; audit event; test IDs; a11y test; performance budget; operational runbook; customer acceptance result; and review date. Update the four maturity columns only through a human-approved BMAD gate.\n\n## Inventory summary\n\n| Inventory | Count |\n|---|---:|\n| Routed screens found in \`src/App.tsx\` | ${routeRows().length} |\n| Page modules | ${pages.length} |\n| Engine modules | ${engines.length} |\n| State-store modules | ${stores.length} |\n| UI component modules | ${components.length} |\n| Service modules | ${services.length} |\n\n## Route-by-route inventory\n\n**Disposition policy:** \`MIGRATE\` means the route moves into its named canonical pattern; \`RETAIN\` means functionality remains but adopts the enterprise auth/shell contract; \`EXPERIMENTAL\` means it cannot be marketed as supported until certified or is retired; \`REVIEW\` is a release blocker for that route. Role ownership is an accountable role placeholder until a named owner is appointed.\n\n| Route | Pillar | Disposition | Accountable role | Route component | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |\n|---|---|---|---|---|---|---|---|---|---|---|\n${routeRows().join('\n')}\n\n## Page module inventory\n\n| Module | Category | Disposition | Accountable role | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |\n|---|---|---|---|---|---|---|---|---|---|\n${matrixRows(pages, 'page').join('\n')}\n\n## Financial engine inventory\n\n| Module | Category | Disposition | Accountable role | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |\n|---|---|---|---|---|---|---|---|---|---|\n${matrixRows(engines, 'engine').join('\n')}\n\n## State-store inventory\n\n| Module | Category | Disposition | Accountable role | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |\n|---|---|---|---|---|---|---|---|---|---|\n${matrixRows(stores, 'store').join('\n')}\n\n## UI component inventory\n\n| Module | Category | Disposition | Accountable role | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |\n|---|---|---|---|---|---|---|---|---|---|\n${matrixRows(components, 'component').join('\n')}\n\n## Service module inventory\n\n| Module | Category | Disposition | Accountable role | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |\n|---|---|---|---|---|---|---|---|---|---|\n${matrixRows(services, 'service').join('\n')}\n\n## Manual audit queue\n\n1. Start with the five core enterprise journeys in \`docs/ZERO_COMPROMISE_PRODUCT_BLUEPRINT.md\` §1.4: Close, Plan, Decide, Report, and Operate.\n2. For every route in those journeys, establish connected/governed/enterprise-ready evidence before auditing secondary screens.\n3. Consolidate duplicate/legacy sector routes before assigning enterprise maturity; a duplicate route is not additional product depth.\n4. Re-run this generator whenever route/module structure changes. Review and approve status changes at the relevant BMAD gate.\n`;

writeFileSync(output, content);
console.log(`Wrote ${relative(root, output)} (${content.split('\n').length} lines).`);
