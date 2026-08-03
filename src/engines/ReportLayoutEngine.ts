/**
 * ReportLayoutEngine — Financial report formatting
 *
 * Generates standard accounting layouts:
 * - P&L: Revenue → COGS → Gross Profit → OpEx → EBITDA → Net Income
 * - Balance Sheet: Assets = Liabilities + Equity
 * - Cash Flow: Operating → Investing → Financing
 *
 * Rules:
 * - Double underlines on totals
 * - Indented line items
 * - Group headers with collapse toggle
 * - Spacing between sections
 *
 * MONEY MIGRATION (2026-08-03): P&L revenue, COGS, operating expenses,
 * profit, and balance-sheet asset/liability/equity totals use the canonical
 * money primitive (`src/utils/money.ts`). Financial report totals are rounded
 * to cents; layout geometry and HTML display formatting remain non-money.
 */

import { roundTo, subtractMoney, sumMoney } from '@/utils/money';

export interface ReportSection {
  id: string;
  type: 'header' | 'line_item' | 'subtotal' | 'total' | 'spacer' | 'group_header';
  label: string;
  indent: number;
  bold: boolean;
  underline: 'none' | 'single' | 'double';
  showLineAbove: boolean;
  fontSize: 'normal' | 'small' | 'large';
  values: Record<string, number | null>;
  formula?: string;
  isPercentage: boolean;
  collapseToggle?: boolean;
  children?: ReportSection[];
}

function makeLineItem(
  id: string,
  label: string,
  indent: number,
  values: Record<string, number | null>
): ReportSection {
  return {
    id,
    type: 'line_item',
    label,
    indent,
    bold: false,
    underline: 'none',
    showLineAbove: false,
    fontSize: 'normal',
    values,
    isPercentage: false,
  };
}

function makeTotal(
  id: string,
  label: string,
  values: Record<string, number | null>,
  underline: 'single' | 'double' = 'single'
): ReportSection {
  return {
    id,
    type: 'total',
    label,
    indent: 0,
    bold: true,
    underline,
    showLineAbove: true,
    fontSize: 'large',
    values,
    isPercentage: false,
  };
}

function sumValues(...sections: Record<string, number | null>[]): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  const periods = new Set(sections.flatMap((section) => Object.keys(section)));

  for (const period of periods) {
    result[period] = roundTo(sumMoney(sections.map((section) => section[period] ?? 0)));
  }
  return result;
}

function subtractValues(
  a: Record<string, number | null>,
  b: Record<string, number | null>
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    result[key] = roundTo(subtractMoney(a[key] ?? 0, b[key] ?? 0));
  }
  return result;
}

export function generateProfitAndLossLayout(
  data: Record<string, Record<string, number | null>>
): ReportSection[] {
  return [
    {
      id: 'revenue-header',
      type: 'group_header',
      label: 'Revenue',
      indent: 0,
      bold: true,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      collapseToggle: true,
      isPercentage: false,
      values: {},
      children: [
        makeLineItem('product-revenue', 'Product Revenue', 1, data.productRevenue ?? {}),
        makeLineItem('service-revenue', 'Service Revenue', 1, data.serviceRevenue ?? {}),
        makeLineItem('other-revenue', 'Other Revenue', 1, data.otherRevenue ?? {}),
      ],
    },
    makeTotal(
      'total-revenue',
      'Total Revenue',
      sumValues(data.productRevenue ?? {}, data.serviceRevenue ?? {}, data.otherRevenue ?? {})
    ),

    {
      id: 'spacer-1',
      type: 'spacer',
      label: '',
      indent: 0,
      bold: false,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      isPercentage: false,
      values: {},
    },

    {
      id: 'cogs-header',
      type: 'group_header',
      label: 'Cost of Goods Sold',
      indent: 0,
      bold: true,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      collapseToggle: true,
      isPercentage: false,
      values: {},
      children: [
        makeLineItem('materials', 'Materials', 1, data.materials ?? {}),
        makeLineItem('labor', 'Direct Labor', 1, data.directLabor ?? {}),
        makeLineItem('overhead', 'Manufacturing Overhead', 1, data.overhead ?? {}),
      ],
    },
    makeTotal(
      'total-cogs',
      'Total COGS',
      sumValues(data.materials ?? {}, data.directLabor ?? {}, data.overhead ?? {})
    ),

    makeTotal(
      'gross-profit',
      'Gross Profit',
      subtractValues(
        sumValues(data.productRevenue ?? {}, data.serviceRevenue ?? {}, data.otherRevenue ?? {}),
        sumValues(data.materials ?? {}, data.directLabor ?? {}, data.overhead ?? {})
      ),
      'double'
    ),

    {
      id: 'spacer-2',
      type: 'spacer',
      label: '',
      indent: 0,
      bold: false,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      isPercentage: false,
      values: {},
    },

    {
      id: 'opex-header',
      type: 'group_header',
      label: 'Operating Expenses',
      indent: 0,
      bold: true,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      collapseToggle: true,
      isPercentage: false,
      values: {},
      children: [
        makeLineItem('salaries', 'Salaries & Wages', 1, data.salaries ?? {}),
        makeLineItem('rent', 'Rent & Occupancy', 1, data.rent ?? {}),
        makeLineItem('marketing', 'Marketing & Sales', 1, data.marketing ?? {}),
        makeLineItem('rd', 'Research & Development', 1, data.rd ?? {}),
        makeLineItem('general', 'General & Administrative', 1, data.general ?? {}),
      ],
    },
    makeTotal(
      'total-opex',
      'Total Operating Expenses',
      sumValues(
        data.salaries ?? {},
        data.rent ?? {},
        data.marketing ?? {},
        data.rd ?? {},
        data.general ?? {}
      )
    ),

    makeTotal(
      'ebitda',
      'EBITDA',
      subtractValues(
        subtractValues(
          sumValues(data.productRevenue ?? {}, data.serviceRevenue ?? {}, data.otherRevenue ?? {}),
          sumValues(data.materials ?? {}, data.directLabor ?? {}, data.overhead ?? {})
        ),
        sumValues(
          data.salaries ?? {},
          data.rent ?? {},
          data.marketing ?? {},
          data.rd ?? {},
          data.general ?? {}
        )
      ),
      'double'
    ),
  ];
}

