import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { FinanceReport, ScheduledReport, ReportState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { enforce, Permissions } from '../utils/rbacEnforcer';

export const useReportStore = create<ReportState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        reports: [],
        scheduledReports: [],
        activeReportId: null,
        isLoading: false,
        error: null,

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),
        clearError: () =>
          set((state) => {
            state.error = null;
          }),
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setReports: enforce(Permissions.REPORT_UPDATE, 'setReports', (reports) =>
          set((state) => {
            state.reports = reports;
          })
        ),

        setActiveReport: enforce(Permissions.UI_UPDATE, 'setActiveReport', (id) =>
          set((state) => {
            state.activeReportId = id;
          })
        ),

        createReport: enforce(Permissions.REPORT_CREATE, 'createReport', (report) => {
          const id = `rpt-${Date.now()}`;
          set((state) => {
            state.reports.push({ ...report, id } as FinanceReport);
          });
          return id;
        }),

        deleteReport: enforce(Permissions.REPORT_DELETE, 'deleteReport', (id) =>
          set((state) => {
            state.reports = state.reports.filter((r) => r.id !== id);
            if (state.activeReportId === id) state.activeReportId = null;
          })
        ),

        setScheduledReports: enforce(
          Permissions.REPORT_SCHEDULE,
          'setScheduledReports',
          (scheduled) =>
            set((state) => {
              state.scheduledReports = scheduled;
            })
        ),

        addScheduledReport: enforce(
          Permissions.REPORT_SCHEDULE,
          'addScheduledReport',
          (scheduled) => {
            const id = `sch-${Date.now()}`;
            set((state) => {
              state.scheduledReports.push({ ...scheduled, id } as ScheduledReport);
            });
            return id;
          }
        ),

        deleteScheduledReport: enforce(
          Permissions.REPORT_SCHEDULE,
          'deleteScheduledReport',
          (id) =>
            set((state) => {
              state.scheduledReports = state.scheduledReports.filter((s) => s.id !== id);
            })
        ),

        toggleScheduledReport: enforce(
          Permissions.REPORT_SCHEDULE,
          'toggleScheduledReport',
          (id) =>
            set((state) => {
              const idx = state.scheduledReports.findIndex((s) => s.id === id);
              if (idx !== -1) {
                state.scheduledReports[idx]!.isActive = !state.scheduledReports[idx]!.isActive;
              }
            })
        ),
      })),
      {
        name: 'report-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);