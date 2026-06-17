// src/a11y/personaRegistry.ts
// A11Y v0.7 PICK I.5 — 19 Persona Aliases A11Y Registry
// Author: Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) — A11Y Domain Owner
// Date: 2026-06-17 (T-4d 2026-06-22 16:00 UTC RATIFICATION GATE; T+13d 2026-06-30 23:59 UTC HARD SHIP v1.0.0)
// Base spec: docs/a11y/Q5_11_18_PERSONA_ALIASES_A11Y_SCOPING.md @ b8bf4d46 (357L)
// Cross-witness deepening: docs/a11y/A11Y_V0_7_PICK_I_5_CROSS_WITNESS_v0_1.md
// Status: SHIPPED via PICK I.5 implementation
// Husky Gate 15 (PERSONA-CROSS-COVERAGE) enforces: every entry below MUST have a corresponding
// test cell in src/__tests__/a11y/q5-11-19-persona-aliases.test.tsx within 7 days of addition.

/**
 * PersonaAliasId — Canonical, stable identifier for the 19 persona aliases.
 * These IDs are the single source of truth and MUST NOT be renamed without
 * a coordinated migration (Husky Gate 15 + Iris PERSONA_UX cross-witness).
 *
 * Order is significant: the first 8 are PICK I.1 Boardroom sub-personas, the next 10
 * are PERSONA_UX v0.2 operational personas, and the 19th is the Compliance Officer
 * added by Iris Q1 refinement (PICK I.5 cross-witness §2.2).
 */
export type PersonaAliasId =
  // PICK I.1 Boardroom sub-personas (8)
  | 'cfo'
  | 'controller'
  | 'cxo'
  | 'board_chair'
  | 'board_member'
  | 'audit_committee_chair'
  | 'investor_relations'
  | 'treasurer'
  // PERSONA_UX v0.2 operational personas (10)
  | 'analyst'
  | 'auditor'
  | 'tax'
  | 'fp_a'
  | 'revenue'
  | 'cost'
  | 'capex'
  | 'hr'
  | 'it'
  | 'legal'
  // 19th alias — Iris Q1 refinement (regulatory gap)
  | 'compliance_officer';

/**
 * PersonaTier — Categorizes aliases by their primary work pattern, which drives
 * the A11Y feature selection (e.g. keyboard-heavy personas get extended shortcut
 * bindings; long-session personas get cognitive load mitigations).
 */
export type PersonaTier = 'executive' | 'operational' | 'regulatory';

/**
 * ScreenReaderPrimary — The preferred screen reader combo for the persona.
 * Drives the high-contrast + screen-reader smoke test in P-A and P-B.
 */
export type ScreenReaderPrimary =
  | 'nvda-firefox'
  | 'jaws-chrome'
  | 'voiceover-safari'
  | 'talkback-android-chrome'
  | 'none';

/**
 * PersonaA11yProfile — Per-persona 6-dim A11Y_READINESS feature vector.
 * Drives P-B (A11Y features) test cases.
 */
export interface PersonaA11yProfile {
  /** Perceivable dim: high-contrast / text-size / alt-text. */
  readonly highContrastRequired: boolean;
  readonly minTextSize: 'small' | 'medium' | 'large' | 'xlarge';
  readonly altTextStrict: boolean;
  /** Operable dim: keyboard / touch / pointer. */
  readonly keyboardOnly: boolean;
  readonly touchPrimary: boolean;
  readonly pointerCancellationRequired: boolean;
  /** Understandable dim: lang / reading-level / help. */
  readonly languageCode: 'en' | 'en-GB' | 'en-CA' | 'es' | 'fr';
  readonly simplifiedReadingLevel: boolean;
  /** Robust dim: ARIA / programmatic-name / status-messages. */
  readonly ariaLabelsRequired: boolean;
  readonly programmaticName: boolean;
  readonly statusMessagesPolite: boolean;
  /** Cognitive dim: focus indicators / consistent-nav / session-timeouts. */
  readonly enhancedFocusIndicator: boolean;
  readonly consistentNav: boolean;
  readonly sessionTimeoutMinutes: 30 | 60 | 120 | 240 | 480;
  /** Mobile dim: touch target size / reflow. */
  readonly minTouchTargetPx: 24 | 44 | 48;
  readonly reflow320px: boolean;
}

/**
 * PersonaAlias — Canonical record for a single persona alias.
 * One per row in the PERSONA_REGISTRY array below.
 */
export interface PersonaAlias {
  readonly id: PersonaAliasId;
  readonly displayName: string;
  readonly shortName: string;
  readonly tier: PersonaTier;
  readonly description: string;
  /** Preferred screen reader combo (P-B evidence). */
  readonly screenReader: ScreenReaderPrimary;
  /** WCAG 2.2 conformance level targeted for this persona. */
  readonly wcagLevel: 'AA' | 'AAA';
  /** A11Y weight — used to prioritize audit depth. */
  readonly weight: 'standard' | 'high' | 'critical';
  /** 6-dim A11Y_READINESS profile. */
  readonly a11y: PersonaA11yProfile;
  /** ISO 27001:2022 control mappings (Themis COMPLIANCE_READINESS cross-witness). */
  readonly iso27001Controls: readonly string[];
  /** Sector relevance (1-16, Vesta SECTOR_A11Y_AUDIT v0.1). */
  readonly primarySectors: readonly number[];
}

