import type { Meta, StoryObj } from "@storybook/react";

import { faker } from "@faker-js/faker";
import { Repository, User } from "@octokit/graphql-schema";
import { http, HttpResponse } from "msw";
import React from "react";

import Dashboard from "../components/dashboard";
import { GitHubDataProvider } from "../providers/github-data-provider";

// Helper function to create a mock repository
function createMockRepository(overrides: Partial<Repository> = {}): Repository {
  return {
    description: faker.lorem.sentence(),
    id: faker.string.uuid(),
    isArchived: faker.datatype.boolean(),
    isDisabled: faker.datatype.boolean(),
    isEmpty: faker.datatype.boolean(),
    isFork: faker.datatype.boolean(),
    isInOrganization: faker.datatype.boolean(),
    isLocked: faker.datatype.boolean(),
    isMirror: faker.datatype.boolean(),
    isPrivate: faker.datatype.boolean(),
    isTemplate: faker.datatype.boolean(),
    name: faker.lorem.slug(),
    owner: {
      __typename: "User",
      id: faker.string.uuid(),
      login: faker.internet.userName(),
      url: faker.internet.url(),
    },
    parent: null,
    updatedAt: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    viewerCanAdminister: true,
    ...overrides,
  } as Repository;
}

// Create a wrapper component that provides GitHub context with MSW
const DashboardStory = () => {
  // Setup localStorage for authentication
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pat",
        "ghp_validtoken123456789012345678901234567890",
      );
      localStorage.setItem("login", "testuser");
    }
  }, []);

  return (
    <GitHubDataProvider>
      <Dashboard />
    </GitHubDataProvider>
  );
};

// No longer needed as we're using GitHubDataProvider directly

// Using GitHubDataProvider with MSW for all stories
const meta: Meta<typeof DashboardStory> = {
  component: DashboardStory,
  title: "Components/Dashboard",
};

export default meta;
type Story = StoryObj<typeof DashboardStory>;

export const Loading: Story = {
  args: {
    isLoading: true,
    repos: [],
    user: {
      avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
      bioHTML: "<div>Test bio</div>",
      id: "user123",
      login: "testuser",
      name: "Test User",
    } as User,
  },
  parameters: {
    msw: {
      handlers: [
        // Handle GitHub REST API requests
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json({
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            login: "testuser",
            name: "Test User",
          });
        }),
      ],
    },
  },
};

export const WithRepos: Story = {
  args: {
    isLoading: false,
    repos: [
      createMockRepository({
        description: "First test repo",
        isInOrganization: false,
        isPrivate: true,
        name: "test-repo-1",
        viewerCanAdminister: true,
      }),
      createMockRepository({
        description: "Second test repo",
        isInOrganization: true,
        isPrivate: false,
        name: "test-repo-2",
        viewerCanAdminister: true,
      }),
    ],
    user: {
      avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
      bioHTML: "<div>Test bio</div>",
      id: "user123",
      login: "testuser",
      name: "Test User",
    } as User,
  },
  parameters: {
    msw: {
      handlers: [
        // Handle GitHub REST API requests
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json({
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            login: "testuser",
            name: "Test User",
          });
        }),
      ],
    },
  },
};

export const WithError: Story = {
  args: {
    isError: true,
    isLoading: false,
    repos: null,
    user: {
      avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
      bioHTML: "<div>Test bio</div>",
      id: "user123",
      login: "testuser",
      name: "Test User",
    } as User,
  },
  parameters: {
    msw: {
      handlers: [
        // Handle GitHub REST API requests
        http.get("https://api.github.com/user", () => {
          return HttpResponse.json({
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            login: "testuser",
            name: "Test User",
          });
        }),
      ],
    },
  },
};

// Define the DashboardWithMSW component
const DashboardWithMSW: React.FC = () => {
  return (
    <GitHubDataProvider>
      <Dashboard />
    </GitHubDataProvider>
  );
};

// Create a meta for the MSW approach - export it to avoid unused variable warning
export const mswMeta: Meta<typeof DashboardWithMSW> = {
  component: DashboardWithMSW,
  parameters: {
    // This is where we'd configure MSW to intercept API calls
    msw: {
      handlers: [
        // Mock the GitHub API responses
        http.get("https://api.github.com/users/:username", () => {
          return HttpResponse.json({
            avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
            bioHTML: "<div>Test bio</div>",
            id: "user123",
            login: "testuser",
            name: "Test User",
          });
        }),
        // Mock the GraphQL API for repository data
        http.post("https://api.github.com/graphql", async ({ request }) => {
          const body = (await request.json()) as { query?: string };
          // Check if this is a repositories query - safely check for string
          if (
            typeof body.query === "string" &&
            body.query.includes("repositories")
          ) {
            return HttpResponse.json({
              data: {
                user: {
                  avatarUrl:
                    "https://avatars.githubusercontent.com/u/12345?v=4",
                  bioHTML: "<div>Test bio</div>",
                  id: "user123",
                  login: "testuser",
                  name: "Test User",
                  repositories: {
                    nodes: [
                      createMockRepository({
                        description: "First test repo",
                        isInOrganization: false,
                        isPrivate: true,
                        name: "test-repo-1",
                        viewerCanAdminister: true,
                      }),
                      createMockRepository({
                        description: "Second test repo",
                        isInOrganization: true,
                        isPrivate: false,
                        name: "test-repo-2",
                        viewerCanAdminister: true,
                      }),
                    ],
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
      ],
    },
  },
  title: "Components/Dashboard/WithMSW",
};

type MSWStory = StoryObj<typeof DashboardWithMSW>;

// Example story using the MSW approach
export const WithMSW: MSWStory = {};
