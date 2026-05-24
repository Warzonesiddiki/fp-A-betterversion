import type {
  RuleType,
  Operator,
  VisualType,
  IconSetType,
} from '@/engines/ConditionalFormattingEngine';

export const RULE_TYPES: { value: RuleType; label: string }[] = [
  { value: 'cellValue', label: 'Cell Value' },
  { value: 'text', label: 'Text' },
  { value: 'formula', label: 'Formula' },
  { value: 'rank', label: 'Rank' },
  { value: 'average', label: 'Average' },
];

export const OPERATORS: {
  value: Operator;
  label: string;
  needsValue: boolean;
  needsValue2: boolean;
}[] = [
  { value: 'greaterThan', label: 'Greater Than', needsValue: true, needsValue2: false },
  {
    value: 'greaterThanOrEqual',
    label: 'Greater Than or Equal',
    needsValue: true,
    needsValue2: false,
  },
  { value: 'lessThan', label: 'Less Than', needsValue: true, needsValue2: false },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal', needsValue: true, needsValue2: false },
  { value: 'between', label: 'Between', needsValue: true, needsValue2: true },
  { value: 'equal', label: 'Equal To', needsValue: true, needsValue2: false },
  { value: 'notEqual', label: 'Not Equal To', needsValue: true, needsValue2: false },
  { value: 'contains', label: 'Contains', needsValue: false, needsValue2: false },
  { value: 'startsWith', label: 'Starts With', needsValue: false, needsValue2: false },
  { value: 'endsWith', label: 'Ends With', needsValue: false, needsValue2: false },
  { value: 'topN', label: 'Top N', needsValue: false, needsValue2: false },
  { value: 'bottomN', label: 'Bottom N', needsValue: false, needsValue2: false },
  { value: 'aboveAverage', label: 'Above Average', needsValue: false, needsValue2: false },
  { value: 'belowAverage', label: 'Below Average', needsValue: false, needsValue2: false },
];

export const VISUAL_TYPES: { value: VisualType; label: string }[] = [
  { value: 'backgroundColor', label: 'Background Color' },
  { value: 'textColor', label: 'Text Color' },
  { value: 'dataBar', label: 'Data Bar' },
  { value: 'iconSet', label: 'Icon Set' },
  { value: 'colorScale', label: 'Color Scale' },
];

export const ICON_SET_TYPES: { value: IconSetType; label: string }[] = [
  { value: '3-arrows', label: '3 Arrows' },
  { value: '3-traffic-lights', label: '3 Traffic Lights' },
  { value: '3-stars', label: '3 Stars' },
  { value: '4-traffic-lights', label: '4 Traffic Lights' },
  { value: '5-ratings', label: '5 Ratings' },
];

export const PRESET_COLORS = [
  '#fee2e2',
  '#fef9c3',
  '#dcfce7',
  '#dbeafe',
  '#f3e8ff',
  '#fce7f3',
  '#ffedd5',
  '#e0f2fe',
  '#d1fae5',
  '#fef3c7',
];
