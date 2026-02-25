/**
 * Reusable MSW handler sets for Storybook stories
 *
 * These handler sets provide common scenarios for testing components:
 * - authenticatedHandlers: Logged in user with repositories
 * - loadingHandlers: Simulates loading/slow responses
 * - errorHandlers: API errors (401, 403, 500)
 * - emptyHandlers: Valid authentication but no repositories
 * - largeDatasetHandlers: Many repositories for pagination testing
 *
 * Usage in stories:
 * ```typescript
 * export const MyStory: Story = {
 *   parameters: {
 *     msw: { handlers: authenticatedHandlers }
 *   }
 * };
 * ```
 */

import { delay, http, HttpResponse } from "msw";

import {
  createMockRepo,
  manyMockRepos,
  MOCK_ORGANIZATIONS,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";

/**
 * Authenticated user handlers
 *
 * Provides successful responses for all GitHub API endpoints with mock data.
 * Use this for stories showing the default/happy path.
 */
export const authenticatedHandlers = [
  // GraphQL: Current user info
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const body = await request.json() as { query: string; variables?: unknown };

    if (body.query.includes("getCurrentUser")) {
      return HttpResponse.json({
        data: {
          viewer: MOCK_USER,
        },
      });
    }

    if (body.query.includes("getRepositories")) {
      return HttpResponse.json({
        data: {
          user: {
            ...MOCK_USER,
            repositories: {
              nodes: MOCK_REPOS,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrganizations")) {
      return HttpResponse.json({
        data: {
          user: {
            organizations: {
              nodes: MOCK_ORGANIZATIONS,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrgRepositories")) {
      const orgRepos = MOCK_REPOS.filter(repo => repo.isInOrganization);
      return HttpResponse.json({
        data: {
          organization: {
            login: "testorg",
            repositories: {
              nodes: orgRepos,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
            url: "https://github.com/testorg",
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),

  // REST: Get current user
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(MOCK_USER);
  }),

  // REST: Repository operations
  http.patch("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({
      archived: true,
      message: "Repository archived successfully"
    });
  }),

  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({
      message: "Repository deleted successfully"
    });
  }),
];

/**
 * Loading state handlers
 *
 * Simulates slow network responses for loading states.
 * Use this for stories showing loading spinners or skeleton screens.
 */
export const loadingHandlers = [
  http.post("https://api.github.com/graphql", async () => {
    await delay("infinite"); // Never resolves - keeps loading
  }),

  http.get("https://api.github.com/user", async () => {
    await delay("infinite");
  }),
];

/**
 * Error state handlers
 *
 * Simulates various API errors (401 Unauthorized, 403 Forbidden, 500 Server Error).
 * Use this for stories showing error messages and error recovery UI.
 */
export const errorHandlers = [
  // GraphQL errors
  http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json(
      {
        documentation_url: "https://docs.github.com/rest",
        message: "Bad credentials",
      },
      { status: 401 }
    );
  }),

  // REST errors
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(
      {
        documentation_url: "https://docs.github.com/rest",
        message: "Bad credentials",
      },
      { status: 401 }
    );
  }),

  // Repository operation errors
  http.patch("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json(
      { message: "Not Found" },
      { status: 404 }
    );
  }),

  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json(
      { message: "Forbidden" },
      { status: 403 }
    );
  }),
];

/**
 * Empty data handlers
 *
 * Provides successful authentication but no repositories or organizations.
 * Use this for stories showing empty states and onboarding flows.
 */
export const emptyHandlers = [
  // GraphQL: Authenticated user with no repos
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const body = await request.json() as { query: string; variables?: unknown };

    if (body.query.includes("getCurrentUser")) {
      return HttpResponse.json({
        data: {
          viewer: MOCK_USER,
        },
      });
    }

    if (body.query.includes("getRepositories")) {
      return HttpResponse.json({
        data: {
          user: {
            ...MOCK_USER,
            repositories: {
              nodes: [],
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrganizations")) {
      return HttpResponse.json({
        data: {
          user: {
            organizations: {
              nodes: [],
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),

  // REST: Get current user (still authenticated)
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(MOCK_USER);
  }),
];

/**
 * Large dataset handlers
 *
 * Provides many repositories for testing pagination, filtering, and performance.
 * Use this for stories demonstrating behavior with large amounts of data.
 */
export const largeDatasetHandlers = [
  // GraphQL: User with many repos
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const body = await request.json() as { query: string; variables?: unknown };

    if (body.query.includes("getCurrentUser")) {
      return HttpResponse.json({
        data: {
          viewer: MOCK_USER,
        },
      });
    }

    if (body.query.includes("getRepositories")) {
      // Generate many repos for pagination testing
      const manyRepos = Array.from({ length: 50 }, (_, i) =>
        createMockRepo({
          description: `Test repository ${i} for pagination`,
          id: `repo-${i}`,
          name: `repository-${i}`,
        })
      );

      return HttpResponse.json({
        data: {
          user: {
            ...MOCK_USER,
            repositories: {
              nodes: manyRepos,
              pageInfo: {
                endCursor: "cursor-50",
                hasNextPage: true,
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrganizations")) {
      return HttpResponse.json({
        data: {
          user: {
            organizations: {
              nodes: MOCK_ORGANIZATIONS,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrgRepositories")) {
      const orgRepos = manyMockRepos.filter(repo => repo.isInOrganization);
      return HttpResponse.json({
        data: {
          organization: {
            login: "testorg",
            repositories: {
              nodes: orgRepos,
              pageInfo: {
                endCursor: "org-cursor-50",
                hasNextPage: true,
              },
            },
            url: "https://github.com/testorg",
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),

  // REST: Get current user
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(MOCK_USER);
  }),
];

/**
 * Invalid token handlers
 *
 * Simulates authentication failure due to invalid or expired token.
 * Use this for stories showing token validation errors.
 */
export const invalidTokenHandlers = [
  http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json(
      {
        documentation_url: "https://docs.github.com/rest",
        message: "Bad credentials",
      },
      { status: 401 }
    );
  }),

  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(
      {
        documentation_url: "https://docs.github.com/rest",
        message: "Bad credentials",
        status: 401,
      },
      { status: 401 }
    );
  }),
];

/**
 * Valid token handlers
 *
 * Simulates successful token validation.
 * Use this for stories showing successful authentication flow.
 */
export const validTokenHandlers = [
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json({
      avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
      id: 1,
      login: "testuser",
      name: "Test User",
    });
  }),
];

/**
 * Partial data handlers
 *
 * Simulates scenarios where some organizations fail (e.g., SSO-protected).
 * Use this for stories showing partial data loading with warnings.
 */
export const partialDataHandlers = [
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const body = await request.json() as { query: string; variables?: unknown };

    if (body.query.includes("getCurrentUser")) {
      return HttpResponse.json({
        data: {
          viewer: MOCK_USER,
        },
      });
    }

    if (body.query.includes("getRepositories")) {
      return HttpResponse.json({
        data: {
          user: {
            ...MOCK_USER,
            repositories: {
              nodes: MOCK_REPOS.slice(0, 5),
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    if (body.query.includes("getOrganizations")) {
      return HttpResponse.json({
        data: {
          user: {
            organizations: {
              nodes: MOCK_ORGANIZATIONS,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
          },
        },
      });
    }

    // First org succeeds, second fails (SSO protected)
    if (body.query.includes("getOrgRepositories")) {
      const variables = (body as { variables?: { login?: string } }).variables;
      if (variables?.login === "anotherorg") {
        return HttpResponse.json(
          {
            message: "Resource protected by organization SAML enforcement",
          },
          { status: 403 }
        );
      }

      const orgRepos = MOCK_REPOS.filter(repo => repo.isInOrganization);
      return HttpResponse.json({
        data: {
          organization: {
            login: "testorg",
            repositories: {
              nodes: orgRepos,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
            url: "https://github.com/testorg",
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),

  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(MOCK_USER);
  }),
];
