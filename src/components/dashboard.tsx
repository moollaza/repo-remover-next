import { Divider, Link, User } from "@nextui-org/react";

import useGitHubData from "@hooks/use-github-data";

import RepoTable from "@components/repo-table/repo-table";

export default function DashboardPage() {
  const { user, repos, isLoading, isError } = useGitHubData();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5">Dashboard</h1>

      {isError && <div>Error!</div>}

      {(isLoading || repos) && (
        <>
          {/* <p className="text-small text-gray-600">Authenticated as:</p> */}
          <User
            className="mt-2 mb-4"
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

          <Divider />

          <div className="mt-6">
            <RepoTable repos={repos} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
