"use client";

import { Alert } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import RepoTable from "@/components/repo-table/repo-table";
import { useGitHubData } from "@/hooks/use-github-data";

export default function DashboardPage() {
  const { isError, isInitialized, isLoading, login, pat, permissionWarning, refetchData, repos } =
    useGitHubData();

  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!pat) {
      router.push("/");
    } else {
      refetchData();
    }
  }, [pat, router, refetchData, isInitialized]);

  return (
    <section className="py-16 flex-grow ">
      <h1
        className="text-3xl font-semibold mb-10"
        data-testid="repo-table-header"
      >
        Select Repos to Modify
      </h1>

      {isError && (
        <Alert className="mb-4" color="danger">
          Error loading repositories. Please check your token and try again.
        </Alert>
      )}

      {permissionWarning && (
        <Alert className="mb-4" color="warning">
          <div>
            <strong>Limited Access:</strong> {permissionWarning}
          </div>
          <div className="mt-2 text-sm">
            Some organization repositories may not be visible due to insufficient token permissions.
          </div>
        </Alert>
      )}

      {(isLoading || (repos && login !== null)) && (
        <RepoTable isLoading={isLoading} login={login} repos={repos} />
      )}
    </section>
  );
}
