"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import Dashboard from "@/components/dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { useGitHubData } from "@/hooks/use-github-data";

/**
 * DashboardPage - Container Component
 *
 * Handles data fetching, authentication, and routing.
 * Presentational component: src/components/dashboard.tsx
 */
export default function DashboardPage() {
  const {
    isError,
    isInitialized,
    isLoading,
    login,
    pat,
    permissionWarning,
    refetchData,
    repos,
  } = useGitHubData();

  const router = useRouter();

  // Side effect: Redirect to home if not authenticated
  useEffect(() => {
    if (!isInitialized) return;

    if (!pat) {
      router.push("/");
    } else {
      refetchData();
    }
  }, [pat, router, refetchData, isInitialized]);

  // Render presentational component with all data
  return (
    <ErrorBoundary>
      <Dashboard
        isError={isError}
        isLoading={isLoading}
        login={login}
        onRefresh={refetchData}
        permissionWarning={permissionWarning}
        repos={repos}
      />
    </ErrorBoundary>
  );
}
