import { useContext } from "react";

import { GitHubContext } from "../contexts/github-context";

/**
 * Hook to use the GitHub context.
 * Provides access to authentication state, GitHub data, and actions.
 */
export const useGitHubData = () => useContext(GitHubContext);
