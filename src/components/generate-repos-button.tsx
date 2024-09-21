import { useGitHub } from "@/providers/github-provider";
import { Button } from "@nextui-org/react";
import { useState } from "react";

import { generateRepos } from "@utils/github-utils";

export function GenerateReposButton() {
  const { octokit } = useGitHub();
  const [isLoading, setIsLoading] = useState(false);

  if (process.env.NODE_ENV !== "development" || !octokit) {
    return null;
  }

  return (
    <Button
      color="secondary"
      size="md"
      variant="ghost"
      isLoading={isLoading}
      onClick={() => void generateRepos(octokit, setIsLoading)}
    >
      Generate Random Repos
    </Button>
  );
}
