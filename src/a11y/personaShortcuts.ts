// src/a11y/personaShortcuts.ts
// A11Y v0.7 PICK I.5 — Persona → keyboard shortcut bindings
// Author: Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) — A11Y Domain Owner
// Date: 2026-06-17
// Cross-witness: docs/a11y/A11Y_V0_7_PICK_I_5_CROSS_WITNESS_v0_1.md §4 (P-D Keyboard shortcut pattern)
// Status: SHIPPED via PICK I.5 implementation
//
// Maps each of the 19 persona aliases to the keyboard shortcuts that are most
// relevant to their primary workflows. Drives the P-D (Keyboard shortcut) test
// pattern (19 cells). The bindings complement src/data/shortcuts.ts (global) and
// are not a replacement — they are the persona-specific subset.

import type { PersonaAlias, PersonaAliasId } from './personaRegistry';

/** Canonical keyboard shortcut (modifiers joined with `+`, e.g. `Ctrl+Shift+K`). */
export type KeyboardShortcut =
  | 'Ctrl+K'
  | 'Ctrl+S'
  | 'Ctrl+Shift+K'
  | 'Ctrl+Shift+S'
  | 'Ctrl+Enter'
  | 'Ctrl+Shift+Enter'
  | 'Ctrl+/'
  | 'Ctrl+Shift+/'
  | 'Ctrl+H'
  | 'Ctrl+Shift+H'
  | 'Ctrl+B'
  | 'Ctrl+Shift+B'
  | 'Ctrl+F'
  | 'Ctrl+Shift+F'
  | 'Ctrl+G'
  | 'Ctrl+Shift+G'
  | 'Ctrl+1'
  | 'Ctrl+2'
  | 'Ctrl+3'
  | 'Ctrl+4'
  | 'Ctrl+5'
  | 'Ctrl+6'
  | 'Ctrl+7'
  | 'Ctrl+8'
  | 'Ctrl+9'
  | 'Alt+N'
  | 'Alt+E'
  | 'Alt+S'
  | 'Alt+R'
  | 'Alt+A'
  | 'F1'
  | 'Shift+F1'
  | 'Ctrl+F1'
  | 'Ctrl+Shift+T'
  | 'Ctrl+Shift+M'
  | '?'
  | 'Esc'
  | '/';

/** A single persona → shortcut binding. */
export interface PersonaShortcutBinding {
  /** The shortcut key combo. */
  readonly shortcut: KeyboardShortcut;
  /** The action label (used for screen-reader announce + Help docs). */
  readonly action: string;
  /** Whether this shortcut is a long-session accelerator (used in long-duration evidence collection). */
  readonly longSession: boolean;
  /** Whether this shortcut conflicts with a global shortcut (Husky Gate 5b audit). */
  readonly globalConflict: boolean;
}

/** Mapping from a persona alias to its keyboard shortcut bindings. */
export interface PersonaShortcuts {
  readonly personaId: PersonaAliasId;
  /** Always-on shortcuts (workspace navigation). */
  readonly navigation: readonly PersonaShortcutBinding[];
  /** Workflow-specific shortcuts (the persona's primary verbs). */
  readonly workflow: readonly PersonaShortcutBinding[];
  /** Help + A11Y preference shortcuts. */
  readonly a11y: readonly PersonaShortcutBinding[];
}

