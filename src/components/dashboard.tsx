import { type Repository } from "@octokit/graphql-schema";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import RepoTable from "@/components/repo-table/repo-table";
import RepoTableSkeleton from "@/components/repo-table/repo-table-skeleton";
import { Button } from "@/components/ui/button";

export interface DashboardProps {
  /** Whether an error occurred during data fetch */
  isError: boolean;
  /** Whether data is currently loading (first time, no cache) */
  isLoading: boolean;
  /** Whether data is refreshing in the background (cached data visible) */
  isRefreshing: boolean;
  /** Current user's login/username */
  login: null | string;
  /** Optional callback for refresh action */
  onRefresh?: () => void;
  /** Optional permission warning message */
  permissionWarning?: string;
  /** Current user's repositories */
  repos: null | Repository[];
  /** Org names that failed to load due to SAML SSO enforcement */
  samlProtectedOrgs?: string[];
}

/**
 * Dashboard - Presentational Component
 *
 * Pure presentational component with zero hooks/context/effects.
 * Container version: src/routes/dashboard.tsx
 */
export default function Dashboard({
  isError,
  isLoading,
  isRefreshing,
  login,
  onRefresh,
  permissionWarning,
  repos,
  samlProtectedOrgs,
}: DashboardProps) {
  const [isSamlBannerDismissed, setIsSamlBannerDismissed] = useState(false);

  const showSamlBanner =
    !isSamlBannerDismissed && samlProtectedOrgs && samlProtectedOrgs.length > 0;

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

        {onRefresh && (
          <Button
            aria-label="Refresh repository data"
            className="gap-2 px-4 py-2 border-divider cursor-pointer hover:bg-default-100 hover:border-default-300 active:scale-95 transition-all"
            disabled={isLoading || isRefreshing}
            onClick={onRefresh}
            variant="ghost"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading || isRefreshing ? "animate-spin" : ""}`}
            />
            {isLoading || isRefreshing ? "Loading..." : "Refresh"}
          </Button>
        )}
      </div>

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
          <strong>Limited token permissions</strong>
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

      {showSamlBanner && (
        <div
          className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 relative"
          role="status"
        >
          <Button
            aria-label="Dismiss SAML warning"
            className="absolute top-3 right-3 p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            onClick={() => setIsSamlBannerDismissed(true)}
            variant="ghost"
            size="icon"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <strong>Some organizations require SAML authentication</strong>
          <p className="mt-1 text-sm">
            Repos from{" "}
            <span className="font-medium">{samlProtectedOrgs.join(", ")}</span>{" "}
            couldn&apos;t be loaded. Authorize your token in your org&apos;s SSO
            settings to access these repositories.
          </p>
          <a
            className="inline-block mt-3 text-sm font-medium underline hover:no-underline"
            href="https://github.com/settings/tokens"
            rel="noopener noreferrer"
            target="_blank"
          >
            Authorize SSO for your token on GitHub &rarr;
          </a>
        </div>
      )}

      {/* Show skeleton only on first load; show table (even during refresh) once we have data */}
      {repos === null ? (
        <RepoTableSkeleton rows={10} />
      ) : (
        <RepoTable login={login} repos={repos} />
      )}
    </section>
  );
}
