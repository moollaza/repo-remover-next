import { graphql, http, HttpResponse } from "msw";

import {
  getValidPersonalAccessToken,
  MOCK_ORGANIZATIONS,
  MOCK_REPOS,
  MOCK_USER,
} from "@/mocks/static-fixtures";

const github = graphql.link("https://api.github.com/graphql");

export const handlers = [
  // --- GraphQL handlers (operation-name matched) ---

  github.query("getCurrentUser", () => {
    return HttpResponse.json({
      data: { viewer: MOCK_USER },
    });
  }),

  github.query("getRepositories", () => {
    return HttpResponse.json({
      data: {
        user: {
          ...MOCK_USER,
          repositories: {
            nodes: MOCK_REPOS,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    });
  }),

  github.query("getOrganizations", () => {
    return HttpResponse.json({
      data: {
        user: {
          organizations: {
            nodes: MOCK_ORGANIZATIONS,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
        },
      },
    });
  }),

  github.query("getOrgRepositories", () => {
    const orgRepos = MOCK_REPOS.filter((repo) => repo.isInOrganization);
    return HttpResponse.json({
      data: {
        organization: {
          login: "testorg",
          repositories: {
            nodes: orgRepos,
            pageInfo: { endCursor: null, hasNextPage: false },
          },
          url: "https://github.com/testorg",
        },
      },
    });
  }),

  // --- REST handlers (unchanged pattern) ---

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

  http.get("https://api.github.com/user", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.includes(getValidPersonalAccessToken())) {
      return HttpResponse.json({ message: "Bad credentials" }, { status: 401 });
    }
    return HttpResponse.json(MOCK_USER);
  }),

  http.get("https://api.github.com/users/:username", ({ params }) => {
    const { username } = params;
    if (username === "testuser") {
      return HttpResponse.json(MOCK_USER);
    }
    return HttpResponse.json({ message: "Not Found" }, { status: 404 });
  }),
];
