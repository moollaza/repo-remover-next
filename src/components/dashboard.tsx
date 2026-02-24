"use client";

import { Alert } from "@heroui/react";
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
        <Alert className="mb-4" color="danger">
          Error loading repositories. Please check your token and try again.
        </Alert>
      )}

      {permissionWarning && (
        <Alert className="mb-4" color="warning">
          <div>
            <strong>Limited Access:</strong> {permissionWarning}
          </div>
          <div className="mt-2 text-sm">
            Some organization repositories may not be visible due to insufficient
            token permissions.
          </div>
        </Alert>
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