export function generateBalanceSheetLayout(
  data: Record<string, Record<string, number | null>>
): ReportSection[] {
  const totalAssets = sumValues(
    data.currentAssets ?? {},
    data.fixedAssets ?? {},
    data.otherAssets ?? {}
  );
  const totalLiabilities = sumValues(data.currentLiabilities ?? {}, data.longTermLiabilities ?? {});
  const totalEquity = sumValues(
    data.retainedEarnings ?? {},
    data.capitalStock ?? {},
    data.additionalPaidIn ?? {}
  );

  return [
    {
      id: 'assets-header',
      type: 'group_header',
      label: 'Assets',
      indent: 0,
      bold: true,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      collapseToggle: true,
      isPercentage: false,
      values: {},
      children: [
        makeLineItem('current-assets', 'Current Assets', 1, data.currentAssets ?? {}),
        makeLineItem('fixed-assets', 'Fixed Assets', 1, data.fixedAssets ?? {}),
        makeLineItem('other-assets', 'Other Assets', 1, data.otherAssets ?? {}),
      ],
    },
    makeTotal('total-assets', 'Total Assets', totalAssets, 'double'),

    {
      id: 'spacer-1',
      type: 'spacer',
      label: '',
      indent: 0,
      bold: false,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      isPercentage: false,
      values: {},
    },

    {
      id: 'liabilities-header',
      type: 'group_header',
      label: 'Liabilities',
      indent: 0,
      bold: true,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      collapseToggle: true,
      isPercentage: false,
      values: {},
      children: [
        makeLineItem(
          'current-liabilities',
          'Current Liabilities',
          1,
          data.currentLiabilities ?? {}
        ),
        makeLineItem(
          'long-term-liabilities',
          'Long-Term Liabilities',
          1,
          data.longTermLiabilities ?? {}
        ),
      ],
    },
    makeTotal('total-liabilities', 'Total Liabilities', totalLiabilities),

    {
      id: 'equity-header',
      type: 'group_header',
      label: 'Equity',
      indent: 0,
      bold: true,
      underline: 'none',
      showLineAbove: false,
      fontSize: 'normal',
      collapseToggle: true,
      isPercentage: false,
      values: {},
      children: [
        makeLineItem('retained-earnings', 'Retained Earnings', 1, data.retainedEarnings ?? {}),
        makeLineItem('capital-stock', 'Capital Stock', 1, data.capitalStock ?? {}),
        makeLineItem(
          'additional-paid-in',
          'Additional Paid-In Capital',
          1,
          data.additionalPaidIn ?? {}
        ),
      ],
    },
    makeTotal('total-equity', 'Total Equity', totalEquity),

    makeTotal(
      'total-liabilities-equity',
      'Total Liabilities & Equity',
      sumValues(totalLiabilities, totalEquity),
      'double'
    ),
  ];
}

export function renderSectionToHTML(section: ReportSection, periods: string[]): string {
  const indentPx = section.indent * 24;
  const fontWeight = section.bold ? 'font-bold' : 'font-normal';
  const underlineClass = {
    none: '',
    single: 'border-b border-black',
    double: 'border-b-2 border-double border-black',
  }[section.underline];

  const fontSize =
    section.fontSize === 'large' ? '14px' : section.fontSize === 'small' ? '11px' : '12px';

  let html = `<tr class="${section.type === 'spacer' ? 'h-3' : ''}">`;
  html += `<td class="text-left ${fontWeight} ${underlineClass}" style="padding-left:${indentPx}px;font-size:${fontSize}">${section.label}</td>`;

  for (const period of periods) {
    const value = section.values[period];
    const formatted =
      value != null
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(value)
        : '—';
    html += `<td class="text-right ${fontWeight} ${underlineClass}" style="font-size:${fontSize}">${formatted}</td>`;
  }

  html += '</tr>';
  return html;
}
