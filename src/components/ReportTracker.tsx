import React from "react";

interface StatusStep {
  key: string;
  label: string;
}

interface ReportTrackerProps {
  status: string;
  steps: StatusStep[];
}

const ReportTracker: React.FC<ReportTrackerProps> = ({ status, steps }) => {
  const currentStep = steps.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-col gap-4 py-2">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isActive
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-gray-200 border-gray-300 text-gray-500"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-px flex-1 mx-auto ${
                    idx < currentStep - 1
                      ? "bg-green-500"
                      : idx < currentStep
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>
            <div className="pt-0.5">
              <span
                className={`font-medium ${
                  isCompleted
                    ? "text-green-600"
                    : isActive
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportTracker;
