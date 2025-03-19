import { Button } from "@heroui/react";
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

  if (process.env.NODE_ENV !== "development" || !octokit) {
    return null;
  }

  return (
    <Button
      color="secondary"
      isLoading={isLoading}
      onPress={() => {
        void generateRepos(octokit, setIsLoading)
          .then(() => {
            // Mutate all GitHub data
            void mutate();
          })
          .catch(() => {
            setIsLoading(false);
          });
      }}
      size="md"
      variant="ghost"
    >
      Generate Random Repos
    </Button>
  );
}
