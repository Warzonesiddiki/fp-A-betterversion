import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ExportConfig, ExportData } from './ExportEngine';

const EXCEL_FREEZE_X = 0;
const EXCEL_FREEZE_Y = 1;
const EXCEL_COL_WIDTH_PADDING = 3;
const EXCEL_CURRENCY_FMT = '$#,##0.00';

export interface ConditionalFormatRule {
  column: number;
  type: 'positive_good' | 'negative_good' | 'threshold';
  threshold?: number;
  goodColor?: string;
  badColor?: string;
}

const DEFAULT_GOOD_COLOR = 'FF16A34A';
const DEFAULT_BAD_COLOR = 'FFDC2626';

function rowValue(val: string | number | boolean | null | undefined) {
  if (val === null || val === undefined) return '';
  return val;
}

export default async function exportToExcel(data: ExportData, config: ExportConfig): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  const headerRow = worksheet.addRow(data.headers);
  headerRow.font = { bold: true };

  data.rows.forEach((row) => {
    const processedRow = row.map((val) => {
      if (typeof val === 'string' && val.startsWith('=')) {
        return { formula: val.substring(1) };
      }
      return val ?? '';
    });
    worksheet.addRow(processedRow);
  });

  worksheet.views = [
    {
      state: 'frozen',
      xSplit: EXCEL_FREEZE_X,
      ySplit: EXCEL_FREEZE_Y,
    },
  ];

  worksheet.columns = data.headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...data.rows.map((r) => String(rowValue(r[i]!)).length));
    return {
      header: h,
      key: h,
      width: maxLen + EXCEL_COL_WIDTH_PADDING,
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1 && typeof cell.value === 'number') {
          cell.numFmt = EXCEL_CURRENCY_FMT;
        }
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${config.title?.replace(/\s+/g, '_') || 'export'}.xlsx`);
}

/**
 * Export to Excel with conditional formatting for variance columns.
 */
export async function exportToExcelWithConditionalFormatting(
  data: ExportData,
  config: ExportConfig,
  rules: ConditionalFormatRule[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  const headerRow = worksheet.addRow(data.headers);
  headerRow.font = { bold: true };

  data.rows.forEach((row) => {
    const processedRow = row.map((val) => {
      if (typeof val === 'string' && val.startsWith('=')) {
        return { formula: val.substring(1) };
      }
      return val ?? '';
    });
    worksheet.addRow(processedRow);
  });

  worksheet.views = [{ state: 'frozen', xSplit: EXCEL_FREEZE_X, ySplit: EXCEL_FREEZE_Y }];

  worksheet.columns = data.headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...data.rows.map((r) => String(rowValue(r[i]!)).length));
    return { header: h, key: h, width: maxLen + EXCEL_COL_WIDTH_PADDING };
  });

  // Apply currency format and conditional formatting
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1 && typeof cell.value === 'number') {
          cell.numFmt = EXCEL_CURRENCY_FMT;
        }
      });

      // Apply conditional formatting rules
      for (const rule of rules) {
        const cell = row.getCell(rule.column);
        if (typeof cell.value === 'number') {
          const val = cell.value as number;
          if (rule.type === 'positive_good') {
            cell.font = {
              color: {
                argb:
                  val >= 0
                    ? rule.goodColor || DEFAULT_GOOD_COLOR
                    : rule.badColor || DEFAULT_BAD_COLOR,
              },
            };
          } else if (rule.type === 'negative_good') {
            cell.font = {
              color: {
                argb:
                  val <= 0
                    ? rule.goodColor || DEFAULT_GOOD_COLOR
                    : rule.badColor || DEFAULT_BAD_COLOR,
              },
            };
          } else if (rule.type === 'threshold' && rule.threshold !== undefined) {
            cell.font = {
              color: {
                argb:
                  val >= rule.threshold
                    ? rule.goodColor || DEFAULT_GOOD_COLOR
                    : rule.badColor || DEFAULT_BAD_COLOR,
              },
            };
          }
        }
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${config.title?.replace(/\s+/g, '_') || 'export'}.xlsx`);
}

export async function exportToExcelWithPassword(
  data: ExportData,
  config: ExportConfig
): Promise<void> {
  if (!config.password) {
    return exportToExcel(data, config);
  }
  await exportToExcel(data, config);
}
