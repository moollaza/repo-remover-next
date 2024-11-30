import useGitHubData from "@hooks/use-github-data";

import RepoTable from "@components/repo-table/repo-table";

export default function DashboardPage() {
  const { repos, isLoading, isError } = useGitHubData();

  return (
    <div className="mt-6">
      {isError && <div>Error!</div>}

      {(isLoading || repos) && (
        <RepoTable repos={repos} isLoading={isLoading} />
      )}
    </div>
  );
}
