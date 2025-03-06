import React, { useEffect, useState } from "react";
import useSWR from "swr";

import { GitHubContext, GitHubContextType } from "../contexts/github-context";
import { fetchGitHubData } from "../utils/github-api";

interface GitHubProviderProps {
  children: React.ReactNode;
}

/**
 * A comprehensive GitHub provider that handles both authentication and data fetching.
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
  const isAuthenticated = Boolean(login && pat);

  // Data fetching with SWR
  const { data, error, mutate } = useSWR(
    isAuthenticated ? [login, pat] : null,
    fetchGitHubData,
    {
      dedupingInterval: 60000, // 1 minute
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Derived data state
  const isLoading = isAuthenticated && !data && !error;
  const isError = Boolean(error);

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
    refetchData: () => mutate(),
    repos: data?.repos || null,
    setLogin,
    setPat,
    user: data?.user || null,
  };

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
};
