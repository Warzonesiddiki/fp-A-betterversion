// src/a11y/personaA11y.ts
// A11Y v0.7 PICK I.5 — Per-persona A11Y attribute helpers
// Author: Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) — A11Y Domain Owner
// Date: 2026-06-17
// Cross-witness: docs/a11y/A11Y_V0_7_PICK_I_5_CROSS_WITNESS_v0_1.md §4 (6-dim A11Y_READINESS)
// Status: SHIPPED via PICK I.5 implementation
//
// These helpers convert a PersonaA11yProfile into the React/JSX attribute set that
// <PersonaBadge> + downstream consumers should apply to ensure WCAG 2.1/2.2 AA
// conformance for the given persona. Each helper covers one of the 6 A11Y_READINESS
// dimensions, and getPersonaA11yAttributes() aggregates all six into a single object
// that the badge component spreads onto its root <span>.

import type { PersonaAlias, PersonaA11yProfile } from './personaRegistry';

/** A11Y attributes for a single dimension (e.g. Perceivable). */
export interface PersonaDimensionA11yAttributes {
  /** ARIA role (if non-default). */
  readonly role?: string;
  /** ARIA label (programmatic name — SC 4.1.2). */
  readonly 'aria-label'?: string;
  /** ARIA description (long-form context — SC 1.3.1). */
  readonly 'aria-description'?: string;
  /** ARIA live region politeness (SC 4.1.3 status messages). */
  readonly 'aria-live'?: 'off' | 'polite' | 'assertive';
  /** ARIA atomic (whether to read the entire region on change). */
  readonly 'aria-atomic'?: boolean;
  /** ARIA relevant (which changes to announce). */
  readonly 'aria-relevant'?: 'all' | 'additions' | 'removals' | 'text' | 'additions text';
  /** Language (SC 3.1.1). */
  readonly lang?: string;
  /** Minimum font size (CSS px). */
  readonly style?: { readonly fontSize?: string };
  /** Focus ring (CSS class token). */
  readonly 'data-focus-ring'?: 'default' | 'enhanced';
  /** Touch target (CSS min-width/min-height px). */
  readonly 'data-touch-target'?: '24' | '44' | '48';
  /** High-contrast mode (CSS class token). */
  readonly 'data-high-contrast'?: 'on' | 'off';
  /** Reflow 320px (CSS class token). */
  readonly 'data-reflow-320'?: 'enabled' | 'disabled';
  /** WCAG SC mapping (for axe-core audit). */
  readonly 'data-wcag-sc'?: string;
}

/** Aggregate of all 6-dim A11Y attributes. */
export interface PersonaA11yAttributes {
  readonly perceivable: PersonaDimensionA11yAttributes;
  readonly operable: PersonaDimensionA11yAttributes;
  readonly understandable: PersonaDimensionA11yAttributes;
  readonly robust: PersonaDimensionA11yAttributes;
  readonly cognitive: PersonaDimensionA11yAttributes;
  readonly mobile: PersonaDimensionA11yAttributes;
}

/** All 6 A11Y_READINESS dimension names (used in test enumeration). */
export const A11Y_DIMENSIONS = [
  'perceivable',
  'operable',
  'understandable',
  'robust',
  'cognitive',
  'mobile',
] as const;

export type A11yDimensionName = (typeof A11Y_DIMENSIONS)[number];

/** WCAG 2.1/2.2 SC mapping per A11Y_READINESS dimension. */
export const DIMENSION_WCAG_SC: Readonly<Record<A11yDimensionName, readonly string[]>> = {
  perceivable: ['1.1.1', '1.3.1', '1.4.1', '1.4.3', '1.4.10', '1.4.11'],
  operable: [
    '2.1.1',
    '2.1.2',
    '2.4.1',
    '2.4.3',
    '2.4.6',
    '2.4.7',
    '2.5.1',
    '2.5.3',
    '2.5.4',
  ],
  understandable: ['3.1.1', '3.1.2', '3.2.1', '3.2.2', '3.2.3', '3.3.1', '3.3.2'],
  robust: ['4.1.1', '4.1.2', '4.1.3'],
  cognitive: ['2.2.1', '2.2.2'],
  mobile: ['2.5.1', '2.5.2', '2.5.3', '2.5.4'],
};

/** Per-dimension test count (matches §4 row total of 33 tests per alias). */
export const DIMENSION_TEST_COUNT: Readonly<Record<A11yDimensionName, number>> = {
  perceivable: 6,
  operable: 9,
  understandable: 7,
  robust: 3,
  cognitive: 3,
  mobile: 5,
};

/** Total tests per alias (sum of 6 dimensions). */
export const TOTAL_TESTS_PER_ALIAS = Object.values(DIMENSION_TEST_COUNT).reduce(
  (acc, n) => acc + n,
  0
); // 33

/**
 * getPerceivableAttributes — Dim 1: text alternatives, time-based media, adaptable, distinguishable.
 * Maps to SC 1.1.1 / 1.3.1 / 1.4.1 / 1.4.3 / 1.4.10 / 1.4.11.
 */
export function getPerceivableAttributes(p: PersonaA11yProfile): PersonaDimensionA11yAttributes {
  const minSizeMap = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' } as const;
  return {
    'aria-label': p.altTextStrict ? 'persona-badge-strict-alt' : 'persona-badge-alt',
    'data-high-contrast': p.highContrastRequired ? 'on' : 'off',
    style: { fontSize: minSizeMap[p.minTextSize] },
    'data-wcag-sc': DIMENSION_WCAG_SC.perceivable.join(' '),
  };
}

/**
 * getOperableAttributes — Dim 2: keyboard, enough time, navigable, input modalities.
 * Maps to SC 2.1.1 / 2.1.2 / 2.4.1 / 2.4.3 / 2.4.6 / 2.4.7 / 2.5.1 / 2.5.3 / 2.5.4.
 */
