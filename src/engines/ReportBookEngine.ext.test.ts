/**
 * ReportBookEngine.ext.test.ts — generation pipeline + board pack assembly
 * (MISSION D wave 2, 2026-08-07). Exercises generateReports with registered
 * generators, fallback data, missing entities, progress callbacks, errors,
 * serialization round-trip, and the BoardPackGenerator helpers.
 */
import { describe, expect, it } from 'vitest';
import {
  BoardPackGenerator,
  REPORT_TEMPLATE_PRESETS,
  ReportBookEngine,
  type Entity,
  type ExportData,
} from './ReportBookEngine';

const entities: Entity[] = [
  { id: 'acme', name: 'ACME Corp', currency: 'USD' },
  { id: 'globex', name: 'Globex Ltd', currency: 'EUR' },
];

describe('ReportBookEngine — generation pipeline', () => {
  it('addEntry / updateEntry / removeEntry / reorderEntries manage the book', () => {
    const e = new ReportBookEngine();
    const book = e.createBook('Monthly', 'board pack');
    const a = e.addEntry(book.id, {
      reportName: 'P&L {period}',
      templateId: 'preset-pl',
      entityIds: ['acme'],
      variables: { period: 'FY 2026' },
      enabled: true,
    });
    const b = e.addEntry(book.id, {
      reportName: 'BS',
      templateId: 'preset-bs',
      entityIds: ['globex'],
      variables: {},
      enabled: true,
    });
    expect(a.order).toBe(0);
    expect(b.order).toBe(1);

    e.updateEntry(book.id, a.id, { reportName: 'P&L Updated' });
    expect(e.getBook(book.id)!.entries[0]!.reportName).toBe('P&L Updated');

    e.reorderEntries(book.id, [b.id, a.id]);
    expect(e.getBook(book.id)!.entries.map((x) => x.id)).toEqual([b.id, a.id]);
    expect(e.getBook(book.id)!.entries[0]!.order).toBe(0);

    e.removeEntry(book.id, b.id);
    expect(e.getBook(book.id)!.entries).toHaveLength(1);

    expect(() =>
      e.addEntry('nope', {
        reportName: 'x',
        templateId: 't',
        entityIds: [],
        variables: {},
        enabled: true,
      })
    ).toThrow();
    expect(() => e.updateEntry(book.id, 'nope', {})).toThrow();
    expect(() => e.removeEntry(book.id, 'nope')).not.toThrow();
    expect(e.deleteBook(book.id)).toBe(true);
    expect(e.deleteBook(book.id)).toBe(false);
  });

  it('generateReports uses registered generators and substitutes variables', async () => {
    const e = new ReportBookEngine();
    const book = e.createBook('B', 'd');
    e.addEntry(book.id, {
      reportName: '{entity_name} P&L {period}',
      templateId: 'pl',
      entityIds: ['acme', 'globex'],
      variables: { period: 'FY 2026' },
      enabled: true,
    });
    e.registerReportGenerator('pl', (entity, vars) => ({
      headers: ['Line'],
      rows: [[`${entity.name}-${vars.period}`]],
    }));

    const progress: number[] = [];
    const results = await e.generateReports(book.id, entities, (p) => progress.push(p.completed));

    expect(results).toHaveLength(2);
    expect(results[0]!.reportName).toBe('ACME Corp P&L FY 2026');
    expect(results[0]!.data.rows).toEqual([['ACME Corp-FY 2026']]);
    expect(results[0]!.config.companyName).toBe('ACME Corp');
    expect(results[1]!.reportName).toBe('Globex Ltd P&L FY 2026');
    // progress is reported before + after each job; must end at the total
    expect(progress[progress.length - 1]).toBe(2);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });

  it('falls back to zero-data rows when no generator is registered', async () => {
    const e = new ReportBookEngine();
    const book = e.createBook('B', 'd');
    e.addEntry(book.id, {
      reportName: 'PL',
      templateId: 'preset-pl',
      entityIds: ['acme'],
      variables: {},
      enabled: true,
    });
    const results = await e.generateReports(book.id, entities);
    const data = results[0]!.data as ExportData;
    expect(results).toHaveLength(1);
    expect(data.footers!.join(' ')).toContain('No generator registered');
    expect(data.footers!.join(' ')).toContain('all figures are zero');
    // honest zeros — every numeric cell is exactly 0, never fabricated figures
    const allNums = data.rows.flat().filter((v) => typeof v === 'number') as number[];
    expect(allNums.length).toBeGreaterThan(0);
    expect(allNums.every((v) => v === 0)).toBe(true);
  });

  it('records missing entities as errors and completes', async () => {
    const e = new ReportBookEngine();
    const book = e.createBook('B', 'd');
    e.addEntry(book.id, {
      reportName: 'PL',
      templateId: 'pl',
      entityIds: ['acme', 'missing'],
      variables: {},
      enabled: true,
    });
    e.registerReportGenerator('pl', () => ({ headers: [], rows: [] }));
    const progress: { completed: number; errors: string[] }[] = [];
    const results = await e.generateReports(book.id, entities, (p) =>
      progress.push({ completed: p.completed, errors: [...p.errors] })
    );
    expect(results).toHaveLength(1);
    expect(progress[progress.length - 1]!.errors.join(' ')).toContain('missing');
    expect(progress[progress.length - 1]!.completed).toBe(2);
  });

  it('captures generator exceptions into progress errors', async () => {
    const e = new ReportBookEngine();
    const book = e.createBook('B', 'd');
    e.addEntry(book.id, {
      reportName: 'PL',
      templateId: 'pl',
      entityIds: ['acme'],
      variables: {},
      enabled: true,
    });
    e.registerReportGenerator('pl', () => {
      throw new Error('generator exploded');
    });
    let finalStatus = '';
    const results = await e.generateReports(book.id, entities, (p) => {
      finalStatus = p.status;
    });
    expect(results).toHaveLength(0);
    expect(finalStatus).toBe('error');
  });

  it('skips disabled entries', async () => {
    const e = new ReportBookEngine();
    const book = e.createBook('B', 'd');
    e.addEntry(book.id, {
      reportName: 'Off',
      templateId: 'pl',
      entityIds: ['acme'],
      variables: {},
      enabled: false,
    });
    e.registerReportGenerator('pl', () => ({ headers: [], rows: [] }));
    const results = await e.generateReports(book.id, entities);
    expect(results).toHaveLength(0);
    await expect(e.generateReports('nope', entities)).rejects.toThrow('not found');
  });

  it('serialize / deserialize round-trips books and entries', () => {
    const e = new ReportBookEngine();
    const book = e.createBook('Monthly', 'd');
    e.addEntry(book.id, {
      reportName: 'P&L',
      templateId: 'preset-pl',
      entityIds: ['acme'],
      variables: { period: 'FY 2026' },
      enabled: true,
    });
    const json = e.serialize();
    const e2 = ReportBookEngine.deserialize(json);
    expect(e2.listBooks()).toHaveLength(1);
    const restored = e2.getBook(book.id)!;
    expect(restored.name).toBe('Monthly');
    expect(restored.entries[0]!.reportName).toBe('P&L');
    expect(restored.entries[0]!.variables.period).toBe('FY 2026');
  });

  it('getAvailableVariables exposes the variable catalog', () => {
    const e = new ReportBookEngine();
    const vars = e.getAvailableVariables();
    expect(vars.length).toBeGreaterThan(0);
    expect(vars.some((v) => v.key === 'entity_name')).toBe(true);
  });
});

