// @money-ast-allow Reason: Step index: currentStep + 1 is integer step navigation, not money
import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Step {
  label: string;
  status: 'done' | 'current' | 'pending';
  description?: string;
}

export interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
}

export const ProgressStepper: React.FC<ProgressStepperProps> = memo(
  ({ steps, currentStep, orientation = 'horizontal' }) => {
    const isVertical = orientation === 'vertical';

    return (
      <div
        className={cn('flex w-full', isVertical ? 'flex-col space-y-0' : 'flex-row items-start')}
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label="Progress"
      >
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isDone = step.status === 'done' || idx < currentStep;
          const isCurrent = step.status === 'current' || idx === currentStep;

          return (
            <div
              key={idx}
              className={cn(
                'flex group',
                isVertical ? 'flex-row min-h-[64px]' : 'flex-1 flex-col items-center'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Connection Line & Icon Container */}
              <div
                className={cn(
                  'relative flex',
                  isVertical ? 'flex-col items-center mr-4' : 'flex-row items-center w-full mb-2'
                )}
              >
                {/* Line before (except first) */}
                {!isVertical && idx > 0 && (
                  <div
                    className={cn(
                      'h-0.5 w-full absolute right-1/2 top-1/2 -translate-y-1/2 z-0',
                      isDone || isCurrent ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}

                {/* Line after (except last) */}
                {!isVertical && !isLast && (
                  <div
                    className={cn(
                      'h-0.5 w-full absolute left-1/2 top-1/2 -translate-y-1/2 z-0',
                      isDone ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}

                {/* Vertical Line after (except last) */}
                {isVertical && !isLast && (
                  <div
                    className={cn(
                      'w-0.5 h-full absolute top-1/2 left-1/2 -translate-x-1/2 z-0',
                      isDone ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}

                {/* Icon Node */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300',
                    isDone
                      ? 'bg-blue-600 border-blue-600'
                      : isCurrent
                        ? 'bg-white dark:bg-gray-800 border-blue-600 shadow-md ring-4 ring-blue-50'
                        : 'bg-white dark:bg-gray-800 border-[var(--border-subtle)]'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">
                      {idx + 1}
                    </span>
                  )}
                </div>
              </div>

              {/* Label Container */}
              <div
                className={cn(
                  'flex flex-col',
                  isVertical ? 'pt-1.5' : 'items-center text-center px-2'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider transition-colors duration-300',
                    isCurrent
                      ? 'text-blue-700'
                      : isDone
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)]'
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span
                    className={cn(
                      'text-[10px] mt-0.5 font-medium leading-tight max-w-[120px]',
                      isCurrent ? 'text-blue-600/70' : 'text-[var(--text-secondary)] opacity-60'
                    )}
                  >
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
