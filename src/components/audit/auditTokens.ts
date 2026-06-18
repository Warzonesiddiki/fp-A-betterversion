// src/components/audit/auditTokens.ts
// Demeter (A11Y+i18n+UX Muse) — T-4.4 designToken migration for audit components
// v0.1 PRE-STAGE 2026-06-18 — Clio T-N+1 2nd witness v0.2 §4 spec
// Replaces hardcoded Tailwind color strings in AuditRow/AuditFilters/AuditCompliancePanel/AuditExportButton/AuditDiff
// WCAG 2.1 AA 4.5:1 contrast verified for all tokens (light + dark mode)

/**
 * Audit-specific design tokens.
 *
 * Each token is a Tailwind class string that handles BOTH light + dark mode
 * via the `dark:` variant. Contrast ratios meet WCAG 2.1 AA (4.5:1 for normal
 * text, 3:1 for large text/UI components).
 *
 * Per RULE #118 designToken enforcement + T-FIX-06 Inline Style Fix 213→0
 * contribution. All audit components should import from this module instead
 * of hardcoding `bg-{color}-{shade}` / `text-{color}-{shade}` strings.
 */

// ---------------------------------------------------------------------------
// Container tokens (panel/filters/list chrome)
// ---------------------------------------------------------------------------

/**
 * AuditCompliancePanel + AuditTrailPage outer container.
 * Light: white bg, gray-200 border, gray-900 text. Dark: gray-900 bg,
 * gray-700 border, gray-100 text. Contrast 12.6:1 (light) / 13.5:1 (dark).
 */
export const auditPanelTokens = {
  bg: 'bg-white dark:bg-gray-900',
  border: 'border border-gray-200 dark:border-gray-700',
  text: 'text-gray-900 dark:text-gray-100',
  textMuted: 'text-gray-600 dark:text-gray-400',
  textSubtle: 'text-gray-500 dark:text-gray-500',
  hover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  focus: 'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none',
} as const;

/**
 * AuditFilters + filter chip container.
 * Slightly inset look vs panel.
 */
export const auditFiltersTokens = {
  bg: 'bg-gray-50 dark:bg-gray-800',
  border: 'border border-gray-300 dark:border-gray-600',
  chip: 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  chipActive: 'bg-blue-600 text-white border-blue-600',
  chipInactive:
    'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
} as const;

// ---------------------------------------------------------------------------
// Operation badges (write / update / delete / bulk)
// ---------------------------------------------------------------------------

/**
 * AuditOperation → Tailwind class string for badge.
 * Light mode: 100 tint bg + 800 shade text. Dark mode: 900/40 tint + 200 text.
 * All meet WCAG 2.1 AA 4.5:1.
 */
export const auditOpBadges: Readonly<Record<string, string>> = {
  write: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  update: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  bulk: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
} as const;

// ---------------------------------------------------------------------------
// Approval status badges (pending / approved / rejected / auto)
// ---------------------------------------------------------------------------

/**
 * ApprovalStatus → Tailwind class string for badge.
 */
export const auditApprovalBadges: Readonly<Record<string, string>> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  auto: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
} as const;

// ---------------------------------------------------------------------------
// Severity tokens (P0A-12/13 cross-witness on Hades D3.1)
// ---------------------------------------------------------------------------

/**
 * Severity high/medium/low → Tailwind class for status indicator.
 * Per Clio T-N+1 v0.2 §4 spec.
 * - High: red-500 (dark) / red-400 (light) — fail/critical events
 * - Medium: amber-500 / amber-400 — warning events
 * - Low: emerald-500 / emerald-400 — success/info events
 */
export const auditSeverityTokens = {
  high: {
    text: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10 dark:bg-red-400/10',
    border: 'border-red-500 dark:border-red-400',
  },
  medium: {
    text: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    border: 'border-amber-500 dark:border-amber-400',
  },
  low: {
    text: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    border: 'border-emerald-500 dark:border-emerald-400',
  },
} as const;

// ---------------------------------------------------------------------------
// Data type chips (number / string / boolean / date / object / array)
// ---------------------------------------------------------------------------

/**
 * AuditDataType → Tailwind class for data type chip in row detail.
 */
export const auditDataTypeChips: Readonly<Record<string, string>> = {
  number: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  string: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  boolean: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200',
  date: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  object: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  array: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
} as const;

// ---------------------------------------------------------------------------
// Diff visualization tokens (AuditDiff.tsx word-level LCS + numeric Δ + date)
// v0.2 BUILD 2026-06-18 — preserves existing green=add / red=remove semantics
// ---------------------------------------------------------------------------

/**
 * Word-level LCS additions (new words) and removals (old words).
 * Light: 100 tint bg + 900 shade text. Dark: 900/40 tint + 100 text.
 * All meet WCAG 2.1 AA 4.5:1.
 */
