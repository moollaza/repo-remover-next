import { Button, Divider, Link, Tooltip, User } from "@nextui-org/react";

import useGitHubData from "@hooks/use-github-data";

import { GenerateReposButton } from "@components/generate-repos-button";
import RepoTable from "@components/repo-table/repo-table";

// Clear the localStorage and redirect to the homepage
function LogoutButton() {
  const handleLogout = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <Tooltip
      content="Click to logout and return to the homepage"
      placement="bottom"
    >
      <Button
        variant="light"
        color="danger"
        onClick={handleLogout}
        aria-label="Logout Button"
      >
        Logout
      </Button>
    </Tooltip>
  );
}

export default function DashboardPage() {
  const { user, repos, isLoading, isError } = useGitHubData();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-5">Repo Remover Dashboard</h1>

      {isError && <div>Error!</div>}

      {(isLoading || repos) && (
        <>
          <div className="flex items-center">
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
            <div className="flex gap-3 ml-auto">
              <LogoutButton />
              <GenerateReposButton />
            </div>
          </div>

          <Divider />

          <div className="mt-6">
            <RepoTable repos={repos} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
