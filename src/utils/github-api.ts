import { Repository, User } from "@octokit/graphql-schema";
import { Octokit } from "@octokit/rest";

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

// Response type for the GraphQL query
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
 * Fetches GitHub user data and repositories using the GitHub API.
 * Uses both REST API for user data and GraphQL for repositories to optimize performance.
 *
 * @param {[string, string]} [login, pat] - Array containing GitHub username and personal access token
 * @returns {Promise<{ repos: Repository[], user: User }>} Object containing repositories and user data
 * @throws {Error} If login or PAT is missing, or if API requests fail
 */
export async function fetchGitHubData([login, pat]: [string, string]) {
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
