/**
 * ConditionalFormattingEngine
 *
 * Rule-based cell formatting engine supporting multiple rule types,
 * operators, visual formats, icon sets, color scales, and data bars.
 */

// ── Rule Type Definitions ──────────────────────────────────────────

export type RuleType = 'cellValue' | 'formula' | 'text' | 'date' | 'rank' | 'average';

export type Operator =
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'equal'
  | 'notEqual'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'topN'
  | 'bottomN'
  | 'aboveAverage'
  | 'belowAverage';

export type VisualType = 'backgroundColor' | 'textColor' | 'dataBar' | 'iconSet' | 'colorScale';

export type IconSetType =
  | '3-arrows'
  | '3-traffic-lights'
  | '3-stars'
  | '5-ratings'
  | '4-traffic-lights';

export type ColorScaleType = '2-color' | '3-color';

export type DataBarStyle = 'solid' | 'gradient';

// ── Interfaces ─────────────────────────────────────────────────────

export interface FormattingStyle {
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  border?: string;
}

export interface DataBarConfig {
  style: DataBarStyle;
  barColor: string;
  axisColor?: string;
  showAxis: boolean;
  showValue: boolean;
  minimum?: number;
  maximum?: number;
}

export interface IconSetConfig {
  type: IconSetType;
  reverse: boolean;
  showIconOnly: boolean;
}

export interface ColorScaleConfig {
  type: ColorScaleType;
  minColor: string;
  midColor?: string;
  maxColor: string;
  minimum?: number;
  midpoint?: number;
  maximum?: number;
}

export interface ConditionConfig {
  ruleType: RuleType;
  operator: Operator;
  value?: number;
  value2?: number; // for 'between'
  text?: string;
  formula?: string;
  rankValue?: number; // for topN/bottomN
  columnKey?: string;
}

export interface ConditionalFormatRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  condition: ConditionConfig;
  visualType: VisualType;
  style?: FormattingStyle;
  dataBar?: DataBarConfig;
  iconSet?: IconSetConfig;
  colorScale?: ColorScaleConfig;
}

export interface EvaluatedFormat {
  style?: FormattingStyle;
  dataBar?: DataBarConfig & { percentage: number };
  iconSet?: IconSetConfig & { iconIndex: number };
  colorScale?: ColorScaleConfig & { interpolatedColor: string };
  matched: boolean;
  ruleId: string;
}

// ── Preset Factories ────────────────────────────────────────────────

export function createVarianceHighlightRule(
  id: string = 'variance-highlight'
): ConditionalFormatRule {
  return {
    id,
    name: 'Variance Highlighting',
    enabled: true,
    priority: 100,
    condition: {
      ruleType: 'cellValue',
      operator: 'greaterThan',
      value: 0,
      columnKey: 'variance',
    },
    visualType: 'backgroundColor',
    style: { backgroundColor: '#dcfce7', textColor: '#166534' },
  };
}

export function createNegativeVarianceRule(
  id: string = 'variance-negative'
): ConditionalFormatRule {
  return {
    id,
    name: 'Negative Variance',
    enabled: true,
    priority: 99,
    condition: {
      ruleType: 'cellValue',
      operator: 'lessThan',
      value: 0,
      columnKey: 'variance',
    },
    visualType: 'backgroundColor',
    style: { backgroundColor: '#fee2e2', textColor: '#991b1b' },
  };
}

export function createGrowthRateRule(id: string = 'growth-rate'): ConditionalFormatRule {
  return {
    id,
    name: 'Growth Rate (3-color)',
    enabled: true,
    priority: 90,
    condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
    visualType: 'colorScale',
    colorScale: {
      type: '3-color',
      minColor: '#fee2e2',
      midColor: '#fef9c3',
      maxColor: '#dcfce7',
      minimum: -20,
      midpoint: 0,
      maximum: 20,
    },
  };
}

export function createBudgetVsActualRule(id: string = 'bva-traffic'): ConditionalFormatRule {
  return {
    id,
    name: 'Budget vs Actual (3-arrows)',
    enabled: true,
    priority: 95,
    condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
    visualType: 'iconSet',
    iconSet: { type: '3-arrows', reverse: false, showIconOnly: false },
  };
}

