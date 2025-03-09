"use client";

import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { useGitHubData } from "@/hooks/use-github-data";
import Dashboard from "@components/dashboard";

export default function DashboardPage() {
  const { isError, isLoading, pat, refetchData, repos } = useGitHubData();

  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  // Redirect to the login page if the user is not logged in
  useLayoutEffect(() => {
    if (!pat) {
      router.push("/");
    }
  }, [pat, router]);

  // Explicitly trigger data fetching when the page loads with a PAT
  useEffect(() => {
    if (pat) {
      refetchData();
    }
  }, [pat, refetchData]);

  // If we're not loading but don't have repos, try one more data fetch
  useEffect(() => {
    if (!isLoading && !repos && !isError && pat && retryCount < 1) {
      setRetryCount((prev) => prev + 1);
      refetchData();
    }
  }, [isLoading, repos, isError, pat, refetchData, retryCount]);

  // Show a loading spinner while data is being fetched
  if (isLoading) {
    return (
      <section className="container mx-auto max-w-6xl pt-16 px-6 flex-grow flex justify-center items-center">
        <Spinner label="Loading repositories..." size="lg" />
      </section>
    );
  }

  return (
    <section className="container mx-auto max-w-6xl pt-16 px-6 flex-grow">
      <Dashboard />
    </section>
  );
}
