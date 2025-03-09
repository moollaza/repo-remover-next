import { Alert } from "@heroui/react";

import { useGitHubData } from "@/hooks/use-github-data";
import RepoTable from "@components/repo-table/repo-table";

export default function Dashboard() {
  const { isError, isLoading, repos } = useGitHubData();

  return (
    <div>
      {isError && (
        <Alert className="mb-4" color="danger">
          Error loading repositories. Please check your token and try again.
        </Alert>
      )}

      {(isLoading || repos) && (
        <RepoTable isLoading={isLoading} repos={repos} />
      )}
    </div>
  );
}
