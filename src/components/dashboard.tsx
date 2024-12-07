import RepoTable from "@components/repo-table/repo-table";
import useGitHubData from "@hooks/use-github-data";

export default function DashboardPage() {
  const { isError, isLoading, repos } = useGitHubData();

  return (
    <div className="mt-6">
      {isError && <div>Error!</div>}

      {(isLoading || repos) && (
        <RepoTable isLoading={isLoading} repos={repos} />
      )}
    </div>
  );
}
