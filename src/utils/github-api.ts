import { GraphqlResponseError } from "@octokit/graphql";
import { type Repository } from "@octokit/graphql-schema";

import { debug } from "@/utils/debug";
import {
  createThrottledOctokit,
  type ThrottledOctokitType,
} from "@/utils/github-utils";

// --- Token scope checking ---

/**
 * Required OAuth scopes for full app functionality.
 * Only applies to classic PATs (ghp_). Fine-grained tokens use a different permission model.
 */
const REQUIRED_SCOPES = ["repo", "delete_repo", "read:org"] as const;

/**
 * Maps each required scope to the set of scopes that satisfy it.
 * Parent scopes implicitly include child scopes (e.g. admin:org includes read:org).
 */
const SCOPE_SATISFIED_BY: Record<string, string[]> = {
  delete_repo: ["delete_repo"],
  "read:org": ["read:org", "write:org", "admin:org"],
  repo: ["repo"],
};

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  delete_repo: "you won't be able to delete repositories",
  "read:org": "organization repositories won't be visible",
  repo: "private repositories won't be visible",
};

export interface ScopeCheckResult {
  grantedScopes: string[];
  missingScopes: string[];
}

/**
 * Checks what OAuth scopes the token has been granted by inspecting
 * the X-OAuth-Scopes response header from a lightweight REST call.
 * Returns empty arrays for fine-grained tokens (which don't use OAuth scopes).
 */
export async function checkTokenScopes(
  octokit: ThrottledOctokitType,
): Promise<ScopeCheckResult> {
  try {
    const response = await octokit.request("GET /rate_limit");
    const scopeHeader = response.headers["x-oauth-scopes"];

    // Header absent = fine-grained token (uses different permission model)
    if (scopeHeader == null) {
      return { grantedScopes: [], missingScopes: [] };
    }

    // Header present but empty = classic PAT with no scopes selected
    if (!scopeHeader.trim()) {
      return { grantedScopes: [], missingScopes: [...REQUIRED_SCOPES] };
    }

    const grantedScopes = scopeHeader
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const missingScopes = REQUIRED_SCOPES.filter((required) => {
      const satisfiedBy = SCOPE_SATISFIED_BY[required] ?? [required];
      return !satisfiedBy.some((scope) => grantedScopes.includes(scope));
    });

    return { grantedScopes, missingScopes };
  } catch {
    // If scope check fails, don't block — fall back to error-based detection
    debug.warn("Could not check token scopes");
    return { grantedScopes: [], missingScopes: [] };
  }
}

/**
 * Builds user-facing warning messages from a list of missing scopes.
 */
function buildScopeWarnings(missingScopes: string[]): string[] {
  return missingScopes
    .map((scope) => {
      const desc = SCOPE_DESCRIPTIONS[scope];
      return desc ? `Missing ${scope} scope — ${desc}.` : null;
    })
    .filter((w): w is string => w !== null);
}

/**
 * Combines all permission warnings from scope checks and error-based detection
 * into a single newline-separated string for display.
 */
