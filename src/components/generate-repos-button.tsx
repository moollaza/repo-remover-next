import { Button } from "@heroui/react";
import { Octokit } from "@octokit/rest";
import { useState } from "react";
import { useSWRConfig } from "swr";

import { useGitHubData } from "@/hooks/use-github-data";
import { generateRepos } from "@utils/github-utils";

/**
 * This component generates random repositories for the user
 * This is only available in development mode, to test archiving and deleting repositories
 * @returns void
 */
export function GenerateReposButton() {
  const { mutate } = useSWRConfig();

  // Get the PAT from the new provider
  const { pat } = useGitHubData();

  // Create an Octokit instance with the PAT
  const octokit = pat ? new Octokit({ auth: pat }) : null;
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
            void mutate(undefined, { revalidate: true });
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
