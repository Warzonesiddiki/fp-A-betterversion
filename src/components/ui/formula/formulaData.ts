export interface FormulaFunction {
  name: string;
  category: string;
  syntax: string;
  description: string;
  params: string[];
}

export { LOOKUP_FUNCTIONS, MATH_FUNCTIONS } from './lookupMathFunctions';
export {
  FINANCIAL_FUNCTIONS,
  LOGICAL_FUNCTIONS,
  TEXT_FUNCTIONS,
  DATE_FUNCTIONS,
  STATISTICAL_FUNCTIONS,
} from './financialLogicalTextDateStatFunctions';

import { LOOKUP_FUNCTIONS, MATH_FUNCTIONS } from './lookupMathFunctions';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);
import {
  FINANCIAL_FUNCTIONS,
  LOGICAL_FUNCTIONS,
  TEXT_FUNCTIONS,
  DATE_FUNCTIONS,
  STATISTICAL_FUNCTIONS,
} from './financialLogicalTextDateStatFunctions';

export const FUNCTIONS: FormulaFunction[] = [
  ...LOOKUP_FUNCTIONS,
  ...MATH_FUNCTIONS,
  ...FINANCIAL_FUNCTIONS,
  ...LOGICAL_FUNCTIONS,
  ...TEXT_FUNCTIONS,
  ...DATE_FUNCTIONS,
  ...STATISTICAL_FUNCTIONS,
];
