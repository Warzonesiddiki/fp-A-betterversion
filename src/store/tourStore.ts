import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '../utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  completedTours: string[];

  startTour: (tourId: string, steps: TourStep[]) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTour: (tourId: string) => void;
}

export const useTourStore = create<TourState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        isActive: false,
        currentStepIndex: 0,
        steps: [],
        completedTours: [],

        startTour: enforce(Permissions.UI_UPDATE, 'startTour', (_tourId, steps) => {
          set({
            isActive: true,
            currentStepIndex: 0,
            steps,
          });
        }),

        stopTour: enforce(Permissions.UI_UPDATE, 'stopTour', () =>
          set({ isActive: false, steps: [], currentStepIndex: 0 })
        ),

        nextStep: () => {
          const { currentStepIndex, steps } = get();
          if (currentStepIndex < steps.length - 1) {
            set({ currentStepIndex: currentStepIndex + 1 });
          } else {
            set({ isActive: false });
          }
        },

        prevStep: () => {
          const { currentStepIndex } = get();
          if (currentStepIndex > 0) {
            set({ currentStepIndex: currentStepIndex - 1 });
          }
        },

        completeTour: enforce(Permissions.UI_UPDATE, 'completeTour', (tourId) => {
          set((state) => ({
            completedTours: [...new Set([...state.completedTours, tourId])],
            isActive: false,
          }));
        }),
      })),
      {
        name: 'tour-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
