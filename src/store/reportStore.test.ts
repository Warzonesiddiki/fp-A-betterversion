import { describe, it, expect, beforeEach } from 'vitest';
import { useReportStore } from './reportStore';

describe('reportStore', () => {
  beforeEach(() => {
    useReportStore.setState({
      reports: [],
      scheduledReports: [],
      activeReportId: null,
      isLoading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useReportStore.getState();
    expect(state.reports).toEqual([]);
    expect(state.scheduledReports).toEqual([]);
    expect(state.activeReportId).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should create a report', () => {
    const id = useReportStore.getState().createReport({
      name: 'P&L Report',
      type: 'profit_loss',
    } as any);
    expect(id).toMatch(/^rpt-/);
    expect(useReportStore.getState().reports).toHaveLength(1);
  });

  it('should delete a report', () => {
    const id = useReportStore.getState().createReport({ name: 'R1', type: 'custom' } as any);
    useReportStore.getState().deleteReport(id);
    expect(useReportStore.getState().reports).toHaveLength(0);
  });

  it('should clear active report when deleted', () => {
    const id = useReportStore.getState().createReport({ name: 'R1', type: 'custom' } as any);
    useReportStore.getState().setActiveReport(id);
    useReportStore.getState().deleteReport(id);
    expect(useReportStore.getState().activeReportId).toBeNull();
  });

  it('should set active report', () => {
    useReportStore.getState().setActiveReport('rpt-1');
    expect(useReportStore.getState().activeReportId).toBe('rpt-1');
  });

  it('should set reports', () => {
    const reports = [{ id: 'rpt-1', name: 'R1' }] as any;
    useReportStore.getState().setReports(reports);
    expect(useReportStore.getState().reports).toEqual(reports);
  });

  it('should add a scheduled report', () => {
    const id = useReportStore.getState().addScheduledReport({
      reportId: 'rpt-1',
      schedule: 'monthly',
    } as any);
    expect(id).toMatch(/^sch-/);
    expect(useReportStore.getState().scheduledReports).toHaveLength(1);
  });

  it('should delete a scheduled report', () => {
    const id = useReportStore.getState().addScheduledReport({
      reportId: 'rpt-1',
      schedule: 'monthly',
    } as any);
    useReportStore.getState().deleteScheduledReport(id);
    expect(useReportStore.getState().scheduledReports).toHaveLength(0);
  });
});
