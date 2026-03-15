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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold"
            data-testid="repo-table-header"
          >
            Repository Management
          </h1>
          <p className="text-default-500 mt-1">
            Select repositories to archive or delete permanently
          </p>
        </div>

        {onRefresh && !isLoading && (
          <button
            aria-label="Refresh repository data"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-divider text-sm font-medium hover:bg-default-50 transition-colors"
            onClick={onRefresh}
            type="button"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
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
          <strong>Some repositories may be missing</strong>
          <ul className="mt-2 text-sm list-disc list-inside space-y-1">
            {permissionWarning.split("\n\n").map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
          <a
            className="inline-block mt-3 text-sm font-medium underline hover:no-underline"
            href="https://github.com/settings/tokens"
            rel="noopener noreferrer"
            target="_blank"
          >
            Update token permissions on GitHub &rarr;
          </a>
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
