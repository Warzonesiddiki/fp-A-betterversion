import { useState } from 'react';
import { ExportEngine } from '@/engines/ExportEngine';
import type { ExportData } from '@/engines/ExportEngine';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToPDF = async (data: ExportData, title: string) => {
    if (!data.rows.length) {
      setError('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      await ExportEngine.exportToPDF(data, { title });
    } catch (_e) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (data: ExportData, fileName: string) => {
    if (!data.rows.length) {
      setError('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      await ExportEngine.exportToExcel(data, { title: fileName });
    } catch (_e) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (data: ExportData, fileName: string) => {
    if (!data.rows.length) {
      setError('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      await ExportEngine.exportToCSV(data, { title: fileName });
    } catch (_e) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPDF, exportToExcel, exportToCSV, isExporting, error };
}
