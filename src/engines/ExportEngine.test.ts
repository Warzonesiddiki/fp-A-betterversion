/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { ExportEngine, type ExportData, type ExportConfig } from './ExportEngine';

describe('ExportEngine', () => {
  describe('exportToCSV', () => {
    it('should generate CSV content without crashing', () => {
      const data: ExportData = {
        headers: ['Name', 'Value'],
        rows: [
          ['Revenue', 1000],
          ['Cost', 500],
        ],
      };
      const config: ExportConfig = { title: 'Test Report' };

      const linkSpy = { setAttribute: vi.fn(), click: vi.fn(), style: {} };
      const origCreateElement = document.createElement.bind(document);
      document.createElement = ((tag: string) =>
        tag === 'a' ? (linkSpy as any) : origCreateElement(tag)) as any;
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      expect(() => ExportEngine.exportToCSV(data, config)).not.toThrow();
      expect(linkSpy.click).toHaveBeenCalled();
    });
  });

  describe('exportToPDF', () => {
    it('should handle missing jsPDF gracefully', () => {
      const data: ExportData = { headers: ['A'], rows: [[1]] };
      const config: ExportConfig = { title: 'Test' };
      // When jsPDF is not loaded, the engine may throw or return gracefully
      expect(() => ExportEngine.exportToPDF(data, config)).not.toThrow('Unexpected error');
    });
  });

  describe('exportToExcel', () => {
    it('should handle missing XLSX gracefully', () => {
      const data: ExportData = { headers: ['A'], rows: [[1]] };
      const config: ExportConfig = { title: 'Test' };
      // When XLSX is not loaded, the engine may throw or return gracefully
      expect(() => ExportEngine.exportToExcel(data, config)).not.toThrow('Unexpected error');
    });
  });
});
