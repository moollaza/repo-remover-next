import clsx from "clsx";
import { useState } from "react";

import { useGitHubData } from "@/hooks/use-github-data";
import { createThrottledOctokit, generateRepos } from "@/utils/github-utils";

/**
 * This component generates random repositories for the user
 * This is only available in development mode, to test archiving and deleting repositories
 * @returns void
 */
export function GenerateReposButton() {
  // Get the mutate function and PAT from the GitHub context
  const { mutate, pat } = useGitHubData();

  // Create an Octokit instance with the PAT
  const octokit = pat ? createThrottledOctokit(pat) : null;
  const [isLoading, setIsLoading] = useState(false);

  if (!import.meta.env.DEV || !octokit) {
    return null;
  }

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg border border-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-[var(--brand-blue)]",
        "hover:bg-[var(--brand-blue)] hover:text-white transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2",
        isLoading && "opacity-70 cursor-not-allowed",
      )}
      disabled={isLoading}
      onClick={() => {
        void generateRepos(octokit, setIsLoading)
          .then(() => {
            // Mutate all GitHub data
            void mutate();
          })
          .catch(() => {
            setIsLoading(false);
          });
      }}
      type="button"
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              fill="currentColor"
            />
          </svg>
          Generating...
        </span>
      ) : (
        "Generate Random Repos"
      )}
    </button>
  );
}
