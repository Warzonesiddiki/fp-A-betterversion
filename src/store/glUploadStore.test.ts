import { describe, it, expect, beforeEach } from 'vitest';
import { useGLUploadStore, type UploadFileInfo } from './glUploadStore';

describe('glUploadStore', () => {
  beforeEach(() => {
    useGLUploadStore.setState({
      step: 'select',
      fileInfo: null,
      csvColumns: [],
      mappings: {},
      preview: [],
      validationErrors: [],
      progress: { percent: 0, message: '', rowsProcessed: 0, totalRows: 0 },
      session: null,
      sessionHistory: [],
      isAutoMapping: false,
    });
  });

  const mockFileInfo: UploadFileInfo = {
    name: 'trial-balance.csv',
    size: 1024,
    format: 'csv',
    rowCount: 100,
    columnCount: 6,
    columns: ['Account', 'Date', 'Debit', 'Credit', 'Entity', 'Description'],
  };

  it('starts in select step', () => {
    const state = useGLUploadStore.getState();
    expect(state.step).toBe('select');
    expect(state.fileInfo).toBeNull();
  });

  it('setFile transitions to mapping step', () => {
    useGLUploadStore.getState().setFile(mockFileInfo, mockFileInfo.columns);
    const state = useGLUploadStore.getState();
    expect(state.step).toBe('mapping');
    expect(state.fileInfo?.name).toBe('trial-balance.csv');
    expect(state.csvColumns).toEqual(mockFileInfo.columns);
  });

  it('setFile resets mappings and preview', () => {
    useGLUploadStore.getState().setMappings({ Account: 'accountCode' });
    useGLUploadStore
      .getState()
      .setPreview([{ rowNum: 2, data: { Account: '1000' }, valid: true, errors: [] }], []);

    useGLUploadStore.getState().setFile(mockFileInfo, mockFileInfo.columns);
    const state = useGLUploadStore.getState();
    expect(state.mappings).toEqual({});
    expect(state.preview).toEqual([]);
    expect(state.validationErrors).toEqual([]);
  });

  it('setMappings updates mappings', () => {
    useGLUploadStore.getState().setMappings({ Account: 'accountCode', Date: 'date' });
    const { mappings } = useGLUploadStore.getState();
    expect(mappings).toEqual({ Account: 'accountCode', Date: 'date' });
  });

  it('setPreview transitions to preview step with data', () => {
    const preview = [{ rowNum: 2, data: { Account: '1000' }, valid: true, errors: [] }];
    useGLUploadStore.getState().setPreview(preview, []);
    const state = useGLUploadStore.getState();
    expect(state.step).toBe('preview');
    expect(state.preview).toEqual(preview);
    expect(state.validationErrors).toEqual([]);
  });

  it('setPreview transitions to error step when empty', () => {
    useGLUploadStore.getState().setPreview([], ['No valid rows']);
    const state = useGLUploadStore.getState();
    expect(state.step).toBe('error');
    expect(state.validationErrors).toEqual(['No valid rows']);
  });

  it('setProgress updates progress partially', () => {
    useGLUploadStore.getState().setProgress({ percent: 50, rowsProcessed: 25 });
    const { progress } = useGLUploadStore.getState();
    expect(progress.percent).toBe(50);
    expect(progress.rowsProcessed).toBe(25);
    expect(progress.message).toBe('');
  });

  it('setAutoMapping toggles auto mapping flag', () => {
    useGLUploadStore.getState().setAutoMapping(true);
    expect(useGLUploadStore.getState().isAutoMapping).toBe(true);
    useGLUploadStore.getState().setAutoMapping(false);
    expect(useGLUploadStore.getState().isAutoMapping).toBe(false);
  });

  it('completeSession finalizes the upload', () => {
    const session = {
      id: 'session-1',
      startedAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T00:01:00Z',
      fileInfo: mockFileInfo,
      mappings: [{ sourceColumn: 'Account', targetField: 'accountCode', isRequired: true }],
      rowCount: 95,
      errorCount: 5,
      status: 'success' as const,
    };

    useGLUploadStore.getState().completeSession(session);
    const state = useGLUploadStore.getState();
    expect(state.step).toBe('complete');
    expect(state.session?.id).toBe('session-1');
    expect(state.sessionHistory).toHaveLength(1);
    expect(state.progress.percent).toBe(100);
  });

  it('reset returns to initial state', () => {
    useGLUploadStore.getState().setFile(mockFileInfo, mockFileInfo.columns);
    useGLUploadStore.getState().reset();
    const state = useGLUploadStore.getState();
    expect(state.step).toBe('select');
    expect(state.fileInfo).toBeNull();
    expect(state.csvColumns).toEqual([]);
  });

  it('clearHistory empties session history', () => {
    useGLUploadStore.getState().completeSession({
      id: 'session-1',
      startedAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T00:01:00Z',
      fileInfo: mockFileInfo,
      mappings: [],
      rowCount: 0,
      errorCount: 0,
      status: 'success',
    });
    useGLUploadStore.getState().clearHistory();
    expect(useGLUploadStore.getState().sessionHistory).toEqual([]);
  });

  it('session history accumulates multiple sessions', () => {
    for (let i = 0; i < 3; i++) {
      useGLUploadStore.getState().completeSession({
        id: `session-${i}`,
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:01:00Z',
        fileInfo: mockFileInfo,
        mappings: [],
        rowCount: i * 10,
        errorCount: 0,
        status: 'success',
      });
    }
    expect(useGLUploadStore.getState().sessionHistory).toHaveLength(3);
    expect(useGLUploadStore.getState().sessionHistory[0]?.id).toBe('session-2');
  });
});
