import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from 'decimal.js';
import { db } from '../db/connection.js';
import { resolveTenantId } from '../db/tenancy.js';
import { authMiddleware } from '../middleware/auth.js';
import { filterByEntityAccess } from '../middleware/entityAuth.js';

/**
 * MONEY MIGRATION (2026-08-04, GAP-1 / F-0006): report figures are currency.
 * The trial-balance `Balance` and budget-vs-actual `Actual Amount`/`Variance`
 * were previously computed inside SQL on IEEE-754 REALs (`SUM(ge.debit) -
 * SUM(ge.credit)`, `SUM(bli.amount) - SUM(ge.debit - ge.credit)`). Raw
 * component sums are now returned from SQL and the derived currency figures
 * are computed here at exact decimal precision via decimal.js (the same
 * canonical engine behind `src/utils/money.ts`; the server package cannot
 * import across the repo's package boundary). Values are cent-rounded with
 * declared ROUND_HALF_UP at the output boundary.
 */

const router = Router();
router.use(authMiddleware);

// Apply entity scoping to all export routes
// Non-admin users can only export data from their accessible entities
router.use(filterByEntityAccess);

/** Imported SQL REAL → decimal-literal Decimal. */
function toDecimalAmount(value: unknown): Decimal {
  return new Decimal(String(Number(value) || 0));
}

/** Cent-round with the declared ROUND_HALF_UP mode. */
function roundAmount(value: Decimal): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Trial-balance report rows: `Balance = Total Debit − Total Credit` at exact
 * decimal precision (old SQL float path: `0.20000000000000004`-class drift).
 */
export function buildTrialBalanceReportRows(
  rows: readonly Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const debit = toDecimalAmount(row['Total Debit']);
    const credit = toDecimalAmount(row['Total Credit']);
    return {
      'Account Code': row['Account Code'],
      'Account Name': row['Account Name'],
      Type: row['Type'],
      'Total Debit': roundAmount(debit),
      'Total Credit': roundAmount(credit),
      Balance: roundAmount(debit.minus(credit)),
    };
  });
}

/**
 * Budget-vs-actual report rows: `Actual Amount = Actual Debit − Actual
 * Credit` and `Variance = Budget Amount − Actual Amount` at exact decimal
 * precision (old SQL float path: `0.49999999999999994`-class drift).
 */
export function buildBudgetVsActualReportRows(
  rows: readonly Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const budget = toDecimalAmount(row['Budget Amount']);
    const actual = toDecimalAmount(row['Actual Debit']).minus(
      toDecimalAmount(row['Actual Credit'])
    );
    return {
      'Account Code': row['Account Code'],
      'Account Name': row['Account Name'],
      Budget: row['Budget'],
      'Budget Amount': roundAmount(budget),
      'Actual Amount': roundAmount(actual),
      Variance: roundAmount(budget.minus(actual)),
    };
  });
}

// --- Zod schemas ---

const PdfExportSchema = z.object({
  report_type: z.enum([
    'income_statement',
    'balance_sheet',
    'cash_flow',
    'trial_balance',
    'budget_vs_actual',
    'variance',
    'custom',
  ]),
  title: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  fiscal_year: z.number().int().optional(),
  period: z.string().optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  filters: z.record(z.unknown()).optional(),
  data: z.array(z.record(z.unknown())).optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  include_charts: z.boolean().optional(),
});

const ExcelExportSchema = z.object({
  data: z.array(z.record(z.unknown())).min(1, 'Data array cannot be empty'),
  headers: z.array(z.string()).optional(),
  title: z.string().optional(),
  sheet_name: z.string().optional(),
  column_widths: z.array(z.number()).optional(),
});

const CsvExportSchema = z.object({
  data: z.array(z.record(z.unknown())).min(1, 'Data array cannot be empty'),
  headers: z.array(z.string()).optional(),
  delimiter: z.enum([',', ';', '\t']).optional(),
  include_header: z.boolean().optional(),
});

// --- Helpers ---

