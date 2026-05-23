import { useCallback } from 'react';
import { useTourStore, TourStep } from '@/store/tourStore';

export function useTour() {
  const { startTour, isActive, currentStepIndex, steps, stopTour } = useTourStore();

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
