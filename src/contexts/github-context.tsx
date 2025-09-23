import { Repository, User } from "@octokit/graphql-schema";
import { createContext } from "react";
import { type KeyedMutator } from "swr";

import { type GitHubFetcherResult } from "@/providers/github-data-provider";

/**
 * Context type for GitHub data and authentication
 * Used to share the data and authentication state across the app
 * Use with the <GitHubDataProvider> component to provide the data and authentication state
 * Use with the <useGitHubData> hook to access the data and authentication state
 *
 * @example
 * <GitHubDataProvider>
 *   <GitHubContext.Provider value={contextValue}>
 *     <App />
 *   </GitHubContext.Provider>
 * </GitHubDataProvider>
 *
 * @see {@link GitHubDataProvider}
 * @see {@link useGitHubData}
 */
export interface GitHubContextType {
  /**
   * The error object if an error occurred during fetching.
   */
  error: Error | null;

  /**
   * Whether we have partial data despite an error.
   */
  hasPartialData: boolean;

  /**
   * Whether the user is authenticated.
   */
  isAuthenticated: boolean;

  /**
   * Whether there is an error with the authentication.
   */
  isError: boolean;

  /**
   * Whether the data is initialized.
   */
  isInitialized: boolean;

  /**
   * Whether the data is loading.
   */
  isLoading: boolean;

  /**
   * The login of the user.
   */
  login: null | string;

  /**
   * Logs out the user.
   */
  logout: () => void;

  /**
   * SWR mutate function to manually trigger revalidation
   */
  mutate: KeyedMutator<GitHubFetcherResult>;

  /**
   * The personal access token of the user.
   */
  pat: null | string;

  /**
   * Refetches the data.
   */
  refetchData: () => void;

  /**
   * The repositories of the user.
   */
  repos: null | Repository[];

  /**
   * Sets the login of the user.
   */
  setLogin: (login: string) => void;

  /**
   * Sets the personal access token of the user.
   */
  setPat: (pat: string) => void;

  /**
   * The user.
   */
  user: null | User;

  /**
   * Permission warning message if token lacks required scopes.
   */
  permissionWarning?: string;
}

/**
 * React context for GitHub data and authentication.
 * Initialized with default values that will be overridden by the GitHubDataProvider.
 */
export const GitHubContext = createContext<GitHubContextType>({
  error: null,
  hasPartialData: false,
  isAuthenticated: false,
  isError: false,
  isInitialized: false,
  isLoading: false,
  login: null,
  logout: () => {
    // no-op
  },
  mutate: async () =>
    await Promise.resolve({ error: null, repos: null, user: null }),
  pat: null,
  refetchData: () => {
    // no-op
  },
  repos: null,
  setLogin: () => {
    // no-op
  },
  setPat: () => {
    // no-op
  },
  user: null,
});
