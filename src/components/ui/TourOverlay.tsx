import { useEffect, useState, useRef } from 'react';
import { useTourStore } from '@/store/tourStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './Button';

export function TourOverlay() {
  const { isActive, currentStepIndex, steps, nextStep, prevStep, stopTour } = useTourStore();
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const step = steps[currentStepIndex];
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !step) return;

    const updateCoords = () => {
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
      requestRef.current = requestAnimationFrame(updateCoords);
    };

    updateCoords();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, step]);

  if (!isActive || !step) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      role="region"
      aria-label="TourOverlay"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        style={{
          clipPath: `polygon(
          0% 0%, 
          0% 100%, 
          ${coords.left}px 100%, 
          ${coords.left}px ${coords.top}px, 
          ${coords.left + coords.width}px ${coords.top}px, 
          ${coords.left + coords.width}px ${coords.top + coords.height}px, 
          ${coords.left}px ${coords.top + coords.height}px, 
          ${coords.left}px 100%, 
          100% 100%, 
          100% 0%
        )`,
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute pointer-events-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 w-80"
          style={{
            top:
              step.placement === 'bottom'
                ? coords.top + coords.height + 12
                : step.placement === 'top'
                  ? coords.top - 200
                  : coords.top,
            left: coords.left + coords.width / 2 - 160,
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-white">{step.title}</h3>
            <button
              onClick={stopTour}
              aria-label="Close tour"
              className="text-[var(--text-muted)] hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{step.content}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-4 rounded-full transition-colors ${i === currentStepIndex ? 'bg-blue-500' : 'bg-slate-800'}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              <Button size="sm" onClick={nextStep}>
                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
