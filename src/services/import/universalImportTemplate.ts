/**
 * Universal Import Template System (O1: universal data importer)
 *
 * O1 DECISION (2026-10-24): Go universal — import any data from D365 and
 * other accounting/finance tools with the user's own template system.
 *
 * A template defines how source columns map to GL import fields. Templates
 * are either:
 *   - Built-in: D365 F&O, D365 BC, generic CSV, generic XLSX (auto-detected)
 *   - User-defined: saved by the user for any data source
 *
 * The template system is the single source of truth for column mappings.
 * The universal import engine applies a template to parse any data source
 * into GL entries through the existing parseGLRows/parseD365Rows pipeline.
 */

import type { GLColumnMappings, GLImportField } from './parseGLRows';
import { REQUIRED_GL_IMPORT_FIELDS } from './parseGLRows';
import { detectD365Flavor, type D365Flavor } from './d365Parser';

/** Source types the universal importer recognises. */
export type ImportSourceType = 'd365_fo' | 'd365_bc' | 'generic_csv' | 'generic_xlsx' | 'custom';

/** Date format hint for custom templates. */
export type DateFormatHint = 'iso' | 'us' | 'd365' | 'auto';

/** A universal import template. */
export interface UniversalImportTemplate {
  /** Unique template id (e.g., 'builtin-d365-fo', 'user-my-template'). */
  readonly id: string;
  /** Human-readable template name. */
  readonly name: string;
  /** Description of what this template imports. */
  readonly description: string;
  /** Source type this template targets. */
  readonly sourceType: ImportSourceType;
  /** Field → source column header mappings. */
  readonly mappings: GLColumnMappings;
  /** Optional date format hint for custom templates. */
  readonly dateFormat?: DateFormatHint;
  /** Optional default currency when the source file doesn't carry one. */
  readonly defaultCurrency?: string;
  /** Optional default entity when the source file doesn't carry one. */
  readonly defaultEntity?: string;
  /** True for built-in templates (auto-detected), false for user-defined. */
  readonly builtIn: boolean;
}

/** Result of validating a template. */
export interface TemplateValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Validate a template before saving.
 *
 * Checks:
 *  - Required fields (accountCode, postDate) are mapped
 *  - No duplicate column mappings (one source column can't map to two fields)
 *  - Source type is valid
 *  - Mappings are non-empty strings
 */
export function validateTemplate(template: UniversalImportTemplate): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields are mapped
  const missing = REQUIRED_GL_IMPORT_FIELDS.filter((f) => !template.mappings[f]);
  if (missing.length > 0) {
    errors.push(`Missing required field mappings: ${missing.join(', ')}`);
  }

  // Check for duplicate column mappings
  const columnValues = Object.values(template.mappings).filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  );
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const col of columnValues) {
    if (seen.has(col)) {
      duplicates.add(col);
    }
    seen.add(col);
  }
  if (duplicates.size > 0) {
    errors.push(
      `Duplicate column mappings: ${[...duplicates].join(', ')} (one column can't map to multiple fields)`
    );
  }

  // Check mappings are non-empty strings
  for (const [field, col] of Object.entries(template.mappings)) {
    if (col !== undefined && (typeof col !== 'string' || col.trim() === '')) {
      errors.push(`Mapping for field "${field}" is not a valid column name`);
    }
  }

  // Warn if optional fields are not mapped
  const allFields: GLImportField[] = [
    'accountCode',
    'accountName',
    'postDate',
    'debit',
    'credit',
    'currency',
    'description',
    'reference',
    'entityId',
    'departmentId',
  ];
  const unmappedOptional = allFields.filter(
    (f) => f !== 'accountCode' && f !== 'postDate' && !template.mappings[f]
  );
  if (unmappedOptional.length > 0) {
    warnings.push(
      `Optional fields not mapped: ${unmappedOptional.join(', ')} (data will be absent)`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Built-in template definitions. */
export const BUILTIN_TEMPLATES: readonly UniversalImportTemplate[] = [
  {
    id: 'builtin-d365-fo',
    name: 'D365 Finance & Operations',
    description: 'Microsoft Dynamics 365 Finance & Operations General Journal export',
    sourceType: 'd365_fo',
    mappings: {},
    builtIn: true,
  },
  {
    id: 'builtin-d365-bc',
    name: 'D365 Business Central',
    description: 'Microsoft Dynamics 365 Business Central G/L Entries export',
    sourceType: 'd365_bc',
    mappings: {},
    builtIn: true,
  },
  {
    id: 'builtin-generic-csv',
    name: 'Generic CSV',
    description: 'Generic CSV file with user-defined column mappings',
    sourceType: 'generic_csv',
    mappings: {},
    dateFormat: 'auto',
    builtIn: true,
  },
  {
    id: 'builtin-generic-xlsx',
    name: 'Generic XLSX',
    description: 'Generic Excel file with user-defined column mappings',
    sourceType: 'generic_xlsx',
    mappings: {},
    dateFormat: 'auto',
    builtIn: true,
  },
];

/**
 * Detect the best template for a given header set.
 *
 * Uses D365 flavor detection to auto-select the built-in D365 template.
 * Returns null for headers that don't match any built-in template.
 */
export function detectTemplate(headers: readonly string[]): UniversalImportTemplate | null {
  const flavor = detectD365Flavor(headers);
  if (flavor === 'd365_fo') return BUILTIN_TEMPLATES[0]!;
  if (flavor === 'd365_bc') return BUILTIN_TEMPLATES[1]!;
  return null;
}

/**
 * Build a user-defined template from column mappings.
 *
 * The template id is derived from the name (lowercase, alphanumeric, hyphens).
 */
export function createUserTemplate(
  name: string,
  sourceType: ImportSourceType,
  mappings: GLColumnMappings,
  options?: {
    description?: string;
    dateFormat?: DateFormatHint;
    defaultCurrency?: string;
    defaultEntity?: string;
  }
): UniversalImportTemplate {
  const id = `user-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
  return {
    id,
    name,
    description: options?.description ?? `User template: ${name}`,
    sourceType,
    mappings,
    dateFormat: options?.dateFormat ?? 'auto',
    defaultCurrency: options?.defaultCurrency,
    defaultEntity: options?.defaultEntity,
    builtIn: false,
  };
}

/** Check if a template is a D365 template (F&O or BC). */
export function isD365Template(template: UniversalImportTemplate): boolean {
  return template.sourceType === 'd365_fo' || template.sourceType === 'd365_bc';
}

/** Get the D365 flavor from a template, or null if not a D365 template. */
export function getD365Flavor(template: UniversalImportTemplate): D365Flavor | null {
  if (template.sourceType === 'd365_fo') return 'd365_fo';
  if (template.sourceType === 'd365_bc') return 'd365_bc';
  return null;
}
