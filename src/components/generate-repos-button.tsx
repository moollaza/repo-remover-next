import { Button } from "@heroui/react";
import { useState } from "react";
import { useSWRConfig } from "swr";

import { GET_REPOS } from "@/hooks/use-github-data";
import { useGitHub } from "@/providers/github-provider";
import { generateRepos } from "@utils/github-utils";

/**
 * This component generates random repositories for the user
 * This is only available in development mode, to test archiving and deleting repositories
 * @returns void
 */
export function GenerateReposButton() {
  const { mutate } = useSWRConfig();

  const { octokit } = useGitHub();
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
            void mutate(GET_REPOS);
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
