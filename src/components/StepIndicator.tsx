import React from 'react';
import { Check } from 'lucide-react';

interface ConceptualStep {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: ConceptualStep[];
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, totalSteps }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isFuture = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300"
                  style={{
                    backgroundColor: isCompleted
                      ? 'white'
                      : isCurrent
                      ? 'var(--secondary-color, #10b981)'
                      : 'transparent',
                    color: isCompleted
                      ? 'var(--secondary-color, #10b981)'
                      : isCurrent
                      ? 'white'
                      : 'var(--tenant-secondary-200, #a7f3d0)',
                    border: isFuture ? '2px solid var(--secondary-color, #10b981)' : 'none',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(92, 225, 165, 0.2)' : 'none',
                  }}
                >
                  {step.number < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: step.number <= currentStep ? 'white' : 'var(--tenant-secondary-200, #a7f3d0)',
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: step.number <= currentStep
                        ? 'var(--tenant-secondary-100, #d1fae5)'
                        : 'var(--tenant-secondary-300, #6ee7b7)',
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-4 transition-all duration-300"
                  style={{
                    backgroundColor: step.number < currentStep ? 'white' : 'var(--secondary-color, #10b981)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--secondary-color, #10b981)' }}>
        <div
          className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StepIndicator;