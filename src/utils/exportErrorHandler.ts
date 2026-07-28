// =============================================================================
// EXPORT ERROR HANDLER
// =============================================================================
// PDF/Excel export entry points are asynchronous (jsPDF and ExcelJS are loaded
// on demand so they stay out of the initial bundle). Page-level click handlers
// are synchronous, so they attach this handler to keep a failed export from
// becoming an unhandled promise rejection — and to leave a diagnosable trace.
// =============================================================================

import { createLogger } from '@/utils/logger';

const exportLogger = createLogger('Export');

/**
 * Attach to a fire-and-forget export promise:
 *
 *   void ExportEngine.exportToPDF(data, config).catch(reportExportFailure);
 */
export function reportExportFailure(error: unknown): void {
  exportLogger.error('Export failed', {
    error: error instanceof Error ? error.message : String(error),
  });
}
