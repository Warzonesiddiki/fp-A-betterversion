import { randomId } from '@/utils/cryptoId';
import { subtractMoney } from '@/utils/money';
import {
  GLImportService,
  type GLImportOptions,
  type GLParseResult,
  type GLMappingResult,
  type GLValidationResult,
  type GLImportSummary,
  type GLImportStageProgress,
} from './GLImportService';
import { useGLUploadStore } from '@/store/glUploadStore';
import { useGLStore } from '@/store/glStore';
import type { GLEntry, ImportResult } from '@/types';

export type PipelineStage =
  | 'detect'
  | 'parse'
  | 'map'
  | 'validate'
  | 'preview'
  | 'import'
  | 'complete'
  | 'error';

export interface PipelineEvent {
  stage: PipelineStage;
  percent: number;
  message: string;
  error?: string;
}

export class ImportPipeline {
  private service: GLImportService;
  private eventListeners: Set<(event: PipelineEvent) => void> = new Set();

  constructor() {
    this.service = new GLImportService();
    this.service.onProgress(this.handleServiceProgress);
  }

  onEvent(listener: (event: PipelineEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emit(stage: PipelineStage, percent: number, message: string, error?: string): void {
    const event: PipelineEvent = { stage, percent, message, error };
    this.eventListeners.forEach((l) => l(event));
  }

  private handleServiceProgress = (p: GLImportStageProgress): void => {
    this.emit(p.stage, p.percent, p.message);
  };

  async run(
    file: File,
    options: GLImportOptions = {}
  ): Promise<{
    summary: GLImportSummary;
    entries: GLEntry[];
  }> {
    const uploadStore = useGLUploadStore.getState();
    const glStore = useGLStore.getState();
    const allEntries: GLEntry[] = [];
    let summary: GLImportSummary;

    try {
      this.emit('detect', 5, 'Detecting file format...');

      const parsed: GLParseResult = await this.service.parseFile(file, options);

      uploadStore.setFile(
        {
          name: parsed.fileName,
          size: file.size,
          format: parsed.format,
          rowCount: parsed.rowCount,
          columnCount: parsed.columnCount,
          columns: parsed.headers,
        },
        parsed.headers
      );

      this.emit('map', 50, 'Auto-detecting column mappings...');
      const mapped: GLMappingResult = this.service.autoDetectMappings(
        parsed.headers,
        parsed.previewRows
      );
      uploadStore.setMappings(mapped.userMappings);

      this.emit('validate', 70, 'Validating data...');
      const validated: GLValidationResult = this.service.validateData(
        parsed.allRows,
        mapped.userMappings,
        options
      );

      uploadStore.setPreview(
        validated.validRows.slice(0, 20).map((row, i) => ({
          rowNum: i + 2,
          data: row,
          valid: true,
          errors: [],
        })),
        validated.errors.map((e) => e.message)
      );

      this.emit('import', 90, `Importing ${validated.validRows.length} rows...`);
      summary = await this.service.confirmImport(
        parsed.fileName,
        parsed.format,
        validated.validRows,
        validated.rowCount,
        validated.errorCount,
        validated.warningCount
      );

      for (const row of validated.validRows) {
        const entry: GLEntry = {
          id: randomId('entry'),
          accountId: String(row.accountCode ?? ''),
          accountCode: String(row.accountCode ?? ''),
          accountName: String(row.accountName ?? ''),
          period: String(row.date ?? '').slice(0, 7),
          periodName: String(row.date ?? '').slice(0, 7),
          debit:
            typeof row.debit === 'number' ? row.debit : parseFloat(String(row.debit ?? '0')) || 0,
          credit:
            typeof row.credit === 'number'
              ? row.credit
              : parseFloat(String(row.credit ?? '0')) || 0,
          netChange: subtractMoney(
            typeof row.debit === 'number' ? row.debit : parseFloat(String(row.debit ?? '0')) || 0,
            typeof row.credit === 'number' ? row.credit : parseFloat(String(row.credit ?? '0')) || 0
          ).toNumber(),
          date: String(row.date ?? ''),
          amount: typeof row.amount === 'number' ? row.amount : 0,
          description: String(row.description ?? ''),
          reference: String(row.reference ?? ''),
          entityId: String(row.entity ?? ''),
          departmentId: String(row.department ?? ''),
        };
        allEntries.push(entry);
      }

      const importResult: ImportResult = {
        filename: summary.fileName,
        rowCount: summary.totalRows,
        errorCount: summary.errorCount,
        warningCount: summary.warningCount,
        successCount: summary.importedRows,
        status:
          summary.errorCount > 0 ? (summary.importedRows > 0 ? 'partial' : 'error') : 'success',
      };

      if (allEntries.length > 0) {
        glStore.addEntry(allEntries);
      }
      glStore.recordImport(importResult);

      uploadStore.completeSession({
        id: `session-${Date.now()}`,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        fileInfo: {
          name: parsed.fileName,
          size: file.size,
          format: parsed.format,
          rowCount: parsed.rowCount,
          columnCount: parsed.columnCount,
          columns: parsed.headers,
        },
        mappings: Object.entries(mapped.userMappings).map(([source, target]) => ({
          sourceColumn: source,
          targetField: target,
          isRequired: target === 'accountCode',
        })),
        rowCount: summary.importedRows,
        errorCount: summary.errorCount,
        status: importResult.status,
      });

      this.emit('complete', 100, `Import complete: ${summary.importedRows} rows imported`);

      return { summary, entries: allEntries };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed';
      this.emit('error', 0, errorMsg, errorMsg);
      throw err;
    }
  }

  destroy(): void {
    this.service.destroy();
    this.eventListeners.clear();
  }
}