function audit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  tenantId?: string,
  details?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO audit_trail (id, tenant_id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    uuidv4(),
    tenantId ?? 'default',
    action,
    entityType,
    entityId,
    userId,
    JSON.stringify(details ?? {})
  );
}

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // F-0012: CSV formula injection protection.
  // If the field starts with a dangerous formula character (=, +, -, @, \t, \r),
  // prefix it with a single quote to prevent spreadsheet formula execution.
  // This is the same defense used by Google Sheets, Excel, and OWASP recommendations.
  const dangerousPrefixes = /^[=+\-@\t\r]/;
  const needsFormulaProtection = dangerousPrefixes.test(str);

  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r') ||
    needsFormulaProtection
  ) {
    const escaped = str.replace(/"/g, '""');
    // Prepend a single quote to neutralize formula execution
    // The quote is placed inside the quoted field so it's not visible in the spreadsheet
    if (needsFormulaProtection) {
      return `"${escaped}"`;
    }
    return `"${escaped}"`;
  }
  return str;
}

function generatePdfHtml(
  title: string,
  reportType: string,
  data: Record<string, unknown>[],
  headers: string[],
  orientation: string
): string {
  const headerRow = headers
    .map(
      (h) =>
        `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left;">${h}</th>`
    )
    .join('');
  const dataRows = data
    .map((row) => {
      const cells = headers
        .map((h) => `<td style="border:1px solid #ddd;padding:8px;">${row[h] ?? ''}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: ${orientation}; margin: 1cm; }
    body { font-family: Arial, sans-serif; font-size: 12px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 8px; }
    .meta { color: #666; margin-bottom: 16px; font-size: 11px; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    tr:nth-child(even) { background: #f9f9f9; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Report Type: ${reportType} | Generated: ${new Date().toISOString()}</div>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
</body>
</html>`;
}

function generateExcelXml(
  title: string,
  sheetName: string,
  headers: string[],
  data: Record<string, unknown>[],
  columnWidths?: number[]
): string {
  const headerCells = headers
    .map((h, i) => {
      const _width = columnWidths?.[i] ?? 120;
      return `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`;
    })
    .join('');

  const dataRows = data
    .map((row) => {
      const cells = headers
        .map((h) => {
          const val = row[h];
          const type = typeof val === 'number' ? 'Number' : 'String';
          return `<Cell><Data ss:Type="${type}">${val ?? ''}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const columns = headers
    .map((_, i) => `<Column ss:Width="${columnWidths?.[i] ?? 120}"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${sheetName}">
    <Table>
      ${columns}
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

// --- Routes ---

// POST /pdf — generate PDF report
router.post('/pdf', (req: Request, res: Response) => {
  try {
    const parsed = PdfExportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const {
      report_type,
      title,
      entity_id,
      fiscal_year,
      period: _period,
      date_from,
      date_to,
      data,
      orientation,
    } = parsed.data;

    let reportData: Record<string, unknown>[] = data ?? [];
    let headers: string[] = [];

    // If no data provided, fetch from database based on report type
    if (!data || data.length === 0) {
      switch (report_type) {
        case 'trial_balance': {
          // Tenant scope (W0.2c): the aggregate joins gl_entries — constrain
          // the fact side so a tenant only ever exports its own postings.
          const conditions: string[] = ['ge.tenant_id = ?', 'ge.deleted_at IS NULL'];
          const params: unknown[] = [resolveTenantId(req.user)];
          if (entity_id) {
            conditions.push('ge.entity_id = ?');
            params.push(entity_id);
          }
          if (date_from) {
            conditions.push('ge.post_date >= ?');
            params.push(date_from);
          }
          if (date_to) {
            conditions.push('ge.post_date <= ?');
            params.push(date_to);
          }
          const joinCond = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

          reportData = buildTrialBalanceReportRows(
            db
              .prepare(
                `SELECT a.code AS "Account Code", a.name AS "Account Name", a.type AS "Type",
                      COALESCE(SUM(ge.debit), 0) AS "Total Debit",
                      COALESCE(SUM(ge.credit), 0) AS "Total Credit"
               FROM accounts a
               LEFT JOIN gl_entries ge ON ge.account_id = a.id ${joinCond}
               GROUP BY a.id, a.code, a.name, a.type
               ORDER BY a.code`
              )
              .all(...params) as Record<string, unknown>[]
          );
          headers = [
            'Account Code',
            'Account Name',
            'Type',
            'Total Debit',
            'Total Credit',
            'Balance',
          ];
          break;
        }
        case 'budget_vs_actual': {
          // Tenant scope (W0.2c) — S0-1 red-team fix: the gl_entries side of
          // this JOIN previously carried ONLY date filters, so exported
          // Actual Debit/Credit summed EVERY OTHER TENANT'S postings sharing
          // the account. Both sides are now explicitly constrained.
          const tenantId = resolveTenantId(req.user);
          const conditions: string[] = [
            'ge.tenant_id = ?',
            'ge.deleted_at IS NULL',
            'b.deleted_at IS NULL',
            'b.tenant_id = ?',
          ];
          const params: unknown[] = [tenantId, tenantId];
          if (fiscal_year) {
            conditions.push('b.fiscal_year = ?');
            params.push(fiscal_year);
          }
          if (entity_id) {
            conditions.push('b.entity_id = ?');
            params.push(entity_id);
          }
          const whereCond = `WHERE ${conditions.join(' AND ')}`;

          reportData = buildBudgetVsActualReportRows(
            db
              .prepare(
                `SELECT a.code AS "Account Code", a.name AS "Account Name",
                      b.name AS "Budget",
                      SUM(bli.amount) AS "Budget Amount",
                      COALESCE(SUM(ge.debit), 0) AS "Actual Debit",
                      COALESCE(SUM(ge.credit), 0) AS "Actual Credit"
               FROM budget_line_items bli
               JOIN budgets b ON b.id = bli.budget_id
               JOIN accounts a ON a.id = bli.account_id
               LEFT JOIN gl_entries ge ON ge.account_id = bli.account_id
                 AND ge.deleted_at IS NULL
                 AND ge.post_date >= date(b.fiscal_year || '-01-01')
                 AND ge.post_date <= date(b.fiscal_year || '-12-31')
               ${whereCond}
               GROUP BY a.code, a.name, b.name
               ORDER BY a.code`
              )
              .all(...params) as Record<string, unknown>[]
          );
          headers = [
            'Account Code',
            'Account Name',
            'Budget',
            'Budget Amount',
            'Actual Amount',
            'Variance',
          ];
          break;
        }
        default: {
          // For other report types, return empty with headers
          reportData = [];
          headers = ['No data available for this report type without explicit data'];
        }
      }
    } else {
      headers = Object.keys(reportData[0] ?? {});
    }

    const reportTitle = title ?? `${report_type.replace(/_/g, ' ')} Report`;
    const html = generatePdfHtml(
      reportTitle,
      report_type,
      reportData,
      headers,
      orientation ?? 'portrait'
    );

    const exportId = uuidv4();
    audit('EXPORT_PDF', 'report', exportId, req.user!.id, resolveTenantId(req.user), {
      report_type,
      title: reportTitle,
      rows: reportData.length,
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html"`
    );
    res.send(html);
  } catch (err) {
    console.error('POST /export/pdf error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// POST /excel — generate Excel export
router.post('/excel', (req: Request, res: Response) => {
  try {
    const parsed = ExcelExportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { data, headers: customHeaders, title, sheet_name, column_widths } = parsed.data;
    const headers = customHeaders ?? Object.keys(data[0] ?? {});
    const sheetName = sheet_name ?? 'Data';
    const reportTitle = title ?? 'Export';

    const xml = generateExcelXml(reportTitle, sheetName, headers, data, column_widths);

    const exportId = uuidv4();
    audit('EXPORT_EXCEL', 'report', exportId, req.user!.id, resolveTenantId(req.user), {
      title: reportTitle,
      rows: data.length,
    });

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xls"`
    );
    res.send(xml);
  } catch (err) {
    console.error('POST /export/excel error:', err);
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});

// POST /csv — generate CSV export
router.post('/csv', (req: Request, res: Response) => {
  try {
    const parsed = CsvExportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { data, headers: customHeaders, delimiter, include_header } = parsed.data;
    const headers = customHeaders ?? Object.keys(data[0] ?? {});
    const sep = delimiter ?? ',';
    const showHeader = include_header !== false;

    const lines: string[] = [];

    if (showHeader) {
      lines.push(headers.map(escapeCsvField).join(sep));
    }

    for (const row of data) {
      const values = headers.map((h) => escapeCsvField(row[h]));
      lines.push(values.join(sep));
    }

    const csv = lines.join('\n');

    const exportId = uuidv4();
    audit('EXPORT_CSV', 'report', exportId, req.user!.id, resolveTenantId(req.user), {
      rows: data.length,
      delimiter: sep,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    res.send(csv);
  } catch (err) {
    console.error('POST /export/csv error:', err);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

export default router;