describe('BoardPackGenerator', () => {
  it('assembles sections grouped by entry with page breaks between', async () => {
    const e = new ReportBookEngine();
    const book = e.createBook('Pack', 'd');
    e.addEntry(book.id, {
      reportName: 'PL',
      templateId: 'pl',
      entityIds: ['acme', 'globex'],
      variables: {},
      enabled: true,
    });
    e.addEntry(book.id, {
      reportName: 'BS',
      templateId: 'bs',
      entityIds: ['acme'],
      variables: {},
      enabled: true,
    });
    e.registerReportGenerator('pl', (entity) => ({ headers: [], rows: [[entity.name]] }));
    e.registerReportGenerator('bs', () => ({ headers: [], rows: [['bs']] }));

    const gen = new BoardPackGenerator(e);
    const { pdfData, sections } = await gen.generateBoardPack(book.id, entities, {
      companyName: 'ACME',
      title: 'Board Pack',
      coverDate: '2026-08-07',
      entityName: 'Group',
      template: 'board',
    });
    expect(pdfData).toHaveLength(3);
    expect(sections).toHaveLength(2);
    expect(sections[0]!.reports).toHaveLength(2);
    expect(sections[0]!.pageBreakBefore).toBe(false);
    expect(sections[1]!.pageBreakBefore).toBe(true);
  });

  it('buildCoverPage / buildTableOfContents / buildExecutiveSummary shape export data', () => {
    const gen = new BoardPackGenerator(new ReportBookEngine());
    const cover = gen.buildCoverPage({
      companyName: 'ACME Corp',
      title: 'Monthly Board Pack',
      subtitle: 'FY2026',
      coverDate: '2026-08-07',
      entityName: 'Group',
      template: 'board_pack',
    });
    expect(cover.rows.some((r) => r.includes('ACME Corp'))).toBe(true);
    expect(cover.rows.some((r) => r.includes('Monthly Board Pack'))).toBe(true);

    const toc = gen.buildTableOfContents([
      { id: 'a', title: 'P&L', reports: [{} as never, {} as never], pageBreakBefore: false },
      { id: 'b', title: 'BS', reports: [{} as never], pageBreakBefore: true },
    ]);
    expect(toc.rows).toEqual([
      ['1', 'P&L', '2 report(s)'],
      ['2', 'BS', '1 report(s)'],
    ]);

    const summary = gen.buildExecutiveSummary([
      { entityName: 'ACME', reportName: 'P&L', data: {} as never } as never,
      { entityName: 'ACME', reportName: 'BS', data: {} as never } as never,
      { entityName: 'Globex', reportName: 'P&L', data: {} as never } as never,
    ]);
    expect(summary.rows[0]).toEqual(['Total Reports Generated', '3']);
    expect(summary.rows[1]).toEqual(['Entities Covered', 'ACME, Globex']);
    expect(summary.rows[2]).toEqual(['Report Types', 'P&L, BS']);
  });
});

describe('REPORT_TEMPLATE_PRESETS', () => {
  it('defines the six canonical report templates', () => {
    const ids = Object.values(REPORT_TEMPLATE_PRESETS).map((p) => p.id);
    expect(ids).toContain('preset-pl');
    expect(ids).toContain('preset-bs');
    expect(ids).toContain('preset-cf');
    expect(ids).toContain('preset-bva');
    expect(ids).toContain('preset-kpi');
    expect(ids).toContain('preset-hc');
    expect(ids).toContain('preset-cash');
    expect(Object.values(REPORT_TEMPLATE_PRESETS).every((p) => p.headers.length >= 4)).toBe(true);
  });
});
