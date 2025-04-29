import { useContext } from "react";

import { GitHubContext } from "@/contexts/github-context";

/**
 * Hook to use the GitHub context
 * Provides access to authentication state, GitHub data, and actions.
 *
 * @example
 * const { isAuthenticated, isError, isLoading, login, logout, pat, refetchData, repos, setLogin, setPat, user } = useGitHubData();
 *
 * @see {@link GitHubContext}
 * @see {@link GitHubDataProvider}
 */
export const useGitHubData = () => useContext(GitHubContext);
