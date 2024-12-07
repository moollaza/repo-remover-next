import { Button } from "@nextui-org/react";
import { useState } from "react";
import { useSWRConfig } from "swr";

import { GET_REPOS } from "@/hooks/use-github-data";
import { useGitHub } from "@/providers/github-provider";
import { generateRepos } from "@utils/github-utils";

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
      onClick={() => {
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