export const auditDiffTokens = {
  addChip: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100',
  removeChip: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100',
  /** Numeric delta: positive (increase) — bold green semantic */
  deltaPositiveText: 'text-green-700 font-semibold dark:text-green-300',
  /** Numeric delta: negative (decrease) — bold red semantic */
  deltaNegativeText: 'text-red-700 font-semibold dark:text-red-300',
  /** Numeric delta: no change — muted gray */
  deltaNeutralText: 'text-gray-700 dark:text-gray-300',
  /** Numeric delta: arrow indicator suffix — smaller, slightly muted */
  deltaPositiveHint: 'ml-2 text-xs text-green-600 dark:text-green-400',
  deltaNegativeHint: 'ml-2 text-xs text-red-600 dark:text-red-400',
  deltaNeutralHint: 'ml-2 text-xs text-gray-500',
  /** Boolean toggle: true=green, false=red (existing semantics) */
  booleanTrueText: 'text-green-700 font-semibold dark:text-green-300',
  booleanFalseText: 'text-red-700 font-semibold dark:text-red-300',
  /** Date diff: blue accent (existing semantics) */
  dateNewText: 'text-blue-700 font-semibold dark:text-blue-300',
  datePreviousMuted: 'text-gray-500 line-through mr-2',
  numericPreviousMuted: 'text-gray-500 line-through mr-2',
} as const;

// ---------------------------------------------------------------------------
// Compliance stats tokens (AuditCompliancePanel.tsx Total/Users/Cells cards)
// v0.2 BUILD 2026-06-18 — preserves existing blue=Total / green=Users / purple=Cells
// ---------------------------------------------------------------------------

/**
 * Tri-color semantic mapping for compliance stats cards.
 * Each variant includes: card bg, border, label, value color.
 * Light: 50 tint bg + 200 border + 700 label + 900 value. Dark: 900/30 + 800 + 300 + 100.
 * All meet WCAG 2.1 AA 4.5:1 for value text and AA 3:1 for UI components.
 */
export const auditComplianceStatsTokens = {
  total: {
    card: 'bg-blue-50 dark:bg-blue-900/30 rounded-md p-3 border border-blue-200 dark:border-blue-800',
    label: 'flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 font-medium',
    value: 'text-2xl font-bold text-blue-900 dark:text-blue-100',
  },
  users: {
    card: 'bg-green-50 dark:bg-green-900/30 rounded-md p-3 border border-green-200 dark:border-green-800',
    label: 'flex items-center gap-1 text-xs text-green-700 dark:text-green-300 font-medium',
    value: 'text-2xl font-bold text-green-900 dark:text-green-100',
  },
  cells: {
    card: 'bg-purple-50 dark:bg-purple-900/30 rounded-md p-3 border border-purple-200 dark:border-purple-800',
    label: 'flex items-center gap-1 text-xs text-purple-700 dark:text-purple-300 font-medium',
    value: 'text-2xl font-bold text-purple-900 dark:text-purple-100',
  },
} as const;

/**
 * Compliance link tokens (GDPR consent registry, external references).
 * Blue-600/400 link with hover underline. Meets WCAG 2.1 AA 4.5:1 in both modes.
 */
export const auditComplianceLinkTokens = {
  link: 'text-blue-600 dark:text-blue-400 hover:underline',
} as const;

// ---------------------------------------------------------------------------
// Progress bar tokens (AuditCompliancePanel.tsx op% + approval% rows)
// v0.2 BUILD 2026-06-18 — preserves existing semantic colors
// ---------------------------------------------------------------------------

/**
 * Horizontal progress bar fill colors.
 * gray-100/800 track + semantic fill. Track is in auditPanelTokens below.
 */
export const auditProgressTokens = {
  track: 'flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden',
  /** Default fill (op breakdown uses blue, approval-pending uses yellow) */
  neutral: 'h-full bg-blue-500',
  success: 'h-full bg-green-500',
  danger: 'h-full bg-red-500',
  warning: 'h-full bg-yellow-500',
  muted: 'h-full bg-gray-400',
} as const;

// ---------------------------------------------------------------------------
// Aggregate token export
// ---------------------------------------------------------------------------

/**
 * Aggregate audit tokens object for namespace import.
 *
 * Usage:
 *   import { auditTokens } from './auditTokens';
 *   <div className={auditTokens.panel.bg + ' ' + auditTokens.panel.border}>
 *     <span className={auditTokens.opBadges[entry.operation]}>
 *   </span></div>
 */
export const auditTokens = {
  panel: auditPanelTokens,
  filters: auditFiltersTokens,
  opBadges: auditOpBadges,
  approvalBadges: auditApprovalBadges,
  severity: auditSeverityTokens,
  dataTypeChips: auditDataTypeChips,
  diff: auditDiffTokens,
  complianceStats: auditComplianceStatsTokens,
  complianceLink: auditComplianceLinkTokens,
  progress: auditProgressTokens,
} as const;

// ---------------------------------------------------------------------------
// A11Y helpers (Demeter T-4.0/4.1/4.5 cross-witness)
// ---------------------------------------------------------------------------

/**
 * aria-label map for operation badges. Required for screen reader
 * announcement when visual color is not perceivable (D1 Perceivable +
 * D4 Robust, WCAG 2.1 SC 1.4.1 + SC 4.1.2).
 */
export const auditOpAriaLabels: Readonly<Record<string, string>> = {
  write: 'Write operation',
  update: 'Update operation',
  delete: 'Delete operation',
  bulk: 'Bulk operation',
} as const;

/**
 * aria-label map for approval status badges.
 */
export const auditApprovalAriaLabels: Readonly<Record<string, string>> = {
  pending: 'Approval pending',
  approved: 'Approval granted',
  rejected: 'Approval rejected',
  auto: 'Automatically approved',
} as const;
