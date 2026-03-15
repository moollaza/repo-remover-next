import { GraphqlResponseError } from "@octokit/graphql";
import { type Repository } from "@octokit/graphql-schema";

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
      url
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

export const GET_ORGS = `
  query getOrganizations($login: String!, $cursor: String) {
    user(login: $login) {
      organizations(first: 100, after: $cursor) {
        nodes {
          login
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

export const GET_ORG_REPOS = `
  query getOrgRepositories($org: String!, $cursor: String) {
    organization(login: $org) {
      login
      url
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
          viewerPermission
          owner {
            id
            login
            url
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

// Types for GraphQL responses
export interface CurrentUserResponse {
  viewer: {
    avatarUrl: string;
    bioHTML: string;
    id: string;
    login: string;
    name: string;
  };
}

export interface LoadingProgress {
  currentOrg?: string;
  orgsLoaded: number;
  orgsTotal: number;
  repos: Repository[];
  stage: "complete" | "orgs" | "personal";
  user: null | User;
}

export interface OrganizationsResponse {
  user: {
    organizations: {
      nodes: { login: string; url: string }[];
      pageInfo: {
        endCursor: null | string;
        hasNextPage: boolean;
      };
    };
  };
}

export interface OrgRepositoriesResponse {
  organization: {
    login: string;
    repositories: {
      nodes: Repository[];
      pageInfo: {
        endCursor: null | string;
        hasNextPage: boolean;
      };
    };
    url: string;
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

export interface UserRepositoriesResponse {
  user: RepositoriesResponse["user"];
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

  // Helper to fetch all orgs for a user (paginated)
  async function fetchAllOrganizations(
    userLogin: string,
  ): Promise<{ login: string; url: string }[]> {
    let orgs: { login: string; url: string }[] = [];
    let cursor: null | string = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // Execute the GraphQL query with explicit type annotation
        // We have to use type assertions here because the GraphQL client isn't properly typed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResponse: any = await octokit.graphql(GET_ORGS, {
          cursor,
          login: userLogin,
        });

        // Safe access to typed properties
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (rawResponse?.user?.organizations?.nodes) {
          // Use type assertion after validating structure
          const typedResponse = rawResponse as OrganizationsResponse;
          const nodes = typedResponse.user.organizations.nodes;
          orgs = orgs.concat(nodes);

          // Extract pagination info
          const pageInfo = typedResponse.user.organizations.pageInfo;
          hasNextPage = pageInfo.hasNextPage;
          cursor = pageInfo.endCursor;
        } else {
          // Response doesn't match expected structure
          console.warn(
            "Unexpected organization response structure:",
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);

        // Check if this is a permission/scope error
        if (
          error instanceof Error &&
          error.message.includes("required scopes")
        ) {
          // This is a scope permission error - we should surface this to the UI
          throw new Error(
            "Missing GitHub token permissions: Your token needs 'read:org' scope to fetch organization data. " +
              "You can update your token permissions at: https://github.com/settings/tokens",
          );
        }

        // For other errors, break the loop but return what we have so far
        hasNextPage = false;
      }
    }

    return orgs;
  }

  // Helper to fetch all repos for an org (paginated)
  async function fetchAllOrgRepos(orgLogin: string): Promise<Repository[]> {
    let repos: Repository[] = [];
    let cursor: null | string = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // Execute the GraphQL query with explicit type annotation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResponse: any = await octokit.graphql(GET_ORG_REPOS, {
          cursor,
          org: orgLogin,
        });

        // Safe access to typed properties
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (rawResponse?.organization?.repositories?.nodes) {
          // Use type assertion after validating structure
          const typedResponse = rawResponse as OrgRepositoriesResponse;
          const nodes = typedResponse.organization.repositories.nodes;
          repos = repos.concat(nodes);

          // Extract pagination info
          const pageInfo = typedResponse.organization.repositories.pageInfo;
          hasNextPage = pageInfo.hasNextPage;
          cursor = pageInfo.endCursor;
        } else {
          // Response doesn't match expected structure
          console.warn(
            `Unexpected response structure for org ${orgLogin}:`,
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        console.error(`Error fetching repos for org ${orgLogin}:`, error);

        // Check if this is a permission/scope error
        if (
          error instanceof Error &&
          error.message.includes("required scopes")
        ) {
          console.warn(
            `Skipping org ${orgLogin} due to insufficient permissions`,
          );
        }

        // For any error, break the loop but return what we have so far
        hasNextPage = false;
      }
    }

    return repos;
  }

  // Helper to fetch user repos (existing logic)
  async function fetchUserRepos(userLogin: string) {
    return fetchRepositories(octokit, userLogin);
  }

  // If login is provided, use it directly
  let userLogin = login;
  let userData: null | User = null;
  try {
    if (!userLogin) {
      const userResponse =
        await octokit.graphql<CurrentUserResponse>(GET_CURRENT_USER);
      userLogin = userResponse.viewer.login;
    }

    // Fetch user repos first
    const userRepoResult = await fetchUserRepos(userLogin);
    userData = userRepoResult.userData;
    let allRepos: Repository[] = userRepoResult.repos ?? [];

    // Fetch orgs with permission error handling
    let orgs: { login: string; url: string }[] = [];
    let permissionError: null | string = null;

    try {
      orgs = await fetchAllOrganizations(userLogin);
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg.includes("Missing GitHub token permissions") ||
          msg.includes("SAML enforcement") ||
          msg.includes("required scopes") ||
          msg.includes("Resource protected")
        ) {
          permissionError =
            "Some organizations require additional token permissions or SSO authorization. " +
            "You can authorize your token for specific organizations at https://github.com/settings/tokens";
          console.warn("Organization access limited:", msg);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Fetch all org repos in parallel (only if we have orgs)
    if (orgs.length > 0) {
      const orgReposArrays = await Promise.all(
        orgs.map((org) => fetchAllOrgRepos(org.login)),
      );
      for (const orgRepos of orgReposArrays) {
        allRepos = allRepos.concat(orgRepos);
      }
    }

    return {
      error: userRepoResult.error,
      repos: allRepos,
      user: userData,
      ...(permissionError && { permissionWarning: permissionError }),
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return {
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error fetching data"),
      repos: null,
      user: null,
    };
  }
}

/**
 * Fetches GitHub data with progressive loading callbacks
 * @param params A tuple of [login, pat] where login is the GitHub username and pat is the personal access token
 * @param onProgress Callback function called with loading progress updates
 * @returns An object containing the repositories and user data
 */
export async function fetchGitHubDataWithProgress(
  params: [string, string],
  onProgress: (progress: LoadingProgress) => void,
): Promise<FetchResult> {
  const [login, pat] = params;

  if (!pat) {
    throw new Error("PAT is required");
  }

  const octokit = createThrottledOctokit(pat);

  // Helper to fetch all orgs for a user (paginated)
  async function fetchAllOrganizations(
    userLogin: string,
  ): Promise<{ login: string; url: string }[]> {
    let orgs: { login: string; url: string }[] = [];
    let cursor: null | string = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResponse: any = await octokit.graphql(GET_ORGS, {
          cursor,
          login: userLogin,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (rawResponse?.user?.organizations?.nodes) {
          const typedResponse = rawResponse as OrganizationsResponse;
          const nodes = typedResponse.user.organizations.nodes;
          orgs = orgs.concat(nodes);

          const pageInfo = typedResponse.user.organizations.pageInfo;
          hasNextPage = pageInfo.hasNextPage;
          cursor = pageInfo.endCursor;
        } else {
          console.warn(
            "Unexpected organization response structure:",
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);

        // Re-throw all errors — let the outer handler categorize and surface them
        if (error instanceof Error) {
          throw error;
        }

        hasNextPage = false;
      }
    }

    return orgs;
  }

  // Helper to fetch all repos for an org (paginated)
  async function fetchAllOrgRepos(orgLogin: string): Promise<Repository[]> {
    let repos: Repository[] = [];
    let cursor: null | string = null;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResponse: any = await octokit.graphql(GET_ORG_REPOS, {
          cursor,
          org: orgLogin,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (rawResponse?.organization?.repositories?.nodes) {
          const typedResponse = rawResponse as OrgRepositoriesResponse;
          const nodes = typedResponse.organization.repositories.nodes;
          repos = repos.concat(nodes);

          const pageInfo = typedResponse.organization.repositories.pageInfo;
          hasNextPage = pageInfo.hasNextPage;
          cursor = pageInfo.endCursor;
        } else {
          console.warn(
            `Unexpected response structure for org ${orgLogin}:`,
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        console.error(`Error fetching repos for org ${orgLogin}:`, error);

        if (
          error instanceof Error &&
          error.message.includes("required scopes")
        ) {
          console.warn(
            `Skipping org ${orgLogin} due to insufficient permissions`,
          );
        }

        hasNextPage = false;
      }
    }

    return repos;
  }

  // Helper to fetch user repos
  async function fetchUserRepos(userLogin: string) {
    return fetchRepositories(octokit, userLogin);
  }

  // Get user login
  let userLogin = login;
  let userData: null | User = null;

  try {
    if (!userLogin) {
      const userResponse =
        await octokit.graphql<CurrentUserResponse>(GET_CURRENT_USER);
      userLogin = userResponse.viewer.login;
    }

    // Collect permission warnings from all stages
    const warnings: string[] = [];

    // 1. Fetch personal repos FIRST
    const userRepoResult = await fetchUserRepos(userLogin);
    userData = userRepoResult.userData;
    let allRepos: Repository[] = userRepoResult.repos ?? [];

    // Check if repo fetch had SAML/permission errors (partial data returned)
    if (userRepoResult.error) {
      const msg = userRepoResult.error.message;
      if (
        msg.includes("SAML enforcement") ||
        msg.includes("Resource protected")
      ) {
        warnings.push(
          "Some repositories are protected by SAML SSO. " +
            "Authorize your token for those organizations in your GitHub token settings.",
        );
      }
    }

    // Report personal repos immediately
    onProgress({
      orgsLoaded: 0,
      orgsTotal: 0,
      repos: allRepos,
      stage: "personal",
      user: userData,
    });

    // 2. Fetch orgs list
    let orgs: { login: string; url: string }[] = [];

    try {
      orgs = await fetchAllOrganizations(userLogin);
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (
          msg.includes("required scopes") ||
          msg.includes("Missing GitHub token permissions")
        ) {
          warnings.push(
            "Your token needs the 'read:org' scope to load organization repositories. " +
              "Edit your token and add this scope.",
          );
        } else if (
          msg.includes("SAML enforcement") ||
          msg.includes("Resource protected")
        ) {
          warnings.push(
            "Organization data is protected by SAML SSO. " +
              "Authorize your token for those organizations in your GitHub token settings.",
          );
        } else {
          // Network errors, 500s, timeouts, etc. — still surface to user
          warnings.push(
            "Could not load organization repositories. This may be a temporary issue — try refreshing.",
          );
        }
        console.warn("Organization access limited:", msg);
      }
      // Don't re-throw — continue with personal repos
    }

    // 3. Fetch org repos in PARALLEL (keep current speed!)
    if (orgs.length > 0) {
      let completedOrgs = 0;

      const orgReposPromises = orgs.map(async (org) => {
        // Fetch this org's repos
        const orgRepos = await fetchAllOrgRepos(org.login);

        // Update counter
        completedOrgs++;

        // Append to allRepos immediately
        allRepos = allRepos.concat(orgRepos);

        // Report progress
        onProgress({
          currentOrg: org.login,
          orgsLoaded: completedOrgs,
          orgsTotal: orgs.length,
          repos: allRepos,
          stage: "orgs",
          user: userData,
        });

        return orgRepos;
      });

      // Wait for all orgs (but already reported progress)
      await Promise.all(orgReposPromises);
    }

    // Final update
    onProgress({
      orgsLoaded: orgs.length,
      orgsTotal: orgs.length,
      repos: allRepos,
      stage: "complete",
      user: userData,
    });

    // Build combined permission warning
    const permissionWarning =
      warnings.length > 0 ? warnings.join("\n\n") : undefined;

    return {
      error: userRepoResult.error,
      repos: allRepos,
      user: userData,
      ...(permissionWarning && { permissionWarning }),
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return {
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error fetching data"),
      repos: null,
      user: null,
    };
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
    // Avoid the unsafe call by proper typing
    const result = await paginateGraphQLQuery<UserRepositoriesResponse>(
      octokit,
      GET_REPOS,
      { login: userLogin },
    );

    const { user } = result;
    const userData: User = {
      avatarUrl: user.avatarUrl,
      id: user.id,
      login: user.login,
      name: user.name ?? user.login,
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
      const partialRepos =
        (error.data as { user?: { repositories?: { nodes?: Repository[] } } })
          ?.user?.repositories?.nodes ?? null;

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

// Type-safe wrapper for GraphQL pagination
async function paginateGraphQLQuery<T>(
  octokit: ThrottledOctokitType,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  // This is the boundary between untyped API and our typed code
  // We need to use a well-controlled type assertion at this boundary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const result = await octokit.graphql.paginate(query, variables);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result as T;
}
