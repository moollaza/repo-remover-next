import { Repository, User } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";
import React, { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";

// GraphQL query to get repositories
const GET_REPOS = `
  query GetRepositories($login: String!, $after: String) {
    user(login: $login) {
      id
      login
      name
      avatarUrl
      bioHTML
      repositories(first: 100, after: $after, ownerAffiliations: OWNER) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          description
          url
          isPrivate
          isArchived
          isDisabled
          isEmpty
          isFork
          isTemplate
          isLocked
          isMirror
          isInOrganization
          parent {
            id
            name
            url
          }
          owner {
            id
            login
            url
          }
          updatedAt
          viewerCanAdminister
        }
      }
    }
  }
`;

// Unified GitHub context type
interface GitHubContextType {
  // Auth state
  isAuthenticated: boolean;
  isError: boolean;
  // Data state
  isLoading: boolean;

  login: null | string;
  logout: () => void;
  pat: null | string;
  refetchData: () => void;

  repos: null | Repository[];
  // Actions
  setLogin: (login: string) => void;
  setPat: (pat: string) => void;
  user: null | User;
}

// Response type for the GraphQL query
interface RepositoriesResponse {
  user: {
    avatarUrl: string;
    bioHTML: string;
    id: string;
    login: string;
    name: string;
    repositories: {
      nodes: Repository[];
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
    };
  };
}

// Create the context with default values
const GitHubContext = createContext<GitHubContextType>({
  // Auth defaults
  isAuthenticated: false,
  isError: false,
  // Data defaults
  isLoading: false,

  login: null,
  logout: () => {},
  pat: null,
  refetchData: () => {},

  repos: null,
  // No-op actions
  setLogin: () => {},
  setPat: () => {},
  user: null,
});

interface GitHubProviderProps {
  children: React.ReactNode;
}

// Function to fetch GitHub data
async function fetchGitHubData([login, pat]: [string, string]) {
  if (!login || !pat) {
    throw new Error("Login and PAT are required");
  }

  const octokit = new Octokit({
    auth: pat,
  });

  try {
    // Fetch user data
    const userData = await octokit.rest.users.getByUsername({
      username: login,
    });

    // Fetch repositories using GraphQL for better performance and pagination
    const data = await octokit.graphql.paginate<RepositoriesResponse>(
      GET_REPOS,
      {
        login,
      },
    );

    // Extract repositories from the response
    const repos = data.user.repositories.nodes;

    // Create a User object from the response
    const user = {
      ...userData.data,
      ...data.user,
    } as unknown as User;

    return { repos, user };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    throw error;
  }
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

/**
 * Hook to use the GitHub context.
 * Provides access to authentication state, GitHub data, and actions.
 */
export const useGitHubData = () => useContext(GitHubContext);
