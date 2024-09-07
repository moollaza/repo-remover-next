import { Link, User } from "@nextui-org/react";

import useGitHubData from "@hooks/use-github-data";

import RepoTable from "@components/repo-table/repo-table";

export default function DashboardPage() {
  const { user, repos, isLoading, isError } = useGitHubData();

  return (
    <div>
      <h1>Dashboard</h1>

      {isError && <div>Error!</div>}

      {(isLoading || repos) && (
        <>
          <User
            className="mt-5"
            name={user?.name}
            description={
              <Link
                href={`https://github.com/${user?.login}`}
                size="sm"
                isExternal
              >
                {user?.login}
              </Link>
            }
            avatarProps={{
              src: user?.avatarUrl as string,
              showFallback: true,
            }}
          />
          <div className="mt-5">
            <RepoTable repos={repos} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
