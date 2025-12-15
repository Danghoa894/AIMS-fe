import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: 'Cart Review' },
  { number: 2, title: 'Shipping Information' },
  { number: 3, title: 'Payment' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                currentStep > step.number
                  ? 'bg-teal-600 text-white'
                  : currentStep === step.number
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.number ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span
              className={`mt-2 text-sm ${
                currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {step.title}
            </span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`w-24 h-0.5 mx-4 mb-6 transition-colors ${
                currentStep > step.number ? 'bg-teal-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
