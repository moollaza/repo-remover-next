import { RefreshCw as ArrowPathIcon } from "lucide-react";

interface RepoLoadingProgressProps {
  currentOrg?: string;
  orgsLoaded: number;
  orgsTotal: number;
  stage: "complete" | "orgs" | "personal";
}

export default function RepoLoadingProgress({
  currentOrg,
  orgsLoaded,
  orgsTotal,
  stage,
}: RepoLoadingProgressProps) {
  // Auto-dismiss when complete
  if (stage === "complete") {
    return null;
  }

  const totalSteps = 1 + orgsTotal; // 1 personal + N orgs
  const currentStep = stage === "personal" ? 1 : 1 + orgsLoaded;
  const percentage = Math.round((currentStep / totalSteps) * 100);

  const label =
    stage === "personal"
      ? "Loading personal repositories..."
      : `Loading organization repositories (${orgsLoaded}/${orgsTotal})...`;

  const subtitle = currentOrg ? `Currently loading: ${currentOrg}` : "";

  return (
    <div className="mb-6 p-4 bg-content2 rounded-lg border border-divider">
      <div className="flex items-center gap-3 mb-2">
        <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{label}</span>
            <span className="text-default-500">
              {currentStep} of {totalSteps}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-default-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div
        aria-label="Loading progress"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="w-full h-1.5 bg-default-200 rounded-full overflow-hidden"
        role="progressbar"
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