function combineWarnings(
  scopeResult: ScopeCheckResult,
  permissionError: null | string,
  scopeLimitedOrgs: string[],
): string | undefined {
  const warnings: string[] = [];

  // Proactive scope warnings from REST header check
  warnings.push(...buildScopeWarnings(scopeResult.missingScopes));

  // Reactive org-related warnings (skip if scope check already flagged read:org)
  if (!scopeResult.missingScopes.includes("read:org")) {
    if (permissionError) {
      warnings.push(permissionError);
    } else if (scopeLimitedOrgs.length > 0) {
      warnings.push(
        `Token lacks required scopes to access repos in: ${scopeLimitedOrgs.join(", ")}.`,
      );
    }
  }

  return warnings.length > 0 ? warnings.join("\n\n") : undefined;
}

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
  permissionWarning?: string;
  repos: null | Repository[];
  samlProtectedOrgs?: string[];
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
          debug.warn(
            "Unexpected organization response structure:",
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        debug.error("Error fetching organizations:", error);
        // Re-throw so caller can surface as permissionWarning
        throw error;
      }
    }

    return orgs;
  }

  // Track SAML-protected and scope-limited orgs across all org fetches
  const samlProtectedOrgs: string[] = [];
  const scopeLimitedOrgs: string[] = [];

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
          debug.warn(
            `Unexpected response structure for org ${orgLogin}:`,
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        debug.error(`Error fetching repos for org ${orgLogin}:`, error);

        // Check if this is a SAML SSO enforcement error
        if (
          error instanceof Error &&
          error.message.includes(
            "Resource protected by organization SAML enforcement",
          )
        ) {
          debug.warn(`Skipping org ${orgLogin} due to SAML SSO enforcement`);
          samlProtectedOrgs.push(orgLogin);
        }
        // Check if this is a permission/scope error
        else if (
          error instanceof Error &&
          error.message.includes("required scopes")
        ) {
          debug.warn(
            `Skipping org ${orgLogin} due to insufficient permissions`,
          );
          scopeLimitedOrgs.push(orgLogin);
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

    // Fetch user repos AND check token scopes in parallel
    const [userRepoResult, scopeResult] = await Promise.all([
      fetchUserRepos(userLogin),
      checkTokenScopes(octokit),
    ]);
    userData = userRepoResult.userData;
    let allRepos: Repository[] = userRepoResult.repos ?? [];

    // Fetch orgs with permission error handling
    let orgs: { login: string; url: string }[] = [];
    let permissionError: null | string = null;

    try {
      orgs = await fetchAllOrganizations(userLogin);
    } catch (error) {
      if (error instanceof Error) {
        permissionError =
          "Your token may lack the read:org scope needed to fetch organization repositories. " +
          "Update your token at https://github.com/settings/tokens";
        debug.warn("Organization access limited:", error.message);
      } else {
        throw error; // Re-throw unexpected errors
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

    const permissionWarning = combineWarnings(
      scopeResult,
      permissionError,
      scopeLimitedOrgs,
    );

    return {
      error: userRepoResult.error,
      repos: allRepos,
      user: userData,
      ...(permissionWarning && { permissionWarning }),
      ...(samlProtectedOrgs.length > 0 && { samlProtectedOrgs }),
    };
  } catch (error) {
    debug.error("Error fetching GitHub data:", error);
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
          debug.warn(
            "Unexpected organization response structure:",
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        debug.error("Error fetching organizations:", error);
        // Re-throw so caller can surface as permissionWarning
        throw error;
      }
    }

    return orgs;
  }

  // Track SAML-protected and scope-limited orgs across all org fetches
  const samlProtectedOrgs: string[] = [];
  const scopeLimitedOrgs: string[] = [];

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
          debug.warn(
            `Unexpected response structure for org ${orgLogin}:`,
            rawResponse,
          );
          hasNextPage = false;
        }
      } catch (error) {
        debug.error(`Error fetching repos for org ${orgLogin}:`, error);

        // Check if this is a SAML SSO enforcement error
        if (
          error instanceof Error &&
          error.message.includes(
            "Resource protected by organization SAML enforcement",
          )
        ) {
          debug.warn(`Skipping org ${orgLogin} due to SAML SSO enforcement`);
          samlProtectedOrgs.push(orgLogin);
        }
        // Check if this is a permission/scope error
        else if (
          error instanceof Error &&
          error.message.includes("required scopes")
        ) {
          debug.warn(
            `Skipping org ${orgLogin} due to insufficient permissions`,
          );
          scopeLimitedOrgs.push(orgLogin);
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

    // 1. Fetch personal repos AND check token scopes in parallel
    const [userRepoResult, scopeResult] = await Promise.all([
      fetchUserRepos(userLogin),
      checkTokenScopes(octokit),
    ]);
    userData = userRepoResult.userData;
    let allRepos: Repository[] = userRepoResult.repos ?? [];

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
    let permissionError: null | string = null;

    try {
      orgs = await fetchAllOrganizations(userLogin);
    } catch (error) {
      if (error instanceof Error) {
        permissionError =
          "Your token may lack the read:org scope needed to fetch organization repositories. " +
          "Update your token at https://github.com/settings/tokens";
        debug.warn("Organization access limited:", error.message);
      } else {
        throw error;
      }
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

    const permissionWarning = combineWarnings(
      scopeResult,
      permissionError,
      scopeLimitedOrgs,
    );

    return {
      error: userRepoResult.error,
      repos: allRepos,
      user: userData,
      ...(permissionWarning && { permissionWarning }),
      ...(samlProtectedOrgs.length > 0 && { samlProtectedOrgs }),
    };
  } catch (error) {
    debug.error("Error fetching GitHub data:", error);
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
    debug.error("Error fetching GitHub repositories:", error);

    if (error instanceof GraphqlResponseError) {
      debug.log("GraphQL error:", error.message);
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
