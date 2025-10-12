import { type Repository, type User } from "@octokit/graphql-schema";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import useSWR from "swr";

import { GitHubContext, GitHubContextType } from "@/contexts/github-context";
import {
  fetchGitHubDataWithProgress,
  type LoadingProgress,
} from "@/utils/github-api";
import { secureStorage } from "@/utils/secure-storage";

const IS_DEV = process.env.NODE_ENV === "development";

// Interface for SWR fetcher function
export interface GitHubFetcherResult {
  error: Error | null;
  permissionWarning?: string;
  repos: null | Repository[];
  user: null | User;
}

type GitHubFetcherKey = [string, string];

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState<LoadingProgress | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Load from secure storage on mount
  useLayoutEffect(() => {
    async function loadStoredData() {
      try {
        const storedLogin = await secureStorage.getItem("login");
        const storedPat = await secureStorage.getItem("pat");

        if (storedLogin && typeof storedLogin === "string")
          setLoginState(storedLogin);
        if (storedPat && typeof storedPat === "string") setPatState(storedPat);
      } catch (error) {
        console.warn("Error accessing secure storage:", error);
      } finally {
        setIsInitialized(true);
      }
    }

    void loadStoredData();

    // Cleanup function
    return () => {
      // Any cleanup needed when component unmounts
    };
  }, []);

  // Derived authentication state
  const isAuthenticated = Boolean(isInitialized && Boolean(pat));

  // Now we can properly type our SWR hook
  const { data, error, mutate } = useSWR<
    GitHubFetcherResult,
    Error,
    GitHubFetcherKey | null
  >(
    // We only fetch when we have a PAT, login is optional and will be determined from the API if not provided
    pat ? ([login ?? "", pat] as GitHubFetcherKey) : null,
    // Use the progress-aware fetcher
    async ([login, pat]): Promise<GitHubFetcherResult> => {
      const result = await fetchGitHubDataWithProgress([login, pat], (progressUpdate) => {
        // Update progress state
        setProgress(progressUpdate);

        // Update SWR cache immediately with partial data!
        void mutate(
          {
            error: null,
            repos: progressUpdate.repos,
            user: progressUpdate.user as null | User,
          },
          false, // false = don't revalidate
        );
      });

      // Cast the result to match GitHubFetcherResult type
      return {
        ...result,
        user: result.user as null | User,
      };
    },
    {
      dedupingInterval: 60000, // 1 minute
      onError: (err: Error) => {
        console.error("GitHub API error:", err);
        // Clear progress on error
        setProgress(null);
        // If error is authentication related, consider clearing credentials
        if (
          err.message.includes("401") ||
          err.message.includes("auth")
        ) {
          console.warn("Authentication error detected, consider logging out");
        }
      },
      onSuccess: (data: GitHubFetcherResult) => {
        // Set the login from the API response if it wasn't provided
        if (data.user?.login && !login) {
          setLogin(data.user.login);
        }
        // Clear progress when complete
        setProgress(null);
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Derived data state - handle partial data cases
  const isLoading = isAuthenticated && !data && !error;

  // We have an error state if there's an SWR error OR if data.error exists but we have no partial data
  const isError = Boolean(error ?? (data?.error && !data.repos && !data.user));

  // Handle data loading and errors - use partial data if available
  const repos = data?.repos ?? null;
  const user = data?.user ?? null;

  // Track if we have partial data with an error
  const hasPartialData = Boolean(data?.error && (data.repos ?? data.user));

  // Actions with localStorage persistence
  const setLogin = useCallback((newLogin: string) => {
    if (!newLogin || typeof newLogin !== "string") {
      console.error("Invalid login format");
      return;
    }

    setLoginState(newLogin);
    if (typeof window !== "undefined") {
      secureStorage.setItem("login", newLogin).catch((error) => {
        console.warn("Failed to save login to secure storage:", error);
      });
    }
  }, []);

  const setPat = useCallback((newPat: string) => {
    if (!newPat || typeof newPat !== "string") {
      console.error("Invalid Personal Access Token format");
      return;
    }

    setPatState(newPat);
    if (typeof window !== "undefined") {
      secureStorage.setItem("pat", newPat).catch((error) => {
        console.warn("Failed to save PAT to secure storage:", error);
      });
    }
  }, []);

  const logout = useCallback(() => {
    setLoginState(null);
    setPatState(null);
    if (typeof window !== "undefined") {
      try {
        secureStorage.removeItem("login");
        secureStorage.removeItem("pat");
      } catch (error) {
        console.warn("Failed to clear secure storage during logout:", error);
      }
    }
  }, []);

  // Rate-limited data refetching
  const refetchData = useCallback(() => {
    const now = Date.now();
    // Implement a simple rate limiting (5 second cooldown)
    if (now - lastFetchTimeRef.current > 5000) {
      lastFetchTimeRef.current = now;
      void mutate();
    } else {
      console.warn("Rate limiting refetch attempts");
    }
  }, [mutate]);

  // Log in development mode
  // Use useEffect for logging to avoid excessive console output
  useEffect(() => {
    if (IS_DEV) {
      console.debug("GitHub Provider state updated:", {
        hasLogin: !!login,
        hasPartialData,
        hasRepos: repos?.length ?? 0,
        isAuthenticated,
        isError,
        isInitialized,
      });
    }
  }, [hasPartialData, isAuthenticated, isError, isInitialized, login, repos]);

  // Context value
  const value: GitHubContextType = {
    // Include the actual error for consumers to inspect if needed
    error: data?.error ?? error ?? null,
    hasPartialData,
    isAuthenticated,
    isError,
    isInitialized,
    isLoading,
    login,
    logout,
    mutate,
    pat,
    permissionWarning: data?.permissionWarning,
    progress,
    refetchData,
    repos,
    setLogin,
    setPat,
    user,
  };

  return (
    <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
  );
};
