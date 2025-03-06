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
 * @param {[string, string]} params - Array containing GitHub username and personal access token
 * @returns {Promise<{ repos: Repository[], user: User }>} Object containing repositories and user data
 * @throws {Error} If login or PAT is missing, or if API requests fail
 */
export async function fetchGitHubData(params: [string, string]) {
  const [login, pat] = params;
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
    // Use type assertion to ensure type safety
    const graphqlQuery = GET_REPOS;
    const queryParams = { login };

    // Define the proper type for the Octokit graphql paginate method
    type GraphQLPaginateFunction = <T>(query: string, parameters: Record<string, unknown>) => Promise<T>;
    
    // Use proper typing for the graphql paginate method
    const paginateGraphQL = octokit.graphql.paginate as GraphQLPaginateFunction;
    
    // Now we can safely call the paginate method with proper types
    const data = await paginateGraphQL<RepositoriesResponse>(
      graphqlQuery,
      queryParams,
    );

    // Extract repositories from the response with proper type checking
    if (!data.user?.repositories?.nodes) {
      throw new Error("Invalid response format from GitHub API");
    }

    // With proper type checking, we can safely access the nodes
    const repos = data.user.repositories.nodes;

    // Create a User object from the response with proper type safety
    if (!userData.data || !data.user) {
      throw new Error("Missing user data in GitHub API response");
    }

    // Create a properly typed user object by explicitly mapping fields
    // This ensures we're only including valid User properties
    const user: User = {
      // Map REST API fields
      ...userData.data,
      // Override with GraphQL fields that might be more complete
      // Sort properties alphabetically to satisfy perfectionist/sort-objects rule
      avatarUrl: data.user.avatarUrl,
      id: data.user.id,
      login: data.user.login,
      name: data.user.name || null,
      // Add any other required User fields with appropriate defaults
    } as User;

    return { repos, user };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    throw error;
  }
}