// ── Utility: generate unique IDs ────────────────────────────────────

let _idCounter = 0;
export function generateRuleId(): string {
  return `cf-rule-${Date.now()}-${++_idCounter}`;
}

// ── Icon Definitions ────────────────────────────────────────────────

const ICON_SETS: Record<IconSetType, string[]> = {
  '3-arrows': ['↑', '→', '↓'],
  '3-traffic-lights': ['🟢', '🟡', '🔴'],
  '3-stars': ['★', '★', '☆'],
  '5-ratings': ['★★★★★', '★★★★', '★★★', '★★', '★'],
  '4-traffic-lights': ['🟢', '🟡', '🟠', '🔴'],
};

function getIconIndex(value: number, iconSet: IconSetConfig, allValues: number[]): number {
  const icons = ICON_SETS[iconSet.type];
  const n = icons.length;
  const sorted = [...allValues].sort((a, b) => a - b);
  const idx = sorted.indexOf(value);
  const bucket = Math.min(n - 1, Math.floor((idx / sorted.length) * n));
  return iconSet.reverse ? n - 1 - bucket : bucket;
}

// ── Color interpolation ─────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function interpolate3Color(color1: string, color2: string, color3: string, t: number): string {
  if (t <= 0.5) {
    return interpolateColor(color1, color2, t * 2);
  }
  return interpolateColor(color2, color3, (t - 0.5) * 2);
}

// ── Comparison Logic ────────────────────────────────────────────────

function compareValues(
  cellValue: unknown,
  condition: ConditionConfig,
  _allColumnValues?: number[],
  allValues?: number[]
): boolean {
  if (cellValue === null || cellValue === undefined) return false;

  const numVal = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue));
  const strVal = String(cellValue).toLowerCase();

  switch (condition.operator) {
    case 'greaterThan':
      return !isNaN(numVal) && numVal > (condition.value ?? 0);
    case 'greaterThanOrEqual':
      return !isNaN(numVal) && numVal >= (condition.value ?? 0);
    case 'lessThan':
      return !isNaN(numVal) && numVal < (condition.value ?? 0);
    case 'lessThanOrEqual':
      return !isNaN(numVal) && numVal <= (condition.value ?? 0);
    case 'between':
      return (
        !isNaN(numVal) &&
        numVal >= (condition.value ?? -Infinity) &&
        numVal <= (condition.value2 ?? Infinity)
      );
    case 'equal':
      if (condition.text !== undefined) {
        return strVal === condition.text.toLowerCase();
      }
      return !isNaN(numVal) && numVal === (condition.value ?? 0);
    case 'notEqual':
      if (condition.text !== undefined) {
        return strVal !== condition.text.toLowerCase();
      }
      return isNaN(numVal) || numVal !== (condition.value ?? 0);
    case 'contains':
      return strVal.includes((condition.text ?? '').toLowerCase());
    case 'startsWith':
      return strVal.startsWith((condition.text ?? '').toLowerCase());
    case 'endsWith':
      return strVal.endsWith((condition.text ?? '').toLowerCase());
    case 'topN':
    case 'bottomN':
      if (!allValues || allValues.length === 0) return false;
      const sortedDesc = [...allValues].sort((a, b) => b - a);
      const n = condition.rankValue ?? 10;
      const threshold =
        condition.operator === 'topN' ? sortedDesc[n - 1] : sortedDesc[sortedDesc.length - n];
      return condition.operator === 'topN' ? numVal >= threshold : numVal <= threshold;
    case 'aboveAverage':
      if (!allValues || allValues.length === 0) return false;
      const avg = allValues.reduce((s, v) => s + v, 0) / allValues.length;
      return numVal > avg;
    case 'belowAverage':
      if (!allValues || allValues.length === 0) return false;
      const avgBelow = allValues.reduce((s, v) => s + v, 0) / allValues.length;
      return numVal < avgBelow;
    default:
      return false;
  }
}

