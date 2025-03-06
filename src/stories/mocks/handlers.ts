import { Repository } from "@octokit/graphql-schema";
import { http, HttpResponse } from "msw";

// Mock repositories
const mockRepos: Repository[] = [
  {
    description: "First test repo",
    id: "repo1",
    isArchived: false,
    isDisabled: false,
    isEmpty: false,
    isFork: false,
    isInOrganization: false,
    isLocked: false,
    isMirror: false,
    isPrivate: true,
    isTemplate: false,
    name: "test-repo-1",
    owner: {
      __typename: "User",
      id: "user1",
      login: "testuser",
      url: "https://github.com/testuser",
    },
    parent: null,
    updatedAt: new Date().toISOString(),
    url: "https://github.com/testuser/test-repo-1",
    viewerCanAdminister: true,
  },
  {
    description: "Second test repo",
    id: "repo2",
    isArchived: false,
    isDisabled: false,
    isEmpty: false,
    isFork: false,
    isInOrganization: true,
    isLocked: false,
    isMirror: false,
    isPrivate: false,
    isTemplate: false,
    name: "test-repo-2",
    owner: {
      __typename: "User",
      id: "user1",
      login: "testuser",
      url: "https://github.com/testuser",
    },
    parent: null,
    updatedAt: new Date().toISOString(),
    url: "https://github.com/testuser/test-repo-2",
    viewerCanAdminister: true,
  },
] as Repository[];

// Mock user data
const mockUser = {
  avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
  login: "testuser",
  name: "Test User",
};

export const handlers = [
  // Handle GitHub REST API requests
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json(mockUser);
  }),

  // Handle GitHub GraphQL API requests
  http.post("https://api.github.com/graphql", async ({ request }) => {
    const body = await request.json();

    if (typeof body !== "object" || !body?.query) {
      return HttpResponse.json({ data: {} });
    }

    const query = body.query as string;

    // Handle repository query
    if (query.includes("repositories")) {
      return HttpResponse.json({
        data: {
          user: {
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            bioHTML: "<div>Test bio</div>",
            id: "user123",
            login: "testuser",
            name: "Test User",
            repositories: {
              nodes: mockRepos,
              pageInfo: {
                endCursor: "cursor",
                hasNextPage: false,
              },
              totalCount: mockRepos.length,
            },
          },
        },
      });
    }

    // Default response for other GraphQL queries
    return HttpResponse.json({
      data: {},
    });
  }),
];

// Export mock data for reuse in stories
export { mockRepos, mockUser };
