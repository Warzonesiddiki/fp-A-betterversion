/**
 * @vitest-environment jsdom
 */
import 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockStartTour, mockStopTour, mockIsActive, mockCurrentStepIndex, mockSteps } = vi.hoisted(
  () => {
    return {
      mockStartTour: vi.fn(),
      mockStopTour: vi.fn(),
      mockIsActive: { current: false },
      mockCurrentStepIndex: { current: 0 },
      mockSteps: { current: [] as any[] },
    };
  }
);

vi.mock('@/store/tourStore', () => ({
  useTourStore: vi.fn(() => ({
    isActive: mockIsActive.current,
    currentStepIndex: mockCurrentStepIndex.current,
    steps: mockSteps.current,
    startTour: mockStartTour,
    stopTour: mockStopTour,
  })),
}));

import { useTour } from './useTour';

describe('useTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsActive.current = false;
    mockCurrentStepIndex.current = 0;
    mockSteps.current = [];
  });

  it('should return tour state and actions', () => {
    const { result } = renderHook(() => useTour());
    expect(result.current.isActive).toBe(false);
    expect(result.current.currentStepIndex).toBe(0);
    expect(typeof result.current.runTour).toBe('function');
    expect(typeof result.current.stopTour).toBe('function');
  });

  it('should indicate active tour', () => {
    mockIsActive.current = true;
    const { result } = renderHook(() => useTour());
    expect(result.current.isActive).toBe(true);
  });

  it('should call stopTour', () => {
    const { result } = renderHook(() => useTour());
    act(() => {
      result.current.stopTour();
    });
    expect(mockStopTour).toHaveBeenCalled();
  });
});
