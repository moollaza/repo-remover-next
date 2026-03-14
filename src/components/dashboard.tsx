import { type Repository } from "@octokit/graphql-schema";

import RepoLoadingProgress from "@/components/repo-loading-progress";
import RepoTable from "@/components/repo-table/repo-table";
import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";
import { type LoadingProgress } from "@/utils/github-api";

export interface DashboardProps {
  /** Whether an error occurred during data fetch */
  isError: boolean;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Current user's login/username */
  login: null | string;
  /** Optional callback for refresh action */
  onRefresh?: () => void;
  /** Optional permission warning message */
  permissionWarning?: string;
  /** Loading progress information */
  progress?: LoadingProgress | null;
  /** Current user's repositories */
  repos: null | Repository[];
}

/**
 * Dashboard - Presentational Component
 *
 * Pure presentational component with zero hooks/context/effects.
 * Container version: src/app/dashboard/page.tsx
 */
export default function Dashboard({
  isError,
  isLoading,
  login,
  onRefresh,
  permissionWarning,
  progress,
  repos,
}: DashboardProps) {
  return (
    <section className="py-10 flex-grow">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" data-testid="repo-table-header">
          Select Repos to Modify
        </h1>

        {onRefresh && !isLoading && (
          <button
            aria-label="Refresh repository data"
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            onClick={onRefresh}
            type="button"
          >
            Refresh Data
          </button>
        )}
      </div>

      {/* Show progress while loading */}
      {isLoading && progress && (
        <RepoLoadingProgress
          currentOrg={progress.currentOrg}
          orgsLoaded={progress.orgsLoaded}
          orgsTotal={progress.orgsTotal}
          stage={progress.stage}
        />
      )}

      {isError && (
        <div
          className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          role="alert"
        >
          Error loading repositories. Please check your token and try again.
        </div>
      )}

      {permissionWarning && (
        <div
          className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          role="alert"
        >
          <div>
            <strong>Limited Access:</strong> {permissionWarning}
          </div>
          <div className="mt-2 text-sm">
            Some organization repositories may not be visible due to
            insufficient token permissions.
          </div>
        </div>
      )}

      {/* Show skeleton until first data arrives; show table even when empty */}
      {repos === null ? (
        <RepoTableSkeleton rows={10} />
      ) : (
        <RepoTable login={login} repos={repos} />
      )}
    </section>
  );
}
