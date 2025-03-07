import { Repository, User } from "@octokit/graphql-schema";

import { createThrottledOctokit } from "./github-utils";

// GraphQL query to get repositories
export const GET_REPOS = `
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
          isPrivate
          isArchived
          isFork
          isTemplate
          isDisabled
          isMirror
          isEmpty
          isLocked
          isInOrganization
          owner {
            id
            login
            url
          }
          updatedAt
          url
          viewerCanAdminister
        }
      }
    }
  }
`;

// GraphQL query to get current user
export const GET_CURRENT_USER = `
  query GetCurrentUser {
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

/**
 * Fetches GitHub data for a user, including repositories.
 *
 * @param {[string, string]} params - Array containing GitHub username and personal access token
 * @returns {Promise<{ repos: Repository[], user: User }>} Object containing repositories and user data
 * @throws {Error} If PAT is missing, or if API requests fail
 */
export async function fetchGitHubData(params: [string, string]) {
  const [login, pat] = params;

  if (!pat) {
    throw new Error("PAT is required");
  }

  // Create Octokit instance with the token and throttling
  const octokit = createThrottledOctokit(pat);

  // First, we need to get the authenticated user's login if it's not provided
  let userLogin = login;
  let userData;

  if (!userLogin) {
    // Get the authenticated user's login using REST API
    const userResponse = await octokit.rest.users.getAuthenticated();
    userLogin = userResponse.data.login;
    userData = userResponse.data;
  } else {
    // If login is provided, fetch that user's data
    const userResponse = await octokit.rest.users.getByUsername({
      username: userLogin,
    });
    userData = userResponse.data;
  }

  // Now fetch repositories for the user
  // Use REST API for repositories as it's more reliable
  const reposResponse = await octokit.rest.repos.listForAuthenticatedUser({
    per_page: 100,
  });

  // Convert the REST API response to Repository objects
  const repos = reposResponse.data.map(
    (repo) =>
      ({
        description: repo.description,
        id: repo.id.toString(),
        isArchived: repo.archived,
        isDisabled: repo.disabled ?? false,
        isEmpty: repo.size === 0,
        isFork: repo.fork,
        isInOrganization: repo.owner?.type === "Organization",
        isLocked: false, // Default to false as we can't reliably determine this
        isMirror: Boolean(repo.mirror_url),
        isPrivate: repo.private,
        isTemplate: repo.is_template ?? false,
        name: repo.name,
        owner: {
          id: repo.owner.id.toString(),
          login: repo.owner.login,
          url: repo.owner.html_url,
        },
        updatedAt: repo.updated_at,
        url: repo.html_url,
        viewerCanAdminister: repo.permissions?.admin ?? true,
      }) as Repository,
  );

  // Create a User object
  const user = {
    avatarUrl: userData.avatar_url,
    id: userData.id.toString(),
    login: userData.login,
    name: userData.name ?? userData.login,
    url: userData.html_url,
  } as User;

  return { repos, user };
}
