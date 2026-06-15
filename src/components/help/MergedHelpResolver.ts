/**
 * MergedHelpResolver - Merge Mnemosyne's PAGE_HELP and Athena's ROUTE_HELP_DOCS
 * Built by HERMES (P1-A HelpPanel Integration, 2026-06-15)
 *
 * Source data:
 *  - PAGE_HELP (src/pages/_docs.ts, Mnemosyne): 17 hand-crafted rich entries
 *  - ROUTE_HELP_DOCS (src/pages/_routeHelpMap.ts, Athena): 95 entries mapping
 *    routes to canonical Part documentation files
 *
 * Precedence rules:
 *  1. Exact match in PAGE_HELP wins (rich, hand-crafted content)
 *  2. Exact match in ROUTE_HELP_DOCS (synthesized from Part ref)
 *  3. Wildcard family match in ROUTE_HELP_DOCS (e.g. /forecasts/abc -> /forecasts/*)
 *  4. null (caller decides whether to show "no help" UI)
 *
 * Why side-car merge (not replace)?
 *  - Per Athena's Phase 9 hand-off: "side-car to PAGE_HELP — do NOT replace"
 *  - Preserves both data sources independently
 *  - Mnemosyne can keep enriching PAGE_HELP without touching this file
 *  - Athena can add routes to ROUTE_HELP_DOCS without touching this file
 */

import { PAGE_HELP, type PageHelpDef } from '@/pages/_docs';
import { getRouteHelpDoc, type RouteHelpDoc } from '@/pages/_routeHelpMap';

export interface MergedHelp {
  title: string;
  sections: { title: string; content: string }[];
  source: 'page_help' | 'route_help';
  partRef: number | null;
  routeRef: string | null;
}

const NO_HELP: MergedHelp = {
  title: 'No help available',
  sections: [
    {
      title: 'No documentation found',
      content:
        'No help documentation is mapped to this route yet. The documentation team is working on coverage for all 192 routes. Check back soon.',
    },
  ],
  source: 'page_help',
  partRef: null,
  routeRef: null,
};

/**
 * Build a MergedHelp from an exact match in PAGE_HELP.
 * PageHelpDef.sections[].example is dropped (HelpPanel only renders title + content).
 */
function fromPageHelp(route: string, def: PageHelpDef): MergedHelp {
  return {
    title: def.title,
    sections: def.sections.map((s) => ({
      title: s.title,
      content: s.content,
    })),
    source: 'page_help',
    partRef: null,
    routeRef: route,
  };
}

/**
 * Build a MergedHelp from a ROUTE_HELP_DOCS match (exact or wildcard).
 * Synthesizes a single-section help from the Part reference.
 */
function fromRouteHelp(route: string, doc: RouteHelpDoc): MergedHelp {
  const refLabel = doc.part !== null ? `Part ${doc.part}` : 'Documentation';
  const fileLabel = doc.file ? ` (${doc.file})` : '';
  return {
    title: doc.title,
    sections: [
      {
        title: `${refLabel}${fileLabel}`,
        content: `See ${refLabel}: ${doc.title}. File: ${doc.path || 'docs/parts/' + (doc.file || 'index.md')}`,
      },
    ],
    source: 'route_help',
    partRef: doc.part,
    routeRef: route,
  };
}

/**
 * Resolve help content for a given route.
 * Returns null only if the route has no mapping in either source.
 * Returns NO_HELP synthetic object for unknown routes (so the panel can show "no docs" UI).
 *
 * @param route - The current pathname (e.g. '/budgets', '/budgets/create')
 * @returns MergedHelp with title + sections + provenance metadata
 */
export function getMergedHelp(route: string): MergedHelp | null {
  if (!route) return null;

  // Rule 1: exact match in PAGE_HELP (Mnemosyne's hand-crafted content)
  const pageHelpEntry = PAGE_HELP[route];
  if (pageHelpEntry) {
    return fromPageHelp(route, pageHelpEntry);
  }

  // Rule 2 + 3: exact match OR wildcard family match in ROUTE_HELP_DOCS (Athena's data)
  // getRouteHelpDoc handles both internally.
  const routeHelp = getRouteHelpDoc(route);
  if (routeHelp && routeHelp.part !== null) {
    return fromRouteHelp(route, routeHelp);
  }

  // Rule 4: known null (auth route) or unknown — return null so caller can skip render
  if (routeHelp && routeHelp.part === null) {
    return null; // auth route — no help
  }

  // Unknown route — return NO_HELP so the panel can show "no docs" UI
  return NO_HELP;
}

/**
 * Check whether help content is available for a route.
 * Returns true if PAGE_HELP or ROUTE_HELP_DOCS has any match (exact or wildcard).
 * Returns false for auth routes and unknown routes.
 */
export function hasMergedHelp(route: string): boolean {
  if (!route) return false;
  if (PAGE_HELP[route]) return true;
  const doc = getRouteHelpDoc(route);
  return doc !== null && doc.part !== null;
}

/**
 * Build a runtime stats snapshot for the merge (useful for diagnostics + HelpPanel "i" badge).
 */
export function getMergedHelpStats() {
  const pageHelpKeys = Object.keys(PAGE_HELP);
  return {
    pageHelpCount: pageHelpKeys.length,
    // getRouteHelpStats from Athena's _routeHelpMap
    routeHelpCount: getRouteHelpDoc('/') !== null ? 'see getRouteHelpStats()' : 0,
  };
}
