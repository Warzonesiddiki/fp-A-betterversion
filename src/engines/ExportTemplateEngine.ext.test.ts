/**
 * ExportTemplateEngine.ext.test.ts — full PDF generation coverage with a
 * recording jsPDF double (MISSION D wave 2, 2026-08-07). The registration
 * tests covered ~10% of the file; this exercises every render path
 * (cover / TOC / section / kpi / table / text / page_break) for every
 * built-in template plus a custom one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExportTemplateEngine,
  type ExportContext,
  type ExportTemplate,
} from './ExportTemplateEngine';

const calls: { method: string; args: unknown[] }[] = [];
const textLog: string[] = [];

function createFakePdf() {
  const fake = {
    internal: { pageSize: { width: 210, height: 297 } },
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn((t: string) => {
      textLog.push(String(t));
      calls.push({ method: 'text', args: [t] });
    }),
    line: vi.fn(),
    rect: vi.fn(),
    addPage: vi.fn(() => calls.push({ method: 'addPage', args: [] })),
    save: vi.fn((name: string) => calls.push({ method: 'save', args: [name] })),
    autoTable: vi.fn((opts: Record<string, unknown>) => {
      calls.push({ method: 'autoTable', args: [opts] });
    }),
    splitTextToSize: vi.fn((t: string) => [t]),
    previousAutoTable: { finalY: 150 },
    addImage: vi.fn(),
    setProperties: vi.fn(),
  };
  return fake;
}

const ctx: ExportContext = {
  entity: 'ACME Corp',
  period: 'FY2026-Q1',
  currency: 'USD',
  date: '2026-04-30',
  preparedBy: 'FP&A Team',
  data: { revenue: 1000 },
};

describe('ExportTemplateEngine — PDF generation', () => {
  let engine: ExportTemplateEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    textLog.length = 0;
    calls.length = 0;
    const fake = createFakePdf();
    (window as unknown as { jsPDF: unknown }).jsPDF = class MockJsPDF {
      constructor() {
        return fake;
      }
    };
    engine = new ExportTemplateEngine();
  });

  it('renders the board pack: cover + TOC + sections + save', async () => {
    await engine.generatePDF('tpl-board-pack', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(true);
    const saveCall = calls.find((c) => c.method === 'save');
    expect(String(saveCall!.args[0])).toContain('Board_Pack');
    expect(calls.some((c) => c.method === 'addPage')).toBe(true);
    expect(textLog.join('\n')).toContain('Table of Contents');
    expect(textLog.join('\n')).toContain('ACME Corp');
    expect(textLog.join('\n')).toContain('FY2026-Q1');
    expect(calls.some((c) => c.method === 'autoTable')).toBe(true);
  });

  it('renders the P&L template', async () => {
    await engine.generatePDF('tpl-pl', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(true);
    expect(calls.some((c) => c.method === 'autoTable')).toBe(true);
  });

  it('renders the balance sheet template', async () => {
    await engine.generatePDF('tpl-bs', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(true);
  });

  it('renders the cash flow template', async () => {
    await engine.generatePDF('tpl-cf', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(true);
  });

  it('renders the BVA template', async () => {
    await engine.generatePDF('tpl-bva', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(true);
  });

  it('renders the KPI summary template', async () => {
    await engine.generatePDF('tpl-kpi', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(true);
  });

  it('is a no-op for an unknown template id', async () => {
    await engine.generatePDF('does-not-exist', ctx);
    expect(calls.some((c) => c.method === 'save')).toBe(false);
  });

  it('substitutes {vars} from context in titles and table cells', async () => {
    const custom: ExportTemplate = {
      id: 'custom-ext',
      name: 'Custom {entity} Report',
      type: 'board_pack',
      description: 'custom',
      sections: [
        {
          id: 'cover',
          type: 'cover',
          title: 'Cover',
          order: 0,
          config: { title: '{entity} — {period}', subtitle: 'Sub' },
        },
        {
          id: 't1',
          type: 'table',
          title: '{entity} Table',
          order: 1,
          config: { headers: ['Metric', '{currency}'], rows: [['Revenue', '1000']] },
        },
        {
          id: 'txt',
          type: 'text',
          title: 'Notes',
          order: 2,
          config: { content: 'Prepared for {entity} by {preparedBy}' },
        },
      ],
      style: {
        primaryColor: '#123456',
        secondaryColor: '#fff',
        fontFamily: 'helvetica',
        headerFontSize: 14,
        bodyFontSize: 10,
        companyName: '{entity}',
      },
      variables: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    engine.register(custom);
    await engine.generatePDF('custom-ext', ctx);
    const joined = textLog.join('\n');
    expect(joined).toContain('Custom ACME Corp Report');
    expect(joined).toContain('ACME Corp — FY2026-Q1');
    expect(joined).toContain('Prepared for ACME Corp by FP&A Team');
    // table cells substituted via autoTable opts
    const table = calls.find((c) => c.method === 'autoTable')!.args[0] as {
      head: string[][];
      body: string[][];
    };
    expect(table.head[0]).toEqual(['Metric', 'USD']);
    expect(table.body[0]).toEqual(['Revenue', '1000']); // data vars are ctx-level only
    // confidential flag renders the confidentiality notice
    const conf: ExportTemplate = {
      ...custom,
      id: 'custom-conf',
      sections: [
        {
          id: 'cover',
          type: 'cover',
          title: 'C',
          order: 0,
          config: { title: 'T', confidential: true },
        },
      ],
    };
    engine.register(conf);
    textLog.length = 0;
    await engine.generatePDF('custom-conf', ctx);
    expect(textLog.join('\n')).toContain('CONFIDENTIAL');
  });

  it('tolerates a broken logo (addImage throwing)', async () => {
    const fake = createFakePdf();
    fake.addImage = vi.fn(() => {
      throw new Error('image failed');
    });
    (window as unknown as { jsPDF: unknown }).jsPDF = class MockJsPDF {
      constructor() {
        return fake;
      }
    };
    const e2 = new ExportTemplateEngine();
    const custom: ExportTemplate = {
      id: 'logo-tpl',
      name: 'Logo',
      type: 'kpi_summary',
      description: '',
      sections: [{ id: 'c', type: 'cover', title: 'C', order: 0, config: { title: 'T' } }],
      style: {
        primaryColor: '#000000',
        secondaryColor: '#fff',
        fontFamily: 'helvetica',
        headerFontSize: 14,
        bodyFontSize: 10,
        companyName: 'X',
        logoUrl: 'https://example.com/logo.png',
      },
      variables: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    e2.register(custom);
    await expect(e2.generatePDF('logo-tpl', ctx)).resolves.toBeUndefined();
  });
});
