import { http, HttpResponse } from "msw";

import { mockRepos, mockUser } from "@/mocks/fixtures";

export const handlers = [
  // Handle graphql requests
  http.post("https://api.github.com/graphql", () => {
    return HttpResponse.json({
      data: {
        user: {
          ...mockUser,
          repositories: {
            nodes: mockRepos,
            pageInfo: {
              endCursor: null,
              hasNextPage: false,
            },
          },
        },
      },
    });
  }),

  // Handle requests to the GitHub API
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json({
      ...mockUser,
    });
  }),
];
