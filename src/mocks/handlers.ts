import { http, HttpResponse } from "msw";

import {
  getValidPersonalAccessToken,
  MOCK_ORGANIZATIONS,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";

// --- Error scenario handler factories ---
// Use these with server.use() in individual tests to override default handlers.

/** Returns a GraphQL handler that responds with a 403 insufficient scopes error */
export function graphqlForbiddenHandler(
  message = "Your token has not been granted the required scopes to execute this query.",
) {
  return http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json(
      {
        data: null,
        errors: [{ message, type: "INSUFFICIENT_SCOPES" }],
      },
      { status: 200 },
    );
  });
}

/** Returns a GraphQL handler that simulates a network failure */
export function graphqlNetworkErrorHandler() {
  return http.post("https://api.github.com/graphql", () => {
    return HttpResponse.error();
  });
}

/** Returns a GraphQL handler that responds with a 429 rate limit error */
export function graphqlRateLimitHandler(retryAfter = "60") {
  return http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json(
      { message: "API rate limit exceeded" },
      {
        headers: { "Retry-After": retryAfter },
        status: 429,
      },
    );
  });
}

/** Returns a GraphQL handler that responds with a 500 server error */
export function graphqlServerErrorHandler() {
  return http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  });
}

/** Returns a GraphQL handler that responds with a 401 Bad credentials error */
export function graphqlUnauthorizedHandler() {
  return http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
  });
}

/** Returns a REST handler that responds with a 403 for repo operations */
export function restForbiddenHandler() {
  return [
    http.patch("https://api.github.com/repos/:owner/:repo", () => {
      return HttpResponse.json(
        { message: "Must have admin rights to Repository." },
        { status: 403 },
      );
    }),
    http.delete("https://api.github.com/repos/:owner/:repo", () => {
      return HttpResponse.json(
        { message: "Must have admin rights to Repository." },
        { status: 403 },
      );
    }),
  ];
}

/** Returns REST handlers that simulate a 500 server error for repo operations */
export function restServerErrorHandler() {
  return [
    http.patch("https://api.github.com/repos/:owner/:repo", () => {
      return HttpResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }),
    http.delete("https://api.github.com/repos/:owner/:repo", () => {
      return HttpResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }),
  ];
}

/** Returns a REST handler that responds with a 401 for repo operations (PATCH/DELETE) */
export function restUnauthorizedHandler() {
  return [
    http.patch("https://api.github.com/repos/:owner/:repo", () => {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }),
    http.delete("https://api.github.com/repos/:owner/:repo", () => {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }),
  ];
}

export const handlers = [
  // Handle GraphQL requests - User repositories
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check for valid token
    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }

    const body = (await request.json()) as {
      query: string;
      variables?: unknown;
    };

    // Handle different GraphQL queries
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
      const variables = body.variables as { org?: string } | undefined;
      const orgLogin = variables?.org ?? "testorg";
      const matchingOrg = MOCK_ORGANIZATIONS.find((o) => o.login === orgLogin);

      if (!matchingOrg) {
        return HttpResponse.json(
          {
            data: null,
            errors: [
              {
                message: `Could not resolve to an Organization with the login of '${orgLogin}'.`,
                type: "NOT_FOUND",
              },
            ],
          },
          { status: 200 },
        );
      }

      const orgRepos = MOCK_REPOS.filter(
        (repo) => repo.owner.login === orgLogin,
      );
      return HttpResponse.json({
        data: {
          organization: {
            login: matchingOrg.login,
            repositories: {
              nodes: orgRepos,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
            url: matchingOrg.url,
          },
        },
      });
    }

    // Default response
    return HttpResponse.json({
      data: {},
    });
  }),

  // Handle REST API repository operations
  http.patch("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({
      archived: true,
      message: "Repository archived successfully",
    });
  }),

  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({
      message: "Repository deleted successfully",
    });
  }),

  // Handle rate limit check (used for scope detection)
  http.get("https://api.github.com/rate_limit", ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }

    return HttpResponse.json(
      {
        rate: {
          limit: 5000,
          remaining: 4999,
          reset: Math.floor(Date.now() / 1000) + 3600,
          used: 1,
        },
        resources: {},
      },
      {
        headers: { "X-OAuth-Scopes": "repo, delete_repo, read:org" },
      },
    );
  }),

  // Handle user authentication
  http.get("https://api.github.com/user", ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }

    return HttpResponse.json(MOCK_USER);
  }),
];
