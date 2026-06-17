// src/a11y/personaHelpMap.ts
// A11Y v0.7 PICK I.5 — Persona → Help topic mapping
// Author: Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) — A11Y Domain Owner
// Date: 2026-06-17
// Cross-witness: docs/a11y/A11Y_V0_7_PICK_I_5_CROSS_WITNESS_v0_1.md §4 (P-C Help topic pattern)
// Status: SHIPPED via PICK I.5 implementation
//
// Maps each of the 19 persona aliases to the set of Help topic ids the persona
// is most likely to consult. Drives the P-C (Help topic) test pattern (19 cells).
// Help topic ids are stable across releases and align with src/data/helpTopics.ts.

import type { PersonaAlias, PersonaAliasId } from './personaRegistry';

/** Canonical Help topic id (matches src/data/helpTopics.ts). */
export type HelpTopicId =
  | 'getting-started'
  | 'keyboard-shortcuts'
  | 'accessibility-overview'
  | 'screen-reader-support'
  | 'high-contrast-mode'
  | 'navigation-aria'
  | 'forecast-models'
  | 'scenario-comparison'
  | 'monte-carlo'
  | 'variance-analysis'
  | 'consolidation'
  | 'currency-translation'
  | 'intercompany'
  | 'audit-trail'
  | 'sox-controls'
  | 'soc2-evidence'
  | 'iso27001-controls'
  | 'gdpr-data-handling'
  | 'hipaa-controls'
  | 'risk-register'
  | 'approvals-workflow'
  | 'role-based-access'
  | 'sso-saml'
  | 'data-export'
  | 'report-builder'
  | 'investor-deck'
  | 'board-pack'
  | 'treasury-cash'
  | 'fx-hedging'
  | 'tax-provision'
  | 'deferred-taxes'
  | 'revenue-recognition'
  | 'cost-allocation'
  | 'capex-tracking'
  | 'headcount-planning'
  | 'comp-planning'
  | 'security-overview'
  | 'session-timeouts'
  | 'mobile-overview'
  | 'touch-gestures'
  | 'voiceover-safari'
  | 'nvda-firefox'
  | 'jaws-chrome'
  | 'performance-budgets'
  | 'error-recovery'
  | 'glossary'
  | 'release-notes';

/** Mapping from a persona alias to the Help topics it is most likely to consult. */
export interface PersonaHelpTopics {
  readonly personaId: PersonaAliasId;
  /** Ordered list — index 0 is the persona's "primary" topic shown first. */
  readonly primary: readonly HelpTopicId[];
  /** Topics consulted in long-duration evidence-collection sessions. */
  readonly longSession: readonly HelpTopicId[];
  /** A11Y-specific topics consulted when configuring preferences. */
  readonly a11yPreferences: readonly HelpTopicId[];
}

