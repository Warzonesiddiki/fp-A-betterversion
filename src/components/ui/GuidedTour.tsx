import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TourStep {
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (isOpen && step?.target) {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen || !step) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* Overlay with hole for target */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto">
        {targetRect && (
          <div
            className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-md transition-all duration-300"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}
      </div>

      {/* Tour Card */}
      <div
        className={cn(
          'absolute pointer-events-auto transition-all duration-300 z-[101]',
          targetRect ? 'w-[320px]' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px]'
        )}
        style={
          targetRect
            ? {
                left:
                  step.position === 'left'
                    ? targetRect.left - 340
                    : step.position === 'right'
                      ? targetRect.right + 20
                      : targetRect.left,
                top:
                  step.position === 'top'
                    ? targetRect.top - 200
                    : step.position === 'bottom'
                      ? targetRect.bottom + 20
                      : targetRect.top,
              }
            : undefined
        }
      >
        <div className="bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border-subtle)] p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 leading-tight">
            {step.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
            {step.content}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-md border border-[var(--border-subtle)] text-xs font-semibold hover:bg-gray-50 dark:bg-gray-900 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>Back</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <span>Finish</span>
                    <Check className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Simple arrow indicator for target */}
        {targetRect && (
          <div
            className={cn(
              'absolute w-4 h-4 bg-[var(--bg-surface)] rotate-45 border-t border-l border-[var(--border-subtle)] z-[-1]',
              step.position === 'bottom' && 'left-1/2 -translate-x-1/2 -top-2',
              step.position === 'top' &&
                'left-1/2 -translate-x-1/2 -bottom-2 border-t-0 border-l-0 border-b border-r',
              step.position === 'left' &&
                'top-1/2 -translate-y-1/2 -right-2 border-t-0 border-l-0 border-b border-r',
              step.position === 'right' && 'top-1/2 -translate-y-1/2 -left-2'
            )}
          />
        )}
      </div>
    </div>
  );
};