/** PERSONA_SHORTCUTS — Canonical shortcut mapping for all 19 personas. */
export const PERSONA_SHORTCUTS: readonly PersonaShortcuts[] = [
  // ===== PICK I.1 Boardroom sub-personas (8) =====
  {
    personaId: 'cfo',
    navigation: [
      { shortcut: 'Ctrl+1', action: 'Go to Dashboard', longSession: false, globalConflict: false },
      { shortcut: 'Ctrl+2', action: 'Go to Forecasts', longSession: false, globalConflict: false },
      { shortcut: 'Ctrl+3', action: 'Go to Scenarios', longSession: false, globalConflict: false },
      {
        shortcut: 'Ctrl+9',
        action: 'Go to Investor Deck',
        longSession: false,
        globalConflict: false,
      },
    ],
    workflow: [
      { shortcut: 'Ctrl+K', action: 'Command palette', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+Shift+B',
        action: 'Open board pack',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
      { shortcut: 'F1', action: 'Open Help', longSession: false, globalConflict: false },
    ],
  },
  {
    personaId: 'controller',
    navigation: [
      { shortcut: 'Ctrl+1', action: 'Go to Dashboard', longSession: false, globalConflict: false },
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+5',
        action: 'Go to Consolidation',
        longSession: true,
        globalConflict: false,
      },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+S',
        action: 'Save close-period snapshot',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+S',
        action: 'Open SOX control matrix',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to intercompany row',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'cxo',
    navigation: [
      { shortcut: 'Ctrl+1', action: 'Go to Dashboard', longSession: false, globalConflict: false },
      {
        shortcut: 'Ctrl+9',
        action: 'Go to Investor Deck',
        longSession: false,
        globalConflict: false,
      },
    ],
    workflow: [
      { shortcut: 'Ctrl+K', action: 'Command palette', longSession: false, globalConflict: false },
    ],
    a11y: [{ shortcut: 'F1', action: 'Open Help', longSession: false, globalConflict: false }],
  },
  {
    personaId: 'board_chair',
    navigation: [
      { shortcut: 'Ctrl+9', action: 'Go to Board Pack', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+B',
        action: 'Open board pack',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+H',
        action: 'Open governance history',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'board_member',
    navigation: [
      { shortcut: 'Ctrl+9', action: 'Go to Board Pack', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+B',
        action: 'Open board pack',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'audit_committee_chair',
    navigation: [
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+5',
        action: 'Go to Consolidation',
        longSession: true,
        globalConflict: false,
      },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+S',
        action: 'Open SOX control matrix',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+F',
        action: 'Open ISO 27001 evidence',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to risk-register row',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'investor_relations',
    navigation: [
      {
        shortcut: 'Ctrl+9',
        action: 'Go to Investor Deck',
        longSession: false,
        globalConflict: false,
      },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+B',
        action: 'Build investor deck',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Enter',
        action: 'Insert release-note reference',
        longSession: false,
        globalConflict: false,
      },
    ],
    a11y: [{ shortcut: 'F1', action: 'Open Help', longSession: false, globalConflict: false }],
  },
  {
    personaId: 'treasurer',
    navigation: [
      { shortcut: 'Ctrl+6', action: 'Go to Treasury', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+T',
        action: 'Open FX hedging',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+S',
        action: 'Save cash snapshot',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },

  // ===== PERSONA_UX v0.2 operational personas (10) =====
  {
    personaId: 'analyst',
    navigation: [
      { shortcut: 'Ctrl+2', action: 'Go to Forecasts', longSession: true, globalConflict: false },
      { shortcut: 'Ctrl+3', action: 'Go to Scenarios', longSession: true, globalConflict: false },
    ],
    workflow: [
      { shortcut: 'Ctrl+K', action: 'Command palette', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+Shift+M',
        action: 'Open Monte Carlo',
        longSession: true,
        globalConflict: false,
      },
      { shortcut: 'Ctrl+S', action: 'Save scenario', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+Enter',
        action: 'Run variance analysis',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
      { shortcut: 'F1', action: 'Open Help', longSession: false, globalConflict: false },
    ],
  },
  {
    personaId: 'auditor',
    navigation: [
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+S',
        action: 'Open SOX control matrix',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+F',
        action: 'Open ISO 27001 evidence',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to evidence row',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+Enter',
        action: 'Mark evidence reviewed',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'tax',
    navigation: [
      { shortcut: 'Ctrl+7', action: 'Go to Tax', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+S',
        action: 'Save tax provision',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to deferred-tax row',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'fp_a',
    navigation: [
      { shortcut: 'Ctrl+2', action: 'Go to Forecasts', longSession: true, globalConflict: false },
      { shortcut: 'Ctrl+8', action: 'Go to Headcount', longSession: false, globalConflict: false },
    ],
    workflow: [
      { shortcut: 'Ctrl+K', action: 'Command palette', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+Shift+M',
        action: 'Open Monte Carlo',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Enter',
        action: 'Run rolling forecast',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'revenue',
    navigation: [
      { shortcut: 'Ctrl+3', action: 'Go to Scenarios', longSession: false, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to contract row',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+S',
        action: 'Save revenue recognition',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'cost',
    navigation: [
      { shortcut: 'Ctrl+3', action: 'Go to Scenarios', longSession: false, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to cost-allocation row',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+S',
        action: 'Save cost allocation',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'capex',
    navigation: [
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
    ],
    workflow: [
      { shortcut: 'Ctrl+G', action: 'Jump to asset row', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+S',
        action: 'Save capex snapshot',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'hr',
    navigation: [
      { shortcut: 'Ctrl+8', action: 'Go to Headcount', longSession: false, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Enter',
        action: 'Submit comp plan',
        longSession: false,
        globalConflict: false,
      },
    ],
    a11y: [{ shortcut: 'F1', action: 'Open Help', longSession: false, globalConflict: false }],
  },
  {
    personaId: 'it',
    navigation: [
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+F',
        action: 'Open security overview',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+S',
        action: 'Open SSO/SAML config',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
  {
    personaId: 'legal',
    navigation: [
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to risk-register row',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+H',
        action: 'Open GDPR data handling',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
    ],
  },

  // ===== 19th alias — Compliance Officer (Iris Q1 refinement) =====
  {
    personaId: 'compliance_officer',
    navigation: [
      { shortcut: 'Ctrl+4', action: 'Go to Audit Trail', longSession: true, globalConflict: false },
      {
        shortcut: 'Ctrl+5',
        action: 'Go to Consolidation',
        longSession: true,
        globalConflict: false,
      },
    ],
    workflow: [
      {
        shortcut: 'Ctrl+Shift+S',
        action: 'Open SOX control matrix',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+F',
        action: 'Open ISO 27001 evidence',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+G',
        action: 'Jump to evidence row',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+Enter',
        action: 'Mark evidence reviewed',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+H',
        action: 'Open HIPAA controls',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+H',
        action: 'Open GDPR data handling',
        longSession: true,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+G',
        action: 'Open SOC2 evidence',
        longSession: true,
        globalConflict: false,
      },
    ],
    a11y: [
      {
        shortcut: 'Shift+F1',
        action: 'A11Y preference panel',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: '?',
        action: 'Show keyboard shortcuts',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+/',
        action: 'Toggle high-contrast',
        longSession: false,
        globalConflict: false,
      },
      {
        shortcut: 'Ctrl+Shift+/',
        action: 'Toggle screen-reader optimized mode',
        longSession: false,
        globalConflict: false,
      },
    ],
  },
];

/** getShortcutsForPersona — Look up the keyboard shortcut bindings for a persona alias. */
export function getShortcutsForPersona(personaId: PersonaAliasId): PersonaShortcuts | undefined {
  return PERSONA_SHORTCUTS.find((s) => s.personaId === personaId);
}

/** getAllBindingsFlat — Return every shortcut binding across every persona, de-duped. */
export function getAllBindingsFlat(): readonly PersonaShortcutBinding[] {
  const seen = new Set<string>();
  const result: PersonaShortcutBinding[] = [];
  for (const p of PERSONA_SHORTCUTS) {
    for (const b of [...p.navigation, ...p.workflow, ...p.a11y]) {
      if (!seen.has(b.shortcut)) {
        seen.add(b.shortcut);
        result.push(b);
      }
    }
  }
  return result;
}

/** validatePersonaShortcuts — Returns validation errors. Empty = OK. */
export function validatePersonaShortcuts(persona: PersonaAlias): readonly string[] {
  const errors: string[] = [];
  const map = getShortcutsForPersona(persona.id);
  if (!map) {
    errors.push(`${persona.id}: no shortcut mapping (P-D pattern gap)`);
    return errors;
  }
  const total = map.navigation.length + map.workflow.length + map.a11y.length;
  if (persona.a11y.keyboardOnly && total < 4) {
    errors.push(
      `${persona.id}: keyboard-only persona must have ≥4 shortcut bindings (has ${total})`
    );
  }
  if (
    persona.tier === 'regulatory' &&
    !map.workflow.some((b) => b.action.toLowerCase().includes('evidence'))
  ) {
    errors.push(`${persona.id}: regulatory tier must have an evidence-review shortcut`);
  }
  for (const b of [...map.navigation, ...map.workflow, ...map.a11y]) {
    if (b.globalConflict) {
      errors.push(
        `${persona.id}: shortcut ${b.shortcut} flagged as global-conflict (Husky Gate 5b)`
      );
    }
  }
  return errors;
}
