// =============================================================================
// REPORT BUILDER — Formulas & Data Binding
// Formula evaluation, circular reference detection, data binding, section mgmt
// =============================================================================

import {
  type ReportLayout,
  type ReportCell,
  type ReportSection,
  type CellBinding,
  type ResolvedCell,
  type CubeData,
  type MetricCellContent,
  type FormulaCellContent,
  type FormulaDependency,
  type RowType,
  type NumberFormat,
  type ReportParameter,
  type ReportDefinition,
} from './report-builder-types';
import { generateReportId } from './report-builder-templates';
import { sumMoney } from '../utils/money';

// ---------------------------------------------------------------------------
// Formula Parsing
// ---------------------------------------------------------------------------

export function parseFormulaReferences(expression: string): string[] {
  const refPattern = /[A-Z]+\d+/g;
  return [...new Set(expression.match(refPattern) ?? [])];
}

export function evaluateFormula(expression: string, cellValues: Record<string, number>): number {
  let resolved = expression;
  const refs = parseFormulaReferences(expression);

  for (const ref of refs) {
    const value = cellValues[ref];
    if (value === undefined) {
      throw new Error(`Missing value for cell reference: ${ref}`);
    }
    if (!Number.isFinite(value)) {
      throw new Error(`Non-finite value for cell reference: ${ref}`);
    }
    resolved = resolved.replace(new RegExp(ref, 'g'), String(value));
  }

  return safeEvaluate(resolved);
}

// ---------------------------------------------------------------------------
// Safe Arithmetic Evaluator
// ---------------------------------------------------------------------------

export function safeEvaluate(expression: string): number {
  const tokens = tokenize(expression);
  const result = parseExpression(tokens, { pos: 0 });

  if (!Number.isFinite(result)) {
    throw new Error('Formula result is not a finite number');
  }
  return result;
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const s = expr.replace(/\s+/g, '');

  while (i < s.length) {
    const ch = s[i];

    if (
      (ch! >= '0' && ch! <= '9') ||
      (ch === '.' && i + 1 < s.length && s![i + 1]! >= '0' && s![i + 1]! <= '9') ||
      // unary minus only folds into a literal when a digit/'.' follows —
      // otherwise it is emitted as an operator and handled by parseFactor
      // (e.g. -(3+5)). MISSION D: previously '-' before '(' produced the
      // bare token '-' and threw "Invalid number: -".
      (ch === '-' &&
        /[0-9.]/.test(s[i + 1] ?? '') &&
        (tokens.length === 0 ||
          tokens[tokens.length - 1] === '(' ||
          '+-*/('.includes(tokens[tokens.length - 1] ?? '')))
    ) {
      let num = ch;
      i++;
      while (i < s.length && ((s[i]! >= '0' && s[i]! <= '9') || s[i]! === '.')) {
        num! += s[i]!;
        i++;
      }
      tokens.push(num!);
    } else if ('+-*/()'.includes(ch!)) {
      tokens.push(ch!);
      i++;
    } else {
      i++;
    }
  }
  return tokens;
}

function parseExpression(tokens: string[], ctx: { pos: number }): number {
  let result = parseTerm(tokens, ctx);

  while (ctx.pos < tokens.length && (tokens[ctx.pos] === '+' || tokens[ctx.pos] === '-')) {
    const op = tokens[ctx.pos];
    ctx.pos++;
    const right = parseTerm(tokens, ctx);
    result = op === '+' ? result + right : result - right;
  }

  return result;
}

function parseTerm(tokens: string[], ctx: { pos: number }): number {
  let result = parseFactor(tokens, ctx);

  while (ctx.pos < tokens.length && (tokens[ctx.pos] === '*' || tokens[ctx.pos] === '/')) {
    const op = tokens[ctx.pos];
    ctx.pos++;
    const right = parseFactor(tokens, ctx);
    if (op === '/' && right === 0) {
      throw new Error('Division by zero');
    }
    result = op === '*' ? result * right : result / right;
  }

  return result;
}

