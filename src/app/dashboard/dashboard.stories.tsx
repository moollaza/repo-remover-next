import type { Meta, StoryObj } from "@storybook/react";

import { http, HttpResponse } from "msw";

import { AuthenticatedUserDecorator, PageDecorator } from "@/../.storybook/decorators";
import { MOCK_ORGANIZATIONS, MOCK_REPOS, MOCK_USER } from "@/mocks/static-fixtures";

import DashboardPage from "./page";

const meta: Meta<typeof DashboardPage> = {
  component: DashboardPage,
  decorators: [AuthenticatedUserDecorator, PageDecorator],
  parameters: {
    chromatic: {
      modes: {
        dark: {
          theme: "dark",
        },
        light: {
          theme: "light",
        },
      },
    },
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
  },
  title: "Pages/Dashboard",
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock GraphQL queries for user, repos, and organizations
        http.post("https://api.github.com/graphql", async ({ request }) => {
          const body = (await request.json()) as { query: string };

          if (body.query.includes("getCurrentUser")) {
            return HttpResponse.json({
              data: {
                viewer: MOCK_USER,
              },
            });
          }

          if (body.query.includes("getRepositories")) {
            const personalRepos = MOCK_REPOS.filter((repo) => repo.ownerType === "current-user");
            return HttpResponse.json({
              data: {
                user: {
                  ...MOCK_USER,
                  repositories: {
                    nodes: personalRepos,
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
            const orgRepos = MOCK_REPOS.filter((repo) => repo.ownerType === "organization");
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
      ],
    },
  },
};