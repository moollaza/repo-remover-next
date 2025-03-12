import { Repository } from "@octokit/graphql-schema";

import { createThrottledOctokit } from "./github-utils";

// GraphQL query to get repositories with pagination
export const GET_REPOS = `
  query getRepositories($login: String!, $cursor: String) {
    user(login: $login) {
      id
      login
      name
      avatarUrl
      bioHTML
      repositories(first: 100, after: $cursor, ownerAffiliations: OWNER) {
        nodes {
          id
          name
          description
          isPrivate
          isArchived
          isFork
          isTemplate
          isMirror
          isLocked
          isInOrganization
          owner {
            id
            login
            url
          }
          parent {
            name
            owner {
              login
            }
          }
          updatedAt
          url
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

// GraphQL query to get current user
export const GET_CURRENT_USER = `
  query getCurrentUser {
    viewer {
      id
      login
      name
      avatarUrl
      bioHTML
    }
  }
`;

// Define the response type for the current user query
export interface CurrentUserResponse {
  viewer: {
    avatarUrl: string;
    bioHTML: string;
    id: string;
    login: string;
    name: string;
  };
}

// Define the response type for the GraphQL query
export interface RepositoriesResponse {
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

export interface User {
  avatarUrl: string;
  id: string;
  login: string;
  name: string;
  url: string;
}

/**
 * Fetches GitHub data for the specified user using GraphQL with pagination
 * @param params A tuple of [login, pat] where login is the GitHub username and pat is the personal access token
 * @returns An object containing the repositories and user data
 */
export async function fetchGitHubData(params: [string, string]): Promise<{
  error: Error | null;
  repos: null | Repository[];
  user: null | User;
}> {
  const [login, pat] = params;

  if (!pat) {
    throw new Error("PAT is required");
  }

  try {
    // Create Octokit instance with the token and throttling + pagination
    const octokit = createThrottledOctokit(pat);

    // Initialize variables
    let userLogin = login;
    let userData: null | User = null;

    // If no login provided, get authenticated user info
    if (!userLogin) {
      // Use GraphQL to get authenticated user (viewer)
      const userResponse =
        await octokit.graphql<CurrentUserResponse>(GET_CURRENT_USER);
      userLogin = userResponse.viewer.login;

      // Transform to User object
      userData = {
        avatarUrl: userResponse.viewer.avatarUrl,
        id: userResponse.viewer.id,
        login: userResponse.viewer.login,
        name: userResponse.viewer.name || userResponse.viewer.login,
        url: `https://github.com/${userResponse.viewer.login}`,
      };
    }

    // Fetch repositories using the enhanced octokit instance with pagination
    // Note: We need to use type assertion here since TypeScript doesn't fully
    // understand the plugin's modifications to the Octokit type
    const ocktokitWithPagination = octokit as unknown as {
      graphql: {
        paginate: <T>(query: string, variables: object) => Promise<T>;
      };
    };

    // Fetch all repositories with pagination
    const result = await ocktokitWithPagination.graphql.paginate<{
      user: RepositoriesResponse["user"];
    }>(GET_REPOS, { login: userLogin });

    // Extract user data from result
    const { user } = result;

    // If userData wasn't set (when login was provided), set it now
    if (!userData) {
      userData = {
        avatarUrl: user.avatarUrl,
        id: user.id,
        login: user.login,
        name: user.name || user.login,
        url: `https://github.com/${user.login}`,
      };
    }

    // Return all data
    return {
      error: null,
      repos: user.repositories.nodes,
      user: userData,
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return { error: error as Error, repos: null, user: null };
  }
}
