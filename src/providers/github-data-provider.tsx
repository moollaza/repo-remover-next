import { Repository, User } from "@octokit/graphql-schema";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

import { GitHubContext, GitHubContextType } from "@/contexts/github-context";
import { fetchGitHubData } from "@/utils/github-api";

/**
 * Props for the GitHubDataProvider component.
 */
interface GitHubProviderProps {
  children: React.ReactNode;
}

/**
 * A comprehensive GitHub provider that handles both authentication and data fetching.
 * This provider manages:
 * 1. Authentication state (login, PAT)
 * 2. Data fetching with SWR for caching and revalidation
 * 3. Local storage persistence
 * 4. Actions for login, logout, and data refetching
 */
export const GitHubDataProvider: React.FC<GitHubProviderProps> = ({
  children,
}) => {
  // Authentication state
  const [login, setLoginState] = useState<null | string>(null);
  const [pat, setPatState] = useState<null | string>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLogin = localStorage.getItem("login");
      const storedPat = localStorage.getItem("pat");

      if (storedLogin) setLoginState(storedLogin);
      if (storedPat) setPatState(storedPat);
    }
  }, []);

  // Derived authentication state
  const isAuthenticated = Boolean(pat);

  // Data fetching with SWR
  // Define the correct interface for our fetcher function
  interface GitHubFetcherResult {
    error: Error | null;
    repos: null | Repository[];
    user: null | User;
  }
  // We can still use type for simple type aliases - updated to handle null values
  type GitHubFetcherKey = [string, string];

  // Now we can properly type our SWR hook
  const { data, error, mutate } = useSWR<
    GitHubFetcherResult,
    Error,
    GitHubFetcherKey | null
  >(
    // We only need the PAT to be set for authentication, login can be determined from the API
    pat ? ([login ?? "", pat] as GitHubFetcherKey) : null,
    // Cast to expected return type
    fetchGitHubData as unknown as (
      key: GitHubFetcherKey,
    ) => Promise<GitHubFetcherResult>,
    {
      dedupingInterval: 60000, // 1 minute
      onError: () => {
        // TODO: Handle error
      },
      onSuccess: (data) => {
        // Set the login from the API response if it wasn't provided
        if (data?.user?.login && !login) {
          setLogin(data.user.login);
        }
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Derived data state
  const isLoading = isAuthenticated && !data && !error;
  const isError = Boolean(error ?? data?.error);

  // Handle data loading and errors
  const repos = isError ? null : (data?.repos ?? null);
  const user = isError ? null : (data?.user ?? null);

  // Actions with localStorage persistence
  const setLogin = (newLogin: string) => {
    setLoginState(newLogin);
    if (typeof window !== "undefined") {
      localStorage.setItem("login", newLogin);
    }
  };

  const setPat = (newPat: string) => {
    setPatState(newPat);
    if (typeof window !== "undefined") {
      localStorage.setItem("pat", newPat);
    }
  };

  const logout = () => {
    setLoginState(null);
    setPatState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("login");
      localStorage.removeItem("pat");
    }
  };

  // Context value
  const value: GitHubContextType = {
    isAuthenticated,
    isError,
    isLoading,
    login,
    logout,
    pat,
    // Define refetchData to match the void return type in the context
    refetchData: () => {
      // Use void operator to explicitly discard the Promise
      void mutate();
    },
    repos,
    setLogin,
    setPat,
    user,
  };

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
};