function parseFactor(tokens: string[], ctx: { pos: number }): number {
  if (ctx.pos >= tokens.length) {
    throw new Error('Unexpected end of expression');
  }

  const token = tokens[ctx.pos];

  if (token === '-') {
    // unary minus on a parenthesized or nested expression: -(3+5)
    ctx.pos++;
    return -parseFactor(tokens, ctx);
  }

  if (token === '(') {
    ctx.pos++;
    const result = parseExpression(tokens, ctx);
    if (ctx.pos >= tokens.length || tokens[ctx.pos] !== ')') {
      throw new Error('Missing closing parenthesis');
    }
    ctx.pos++;
    return result;
  }

  ctx.pos++;
  const num = Number(token);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: ${token}`);
  }
  return num;
}

// ---------------------------------------------------------------------------
// Column Letter Conversion
// ---------------------------------------------------------------------------

export function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function columnIndexToLetter(index: number): string {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// ---------------------------------------------------------------------------
// Data Binding — Resolve Cell Values from Cube Data
// ---------------------------------------------------------------------------

export function buildBindingKey(binding: CellBinding): string {
  const parts = [binding.coords, binding.measure];
  if (binding.entityId) parts.push(binding.entityId);
  if (binding.scenarioId) parts.push(binding.scenarioId);
  if (binding.periodId) parts.push(binding.periodId);
  return parts.join('.');
}

export function resolveCellValue(
  cell: ReportCell,
  cubeData: CubeData,
  formatNumber: (value: number, format: NumberFormat, decimals: number) => string
): ResolvedCell {
  const base: ResolvedCell = {
    cellId: cell.id,
    rawValue: null,
    formattedValue: '',
    binding: null,
  };

  if (cell.type === 'text') {
    const textContent = cell.content as { content: { text: string } };
    base.rawValue = textContent.content.text;
    base.formattedValue = textContent.content.text;
    return base;
  }

  if (cell.type === 'metric') {
    const metricContent = cell.content as { content: MetricCellContent };
    const mc = metricContent.content;
    const binding: CellBinding = {
      coords: mc.coords,
      measure: mc.measure,
      entityId: mc.entityId,
      scenarioId: mc.scenarioId,
      periodId: mc.periodId,
    };
    base.binding = binding;

    const key = buildBindingKey(binding);
    const value = cubeData[key];

    if (value !== undefined && value !== null) {
      const numValue = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numValue)) {
        base.rawValue = numValue;
        base.formattedValue = formatNumber(numValue, mc.format, mc.decimals);
      } else {
        base.rawValue = String(value);
        base.formattedValue = String(value);
      }
    } else {
      base.rawValue = null;
      base.formattedValue = '\u2014';
    }
    return base;
  }

  if (cell.type === 'formula') {
    const formulaContent = cell.content as { content: FormulaCellContent };
    base.rawValue = null;
    base.formattedValue = formulaContent.content.label ?? formulaContent.content.expression;
    return base;
  }

  if (cell.type === 'chart') {
    const chartContent = cell.content as { content: { title: string } };
    base.rawValue = null;
    base.formattedValue = `[Chart: ${chartContent.content.title}]`;
    return base;
  }

  if (cell.type === 'table') {
    base.rawValue = null;
    base.formattedValue = '[Table]';
    return base;
  }

  return base;
}

export function resolveLayout(
  layout: ReportLayout,
  cubeData: CubeData,
  formatNumber: (value: number, format: NumberFormat, decimals: number) => string
): ResolvedCell[][] {
  return layout.rows.map((row) =>
    row.cells.map((cell) => resolveCellValue(cell, cubeData, formatNumber))
  );
}

export function buildMetricKey(content: MetricCellContent): string {
  const binding: CellBinding = {
    coords: content.coords,
    measure: content.measure,
    entityId: content.entityId,
    scenarioId: content.scenarioId,
    periodId: content.periodId,
  };
  return buildBindingKey(binding);
}

// ---------------------------------------------------------------------------
// Circular Reference Detection
// ---------------------------------------------------------------------------

export function detectCircularReferences(layout: ReportLayout): FormulaDependency[] {
  const cellIdMap = new Map<string, { row: number; col: number }>();
  const dependencies = new Map<string, string[]>();

  for (let ri = 0; ri < layout.rows.length; ri++) {
    for (let ci = 0; ci < layout.rows[ri]!.cells.length; ci++) {
      const cell = layout.rows[ri]!.cells[ci];
      cellIdMap.set(cell!.id, { row: ri, col: ci });

      if (cell!.type === 'formula') {
        const formulaContent = cell!.content as { content: FormulaCellContent };
        const refs = parseFormulaReferences(formulaContent.content.expression);
        const depIds: string[] = [];
        for (const ref of refs) {
          const colLetter = ref.match(/[A-Z]+/)?.[0] ?? '';
          const rowNum = parseInt(ref.match(/\d+/)?.[0] ?? '0', 10);
          const colIndex = columnLetterToIndex(colLetter);
          if (colIndex >= 0 && rowNum >= 1 && rowNum <= layout.rows.length) {
            const targetCell = layout.rows[rowNum - 1]?.cells[colIndex];
            if (targetCell) {
              depIds.push(targetCell.id);
            }
          }
        }
        dependencies.set(cell!.id, depIds);
      }
    }
  }

  const results: FormulaDependency[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfs = (cellId: string, path: string[]): boolean => {
    if (inStack.has(cellId)) {
      return true;
    }
    if (visited.has(cellId)) return false;

    visited.add(cellId);
    inStack.add(cellId);

    const deps = dependencies.get(cellId) ?? [];
    let hasCycle = false;
    for (const dep of deps) {
      if (dfs(dep, [...path, cellId])) {
        hasCycle = true;
      }
    }

    inStack.delete(cellId);

    if (hasCycle || deps.some((d) => inStack.has(d))) {
      results.push({ cellId, references: deps, hasCircularRef: true });
    } else {
      results.push({ cellId, references: deps, hasCircularRef: false });
    }

    return hasCycle;
  };

  for (const cellId of dependencies.keys()) {
    if (!visited.has(cellId)) {
      dfs(cellId, []);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Subtotal / Total Calculations
// ---------------------------------------------------------------------------

export function calculateColumnSum(
  resolvedCells: ResolvedCell[][],
  columnIndex: number,
  startRow: number,
  endRow: number
): number {
  // Collect finite numeric cell values and sum them with exact decimal
  // arithmetic so report subtotal/total rows do not accumulate IEEE-754 drift
  // over long columns.
  const values: number[] = [];
  for (let i = startRow; i <= endRow && i < resolvedCells.length; i++) {
    const cell = resolvedCells[i]?.[columnIndex];
    if (cell && typeof cell.rawValue === 'number' && Number.isFinite(cell.rawValue)) {
      values.push(cell.rawValue);
    }
  }
  return sumMoney(values).toNumber();
}

export function identifySectionRanges(layout: ReportLayout): Array<{
  type: 'data' | 'subtotal' | 'total';
  startIndex: number;
  endIndex: number;
}> {
  const sections: Array<{
    type: 'data' | 'subtotal' | 'total';
    startIndex: number;
    endIndex: number;
  }> = [];
  let currentType: 'data' | 'subtotal' | 'total' | null = null;
  let startIndex = 0;

  for (let i = 0; i < layout.rows.length; i++) {
    const rowType = layout.rows[i]!.type;
    const normalizedType: 'data' | 'subtotal' | 'total' =
      rowType === 'data' || rowType === 'header'
        ? 'data'
        : rowType === 'subtotal'
          ? 'subtotal'
          : rowType === 'total'
            ? 'total'
            : 'data';

    if (normalizedType !== currentType) {
      if (currentType !== null) {
        sections.push({ type: currentType, startIndex, endIndex: i - 1 });
      }
      currentType = normalizedType;
      startIndex = i;
    }
  }

  if (currentType !== null) {
    sections.push({ type: currentType, startIndex, endIndex: layout.rows.length - 1 });
  }

  return sections;
}

export function autoPopulateTotals(
  layout: ReportLayout,
  cubeData: CubeData,
  numberFormat: NumberFormat = 'currency',
  decimals = 0
): ReportLayout {
  const _resolved = resolveLayout(layout, cubeData, (v, f, d) => {
    void v;
    void f;
    void d;
    return '';
  });
  const sections = identifySectionRanges(layout);

  const rows = layout.rows.map((row) => ({ ...row, cells: [...row.cells] }));

  for (const section of sections) {
    if (section.type !== 'subtotal' && section.type !== 'total') continue;

    const precedingData = sections.filter(
      (s) => s.type === 'data' && s.endIndex < section.startIndex
    );
    if (precedingData.length === 0) continue;

    const _dataSection = precedingData[precedingData.length - 1];

    for (let colIdx = 0; colIdx < layout.columns.length; colIdx++) {
      const col = layout.columns[colIdx];
      if (col!.type === 'label') continue;

      const existingCell = rows![section.startIndex]!.cells[colIdx];

      if (existingCell!.type === 'metric') {
        rows![section.startIndex]!.cells[colIdx] = {
          ...existingCell,
          content: {
            type: 'metric' as const,
            content: {
              coords: `Auto.${section.type}.${colIdx}`,
              measure: 'sum',
              format: numberFormat,
              decimals,
              showSign: false,
            },
          },
        } as ReportCell;
      }
    }
  }

  return { ...layout, rows };
}

// ---------------------------------------------------------------------------
// Section Management
// ---------------------------------------------------------------------------

export function getSections(layout: ReportLayout): ReportSection[] {
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;

  for (let i = 0; i < layout.rows.length; i++) {
    const row = layout.rows[i];
    const sectionType = rowTypeToSectionType(row!.type);

    if (!currentSection || currentSection.type !== sectionType) {
      if (currentSection) {
        currentSection.endRowIndex = i - 1;
        sections.push(currentSection);
      }
      currentSection = {
        id: generateReportId(),
        type: sectionType,
        title: getSectionTitle(layout, i, sectionType),
        startRowIndex: i,
        endRowIndex: i,
        isCollapsed: false,
      };
    } else {
      currentSection.endRowIndex = i;
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function rowTypeToSectionType(rowType: RowType): ReportSection['type'] {
  switch (rowType) {
    case 'header':
      return 'header';
    case 'data':
      return 'data';
    case 'subtotal':
      return 'subtotal';
    case 'total':
      return 'total';
    case 'blank':
      return 'text';
    default:
      return 'data';
  }
}

function getSectionTitle(
  layout: ReportLayout,
  rowIndex: number,
  sectionType: ReportSection['type']
): string {
  const row = layout.rows[rowIndex];
  const labelCell = row!.cells.find((_, ci) => layout.columns[ci]?.type === 'label');
  if (labelCell) {
    const textContent = labelCell.content as { content?: { text?: string } };
    if (textContent.content?.text) return textContent.content.text;
  }
  return `${sectionType.charAt(0).toUpperCase()}${sectionType.slice(1)} Section`;
}

// ---------------------------------------------------------------------------
// Report Parameters
// ---------------------------------------------------------------------------

export function addParameter(
  report: ReportDefinition,
  parameter: ReportParameter
): ReportDefinition {
  const existing =
    (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
  if (existing.some((p) => p.id === parameter.id)) {
    throw new Error(`Parameter "${parameter.id}" already exists`);
  }

  return {
    ...report,
    parameters: [...existing, parameter],
    updatedAt: new Date().toISOString(),
    version: report.version + 1,
  } as ReportDefinition;
}

export function updateParameterValue(
  report: ReportDefinition,
  parameterId: string,
  value: string | number | boolean
): ReportDefinition {
  const existing =
    (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
  const index = existing.findIndex((p) => p.id === parameterId);
  if (index === -1) {
    throw new Error(`Parameter "${parameterId}" not found`);
  }

  const updated = existing.map((p, i) => (i === index ? { ...p, value } : p));

  return {
    ...report,
    parameters: updated,
    updatedAt: new Date().toISOString(),
    version: report.version + 1,
  } as ReportDefinition;
}

export function removeParameter(report: ReportDefinition, parameterId: string): ReportDefinition {
  const existing =
    (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
  return {
    ...report,
    parameters: existing.filter((p) => p.id !== parameterId),
    updatedAt: new Date().toISOString(),
    version: report.version + 1,
  } as ReportDefinition;
}

export function getParameters(report: ReportDefinition): ReportParameter[] {
  return (report as ReportDefinition & { parameters?: ReportParameter[] }).parameters ?? [];
}
