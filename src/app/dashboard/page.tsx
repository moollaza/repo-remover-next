"use client";

import { Alert } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import RepoTable from "@/components/repo-table/repo-table";
import { useGitHubData } from "@/hooks/use-github-data";

export default function DashboardPage() {
  const { isError, isInitialized, isLoading, pat, refetchData, repos } =
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
    <section className="pt-16 flex-grow">
      {isError && (
        <Alert className="mb-4" color="danger">
          Error loading repositories. Please check your token and try again.
        </Alert>
      )}
      {(isLoading || repos) && (
        // TODO: Lift page title and table filters to this component
        <RepoTable isLoading={isLoading} repos={repos} />
      )}
    </section>
  );
}
