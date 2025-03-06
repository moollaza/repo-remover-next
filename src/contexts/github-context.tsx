import { Repository, User } from "@octokit/graphql-schema";
import { createContext } from "react";

// Unified GitHub context type
export interface GitHubContextType {
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

// Create the context with default values
export const GitHubContext = createContext<GitHubContextType>({
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