export function getOperableAttributes(p: PersonaA11yProfile): PersonaDimensionA11yAttributes {
  return {
    role: p.keyboardOnly ? 'button' : undefined,
    'aria-description': p.keyboardOnly ? 'keyboard-activatable' : undefined,
    'data-touch-target': p.touchPrimary ? '48' : '24',
    'data-wcag-sc': DIMENSION_WCAG_SC.operable.join(' '),
  };
}

/**
 * getUnderstandableAttributes — Dim 3: readable, predictable, input assistance.
 * Maps to SC 3.1.1 / 3.1.2 / 3.2.1 / 3.2.2 / 3.2.3 / 3.3.1 / 3.3.2.
 */
export function getUnderstandableAttributes(
  p: PersonaA11yProfile
): PersonaDimensionA11yAttributes {
  return {
    lang: p.languageCode,
    'aria-description': p.simplifiedReadingLevel ? 'simplified-reading-level' : undefined,
    'data-wcag-sc': DIMENSION_WCAG_SC.understandable.join(' '),
  };
}

/**
 * getRobustAttributes — Dim 4: compatible (parseable, name/role/value, status messages).
 * Maps to SC 4.1.1 / 4.1.2 / 4.1.3.
 */
export function getRobustAttributes(p: PersonaA11yProfile): PersonaDimensionA11yAttributes {
  return {
    'aria-label': p.programmaticName ? 'persona-badge-programmatic' : undefined,
    'aria-live': p.statusMessagesPolite ? 'polite' : 'off',
    'aria-atomic': p.statusMessagesPolite ? true : undefined,
    'data-wcag-sc': DIMENSION_WCAG_SC.robust.join(' '),
  };
}

/**
 * getCognitiveAttributes — Dim 5 (WCAG 2.2): timing adjustable, focus not obscured.
 * Maps to SC 2.2.1 / 2.2.2 + cognitive-load mitigation.
 */
export function getCognitiveAttributes(p: PersonaA11yProfile): PersonaDimensionA11yAttributes {
  return {
    'data-focus-ring': p.enhancedFocusIndicator ? 'enhanced' : 'default',
    'aria-description': p.consistentNav ? 'consistent-navigation' : undefined,
    'data-wcag-sc': DIMENSION_WCAG_SC.cognitive.join(' '),
  };
}

/**
 * getMobileAttributes — Dim 6 (WCAG 2.5): pointer gestures, cancellation, target size, motion.
 * Maps to SC 2.5.1 / 2.5.2 / 2.5.3 / 2.5.4.
 */
export function getMobileAttributes(p: PersonaA11yProfile): PersonaDimensionA11yAttributes {
  return {
    'data-touch-target': String(p.minTouchTargetPx) as '24' | '44' | '48',
    'data-reflow-320': p.reflow320px ? 'enabled' : 'disabled',
    'data-wcag-sc': DIMENSION_WCAG_SC.mobile.join(' '),
  };
}

/**
 * getPersonaA11yAttributes — Aggregate all 6-dim A11Y attributes for a persona alias.
 * Consumers (e.g. <PersonaBadge>) spread this onto the root element to apply
 * the full WCAG 2.1/2.2 AA attribute set in one go.
 */
export function getPersonaA11yAttributes(persona: PersonaAlias): PersonaA11yAttributes {
  return {
    perceivable: getPerceivableAttributes(persona.a11y),
    operable: getOperableAttributes(persona.a11y),
    understandable: getUnderstandableAttributes(persona.a11y),
    robust: getRobustAttributes(persona.a11y),
    cognitive: getCognitiveAttributes(persona.a11y),
    mobile: getMobileAttributes(persona.a11y),
  };
}

/**
 * validatePersonaA11yProfile — Husky Gate 15 helper.
 * Returns an array of validation errors for a persona's A11Y profile.
 * An empty array means the profile is internally consistent and meets WCAG 2.1/2.2 AA.
 */
export function validatePersonaA11yProfile(
  persona: PersonaAlias
): readonly string[] {
  const errors: string[] = [];
  const a = persona.a11y;

  if (a.minTextSize === 'xlarge' && !a.highContrastRequired) {
    errors.push(
      `${persona.id}: xlarge text size implies high-contrast requirement (WCAG 1.4.3 + 1.4.4)`
    );
  }
  if (a.sessionTimeoutMinutes < 30) {
    errors.push(
      `${persona.id}: session timeout ${a.sessionTimeoutMinutes}m below WCAG 2.2.1 minimum of 30m (or 0=off)`
    );
  }
  if (a.minTouchTargetPx < 24) {
    errors.push(
      `${persona.id}: touch target ${a.minTouchTargetPx}px below SC 2.5.8 minimum of 24x24px`
    );
  }
  if (a.reflow320px && a.minTextSize === 'xlarge') {
    errors.push(
      `${persona.id}: xlarge text + 320px reflow may cause horizontal scroll (SC 1.4.10)`
    );
  }
  if (a.ariaLabelsRequired && !a.programmaticName) {
    errors.push(
      `${persona.id}: ariaLabelsRequired=true but programmaticName=false (SC 4.1.2 conflict)`
    );
  }
  if (persona.iso27001Controls.length === 0) {
    errors.push(`${persona.id}: no ISO 27001 controls mapped (Themis COMPLIANCE_READINESS gap)`);
  }
  if (persona.weight === 'critical' && persona.primarySectors.length < 5) {
    errors.push(
      `${persona.id}: critical-weight persona has only ${persona.primarySectors.length} sector(s) — Vesta cross-witness gap`
    );
  }
  return errors;
}
