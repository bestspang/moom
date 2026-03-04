import React from 'react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-primary/20 text-primary',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {step}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground max-w-[60px] text-center leading-tight hidden sm:block">
                {stepLabels[i]}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={cn(
                  'h-px w-6 sm:w-8',
                  step < currentStep ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
