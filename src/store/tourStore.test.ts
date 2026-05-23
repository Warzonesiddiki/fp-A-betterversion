import { describe, it, expect, beforeEach } from 'vitest';
import { useTourStore } from './tourStore';

describe('tourStore', () => {
  beforeEach(() => {
    useTourStore.setState({
      isActive: false,
      currentStepIndex: 0,
      steps: [],
      completedTours: [],
    });
  });

  it('should have correct initial state', () => {
    const state = useTourStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.currentStepIndex).toBe(0);
    expect(state.steps).toEqual([]);
    expect(state.completedTours).toEqual([]);
  });

  it('should start a tour', () => {
    const steps = [
      { target: '#sidebar', title: 'Sidebar', content: 'Navigation' },
      { target: '#main', title: 'Main', content: 'Content area' },
    ];
    useTourStore.getState().startTour('tour-1', steps);
    expect(useTourStore.getState().isActive).toBe(true);
    expect(useTourStore.getState().currentStepIndex).toBe(0);
    expect(useTourStore.getState().steps).toHaveLength(2);
  });

  it('should stop a tour', () => {
    useTourStore.getState().startTour('tour-1', [{ target: '#a', title: 'A', content: 'B' }]);
    useTourStore.getState().stopTour();
    expect(useTourStore.getState().isActive).toBe(false);
    expect(useTourStore.getState().steps).toEqual([]);
    expect(useTourStore.getState().currentStepIndex).toBe(0);
  });

  it('should go to next step', () => {
    const steps = [
      { target: '#a', title: 'A', content: 'A content' },
      { target: '#b', title: 'B', content: 'B content' },
    ];
    useTourStore.getState().startTour('tour-1', steps);
    useTourStore.getState().nextStep();
    expect(useTourStore.getState().currentStepIndex).toBe(1);
  });

  it('should auto-stop when at last step', () => {
    const steps = [{ target: '#a', title: 'A', content: 'A content' }];
    useTourStore.getState().startTour('tour-1', steps);
    useTourStore.getState().nextStep();
    expect(useTourStore.getState().isActive).toBe(false);
  });

  it('should go to previous step', () => {
    const steps = [
      { target: '#a', title: 'A', content: 'A content' },
      { target: '#b', title: 'B', content: 'B content' },
    ];
    useTourStore.getState().startTour('tour-1', steps);
    useTourStore.getState().nextStep();
    useTourStore.getState().prevStep();
    expect(useTourStore.getState().currentStepIndex).toBe(0);
  });

  it('should not go before first step', () => {
    useTourStore.getState().startTour('tour-1', [{ target: '#a', title: 'A', content: 'B' }]);
    useTourStore.getState().prevStep();
    expect(useTourStore.getState().currentStepIndex).toBe(0);
  });

  it('should complete a tour', () => {
    useTourStore.getState().startTour('tour-1', [{ target: '#a', title: 'A', content: 'B' }]);
    useTourStore.getState().completeTour('tour-1');
    expect(useTourStore.getState().isActive).toBe(false);
    expect(useTourStore.getState().completedTours).toContain('tour-1');
  });

  it('should not duplicate completed tours', () => {
    useTourStore.getState().completeTour('tour-1');
    useTourStore.getState().completeTour('tour-1');
    expect(useTourStore.getState().completedTours.filter((t) => t === 'tour-1')).toHaveLength(1);
  });
});