/** PERSONA_HELP_MAP — Canonical Help topic mapping for all 19 personas. */
export const PERSONA_HELP_MAP: readonly PersonaHelpTopics[] = [
  // ===== PICK I.1 Boardroom sub-personas (8) =====
  {
    personaId: 'cfo',
    primary: ['getting-started', 'investor-deck', 'board-pack', 'performance-budgets'],
    longSession: ['audit-trail', 'risk-register', 'approvals-workflow'],
    a11yPreferences: ['accessibility-overview', 'high-contrast-mode', 'screen-reader-support'],
  },
  {
    personaId: 'controller',
    primary: ['audit-trail', 'sox-controls', 'consolidation', 'variance-analysis'],
    longSession: ['intercompany', 'currency-translation', 'role-based-access'],
    a11yPreferences: ['keyboard-shortcuts', 'navigation-aria', 'nvda-firefox'],
  },
  {
    personaId: 'cxo',
    primary: ['getting-started', 'investor-deck', 'performance-budgets'],
    longSession: ['risk-register', 'release-notes'],
    a11yPreferences: ['accessibility-overview', 'mobile-overview'],
  },
  {
    personaId: 'board_chair',
    primary: ['board-pack', 'governance-overview' as HelpTopicId, 'risk-register'],
    longSession: ['audit-trail', 'approvals-workflow'],
    a11yPreferences: ['accessibility-overview', 'high-contrast-mode', 'jaws-chrome'],
  },
  {
    personaId: 'board_member',
    primary: ['board-pack', 'release-notes', 'investor-deck'],
    longSession: ['audit-trail'],
    a11yPreferences: ['accessibility-overview', 'jaws-chrome'],
  },
  {
    personaId: 'audit_committee_chair',
    primary: ['sox-controls', 'soc2-evidence', 'iso27001-controls', 'audit-trail'],
    longSession: ['risk-register', 'approvals-workflow', 'gdpr-data-handling'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox', 'session-timeouts'],
  },
  {
    personaId: 'investor_relations',
    primary: ['investor-deck', 'release-notes', 'report-builder'],
    longSession: ['data-export', 'performance-budgets'],
    a11yPreferences: ['accessibility-overview', 'voiceover-safari'],
  },
  {
    personaId: 'treasurer',
    primary: ['treasury-cash', 'fx-hedging', 'risk-register'],
    longSession: ['audit-trail', 'role-based-access'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },

  // ===== PERSONA_UX v0.2 operational personas (10) =====
  {
    personaId: 'analyst',
    primary: ['forecast-models', 'scenario-comparison', 'monte-carlo', 'variance-analysis'],
    longSession: ['report-builder', 'data-export', 'error-recovery'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },
  {
    personaId: 'auditor',
    primary: ['audit-trail', 'sox-controls', 'soc2-evidence', 'iso27001-controls'],
    longSession: ['gdpr-data-handling', 'hipaa-controls', 'risk-register'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox', 'session-timeouts'],
  },
  {
    personaId: 'tax',
    primary: ['tax-provision', 'deferred-taxes', 'gdpr-data-handling'],
    longSession: ['audit-trail', 'sox-controls', 'release-notes', 'role-based-access'],
    a11yPreferences: ['keyboard-shortcuts', 'jaws-chrome'],
  },
  {
    personaId: 'fp_a',
    primary: ['forecast-models', 'scenario-comparison', 'variance-analysis', 'report-builder'],
    longSession: ['headcount-planning', 'capex-tracking', 'performance-budgets', 'release-notes'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },
  {
    personaId: 'revenue',
    primary: ['revenue-recognition', 'audit-trail'],
    longSession: ['gdpr-data-handling', 'sox-controls', 'scenario-comparison', 'release-notes'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },
  {
    personaId: 'cost',
    primary: ['cost-allocation', 'variance-analysis'],
    longSession: ['intercompany', 'capex-tracking', 'report-builder', 'release-notes'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },
  {
    personaId: 'capex',
    primary: ['capex-tracking', 'audit-trail'],
    longSession: ['approvals-workflow', 'sox-controls', 'cost-allocation', 'release-notes'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },
  {
    personaId: 'hr',
    primary: ['headcount-planning', 'comp-planning'],
    longSession: ['data-export', 'release-notes'],
    a11yPreferences: ['accessibility-overview', 'mobile-overview', 'touch-gestures'],
  },
  {
    personaId: 'it',
    primary: ['security-overview', 'sso-saml', 'role-based-access', 'session-timeouts'],
    longSession: ['audit-trail', 'data-export', 'error-recovery'],
    a11yPreferences: ['keyboard-shortcuts', 'nvda-firefox'],
  },
  {
    personaId: 'legal',
    primary: ['gdpr-data-handling', 'risk-register', 'sox-controls'],
    longSession: ['audit-trail', 'approvals-workflow', 'release-notes'],
    a11yPreferences: ['accessibility-overview', 'jaws-chrome', 'high-contrast-mode'],
  },

  // ===== 19th alias — Compliance Officer (Iris Q1 refinement) =====
  {
    personaId: 'compliance_officer',
    primary: [
      'sox-controls',
      'soc2-evidence',
      'iso27001-controls',
      'gdpr-data-handling',
      'hipaa-controls',
      'audit-trail',
    ],
    longSession: [
      'risk-register',
      'approvals-workflow',
      'role-based-access',
      'session-timeouts',
      'data-export',
    ],
    a11yPreferences: [
      'keyboard-shortcuts',
      'accessibility-overview',
      'high-contrast-mode',
      'nvda-firefox',
      'screen-reader-support',
    ],
  },
];

/** getHelpTopicsForPersona — Look up the Help topic mapping for a persona alias. */
export function getHelpTopicsForPersona(personaId: PersonaAliasId): PersonaHelpTopics | undefined {
  return PERSONA_HELP_MAP.find((m) => m.personaId === personaId);
}

/** getAllPrimaryHelpTopicIds — All Help topic ids that appear in any persona's `primary` list. */
export function getAllPrimaryHelpTopicIds(): readonly HelpTopicId[] {
  const seen = new Set<HelpTopicId>();
  for (const m of PERSONA_HELP_MAP) {
    for (const t of m.primary) seen.add(t);
  }
  return Array.from(seen).sort();
}

/** validatePersonaHelpMap — Returns validation errors. Empty = OK. */
export function validatePersonaHelpMap(persona: PersonaAlias): readonly string[] {
  const errors: string[] = [];
  const map = getHelpTopicsForPersona(persona.id);
  if (!map) {
    errors.push(`${persona.id}: no Help topic mapping (P-C pattern gap)`);
    return errors;
  }
  if (map.primary.length === 0) {
    errors.push(`${persona.id}: primary Help topic list is empty`);
  }
  if (persona.tier === 'regulatory' && map.a11yPreferences.length < 3) {
    errors.push(
      `${persona.id}: regulatory tier must have ≥3 a11y preference topics (has ${map.a11yPreferences.length})`
    );
  }
  if (persona.a11y.sessionTimeoutMinutes >= 240 && map.longSession.length < 3) {
    errors.push(
      `${persona.id}: long-session persona (${persona.a11y.sessionTimeoutMinutes}m timeout) must have ≥3 longSession topics`
    );
  }
  return errors;
}
