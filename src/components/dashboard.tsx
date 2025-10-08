"use client";

import { Alert } from "@heroui/react";
import { type Repository } from "@octokit/graphql-schema";

import RepoTable from "@/components/repo-table/repo-table";

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
  repos,
}: DashboardProps) {
  return (
    <section className="py-16 flex-grow">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold" data-testid="repo-table-header">
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

      {(isLoading || (repos && login !== null)) && (
        <RepoTable isLoading={isLoading} login={login} repos={repos} />
      )}
    </section>
  );
}
