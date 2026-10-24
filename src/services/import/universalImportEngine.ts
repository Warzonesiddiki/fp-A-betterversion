/**
 * Universal Import Engine (O1: universal data importer)
 *
 * Applies a UniversalImportTemplate to parse any data source into GL entries.
 * The engine wraps the existing parseGLRows/parseD365Rows pipeline:
 *
 *  - D365 templates (F&O, BC): uses parseD365Rows with auto-detection
 *  - Generic templates (CSV, XLSX, custom): uses parseGLRows with the
 *    template's column mappings
 *
 * The engine is pure — no clock, no store, no React. It returns entries
 * and rejections that the staging coordinator promotes to the GL store.
 */

import type { GLEntry, ImportRejection } from '@/types';
import { parseGLRows, type GLColumnMappings, type ParseGLRowsResult } from './parseGLRows';
import {
  parseD365Rows,
  detectD365Flavor,
  suggestGLImportMappings,
  type D365ParseResult,
  type D365Flavor,
} from './d365Parser';
import type { UniversalImportTemplate, ImportSourceType } from './universalImportTemplate';
import { isD365Template, getD365Flavor, detectTemplate } from './universalImportTemplate';

/** Result of a universal import parse operation. */
export interface UniversalImportResult {
  /** Parsed GL entries, ready for staging. */
  readonly entries: Partial<GLEntry>[];
  /** 1-based source-file row for each entry, aligned by index. */
  readonly sourceRows: number[];
  /** Every rejected row with a machine code and a human reason. */
  readonly rejections: ImportRejection[];
  /** Human-readable `Row N: reason` lines. */
  readonly rowErrors: string[];
  /** The source type that was used. */
  readonly sourceType: ImportSourceType;
  /** The D365 flavor if applicable, null otherwise. */
  readonly d365Flavor: D365Flavor | null;
  /** Total rows in the input. */
  readonly totalRows: number;
  /** Number of rows that produced entries. */
  readonly acceptedRows: number;
  /** Number of rows that were rejected. */
  readonly rejectedRows: number;
}

/** Input data for the universal import engine. */
export interface UniversalImportInput {
  /** Raw data rows, keyed by source column header. */
  readonly rows: readonly Readonly<Record<string, string | undefined>>[];
  /** The template to apply. */
  readonly template: UniversalImportTemplate;
  /** Source-file row number of rows[0] (default 2: header is row 1). */
  readonly firstRowNumber?: number;
}

/**
 * Parse raw data rows using a universal import template.
 *
 * For D365 templates, the engine uses parseD365Rows with auto-detection.
 * For generic templates, the engine uses parseGLRows with the template's
 * column mappings.
 *
 * The function does not touch the clock, the store, or React.
 */
export function universalImportParse(input: UniversalImportInput): UniversalImportResult {
  const { rows, template, firstRowNumber = 2 } = input;
  const headers = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : [];

  let parseResult: ParseGLRowsResult | D365ParseResult;
  let sourceType: ImportSourceType;
  let d365Flavor: D365Flavor | null = null;

  if (isD365Template(template)) {
    // D365 templates use parseD365Rows with auto-detection
    const flavor = getD365Flavor(template) ?? detectFlavorFromHeaders(headers);
    d365Flavor = flavor;
    sourceType = flavor === 'd365_bc' ? 'd365_bc' : 'd365_fo';

    // parseD365Rows takes Record<string, unknown> — convert from string|undefined
    const d365Rows = rows.map((row) => {
      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        converted[key] = value ?? '';
      }
      return converted;
    });

    parseResult = parseD365Rows(d365Rows, {
      flavor,
      defaultCurrency: template.defaultCurrency,
      defaultEntity: template.defaultEntity,
    });
  } else {
    // Generic templates use parseGLRows with the template's mappings
    sourceType = template.sourceType;
    parseResult = parseGLRows(rows, template.mappings, firstRowNumber, {
      flavor: null, // Force generic dialect for user templates
    });
  }

  const entries = parseResult.entries;
  const sourceRows = parseResult.sourceRows;
  const rejections = parseResult.rejections;
  const rowErrors = parseResult.rowErrors;

  return {
    entries,
    sourceRows,
    rejections,
    rowErrors,
    sourceType,
    d365Flavor,
    totalRows: rows.length,
    acceptedRows: entries.length,
    rejectedRows: new Set(rejections.map((r) => r.row)).size,
  };
}

/**
 * Detect the D365 flavor from headers. Returns null for non-D365 headers.
 */
function detectFlavorFromHeaders(headers: readonly string[]): D365Flavor {
  return detectD365Flavor(headers) ?? 'd365_fo';
}

/**
 * Auto-detect the best template for a given header set and parse the data.
 *
 * Uses D365 flavor detection to auto-select the built-in D365 template.
 * Falls back to a generic template with no mappings (user must map columns).
 */
export function universalImportAutoDetect(
  rows: readonly Readonly<Record<string, string | undefined>>[],
  firstRowNumber = 2
): {
  result: UniversalImportResult;
  detectedTemplateId: string | null;
} {
  const headers = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : [];
  const template = detectTemplate(headers);

  if (template) {
    const result = universalImportParse({ rows, template, firstRowNumber });
    return { result, detectedTemplateId: template.id };
  }

  // No built-in template matched — return a generic parse with no mappings
  // (all rows will be rejected because accountCode and postDate are unmapped)
  const genericTemplate: UniversalImportTemplate = {
    id: 'auto-generic',
    name: 'Auto-detected (generic)',
    description: 'Auto-detected generic template — no built-in match',
    sourceType: 'generic_csv',
    mappings: {},
    dateFormat: 'auto',
    builtIn: false,
  };
  const result = universalImportParse({ rows, template: genericTemplate, firstRowNumber });
  return { result, detectedTemplateId: null };
}

/**
 * Build column mappings from a template's source type and headers.
 *
 * For D365 templates, returns the auto-detected mappings.
 * For generic templates, returns empty mappings (user must provide them).
 */
export function buildMappingsFromTemplate(
  template: UniversalImportTemplate,
  headers: readonly string[]
): GLColumnMappings {
  if (isD365Template(template)) {
    // D365 templates auto-detect mappings from headers
    const suggestion = suggestGLImportMappings(headers);
    return suggestion?.mappings ?? {};
  }
  return template.mappings;
}
