import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTourStore, TourStep } from '@/store/tourStore';

export function useTour() {
  const { startTour, isActive, currentStepIndex, steps, stopTour } = useTourStore(
    useShallow((s) => ({
      startTour: s.startTour,
      isActive: s.isActive,
      currentStepIndex: s.currentStepIndex,
      steps: s.steps,
      stopTour: s.stopTour,
    }))
  );

  const runTour = useCallback(
    (tourId: string, tourSteps: TourStep[]) => {
      startTour(tourId, tourSteps);
    },
    [startTour]
  );

  return {
    runTour,
    isActive,
    currentStepIndex,
    steps,
    stopTour,
  };
}
