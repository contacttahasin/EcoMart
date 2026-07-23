import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Identity" },
  { number: 2, label: "Business" },
  { number: 3, label: "Verification" },
  { number: 4, label: "Payouts" },
];

type StepIndicatorProps = {
  currentStep: number;
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mx-auto mb-20 w-full max-w-3xl">
      <div className="relative flex w-full items-center justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-surface-container-highest" />
        <div
          className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        {STEPS.map((step) => {
          const isComplete = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-md ${
                  isComplete
                    ? "bg-primary text-white"
                    : isActive
                      ? "bg-primary text-white ring-4 ring-secondary-container"
                      : "bg-surface-container-highest text-on-surface-variant shadow-none"
                }`}
              >
                {isComplete ? <Check aria-hidden="true" className="h-5 w-5" /> : step.number}
              </div>
              <span
                className={`text-xs ${
                  isActive ? "font-bold text-primary" : isComplete ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