// ── Main Evaluation ─────────────────────────────────────────────────

/**
 * Evaluate a single rule against a cell value.
 * Pass `allValues` for rank/average-based rules and icon sets.
 */
export function evaluateRule(
  rule: ConditionalFormatRule,
  cellValue: unknown,
  allValues: number[] = []
): EvaluatedFormat {
  if (!rule.enabled) {
    return { matched: false, ruleId: rule.id };
  }

  const matches =
    rule.condition.ruleType === 'formula'
      ? true // formula evaluation delegated to caller
      : compareValues(cellValue, rule.condition, undefined, allValues);

  if (!matches) {
    return { matched: false, ruleId: rule.id };
  }

  const numVal = typeof cellValue === 'number' ? cellValue : parseFloat(String(cellValue));
  const result: EvaluatedFormat = { matched: true, ruleId: rule.id };

  switch (rule.visualType) {
    case 'backgroundColor':
    case 'textColor':
      result.style = rule.style;
      break;

    case 'dataBar': {
      const dBar = rule.dataBar!;
      const min = dBar.minimum ?? Math.min(...allValues, 0);
      const max = dBar.maximum ?? Math.max(...allValues, 1);
      const pct = max === min ? 0 : Math.max(0, Math.min(1, (numVal - min) / (max - min)));
      result.dataBar = { ...dBar, percentage: pct };
      break;
    }

    case 'iconSet': {
      const iSet = rule.iconSet!;
      result.iconSet = {
        ...iSet,
        iconIndex: getIconIndex(numVal, iSet, allValues),
      };
      break;
    }

    case 'colorScale': {
      const cScale = rule.colorScale!;
      const min = cScale.minimum ?? Math.min(...allValues);
      const max = cScale.maximum ?? Math.max(...allValues);
      const t = max === min ? 0.5 : Math.max(0, Math.min(1, (numVal - min) / (max - min)));
      const color =
        cScale.type === '3-color'
          ? interpolate3Color(cScale.minColor, cScale.midColor!, cScale.maxColor, t)
          : interpolateColor(cScale.minColor, cScale.maxColor, t);
      result.colorScale = { ...cScale, interpolatedColor: color };
      break;
    }
  }

  return result;
}

/**
 * Evaluate all rules against a cell value, returning the highest-priority match.
 * Rules should be sorted by priority (highest first) before calling.
 */
export function evaluateRules(
  rules: ConditionalFormatRule[],
  cellValue: unknown,
  allValues: number[] = []
): EvaluatedFormat | null {
  const sorted = [...rules].filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    const result = evaluateRule(rule, cellValue, allValues);
    if (result.matched) return result;
  }
  return null;
}

/**
 * Reorder rules by priority (mutates the array in-place, returns new array).
 */
export function reorderRules(rules: ConditionalFormatRule[]): ConditionalFormatRule[] {
  return [...rules].sort((a, b) => b.priority - a.priority);
}

/**
 * Build CSS style object from an EvaluatedFormat.
 */
export function buildStyleFromFormat(evaluated: EvaluatedFormat): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (evaluated.style?.backgroundColor) {
    style.backgroundColor = evaluated.style.backgroundColor;
  }
  if (evaluated.style?.textColor) {
    style.color = evaluated.style.textColor;
  }
  if (evaluated.style?.fontWeight) {
    style.fontWeight = evaluated.style.fontWeight;
  }
  if (evaluated.style?.fontStyle) {
    style.fontStyle = evaluated.style.fontStyle;
  }
  if (evaluated.style?.textDecoration) {
    style.textDecoration = evaluated.style.textDecoration;
  }
  if (evaluated.style?.border) {
    style.border = evaluated.style.border;
  }

  if (evaluated.colorScale) {
    style.backgroundColor = evaluated.colorScale.interpolatedColor;
  }

  return style;
}

// ── Default Rule Set ────────────────────────────────────────────────

export const DEFAULT_RULES: ConditionalFormatRule[] = [
  createVarianceHighlightRule(),
  createNegativeVarianceRule(),
  createGrowthRateRule(),
  createBudgetVsActualRule(),
];
