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
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  step.number < currentStep
                    ? 'bg-white text-emerald-600'
                    : step.number === currentStep
                    ? 'bg-orange-500 text-white ring-4 ring-orange-200'
                    : 'bg-emerald-500 text-emerald-200'
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  step.number <= currentStep ? 'text-white' : 'text-emerald-200'
                }`}>
                  {step.title}
                </p>
                <p className={`text-xs ${
                  step.number <= currentStep ? 'text-emerald-100' : 'text-emerald-300'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                  step.number < currentStep ? 'bg-white' : 'bg-emerald-500'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-emerald-500 rounded-full h-2">
        <div
          className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StepIndicator;