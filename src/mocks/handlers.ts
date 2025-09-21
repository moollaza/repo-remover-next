import { http, HttpResponse } from "msw";

import { MOCK_REPOS, MOCK_USER, MOCK_ORGANIZATIONS, getValidPersonalAccessToken } from "@/mocks/static-fixtures";

export const handlers = [
  // Handle GraphQL requests - User repositories
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    
    // Check for valid token
    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json(
        { message: "Bad credentials" },
        { status: 401 }
      );
    }

    const body = await request.json() as { query: string; variables?: any };
    
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
      // Return org repos for testorg
      const orgRepos = MOCK_REPOS.filter(repo => repo.isInOrganization);
      return HttpResponse.json({
        data: {
          organization: {
            login: "testorg",
            url: "https://github.com/testorg",
            repositories: {
              nodes: orgRepos,
              pageInfo: {
                endCursor: null,
                hasNextPage: false,
              },
            },
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
      message: "Repository archived successfully",
      archived: true 
    });
  }),

  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({ 
      message: "Repository deleted successfully" 
    });
  }),

  // Handle user authentication
  http.get("https://api.github.com/user", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json(
        { message: "Bad credentials" },
        { status: 401 }
      );
    }

    return HttpResponse.json(MOCK_USER);
  }),

  // Handle user by username
  http.get("https://api.github.com/users/:username", ({ params }) => {
    const { username } = params;
    
    if (username === "testuser") {
      return HttpResponse.json(MOCK_USER);
    }
    
    return HttpResponse.json(
      { message: "Not Found" },
      { status: 404 }
    );
  }),
];
