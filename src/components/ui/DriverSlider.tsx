import React from 'react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/utils/cn';

export interface DriverSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const DriverSlider: React.FC<DriverSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled = false,
}) => {
  // Determine color based on progress (red at min, green at max)
  const percentage = ((value - min) / (max - min)) * 100;

  const getTrackColor = () => {
    if (percentage < 33) return 'bg-red-500';
    if (percentage < 66) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div
      className={cn(
        'flex flex-col space-y-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg transition-all',
        disabled && 'opacity-50 grayscale pointer-events-none'
      )}
      role="region"
      aria-label="DriverSlider"
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-black text-blue-600 tabular-nums">
            {value.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase opacity-60">
            {unit}
          </span>
        </div>
      </div>

      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        max={max}
        min={min}
        step={step}
        onValueChange={(vals) => onChange(vals[0]!)}
        disabled={disabled}
      >
        <Slider.Track className="bg-gray-100 dark:bg-gray-800 relative grow rounded-full h-[6px] border border-[var(--border-subtle)]">
          <Slider.Range
            className={cn(
              'absolute h-full rounded-full transition-colors duration-300',
              getTrackColor()
            )}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 bg-white dark:bg-gray-800 border-2 border-blue-600 shadow-lg rounded-full hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all cursor-grab active:cursor-grabbing"
          aria-label={label}
        />
      </Slider.Root>

      <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-secondary)] opacity-50 tabular-nums">
        <span>
          {min.toLocaleString()}
          {unit}
        </span>
        <span>
          {max.toLocaleString()}
          {unit}
        </span>
      </div>
    </div>
  );
};
