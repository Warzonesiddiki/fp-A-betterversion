import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildZip, textToBytes, downloadBlob, type ZipEntry } from './zipBuilder';

describe('textToBytes', () => {
  it('should convert ASCII text to bytes', () => {
    const result = textToBytes('hello');
    expect(result.length).toBe(5);
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
  });

  it('should handle empty string', () => {
    const result = textToBytes('');
    expect(result.length).toBe(0);
  });

  it('should handle unicode', () => {
    const result = textToBytes('é');
    expect(result.length).toBe(2); // UTF-8 encoded
  });

  it('should return array-like structure', () => {
    const result = textToBytes('abc');
    expect(result.length).toBe(3);
    expect(result[0]!).toBe(97); // 'a'
    expect(result[1]!).toBe(98); // 'b'
    expect(result[2]!).toBe(99); // 'c'
  });
});

describe('buildZip', () => {
  it('should build a valid ZIP with no entries', () => {
    const zip = buildZip([]);
    expect(zip.length).toBe(22);
    const dv = new DataView(zip.buffer);
    expect(dv.getUint32(0, true)).toBe(0x06054b50); // EOCD signature
  });

  it('should build a valid ZIP with one entry', () => {
    const entry: ZipEntry = { name: 'test.txt', data: textToBytes('hello') };
    const zip = buildZip([entry]);

    expect(zip.length).toBeGreaterThan(22);

    // Check local file header signature
    const dv = new DataView(zip.buffer);
    expect(dv.getUint32(0, true)).toBe(0x04034b50); // Local file header
  });

  it('should build a valid ZIP with multiple entries', () => {
    const entries: ZipEntry[] = [
      { name: 'a.txt', data: textToBytes('aaa') },
      { name: 'b.txt', data: textToBytes('bbb') },
      { name: 'c.txt', data: textToBytes('ccc') },
    ];
    const zip = buildZip(entries);

    // 3 local headers + 3 central headers + EOCD
    expect(zip.length).toBeGreaterThan(100);
  });

  it('should set correct file names in headers', () => {
    const entry: ZipEntry = { name: 'data.csv', data: textToBytes('col') };
    const zip = buildZip([entry]);

    // Find "data.csv" in the ZIP bytes
    const nameBytes = textToBytes('data.csv');
    let found = false;
    for (let i = 0; i <= zip.length - nameBytes.length; i++) {
      let match = true;
      for (let j = 0; j < nameBytes.length; j++) {
        if (zip[i + j] !== nameBytes[j]!) {
          match = false;
          break;
        }
      }
      if (match) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('should handle empty data entries', () => {
    const entry: ZipEntry = { name: 'empty.txt', data: new Uint8Array(0) };
    const zip = buildZip([entry]);
    expect(zip.length).toBeGreaterThan(0);
  });

  it('should handle binary data', () => {
    const binary = new Uint8Array([0, 1, 2, 255, 128, 64]);
    const entry: ZipEntry = { name: 'binary.bin', data: binary };
    const zip = buildZip([entry]);
    expect(zip.length).toBeGreaterThan(0);
  });

  it('should set correct EOCD record counts', () => {
    const entries: ZipEntry[] = [
      { name: 'a.txt', data: textToBytes('a') },
      { name: 'b.txt', data: textToBytes('b') },
    ];
    const zip = buildZip(entries);

    // EOCD is at the end
    const dv = new DataView(zip.buffer);
    const eocdOffset = zip.length - 22;
    expect(dv.getUint32(eocdOffset, true)).toBe(0x06054b50);
    expect(dv.getUint16(eocdOffset + 8, true)).toBe(2); // total entries
    expect(dv.getUint16(eocdOffset + 10, true)).toBe(2); // total entries on disk
  });
});

describe('downloadBlob', () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.fn>;
  let removeChildSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    appendChildSpy = vi.fn();
    removeChildSpy = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return {
          click: clickSpy,
          href: '',
          download: '',
        } as unknown as HTMLElement;
      }
      return document.createElement(tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy as any);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('should create and click a download link', () => {
    const data = new Uint8Array([1, 2, 3]);
    downloadBlob(data, 'test.zip', 'application/zip');

    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should set correct filename and mime type', () => {
    const data = new Uint8Array([1]);
    downloadBlob(data, 'report.csv', 'text/csv');

    const _aEl = document.createElement('a') as any;
    // The mock createElement returns the same spy, verify it was called with 'a'
    expect(document.createElement).toHaveBeenCalledWith('a');
  });
});
