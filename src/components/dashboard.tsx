import React, { useContext } from "react";

import RepoTable from "@components/repo-table";
import useGitHubData from "@hooks/use-github-data";
import GitHubContext from "@contexts/github-context";

export default function DashboardPage() {
  const { pat, login } = useContext(GitHubContext);
  const { repos, isLoading, isError } = useGitHubData({ pat, login });

  return (
    <div>
      <h1>Dashboard</h1>

      {isLoading && <div>Loading...</div>}
      {isError && <div>Error!</div>}
      {repos && <RepoTable repos={repos} />}
    </div>
  );
}
