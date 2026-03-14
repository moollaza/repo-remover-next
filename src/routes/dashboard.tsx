import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import DashboardComponent from "@/components/dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { useGitHubData } from "@/hooks/use-github-data";

/**
 * Dashboard - Container Component
 *
 * Handles data fetching, authentication, and routing.
 * Presentational component: src/components/dashboard.tsx
 */
export function Dashboard() {
  const {
    isError,
    isInitialized,
    isLoading,
    login,
    pat,
    permissionWarning,
    progress,
    refetchData,
    repos,
  } = useGitHubData();

  const navigate = useNavigate();

  // Side effect: Redirect to home if not authenticated
  useEffect(() => {
    if (!isInitialized) return;

    if (!pat) {
      void navigate("/");
    } else {
      void refetchData();
    }
  }, [pat, navigate, refetchData, isInitialized]);

  // Render presentational component with all data
  return (
    <ErrorBoundary>
      <DashboardComponent
        isError={isError}
        isLoading={isLoading}
        login={login}
        onRefresh={refetchData}
        permissionWarning={permissionWarning}
        progress={progress}
        repos={repos}
      />
    </ErrorBoundary>
  );
}
