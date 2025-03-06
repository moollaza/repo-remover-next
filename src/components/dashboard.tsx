import { useGitHubData } from "@/providers/github-data-provider";
import RepoTable from "@components/repo-table/repo-table";

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