/**
 * PERSONA_REGISTRY — Canonical array of 19 persona aliases.
 * Husky Gate 15 (PERSONA-CROSS-COVERAGE) validates that every entry has a
 * corresponding test cell in src/__tests__/a11y/q5-11-19-persona-aliases.test.tsx
 * within 7 days of addition.
 *
 * Index = ordinal position; consumers MUST use the `id` field, not the index.
 */
export const PERSONA_REGISTRY: readonly PersonaAlias[] = [
  // ===== PICK I.1 Boardroom sub-personas (8) =====
  {
    id: 'cfo',
    displayName: 'CFO — Chief Financial Officer',
    shortName: 'CFO',
    tier: 'executive',
    description:
      'Executive leader responsible for financial strategy, capital allocation, and investor reporting.',
    screenReader: 'voiceover-safari',
    wcagLevel: 'AA',
    weight: 'critical',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 60,
      minTouchTargetPx: 44,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1', 'A.5.7', 'A.5.12', 'A.5.31'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'controller',
    displayName: 'Controller — Financial Controls',
    shortName: 'Controller',
    tier: 'executive',
    description:
      'Owns financial close, controls framework, and audit-readiness across the organization.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'critical',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 120,
      minTouchTargetPx: 44,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.7', 'A.5.28', 'A.5.31', 'A.8.15'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'cxo',
    displayName: 'CXO Suite — Cross-Functional Executive',
    shortName: 'CXO',
    tier: 'executive',
    description:
      'C-suite executive (COO, CMO, CRO) consuming boardroom-grade rollups and KPI summaries.',
    screenReader: 'voiceover-safari',
    wcagLevel: 'AA',
    weight: 'high',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: true,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: true,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 30,
      minTouchTargetPx: 48,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.7'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'board_chair',
    displayName: 'Board Chair — Governance Lead',
    shortName: 'Board Chair',
    tier: 'executive',
    description: 'Chairs the board, drives governance cadence, consumes audit committee summaries.',
    screenReader: 'jaws-chrome',
    wcagLevel: 'AA',
    weight: 'critical',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'large',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 60,
      minTouchTargetPx: 44,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1', 'A.5.7', 'A.5.31'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'board_member',
    displayName: 'Board Member — Director',
    shortName: 'Board Member',
    tier: 'executive',
    description: 'Independent or non-executive director consuming board packs and voting records.',
    screenReader: 'jaws-chrome',
    wcagLevel: 'AA',
    weight: 'high',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 60,
      minTouchTargetPx: 44,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.7'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'audit_committee_chair',
    displayName: 'Audit Committee Chair',
    shortName: 'Audit Committee Chair',
    tier: 'executive',
    description:
      'Chairs audit committee, owns sign-off on controls and external audit coordination.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'critical',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 120,
      minTouchTargetPx: 44,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.7', 'A.5.28', 'A.5.31', 'A.8.15', 'A.8.16'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'investor_relations',
    displayName: 'Investor Relations Lead',
    shortName: 'IR Lead',
    tier: 'executive',
    description: 'Manages investor communications, quarterly earnings, and analyst briefings.',
    screenReader: 'voiceover-safari',
    wcagLevel: 'AA',
    weight: 'high',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: true,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 60,
      minTouchTargetPx: 44,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.7'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'treasurer',
    displayName: 'Treasurer — Liquidity & Capital Markets',
    shortName: 'Treasurer',
    tier: 'executive',
    description: 'Manages cash, FX, debt covenants, and capital markets transactions.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'high',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 120,
      minTouchTargetPx: 44,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1', 'A.5.7', 'A.5.31'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },

  // ===== PERSONA_UX v0.2 operational personas (10) =====
  {
    id: 'analyst',
    displayName: 'Financial Analyst — FP&A',
    shortName: 'Analyst',
    tier: 'operational',
    description: 'Builds forecasts, runs scenarios, and packages management reporting.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'small',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'auditor',
    displayName: 'Internal Auditor',
    shortName: 'Auditor',
    tier: 'operational',
    description: 'Internal audit, evidence collection, and SOX/SOC2 control testing.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'high',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 480,
      minTouchTargetPx: 24,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.28', 'A.8.15', 'A.8.16', 'A.8.32'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'tax',
    displayName: 'Tax Manager',
    shortName: 'Tax',
    tier: 'operational',
    description: 'Owns tax provision, deferred taxes, and statutory filing workflows.',
    screenReader: 'jaws-chrome',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1', 'A.5.31'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'fp_a',
    displayName: 'FP&A Manager',
    shortName: 'FP&A',
    tier: 'operational',
    description: 'Leads planning, budgeting, and rolling forecast cycles.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'small',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'revenue',
    displayName: 'Revenue Manager',
    shortName: 'Revenue',
    tier: 'operational',
    description: 'Owns revenue recognition, ASC 606 application, and contract review.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'small',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'cost',
    displayName: 'Cost Accounting Manager',
    shortName: 'Cost',
    tier: 'operational',
    description: 'Manages cost allocation, standard costing, and variance analysis.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'small',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'capex',
    displayName: 'Capex / Fixed Assets Manager',
    shortName: 'Capex',
    tier: 'operational',
    description: 'Manages capital project approvals, asset register, and depreciation.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'small',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1', 'A.8.10'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'hr',
    displayName: 'HR / People Ops',
    shortName: 'HR',
    tier: 'operational',
    description: 'Owns headcount, comp planning, and HR-linked cost allocations.',
    screenReader: 'talkback-android-chrome',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: true,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: true,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 60,
      minTouchTargetPx: 48,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.6.1', 'A.6.3'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'it',
    displayName: 'IT / Engineering Lead',
    shortName: 'IT',
    tier: 'operational',
    description: 'Owns technical integrations, SSO, and security infrastructure.',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AA',
    weight: 'standard',
    a11y: {
      highContrastRequired: false,
      minTextSize: 'small',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 240,
      minTouchTargetPx: 24,
      reflow320px: false,
    },
    iso27001Controls: ['A.5.1', 'A.8.2', 'A.8.5', 'A.8.16', 'A.8.21'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    id: 'legal',
    displayName: 'Legal / General Counsel',
    shortName: 'Legal',
    tier: 'operational',
    description: 'Reviews contracts, manages risk register, and oversees compliance posture.',
    screenReader: 'jaws-chrome',
    wcagLevel: 'AA',
    weight: 'high',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'medium',
      altTextStrict: true,
      keyboardOnly: false,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 60,
      minTouchTargetPx: 44,
      reflow320px: true,
    },
    iso27001Controls: ['A.5.1', 'A.5.31', 'A.5.34'],
    primarySectors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },

  // ===== 19th alias — Iris Q1 refinement (regulatory gap) =====
  {
    id: 'compliance_officer',
    displayName: 'Compliance Officer — Regulatory',
    shortName: 'Compliance Officer',
    tier: 'regulatory',
    description:
      'Reviews SOX/SOC2/ISO 27001/HIPAA/GDPR audit trails in long-duration evidence-collection sessions (4-8h continuous keyboard nav). Sub-personas: Internal_Compliance_Officer (employee) and External_Compliance_Auditor (contractor).',
    screenReader: 'nvda-firefox',
    wcagLevel: 'AAA',
    weight: 'critical',
    a11y: {
      highContrastRequired: true,
      minTextSize: 'large',
      altTextStrict: true,
      keyboardOnly: true,
      touchPrimary: false,
      pointerCancellationRequired: true,
      languageCode: 'en',
      simplifiedReadingLevel: false,
      ariaLabelsRequired: true,
      programmaticName: true,
      statusMessagesPolite: true,
      enhancedFocusIndicator: true,
      consistentNav: true,
      sessionTimeoutMinutes: 480,
      minTouchTargetPx: 44,
      reflow320px: true,
    },
    // Iris Q1 refinement — strongest ISO 27001 control mapping (Themis cross-witness).
    iso27001Controls: [
      'A.5.1',
      'A.5.7',
      'A.5.28',
      'A.5.31',
      'A.5.34',
      'A.8.15',
      'A.8.16',
      'A.8.32',
    ],
    // Compliance Officer is the primary user of sectors 7-12 (high-compliance).
    primarySectors: [7, 8, 9, 10, 11, 12],
  },
];

/** Count of registered persona aliases (used by Husky Gate 15 + a11y audit). */
export const PERSONA_REGISTRY_COUNT = PERSONA_REGISTRY.length;

/**
 * getPersonaById — Look up a persona alias by its canonical id.
 * Returns undefined if the id is not in the registry (Husky Gate 15 BLOCK signal).
 */
export function getPersonaById(id: PersonaAliasId): PersonaAlias | undefined {
  return PERSONA_REGISTRY.find((p) => p.id === id);
}

/**
 * getPersonasByTier — Filter aliases by tier (executive / operational / regulatory).
 * Used by P-E (Sector × persona) test cells.
 */
export function getPersonasByTier(tier: PersonaTier): readonly PersonaAlias[] {
  return PERSONA_REGISTRY.filter((p) => p.tier === tier);
}

/**
 * getPersonasBySector — Return all personas that declare the given sector as primary.
 * Drives Vesta SECTOR_A11Y_AUDIT v0.1 cross-witness (P-E pattern).
 */
export function getPersonasBySector(sectorId: number): readonly PersonaAlias[] {
  return PERSONA_REGISTRY.filter((p) => p.primarySectors.includes(sectorId));
}

/**
 * getAllPersonaIds — Stable list of all 19 persona ids (used by tests + Husky Gate 15).
 */
export function getAllPersonaIds(): readonly PersonaAliasId[] {
  return PERSONA_REGISTRY.map((p) => p.id);
}
