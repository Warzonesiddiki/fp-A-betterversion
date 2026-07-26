export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}
export interface ParseCSVOptions {
  delimiter?: string;
  trimHeaders?: boolean;
  trimValues?: boolean;
  skipEmptyRows?: boolean;
}
function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === '');
}
export function parseCSVRecords(input: string, options: ParseCSVOptions = {}): string[][] {
  const delimiter = options.delimiter ?? ',';
  const text = stripBom(input).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const records: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }
    if (char === '\n' && !inQuotes) {
      row.push(current);
      records.push(row);
      row = [];
      current = '';
      continue;
    }
    current += char;
  }
  row.push(current);
  records.push(row);
  return options.skipEmptyRows === false
    ? records
    : records.filter((record) => !isEmptyRow(record));
}
export function parseCSV(input: string, options: ParseCSVOptions = {}): ParsedCSV {
  const records = parseCSVRecords(input, options);
  if (records.length === 0) return { headers: [], rows: [] };
  const trimHeaders = options.trimHeaders ?? true;
  const trimValues = options.trimValues ?? true;
  const headers = records[0]!.map((header) => (trimHeaders ? header.trim() : header));
  const rows = records.slice(1).map((record) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      const value = record[index] ?? '';
      row[header] = trimValues ? value.trim() : value;
    });
    return row;
  });
  return { headers, rows };
}
export function hasDuplicateHeaders(headers: string[]): boolean {
  return new Set(headers).size !== headers.length;
}
export function toCSV(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const escape = (value: unknown): string => {
    const raw = value == null ? '' : String(value);
    return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');
}
