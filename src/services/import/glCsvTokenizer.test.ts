import { describe, expect, it } from 'vitest';
import { SmartImportMapper } from '@/engines/SmartImportMapper';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import { readStagingQuarantinePage } from './glStagingCoordinator';
import { tokenizeGLCsvStream, stageGLCsvImport, CSVTokenizationError } from './glCsvTokenizer';

function createMemoryPort() {
  const values = new Map<string, unknown>();
  const port: StagingStoragePort = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, structuredClone(value));
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
  return { port, values };
}

async function* splitFragments(text: string, size: number): AsyncGenerator<string> {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}

describe('Streaming CSV tokenizer and staging integration', () => {
  it('preserves exact physical 1-based line numbers across blank lines, multiline quoted fields, and arbitrary stream chunk boundaries', async () => {
    // Physical lines:
    // Line 1: Header (with BOM)
    // Line 2: Blank line
    // Line 3..5: First data record (multiline quoted description spanning 3 physical lines)
    // Line 6: Blank line with whitespace
    // Line 7: Second data record (escaped quotes inside quoted field)
    // Line 8: Third data record
    const csv =
      '\uFEFFAccount,Date,Debit,Credit,Entity,Currency,Description\r\n' +
      '\r\n' +
      '1000,2026-10-15,500.00,,P,USD,"Line 1 of memo\r\nLine 2 of memo\nLine 3 of memo"\r\n' +
      '   \r\n' +
      '4000,2026-10-15,,300.00,P,USD,"Quoted ""special"" revenue"\r\n' +
      '4000,2026-10-15,,200.00,P,USD,Final line';

    // Stream in tiny 7-character fragments so \r\n, quotes, and fields split across chunk boundaries
    const batches = [];
    for await (const chunk of tokenizeGLCsvStream(splitFragments(csv, 7), {
      delimiter: ',',
      maxRowsPerChunk: 2,
    })) {
      batches.push(chunk);
    }

    expect(batches).toHaveLength(2);
    expect(batches[0]?.headers).toEqual([
      'Account',
      'Date',
      'Debit',
      'Credit',
      'Entity',
      'Currency',
      'Description',
    ]);
    expect(batches[0]?.firstRowNumber).toBe(3);
    expect(batches[0]?.rowNumbers).toEqual([3, 7]);
    expect(batches[0]?.rows[0]?.Description).toBe('Line 1 of memo\nLine 2 of memo\nLine 3 of memo');
    expect(batches[0]?.rows[1]?.Description).toBe('Quoted "special" revenue');

    expect(batches[1]?.firstRowNumber).toBe(8);
    expect(batches[1]?.rowNumbers).toEqual([8]);
    expect(batches[1]?.rows[0]?.Description).toBe('Final line');
  });

  it('propagates physical CSV line numbers into staged accepted rows, quarantined rows, and voucher imbalances', async () => {
    const csv = [
      'Account;Date;Debit;Credit;Entity;Currency;Voucher;Description', // line 1
      '', // line 2 (blank)
      '1000;15/10/2026;100.00;;P;EUR;V1;"Multi\nline\nmemo"', // line 3..5 (starts at line 3)
      '', // line 6 (blank)
      '4000;15/10/2026;;100.00;P;EUR;V1;Offset', // line 7
      'BAD_ACCT;31/02/2026;50.00;;P;EUR;V2;Quarantined row', // line 8
    ].join('\n');

    const { port } = createMemoryPort();
    const repository = createGLStagingRepository(port);

    const manifest = await stageGLCsvImport(
      {
        batchId: 'csv-line-oracle',
        source: splitFragments(csv, 11),
        delimiter: ';',
        maxRowsPerChunk: 1,
        config: {
          sourceId: 'D365-EUR',
          knownAccountCodes: ['1000', '4000'],
          knownEntityIds: ['P'],
          expectedCurrency: 'EUR',
          dateOrder: 'DMY',
        },
      },
      {
        repository,
        compute: async (input) => SmartImportMapper.ingest(input),
      }
    );

    expect(manifest.status).toBe('blocked');
    expect(manifest.acceptedCount).toBe(2);
    expect(manifest.quarantinedCount).toBe(1);
    expect(manifest.fileHash).toMatch(/^[a-f0-9]{64}$/);

    const chunk0 = await repository.readChunk('csv-line-oracle', 0);
    const chunk1 = await repository.readChunk('csv-line-oracle', 1);
    expect(chunk0?.acceptedRows[0]?.sourceRow).toBe(3);
    expect(chunk1?.acceptedRows[0]?.sourceRow).toBe(7);

    const quarantinePage = await readStagingQuarantinePage(
      'csv-line-oracle',
      { offset: 0, limit: 10 },
      { repository }
    );
    expect(quarantinePage.rows[0]?.sourceRow).toBe(8);
    expect(quarantinePage.rows[0]?.reasons.map((r) => r.code)).toEqual([
      'UNKNOWN_ACCOUNT',
      'INVALID_DATE',
    ]);
  });

  it('fails closed on unclosed quotes, malformed quotes, extra columns, and invalid UTF-8 bytes', async () => {
    // 1. Unclosed quote
    await expect(async () => {
      for await (const _ of tokenizeGLCsvStream('Account,Debit\n1000,"unclosed', {
        delimiter: ',',
      })) {
        // consume
      }
    }).rejects.toThrow(CSVTokenizationError);

    // 2. Characters after closing quote
    await expect(async () => {
      for await (const _ of tokenizeGLCsvStream('Account,Debit\n"1000"extra,10.00', {
        delimiter: ',',
      })) {
        // consume
      }
    }).rejects.toThrow(/quote/i);

    // 3. Extra unmapped columns beyond header length
    await expect(async () => {
      for await (const _ of tokenizeGLCsvStream('Account,Debit\n1000,10.00,EXTRA', {
        delimiter: ',',
      })) {
        // consume
      }
    }).rejects.toThrow(/column/i);

    // 4. Invalid UTF-8 byte sequence (0xFF 0xFE in middle of UTF-8 stream)
    async function* badBytes() {
      yield new TextEncoder().encode('Account,Debit\n1000,');
      yield new Uint8Array([0xff, 0xfe, 0x31]);
    }
    await expect(async () => {
      for await (const _ of tokenizeGLCsvStream(badBytes(), { delimiter: ',' })) {
        // consume
      }
    }).rejects.toThrow(/UTF-8/i);
  });
});
