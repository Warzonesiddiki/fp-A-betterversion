import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

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
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  details?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO audit_trail (id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(uuidv4(), action, entityType, entityId, userId, JSON.stringify(details ?? {}));
}

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
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
  const headerRow = headers.map((h) => `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;text-align:left;">${h}</th>`).join('');
  const dataRows = data.map((row) => {
    const cells = headers.map((h) => `<td style="border:1px solid #ddd;padding:8px;">${row[h] ?? ''}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

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
      const width = columnWidths?.[i] ?? 120;
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

    const { report_type, title, entity_id, fiscal_year, period, date_from, date_to, data, orientation } = parsed.data;

    let reportData: Record<string, unknown>[] = data ?? [];
    let headers: string[] = [];

    // If no data provided, fetch from database based on report type
    if (!data || data.length === 0) {
      switch (report_type) {
        case 'trial_balance': {
          const conditions: string[] = [];
          const params: unknown[] = [];
          if (entity_id) { conditions.push('ge.entity_id = ?'); params.push(entity_id); }
          if (date_from) { conditions.push('ge.post_date >= ?'); params.push(date_from); }
          if (date_to) { conditions.push('ge.post_date <= ?'); params.push(date_to); }
          const joinCond = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

          reportData = db.prepare(
            `SELECT a.code AS "Account Code", a.name AS "Account Name", a.type AS "Type",
                    COALESCE(SUM(ge.debit), 0) AS "Total Debit",
                    COALESCE(SUM(ge.credit), 0) AS "Total Credit",
                    COALESCE(SUM(ge.debit), 0) - COALESCE(SUM(ge.credit), 0) AS "Balance"
             FROM accounts a
             LEFT JOIN gl_entries ge ON ge.account_id = a.id ${joinCond}
             GROUP BY a.id, a.code, a.name, a.type
             ORDER BY a.code`
          ).all(...params) as Record<string, unknown>[];
          headers = ['Account Code', 'Account Name', 'Type', 'Total Debit', 'Total Credit', 'Balance'];
          break;
        }
        case 'budget_vs_actual': {
          const conditions: string[] = ['b.deleted_at IS NULL'];
          const params: unknown[] = [];
          if (fiscal_year) { conditions.push('b.fiscal_year = ?'); params.push(fiscal_year); }
          if (entity_id) { conditions.push('b.entity_id = ?'); params.push(entity_id); }
          const whereCond = `WHERE ${conditions.join(' AND ')}`;

          reportData = db.prepare(
            `SELECT a.code AS "Account Code", a.name AS "Account Name",
                    b.name AS "Budget",
                    SUM(bli.amount) AS "Budget Amount",
                    COALESCE(SUM(ge.debit - ge.credit), 0) AS "Actual Amount",
                    SUM(bli.amount) - COALESCE(SUM(ge.debit - ge.credit), 0) AS "Variance"
             FROM budget_line_items bli
             JOIN budgets b ON b.id = bli.budget_id
             JOIN accounts a ON a.id = bli.account_id
             LEFT JOIN gl_entries ge ON ge.account_id = bli.account_id
               AND ge.post_date >= date(b.fiscal_year || '-01-01')
               AND ge.post_date <= date(b.fiscal_year || '-12-31')
             ${whereCond}
             GROUP BY a.code, a.name, b.name
             ORDER BY a.code`
          ).all(...params) as Record<string, unknown>[];
          headers = ['Account Code', 'Account Name', 'Budget', 'Budget Amount', 'Actual Amount', 'Variance'];
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
    const html = generatePdfHtml(reportTitle, report_type, reportData, headers, orientation ?? 'portrait');

    const exportId = uuidv4();
    audit('EXPORT_PDF', 'report', exportId, req.user!.id, { report_type, title: reportTitle, rows: reportData.length });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html"`);
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
    audit('EXPORT_EXCEL', 'report', exportId, req.user!.id, { title: reportTitle, rows: data.length });

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.xls"`);
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
    audit('EXPORT_CSV', 'report', exportId, req.user!.id, { rows: data.length, delimiter: sep });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    res.send(csv);
  } catch (err) {
    console.error('POST /export/csv error:', err);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

export default router;
