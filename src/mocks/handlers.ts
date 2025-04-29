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

  http.patch("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({ status: 200 });
  }),

  http.delete("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json({ status: 200 });
  }),

  // Handle requests to the GitHub API
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json({
      ...mockUser,
    });
  }),
];
