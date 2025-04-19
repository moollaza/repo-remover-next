import { GraphqlResponseError } from "@octokit/graphql";
import { Repository } from "@octokit/graphql-schema";

import {
  createThrottledOctokit,
  type ThrottledOctokitType,
} from "@/utils/github-utils";

// GraphQL queries remain the same
export const GET_REPOS = `
  query getRepositories($login: String!, $cursor: String) {
    user(login: $login) {
      id
      login
      name
      avatarUrl
      bioHTML
      repositories(first: 100, after: $cursor) {
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
          viewerCanAdminister
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

// Types remain the same
export interface CurrentUserResponse {
  viewer: {
    avatarUrl: string;
    bioHTML: string;
    id: string;
    login: string;
    name: string;
  };
}

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

interface FetchResult {
  error: Error | null;
  repos: null | Repository[];
  user: null | User;
}

/**
 * Fetches GitHub data for the specified user using GraphQL with pagination
 * @param params A tuple of [login, pat] where login is the GitHub username and pat is the personal access token
 * @returns An object containing the repositories and user data
 */
export async function fetchGitHubData(
  params: [string, string],
): Promise<FetchResult> {
  const [login, pat] = params;

  if (!pat) {
    throw new Error("PAT is required");
  }

  const octokit = createThrottledOctokit(pat);

  // If login is provided, use it directly
  if (login) {
    // Fetch repositories with the provided login
    const repoResult = await fetchRepositories(octokit, login);

    return {
      error: repoResult.error,
      repos: repoResult.repos,
      user: repoResult.userData,
    };
  }
  // Otherwise, get current user's login first
  else {
    try {
      const userResponse =
        await octokit.graphql<CurrentUserResponse>(GET_CURRENT_USER);
      const userLogin = userResponse.viewer.login;

      // Now fetch repositories with the obtained login
      const repoResult = await fetchRepositories(octokit, userLogin);

      return {
        error: repoResult.error,
        repos: repoResult.repos,
        user: repoResult.userData,
      };
    } catch (error) {
      console.error("Error fetching GitHub user data:", error);

      return {
        error:
          error instanceof Error
            ? error
            : new Error("Unknown error fetching user data"),
        repos: null,
        user: null,
      };
    }
  }
}

/**
 * Fetches repository data from GitHub
 */
async function fetchRepositories(
  octokit: ThrottledOctokitType,
  userLogin: string,
): Promise<{
  error: Error | null;
  repos: null | Repository[];
  userData: null | User; // Keep user data since it comes with the repo query
}> {
  try {
    const result = await octokit.graphql.paginate<{
      user: RepositoriesResponse["user"];
    }>(GET_REPOS, { login: userLogin });

    const { user } = result;

    const userData: User = {
      avatarUrl: user.avatarUrl,
      id: user.id,
      login: user.login,
      name: user.name || user.login,
      url: `https://github.com/${user.login}`,
    };

    return {
      error: null,
      repos: user.repositories.nodes,
      userData,
    };
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);

    if (error instanceof GraphqlResponseError) {
      console.log("GraphQL error:", error.message);
      // Check if we have partial data from the error
      const partialRepos =
        (error.data as { user?: { repositories?: { nodes?: Repository[] } } })
          ?.user?.repositories?.nodes ?? null;

      // If we have partial user data from the error, extract it
      let userData = null;
      type PartialUserData = { name?: string } & Pick<
        User,
        "avatarUrl" | "id" | "login"
      >;
      interface ErrorData {
        user?: PartialUserData;
      }

      if ((error.data as ErrorData)?.user) {
        const user = (error.data as { user: PartialUserData }).user;
        userData = {
          avatarUrl: user.avatarUrl,
          id: user.id,
          login: user.login,
          name: user.name ?? user.login,
          url: `https://github.com/${user.login}`,
        };
      }

      return {
        error: error,
        repos: partialRepos,
        userData,
      };
    }

    return {
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error fetching repositories"),
      repos: null,
      userData: null,
    };
  }
}
